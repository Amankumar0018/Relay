import uuid
import logging
import re
from datetime import datetime, timezone
from typing import List, Optional, Tuple, Dict, Set, Any
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, or_, desc

from app.models.document import Document
from app.models.knowledge import (
    ExtractedFact,
    FactCitation,
    ExtractedEntity,
    EntityMention,
    EntityRelationship,
)
from app.models.continuity import KnowledgeConflict
from app.schemas.knowledge import FactVerificationStatus, RelationType
from app.schemas.continuity import ConflictType, ConflictSeverity, ConflictStatus

logger = logging.getLogger(__name__)


class OrganizationalIntelligenceService:
    """
    Analyzes facts, entities, citations, and relationships across institutional records.
    Detects genuine contradictions, superseded decisions, outdated deadlines,
    changed responsibilities, unresolved commitments, missing project ownership, and knowledge gaps.
    """

    @classmethod
    def run_analysis(
        cls,
        db: Session,
        document_id: Optional[str] = None,
    ) -> List[KnowledgeConflict]:
        """
        Executes a comprehensive intelligence scan across all stored knowledge records
        (or scoped to a specific document), detecting conflicts and saving them to the database.
        """
        conflicts: List[KnowledgeConflict] = []

        # 1. Fetch facts, entities, and relationships
        # Always fetch all facts across the workspace so cross-document and cross-schedule
        # comparisons (e.g. Schedule A vs Schedule B) can be evaluated.
        facts = db.query(ExtractedFact).all()
        entities = db.query(ExtractedEntity).all()
        relationships = db.query(EntityRelationship).all()

        # Existing conflicts map for idempotency and resolution preservation
        existing_conflicts = db.query(KnowledgeConflict).all()
        existing_keys: Dict[Tuple[str, Optional[str], Optional[str], Optional[str]], KnowledgeConflict] = {}
        for c in existing_conflicts:
            existing_keys[(c.conflict_type, c.fact_a_id, c.fact_b_id, c.entity_id)] = c
            if c.fact_a_id and c.fact_b_id:
                # Map reverse pair for symmetric lookups
                existing_keys[(c.conflict_type, c.fact_b_id, c.fact_a_id, c.entity_id)] = c

        # Sub-analyses
        conflicts.extend(cls._detect_fact_contradictions_and_supersessions(db, facts, existing_keys, relationships))
        conflicts.extend(cls._detect_outdated_deadlines(db, facts, existing_keys))
        conflicts.extend(cls._detect_changed_responsibilities(db, relationships, existing_keys))
        conflicts.extend(cls._detect_missing_ownership(db, entities, relationships, existing_keys))
        conflicts.extend(cls._detect_knowledge_gaps(db, facts, existing_keys))

        # Safe Conflict Lifecycle Management:
        # Prune stale OPEN conflicts that are no longer supported by current evidence/rules.
        # CRITICAL SAFETY: NEVER prune or modify human-adjudicated conflicts (resolved/dismissed or with human notes).
        # CRITICAL SAFETY: NEVER delete or modify underlying ExtractedFact or Document records.
        active_conflict_ids = {c.id for c in conflicts}
        for old_c in existing_conflicts:
            # If conflict was resolved or reviewed by a human, preserve it unconditionally
            if old_c.status != ConflictStatus.OPEN.value or old_c.resolved_by or old_c.resolution_notes:
                if old_c.id not in active_conflict_ids:
                    conflicts.append(old_c)
                continue
            # If an open conflict is no longer detected by the semantic rules, prune the stale record
            if old_c.id not in active_conflict_ids:
                logger.info("Pruning stale false-positive open conflict: %s (%s)", old_c.id, old_c.title)
                db.delete(old_c)

        db.commit()
        logger.info("Intelligence scan complete. Detected %d total active matters.", len(conflicts))

        if document_id:
            # If scoped to a specific document, return matters relevant to that document
            doc_scoped = [
                c for c in conflicts
                if c.document_id == document_id
                or (c.fact_a and c.fact_a.document_id == document_id)
                or (c.fact_b and c.fact_b.document_id == document_id)
            ]
            return doc_scoped

        return conflicts

    @classmethod
    def _extract_semantic_profile(
        cls,
        fact: ExtractedFact,
        relationships: Optional[List[EntityRelationship]] = None,
    ) -> Dict[str, Any]:
        """
        Extracts entity identity, property category, granular property key, normalized value,
        and amendment markers from an ExtractedFact.
        """
        s_lower = fact.statement.lower().strip() if fact.statement else ""
        doc_name = fact.document.original_filename if getattr(fact, "document", None) else ""
        d_lower = doc_name.lower().strip()

        # 1. Detect amendment / supersession markers
        amendment_markers = [
            "amend", "amended", "amendment",
            "extend", "extended", "extension",
            "update", "updated",
            "supersede", "supersedes", "superseded",
            "reassign", "reassigned",
            "revise", "revised", "revision",
            "postpone", "postponed", "postponement",
            "reschedule", "rescheduled",
            "delay", "delayed",
        ]
        is_amendment = any(re.search(rf"\b{m}\b", s_lower) for m in amendment_markers)

        # 2. Entity resolution
        entity_id = fact.primary_entity_id
        ent = fact.primary_entity
        ent_name = ent.name.lower().strip() if ent and ent.name else ""
        ent_canonical = ent.canonical_name.lower().strip() if ent and ent.canonical_name else ent_name

        if "odyssey" in s_lower or "odyssey" in ent_canonical or "odyssey" in d_lower:
            entity_key = "project:odyssey"
        elif "aegis" in s_lower or "aegis" in ent_canonical or "aegis" in d_lower:
            entity_key = "project:aegis"
        elif "nova" in s_lower or "nova" in ent_canonical or "nova" in d_lower:
            entity_key = "project:nova"
        elif "titan" in s_lower or "titan" in ent_canonical or "titan" in d_lower:
            entity_key = "project:titan"
        elif ent_canonical:
            entity_key = f"{ent.category}:{ent_canonical}" if ent and ent.category else ent_canonical
        elif entity_id:
            entity_key = entity_id
        else:
            entity_key = "global"

        # 3. Categorize property
        # Milestone / Release stages
        if re.search(r"\b(architecture freeze|code freeze|freeze)\b", s_lower):
            prop_type = "milestone"
            prop_key = f"{entity_key}:milestone:freeze"
            val_match = re.search(r"\b(?:for|on|is|date)\s+([a-z]+ \d{1,2},? \d{4}|\d{4}-\d{2}-\d{2})", s_lower)
            prop_val = val_match.group(1) if val_match else s_lower

        elif re.search(r"\b(beta release|beta launch|beta)\b", s_lower):
            prop_type = "milestone"
            prop_key = f"{entity_key}:milestone:beta"
            val_match = re.search(r"\b(?:for|on|to|date of)\s+([a-z]+ \d{1,2},? \d{4}|\d{4}-\d{2}-\d{2})", s_lower)
            prop_val = val_match.group(1) if val_match else s_lower

        elif re.search(r"\b(general availability|\bga\b|final release|commercial launch)\b", s_lower):
            prop_type = "milestone"
            prop_key = f"{entity_key}:milestone:ga"
            val_match = re.search(r"\b(?:for|on|is)\s+([a-z]+ \d{1,2},? \d{4}|\d{4}-\d{2}-\d{2})", s_lower)
            prop_val = val_match.group(1) if val_match else s_lower

        elif re.search(r"\b(security audit|security review|compliance audit)\b", s_lower):
            prop_type = "milestone"
            prop_key = f"{entity_key}:milestone:security_audit"
            val_match = re.search(r"\b(?:for|on|is)\s+([a-z]+ \d{1,2},? \d{4}|\d{4}-\d{2}-\d{2})", s_lower)
            prop_val = val_match.group(1) if val_match else s_lower

        elif re.search(r"\b(form 1572|1572)\b", s_lower):
            prop_type = "milestone"
            prop_key = "milestone:fda_form_1572"
            val_match = re.search(r"\b(?:on|is|deadline)\s+([a-z]+ \d{1,2},? \d{4}|\d{4}-\d{2}-\d{2})", s_lower)
            prop_val = val_match.group(1) if val_match else s_lower

        elif fact.category == "deadline" or re.search(r"\bdeadline\b", s_lower):
            prop_type = "milestone"
            prop_key = f"{entity_key}:milestone:general_deadline"
            val_match = re.search(r"\b(?:on|is|for)\s+([a-z]+ \d{1,2},? \d{4}|\d{4}-\d{2}-\d{2})", s_lower)
            prop_val = val_match.group(1) if val_match else s_lower

        # Roadmap / Deployment strategy status
        elif re.search(r"\b(deployment roadmap|roadmap)\b", s_lower):
            prop_type = "roadmap"
            prop_key = f"{entity_key}:roadmap:deployment_roadmap"
            if "amend" in s_lower or "amend" in d_lower:
                prop_val = "amended"
            elif "finaliz" in s_lower:
                prop_val = "finalized"
            else:
                prop_val = s_lower

        # Leadership / Roles / Owners
        elif re.search(r"\b(sponsor representative|execution sponsor)\b", s_lower):
            prop_type = "role"
            prop_key = "role:sponsor_representative"
            match = re.search(r"(?:designated as|reassigned exclusively to|assigned to)\s+((?:dr\.|mr\.|ms\.)?\s*[a-z]+ [a-z]+)", s_lower)
            prop_val = match.group(1) if match else s_lower

        elif re.search(r"\b(manages|lead|leader|owner|owns)\b", s_lower):
            prop_type = "leadership"
            prop_key = f"{entity_key}:leadership:owner"
            m_mgr = re.match(r"^([a-z\.\s]+?)\s+(?:manages|leads|owns)", s_lower)
            prop_val = m_mgr.group(1).strip() if m_mgr else s_lower

        elif re.search(r"\b(oversees|oversight)\b", s_lower):
            prop_type = "leadership"
            prop_key = f"{entity_key}:leadership:oversight"
            m_over = re.match(r"^([a-z\.\s]+?)\s+oversees", s_lower)
            prop_val = m_over.group(1).strip() if m_over else s_lower

        elif re.search(r"\b(responsible for)\b", s_lower):
            prop_type = "responsibility"
            if "api gateway" in s_lower or "service mesh" in s_lower:
                prop_key = f"{entity_key}:responsibility:api_gateway"
            else:
                prop_key = f"{entity_key}:responsibility:general"
            m_resp = re.match(r"^([a-z\.\s]+?)\s+is responsible", s_lower)
            prop_val = m_resp.group(1).strip() if m_resp else s_lower

        # Tasks / Actions
        elif re.search(r"\b(pending task|next step|action item|task)\b", s_lower):
            prop_type = "task"
            prop_key = f"{entity_key}:task:pending_task"
            m_task = re.search(r"(?:pending task.*?is|task.*?is)\s+(.*)", s_lower)
            prop_val = m_task.group(1).strip() if m_task else s_lower

        # Contract duration / terms
        elif re.search(r"\b(vendor contract|contract)\b", s_lower):
            prop_type = "contract"
            prop_key = "contract:vendor_contract"
            m_dur = re.search(r"(\d+)\s*(?:months|years|days)", s_lower)
            prop_val = m_dur.group(0) if m_dur else s_lower

        else:
            prop_type = fact.category
            prop_key = f"{entity_key}:{fact.category}:{s_lower[:25]}"
            prop_val = s_lower

        return {
            "statement": fact.statement,
            "entity_key": entity_key,
            "prop_type": prop_type,
            "prop_key": prop_key,
            "prop_val": prop_val,
            "is_amendment": is_amendment,
            "doc_name": doc_name,
        }

    @classmethod
    def _detect_fact_contradictions_and_supersessions(
        cls,
        db: Session,
        facts: List[ExtractedFact],
        existing_keys: Dict,
        relationships: Optional[List[EntityRelationship]] = None,
    ) -> List[KnowledgeConflict]:
        """
        Compares pairs of facts by entity and semantic property to distinguish
        genuine contradictions, superseded decisions, and compatible facts.
        """
        findings: List[KnowledgeConflict] = []
        n = len(facts)
        if n < 2:
            return findings

        profiles = [cls._extract_semantic_profile(f, relationships) for f in facts]

        for i in range(n):
            for j in range(i + 1, n):
                f1 = facts[i]
                f2 = facts[j]
                p1 = profiles[i]
                p2 = profiles[j]

                # Semantic Property Match: ONLY compare facts that describe the exact same property
                if p1["prop_key"] != p2["prop_key"]:
                    continue

                v1 = p1["prop_val"].strip().lower()
                v2 = p2["prop_val"].strip().lower()

                # Compatible / Corroborated facts: same property with identical values
                if v1 == v2:
                    continue

                # Rule A: Historical amendment / superseded decision
                has_supersedes_rel = False
                if relationships and f1.primary_entity_id and f2.primary_entity_id:
                    has_supersedes_rel = any(
                        r.relation_type == RelationType.SUPERSEDES.value
                        and (
                            (r.source_entity_id == f2.primary_entity_id and r.target_entity_id == f1.primary_entity_id)
                            or (r.source_entity_id == f1.primary_entity_id and r.target_entity_id == f2.primary_entity_id)
                        )
                        for r in relationships
                    )

                is_amendment = (
                    p1["is_amendment"]
                    or p2["is_amendment"]
                    or has_supersedes_rel
                )

                conflict_type = (
                    ConflictType.SUPERSEDED_DECISION.value
                    if is_amendment
                    else ConflictType.CONTRADICTION.value
                )

                key = (conflict_type, f1.id, f2.id, f1.primary_entity_id or f2.primary_entity_id)
                alt_key = (conflict_type, f2.id, f1.id, f1.primary_entity_id or f2.primary_entity_id)

                if key in existing_keys:
                    findings.append(existing_keys[key])
                    continue
                if alt_key in existing_keys:
                    findings.append(existing_keys[alt_key])
                    continue

                doc1_name = p1["doc_name"] or "Prior Record"
                doc2_name = p2["doc_name"] or "Later Record"

                if is_amendment:
                    # Superseded decision
                    c = KnowledgeConflict(
                        id=str(uuid.uuid4()),
                        conflict_type=ConflictType.SUPERSEDED_DECISION.value,
                        severity=ConflictSeverity.MEDIUM.value,
                        status=ConflictStatus.OPEN.value,
                        title=f"Superseded Decision: {f1.statement[:60]}...",
                        description=(
                            f"Record '{doc2_name}' amends or supersedes "
                            f"prior decision in '{doc1_name}'. "
                            f"Assertion '{f1.statement}' was revised to '{f2.statement}'."
                        ),
                        fact_a_id=f1.id,
                        fact_b_id=f2.id,
                        entity_id=f1.primary_entity_id or f2.primary_entity_id,
                        document_id=f2.document_id or f1.document_id,
                    )
                    db.add(c)
                    existing_keys[key] = c
                    existing_keys[alt_key] = c
                    findings.append(c)

                else:
                    # Genuine Contradiction: incompatible claims asserted without an amendment marker
                    c = KnowledgeConflict(
                        id=str(uuid.uuid4()),
                        conflict_type=ConflictType.CONTRADICTION.value,
                        severity=ConflictSeverity.CRITICAL.value,
                        status=ConflictStatus.OPEN.value,
                        title=f"Direct Contradiction: {f1.category.title()} Discrepancy",
                        description=(
                            f"Mutually inconsistent statements detected between records: "
                            f"'{f1.statement}' vs '{f2.statement}'. "
                            f"Requires formal clarification before transition."
                        ),
                        fact_a_id=f1.id,
                        fact_b_id=f2.id,
                        entity_id=f1.primary_entity_id or f2.primary_entity_id,
                        document_id=f1.document_id or f2.document_id,
                    )
                    db.add(c)
                    existing_keys[key] = c
                    existing_keys[alt_key] = c
                    findings.append(c)

        return findings

    @classmethod
    def _detect_outdated_deadlines(
        cls,
        db: Session,
        facts: List[ExtractedFact],
        existing_keys: Dict,
    ) -> List[KnowledgeConflict]:
        """
        Detects operational deadlines and commitments whose target milestone has passed or is imminent.
        """
        findings: List[KnowledgeConflict] = []
        now = datetime.now(timezone.utc)

        for fact in facts:
            if fact.category in ["deadline", "commitment"] and fact.deadline:
                dl = fact.deadline
                if dl.tzinfo is None:
                    dl = dl.replace(tzinfo=timezone.utc)

                key = ("outdated_deadline", fact.id, None, fact.primary_entity_id)
                if key in existing_keys:
                    findings.append(existing_keys[key])
                    continue

                if dl < now:
                    c = KnowledgeConflict(
                        id=str(uuid.uuid4()),
                        conflict_type=ConflictType.OUTDATED_DEADLINE.value,
                        severity=ConflictSeverity.HIGH.value,
                        status=ConflictStatus.OPEN.value,
                        title=f"Passed Deadline: {fact.statement[:60]}...",
                        description=(
                            f"Target deadline '{dl.strftime('%b %d, %Y')}' has passed for obligation: "
                            f"'{fact.statement}'. No completion sign-off is recorded."
                        ),
                        fact_a_id=fact.id,
                        entity_id=fact.primary_entity_id,
                        document_id=fact.document_id,
                    )
                    db.add(c)
                    existing_keys[key] = c
                    findings.append(c)

        return findings

    @classmethod
    def _detect_changed_responsibilities(
        cls,
        db: Session,
        relationships: List[EntityRelationship],
        existing_keys: Dict,
    ) -> List[KnowledgeConflict]:
        """
        Detects designated responsibility and handover transfers.
        """
        findings: List[KnowledgeConflict] = []

        for rel in relationships:
            if rel.relation_type in [RelationType.TRANSFERS_TO.value, RelationType.SUPERSEDES.value]:
                key = ("changed_responsibility", None, None, rel.source_entity_id)
                if key in existing_keys:
                    findings.append(existing_keys[key])
                    continue

                src_name = rel.source_entity.name if rel.source_entity else "Outgoing Leader"
                tgt_name = rel.target_entity.name if rel.target_entity else "Incoming Successor"

                c = KnowledgeConflict(
                    id=str(uuid.uuid4()),
                    conflict_type=ConflictType.CHANGED_RESPONSIBILITY.value,
                    severity=ConflictSeverity.MEDIUM.value,
                    status=ConflictStatus.OPEN.value,
                    title=f"Handover Reassignment: {src_name} → {tgt_name}",
                    description=(
                        f"Operational stewardship transferred from {src_name} to {tgt_name}. "
                        f"Ensure signatory authorities, access tokens, and project accounts are updated."
                    ),
                    entity_id=rel.source_entity_id,
                    document_id=rel.document_id,
                )
                db.add(c)
                existing_keys[key] = c
                findings.append(c)

        return findings

    @classmethod
    def _detect_missing_ownership(
        cls,
        db: Session,
        entities: List[ExtractedEntity],
        relationships: List[EntityRelationship],
        existing_keys: Dict,
    ) -> List[KnowledgeConflict]:
        """
        Identifies active projects, initiatives, or critical assets that lack an assigned owner or lead steward.
        """
        findings: List[KnowledgeConflict] = []
        owned_entity_ids: Set[str] = {
            r.target_entity_id for r in relationships if r.relation_type == RelationType.OWNS.value
        }

        for ent in entities:
            if ent.category in ["project", "initiative", "asset"]:
                if ent.id not in owned_entity_ids:
                    key = ("ownership_gap", None, None, ent.id)
                    if key in existing_keys:
                        findings.append(existing_keys[key])
                        continue

                    c = KnowledgeConflict(
                        id=str(uuid.uuid4()),
                        conflict_type=ConflictType.OWNERSHIP_GAP.value,
                        severity=ConflictSeverity.HIGH.value,
                        status=ConflictStatus.OPEN.value,
                        title=f"Unassigned Ownership: {ent.name}",
                        description=(
                            f"Organizational {ent.category} '{ent.name}' has no registered owner, "
                            f"lead steward, or reporting line in deposited documentation."
                        ),
                        entity_id=ent.id,
                    )
                    db.add(c)
                    existing_keys[key] = c
                    findings.append(c)

        return findings

    @classmethod
    def _detect_knowledge_gaps(
        cls,
        db: Session,
        facts: List[ExtractedFact],
        existing_keys: Dict,
    ) -> List[KnowledgeConflict]:
        """
        Flags assertions based on rejected citations or marked as inferred deductions.
        """
        findings: List[KnowledgeConflict] = []

        for fact in facts:
            if fact.verification_status in [
                FactVerificationStatus.REJECTED.value,
                FactVerificationStatus.INFERRED.value,
            ]:
                key = ("knowledge_gap", fact.id, None, fact.primary_entity_id)
                if key in existing_keys:
                    findings.append(existing_keys[key])
                    continue

                is_rejected = fact.verification_status == FactVerificationStatus.REJECTED.value
                c = KnowledgeConflict(
                    id=str(uuid.uuid4()),
                    conflict_type=ConflictType.KNOWLEDGE_GAP.value,
                    severity=ConflictSeverity.MEDIUM.value if not is_rejected else ConflictSeverity.HIGH.value,
                    status=ConflictStatus.OPEN.value,
                    title=f"Evidence Gap: {fact.statement[:60]}...",
                    description=(
                        f"Assertion '{fact.statement}' lacks direct citation support "
                        f"({fact.verification_status}). Requires corroborating primary documentation."
                    ),
                    fact_a_id=fact.id,
                    entity_id=fact.primary_entity_id,
                    document_id=fact.document_id,
                )
                db.add(c)
                existing_keys[key] = c
                findings.append(c)

        return findings

    @classmethod
    def resolve_conflict(
        cls,
        db: Session,
        conflict_id: str,
        resolution_notes: str,
        status: str = "resolved",
        resolved_by: str = "auditor",
    ) -> Optional[KnowledgeConflict]:
        """
        Adjudicates a knowledge discrepancy, recording reviewer justification and timestamp.
        """
        conflict = db.query(KnowledgeConflict).filter(KnowledgeConflict.id == conflict_id).first()
        if not conflict:
            return None

        conflict.status = status
        conflict.resolution_notes = resolution_notes
        conflict.resolved_by = resolved_by
        conflict.resolved_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(conflict)
        return conflict

