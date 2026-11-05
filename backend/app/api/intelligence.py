import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc

from app.core.database import get_db
from app.models.document import Document
from app.models.knowledge import (
    ExtractedFact,
    ExtractedEntity,
    ExtractionRun,
)
from app.schemas.knowledge import (
    ExtractionRunResponse,
    ExtractedFactDetailResponse,
    ExtractedEntityResponse,
)
from app.schemas.intelligence import (
    DocumentExtractionResponse,
    DocumentKnowledgeResponse,
    FactListResponse,
    EntityListResponse,
    ExtractionRunListResponse,
)
from app.services.extraction_service import (
    ExtractionOrchestrator,
    DocumentNotEligibleError,
    ExtractionProviderError,
    ExtractionQuotaError,
    ExtractionAuthError,
    ExtractionSchemaError,
    ExtractionPersistenceError,
)
from app.services.intelligence_service import (
    DocumentNotFoundError,
    ConcurrentExtractionError,
    PersistenceError,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Intelligence & Knowledge Extraction"])


def get_extraction_orchestrator() -> ExtractionOrchestrator:
    """Dependency provider for ExtractionOrchestrator."""
    return ExtractionOrchestrator()


# =============================================================================
# 1. Document Extraction Trigger Endpoints
# =============================================================================

@router.post(
    "/api/v1/documents/{document_id}/extract",
    response_model=DocumentExtractionResponse,
    status_code=status.HTTP_200_OK,
    summary="Extract structured knowledge from document",
    description="Initiates end-to-end evidence-grounded extraction: validates document eligibility, acquires a concurrency lease, prompts the configured Gemini provider for structured JSON, verifies citations via the evidence grounding engine, and atomically persists entities, mentions, relationships, and facts.",
)
@router.post(
    "/api/v1/document/{document_id}/extract",
    response_model=DocumentExtractionResponse,
    status_code=status.HTTP_200_OK,
    include_in_schema=False,
)
def extract_document(
    document_id: str,
    db: Session = Depends(get_db),
    orchestrator: ExtractionOrchestrator = Depends(get_extraction_orchestrator),
) -> DocumentExtractionResponse:
    """Synchronously triggers and executes the complete extraction pipeline for an ingested document."""
    try:
        result = orchestrator.extract_document(db=db, document_id=document_id)
        return DocumentExtractionResponse(
            success=True,
            message=f"Extraction completed successfully for document '{document_id}'.",
            run_id=result.run_id,
            document_id=result.document_id,
            status=result.status,
            summary=result,
            execution_duration_ms=result.execution_duration_ms,
        )
    except DocumentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except DocumentNotEligibleError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except ConcurrentExtractionError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
    except ExtractionQuotaError as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(exc),
        ) from exc
    except ExtractionAuthError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc
    except ExtractionSchemaError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    except ExtractionProviderError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    except (ExtractionPersistenceError, PersistenceError) as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected error during document extraction: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected internal error occurred during document extraction.",
        ) from exc


# =============================================================================
# 2. Document Knowledge Retrieval Endpoints
# =============================================================================

@router.get(
    "/api/v1/documents/{document_id}/knowledge",
    response_model=DocumentKnowledgeResponse,
    summary="Get persistent knowledge for document",
    description="Retrieves the consolidated knowledge base extracted from a document, including facts with verification statuses and citations, canonical entities with surface mentions, and directed relationships.",
)
@router.get(
    "/api/v1/document/{document_id}/knowledge",
    response_model=DocumentKnowledgeResponse,
    include_in_schema=False,
)
def get_document_knowledge(
    document_id: str,
    db: Session = Depends(get_db),
    orchestrator: ExtractionOrchestrator = Depends(get_extraction_orchestrator),
) -> DocumentKnowledgeResponse:
    """Retrieves all persisted knowledge, citations, entities, and relationships for a document."""
    try:
        return orchestrator.get_document_knowledge(db=db, document_id=document_id)
    except DocumentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


# =============================================================================
# 3. Extraction Run Telemetry Endpoints
# =============================================================================

