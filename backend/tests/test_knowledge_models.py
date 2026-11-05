import pytest
from datetime import datetime, timezone
import sqlalchemy as sa
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from pydantic import ValidationError

from app.models.document import Document
from app.models.knowledge import (
    DocumentSegment,
    ExtractedEntity,
    EntityMention,
    ExtractedFact,
    FactCitation,
    EntityRelationship,
    FactVerificationLog,
)
from app.schemas.knowledge import (
    SegmentType,
    EntityCategory,
    EntityResolutionStatus,
    FactCategory,
    FactVerificationStatus,
    RiskSeverity,
    RelationType,
    VerificationAction,
    FactCitationBase,
)


def create_sample_document(db: Session, filename: str = "handover_memo.pdf") -> Document:
    """Helper to create and persist a test document."""
    doc = Document(
        original_filename=filename,
        stored_filename=f"test_{filename}_{datetime.now(timezone.utc).timestamp()}",
        file_extension="pdf" if filename.endswith(".pdf") else "txt",
        content_type="application/pdf" if filename.endswith(".pdf") else "text/plain",
        file_size=1024,
        sha256_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        storage_path=f"data/uploads/{filename}",
        extracted_text="Executive handover memo. Dr. Aris Thorne is transferring project Titan to Sarah Chen.",
        character_count=85,
        word_count=13,
        extraction_status="completed",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def test_document_segment_creation_and_ordering(db_session: Session):
    """Verify document segment offsets, page numbering, and sequence ordering."""
    doc = create_sample_document(db_session)

    seg0 = DocumentSegment(
        document_id=doc.id,
        segment_type=SegmentType.PAGE.value,
        sequence_number=0,
        page_number=1,
        source_label="Page 1",
        content="Executive handover memo.",
        char_offset_start=0,
        char_offset_end=24,
    )
    seg1 = DocumentSegment(
        document_id=doc.id,
        segment_type=SegmentType.PARAGRAPH.value,
        sequence_number=1,
        page_number=1,
        source_label="Page 1, Paragraph 2",
        content="Dr. Aris Thorne is transferring project Titan to Sarah Chen.",
        char_offset_start=25,
        char_offset_end=85,
    )
    db_session.add_all([seg0, seg1])
    db_session.commit()

    # Query back via document relationship
    db_session.refresh(doc)
    assert len(doc.segments) == 2
    assert doc.segments[0].sequence_number == 0
    assert doc.segments[0].char_offset_start == 0
    assert doc.segments[0].char_offset_end == 24
    assert doc.segments[1].sequence_number == 1
    assert doc.segments[1].page_number == 1
    assert doc.segments[1].source_label == "Page 1, Paragraph 2"


def test_document_segment_sequence_uniqueness_constraint(db_session: Session):
    """Enforce that sequence_number must be unique within a single document."""
    doc = create_sample_document(db_session)

    seg_a = DocumentSegment(
        document_id=doc.id,
        segment_type=SegmentType.SECTION.value,
        sequence_number=0,
        content="Section A",
        char_offset_start=0,
        char_offset_end=9,
    )
    seg_b = DocumentSegment(
        document_id=doc.id,
        segment_type=SegmentType.SECTION.value,
        sequence_number=0,  # Duplicate sequence number in same document
        content="Section B",
        char_offset_start=10,
        char_offset_end=19,
    )

    db_session.add(seg_a)
    db_session.commit()

    with pytest.raises(IntegrityError):
        with db_session.begin_nested():
            db_session.add(seg_b)
            db_session.flush()


def test_unpaginated_document_segment(db_session: Session):
    """Verify DOCX/TXT segments retain source labels and null page numbers."""
    doc = create_sample_document(db_session, filename="notes.txt")

    seg = DocumentSegment(
        document_id=doc.id,
        segment_type=SegmentType.TEXT_BLOCK.value,
        sequence_number=0,
        page_number=None,  # Not paginated
        source_label="Block 1",
        content="Plain text handover notes without page pagination.",
        char_offset_start=0,
        char_offset_end=51,
    )
    db_session.add(seg)
    db_session.commit()
    db_session.refresh(seg)

    assert seg.page_number is None
    assert seg.source_label == "Block 1"
    assert seg.segment_type == "text_block"


def test_canonical_entity_cross_document_reusability(db_session: Session):
    """Verify that canonical entities can link to mentions across different documents."""
    doc1 = create_sample_document(db_session, filename="doc1.pdf")
    doc2 = create_sample_document(db_session, filename="doc2.pdf")

    # Single canonical person entity
    entity = ExtractedEntity(
        name="Dr. Aris Thorne",
        canonical_name="aris thorne",
        category=EntityCategory.PERSON.value,
        description="Lead Principal Investigator and Departing VP of Engineering",
    )
    db_session.add(entity)
    db_session.commit()
    db_session.refresh(entity)

    # Mention in Doc 1 (Full Name)
    mention1 = EntityMention(
        entity_id=entity.id,
        document_id=doc1.id,
        surface_text="Dr. Aris Thorne",
        char_offset_start=0,
        char_offset_end=15,
        confidence_score=0.98,
        resolution_status=EntityResolutionStatus.RESOLVED.value,
    )
    # Mention in Doc 2 (Alias/Short form)
    mention2 = EntityMention(
        entity_id=entity.id,
        document_id=doc2.id,
        surface_text="Aris",
        char_offset_start=12,
        char_offset_end=16,
        confidence_score=0.91,
        resolution_status=EntityResolutionStatus.RESOLVED.value,
    )

    db_session.add_all([mention1, mention2])
    db_session.commit()

    db_session.refresh(entity)
    assert len(entity.mentions) == 2
    surface_forms = {m.surface_text for m in entity.mentions}
    assert surface_forms == {"Dr. Aris Thorne", "Aris"}
    assert {m.document_id for m in entity.mentions} == {doc1.id, doc2.id}


def test_extracted_fact_with_citations_and_verification_log(db_session: Session):
    """Verify extracted facts, citations to document segments, and human verification audit logs."""
    doc = create_sample_document(db_session)

    seg = DocumentSegment(
        document_id=doc.id,
        segment_type=SegmentType.PARAGRAPH.value,
        sequence_number=0,
        page_number=2,
        source_label="Page 2, §3",
        content="All production cryptographic keys must be rotated before December 15, 2026.",
        char_offset_start=100,
        char_offset_end=176,
    )
    db_session.add(seg)
    db_session.commit()

    entity = ExtractedEntity(
        name="Security Operations",
        canonical_name="security operations",
        category=EntityCategory.ORGANIZATION.value,
    )
    db_session.add(entity)
    db_session.commit()

    # Fact: Deadline and responsibility
    fact = ExtractedFact(
        document_id=doc.id,
        primary_entity_id=entity.id,
        category=FactCategory.COMMITMENT.value,
        statement="Rotate all production cryptographic keys before December 15, 2026.",
        deadline=datetime(2026, 12, 15, 0, 0, tzinfo=timezone.utc),
        severity=RiskSeverity.HIGH.value,
        verification_status=FactVerificationStatus.EVIDENCE_BACKED.value,
        confidence_score=0.95,
    )
    db_session.add(fact)
    db_session.commit()
    db_session.refresh(fact)

    # Citation linking to segment with valid segment-relative offsets
    citation = FactCitation(
        fact_id=fact.id,
        document_segment_id=seg.id,
        verbatim_quote="All production cryptographic keys must be rotated before December 15, 2026.",
        source_location="Page 2, §3",
        char_start=0,
        char_end=76,
    )
    db_session.add(citation)
    db_session.commit()

    # Human Verification Log transition
    log = FactVerificationLog(
        fact_id=fact.id,
        action=VerificationAction.VERIFIED.value,
        previous_status=FactVerificationStatus.EVIDENCE_BACKED.value,
        new_status=FactVerificationStatus.HUMAN_VERIFIED.value,
        reviewer_id="auditor_01",
        notes="Confirmed with incoming SecOps lead during handover interview.",
    )
    fact.verification_status = FactVerificationStatus.HUMAN_VERIFIED.value
    fact.reviewer_notes = "Verified by auditor_01."
    db_session.add(log)
    db_session.commit()

    db_session.refresh(fact)
    assert fact.verification_status == "human-verified"
    assert len(fact.citations) == 1
    assert fact.citations[0].document_segment_id == seg.id
    assert len(fact.verification_logs) == 1
    assert fact.verification_logs[0].action == "verified"
    assert fact.verification_logs[0].reviewer_id == "auditor_01"


def test_entity_relationships_graph(db_session: Session):
    """Verify directed relationship edges between canonical entities."""
    doc = create_sample_document(db_session)

    aris = ExtractedEntity(
        name="Aris Thorne",
        canonical_name="aris thorne",
        category=EntityCategory.PERSON.value,
    )
    sarah = ExtractedEntity(
        name="Sarah Chen",
        canonical_name="sarah chen",
        category=EntityCategory.PERSON.value,
    )
    project_titan = ExtractedEntity(
        name="Project Titan",
        canonical_name="project titan",
        category=EntityCategory.PROJECT.value,
    )
    db_session.add_all([aris, sarah, project_titan])
    db_session.commit()

    # Aris TRANSFERS_TO Sarah
    rel_transfer = EntityRelationship(
        document_id=doc.id,
        source_entity_id=aris.id,
        target_entity_id=sarah.id,
        relation_type=RelationType.TRANSFERS_TO.value,
        confidence_score=0.99,
    )
    # Sarah OWNS Project Titan
    rel_owns = EntityRelationship(
        document_id=doc.id,
        source_entity_id=sarah.id,
        target_entity_id=project_titan.id,
        relation_type=RelationType.OWNS.value,
        confidence_score=0.95,
    )
    db_session.add_all([rel_transfer, rel_owns])
    db_session.commit()

    db_session.refresh(aris)
    db_session.refresh(sarah)

    assert len(aris.source_relationships) == 1
    assert aris.source_relationships[0].relation_type == "TRANSFERS_TO"
    assert aris.source_relationships[0].target_entity_id == sarah.id

    assert len(sarah.target_relationships) == 1
    assert sarah.target_relationships[0].source_entity_id == aris.id
    assert len(sarah.source_relationships) == 1
    assert sarah.source_relationships[0].target_entity_id == project_titan.id


def test_cascade_delete_document_removes_knowledge(db_session: Session):
    """Deleting a document must cascade and delete its segments, mentions, facts, citations, and logs."""
    doc = create_sample_document(db_session)

    seg = DocumentSegment(
        document_id=doc.id,
        segment_type=SegmentType.PAGE.value,
        sequence_number=0,
        content="Test content for cascade delete",
        char_offset_start=0,
        char_offset_end=31,
    )
    entity = ExtractedEntity(
        name="Vendor Corp",
        canonical_name="vendor corp",
        category=EntityCategory.VENDOR.value,
    )
    db_session.add_all([seg, entity])
    db_session.commit()

    mention = EntityMention(
        entity_id=entity.id,
        document_id=doc.id,
        segment_id=seg.id,
        surface_text="Vendor Corp",
        char_offset_start=0,
        char_offset_end=11,
    )
    fact = ExtractedFact(
        document_id=doc.id,
        primary_entity_id=entity.id,
        category=FactCategory.DECISION.value,
        statement="Renew vendor contract by Q3.",
    )
    db_session.add_all([mention, fact])
    db_session.commit()

    citation = FactCitation(
        fact_id=fact.id,
        document_segment_id=seg.id,
        verbatim_quote="Renew vendor contract by Q3.",
        char_start=0,
        char_end=28,
    )
    log = FactVerificationLog(
        fact_id=fact.id,
        action=VerificationAction.VERIFIED.value,
        previous_status=FactVerificationStatus.EVIDENCE_BACKED.value,
        new_status=FactVerificationStatus.HUMAN_VERIFIED.value,
    )
    rel = EntityRelationship(
        document_id=doc.id,
        source_entity_id=entity.id,
        target_entity_id=entity.id,
        relation_type=RelationType.OWNS.value,
    )
    db_session.add_all([citation, log, rel])
    db_session.commit()

    # Capture IDs
    seg_id = seg.id
    mention_id = mention.id
    fact_id = fact.id
    citation_id = citation.id
    log_id = log.id
    rel_id = rel.id
    entity_id = entity.id

    # Delete Document
    db_session.delete(doc)
    db_session.commit()

    # Verify all document-dependent records were deleted
    assert db_session.get(DocumentSegment, seg_id) is None
    assert db_session.get(EntityMention, mention_id) is None
    assert db_session.get(ExtractedFact, fact_id) is None
    assert db_session.get(FactCitation, citation_id) is None
    assert db_session.get(FactVerificationLog, log_id) is None
    assert db_session.get(EntityRelationship, rel_id) is None

    # Canonical entity itself MUST persist across document deletions!
    preserved_entity = db_session.get(ExtractedEntity, entity_id)
    assert preserved_entity is not None
    assert preserved_entity.name == "Vendor Corp"


def test_entity_deletion_nullifies_fact_primary_entity(db_session: Session):
    """Deleting an entity nullifies primary_entity_id on facts rather than deleting historical facts."""
    doc = create_sample_document(db_session)
    entity = ExtractedEntity(
        name="Ephemeral Initiative",
        canonical_name="ephemeral initiative",
        category=EntityCategory.INITIATIVE.value,
    )
    db_session.add(entity)
    db_session.commit()

    fact = ExtractedFact(
        document_id=doc.id,
        primary_entity_id=entity.id,
        category=FactCategory.RISK.value,
        statement="Initiative lacks cross-functional sponsorship.",
        severity=RiskSeverity.HIGH.value,
    )
    db_session.add(fact)
    db_session.commit()

    # Delete entity
    db_session.delete(entity)
    db_session.commit()

    db_session.refresh(fact)
    assert fact.primary_entity_id is None
    assert fact.statement == "Initiative lacks cross-functional sponsorship."


# -------------------------------------------------------------------------
# Pydantic FactCitation Validation Tests
# -------------------------------------------------------------------------

def test_pydantic_fact_citation_valid_offsets():
    """Valid positive segment-relative offsets."""
    citation = FactCitationBase(
        verbatim_quote="Key handover complete.",
        char_start=0,
        char_end=22,
    )
    assert citation.char_start == 0
    assert citation.char_end == 22


def test_pydantic_fact_citation_both_null_offsets():
    """Both offsets null is explicitly supported."""
    citation = FactCitationBase(
        verbatim_quote="General handover document note.",
        char_start=None,
        char_end=None,
    )
    assert citation.char_start is None
    assert citation.char_end is None


def test_pydantic_fact_citation_negative_start_offset():
    """Negative char_start must fail Pydantic validation."""
    with pytest.raises(ValidationError) as exc:
        FactCitationBase(
            verbatim_quote="Quote text",
            char_start=-1,
            char_end=10,
        )
    assert "char_start" in str(exc.value)


def test_pydantic_fact_citation_negative_end_offset():
    """Negative char_end must fail Pydantic validation."""
    with pytest.raises(ValidationError) as exc:
        FactCitationBase(
            verbatim_quote="Quote text",
            char_start=0,
            char_end=-5,
        )
    assert "char_end" in str(exc.value)


def test_pydantic_fact_citation_equal_start_and_end():
    """Equal start and end offsets must fail (end must be strictly greater than start)."""
    with pytest.raises(ValidationError) as exc:
        FactCitationBase(
            verbatim_quote="Quote text",
            char_start=15,
            char_end=15,
        )
    assert "strictly greater" in str(exc.value)


def test_pydantic_fact_citation_end_before_start():
    """End before start must fail validation."""
    with pytest.raises(ValidationError) as exc:
        FactCitationBase(
            verbatim_quote="Quote text",
            char_start=20,
            char_end=10,
        )
    assert "strictly greater" in str(exc.value)


def test_pydantic_fact_citation_only_start_provided():
    """Providing only char_start without char_end must fail validation."""
    with pytest.raises(ValidationError) as exc:
        FactCitationBase(
            verbatim_quote="Quote text",
            char_start=5,
            char_end=None,
        )
    assert "must both be provided or both be null" in str(exc.value)


def test_pydantic_fact_citation_only_end_provided():
    """Providing only char_end without char_start must fail validation."""
    with pytest.raises(ValidationError) as exc:
        FactCitationBase(
            verbatim_quote="Quote text",
            char_start=None,
            char_end=15,
        )
    assert "must both be provided or both be null" in str(exc.value)


# -------------------------------------------------------------------------
# Database CheckConstraint FactCitation Tests
# -------------------------------------------------------------------------

def test_db_check_constraint_fact_citation_valid(db_session: Session):
    """Database accepts valid offsets and both-null offsets."""
    doc = create_sample_document(db_session)
    fact = ExtractedFact(
        document_id=doc.id,
        category=FactCategory.DECISION.value,
        statement="Valid citation statement.",
    )
    db_session.add(fact)
    db_session.commit()

    # Valid present offsets
    c1 = FactCitation(
        fact_id=fact.id,
        verbatim_quote="Quote 1",
        char_start=0,
        char_end=10,
    )
    # Valid both-null offsets
    c2 = FactCitation(
        fact_id=fact.id,
        verbatim_quote="Quote 2",
        char_start=None,
        char_end=None,
    )
    db_session.add_all([c1, c2])
    db_session.commit()

    assert c1.char_start == 0
    assert c1.char_end == 10
    assert c2.char_start is None
    assert c2.char_end is None


def test_db_check_constraint_fact_citation_violations(db_session: Session):
    """Database CheckConstraint rejects invalid offset configurations."""
    doc = create_sample_document(db_session)
    fact = ExtractedFact(
        document_id=doc.id,
        category=FactCategory.DECISION.value,
        statement="Check constraint test statement.",
    )
    db_session.add(fact)
    db_session.commit()

    # Case A: only char_start provided
    c_start_only = FactCitation(
        fact_id=fact.id,
        verbatim_quote="Invalid",
        char_start=5,
        char_end=None,
    )
    with pytest.raises(IntegrityError):
        with db_session.begin_nested():
            db_session.add(c_start_only)
            db_session.flush()

    # Case B: only char_end provided
    c_end_only = FactCitation(
        fact_id=fact.id,
        verbatim_quote="Invalid",
        char_start=None,
        char_end=10,
    )
    with pytest.raises(IntegrityError):
        with db_session.begin_nested():
            db_session.add(c_end_only)
            db_session.flush()

    # Case C: equal start and end
    c_equal = FactCitation(
        fact_id=fact.id,
        verbatim_quote="Invalid",
        char_start=8,
        char_end=8,
    )
    with pytest.raises(IntegrityError):
        with db_session.begin_nested():
            db_session.add(c_equal)
            db_session.flush()

    # Case D: end before start
    c_reversed = FactCitation(
        fact_id=fact.id,
        verbatim_quote="Invalid",
        char_start=15,
        char_end=10,
    )
    with pytest.raises(IntegrityError):
        with db_session.begin_nested():
            db_session.add(c_reversed)
            db_session.flush()
