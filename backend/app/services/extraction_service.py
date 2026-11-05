import logging
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.config import settings
from app.models.document import Document
from app.models.knowledge import (
    DocumentSegment,
    ExtractedFact,
    ExtractedEntity,
    EntityMention,
    EntityRelationship,
    ExtractionRun,
)
from app.schemas.extraction import DocumentExtractionPayload
from app.schemas.intelligence import (
    PersistenceResult,
    DocumentKnowledgeResponse,
)
from app.schemas.knowledge import (
    ExtractedFactDetailResponse,
    ExtractedEntityDetailResponse,
    EntityMentionResponse,
    EntityRelationshipResponse,
    ExtractionRunResponse,
)
from app.prompts.extraction import (
    EXTRACTION_PROMPT_VERSION,
    EXTRACTION_PROMPT_HASH,
    EXTRACTION_SYSTEM_INSTRUCTION,
    format_extraction_prompt,
)
from app.integrations.llm.base import (
    BaseLLMProvider,
    LLMStructuredResponse,
    LLMError,
    LLMAuthError,
    LLMQuotaError,
    LLMUnavailableError,
    LLMTimeoutError,
    LLMResponseValidationError,
    LLMResponseTruncatedError,
)
from app.integrations.llm.gemini_provider import GeminiProvider
from app.services.grounding import EvidenceGroundingService
from app.services.intelligence_service import (
    KnowledgePersistenceService,
    DocumentNotFoundError,
    ConcurrentExtractionError,
    PersistenceError,
    sanitize_error_message,
)

logger = logging.getLogger(__name__)


class DocumentNotEligibleError(Exception):
    """Raised when a document exists but is not ready or has no segments to analyze."""
    pass


class ExtractionProviderError(Exception):
    """Raised when the LLM provider fails with an upstream server, timeout, or network error."""
    pass


class ExtractionQuotaError(Exception):
    """Raised when the LLM provider quota or rate limit is exhausted."""
    pass


class ExtractionAuthError(Exception):
    """Raised when the LLM provider authentication or API key configuration fails."""
    pass


class ExtractionSchemaError(Exception):
    """Raised when the LLM provider returns malformed JSON or schema-incompatible output."""
    pass


class ExtractionPersistenceError(Exception):
    """Raised when persisting extracted knowledge into the database fails."""
    pass


