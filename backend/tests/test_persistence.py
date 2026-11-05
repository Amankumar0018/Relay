import uuid
from datetime import datetime, timezone, timedelta
from concurrent.futures import ThreadPoolExecutor
import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker
from unittest.mock import patch

from tests.conftest import TestingSessionLocal
from app.core.database import Base

from app.models.document import Document
from app.models.knowledge import (
    DocumentSegment,
    ExtractedEntity,
    EntityMention,
    ExtractedFact,
    FactCitation,
    EntityRelationship,
    FactVerificationLog,
    ExtractionRun,
)
from app.schemas.knowledge import (
    EntityCategory,
    FactCategory,
    RelationType,
    FactVerificationStatus,
    VerificationAction,
)
from app.schemas.extraction import (
    DocumentExtractionPayload,
    RawEntityExtraction,
    RawEntityMention,
    RawFactExtraction,
    RawRelationshipExtraction,
    RawCitationReference,
)
from app.services.intelligence_service import (
    KnowledgePersistenceService,
    PersistenceError,
    DocumentNotFoundError,
    ConcurrentExtractionError,
    normalize_entity_name,
    sanitize_error_message,
)
from app.services.grounding import EvidenceGroundingService


@pytest.fixture
def persistence_service():
    return KnowledgePersistenceService()


