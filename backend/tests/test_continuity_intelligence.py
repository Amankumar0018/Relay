import uuid
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.document import Document
from app.models.knowledge import (
    DocumentSegment,
    ExtractedEntity,
    EntityMention,
    ExtractedFact,
    FactCitation,
    EntityRelationship,
)
from app.models.continuity import (
    KnowledgeConflict,
    HandoverDossier,
    QuestionAnswerAudit,
)
from app.schemas.knowledge import RelationType
from app.schemas.continuity import (
    ConflictType,
    ConflictSeverity,
    ConflictStatus,
    HandoverDossierCreateRequest,
    QARequest,
)
from app.services.intelligence_analyzer import OrganizationalIntelligenceService
from app.services.continuity_service import ContinuityService
from app.services.dossier_service import HandoverDossierService
from app.services.qa_service import QuestionAnsweringService


def _create_test_env(db: Session):
    """Sets up a realistic test organization with documents, segments, entities, and facts."""
    doc1 = Document(
        id=str(uuid.uuid4()),
        original_filename="Charters_2024.pdf",
        stored_filename=f"{uuid.uuid4()}_charter.pdf",
        file_extension="pdf",
        content_type="application/pdf",
        file_size=1024,
        sha256_hash="hash1",
        storage_path="/tmp/charter.pdf",
        extracted_text="Charter document text",
        extraction_status="completed",
    )
    doc2 = Document(
        id=str(uuid.uuid4()),
        original_filename="Vendor_Amendment_3.pdf",
        stored_filename=f"{uuid.uuid4()}_vendor.pdf",
        file_extension="pdf",
        content_type="application/pdf",
        file_size=1024,
        sha256_hash="hash2",
        storage_path="/tmp/vendor.pdf",
        extracted_text="Vendor amendment text",
        extraction_status="completed",
    )
    db.add_all([doc1, doc2])
    db.commit()

    seg1 = DocumentSegment(
        id=str(uuid.uuid4()),
        document_id=doc1.id,
        sequence_number=0,
        segment_type="paragraph",
        source_label="Page 1, Paragraph 1",
        content="Dr. Eleanor Vance is designated as the primary sponsor representative.",
        char_offset_start=0,
        char_offset_end=70,
    )
    seg2 = DocumentSegment(
        id=str(uuid.uuid4()),
        document_id=doc2.id,
        sequence_number=0,
        segment_type="paragraph",
        source_label="Page 2, Section 1",
        content="Execution sponsor is hereby reassigned exclusively to Dr. Marcus Thorne.",
        char_offset_start=0,
        char_offset_end=72,
    )
    db.add_all([seg1, seg2])
    db.commit()

    # Entities
    e_vance = ExtractedEntity(
        id=str(uuid.uuid4()),
        name="Dr. Eleanor Vance",
        canonical_name="eleanor vance",
        category="person",
    )
    e_thorne = ExtractedEntity(
        id=str(uuid.uuid4()),
        name="Dr. Marcus Thorne",
        canonical_name="marcus thorne",
        category="person",
    )
    e_project = ExtractedEntity(
        id=str(uuid.uuid4()),
        name="Project Titan",
        canonical_name="project titan",
        category="project",
    )
    e_orphan = ExtractedEntity(
        id=str(uuid.uuid4()),
        name="Unassigned BioReactor Line",
        canonical_name="unassigned bioreactor line",
        category="asset",
    )
    db.add_all([e_vance, e_thorne, e_project, e_orphan])
    db.commit()

    # Relationships: Vance TRANSFERS_TO Thorne; Thorne OWNS Project Titan
    rel_transfer = EntityRelationship(
        id=str(uuid.uuid4()),
        source_entity_id=e_vance.id,
        target_entity_id=e_thorne.id,
        relation_type="TRANSFERS_TO",
        confidence_score=0.95,
        document_id=doc1.id,
    )
    rel_owns = EntityRelationship(
        id=str(uuid.uuid4()),
        source_entity_id=e_thorne.id,
        target_entity_id=e_project.id,
        relation_type="OWNS",
        confidence_score=0.99,
        document_id=doc2.id,
    )
    db.add_all([rel_transfer, rel_owns])
    db.commit()

    # Facts
    f1 = ExtractedFact(
        id=str(uuid.uuid4()),
        document_id=doc1.id,
        primary_entity_id=e_vance.id,
        category="decision",
        statement="Sponsor representative designated as Dr. Eleanor Vance for trial protocol sign-off.",
        verification_status="evidence-backed",
        confidence_score=0.98,
    )
    f2 = ExtractedFact(
        id=str(uuid.uuid4()),
        document_id=doc2.id,
        primary_entity_id=e_thorne.id,
        category="decision",
        statement="Sponsor representative designated as Dr. Marcus Thorne for trial protocol sign-off.",
        verification_status="evidence-backed",
        confidence_score=0.98,
    )
    # Passed deadline
    f_deadline = ExtractedFact(
        id=str(uuid.uuid4()),
        document_id=doc1.id,
        primary_entity_id=e_vance.id,
        category="deadline",
        statement="FDA Form 1572 re-submission deadline on October 15, 2024.",
        deadline=datetime(2024, 10, 15, tzinfo=timezone.utc),
        verification_status="evidence-backed",
        confidence_score=0.95,
    )
    # Inferred fact (knowledge gap)
    f_inferred = ExtractedFact(
        id=str(uuid.uuid4()),
        document_id=doc2.id,
        primary_entity_id=e_project.id,
        category="risk",
        statement="Transition may cause delayed spectrometer calibration.",
        verification_status="inferred",
        confidence_score=0.75,
    )
    db.add_all([f1, f2, f_deadline, f_inferred])
    db.commit()

    # Citations
    c1 = FactCitation(
        id=str(uuid.uuid4()),
        fact_id=f1.id,
        document_segment_id=seg1.id,
        verbatim_quote="Dr. Eleanor Vance is designated as the primary sponsor representative.",
        source_location="Page 1, Paragraph 1",
        char_start=0,
        char_end=70,
        verification_status="valid",
    )
    c2 = FactCitation(
        id=str(uuid.uuid4()),
        fact_id=f2.id,
        document_segment_id=seg2.id,
        verbatim_quote="Execution sponsor is hereby reassigned exclusively to Dr. Marcus Thorne.",
        source_location="Page 2, Section 1",
        char_start=0,
        char_end=72,
        verification_status="valid",
    )
    db.add_all([c1, c2])
    db.commit()

    return {
        "doc1": doc1,
        "doc2": doc2,
        "f1": f1,
        "f2": f2,
        "e_vance": e_vance,
        "e_thorne": e_thorne,
        "e_orphan": e_orphan,
    }