class ExtractionOrchestrator:
    """
    Coordinates end-to-end knowledge extraction from ingested document segments.
    Enforces document eligibility, concurrency lease locks, structured prompt synthesis,
    Gemini provider generation, schema validation, deterministic evidence grounding,
    knowledge persistence, and granular telemetry tracking.
    """

    def __init__(
        self,
        llm_provider: Optional[BaseLLMProvider] = None,
        grounding_service: Optional[EvidenceGroundingService] = None,
        persistence_service: Optional[KnowledgePersistenceService] = None,
    ):
        self.llm_provider = llm_provider
        self.grounding_service = grounding_service or EvidenceGroundingService()
        self.persistence_service = persistence_service or KnowledgePersistenceService(self.grounding_service)

    def extract_document(
        self,
        db: Session,
        document_id: str,
        model_name: Optional[str] = None,
        lease_seconds: int = 300,
    ) -> PersistenceResult:
        """
        Executes the complete extraction pipeline for an institutional record:
        1. Validate document existence and eligibility.
        2. Acquire concurrency lock and initialize running ExtractionRun telemetry.
        3. Retrieve structured segments and format versioned extraction prompt.
        4. Invoke Gemini provider for structured JSON generation.
        5. Validate model payload against DocumentExtractionPayload.
        6. Pass candidate facts and citations through EvidenceGroundingService.
        7. Atomically persist entities, mentions, relationships, and grounded facts.
        8. Finalize telemetry metrics and release lock.
        """
        # 1. Validate Document existence
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            raise DocumentNotFoundError(f"Document with ID '{document_id}' not found.")

        # Validate Document eligibility
        if doc.extraction_status != "completed":
            if doc.extraction_status == "failed":
                raise DocumentNotEligibleError(
                    f"Document '{doc.original_filename}' is not eligible for extraction: "
                    f"text extraction failed with error: {doc.extraction_error or 'Unknown error'}"
                )
            raise DocumentNotEligibleError(
                f"Document '{doc.original_filename}' is not eligible for extraction: "
                f"current status is '{doc.extraction_status}'"
            )

        # Preload segments
        segments = (
            db.query(DocumentSegment)
            .filter(DocumentSegment.document_id == document_id)
            .order_by(DocumentSegment.sequence_number.asc())
            .all()
        )
        if not segments:
            raise DocumentNotEligibleError(
                f"Document '{doc.original_filename}' has no structured segments to analyze."
            )

        # 2. Acquire concurrency lock & initialize ExtractionRun
        target_model = model_name or getattr(self.llm_provider, "default_model", settings.GEMINI_MODEL)
        provider_name = getattr(self.llm_provider, "provider_name", "gemini")

        run = self.persistence_service.acquire_extraction_lock(
            db=db,
            document_id=document_id,
            provider_name=provider_name,
            model_name=target_model,
            prompt_version=EXTRACTION_PROMPT_VERSION,
            prompt_hash=EXTRACTION_PROMPT_HASH,
            lease_seconds=lease_seconds,
        )

        # 3. Format extraction prompt
        segment_dicts = [
            {
                "id": s.id,
                "source_label": s.source_label or f"Page {s.page_number or 1}, Seq {s.sequence_number}",
                "sequence_number": s.sequence_number,
                "content": s.content,
            }
            for s in segments
        ]
        user_prompt = format_extraction_prompt(
            document_title=doc.original_filename,
            segments=segment_dicts,
        )

        # 4. Invoke LLM provider
        llm = self.llm_provider or GeminiProvider(default_model=target_model)
        try:
            llm_response: LLMStructuredResponse[DocumentExtractionPayload] = llm.generate_structured(
                prompt=user_prompt,
                response_schema=DocumentExtractionPayload,
                system_instruction=EXTRACTION_SYSTEM_INSTRUCTION,
                temperature=0.0,
                model=target_model,
            )
        except LLMQuotaError as exc:
            sanitized_msg = sanitize_error_message(str(exc))
            self.persistence_service._record_failure(db, run.id, "llm_generation", sanitized_msg)
            raise ExtractionQuotaError(f"Gemini quota exceeded during extraction: {sanitized_msg}") from exc
        except LLMAuthError as exc:
            sanitized_msg = sanitize_error_message(str(exc))
            self.persistence_service._record_failure(db, run.id, "llm_generation", sanitized_msg)
            raise ExtractionAuthError(f"Gemini authentication failed: {sanitized_msg}") from exc
        except (LLMResponseValidationError, LLMResponseTruncatedError) as exc:
            sanitized_msg = sanitize_error_message(str(exc))
            self.persistence_service._record_failure(db, run.id, "schema_validation", sanitized_msg)
            raise ExtractionSchemaError(f"Gemini output failed schema validation: {sanitized_msg}") from exc
        except (LLMUnavailableError, LLMTimeoutError, LLMError) as exc:
            sanitized_msg = sanitize_error_message(str(exc))
            self.persistence_service._record_failure(db, run.id, "llm_generation", sanitized_msg)
            raise ExtractionProviderError(f"Gemini provider failure: {sanitized_msg}") from exc
        except Exception as exc:
            sanitized_msg = sanitize_error_message(str(exc))
            self.persistence_service._record_failure(db, run.id, "llm_generation", sanitized_msg)
            raise ExtractionProviderError(f"Unexpected error during generation: {sanitized_msg}") from exc

        # 5. Validate payload
        payload = llm_response.data
        if not payload or not isinstance(payload, DocumentExtractionPayload):
            msg = "Received empty or invalid extraction payload from model."
            self.persistence_service._record_failure(db, run.id, "schema_validation", msg)
            raise ExtractionSchemaError(msg)

        # 6, 7 & 8. Persist knowledge (with grounding, entity resolution, idempotency)
        try:
            result = self.persistence_service.persist_extraction(
                db=db,
                document_id=document_id,
                payload=payload,
                provider_name=provider_name,
                model_name=target_model,
                prompt_version=EXTRACTION_PROMPT_VERSION,
                prompt_hash=EXTRACTION_PROMPT_HASH,
                prompt_tokens=llm_response.prompt_tokens,
                completion_tokens=llm_response.completion_tokens,
                existing_run=run,
            )
            return result
        except PersistenceError:
            # PersistenceError is already recorded on ExtractionRun inside persist_extraction
            raise
        except Exception as exc:
            sanitized_msg = sanitize_error_message(str(exc))
            self.persistence_service._record_failure(db, run.id, "persistence", sanitized_msg)
            raise ExtractionPersistenceError(f"Persistence failed: {sanitized_msg}") from exc

    def get_document_knowledge(self, db: Session, document_id: str) -> DocumentKnowledgeResponse:
        """
        Retrieves all persistent knowledge associated with a document, including
        facts with verified/rejected citations and verification audit logs,
        canonical entities with surface mentions in this document, and directed relationships.
        """
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            raise DocumentNotFoundError(f"Document with ID '{document_id}' not found.")

        # 1. Facts with citations and logs
        facts = (
            db.query(ExtractedFact)
            .filter(ExtractedFact.document_id == document_id)
            .order_by(ExtractedFact.created_at.asc())
            .all()
        )

        # 2. Directed Relationships
        relationships = (
            db.query(EntityRelationship)
            .filter(EntityRelationship.document_id == document_id)
            .order_by(EntityRelationship.created_at.asc())
            .all()
        )

        # 3. Entity Mentions & Canonical Entities for this document
        mentions = (
            db.query(EntityMention)
            .filter(EntityMention.document_id == document_id)
            .order_by(EntityMention.char_offset_start.asc())
            .all()
        )

        referenced_entity_ids = {m.entity_id for m in mentions}
        for f in facts:
            if f.primary_entity_id:
                referenced_entity_ids.add(f.primary_entity_id)
        for r in relationships:
            referenced_entity_ids.add(r.source_entity_id)
            referenced_entity_ids.add(r.target_entity_id)

        entities: List[ExtractedEntity] = []
        if referenced_entity_ids:
            entities = (
                db.query(ExtractedEntity)
                .filter(ExtractedEntity.id.in_(referenced_entity_ids))
                .order_by(ExtractedEntity.name.asc())
                .all()
            )

        # 4. Latest ExtractionRun
        latest_run = (
            db.query(ExtractionRun)
            .filter(ExtractionRun.document_id == document_id)
            .order_by(ExtractionRun.created_at.desc())
            .first()
        )

        # 5. Build response contract
        return DocumentKnowledgeResponse(
            document_id=doc.id,
            document_filename=doc.original_filename,
            facts_count=len(facts),
            entities_count=len(entities),
            relationships_count=len(relationships),
            facts=[ExtractedFactDetailResponse.model_validate(f) for f in facts],
            entities=[
                ExtractedEntityDetailResponse(
                    id=e.id,
                    name=e.name,
                    canonical_name=e.canonical_name,
                    category=e.category,
                    description=e.description,
                    created_at=e.created_at,
                    updated_at=e.updated_at,
                    mentions=[
                        EntityMentionResponse.model_validate(m)
                        for m in mentions
                        if m.entity_id == e.id
                    ],
                )
                for e in entities
            ],
            relationships=[EntityRelationshipResponse.model_validate(r) for r in relationships],
            latest_run=ExtractionRunResponse.model_validate(latest_run) if latest_run else None,
        )
