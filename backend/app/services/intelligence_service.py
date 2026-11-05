import logging
import re
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, Set, Tuple

from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError, OperationalError

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
    RelationType,
    FactVerificationStatus,
    VerificationAction,
)
from app.schemas.extraction import (
    DocumentExtractionPayload,
    RawEntityExtraction,
    RawFactExtraction,
    RawRelationshipExtraction,
    RawCitationReference,
)
from app.schemas.grounding import (
    GroundingStatus,
    GroundingResult,
    FactGroundingResult,
)
from app.schemas.intelligence import PersistenceResult
from app.services.grounding import EvidenceGroundingService

logger = logging.getLogger(__name__)


class PersistenceError(Exception):
    """Base exception for extraction persistence failures."""
    pass


class DocumentNotFoundError(PersistenceError):
    """Raised when target document does not exist."""
    pass


class ConcurrentExtractionError(PersistenceError):
    """Raised when another extraction is already running for the target document."""
    pass


PERSON_HONORIFICS_REGEX = r"^(?:dr|mr|mrs|ms|prof|professor|rev|reverend|hon|honorable)\b\.?\s*"
PERSON_CREDENTIALS_REGEX = r"[\s,]+(?:ph\.?d\.?|m\.?d\.?|esq\.?|j\.?d\.?|m\.?b\.?a\.?|cpa)\b\.?"