@router.get(
    "/api/v1/extraction-runs/{run_id}",
    response_model=ExtractionRunResponse,
    summary="Get extraction run telemetry",
    description="Retrieves diagnostic telemetry, token consumption metrics, execution duration, and status for a specific extraction run.",
)
@router.get(
    "/api/v1/extraction-run/{run_id}",
    response_model=ExtractionRunResponse,
    include_in_schema=False,
)
def get_extraction_run(
    run_id: str,
    db: Session = Depends(get_db),
) -> ExtractionRunResponse:
    """Retrieves telemetry record for an individual extraction run."""
    run = db.query(ExtractionRun).filter(ExtractionRun.id == run_id).first()
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ExtractionRun with ID '{run_id}' not found.",
        )
    return ExtractionRunResponse.model_validate(run)


@router.get(
    "/api/v1/documents/{document_id}/extractions",
    response_model=ExtractionRunListResponse,
    summary="List extraction runs for document",
    description="Returns the history of extraction runs executed for a document, ordered newest first.",
)
@router.get(
    "/api/v1/document/{document_id}/extractions",
    response_model=ExtractionRunListResponse,
    include_in_schema=False,
)
def list_document_extractions(
    document_id: str,
    db: Session = Depends(get_db),
) -> ExtractionRunListResponse:
    """Lists all extraction telemetry runs for a specific document."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID '{document_id}' not found.",
        )
    runs = (
        db.query(ExtractionRun)
        .filter(ExtractionRun.document_id == document_id)
        .order_by(desc(ExtractionRun.created_at))
        .all()
    )
    return ExtractionRunListResponse(
        items=[ExtractionRunResponse.model_validate(r) for r in runs],
        total=len(runs),
    )


# =============================================================================
# 4. Cross-Document Fact & Entity Query Endpoints
# =============================================================================

@router.get(
    "/api/v1/facts",
    response_model=FactListResponse,
    summary="List extracted facts",
    description="Returns a paginated list of extracted facts across documents with optional filtering by document, category, or verification status.",
)
def list_facts(
    document_id: Optional[str] = Query(None, description="Filter by source document UUID"),
    category: Optional[str] = Query(None, description="Filter by fact category (decision, responsibility, commitment, deadline, risk)"),
    verification_status: Optional[str] = Query(None, description="Filter by verification status (evidence-backed, human-verified, inferred, etc.)"),
    limit: int = Query(50, ge=1, le=100, description="Page limit"),
    offset: int = Query(0, ge=0, description="Page offset"),
    db: Session = Depends(get_db),
) -> FactListResponse:
    """Lists facts with optional filtering and pagination."""
    query = db.query(ExtractedFact)
    if document_id:
        query = query.filter(ExtractedFact.document_id == document_id)
    if category:
        query = query.filter(ExtractedFact.category == category.lower())
    if verification_status:
        query = query.filter(ExtractedFact.verification_status == verification_status.lower())

    total = query.count()
    facts = query.order_by(desc(ExtractedFact.created_at)).offset(offset).limit(limit).all()

    return FactListResponse(
        items=[ExtractedFactDetailResponse.model_validate(f) for f in facts],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/api/v1/entities",
    response_model=EntityListResponse,
    summary="List canonical entities",
    description="Returns a paginated list of canonical organizational entities with optional category and search filtering.",
)
def list_entities(
    category: Optional[str] = Query(None, description="Filter by entity category (person, role, organization, project, etc.)"),
    search: Optional[str] = Query(None, description="Substring search against entity name or canonical name"),
    limit: int = Query(50, ge=1, le=100, description="Page limit"),
    offset: int = Query(0, ge=0, description="Page offset"),
    db: Session = Depends(get_db),
) -> EntityListResponse:
    """Lists canonical entities with optional filtering and pagination."""
    query = db.query(ExtractedEntity)
    if category:
        query = query.filter(ExtractedEntity.category == category.lower())
    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            func.lower(ExtractedEntity.name).like(term)
            | func.lower(ExtractedEntity.canonical_name).like(term)
        )

    total = query.count()
    entities = query.order_by(ExtractedEntity.name.asc()).offset(offset).limit(limit).all()

    return EntityListResponse(
        items=[ExtractedEntityResponse.model_validate(e) for e in entities],
        total=total,
        limit=limit,
        offset=offset,
    )
