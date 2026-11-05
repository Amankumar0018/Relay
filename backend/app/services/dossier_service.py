import json
import uuid
import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any, Set
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.knowledge import (
    ExtractedFact,
    ExtractedEntity,
    EntityRelationship,
    FactCitation,
)
from app.models.continuity import HandoverDossier, KnowledgeConflict
from app.schemas.knowledge import (
    ExtractedFactDetailResponse,
    ExtractedEntityResponse,
    FactCitationResponse,
    RelationType,
)
from app.schemas.continuity import (
    HandoverDossierCreateRequest,
    HandoverDossierResponse,
    HandoverDossierListResponse,
    HandoverDossierContent,
    DossierChapter,
)
from app.services.intelligence_analyzer import OrganizationalIntelligenceService

logger = logging.getLogger(__name__)


class HandoverDossierService:
    """
    Compiles evidence-grounded Executive Transition Dossiers across organizational records.
    Synthesizes mandate overviews, ratified decisions, active duties, personnel trees,
    deadlines, risks, and a prioritized Day-1 to Day-30 operational roadmap.
    """

    @classmethod
    def generate_dossier(
        cls,
        db: Session,
        request: Optional[HandoverDossierCreateRequest] = None,
    ) -> HandoverDossierResponse:
        """
        Compiles a complete handover briefing book from persisted evidence.
        """
        req = request or HandoverDossierCreateRequest()

        # 1. Fetch organizational knowledge
        facts = db.query(ExtractedFact).order_by(ExtractedFact.created_at.asc()).all()
        entities = db.query(ExtractedEntity).order_by(ExtractedEntity.name.asc()).all()
        relationships = db.query(EntityRelationship).all()
        conflicts = db.query(KnowledgeConflict).filter(KnowledgeConflict.status == "open").all()
        if not conflicts:
            conflicts = OrganizationalIntelligenceService.run_analysis(db)
            conflicts = [c for c in conflicts if c.status == "open"]

        # 2. Identify Outgoing Leader and Incoming Successor
        outgoing_ent = None
        incoming_ent = None

        if req.outgoing_leader_name:
            outgoing_ent = next(
                (e for e in entities if req.outgoing_leader_name.lower() in e.canonical_name), None
            )
        if req.incoming_leader_name:
            incoming_ent = next(
                (e for e in entities if req.incoming_leader_name.lower() in e.canonical_name), None
            )

        # Fallback to relationship inference
        if not outgoing_ent:
            transfer_rel = next(
                (r for r in relationships if r.relation_type == RelationType.TRANSFERS_TO.value), None
            )
            if transfer_rel:
                outgoing_ent = transfer_rel.source_entity
                if not incoming_ent:
                    incoming_ent = transfer_rel.target_entity
            else:
                persons = [e for e in entities if e.category == "person"]
                if persons:
                    outgoing_ent = persons[0]
                    if len(persons) > 1 and not incoming_ent:
                        incoming_ent = persons[1]

        target_role = req.target_role or "Executive Leadership"
        dossier_title = req.title or f"Executive Briefing Book: {target_role} Transition"

        # 3. Assemble Structured Chapters
        chapters: List[DossierChapter] = []

        # Chapter 1: Strategic Decisions & Governance Ratifications
        decision_facts = [f for f in facts if f.category == "decision"]
        ch1_citations: List[FactCitationResponse] = []
        for f in decision_facts:
            ch1_citations.extend([FactCitationResponse.model_validate(c) for c in f.citations if c.verification_status == "valid"])

        chapters.append(
            DossierChapter(
                chapter_id="ch1",
                title="Strategic Decisions & Governance Ratifications",
                summary=(
                    f"Catalog of {len(decision_facts)} confirmed institutional decisions and governance commitments "
                    f"established prior to the handover. All entries are grounded in primary deposition records."
                ),
                facts=[ExtractedFactDetailResponse.model_validate(f) for f in decision_facts],
                citations=ch1_citations,
                action_items=[
                    f"Validate continuity status for decision: '{f.statement[:80]}...'"
                    for f in decision_facts[:3]
                ],
            )
        )

        # Chapter 2: Operational Responsibilities & Stewardship Transfers
        resp_facts = [f for f in facts if f.category == "responsibility"]
        transfer_rels = [r for r in relationships if r.relation_type == RelationType.TRANSFERS_TO.value]
        ch2_citations: List[FactCitationResponse] = []
        for f in resp_facts:
            ch2_citations.extend([FactCitationResponse.model_validate(c) for c in f.citations if c.verification_status == "valid"])

        ch2_actions = [
            f"Execute signatory handover from {r.source_entity.name if r.source_entity else 'Leader'} to {r.target_entity.name if r.target_entity else 'Successor'}."
            for r in transfer_rels
        ]
        if not ch2_actions:
            ch2_actions = ["Confirm administrative directorship delegations across all operational divisions."]

        chapters.append(
            DossierChapter(
                chapter_id="ch2",
                title="Operational Responsibilities & Stewardship Transfers",
                summary=(
                    f"Formal operational delegations and asset stewardship obligations. "
                    f"Identifies {len(resp_facts)} active responsibilities and {len(transfer_rels)} explicit personnel transfers."
                ),
                facts=[ExtractedFactDetailResponse.model_validate(f) for f in resp_facts],
                citations=ch2_citations,
                action_items=ch2_actions,
            )
        )

        # Chapter 3: Contractual Commitments & Critical Deadlines
        deadline_facts = [f for f in facts if f.category in ["commitment", "deadline"]]
        ch3_citations: List[FactCitationResponse] = []
        for f in deadline_facts:
            ch3_citations.extend([FactCitationResponse.model_validate(c) for c in f.citations if c.verification_status == "valid"])

        chapters.append(
            DossierChapter(
                chapter_id="ch3",
                title="Contractual Commitments & Critical Deadlines",
                summary=(
                    f"Summary of {len(deadline_facts)} binding commitments, vendor obligations, and milestone dates "
                    f"governing the transition window."
                ),
                facts=[ExtractedFactDetailResponse.model_validate(f) for f in deadline_facts],
                citations=ch3_citations,
                action_items=[
                    f"Review deadline for '{f.statement[:70]}...' ({f.deadline.strftime('%b %d, %Y') if f.deadline else 'Schedule pending'})."
                    for f in deadline_facts if f.deadline
                ] or ["Audit vendor auto-renewal calendar against budget allocations."],
            )
        )

        # Chapter 4: Operational Risks & System Dependencies
        risk_facts = [f for f in facts if f.category == "risk"]
        ch4_citations: List[FactCitationResponse] = []
        for f in risk_facts:
            ch4_citations.extend([FactCitationResponse.model_validate(c) for c in f.citations if c.verification_status == "valid"])

        chapters.append(
            DossierChapter(
                chapter_id="ch4",
                title="Operational Risks & System Dependencies",
                summary=(
                    f"Catalog of {len(risk_facts)} identified operational vulnerabilities, transitional hazards, "
                    f"and critical project dependencies."
                ),
                facts=[ExtractedFactDetailResponse.model_validate(f) for f in risk_facts],
                citations=ch4_citations,
                action_items=[
                    f"Deploy mitigation buffer for risk: '{f.statement[:80]}...'"
                    for f in risk_facts[:3]
                ],
            )
        )

        # Chapter 5: Discrepancies, Active Inconsistencies & Evidence Gaps
        ch5_actions = [
            f"Adjudicate discrepancy '{c.title}': {c.description[:100]}..."
            for c in conflicts[:5]
        ]
        ch5_facts: List[ExtractedFactDetailResponse] = []
        ch5_citations: List[FactCitationResponse] = []
        seen_fact_ids: Set[str] = set()

        for c in conflicts:
            if c.fact_a and c.fact_a.id not in seen_fact_ids:
                seen_fact_ids.add(c.fact_a.id)
                ch5_facts.append(ExtractedFactDetailResponse.model_validate(c.fact_a))
                for cit in c.fact_a.citations:
                    if cit.verification_status == "valid":
                        ch5_citations.append(FactCitationResponse.model_validate(cit))
            if c.fact_b and c.fact_b.id not in seen_fact_ids:
                seen_fact_ids.add(c.fact_b.id)
                ch5_facts.append(ExtractedFactDetailResponse.model_validate(c.fact_b))
                for cit in c.fact_b.citations:
                    if cit.verification_status == "valid":
                        ch5_citations.append(FactCitationResponse.model_validate(cit))

        chapters.append(
            DossierChapter(
                chapter_id="ch5",
                title="Discrepancies, Active Inconsistencies & Evidence Gaps",
                summary=(
                    f"Identified {len(conflicts)} matters requiring formal clarification before transition sign-off, "
                    f"including record contradictions, unassigned project ownership, and evidence gaps."
                ),
                facts=ch5_facts,
                citations=ch5_citations,
                action_items=ch5_actions or ["All primary records are consistent. Zero open contradictions."],
            )
        )

        # 4. Synthesize Executive Narrative and Roadmap
        executive_summary = (
            f"This Executive Briefing Book compiles all verified institutional knowledge for the {target_role} transition. "
            f"Across {len(facts)} ratified facts, {len(entities)} indexed entities, and {len(relationships)} relational dependencies, "
            f"this dossier provides complete traceability back to original document excerpts."
        )

        mandate_overview = (
            f"The outgoing authority ({outgoing_ent.name if outgoing_ent else 'Executive'}) relinquishes administrative oversight, "
            f"signatory powers, and project directorship to the incoming successor ({incoming_ent.name if incoming_ent else 'Successor'}). "
            f"Key responsibilities encompass {len(decision_facts)} core governance decisions and {len(risk_facts)} monitored risks."
        )

        roadmap_actions = [
            "Day 1-7: Conduct formal bilateral briefing between outgoing and incoming leadership on all active projects.",
            "Day 1-7: Review critical blockers and schedule execution of any upcoming deadline filings.",
            "Day 8-14: Adjudicate all open knowledge discrepancies in the Switch interface.",
            "Day 15-21: Audit vendor contracts and verify delegation of administrative financial limits.",
            "Day 22-30: Execute final transition protocol sign-offs and archive updated governance charter.",
        ]

        dossier_content = HandoverDossierContent(
            executive_summary=executive_summary,
            mandate_overview=mandate_overview,
            chapters=chapters,
            recommended_day_1_to_30_actions=roadmap_actions,
        )

        # 5. Persist or increment version
        existing_dossier = (
            db.query(HandoverDossier)
            .filter(HandoverDossier.title == dossier_title)
            .order_by(desc(HandoverDossier.version))
            .first()
        )
        new_version = (existing_dossier.version + 1) if existing_dossier else 1

        dossier_record = HandoverDossier(
            id=str(uuid.uuid4()),
            title=dossier_title,
            target_role=target_role,
            outgoing_leader_id=outgoing_ent.id if outgoing_ent else None,
            incoming_leader_id=incoming_ent.id if incoming_ent else None,
            status="generated",
            version=new_version,
            content_json=json.dumps(dossier_content.model_dump(), default=str),
        )
        db.add(dossier_record)
        db.commit()
        db.refresh(dossier_record)

        logger.info("Compiled Handover Dossier '%s' v%d with %d chapters.", dossier_title, new_version, len(chapters))

        return HandoverDossierResponse(
            id=dossier_record.id,
            title=dossier_record.title,
            target_role=dossier_record.target_role,
            outgoing_leader=ExtractedEntityResponse.model_validate(outgoing_ent) if outgoing_ent else None,
            incoming_leader=ExtractedEntityResponse.model_validate(incoming_ent) if incoming_ent else None,
            status=dossier_record.status,
            version=dossier_record.version,
            content=dossier_content,
            created_at=dossier_record.created_at,
            updated_at=dossier_record.updated_at,
        )

    @classmethod
    def get_dossier(cls, db: Session, dossier_id: str) -> Optional[HandoverDossierResponse]:
        """Fetches a specific generated dossier by ID."""
        dossier = db.query(HandoverDossier).filter(HandoverDossier.id == dossier_id).first()
        if not dossier:
            return None

        content_dict = json.loads(dossier.content_json)
        return HandoverDossierResponse(
            id=dossier.id,
            title=dossier.title,
            target_role=dossier.target_role,
            outgoing_leader=ExtractedEntityResponse.model_validate(dossier.outgoing_leader) if dossier.outgoing_leader else None,
            incoming_leader=ExtractedEntityResponse.model_validate(dossier.incoming_leader) if dossier.incoming_leader else None,
            status=dossier.status,
            version=dossier.version,
            content=HandoverDossierContent.model_validate(content_dict),
            created_at=dossier.created_at,
            updated_at=dossier.updated_at,
        )

    @classmethod
    def list_dossiers(cls, db: Session) -> HandoverDossierListResponse:
        """Lists all compiled dossiers ordered newest first."""
        dossiers = db.query(HandoverDossier).order_by(desc(HandoverDossier.created_at)).all()
        items = []
        for d in dossiers:
            content_dict = json.loads(d.content_json)
            items.append(
                HandoverDossierResponse(
                    id=d.id,
                    title=d.title,
                    target_role=d.target_role,
                    outgoing_leader=ExtractedEntityResponse.model_validate(d.outgoing_leader) if d.outgoing_leader else None,
                    incoming_leader=ExtractedEntityResponse.model_validate(d.incoming_leader) if d.incoming_leader else None,
                    status=d.status,
                    version=d.version,
                    content=HandoverDossierContent.model_validate(content_dict),
                    created_at=d.created_at,
                    updated_at=d.updated_at,
                )
            )
        return HandoverDossierListResponse(items=items, total=len(items))