def normalize_entity_name(name: str, category: str) -> str:
    """
    Normalizes an entity name for conservative canonical deduplication.
    Converts to lowercase, removes personal honorifics/credentials for people,
    preserves generational suffixes (Jr, Sr, II, III, IV), strips punctuation,
    and collapses whitespace.
    """
    cleaned = name.strip().lower()
    cat_lower = category.strip().lower()

    if cat_lower == "person":
        # Standardize junior/senior spellings while strictly preserving identity
        cleaned = re.sub(r"\bjunior\b", "jr", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\bsenior\b", "sr", cleaned, flags=re.IGNORECASE)
        # Strip honorifics and professional/academic credentials
        cleaned = re.sub(PERSON_HONORIFICS_REGEX, "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(PERSON_CREDENTIALS_REGEX, "", cleaned, flags=re.IGNORECASE)

    # Replace punctuation with space
    cleaned = re.sub(r"[^\w\s]", " ", cleaned)
    # Collapse whitespace sequences
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def sanitize_error_message(msg: str) -> str:
    """
    Sanitizes failure messages to prevent leaking API keys, tokens,
    or sensitive document excerpts into telemetry logs.
    """
    if not msg:
        return "Unknown error"
    # Redact common key patterns
    sanitized = re.sub(r"AIza[0-9A-Za-z-_]{35}", "[REDACTED_API_KEY]", msg)
    sanitized = re.sub(r"(?:bearer\s+)[0-9A-Za-z-_\.]+", "[REDACTED_BEARER]", sanitized, flags=re.IGNORECASE)
    sanitized = re.sub(r"(?:api[_-]?key|secret|password|token)[\s:=]+[^\s,;]+", "[REDACTED_CREDENTIAL]", sanitized, flags=re.IGNORECASE)
    # Truncate length
    if len(sanitized) > 1000:
        sanitized = sanitized[:997] + "..."
    return sanitized


class KnowledgePersistenceService:
    """
    Orchestrates entity resolution, ground-truth evidence verification,
    and atomic knowledge persistence across organizational records.
    """

    def __init__(self, grounding_service: Optional[EvidenceGroundingService] = None):
        self.grounding_service = grounding_service or EvidenceGroundingService()

    def acquire_extraction_lock(
        self,
        db: Session,
        document_id: str,
        provider_name: str,
        model_name: str,
        prompt_version: str,
        prompt_hash: str,
        retry_count: int = 0,
        lease_seconds: int = 300,
    ) -> ExtractionRun:
        """
        Guards against concurrent extractions on the same document and creates
        a persistent ExtractionRun record with status='running'.
        """
        active_run = (
            db.query(ExtractionRun)
            .filter(
                ExtractionRun.document_id == document_id,
                ExtractionRun.status == "running",
            )
            .first()
        )

        now = datetime.now(timezone.utc)
        if active_run:
            started = active_run.started_at
            if started.tzinfo is None:
                started = started.replace(tzinfo=timezone.utc)
            elapsed = (now - started).total_seconds()
            if elapsed < lease_seconds:
                raise ConcurrentExtractionError(
                    f"Extraction already running for document {document_id} "
                    f"(run_id: {active_run.id}, active for {int(elapsed)}s)"
                )
            else:
                # Expired lease from crashed run
                logger.warning(
                    f"Overriding expired extraction lease on doc {document_id} (run_id: {active_run.id})"
                )
                active_run.status = "failed"
                active_run.error_stage = "lease_expired"
                active_run.error_message = f"Extraction lease timed out after {int(elapsed)}s"
                active_run.completed_at = now
                db.commit()

        new_run = ExtractionRun(
            id=str(uuid.uuid4()),
            document_id=document_id,
            provider_name=provider_name,
            model_name=model_name,
            prompt_version=prompt_version,
            prompt_hash=prompt_hash,
            status="running",
            retry_count=retry_count,
            started_at=now,
        )
        try:
            db.add(new_run)
            db.commit()
            db.refresh(new_run)
            return new_run
        except (IntegrityError, OperationalError) as exc:
            db.rollback()
            raise ConcurrentExtractionError(
                f"Concurrent extraction race prevented: extraction already running for document {document_id}"
            ) from exc

    def resolve_entities(
        self,
        db: Session,
        raw_entities: List[RawEntityExtraction],
    ) -> Tuple[List[ExtractedEntity], Dict[Tuple[str, str], ExtractedEntity], Dict[str, ExtractedEntity]]:
        """
        Resolves candidate entities against existing canonical entities in the database.
        Conservative matching: exact match on (category, canonical_name).
        Category isolation: different categories never merge.
        Returns:
            (persisted_entities_list, entity_by_canonical_key, entity_by_raw_name)
        """
        session_cache: Dict[Tuple[str, str], ExtractedEntity] = {}
        by_raw_name: Dict[str, ExtractedEntity] = {}

        for raw_ent in raw_entities:
            cat_val = raw_ent.category.value if hasattr(raw_ent.category, "value") else str(raw_ent.category)
            canon_name = normalize_entity_name(raw_ent.name, cat_val)
            key = (cat_val, canon_name)

            if key in session_cache:
                entity = session_cache[key]
                if raw_ent.description and not entity.description:
                    entity.description = raw_ent.description
                by_raw_name[raw_ent.name.strip().lower()] = entity
                continue

            # Check database for existing canonical entity
            db_entity = (
                db.query(ExtractedEntity)
                .filter(
                    ExtractedEntity.category == cat_val,
                    ExtractedEntity.canonical_name == canon_name,
                )
                .first()
            )

            if db_entity:
                if raw_ent.description and not db_entity.description:
                    db_entity.description = raw_ent.description
                session_cache[key] = db_entity
                by_raw_name[raw_ent.name.strip().lower()] = db_entity
            else:
                new_entity = ExtractedEntity(
                    id=str(uuid.uuid4()),
                    name=raw_ent.name.strip(),
                    canonical_name=canon_name,
                    category=cat_val,
                    description=raw_ent.description,
                )
                db.add(new_entity)
                session_cache[key] = new_entity
                by_raw_name[raw_ent.name.strip().lower()] = new_entity

        db.flush()
        return list(session_cache.values()), session_cache, by_raw_name

    def persist_entity_mentions(
        self,
        db: Session,
        document_id: str,
        raw_entities: List[RawEntityExtraction],
        entity_cache: Dict[Tuple[str, str], ExtractedEntity],
        segment_map: Dict[str, DocumentSegment],
    ) -> List[EntityMention]:
        """
        Validates segment ownership, computes document-relative character offsets,
        and idempotently persists EntityMention records.
        Preserves original surface forms and sets resolution status.
        """
        persisted_mentions: List[EntityMention] = []

        # Query existing mentions for document to ensure idempotency
        existing_mentions = (
            db.query(EntityMention)
            .filter(EntityMention.document_id == document_id)
            .all()
        )
        existing_keys = {
            (m.entity_id, m.segment_id, m.char_offset_start, m.char_offset_end)
            for m in existing_mentions
        }

        for raw_ent in raw_entities:
            cat_val = raw_ent.category.value if hasattr(raw_ent.category, "value") else str(raw_ent.category)
            canon_name = normalize_entity_name(raw_ent.name, cat_val)
            entity = entity_cache.get((cat_val, canon_name))
            if not entity:
                continue

            for raw_mention in raw_ent.mentions:
                # 1. Segment ownership check
                seg = segment_map.get(raw_mention.segment_id)
                if not seg:
                    # Query db in case segment is not in preloaded map
                    seg = (
                        db.query(DocumentSegment)
                        .filter(DocumentSegment.id == raw_mention.segment_id)
                        .first()
                    )
                    if seg:
                        segment_map[seg.id] = seg

                if not seg or seg.document_id != document_id:
                    logger.warning(
                        f"Skipping mention for entity '{entity.name}': segment '{raw_mention.segment_id}' "
                        f"does not exist or does not belong to document '{document_id}'"
                    )
                    continue

                # 2. Locate surface text within segment content
                match_res = self.grounding_service.match_quote_in_content(
                    content=seg.content,
                    quote=raw_mention.surface_text,
                    source_context=raw_mention.context,
                )

                if not match_res.is_valid or match_res.char_start is None or match_res.char_end is None:
                    logger.warning(
                        f"Skipping mention for entity '{entity.name}': surface text '{raw_mention.surface_text}' "
                        f"could not be grounded in segment {seg.id}"
                    )
                    continue

                # 3. Calculate document-relative offsets
                doc_char_start = seg.char_offset_start + match_res.char_start
                doc_char_end = seg.char_offset_start + match_res.char_end

                # 4. Determine resolution status
                # If surface text normalizes differently or is single-token for person -> flag as pending/ambiguous
                surface_norm = normalize_entity_name(raw_mention.surface_text, cat_val)
                if surface_norm != entity.canonical_name:
                    res_status = "ambiguous"
                elif cat_val == "person" and len(entity.canonical_name.split()) == 1:
                    res_status = "pending"
                else:
                    res_status = "resolved"

                # 5. Idempotent check
                key = (entity.id, seg.id, doc_char_start, doc_char_end)
                if key in existing_keys:
                    continue

                mention = EntityMention(
                    id=str(uuid.uuid4()),
                    entity_id=entity.id,
                    document_id=document_id,
                    segment_id=seg.id,
                    surface_text=match_res.verbatim_quote or raw_mention.surface_text,
                    char_offset_start=doc_char_start,
                    char_offset_end=doc_char_end,
                    confidence_score=1.0,
                    resolution_status=res_status,
                )
                db.add(mention)
                existing_keys.add(key)
                persisted_mentions.append(mention)

        db.flush()
        return persisted_mentions

    def persist_relationships(
        self,
        db: Session,
        document_id: str,
        raw_relationships: List[RawRelationshipExtraction],
        entity_name_map: Dict[str, ExtractedEntity],
    ) -> List[EntityRelationship]:
        """
        Resolves relationship endpoints against canonical entities and persists
        directed relationships without duplicates, preserving edge direction.
        """
        persisted_rels: List[EntityRelationship] = []

        existing_rels = (
            db.query(EntityRelationship)
            .filter(EntityRelationship.document_id == document_id)
            .all()
        )
        existing_keys = {
            (r.source_entity_id, r.target_entity_id, r.relation_type)
            for r in existing_rels
        }

        valid_relation_types = {r.value for r in RelationType}

        for raw_rel in raw_relationships:
            # Validate relation_type
            rel_type = (
                raw_rel.relation_type.value
                if hasattr(raw_rel.relation_type, "value")
                else str(raw_rel.relation_type)
            )
            if rel_type not in valid_relation_types:
                logger.warning(f"Invalid relation_type '{rel_type}' skipped.")
                continue

            # Lookup source and target
            source_key = raw_rel.source_entity_name.strip().lower()
            target_key = raw_rel.target_entity_name.strip().lower()

            source_entity = entity_name_map.get(source_key)
            target_entity = entity_name_map.get(target_key)

            if not source_entity or not target_entity:
                logger.warning(
                    f"Skipping relationship: cannot resolve endpoints '{raw_rel.source_entity_name}' "
                    f"-> '{raw_rel.target_entity_name}'"
                )
                continue

            # Directional key
            key = (source_entity.id, target_entity.id, rel_type)
            if key in existing_keys:
                continue

            rel_record = EntityRelationship(
                id=str(uuid.uuid4()),
                document_id=document_id,
                source_entity_id=source_entity.id,
                target_entity_id=target_entity.id,
                relation_type=rel_type,
                confidence_score=raw_rel.confidence,
            )
            db.add(rel_record)
            existing_keys.add(key)
            persisted_rels.append(rel_record)

        db.flush()
        return persisted_rels

    def persist_facts_and_citations(
        self,
        db: Session,
        document_id: str,
        raw_facts: List[RawFactExtraction],
        resolved_entities: List[ExtractedEntity],
        segment_map: Dict[str, DocumentSegment],
    ) -> Tuple[List[ExtractedFact], List[FactCitation], int, int]:
        """
        Grounds facts and candidate citations through EvidenceGroundingService,
        persists fact assertions and citations with exact segment offsets,
        creates initial FactVerificationLog records, and preserves human audit history.

        Returns:
            (persisted_facts, persisted_citations, total_verified_citations, total_rejected_citations)
        """
        persisted_facts: List[ExtractedFact] = []
        persisted_citations: List[FactCitation] = []
        total_verified = 0
        total_rejected = 0

        # Pre-fetch existing facts for idempotency & historical preservation
        existing_facts = (
            db.query(ExtractedFact)
            .filter(ExtractedFact.document_id == document_id)
            .all()
        )
        existing_fact_map: Dict[Tuple[str, str], ExtractedFact] = {
            (f.category, f.statement.strip().lower()): f for f in existing_facts
        }

        for raw_fact in raw_facts:
            # 1. Ground fact using Phase 3 EvidenceGroundingService
            grounding_res: FactGroundingResult = self.grounding_service.ground_fact(
                document_id=document_id,
                proposed_fact=raw_fact,
                db=db,
                segment_cache=segment_map,
            )

            total_verified += grounding_res.valid_citation_count
            total_rejected += grounding_res.rejected_citation_count

            # 2. Identify primary entity if referenced in fact statement
            primary_entity_id: Optional[str] = None
            stmt_lower = raw_fact.statement.lower()
            for ent in resolved_entities:
                if ent.canonical_name in stmt_lower or ent.name.lower() in stmt_lower:
                    primary_entity_id = ent.id
                    break

            cat_val = raw_fact.category.value if hasattr(raw_fact.category, "value") else str(raw_fact.category)
            fact_key = (cat_val, raw_fact.statement.strip().lower())

            existing_fact = existing_fact_map.get(fact_key)

            if existing_fact:
                # Historical Preservation Rule: Human-verified facts are NEVER overwritten
                if existing_fact.verification_status == FactVerificationStatus.HUMAN_VERIFIED.value:
                    logger.info(
                        f"Preserving human-verified fact '{existing_fact.id}'; skipping automated status overwrite."
                    )
                    fact_record = existing_fact
                else:
                    existing_fact.verification_status = grounding_res.verification_status.value
                    existing_fact.confidence_score = raw_fact.confidence
                    existing_fact.reviewer_notes = grounding_res.disposition_notes
                    existing_fact.severity = raw_fact.severity.value if raw_fact.severity else None
                    fact_record = existing_fact
            else:
                fact_record = ExtractedFact(
                    id=str(uuid.uuid4()),
                    document_id=document_id,
                    primary_entity_id=primary_entity_id,
                    category=cat_val,
                    statement=raw_fact.statement.strip(),
                    severity=raw_fact.severity.value if raw_fact.severity else None,
                    verification_status=grounding_res.verification_status.value,
                    confidence_score=raw_fact.confidence,
                    reviewer_notes=grounding_res.disposition_notes,
                )
                db.add(fact_record)
                db.flush()
                existing_fact_map[fact_key] = fact_record

                # Create initial FactVerificationLog entry
                action_type = (
                    VerificationAction.VERIFIED.value
                    if grounding_res.verification_status == FactVerificationStatus.EVIDENCE_BACKED
                    else "grounded"
                )
                log = FactVerificationLog(
                    id=str(uuid.uuid4()),
                    fact_id=fact_record.id,
                    action=action_type,
                    previous_status="none",
                    new_status=fact_record.verification_status,
                    reviewer_id="system:grounding_engine",
                    notes=grounding_res.disposition_notes,
                )
                db.add(log)

            persisted_facts.append(fact_record)

            # 3. Persist citations
            existing_citations = (
                db.query(FactCitation)
                .filter(FactCitation.fact_id == fact_record.id)
                .all()
            )
            existing_cit_keys = {
                (c.document_segment_id, c.char_start, c.char_end, c.verification_status)
                for c in existing_citations
            }

            for idx, cit_res in enumerate(grounding_res.citations):
                raw_quote = (
                    raw_fact.citations[idx].quote
                    if idx < len(raw_fact.citations)
                    else (cit_res.verbatim_quote or "Unverified citation")
                )

                if cit_res.is_valid:
                    cit_key = (cit_res.segment_id, cit_res.char_start, cit_res.char_end, "valid")
                    if cit_key in existing_cit_keys:
                        continue

                    # Exact slicing invariant verification before persist
                    seg = segment_map.get(cit_res.segment_id)
                    if seg:
                        assert seg.content[cit_res.char_start:cit_res.char_end] == cit_res.verbatim_quote

                    citation = FactCitation(
                        id=str(uuid.uuid4()),
                        fact_id=fact_record.id,
                        document_segment_id=cit_res.segment_id,
                        verbatim_quote=cit_res.verbatim_quote or raw_quote,
                        source_location=cit_res.source_location,
                        char_start=cit_res.char_start,
                        char_end=cit_res.char_end,
                        verification_status="valid",
                        rejection_reason=None,
                    )
                    db.add(citation)
                    existing_cit_keys.add(cit_key)
                    persisted_citations.append(citation)
                else:
                    # Preserve rejected citations explicitly with proper schema constraints
                    # Do not overload source_location with rejection messages
                    rejected_cit_key = (cit_res.segment_id, None, None, "rejected")
                    if rejected_cit_key in existing_cit_keys:
                        continue

                    citation = FactCitation(
                        id=str(uuid.uuid4()),
                        fact_id=fact_record.id,
                        document_segment_id=cit_res.segment_id,
                        verbatim_quote=raw_quote,
                        source_location=cit_res.source_location,
                        char_start=None,
                        char_end=None,
                        verification_status="rejected",
                        rejection_reason=cit_res.rejection_reason,
                    )
                    db.add(citation)
                    existing_cit_keys.add(rejected_cit_key)
                    persisted_citations.append(citation)

        db.flush()
        return persisted_facts, persisted_citations, total_verified, total_rejected

    def _record_failure(
        self,
        db: Session,
        run_id: str,
        stage: str,
        message: str,
    ) -> None:
        """
        Records failure telemetry in an isolated transaction so that rollback
        of main entity/fact data does not lose error diagnostics.
        """
        try:
            run = db.query(ExtractionRun).filter(ExtractionRun.id == run_id).first()
            if run:
                run.status = "failed"
                run.error_stage = stage
                run.error_message = sanitize_error_message(message)
                now = datetime.now(timezone.utc)
                run.completed_at = now
                if run.started_at:
                    started = run.started_at
                    if started.tzinfo is None:
                        started = started.replace(tzinfo=timezone.utc)
                    run.execution_duration_ms = max(0, int((now - started).total_seconds() * 1000))
                db.commit()
        except Exception as err:
            logger.error(f"Failed to record ExtractionRun failure status: {err}")
            db.rollback()

    def persist_extraction(
        self,
        db: Session,
        document_id: str,
        payload: DocumentExtractionPayload,
        provider_name: str = "gemini",
        model_name: str = "gemini-3.5-flash",
        prompt_version: str = "relay-extraction-v1",
        prompt_hash: str = "default_prompt_hash",
        prompt_tokens: Optional[int] = None,
        completion_tokens: Optional[int] = None,
        retry_count: int = 0,
        lease_seconds: int = 300,
    ) -> PersistenceResult:
        """
        Main entry point for atomic knowledge extraction persistence.
        Executes entity resolution, mention grounding, relationship validation,
        fact grounding, and telemetry logging in a single atomic transaction.
        """
        # 1. Confirm target document exists
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            raise DocumentNotFoundError(f"Document '{document_id}' not found")

        # 2. Acquire concurrency lease lock & initialize ExtractionRun
        run = self.acquire_extraction_lock(
            db=db,
            document_id=document_id,
            provider_name=provider_name,
            model_name=model_name,
            prompt_version=prompt_version,
            prompt_hash=prompt_hash,
            retry_count=retry_count,
            lease_seconds=lease_seconds,
        )

        # 3. Preload document segments
        segments = (
            db.query(DocumentSegment)
            .filter(DocumentSegment.document_id == document_id)
            .all()
        )
        segment_map: Dict[str, DocumentSegment] = {s.id: s for s in segments}

        savepoint = db.begin_nested()
        current_stage = "entity_resolution"
        try:
            # 4. Resolve Entities
            current_stage = "entity_resolution"
            resolved_entities, entity_cache, entity_name_map = self.resolve_entities(
                db=db,
                raw_entities=payload.entities,
            )

            # 5. Persist Entity Mentions
            current_stage = "mention_persistence"
            persisted_mentions = self.persist_entity_mentions(
                db=db,
                document_id=document_id,
                raw_entities=payload.entities,
                entity_cache=entity_cache,
                segment_map=segment_map,
            )

            # 6. Persist Directed Relationships
            current_stage = "relationship_persistence"
            persisted_relationships = self.persist_relationships(
                db=db,
                document_id=document_id,
                raw_relationships=payload.relationships,
                entity_name_map=entity_name_map,
            )

            # 7. Ground and Persist Facts & Citations
            current_stage = "fact_grounding_and_persistence"
            persisted_facts, persisted_citations, verified_cits, rejected_cits = self.persist_facts_and_citations(
                db=db,
                document_id=document_id,
                raw_facts=payload.facts,
                resolved_entities=resolved_entities,
                segment_map=segment_map,
            )

            # 8. Finalize ExtractionRun Telemetry
            current_stage = "telemetry_finalization"
            now = datetime.now(timezone.utc)
            run.status = "completed"
            run.completed_at = now
            started = run.started_at
            if started.tzinfo is None:
                started = started.replace(tzinfo=timezone.utc)
            run.execution_duration_ms = max(0, int((now - started).total_seconds() * 1000))
            run.prompt_tokens = prompt_tokens
            run.completion_tokens = completion_tokens
            run.facts_extracted = len(persisted_facts)
            run.entities_extracted = len(resolved_entities)
            run.relationships_extracted = len(persisted_relationships)
            run.citations_verified = verified_cits
            run.citations_rejected = rejected_cits
            run.error_stage = None
            run.error_message = None

            # 9. Atomic Transaction Commit
            savepoint.commit()
            db.commit()

            return PersistenceResult(
                run_id=run.id,
                document_id=document_id,
                status="completed",
                entities_count=len(resolved_entities),
                mentions_count=len(persisted_mentions),
                facts_count=len(persisted_facts),
                relationships_count=len(persisted_relationships),
                citations_verified=verified_cits,
                citations_rejected=rejected_cits,
                persisted_entity_ids=[e.id for e in resolved_entities],
                persisted_fact_ids=[f.id for f in persisted_facts],
                persisted_relationship_ids=[r.id for r in persisted_relationships],
                execution_duration_ms=run.execution_duration_ms,
            )

        except Exception as exc:
            savepoint.rollback()
            sanitized_msg = sanitize_error_message(str(exc))
            self._record_failure(db, run.id, current_stage, sanitized_msg)
            logger.error(f"Persistence error at stage '{current_stage}': {sanitized_msg}")
            raise PersistenceError(f"Persistence failed at stage '{current_stage}': {sanitized_msg}") from exc
