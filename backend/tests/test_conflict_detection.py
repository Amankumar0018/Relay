import uuid
from datetime import datetime, timezone
import pytest
from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.knowledge import (
    DocumentSegment,
    ExtractedEntity,
    ExtractedFact,
    FactCitation,
    EntityRelationship,
)
from app.models.continuity import KnowledgeConflict
from app.schemas.knowledge import RelationType
from app.schemas.continuity import ConflictType, ConflictSeverity, ConflictStatus
from app.services.intelligence_analyzer import OrganizationalIntelligenceService


@pytest.fixture
def test_docs_and_entities(db_session: Session):
    """Sets up test documents and entities for Project Nova, Project Odyssey, and Kubernetes Alpha-9."""
    doc_nova = Document(
        id=str(uuid.uuid4()),
        original_filename="Project_Nova_Handover.txt",
        stored_filename=f"{uuid.uuid4()}_nova.txt",
        file_extension="txt",
        content_type="text/plain",
        file_size=512,
        sha256_hash="hash_nova",
        storage_path="/tmp/nova.txt",
        extracted_text="Project Nova handover documentation",
        extraction_status="completed",
    )
    doc_ody_a = Document(
        id=str(uuid.uuid4()),
        original_filename="Project_Odyssey_Deployment_Plan.txt",
        stored_filename=f"{uuid.uuid4()}_ody_a.txt",
        file_extension="txt",
        content_type="text/plain",
        file_size=1024,
        sha256_hash="hash_ody_a",
        storage_path="/tmp/ody_a.txt",
        extracted_text="Project Odyssey initial deployment plan",
        extraction_status="completed",
    )
    doc_ody_b = Document(
        id=str(uuid.uuid4()),
        original_filename="Project_Odyssey_Schedule_Amendment_Memo.txt",
        stored_filename=f"{uuid.uuid4()}_ody_b.txt",
        file_extension="txt",
        content_type="text/plain",
        file_size=1024,
        sha256_hash="hash_ody_b",
        storage_path="/tmp/ody_b.txt",
        extracted_text="Project Odyssey schedule amendment memo",
        extraction_status="completed",
    )
    db_session.add_all([doc_nova, doc_ody_a, doc_ody_b])
    db_session.commit()

    ent_nova = ExtractedEntity(
        id=str(uuid.uuid4()),
        name="Project Nova",
        canonical_name="project nova",
        category="project",
    )
    ent_priya = ExtractedEntity(
        id=str(uuid.uuid4()),
        name="Priya Sharma",
        canonical_name="priya sharma",
        category="person",
    )
    ent_odyssey = ExtractedEntity(
        id=str(uuid.uuid4()),
        name="Project Odyssey",
        canonical_name="project odyssey",
        category="project",
    )
    ent_marcus = ExtractedEntity(
        id=str(uuid.uuid4()),
        name="Marcus Vance",
        canonical_name="marcus vance",
        category="person",
    )
    ent_k8s = ExtractedEntity(
        id=str(uuid.uuid4()),
        name="Kubernetes cluster Alpha-9",
        canonical_name="kubernetes cluster alpha-9",
        category="asset",
    )
    db_session.add_all([ent_nova, ent_priya, ent_odyssey, ent_marcus, ent_k8s])
    db_session.commit()

    # Rel: Priya OWNS Project Nova
    rel_nova_owner = EntityRelationship(
        id=str(uuid.uuid4()),
        source_entity_id=ent_priya.id,
        target_entity_id=ent_nova.id,
        relation_type="OWNS",
        confidence_score=0.99,
        document_id=doc_nova.id,
    )
    # Rel: Marcus OWNS Project Odyssey
    rel_ody_owner = EntityRelationship(
        id=str(uuid.uuid4()),
        source_entity_id=ent_marcus.id,
        target_entity_id=ent_odyssey.id,
        relation_type="OWNS",
        confidence_score=0.99,
        document_id=doc_ody_a.id,
    )
    db_session.add_all([rel_nova_owner, rel_ody_owner])
    db_session.commit()

    return {
        "doc_nova": doc_nova,
        "doc_ody_a": doc_ody_a,
        "doc_ody_b": doc_ody_b,
        "ent_nova": ent_nova,
        "ent_priya": ent_priya,
        "ent_odyssey": ent_odyssey,
        "ent_marcus": ent_marcus,
        "ent_k8s": ent_k8s,
    }


