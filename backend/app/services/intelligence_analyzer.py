import uuid
import logging
import re
from datetime import datetime, timezone
from typing import List, Optional, Tuple, Dict, Set
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
        facts_query = db.query(ExtractedFact)
        if document_id:
            facts_query = facts_query.filter(ExtractedFact.document_id == document_id)
        facts = facts_query.all()

        entities = db.query(ExtractedEntity).all()
        relationships = db.query(EntityRelationship).all()

        # Existing conflicts map for idempotency and resolution preservation
        existing_conflicts = db.query(KnowledgeConflict).all()
        existing_keys: Dict[Tuple[str, Optional[str], Optional[str], Optional[str]], KnowledgeConflict] = {
            (c.conflict_type, c.fact_a_id, c.fact_b_id, c.entity_id): c for c in existing_conflicts
        }

        # Sub-analyses
        conflicts.extend(cls._detect_fact_contradictions_and_supersessions(db, facts, existing_keys, relationships))
        conflicts.extend(cls._detect_outdated_deadlines(db, facts, existing_keys))
        conflicts.extend(cls._detect_changed_responsibilities(db, relationships, existing_keys))
        conflicts.extend(cls._detect_missing_ownership(db, entities, relationships, existing_keys))
        conflicts.extend(cls._detect_knowledge_gaps(db, facts, existing_keys))

        db.commit()
        logger.info("Intelligence scan complete. Detected %d total active matters.", len(conflicts))
        return conflicts

    @classmethod
    def _detect_fact_contradictions_and_supersessions(
        cls,
        db: Session,
        facts: List[ExtractedFact],
        existing_keys: Dict,
        relationships: Optional[List[EntityRelationship]] = None,
    ) -> List[KnowledgeConflict]:
        """
        Compares pairs of facts to distinguish genuine contradictions from historical amendments.
        """
        findings: List[KnowledgeConflict] = []
        n = len(facts)

        for i in range(n):
            for j in range(i + 1, n):
                f1 = facts[i]
                f2 = facts[j]

                # Only compare facts sharing the same category or referencing the same primary entity
                same_cat = f1.category == f2.category
                same_ent = f1.primary_entity_id and (f1.primary_entity_id == f2.primary_entity_id)

                if not (same_cat or same_ent):
                    continue

                s1_lower = f1.statement.lower()
                s2_lower = f2.statement.lower()

                # Extract common substantive words (excluding stop words)
                words1 = set(re.findall(r"\w{4,}", s1_lower))
                words2 = set(re.findall(r"\w{4,}", s2_lower))
                overlap = words1.intersection(words2)

                # Need at least 2 significant shared subject keywords to compare
                if len(overlap) < 2:
                    continue

                # Rule A: Historical amendment / superseded decision
                # If one statement mentions an extension, amendment, or different time duration
                is_amendment = any(term in s1_lower or term in s2_lower for term in ["amend", "extend", "update", "supersede", "reassigned", "revised"])
                has_different_numbers = re.findall(r"\b\d+\b", s1_lower) != re.findall(r"\b\d+\b", s2_lower)

                # Check if an explicit SUPERSEDES relationship links the primary entities
                if relationships and f1.primary_entity_id and f2.primary_entity_id:
                    has_supersedes_rel = any(
                        r.relation_type == RelationType.SUPERSEDES.value
                        and (
                            (r.source_entity_id == f2.primary_entity_id and r.target_entity_id == f1.primary_entity_id)
                            or (r.source_entity_id == f1.primary_entity_id and r.target_entity_id == f2.primary_entity_id)
                        )
                        for r in relationships
                    )
                    if has_supersedes_rel:
                        is_amendment = True

                key = ("superseded_decision" if is_amendment else "contradiction", f1.id, f2.id, f1.primary_entity_id)

                if key in existing_keys:
                    findings.append(existing_keys[key])
                    continue

                if is_amendment or (has_different_numbers and f1.document_id != f2.document_id):
                    # Superseded decision
                    c = KnowledgeConflict(
                        id=str(uuid.uuid4()),
                        conflict_type=ConflictType.SUPERSEDED_DECISION.value,
                        severity=ConflictSeverity.MEDIUM.value,
                        status=ConflictStatus.OPEN.value,
                        title=f"Superseded Decision: {f1.statement[:60]}...",
                        description=(
                            f"Record '{f2.document.original_filename if f2.document else 'Doc B'}' amends or supersedes "
                            f"prior decision in '{f1.document.original_filename if f1.document else 'Doc A'}'. "
                            f"Assertion '{f1.statement}' was revised to '{f2.statement}'."
                        ),
                        fact_a_id=f1.id,
                        fact_b_id=f2.id,
                        entity_id=f1.primary_entity_id,
                        document_id=f2.document_id,
                    )
                    db.add(c)
                    existing_keys[key] = c
                    findings.append(c)

                elif s1_lower != s2_lower:
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
                        entity_id=f1.primary_entity_id,
                        document_id=f1.document_id,
                    )
                    db.add(c)
                    existing_keys[key] = c
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