# =============================================================================
# 1. Intelligence Conflict & Gap Analysis Tests
# =============================================================================

def test_intelligence_conflict_detection_contradiction(db_session: Session):
    env = _create_test_env(db_session)
    conflicts = OrganizationalIntelligenceService.run_analysis(db_session)

    # Must detect direct contradiction between f1 and f2 (sponsor representative)
    contradictions = [c for c in conflicts if c.conflict_type == "contradiction"]
    assert len(contradictions) >= 1
    contra = contradictions[0]
    assert contra.severity == "critical"
    assert contra.status == "open"
    assert "Discrepancy" in contra.title or "Contradiction" in contra.title


def test_intelligence_superseded_decision_distinction(db_session: Session):
    doc = Document(
        id=str(uuid.uuid4()),
        original_filename="Contract_Series.pdf",
        stored_filename="cs.pdf",
        file_extension="pdf",
        content_type="application/pdf",
        file_size=100,
        sha256_hash="h",
        storage_path="/tmp/cs.pdf",
        extraction_status="completed",
    )
    db_session.add(doc)
    db_session.commit()

    f_v1 = ExtractedFact(
        id=str(uuid.uuid4()),
        document_id=doc.id,
        category="decision",
        statement="Vendor contract renewed for 12 months.",
        verification_status="evidence-backed",
    )
    f_v2 = ExtractedFact(
        id=str(uuid.uuid4()),
        document_id=doc.id,
        category="decision",
        statement="Vendor contract amended and extended to 24 months.",
        verification_status="evidence-backed",
    )
    db_session.add_all([f_v1, f_v2])
    db_session.commit()

    conflicts = OrganizationalIntelligenceService.run_analysis(db_session)
    superseded = [c for c in conflicts if c.conflict_type == "superseded_decision"]
    assert len(superseded) >= 1
    assert superseded[0].severity == "medium"
    assert "amends or supersedes" in superseded[0].description


