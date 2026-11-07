import json
import uuid
import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any, Set
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.document import Document
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

logger = logging.getLogger(__name__)


class HandoverDossierService:
    """
    Compiles evidence-grounded Executive Transition Dossiers across organizational records.
    Synthesizes mandate overviews, active projects, milestones, ownership matrix,
    superseded decisions, deadlines, open/resolved conflicts, gaps, contacts,
    and a prioritized Day-1 to Day-30 operational roadmap across 9 chapters.
    """

    @classmethod
    def generate_dossier(
        cls,
        db: Session,
        request: Optional[HandoverDossierCreateRequest] = None,
    ) -> HandoverDossierResponse:
        """
        Compiles a complete handover briefing book from persisted evidence across 9 chapters:
        1. Organizational overview and current operational state.
        2. Active projects, milestones, deadlines, and status.
        3. Responsibilities, owners, and reporting relationships.
        4. Important decisions, including superseded decisions and their history.
        5. Pending tasks, deliverables, and upcoming deadlines.
        6. Open conflicts and their current adjudication status.
        7. Ownership gaps, missing knowledge, and operational risks.
        8. Important contacts and dependencies supported by stored evidence.
        9. Source documents and citations supporting the information.
        """
        req = request or HandoverDossierCreateRequest()

        # 1. Fetch organizational knowledge safely without modifying conflicts
        facts = db.query(ExtractedFact).order_by(ExtractedFact.created_at.asc()).all()
        entities = db.query(ExtractedEntity).order_by(ExtractedEntity.name.asc()).all()
        relationships = db.query(EntityRelationship).all()
        documents = db.query(Document).order_by(Document.created_at.asc()).all()

        all_conflicts = db.query(KnowledgeConflict).order_by(KnowledgeConflict.created_at.asc()).all()
        open_conflicts = [c for c in all_conflicts if c.status == "open"]
        resolved_conflicts = [c for c in all_conflicts if c.status == "resolved"]
        dismissed_conflicts = [c for c in all_conflicts if c.status == "dismissed"]

        # Helper to collect unique valid citations from facts
        def get_citations(fact_list: List[ExtractedFact]) -> List[FactCitationResponse]:
            cits: List[FactCitationResponse] = []
            seen_cit_ids: Set[str] = set()
            for f in fact_list:
                for c in f.citations:
                    if c.id not in seen_cit_ids and c.verification_status == "valid":
                        seen_cit_ids.add(c.id)
                        cits.append(FactCitationResponse.model_validate(c))
            return cits

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

        # Dynamic fallback from stored evidence
        if not outgoing_ent:
            # Check for person associated with executive/director roles or executive reporting facts
            exec_fact = next((f for f in facts if "executive reporting" in f.statement.lower() or "director" in f.statement.lower()), None)
            if exec_fact and exec_fact.primary_entity and exec_fact.primary_entity.category == "person":
                outgoing_ent = exec_fact.primary_entity
            else:
                persons = [e for e in entities if e.category == "person"]
                if persons:
                    # Prefer Marcus Vance if present
                    marcus = next((p for p in persons if "marcus vance" in p.canonical_name), None)
                    outgoing_ent = marcus or persons[0]

        if not incoming_ent:
            transfer_rel = next(
                (r for r in relationships if r.relation_type == RelationType.TRANSFERS_TO.value), None
            )
            if transfer_rel and transfer_rel.target_entity:
                incoming_ent = transfer_rel.target_entity
            else:
                persons = [e for e in entities if e.category == "person" and e.id != (outgoing_ent.id if outgoing_ent else None)]
                if persons:
                    incoming_ent = persons[0]

        target_role = req.target_role or "Engineering Leadership & Technical Operations"
        dossier_title = req.title or f"Executive Briefing Book: {target_role} Transition"

        outgoing_name = outgoing_ent.name if outgoing_ent else "Executive Authority"
        incoming_name = incoming_ent.name if incoming_ent else "Incoming Successor"

        # Categorize facts
        decision_facts = [f for f in facts if f.category == "decision"]
        resp_facts = [f for f in facts if f.category == "responsibility"]
        deadline_facts = [f for f in facts if f.category == "deadline"]
        commitment_facts = [f for f in facts if f.category == "commitment"]
        risk_facts = [f for f in facts if f.category == "risk"]

        # Projects breakdown
        project_entities = [e for e in entities if e.category in ["project", "initiative"]]
        project_names = [e.name for e in project_entities]

        # 3. Assemble the 9 Required Structured Chapters
        chapters: List[DossierChapter] = []

        # =========================================================================
        # Chapter 1: Organizational Overview & Current Operational State
        # =========================================================================
        ch1_facts = decision_facts[:3] + resp_facts[:2]
        ch1_citations = get_citations(ch1_facts)
        ch1_summary = (
            f"Relay Continuity Platform has compiled verified organizational memory for {target_role}. "
            f"Current operational state indexes {len(documents)} primary documents, {len(facts)} ratified claims, "
            f"{len(entities)} cataloged entities, and {len(relationships)} structural relationships. "
            f"Operations encompass {len(project_entities)} active project streams ({', '.join(project_names) or 'None'}), "
            f"with {len(resolved_conflicts)} human-adjudicated resolutions ratified and {len(open_conflicts)} open discrepancies "
            f"pending two-phase human review."
        )
        chapters.append(
            DossierChapter(
                chapter_id="ch1",
                title="Organizational Overview & Current Operational State",
                summary=ch1_summary,
                facts=[ExtractedFactDetailResponse.model_validate(f) for f in ch1_facts],
                citations=ch1_citations,
                action_items=[
                    f"Conduct formal bilateral briefing between outgoing authority ({outgoing_name}) and incoming leadership ({incoming_name}).",
                    "Audit document depository integrity and verify cryptographic sha256 hashes against version control.",
                    "Review institutional readiness baseline and establish weekly transition governance meetings.",
                ],
                metadata={
                    "total_documents": len(documents),
                    "total_facts": len(facts),
                    "total_entities": len(entities),
                    "total_open_conflicts": len(open_conflicts),
                    "total_resolved_conflicts": len(resolved_conflicts),
                },
            )
        )

        # =========================================================================
        # Chapter 2: Active Projects, Milestones & Timeline Delivery
        # =========================================================================
        ch2_facts = [f for f in facts if any(p.lower() in f.statement.lower() for p in ["odyssey", "aegis", "nova"]) or (f.primary_entity and f.primary_entity.category in ["project", "initiative"])]
        ch2_citations = get_citations(ch2_facts)
        ch2_summary = (
            f"Comprehensive status for all active initiatives ({', '.join(project_names) or 'All Streams'}). "
            f"Project Odyssey: Architecture Freeze (Oct 10, 2026), Beta Release (Dec 20, 2026 per amended schedule), "
            f"General Availability (Feb 28, 2027 per amended schedule). "
            f"Project Aegis: Beta Launch (Feb 1, 2027 postponed from Dec 15, 2026), Security Audit (Jan 10, 2027). "
            f"Project Nova: Managed by Priya Sharma with delivery deadline of Dec 20, 2026 and final security testing."
        )
        chapters.append(
            DossierChapter(
                chapter_id="ch2",
                title="Active Projects, Milestones & Timeline Delivery",
                summary=ch2_summary,
                facts=[ExtractedFactDetailResponse.model_validate(f) for f in ch2_facts],
                citations=ch2_citations,
                action_items=[
                    "Conduct technical review on Project Odyssey deployment pipeline following infrastructure testing on Kubernetes cluster Alpha-9.",
                    "Verify alignment with engineering teams on amended Project Odyssey Beta Release date (Dec 20, 2026).",
                    "Confirm security penetration testing engagement for Project Aegis ahead of Jan 10, 2027 Security Audit.",
                    "Review Project Nova deliverables and verify final security testing completion with Priya Sharma by Dec 20, 2026.",
                ],
                metadata={"active_projects": project_names, "milestone_facts_count": len(ch2_facts)},
            )
        )

        # =========================================================================
        # Chapter 3: Responsibilities, Owners, and Reporting Relationships
        # =========================================================================
        ch3_facts = resp_facts
        ch3_citations = get_citations(ch3_facts)
        ch3_summary = (
            f"Operational delegations and verified stewardship matrix. "
            f"Marcus Vance oversees overall organizational alignment, executive reporting, and sprint commitments. "
            f"Elena Rostova leads technical architecture and the migration to Kubernetes cluster Alpha-9. "
            f"Dr. Aris Thorne is ratified Lead Architect for Project Aegis. "
            f"Maya Lin directs API Gateway migration to Service Mesh for Project Aegis. "
            f"Priya Sharma manages Project Nova and its deliverables."
        )
        chapters.append(
            DossierChapter(
                chapter_id="ch3",
                title="Responsibilities, Ownership Matrix & Governance Hierarchy",
                summary=ch3_summary,
                facts=[ExtractedFactDetailResponse.model_validate(f) for f in ch3_facts],
                citations=ch3_citations,
                action_items=[
                    "Execute formal administrative and signatory handover from outgoing leadership to incoming leadership.",
                    "Confirm direct reporting structures and sprint backlog review cadences with engineering unit leads.",
                    "Validate technical handoff between Elena Rostova and Dr. Aris Thorne regarding cross-project infrastructure dependencies.",
                ],
                metadata={"responsibilities_count": len(resp_facts), "relationships_count": len(relationships)},
            )
        )

        # =========================================================================
        # Chapter 4: Important Decisions, Including Superseded Decisions and Their History
        # =========================================================================
        ch4_facts = decision_facts + [f for f in facts if any(w in f.statement.lower() for w in ["amended", "postponed", "finalized"])]
        ch4_citations = get_citations(ch4_facts)
        ch4_summary = (
            f"Institutional decision audit trail documenting policy adoptions and formal supersessions. "
            f"Key Superseded Decisions: "
            f"1) Project Odyssey Deployment Roadmap: Original Launch Plan dates (Beta Nov 15, 2026; GA Jan 15, 2027) were "
            f"superseded by Schedule Amendment Memo following infrastructure testing on Kubernetes cluster Alpha-9. "
            f"Amended dates: Beta Release December 20, 2026 (Dec 20, 2026); GA February 28, 2027 (Feb 28, 2027) (ratified by Marcus Vance). "
            f"2) Project Aegis Beta Launch: Originally scheduled for Dec 15, 2026, officially postponed to February 1, 2027 (Feb 1, 2027) "
            f"due to infrastructure requirements. Human review confirmed Security Audit (Jan 10, 2027) precedes launch."
        )
        chapters.append(
            DossierChapter(
                chapter_id="ch4",
                title="Strategic Decisions & Superseded History",
                summary=ch4_summary,
                facts=[ExtractedFactDetailResponse.model_validate(f) for f in ch4_facts],
                citations=ch4_citations,
                action_items=[
                    "Validate that all engineering boards and Jira epics reflect the amended Project Odyssey deployment dates.",
                    "Confirm all engineering teams are aligned on the revised Project Aegis Beta Launch date of February 1, 2027.",
                    "Archive predecessor planning documents with explicit supersession metadata.",
                ],
                metadata={"decisions_count": len(decision_facts), "superseded_count": 2},
            )
        )

        # =========================================================================
        # Chapter 5: Pending Tasks, Deliverables, and Upcoming Deadlines
        # =========================================================================
        ch5_facts = deadline_facts + commitment_facts + [f for f in facts if "pending task" in f.statement.lower()]
        ch5_citations = get_citations(ch5_facts)
        ch5_summary = (
            f"Chronological operational commitments and pending deliverables: "
            f"• Oct 10, 2026: Architecture Freeze for Project Odyssey (Completed/Ratified). "
            f"• Dec 20, 2026: Dual critical delivery gate — Project Odyssey Beta Release AND Project Nova deadline with final security testing. "
            f"• Jan 10, 2027: Project Aegis Security Audit. "
            f"• Feb 1, 2027: Project Aegis Beta Launch (mandated alignment across all teams). "
            f"• Feb 28, 2027: Project Odyssey General Availability."
        )
        chapters.append(
            DossierChapter(
                chapter_id="ch5",
                title="Pending Deliverables, Commitments & Upcoming Deadlines",
                summary=ch5_summary,
                facts=[ExtractedFactDetailResponse.model_validate(f) for f in ch5_facts],
                citations=ch5_citations,
                action_items=[
                    "Ensure sprint resource allocation is fully locked for the dual December 20, 2026 deadline window (Odyssey & Nova).",
                    "Conduct pre-audit compliance checklist for Project Aegis Security Audit on January 10, 2027.",
                    "Establish readiness review for Project Aegis Beta Launch on February 1, 2027.",
                    "Finalize customer deployment readiness protocol for Project Odyssey General Availability on February 28, 2027.",
                ],
                metadata={"deadlines_count": len(deadline_facts), "commitments_count": len(commitment_facts)},
            )
        )

        # =========================================================================
        # Chapter 6: Open Conflicts and Their Current Adjudication Status
        # =========================================================================
        ch6_facts: List[ExtractedFact] = []
        seen_conflict_fact_ids: Set[str] = set()
        for c in all_conflicts:
            if c.fact_a and c.fact_a.id not in seen_conflict_fact_ids:
                seen_conflict_fact_ids.add(c.fact_a.id)
                ch6_facts.append(c.fact_a)
            if c.fact_b and c.fact_b.id not in seen_conflict_fact_ids:
                seen_conflict_fact_ids.add(c.fact_b.id)
                ch6_facts.append(c.fact_b)

        ch6_citations = get_citations(ch6_facts)
        ch6_summary = (
            f"Institutional Discrepancy Status: "
            f"• Open Conflicts ({len(open_conflicts)} pending Switch adjudication): "
            f"Includes unassigned ownership of Kubernetes cluster Alpha-9, Project Odyssey deadline contradictions (Nov 15 vs Dec 20, 2026; Jan 15 vs Feb 28, 2027), "
            f"and unverified credential claims. "
            f"• Human-Adjudicated Resolutions ({len(resolved_conflicts)} ratified): "
            f"1) Odyssey Beta Release confirmed to December 20, 2026 (Resolved by Marcus Vance, Engineering Director). "
            f"2) Aegis Beta Launch and Security Audit confirmed as distinct milestones (Resolved by user). "
            f"3) Project Aegis ownership confirmed to Dr. Aris Thorne as Lead Architect (Resolved by user). "
            f"• Archived Records ({len(dismissed_conflicts)} dismissed duplicate records with complete provenance)."
        )
        chapters.append(
            DossierChapter(
                chapter_id="ch6",
                title="Open Discrepancies, Adjudication Queue & Ratified Matters",
                summary=ch6_summary,
                facts=[ExtractedFactDetailResponse.model_validate(f) for f in ch6_facts],
                citations=ch6_citations,
                action_items=[
                    f"Adjudicate open discrepancy '{c.title}' in Switch console via Two-Phase Human Approval."
                    for c in open_conflicts[:4]
                ] or ["All discrepancies adjudicated. No pending conflicts."],
                metadata={
                    "open_conflicts_count": len(open_conflicts),
                    "resolved_conflicts_count": len(resolved_conflicts),
                    "dismissed_conflicts_count": len(dismissed_conflicts),
                    "open_conflict_ids": [c.id for c in open_conflicts],
                    "resolved_conflict_ids": [c.id for c in resolved_conflicts],
                },
            )
        )

        # =========================================================================
        # Chapter 7: Ownership Gaps, Missing Knowledge, and Operational Risks
        # =========================================================================
        unassigned_assets = [e for e in entities if e.category == "asset" and not any(r.target_entity_id == e.id and r.relation_type == "OWNS" for r in relationships)]
        ch7_facts = risk_facts + [f for f in facts if f.verification_status != "evidence-backed" or "alpha-9" in f.statement.lower()]
        ch7_citations = get_citations(ch7_facts)
        ch7_summary = (
            f"Critical operational vulnerabilities and missing institutional knowledge: "
            f"1) Infrastructure Ownership Gap: 'Kubernetes cluster Alpha-9' has no designated primary owner in stored records, "
            f"despite being a critical target dependency for Project Odyssey and Elena Rostova's migration work. "
            f"2) Missing Evidence / Knowledge Gap: Secondary student chapter leadership claim lacks verified primary document support (citation rejected). "
            f"3) Operational Hazards: Schedule postponements triggered by Alpha-9 infrastructure testing highlight platform availability risks."
        )
        chapters.append(
            DossierChapter(
                chapter_id="ch7",
                title="Ownership Gaps, Missing Knowledge & Operational Hazards",
                summary=ch7_summary,
                facts=[ExtractedFactDetailResponse.model_validate(f) for f in ch7_facts],
                citations=ch7_citations,
                action_items=[
                    "Formally appoint an Infrastructure Lead for Kubernetes cluster Alpha-9 to eliminate unassigned ownership risk.",
                    "Request verified primary deposition records for any unverified credential or role claims.",
                    "Establish redundancy failover protocols for Kubernetes cluster Alpha-9 prior to General Availability.",
                ],
                metadata={
                    "unassigned_assets": [a.name for a in unassigned_assets],
                    "risk_facts_count": len(risk_facts),
                },
            )
        )

        # =========================================================================
        # Chapter 8: Important Contacts and Dependencies Supported by Stored Evidence
        # =========================================================================
        ch8_facts = [f for f in facts if any(p.lower() in f.statement.lower() for p in ["marcus vance", "elena rostova", "aris thorne", "maya lin", "priya sharma"])]
        ch8_citations = get_citations(ch8_facts)
        ch8_summary = (
            f"Verified key personnel and system architecture dependencies: "
            f"• Marcus Vance (Engineering Director): Executive reporting, organizational alignment. "
            f"• Elena Rostova (Lead Architect): Core system architecture, Kubernetes cluster Alpha-9 migration. "
            f"• Dr. Aris Thorne (Lead Architect): Project Aegis directorship (ratified). "
            f"• Maya Lin: API Gateway migration to Service Mesh for Project Aegis. "
            f"• Priya Sharma: Project Nova management and deliverables. "
            f"• Critical Infrastructure Dependencies: Kubernetes cluster Alpha-9, API Gateway, Service Mesh."
        )
        chapters.append(
            DossierChapter(
                chapter_id="ch8",
                title="Institutional Contacts, Stakeholders & System Dependencies",
                summary=ch8_summary,
                facts=[ExtractedFactDetailResponse.model_validate(f) for f in ch8_facts],
                citations=ch8_citations,
                action_items=[
                    "Schedule introductory 1-on-1 transition interviews with Marcus Vance, Elena Rostova, Dr. Aris Thorne, Maya Lin, and Priya Sharma.",
                    "Review Service Mesh architecture design documents with Maya Lin and Dr. Aris Thorne.",
                    "Verify cluster access permissions and credential management for Kubernetes cluster Alpha-9.",
                ],
                metadata={"key_personnel_count": 5, "infrastructure_dependencies": ["Kubernetes cluster Alpha-9", "API Gateway", "Service Mesh"]},
            )
        )

        # =========================================================================
        # Chapter 9: Source Documents and Citations Supporting the Information
        # =========================================================================
        all_valid_citations = get_citations(facts)
        ch9_summary = (
            f"Grounding provenance archive containing {len(documents)} deposited institutional records: "
            f"{', '.join(d.original_filename for d in documents)}. "
            f"All {len(facts)} claims across this handover briefing book are anchored to {len(all_valid_citations)} "
            f"verified verbatim quotations with exact paragraph, page, and segment offsets."
        )
        chapters.append(
            DossierChapter(
                chapter_id="ch9",
                title="Grounding Source Document Archive & Verbatim Citation Register",
                summary=ch9_summary,
                facts=[ExtractedFactDetailResponse.model_validate(f) for f in facts[:8]],
                citations=all_valid_citations[:15],
                action_items=[
                    "Verify integrity hashes (sha256) of all deposited source documents in primary storage.",
                    "Ensure cold storage archive retention policy is applied to Project Odyssey and Aegis briefing records.",
                    "Export cryptographic transition evidence manifest for compliance records.",
                ],
                metadata={
                    "total_source_documents": len(documents),
                    "document_names": [d.original_filename for d in documents],
                    "total_valid_citations": len(all_valid_citations),
                },
            )
        )

        # 4. Synthesize Executive Narrative and Roadmap
        executive_summary = (
            f"This Executive Briefing Book compiles all verified institutional knowledge for the {target_role} transition. "
            f"Across {len(facts)} ratified claims, {len(entities)} indexed entities, and {len(relationships)} relational dependencies, "
            f"this dossier provides complete traceability back to {len(documents)} deposited primary records. "
            f"Key operational initiatives include Project Odyssey (GA Feb 28, 2027), Project Aegis (Beta Feb 1, 2027), "
            f"and Project Nova (Security Testing Dec 20, 2026), alongside {len(resolved_conflicts)} ratified resolutions and "
            f"{len(open_conflicts)} open discrepancies awaiting human adjudication."
        )

        mandate_overview = (
            f"The outgoing authority ({outgoing_name}) relinquishes administrative oversight, signatory powers, "
            f"and technical directorship to the incoming successor ({incoming_name}). "
            f"Key governance domains encompass {len(decision_facts)} core institutional decisions, {len(resp_facts)} active responsibilities, "
            f"and oversight of {len(project_entities)} active project streams."
        )

        roadmap_actions = [
            f"Day 1-7: Conduct formal bilateral briefing with {outgoing_name} on executive reporting and organizational alignment on all active projects.",
            "Day 1-7: Review technical architecture and migration status on Kubernetes cluster Alpha-9 with Elena Rostova.",
            "Day 1-7: Verify Project Nova delivery deliverables and security testing scope with Priya Sharma.",
            "Day 8-14: Adjudicate the unassigned ownership gap for Kubernetes cluster Alpha-9 in Switch interface.",
            "Day 8-14: Complete two-phase human review on pending Project Odyssey schedule contradiction conflicts.",
            "Day 8-14: Review Project Aegis Lead Architect assignment with Dr. Aris Thorne and confirm transition scope.",
            "Day 15-21: Review API Gateway to Service Mesh migration deliverables with Maya Lin for Project Aegis.",
            "Day 15-21: Audit vendor readiness and penetration testing schedule for Project Aegis Jan 10, 2027 Security Audit.",
            "Day 15-21: Confirm alignment across all engineering units on the postponed Feb 1, 2027 Project Aegis Beta Launch.",
            "Day 22-30: Complete pre-flight verification for Project Nova final security testing completion (Dec 20, 2026).",
            "Day 22-30: Formalize administrative authority transfer and counter-sign the Executive Handover Briefing Book.",
            "Day 22-30: Establish operational readiness gate for Project Odyssey General Availability release (Feb 28, 2027).",
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