# =============================================================================
# 1. Project Nova False Positives Regression Test
# =============================================================================

def test_project_nova_independent_facts_no_false_positive_contradictions(
    db_session: Session, test_docs_and_entities: dict
):
    """
    Project Nova has three independent, compatible facts:
    1. Owner: Priya Sharma manages Project Nova.
    2. Deadline: The deadline for Project Nova is December 20, 2026.
    3. Pending task: The pending task for Project Nova is final security testing.

    Verifies that NO false-positive contradictions are generated between:
    - Owner vs Deadline
    - Owner vs Pending Task
    - Deadline vs Pending Task
    """
    env = test_docs_and_entities
    doc = env["doc_nova"]
    ent = env["ent_nova"]

    f_owner = ExtractedFact(
        id=str(uuid.uuid4()),
        document_id=doc.id,
        primary_entity_id=ent.id,
        category="responsibility",
        statement="Priya Sharma manages Project Nova.",
        verification_status="evidence-backed",
        confidence_score=0.95,
    )
    f_deadline = ExtractedFact(
        id=str(uuid.uuid4()),
        document_id=doc.id,
        primary_entity_id=ent.id,
        category="deadline",
        statement="The deadline for Project Nova is December 20, 2026.",
        deadline=datetime(2026, 12, 20, tzinfo=timezone.utc),
        verification_status="evidence-backed",
        confidence_score=0.95,
    )
    f_task = ExtractedFact(
        id=str(uuid.uuid4()),
        document_id=doc.id,
        primary_entity_id=ent.id,
        category="responsibility",
        statement="The pending task for Project Nova is final security testing.",
        verification_status="evidence-backed",
        confidence_score=0.92,
    )
    db_session.add_all([f_owner, f_deadline, f_task])
    db_session.commit()

    conflicts = OrganizationalIntelligenceService.run_analysis(db_session)

    # Filter conflicts that touch Project Nova facts
    nova_fact_ids = {f_owner.id, f_deadline.id, f_task.id}
    nova_conflicts = [
        c for c in conflicts
        if c.fact_a_id in nova_fact_ids or c.fact_b_id in nova_fact_ids
    ]

    # Must be ZERO false-positive conflicts
    assert len(nova_conflicts) == 0, (
        f"Expected 0 conflicts for Project Nova independent facts, got {len(nova_conflicts)}: "
        f"{[c.title for c in nova_conflicts]}"
    )


# =============================================================================
# 2. Project Odyssey Compatible Milestones & Roles Regression Test
# =============================================================================