def test_intelligence_outdated_deadline_and_missing_ownership(db_session: Session):
    env = _create_test_env(db_session)
    conflicts = OrganizationalIntelligenceService.run_analysis(db_session)

    # Outdated deadline
    outdated = [c for c in conflicts if c.conflict_type == "outdated_deadline"]
    assert len(outdated) >= 1
    assert "passed" in outdated[0].description.lower()

    # Missing ownership for e_orphan (Unassigned BioReactor Line)
    orphan_gaps = [c for c in conflicts if c.conflict_type == "ownership_gap" and c.entity_id == env["e_orphan"].id]
    assert len(orphan_gaps) == 1
    assert orphan_gaps[0].severity == "high"


def test_resolve_conflict_endpoint(client: TestClient, db_session: Session):
    env = _create_test_env(db_session)
    conflicts = OrganizationalIntelligenceService.run_analysis(db_session)
    target = conflicts[0]

    # Unauthenticated PATCH must fail with 401 Unauthorized
    res_unauth = client.patch(
        f"/api/v1/intelligence/conflicts/{target.id}",
        json={
            "status": "resolved",
            "resolution_notes": "Clarified with General Counsel; co-signatures executed on FDA 1572.",
            "resolved_by": "auditor_smith",
        },
    )
    assert res_unauth.status_code == 401

    # Authenticated resolution with operator secret succeeds
    res = client.patch(
        f"/api/v1/intelligence/conflicts/{target.id}",
        headers={"X-Operator-Secret": settings.SWITCH_OPERATOR_SECRET},
        json={
            "status": "resolved",
            "resolution_notes": "Clarified with General Counsel; co-signatures executed on FDA 1572.",
            "resolved_by": "auditor_smith",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "resolved"
    assert data["resolution_notes"] == "Clarified with General Counsel; co-signatures executed on FDA 1572."
    assert data["resolved_by"] == "auditor_smith"
    assert data["resolved_at"] is not None


# =============================================================================
# 2. Continuity Assessment Tests
# =============================================================================

def test_continuity_overview_endpoint(client: TestClient, db_session: Session):
    _create_test_env(db_session)

    res = client.get("/api/v1/continuity/overview")
    assert res.status_code == 200
    data = res.json()

    assert "continuity_score" in data
    assert 0 <= data["continuity_score"] <= 100
    assert data["readiness_status"] in ["ON_TRACK", "ATTENTION_REQUIRED", "CRITICAL_RISK"]
    assert data["total_documents_deposited"] >= 2
    assert data["total_facts_extracted"] >= 4
    assert len(data["owned_projects"]) >= 1
    assert len(data["reporting_lines"]) >= 1
    assert len(data["critical_blockers"]) >= 1
    assert len(data["knowledge_gaps"]) >= 1


# =============================================================================
# 3. Handover Dossier Generation & Retrieval Tests
# =============================================================================

def test_handover_dossier_generation_and_retrieval(client: TestClient, db_session: Session):
    _create_test_env(db_session)

    # Generate dossier
    res_post = client.post(
        "/api/v1/handovers/generate",
        json={
            "title": "CSO Executive Handover Briefing Book",
            "target_role": "Chief Scientific Officer",
            "outgoing_leader_name": "Eleanor Vance",
            "incoming_leader_name": "Marcus Thorne",
        },
    )
    assert res_post.status_code == 201
    dossier = res_post.json()

    assert dossier["title"] == "CSO Executive Handover Briefing Book"
    assert dossier["status"] == "generated"
    assert dossier["version"] == 1
    assert dossier["outgoing_leader"]["canonical_name"] == "eleanor vance"
    assert dossier["incoming_leader"]["canonical_name"] == "marcus thorne"

    content = dossier["content"]
    assert len(content["chapters"]) == 9
    assert "Day 1-7" in content["recommended_day_1_to_30_actions"][0]

    # Verify chapters have facts and citations
    ch1 = content["chapters"][0]
    assert ch1["chapter_id"] == "ch1"
    assert len(ch1["facts"]) >= 2
    assert len(ch1["citations"]) >= 1

    # Retrieve by ID
    res_get = client.get(f"/api/v1/handovers/{dossier['id']}")
    assert res_get.status_code == 200
    assert res_get.json()["id"] == dossier["id"]

    # List dossiers
    res_list = client.get("/api/v1/handovers")
    assert res_list.status_code == 200
    assert res_list.json()["total"] >= 1


# =============================================================================
# 4. Evidence-Grounded Natural Language Question Answering Tests
# =============================================================================

def test_grounded_qa_sufficient_evidence(client: TestClient, db_session: Session):
    _create_test_env(db_session)
    OrganizationalIntelligenceService.run_analysis(db_session)

    res = client.post(
        "/api/v1/qa/ask",
        json={"question": "Who is designated as sponsor representative for trial protocol sign-off?"},
    )
    assert res.status_code == 200
    data = res.json()

    assert data["has_sufficient_evidence"] is True
    assert data["confidence_score"] >= 0.7
    assert len(data["citations"]) >= 1
    assert "Dr. Eleanor Vance" in data["answer"] or "Dr. Marcus Thorne" in data["answer"]
    assert len(data["conflicts_detected"]) >= 1  # Highlights the contradiction!


def test_grounded_qa_insufficient_evidence(client: TestClient, db_session: Session):
    _create_test_env(db_session)

    res = client.post(
        "/api/v1/qa/ask",
        json={"question": "What is the secret recipe for quantum cold fusion propulsion?"},
    )
    assert res.status_code == 200
    data = res.json()

    assert data["has_sufficient_evidence"] is False
    assert data["confidence_score"] == 0.0
    assert "Insufficient evidence" in data["answer"]
    assert len(data["citations"]) == 0


def test_qa_history_audit(client: TestClient, db_session: Session):
    _create_test_env(db_session)

    # Ask two questions
    client.post("/api/v1/qa/ask", json={"question": "What are the protocol sign-offs?"})
    client.post("/api/v1/qa/ask", json={"question": "What deadlines exist?"})

    res = client.get("/api/v1/qa/history")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 2
    assert len(data["items"]) >= 2


def test_supersedes_relationship_and_enum_compatibility(db_session: Session):
    """
    Verifies that the SUPERSEDES relation_type is a valid enum value and that
    an explicit SUPERSEDES relationship causes opposing assertions to be
    classified as a superseded decision rather than a contradiction.
    """
    env = _create_test_env(db_session)

    # Assert RelationType enum has SUPERSEDES
    assert RelationType.SUPERSEDES.value == "SUPERSEDES"

    # Create explicit SUPERSEDES relationship: Thorne SUPERSEDES Vance
    rel_super = EntityRelationship(
        id=str(uuid.uuid4()),
        source_entity_id=env["e_thorne"].id,
        target_entity_id=env["e_vance"].id,
        relation_type=RelationType.SUPERSEDES.value,
        confidence_score=1.0,
        document_id=env["doc2"].id,
    )
    db_session.add(rel_super)
    db_session.commit()

    conflicts = OrganizationalIntelligenceService.run_analysis(db_session)
    superseded = [c for c in conflicts if c.conflict_type == "superseded_decision"]
    assert len(superseded) >= 1


def test_continuity_score_bounds_and_empty_state(client: TestClient, db_session: Session):
    """
    Verifies that continuity score stays strictly within [0, 100], and returns 0
    when no documents or facts exist.
    """
    # Empty DB
    res_empty = client.get("/api/v1/continuity/overview")
    assert res_empty.status_code == 200
    data_empty = res_empty.json()
    assert data_empty["continuity_score"] == 0
    assert data_empty["readiness_status"] == "CRITICAL_RISK"

    # Populated DB
    _create_test_env(db_session)
    res_pop = client.get("/api/v1/continuity/overview")
    assert res_pop.status_code == 200
    data_pop = res_pop.json()
    assert 0 <= data_pop["continuity_score"] <= 100


def test_dossier_chapter5_evidence_traceability(client: TestClient, db_session: Session):
    """
    Verifies that Chapter 5 (Discrepancies & Gaps) contains supporting facts
    and citations for full evidence traceability.
    """
    _create_test_env(db_session)
    OrganizationalIntelligenceService.run_analysis(db_session)

    res = client.post(
        "/api/v1/handovers/generate",
        json={"title": "Audited Briefing Book", "target_role": "Chief Scientific Officer"},
    )
    assert res.status_code == 201
    data = res.json()

    # In the 9-chapter architecture, Discrepancies & Gaps is Chapter 6
    ch_discrepancies = next(c for c in data["content"]["chapters"] if c["chapter_id"] == "ch6" or "Discrepanc" in c["title"])
    assert len(ch_discrepancies["facts"]) >= 1
    assert len(ch_discrepancies["citations"]) >= 1
    for cit in ch_discrepancies["citations"]:
        assert cit["verbatim_quote"] != ""
        assert cit["source_location"] != ""