def _create_test_document(db: Session, text: str, filename: str = "test.txt") -> Document:
    doc = Document(
        id=str(uuid.uuid4()),
        original_filename=filename,
        stored_filename=f"{uuid.uuid4()}_{filename}",
        file_extension="txt",
        content_type="text/plain",
        file_size=len(text.encode("utf-8")),
        sha256_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        storage_path=f"/tmp/{filename}",
        extracted_text=text,
        character_count=len(text),
        word_count=len(text.split()),
        extraction_status="completed",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def _create_test_segment(
    db: Session,
    doc_id: str,
    content: str,
    seq: int = 0,
    char_offset_start: int = 0,
    source_label: str = "Page 1, Paragraph 1",
) -> DocumentSegment:
    seg = DocumentSegment(
        id=str(uuid.uuid4()),
        document_id=doc_id,
        sequence_number=seq,
        segment_type="paragraph",
        source_label=source_label,
        content=content,
        char_offset_start=char_offset_start,
        char_offset_end=char_offset_start + len(content),
    )
    db.add(seg)
    db.commit()
    db.refresh(seg)
    return seg


# =============================================================================
# 1. Entity Normalization & Conservative Matching Tests
# =============================================================================

def test_normalize_entity_name():
    # Person honorifics and credentials stripped, but generational suffixes strictly preserved
    assert normalize_entity_name("Dr. Aris Thorne", "person") == "aris thorne"
    assert normalize_entity_name("Aris Thorne, Ph.D.", "person") == "aris thorne"
    assert normalize_entity_name("Prof. Sarah Chen, MD", "person") == "sarah chen"
    assert normalize_entity_name("Mr. John Doe Jr.", "person") == "john doe jr"
    assert normalize_entity_name("Robert Smith Jr.", "person") == "robert smith jr"
    assert normalize_entity_name("Robert Smith Senior", "person") == "robert smith sr"
    assert normalize_entity_name("Dr. Robert Smith Jr., Ph.D.", "person") == "robert smith jr"
    assert normalize_entity_name("Robert Smith Senior, MD", "person") == "robert smith sr"
    assert normalize_entity_name("John Doe II", "person") == "john doe ii"
    assert normalize_entity_name("John Doe III", "person") == "john doe iii"

    # Roles and organizations retain descriptive words
    assert normalize_entity_name("Director of Security", "role") == "director of security"
    assert normalize_entity_name("VP of Engineering", "role") == "vp of engineering"
    assert normalize_entity_name("Vendor Corp, Inc.", "vendor") == "vendor corp inc"
    assert normalize_entity_name("Project Titan", "project") == "project titan"


def test_person_name_normalization_preserves_jr_sr_distinct(db_session: Session, persistence_service):
    # Proves Robert Smith Jr. and Robert Smith Senior cannot be merged
    raw_jr = RawEntityExtraction(
        name="Dr. Robert Smith Jr., Ph.D.",
        category=EntityCategory.PERSON,
        description="Son / junior partner",
    )
    raw_sr = RawEntityExtraction(
        name="Robert Smith Senior, MD",
        category=EntityCategory.PERSON,
        description="Father / senior partner",
    )
    resolved, _, _ = persistence_service.resolve_entities(db_session, [raw_jr, raw_sr])
    assert len(resolved) == 2
    assert resolved[0].id != resolved[1].id
    assert resolved[0].canonical_name == "robert smith jr"
    assert resolved[1].canonical_name == "robert smith sr"

    # Assert database contains 2 distinct entities
    ents = db_session.query(ExtractedEntity).filter(
        ExtractedEntity.canonical_name.in_(["robert smith jr", "robert smith sr"])
    ).all()
    assert len(ents) == 2


def test_entity_resolution_exact_match(db_session: Session, persistence_service):
    text = "Dr. Aris Thorne discussed Project Titan."
    doc = _create_test_document(db_session, text)

    # Initial entity in DB
    existing = ExtractedEntity(
        id=str(uuid.uuid4()),
        name="Aris Thorne",
        canonical_name="aris thorne",
        category="person",
        description="Lead researcher",
    )
    db_session.add(existing)
    db_session.commit()

    raw_ent = RawEntityExtraction(
        name="Dr. Aris Thorne",
        category=EntityCategory.PERSON,
        description="Senior leader",
    )

    resolved, _, _ = persistence_service.resolve_entities(db_session, [raw_ent])
    assert len(resolved) == 1
    assert resolved[0].id == existing.id
    assert resolved[0].canonical_name == "aris thorne"
    # Ensure no duplicate entity was created in DB
    assert db_session.query(ExtractedEntity).filter(ExtractedEntity.canonical_name == "aris thorne").count() == 1


def test_entity_resolution_category_isolation(db_session: Session, persistence_service):
    # Two entities with identical names but different categories must remain distinct
    text = "The Security Director approved the Security Director role specification."
    doc = _create_test_document(db_session, text)

    raw_role = RawEntityExtraction(
        name="Security Director",
        category=EntityCategory.ROLE,
        description="Leadership role",
    )
    raw_person = RawEntityExtraction(
        name="Security Director",
        category=EntityCategory.PERSON,
        description="Person holding title",
    )

    resolved, _, _ = persistence_service.resolve_entities(db_session, [raw_role, raw_person])
    assert len(resolved) == 2
    assert resolved[0].id != resolved[1].id
    assert resolved[0].category != resolved[1].category
    assert db_session.query(ExtractedEntity).count() == 2


def test_entity_resolution_conservative_no_fuzzy_merge(db_session: Session, persistence_service):
    # 'Aman' and 'Aman Kumar' must NOT be merged
    ent1 = RawEntityExtraction(name="Aman", category=EntityCategory.PERSON)
    ent2 = RawEntityExtraction(name="Aman Kumar", category=EntityCategory.PERSON)

    resolved, _, _ = persistence_service.resolve_entities(db_session, [ent1, ent2])
    assert len(resolved) == 2
    assert resolved[0].id != resolved[1].id
    assert {e.canonical_name for e in resolved} == {"aman", "aman kumar"}


# =============================================================================
# 2. Entity Mention Persistence & Offset Tests
# =============================================================================

def test_entity_mention_surface_forms_and_offsets(db_session: Session, persistence_service):
    text = "Executive handover: Dr. Aris Thorne is handing over Project Titan to Aris."
    doc = _create_test_document(db_session, text)
    seg = _create_test_segment(db_session, doc.id, text, seq=0, char_offset_start=100)

    raw_ent = RawEntityExtraction(
        name="Dr. Aris Thorne",
        category=EntityCategory.PERSON,
        mentions=[
            RawEntityMention(
                segment_id=seg.id,
                surface_text="Dr. Aris Thorne",
            ),
            RawEntityMention(
                segment_id=seg.id,
                surface_text="Aris",
                context="handing over Project Titan to Aris",
            ),
        ],
    )

    payload = DocumentExtractionPayload(entities=[raw_ent])
    res = persistence_service.persist_extraction(db_session, doc.id, payload)
    assert res.mentions_count == 2

    mentions = db_session.query(EntityMention).filter(EntityMention.document_id == doc.id).all()
    assert len(mentions) == 2

    m1 = next(m for m in mentions if m.surface_text == "Dr. Aris Thorne")
    assert m1.char_offset_start == 100 + text.find("Dr. Aris Thorne")
    assert m1.char_offset_end == m1.char_offset_start + len("Dr. Aris Thorne")
    assert m1.resolution_status == "resolved"

    m2 = next(m for m in mentions if m.surface_text == "Aris")
    assert m2.char_offset_start == 100 + text.rfind("Aris")
    assert m2.resolution_status == "ambiguous"  # surface form 'Aris' differs from canonical 'aris thorne'


def test_entity_mention_foreign_segment_rejected(db_session: Session, persistence_service):
    doc1 = _create_test_document(db_session, "Doc 1 text", "doc1.txt")
    doc2 = _create_test_document(db_session, "Doc 2 text", "doc2.txt")
    seg_doc2 = _create_test_segment(db_session, doc2.id, "Dr. Aris Thorne is present.")

    raw_ent = RawEntityExtraction(
        name="Dr. Aris Thorne",
        category=EntityCategory.PERSON,
        mentions=[
            RawEntityMention(
                segment_id=seg_doc2.id,  # Foreign segment belonging to doc2!
                surface_text="Dr. Aris Thorne",
            )
        ],
    )

    # Ingesting for doc1 pointing to doc2's segment
    payload = DocumentExtractionPayload(entities=[raw_ent])
    res = persistence_service.persist_extraction(db_session, doc1.id, payload)
    # Mention must be skipped/rejected
    assert res.mentions_count == 0
    assert db_session.query(EntityMention).filter(EntityMention.document_id == doc1.id).count() == 0


# =============================================================================
# 3. Relationship Persistence & Directionality Tests
# =============================================================================

def test_relationship_direction_preserved(db_session: Session, persistence_service):
    text = "Dr. Aris Thorne transfers Titan to Sarah Chen."
    doc = _create_test_document(db_session, text)
    seg = _create_test_segment(db_session, doc.id, text)

    e1 = RawEntityExtraction(name="Dr. Aris Thorne", category=EntityCategory.PERSON)
    e2 = RawEntityExtraction(name="Sarah Chen", category=EntityCategory.PERSON)

    # Relationship Thorne -> Chen (TRANSFERS_TO)
    r1 = RawRelationshipExtraction(
        source_entity_name="Dr. Aris Thorne",
        target_entity_name="Sarah Chen",
        relation_type=RelationType.TRANSFERS_TO,
    )

    payload = DocumentExtractionPayload(entities=[e1, e2], relationships=[r1])
    res = persistence_service.persist_extraction(db_session, doc.id, payload)
    assert res.relationships_count == 1

    rel = db_session.query(EntityRelationship).filter(EntityRelationship.document_id == doc.id).first()
    assert rel is not None
    assert rel.relation_type == "TRANSFERS_TO"

    ent_thorne = db_session.query(ExtractedEntity).filter(ExtractedEntity.canonical_name == "aris thorne").first()
    ent_chen = db_session.query(ExtractedEntity).filter(ExtractedEntity.canonical_name == "sarah chen").first()
    assert rel.source_entity_id == ent_thorne.id
    assert rel.target_entity_id == ent_chen.id


def test_relationship_duplicate_prevention_and_inverse_distinct(db_session: Session, persistence_service):
    text = "Reciprocal reporting between Sarah Chen and Aris Thorne."
    doc = _create_test_document(db_session, text)

    e1 = RawEntityExtraction(name="Aris Thorne", category=EntityCategory.PERSON)
    e2 = RawEntityExtraction(name="Sarah Chen", category=EntityCategory.PERSON)

    r_forward = RawRelationshipExtraction(
        source_entity_name="Aris Thorne",
        target_entity_name="Sarah Chen",
        relation_type=RelationType.REPORTS_TO,
    )
    r_forward_dup = RawRelationshipExtraction(
        source_entity_name="Aris Thorne",
        target_entity_name="Sarah Chen",
        relation_type=RelationType.REPORTS_TO,
    )
    r_inverse = RawRelationshipExtraction(
        source_entity_name="Sarah Chen",
        target_entity_name="Aris Thorne",
        relation_type=RelationType.REPORTS_TO,
    )

    payload = DocumentExtractionPayload(
        entities=[e1, e2],
        relationships=[r_forward, r_forward_dup, r_inverse],
    )
    res = persistence_service.persist_extraction(db_session, doc.id, payload)
    # Forward duplicate ignored; inverse retained as distinct
    assert res.relationships_count == 2
    assert db_session.query(EntityRelationship).filter(EntityRelationship.document_id == doc.id).count() == 2


def test_relationship_with_invalid_endpoint_skipped(db_session: Session, persistence_service):
    text = "Aris Thorne works alone."
    doc = _create_test_document(db_session, text)

    e1 = RawEntityExtraction(name="Aris Thorne", category=EntityCategory.PERSON)
    r_invalid = RawRelationshipExtraction(
        source_entity_name="Aris Thorne",
        target_entity_name="Ghost Entity Not Extracted",
        relation_type=RelationType.OWNS,
    )

    payload = DocumentExtractionPayload(entities=[e1], relationships=[r_invalid])
    res = persistence_service.persist_extraction(db_session, doc.id, payload)
    assert res.relationships_count == 0


# =============================================================================
# 4. Fact & Citation Grounding and Persistence Tests
# =============================================================================

def test_fact_and_citation_verified_persistence(db_session: Session, persistence_service):
    text = "The board formally decided to renew the cloud infrastructure contract for 12 months."
    doc = _create_test_document(db_session, text)
    seg = _create_test_segment(db_session, doc.id, text, seq=0)

    raw_fact = RawFactExtraction(
        category=FactCategory.DECISION,
        statement="Cloud infrastructure contract renewed for 12 months.",
        citations=[
            RawCitationReference(
                segment_id=seg.id,
                quote="renew the cloud infrastructure contract for 12 months",
            )
        ],
    )

    payload = DocumentExtractionPayload(facts=[raw_fact])
    res = persistence_service.persist_extraction(db_session, doc.id, payload)
    assert res.facts_count == 1
    assert res.citations_verified == 1
    assert res.citations_rejected == 0

    fact = db_session.query(ExtractedFact).filter(ExtractedFact.document_id == doc.id).first()
    assert fact is not None
    assert fact.verification_status == "evidence-backed"

    # Citation record verification
    citations = db_session.query(FactCitation).filter(FactCitation.fact_id == fact.id).all()
    assert len(citations) == 1
    cit = citations[0]
    assert cit.verification_status == "valid"
    assert cit.rejection_reason is None
    assert cit.char_start is not None
    assert cit.char_end is not None
    assert cit.char_end > cit.char_start
    assert seg.content[cit.char_start:cit.char_end] == cit.verbatim_quote

    # FactVerificationLog verification
    logs = db_session.query(FactVerificationLog).filter(FactVerificationLog.fact_id == fact.id).all()
    assert len(logs) == 1
    assert logs[0].new_status == "evidence-backed"
    assert logs[0].reviewer_id == "system:grounding_engine"


def test_fact_inferred_cannot_be_evidence_backed(db_session: Session, persistence_service):
    text = "Upcoming departures were discussed in confidence."
    doc = _create_test_document(db_session, text)
    seg = _create_test_segment(db_session, doc.id, text)

    raw_fact = RawFactExtraction(
        category=FactCategory.RISK,
        statement="Leadership departures may cause transitional delay.",
        is_inference=True,
        citations=[
            RawCitationReference(
                segment_id=seg.id,
                quote="Upcoming departures were discussed in confidence",
            )
        ],
    )

    payload = DocumentExtractionPayload(facts=[raw_fact])
    res = persistence_service.persist_extraction(db_session, doc.id, payload)
    assert res.facts_count == 1

    fact = db_session.query(ExtractedFact).filter(ExtractedFact.document_id == doc.id).first()
    assert fact.verification_status == "inferred"
    assert fact.verification_status != "evidence-backed"


def test_fact_unsupported_rejected(db_session: Session, persistence_service):
    text = "Normal operational memo."
    doc = _create_test_document(db_session, text)
    seg = _create_test_segment(db_session, doc.id, text, source_label="Page 1, Paragraph 1")

    raw_fact = RawFactExtraction(
        category=FactCategory.COMMITMENT,
        statement="Fabricated commitment without source quote.",
        is_inference=False,
        citations=[
            RawCitationReference(
                segment_id=seg.id,
                quote="This quote does not exist anywhere in the text",
            )
        ],
    )

    payload = DocumentExtractionPayload(facts=[raw_fact])
    res = persistence_service.persist_extraction(db_session, doc.id, payload)
    assert res.facts_count == 1
    assert res.citations_verified == 0
    assert res.citations_rejected == 1

    fact = db_session.query(ExtractedFact).filter(ExtractedFact.document_id == doc.id).first()
    assert fact.verification_status == "rejected"

    # Verify rejected citation is preserved with explicit columns without overloading source_location
    citations = db_session.query(FactCitation).filter(FactCitation.fact_id == fact.id).all()
    assert len(citations) == 1
    cit = citations[0]
    assert cit.verification_status == "rejected"
    assert cit.rejection_reason == "Quote not found in segment content"
    assert cit.source_location == "Page 1, Paragraph 1"
    assert "REJECTED:" not in cit.source_location
    assert cit.char_start is None
    assert cit.char_end is None


# =============================================================================
# 5. Re-Extraction Idempotency & Historical Preservation Tests
# =============================================================================

def test_reextraction_preserves_human_verified_facts(db_session: Session, persistence_service):
    text = "Budget approved for Project Titan."
    doc = _create_test_document(db_session, text)
    seg = _create_test_segment(db_session, doc.id, text)

    # Initial extraction
    raw_fact = RawFactExtraction(
        category=FactCategory.DECISION,
        statement="Budget approved for Project Titan.",
        citations=[RawCitationReference(segment_id=seg.id, quote="Budget approved for Project Titan.")],
    )
    payload = DocumentExtractionPayload(facts=[raw_fact])
    persistence_service.persist_extraction(db_session, doc.id, payload)

    fact = db_session.query(ExtractedFact).filter(ExtractedFact.document_id == doc.id).first()
    assert fact.verification_status == "evidence-backed"

    # Human auditor verifies fact
    fact.verification_status = FactVerificationStatus.HUMAN_VERIFIED.value
    audit_log = FactVerificationLog(
        id=str(uuid.uuid4()),
        fact_id=fact.id,
        action=VerificationAction.VERIFIED.value,
        previous_status=FactVerificationStatus.EVIDENCE_BACKED.value,
        new_status=FactVerificationStatus.HUMAN_VERIFIED.value,
        reviewer_id="human_auditor_42",
        notes="Reviewed and approved by auditor.",
    )
    db_session.add(audit_log)
    db_session.commit()

    # Re-extract document
    res_retry = persistence_service.persist_extraction(db_session, doc.id, payload)
    assert res_retry.status == "completed"

    fact_after = db_session.query(ExtractedFact).filter(ExtractedFact.id == fact.id).first()
    # MUST NOT be overwritten back to evidence-backed!
    assert fact_after.verification_status == "human-verified"

    # Previous audit logs preserved
    logs = db_session.query(FactVerificationLog).filter(FactVerificationLog.fact_id == fact.id).all()
    assert len(logs) == 2
    assert any(l.reviewer_id == "human_auditor_42" for l in logs)


def test_reextraction_idempotency_no_duplicate_records(db_session: Session, persistence_service):
    text = "Sarah Chen owns Project Titan."
    doc = _create_test_document(db_session, text)
    seg = _create_test_segment(db_session, doc.id, text)

    e1 = RawEntityExtraction(
        name="Sarah Chen",
        category=EntityCategory.PERSON,
        mentions=[RawEntityMention(segment_id=seg.id, surface_text="Sarah Chen")],
    )
    e2 = RawEntityExtraction(name="Project Titan", category=EntityCategory.PROJECT)
    r1 = RawRelationshipExtraction(
        source_entity_name="Sarah Chen",
        target_entity_name="Project Titan",
        relation_type=RelationType.OWNS,
    )
    f1 = RawFactExtraction(
        category=FactCategory.RESPONSIBILITY,
        statement="Sarah Chen owns Project Titan.",
        citations=[RawCitationReference(segment_id=seg.id, quote="Sarah Chen owns Project Titan.")],
    )

    payload = DocumentExtractionPayload(
        entities=[e1, e2],
        relationships=[r1],
        facts=[f1],
    )

    # Run 1
    res1 = persistence_service.persist_extraction(db_session, doc.id, payload)
    assert res1.status == "completed"
    entities_count_1 = db_session.query(ExtractedEntity).count()
    mentions_count_1 = db_session.query(EntityMention).count()
    facts_count_1 = db_session.query(ExtractedFact).count()
    rels_count_1 = db_session.query(EntityRelationship).count()

    # Run 2 (retry identical payload)
    res2 = persistence_service.persist_extraction(db_session, doc.id, payload)
    assert res2.status == "completed"

    # Zero duplicate records created
    assert db_session.query(ExtractedEntity).count() == entities_count_1
    assert db_session.query(EntityMention).count() == mentions_count_1
    assert db_session.query(ExtractedFact).count() == facts_count_1
    assert db_session.query(EntityRelationship).count() == rels_count_1


def test_historical_fact_assertion_preservation_on_changed_statement(db_session: Session, persistence_service):
    """
    Verifies that re-extracting a document with an altered statement preserves
    historical fact assertions, citations, and verification logs, while identical
    reruns remain strictly idempotent.
    """
    text_v1 = "The vendor contract has been renewed for 12 months."
    text_v2 = "Amendment: The vendor contract has been extended to 24 months."
    full_text = f"{text_v1}\n{text_v2}"
    doc = _create_test_document(db_session, full_text)
    seg1 = _create_test_segment(db_session, doc.id, text_v1, seq=0, char_offset_start=0)
    seg2 = _create_test_segment(db_session, doc.id, text_v2, seq=1, char_offset_start=len(text_v1) + 1)

    # Initial extraction (Run 1): Fact statement v1
    fact_v1 = RawFactExtraction(
        category=FactCategory.DECISION,
        statement="Vendor contract renewed for 12 months.",
        citations=[RawCitationReference(segment_id=seg1.id, quote="renewed for 12 months")],
    )
    payload_1 = DocumentExtractionPayload(facts=[fact_v1])
    res1 = persistence_service.persist_extraction(db_session, doc.id, payload_1)
    assert res1.status == "completed"
    assert res1.facts_count == 1

    facts_run1 = db_session.query(ExtractedFact).filter(ExtractedFact.document_id == doc.id).all()
    assert len(facts_run1) == 1
    fact1_id = facts_run1[0].id
    assert facts_run1[0].statement == "Vendor contract renewed for 12 months."
    assert facts_run1[0].verification_status == "evidence-backed"

    # Idempotent retry: Re-extract with exact same payload
    res1_retry = persistence_service.persist_extraction(db_session, doc.id, payload_1)
    assert res1_retry.status == "completed"
    facts_retry = db_session.query(ExtractedFact).filter(ExtractedFact.document_id == doc.id).all()
    assert len(facts_retry) == 1  # No duplicate created
    assert facts_retry[0].id == fact1_id

    # Second extraction (Run 2): Fact statement changed to v2
    fact_v2 = RawFactExtraction(
        category=FactCategory.DECISION,
        statement="Vendor contract renewed for 24 months.",
        citations=[RawCitationReference(segment_id=seg2.id, quote="extended to 24 months")],
    )
    payload_2 = DocumentExtractionPayload(facts=[fact_v2])
    res2 = persistence_service.persist_extraction(db_session, doc.id, payload_2)
    assert res2.status == "completed"

    # Both facts must now exist in the database!
    all_facts = (
        db_session.query(ExtractedFact)
        .filter(ExtractedFact.document_id == doc.id)
        .order_by(ExtractedFact.created_at.asc())
        .all()
    )
    assert len(all_facts) == 2
    assert all_facts[0].id == fact1_id
    assert all_facts[0].statement == "Vendor contract renewed for 12 months."
    assert all_facts[1].statement == "Vendor contract renewed for 24 months."
    assert all_facts[0].verification_status == "evidence-backed"
    assert all_facts[1].verification_status == "evidence-backed"

    # Both facts have distinct, preserved citations and verification logs
    citations_v1 = db_session.query(FactCitation).filter(FactCitation.fact_id == all_facts[0].id).all()
    citations_v2 = db_session.query(FactCitation).filter(FactCitation.fact_id == all_facts[1].id).all()
    assert len(citations_v1) == 1
    assert len(citations_v2) == 1
    assert citations_v1[0].document_segment_id == seg1.id
    assert citations_v2[0].document_segment_id == seg2.id

    logs_v1 = db_session.query(FactVerificationLog).filter(FactVerificationLog.fact_id == all_facts[0].id).all()
    logs_v2 = db_session.query(FactVerificationLog).filter(FactVerificationLog.fact_id == all_facts[1].id).all()
    assert len(logs_v1) >= 1
    assert len(logs_v2) >= 1


# =============================================================================
# 6. Transaction Rollback & Concurrency Tests
# =============================================================================

def test_transaction_rollback_leaves_no_partial_records(db_session: Session, persistence_service):
    text = "Valid text for rollback testing."
    doc = _create_test_document(db_session, text)
    seg = _create_test_segment(db_session, doc.id, text)

    payload = DocumentExtractionPayload(
        entities=[RawEntityExtraction(name="Test Entity", category=EntityCategory.PERSON)],
        facts=[RawFactExtraction(category=FactCategory.DECISION, statement="Decision statement")],
    )

    # Force a failure inside persist_relationships
    with patch.object(persistence_service, "persist_relationships", side_effect=RuntimeError("Simulated database failure")):
        with pytest.raises(PersistenceError) as exc_info:
            persistence_service.persist_extraction(db_session, doc.id, payload)

    assert "Simulated database failure" in str(exc_info.value)

    # Verify atomic rollback: no partial entities or facts remain
    assert db_session.query(ExtractedEntity).filter(ExtractedEntity.name == "Test Entity").count() == 0
    assert db_session.query(ExtractedFact).filter(ExtractedFact.statement == "Decision statement").count() == 0

    # Verify ExtractionRun status recorded as failed in isolated transaction
    run = db_session.query(ExtractionRun).filter(ExtractionRun.document_id == doc.id).first()
    assert run is not None
    assert run.status == "failed"
    assert run.error_stage == "relationship_persistence"
    assert "Simulated database failure" in run.error_message


def test_concurrent_extraction_rejection(db_session: Session, persistence_service):
    text = "Document for concurrency check."
    doc = _create_test_document(db_session, text)

    # Simulate an active running run started 30 seconds ago
    active_run = ExtractionRun(
        id=str(uuid.uuid4()),
        document_id=doc.id,
        provider_name="gemini",
        model_name="gemini-3.5-flash",
        prompt_version="v1",
        prompt_hash="hash1",
        status="running",
        started_at=datetime.now(timezone.utc) - timedelta(seconds=30),
    )
    db_session.add(active_run)
    db_session.commit()

    payload = DocumentExtractionPayload()
    # Concurrent attempt within lease window must be rejected
    with pytest.raises(ConcurrentExtractionError) as exc:
        persistence_service.persist_extraction(db_session, doc.id, payload)

    assert "Extraction already running" in str(exc.value)


def test_stale_extraction_lease_overridden(db_session: Session, persistence_service):
    text = "Document for expired lease check."
    doc = _create_test_document(db_session, text)

    # Simulate an abandoned run from 10 minutes ago (> 300s lease)
    stale_run = ExtractionRun(
        id=str(uuid.uuid4()),
        document_id=doc.id,
        provider_name="gemini",
        model_name="gemini-3.5-flash",
        prompt_version="v1",
        prompt_hash="hash1",
        status="running",
        started_at=datetime.now(timezone.utc) - timedelta(seconds=600),
    )
    db_session.add(stale_run)
    db_session.commit()

    payload = DocumentExtractionPayload()
    # Must succeed by overriding stale lease
    res = persistence_service.persist_extraction(db_session, doc.id, payload, lease_seconds=300)
    assert res.status == "completed"

    # Stale run marked as failed
    db_session.refresh(stale_run)
    assert stale_run.status == "failed"
    assert stale_run.error_stage == "lease_expired"


def test_concurrent_extraction_race_condition_prevented(tmp_path, persistence_service):
    """
    Demonstrates that two simultaneous threads attempting to acquire the extraction lease
    on the exact same document cannot both succeed; one acquires the lease while the other
    is strictly rejected by the database-level partial unique index constraint in our actual
    file-backed SQLite deployment architecture.
    """
    db_file = tmp_path / "concurrent_test.db"
    file_engine = create_engine(
        f"sqlite:///{db_file}",
        connect_args={"check_same_thread": False, "timeout": 15},
    )
    with file_engine.connect() as conn:
        conn.execute(text("PRAGMA journal_mode=WAL"))
        conn.execute(text("PRAGMA foreign_keys=ON"))

    Base.metadata.create_all(bind=file_engine)
    FileSessionFactory = sessionmaker(bind=file_engine)

    # Setup document using initial session
    init_session = FileSessionFactory()
    doc = _create_test_document(init_session, "Text for concurrent lease race condition testing.")
    doc_id = doc.id
    init_session.close()

    successes = []
    failures = []

    def attempt_acquire(worker_id: int):
        thread_session = FileSessionFactory()
        try:
            run = persistence_service.acquire_extraction_lock(
                db=thread_session,
                document_id=doc_id,
                provider_name="gemini",
                model_name="gemini-3.5-flash",
                prompt_version="v1",
                prompt_hash=f"hash_{worker_id}",
            )
            successes.append((worker_id, run.id))
        except ConcurrentExtractionError as exc:
            failures.append((worker_id, str(exc)))
        except Exception as exc:
            failures.append((worker_id, f"UNEXPECTED: {type(exc).__name__}: {exc}"))
        finally:
            thread_session.close()

    # Execute two simultaneous threads
    with ThreadPoolExecutor(max_workers=2) as executor:
        f1 = executor.submit(attempt_acquire, 1)
        f2 = executor.submit(attempt_acquire, 2)
        f1.result()
        f2.result()

    # Exactly one thread succeeds, and the other is rejected
    assert len(successes) == 1, f"Expected exactly 1 success, got {len(successes)}: {successes}. Failures: {failures}"
    assert len(failures) == 1, f"Expected exactly 1 failure, got {len(failures)}: {failures}"
    assert (
        "Concurrent extraction race prevented" in failures[0][1]
        or "already running" in failures[0][1]
    )

    # Verify that in the database, exactly one running run exists for doc_id
    verify_session = FileSessionFactory()
    try:
        running_runs = (
            verify_session.query(ExtractionRun)
            .filter(ExtractionRun.document_id == doc_id, ExtractionRun.status == "running")
            .all()
        )
        assert len(running_runs) == 1
        assert running_runs[0].id == successes[0][1]
    finally:
        verify_session.close()
        file_engine.dispose()


def test_database_level_unique_running_run_constraint_enforced():
    """
    Demonstrates that the database engine enforces uniqueness of running runs per document
    via the partial unique index uq_extraction_runs_running_doc.
    """
    session = TestingSessionLocal()
    try:
        doc = _create_test_document(session, "Constraint test text")
        run1 = ExtractionRun(
            id=str(uuid.uuid4()),
            document_id=doc.id,
            provider_name="gemini",
            model_name="gemini-3.5-flash",
            prompt_version="v1",
            prompt_hash="h1",
            status="running",
        )
        session.add(run1)
        session.commit()

        run2 = ExtractionRun(
            id=str(uuid.uuid4()),
            document_id=doc.id,
            provider_name="gemini",
            model_name="gemini-3.5-flash",
            prompt_version="v1",
            prompt_hash="h2",
            status="running",
        )
        session.add(run2)
        with pytest.raises(Exception) as exc_info:
            session.commit()
        # Verify SQLite IntegrityError
        assert "UNIQUE constraint failed" in str(exc_info.value) or "IntegrityError" in type(exc_info.value).__name__
    finally:
        session.rollback()
        session.close()


# =============================================================================
# 7. Telemetry & Error Sanitization Tests
# =============================================================================

def test_sanitize_error_message():
    raw_err = "Request failed with AIzaSyD1234567890abcdefghijklmnopqrstuv and bearer eyJhbGciOiJIUzI1NiIsInR5cCI6"
    sanitized = sanitize_error_message(raw_err)
    assert "AIza" not in sanitized
    assert "[REDACTED_API_KEY]" in sanitized
    assert "[REDACTED_BEARER]" in sanitized


def test_extraction_run_telemetry_metrics(db_session: Session, persistence_service):
    text = "Telemetry verification document."
    doc = _create_test_document(db_session, text)
    seg = _create_test_segment(db_session, doc.id, text)

    raw_fact = RawFactExtraction(
        category=FactCategory.DECISION,
        statement="Telemetry verification statement.",
        citations=[RawCitationReference(segment_id=seg.id, quote="Telemetry verification document.")],
    )
    raw_ent = RawEntityExtraction(name="Telemetry Org", category=EntityCategory.ORGANIZATION)

    payload = DocumentExtractionPayload(facts=[raw_fact], entities=[raw_ent])
    res = persistence_service.persist_extraction(
        db_session,
        doc.id,
        payload,
        prompt_tokens=420,
        completion_tokens=85,
    )

    run = db_session.query(ExtractionRun).filter(ExtractionRun.id == res.run_id).first()
    assert run.status == "completed"
    assert run.facts_extracted == 1
    assert run.entities_extracted == 1
    assert run.citations_verified == 1
    assert run.citations_rejected == 0
    assert run.prompt_tokens == 420
    assert run.completion_tokens == 85
    assert run.execution_duration_ms is not None
    assert run.execution_duration_ms >= 0