def test_project_odyssey_compatible_milestones_and_roles(
    db_session: Session, test_docs_and_entities: dict
):
    """
    Within Schedule A, Project Odyssey contains distinct milestone phases and roles:
    1. Roadmap: The team has finalized the deployment roadmap for Project Odyssey.
    2. Architecture Freeze: Architecture Freeze for Project Odyssey is scheduled for October 10, 2026.
    3. Beta Release: Beta Release for Project Odyssey is scheduled for November 15, 2026.
    4. General Availability: General Availability for Project Odyssey is scheduled for January 15, 2027.
    5. Leadership Role: Marcus Vance oversees overall organizational alignment and executive reporting for Project Odyssey.

    Verifies that distinct milestones and project roles are compatible and generate 0 conflicts.
    """
    env = test_docs_and_entities
    doc = env["doc_ody_a"]
    ent = env["ent_odyssey"]

    f_roadmap = ExtractedFact(
        id=str(uuid.uuid4()),
        document_id=doc.id,
        primary_entity_id=ent.id,
        category="decision",
        statement="The team has finalized the deployment roadmap for Project Odyssey.",
        verification_status="evidence-backed",
        confidence_score=0.95,
    )
    f_freeze = ExtractedFact(
        id=str(uuid.uuid4()),
        document_id=doc.id,
        primary_entity_id=ent.id,
        category="deadline",
        statement="Architecture Freeze for Project Odyssey is scheduled for October 10, 2026.",
        deadline=datetime(2026, 10, 10, tzinfo=timezone.utc),
        verification_status="evidence-backed",
        confidence_score=0.95,
    )
    f_beta = ExtractedFact(
        id=str(uuid.uuid4()),
        document_id=doc.id,
        primary_entity_id=ent.id,
        category="deadline",
        statement="Beta Release for Project Odyssey is scheduled for November 15, 2026.",
        deadline=datetime(2026, 11, 15, tzinfo=timezone.utc),
        verification_status="evidence-backed",
        confidence_score=0.95,
    )
    f_ga = ExtractedFact(
        id=str(uuid.uuid4()),
        document_id=doc.id,
        primary_entity_id=ent.id,
        category="deadline",
        statement="General Availability for Project Odyssey is scheduled for January 15, 2027.",
        deadline=datetime(2027, 1, 15, tzinfo=timezone.utc),
        verification_status="evidence-backed",
        confidence_score=0.95,
    )
    f_role = ExtractedFact(
        id=str(uuid.uuid4()),
        document_id=doc.id,
        primary_entity_id=ent.id,
        category="responsibility",
        statement="Marcus Vance oversees overall organizational alignment and executive reporting for Project Odyssey.",
        verification_status="evidence-backed",
        confidence_score=0.92,
    )
    db_session.add_all([f_roadmap, f_freeze, f_beta, f_ga, f_role])
    db_session.commit()

    conflicts = OrganizationalIntelligenceService.run_analysis(db_session)

    ody_fact_ids = {f_roadmap.id, f_freeze.id, f_beta.id, f_ga.id, f_role.id}
    ody_conflicts = [
        c for c in conflicts
        if c.fact_a_id in ody_fact_ids or c.fact_b_id in ody_fact_ids
    ]

    # Distinct milestones (Freeze vs Beta vs GA vs Role) are sequential and compatible:
    # Must have 0 contradictions or superseded decisions among them.
    ody_contradictions = [
        c for c in ody_conflicts
        if c.conflict_type in [ConflictType.CONTRADICTION.value, ConflictType.SUPERSEDED_DECISION.value]
    ]
    assert len(ody_contradictions) == 0, (
        f"Expected 0 contradictions for compatible milestones in Project Odyssey, got {len(ody_contradictions)}: "
        f"{[c.title for c in ody_contradictions]}"
    )


# =============================================================================
# 3. Project Odyssey Competing Schedules Regression Test
# =============================================================================

