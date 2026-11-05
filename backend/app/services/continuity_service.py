import logging
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.document import Document
from app.models.knowledge import (
    ExtractedFact,
    ExtractedEntity,
    EntityRelationship,
)
from app.models.continuity import KnowledgeConflict
from app.schemas.knowledge import ExtractedFactDetailResponse, RelationType
from app.schemas.continuity import (
    ContinuityOverviewResponse,
    OwnedProject,
    ReportingRelationship,
    CriticalBlocker,
    KnowledgeConflictResponse,
)
from app.services.intelligence_analyzer import OrganizationalIntelligenceService

logger = logging.getLogger(__name__)


class ContinuityService:
    """
    Evaluates organizational continuity vectors, outgoing authority delegations,
    stewardship transfer readiness, operational blockers, and system vulnerability scores.
    """

    @classmethod
    def get_continuity_overview(
        cls,
        db: Session,
        leader_id: Optional[str] = None,
    ) -> ContinuityOverviewResponse:
        """
        Synthesizes the comprehensive continuity posture across stored records.
        """
        # Ensure latest intelligence analysis has run
        conflicts = db.query(KnowledgeConflict).filter(KnowledgeConflict.status == "open").all()
        if not conflicts:
            conflicts = OrganizationalIntelligenceService.run_analysis(db)
            conflicts = [c for c in conflicts if c.status == "open"]

        total_docs = db.query(Document).count()
        all_facts = db.query(ExtractedFact).all()
        all_entities = db.query(ExtractedEntity).all()
        all_relationships = db.query(EntityRelationship).all()

        # 1. Identify Outgoing Authority & Incoming Successor
        outgoing_leader_name: Optional[str] = None
        incoming_successor_name: Optional[str] = None

        transfer_rel = next(
            (r for r in all_relationships if r.relation_type == RelationType.TRANSFERS_TO.value),
            None,
        )
        if transfer_rel:
            outgoing_leader_name = transfer_rel.source_entity.name if transfer_rel.source_entity else None
            incoming_successor_name = transfer_rel.target_entity.name if transfer_rel.target_entity else None
        else:
            # Fallback to leader with most ownership / facts
            person_entities = [e for e in all_entities if e.category == "person"]
            if person_entities:
                outgoing_leader_name = person_entities[0].name
                if len(person_entities) > 1:
                    incoming_successor_name = person_entities[1].name

        # 2. Owned Projects & Assets
        owned_projects: List[OwnedProject] = []
        for ent in all_entities:
            if ent.category in ["project", "initiative", "asset"]:
                dep_count = sum(
                    1 for r in all_relationships
                    if (r.source_entity_id == ent.id or r.target_entity_id == ent.id)
                )
                # Compute risk level
                has_critical_blocker = any(
                    r.relation_type == RelationType.BLOCKS.value and r.target_entity_id == ent.id
                    for r in all_relationships
                )
                risk_level = "critical" if has_critical_blocker else ("low" if dep_count > 0 else "high")

                owned_projects.append(
                    OwnedProject(
                        entity_id=ent.id,
                        name=ent.name,
                        category=ent.category,
                        description=ent.description,
                        risk_level=risk_level,
                        dependencies_count=dep_count,
                    )
                )

        # 3. Reporting Lines & Delegation Structure
        reporting_lines: List[ReportingRelationship] = [
            ReportingRelationship(
                source_entity_id=r.source_entity_id,
                source_entity_name=r.source_entity.name if r.source_entity else "Entity",
                target_entity_id=r.target_entity_id,
                target_entity_name=r.target_entity.name if r.target_entity else "Entity",
                relation_type=r.relation_type,
            )
            for r in all_relationships
            if r.relation_type in [RelationType.REPORTS_TO.value, RelationType.TRANSFERS_TO.value, RelationType.OWNS.value]
        ]

        # 4. Critical Blockers & Deadlines
        critical_blockers: List[CriticalBlocker] = []
        for f in all_facts:
            is_critical = (f.severity in ["critical", "high"]) or (f.category == "deadline")
            if is_critical and f.verification_status != "rejected":
                critical_blockers.append(
                    CriticalBlocker(
                        fact_id=f.id,
                        statement=f.statement,
                        severity=f.severity or "high",
                        category=f.category,
                        deadline=f.deadline,
                        citations_count=len(f.citations),
                        document_filename=f.document.original_filename if f.document else None,
                    )
                )

        # 5. Open Risks
        open_risks = [
            ExtractedFactDetailResponse.model_validate(f)
            for f in all_facts
            if f.category == "risk" and f.verification_status != "rejected"
        ]

        # 6. Knowledge Gaps
        gap_conflicts = [
            KnowledgeConflictResponse.model_validate(c)
            for c in conflicts
        ]

        # 7. Calculate Deterministic Continuity Readiness Score
        # Start from 100 and deduct for unmitigated vulnerabilities; if no documents, score is 0
        if total_docs == 0 and len(all_facts) == 0:
            score = 0
        else:
            score = 100
            critical_count = sum(1 for c in conflicts if c.severity == "critical")
            high_count = sum(1 for c in conflicts if c.severity == "high")
            unowned_count = sum(1 for p in owned_projects if p.risk_level == "high")

            score -= (critical_count * 15)
            score -= (high_count * 8)
            score -= (unowned_count * 10)
            score = max(0, min(100, score))

        if score >= 80:
            readiness = "ON_TRACK"
        elif score >= 50:
            readiness = "ATTENTION_REQUIRED"
        else:
            readiness = "CRITICAL_RISK"

        return ContinuityOverviewResponse(
            continuity_score=score,
            readiness_status=readiness,
            total_documents_deposited=total_docs,
            total_facts_extracted=len(all_facts),
            total_entities_indexed=len(all_entities),
            active_conflicts_count=len(conflicts),
            critical_blockers_count=len(critical_blockers),
            outgoing_leader=outgoing_leader_name or "Outgoing Executive",
            incoming_successor=incoming_successor_name or "Incoming Successor",
            owned_projects=owned_projects,
            reporting_lines=reporting_lines,
            critical_blockers=critical_blockers,
            open_risks=open_risks,
            knowledge_gaps=gap_conflicts,
        )