def test_project_odyssey_competing_schedules_detected(
    db_session: Session, test_docs_and_entities: dict
):
    """
    Compares Schedule A vs Schedule B:
    - Schedule A: Beta Nov 15, 2026; GA Jan 15, 2027
    - Schedule B: Beta Dec 20, 2026; GA Feb 28, 2027

    Verifies that competing dates for the same project milestones
    (Beta Release and General Availability) are accurately detected.
    """
    env = test_docs_and_entities
    doc_a = env["doc_ody_a"]
    doc_b = env["doc_ody_b"]
    ent = env["ent_odyssey"]

    # Schedule A
    f_beta_a = ExtractedFact(
        id=str(uuid.uuid4()),
        document_id=doc_a.id,
        primary_entity_id=ent.id,
        category="deadline",
        statement="Beta Release for Project Odyssey is scheduled for November 15, 2026.",
        deadline=datetime(2026, 11, 15, tzinfo=timezone.utc),
        verification_status="evidence-backed",
    )
    f_ga_a = ExtractedFact(
        id=str(uuid.uuid4()),
        document_id=doc_a.id,
        primary_entity_id=ent.id,
        category="deadline",
        statement="General Availability for Project Odyssey is scheduled for January 15, 2027.",
        deadline=datetime(2027, 1, 15, tzinfo=timezone.utc),
        verification_status="evidence-backed",
    )

    # Schedule B
    f_beta_b = ExtractedFact(
        id=str(uuid.uuid4()),
        document_id=doc_b.id,
        primary_entity_id=ent.id,
        category="deadline",
        statement="The Beta Release for Project Odyssey is scheduled for December 20, 2026.",
        deadline=datetime(2026, 12, 20, tzinfo=timezone.utc),
        verification_status="evidence-backed",
    )
    f_ga_b = ExtractedFact(
        id=str(uuid.uuid4()),
        document_id=doc_b.id,
        primary_entity_id=ent.id,
        category="deadline",
        statement="The General Availability for Project Odyssey is scheduled for February 28, 2027.",
        deadline=datetime(2027, 2, 28, tzinfo=timezone.utc),
        verification_status="evidence-backed",
    )
    db_session.add_all([f_beta_a, f_ga_a, f_beta_b, f_ga_b])
    db_session.commit()

    conflicts = OrganizationalIntelligenceService.run_analysis(db_session)

    # Find conflict between Beta dates
    beta_conflicts = [
        c for c in conflicts
        if {c.fact_a_id, c.fact_b_id} == {f_beta_a.id, f_beta_b.id}
    ]
    assert len(beta_conflicts) == 1, "Must detect competing schedule for Beta Release"
    assert beta_conflicts[0].conflict_type in ["contradiction", "superseded_decision"]

    # Find conflict between GA dates
    ga_conflicts = [
        c for c in conflicts
        if {c.fact_a_id, c.fact_b_id} == {f_ga_a.id, f_ga_b.id}
    ]
    assert len(ga_conflicts) == 1, "Must detect competing schedule for General Availability"
    assert ga_conflicts[0].conflict_type in ["contradiction", "superseded_decision"]


# =============================================================================
# 4. Project Odyssey Superseded Roadmap Decision Regression Test
# =============================================================================

def test_project_odyssey_superseded_deployment_roadmap(
    db_session: Session, test_docs_and_entities: dict
):
    """
    Verifies that explicit amendments to decisions:
    - Initial: The team has finalized the deployment roadmap for Project Odyssey.
    - Revised: The Project Odyssey deployment roadmap has been officially amended...
    are classified as SUPERSEDED_DECISION (medium severity).
    """
    env = test_docs_and_entities
    doc_a = env["doc_ody_a"]
    doc_b = env["doc_ody_b"]
    ent = env["ent_odyssey"]

    f_init = ExtractedFact(
        id=str(uuid.uuid4()),
        document_id=doc_a.id,
        primary_entity_id=ent.id,
        category="decision",
        statement="The team has finalized the deployment roadmap for Project Odyssey.",
        verification_status="evidence-backed",
    )
    f_amend = ExtractedFact(
        id=str(uuid.uuid4()),
        document_id=doc_b.id,
        primary_entity_id=ent.id,
        category="decision",
        statement="The Project Odyssey deployment roadmap has been officially amended following infrastructure testing on Kubernetes cluster Alpha-9.",
        verification_status="evidence-backed",
    )
    db_session.add_all([f_init, f_amend])
    db_session.commit()

    conflicts = OrganizationalIntelligenceService.run_analysis(db_session)

    superseded = [
        c for c in conflicts
        if c.conflict_type == ConflictType.SUPERSEDED_DECISION.value
        and {c.fact_a_id, c.fact_b_id} == {f_init.id, f_amend.id}
    ]
    assert len(superseded) == 1, "Must classify amended deployment roadmap as a superseded decision"
    assert superseded[0].severity == ConflictSeverity.MEDIUM.value
    assert "amends or supersedes" in superseded[0].description


# =============================================================================
# 5. Kubernetes Alpha-9 Ownership Gap Regression Test
# =============================================================================

def test_kubernetes_cluster_alpha9_ownership_gap(
    db_session: Session, test_docs_and_entities: dict
):
    """
    Verifies that critical assets/projects without an assigned owner or lead steward
    (e.g., Kubernetes cluster Alpha-9) are flagged with an OWNERSHIP_GAP conflict (high severity).
    """
    env = test_docs_and_entities
    ent_k8s = env["ent_k8s"]

    conflicts = OrganizationalIntelligenceService.run_analysis(db_session)

    k8s_gaps = [
        c for c in conflicts
        if c.conflict_type == ConflictType.OWNERSHIP_GAP.value
        and c.entity_id == ent_k8s.id
    ]
    assert len(k8s_gaps) == 1, "Must detect unassigned ownership for Kubernetes cluster Alpha-9"
    assert k8s_gaps[0].severity == ConflictSeverity.HIGH.value
    assert "Kubernetes cluster Alpha-9" in k8s_gaps[0].title


# =============================================================================
# 6. Human Adjudication Preservation & Provenance Protection Regression Test
# =============================================================================

def test_human_adjudicated_conflict_preservation_and_provenance(
    db_session: Session, test_docs_and_entities: dict
):
    """
    Verifies the human-in-the-loop requirement:
    1. Human-resolved conflicts are preserved across subsequent intelligence scans.
    2. Reviewer notes, resolution status, and timestamps remain untouched.
    3. Underlying ExtractedFact and Document records are never deleted.
    """
    env = test_docs_and_entities
    doc_a = env["doc_ody_a"]
    doc_b = env["doc_ody_b"]
    ent = env["ent_odyssey"]

    f1 = ExtractedFact(
        id=str(uuid.uuid4()),
        document_id=doc_a.id,
        primary_entity_id=ent.id,
        category="decision",
        statement="The team has finalized the deployment roadmap for Project Odyssey.",
    )
    f2 = ExtractedFact(
        id=str(uuid.uuid4()),
        document_id=doc_b.id,
        primary_entity_id=ent.id,
        category="decision",
        statement="The Project Odyssey deployment roadmap has been officially amended following infrastructure testing on Kubernetes cluster Alpha-9.",
    )
    db_session.add_all([f1, f2])
    db_session.commit()

    # Initial scan detects the superseded decision
    conflicts_initial = OrganizationalIntelligenceService.run_analysis(db_session)
    target = next(
        c for c in conflicts_initial
        if {c.fact_a_id, c.fact_b_id} == {f1.id, f2.id}
    )

    # Human auditor adjudicates the matter
    resolved = OrganizationalIntelligenceService.resolve_conflict(
        db=db_session,
        conflict_id=target.id,
        resolution_notes="Approved by VP of Engineering following Alpha-9 signoff.",
        status=ConflictStatus.RESOLVED.value,
        resolved_by="auditor_sarah",
    )
    assert resolved.status == "resolved"
    assert resolved.resolved_by == "auditor_sarah"

    # Re-run intelligence scan
    conflicts_rescan = OrganizationalIntelligenceService.run_analysis(db_session)

    # Find the target conflict again
    rechecked = db_session.query(KnowledgeConflict).filter(KnowledgeConflict.id == target.id).first()
    assert rechecked is not None
    assert rechecked.status == "resolved"
    assert rechecked.resolved_by == "auditor_sarah"
    assert "Approved by VP of Engineering" in rechecked.resolution_notes

    # Verify underlying facts and documents are strictly preserved
    assert db_session.query(ExtractedFact).filter(ExtractedFact.id == f1.id).first() is not None
    assert db_session.query(ExtractedFact).filter(ExtractedFact.id == f2.id).first() is not None
    assert db_session.query(Document).filter(Document.id == doc_a.id).first() is not None
