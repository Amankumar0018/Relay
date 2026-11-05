import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.models.continuity import KnowledgeConflict, HandoverDossier, QuestionAnswerAudit
from app.schemas.continuity import (
    KnowledgeConflictResponse,
    KnowledgeConflictResolve,
    ConflictListResponse,
    ContinuityOverviewResponse,
    HandoverDossierCreateRequest,
    HandoverDossierResponse,
    HandoverDossierListResponse,
    QARequest,
    QAResponse,
    QAHistoryResponse,
)
from app.services.intelligence_analyzer import OrganizationalIntelligenceService
from app.services.continuity_service import ContinuityService
from app.services.dossier_service import HandoverDossierService
from app.services.qa_service import QuestionAnsweringService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Organizational Intelligence & Continuity"])


# =============================================================================
# 1. Organizational Intelligence & Discrepancy Endpoints
# =============================================================================

@router.post(
    "/api/v1/intelligence/analyze",
    response_model=ConflictListResponse,
    summary="Run full organizational intelligence scan",
    description="Analyzes all stored facts, citations, entities, and relationships to identify contradictions, superseded decisions, outdated deadlines, changed responsibilities, missing ownership, and knowledge gaps.",
)
def run_intelligence_analysis(
    document_id: Optional[str] = Query(None, description="Optional document UUID to scope analysis"),
    db: Session = Depends(get_db),
) -> ConflictListResponse:
    """Triggers an intelligence audit and saves findings to the database."""
    findings = OrganizationalIntelligenceService.run_analysis(db, document_id=document_id)
    items = [KnowledgeConflictResponse.model_validate(c) for c in findings]
    open_count = sum(1 for c in findings if c.status == "open")
    critical_count = sum(1 for c in findings if c.severity == "critical" and c.status == "open")
    return ConflictListResponse(
        items=items,
        total=len(items),
        open_count=open_count,
        critical_count=critical_count,
    )


@router.get(
    "/api/v1/intelligence/conflicts",
    response_model=ConflictListResponse,
    summary="List organizational conflicts and knowledge gaps",
    description="Retrieves flagged contradictions, superseded decisions, outdated deadlines, and gaps with optional filtering.",
)
@router.get(
    "/api/v1/gaps",
    response_model=ConflictListResponse,
    include_in_schema=False,
)
@router.get(
    "/api/v1/conflicts",
    response_model=ConflictListResponse,
    include_in_schema=False,
)
def list_conflicts(
    conflict_type: Optional[str] = Query(None, alias="type", description="Filter by conflict type"),
    severity: Optional[str] = Query(None, description="Filter by severity (low, medium, high, critical)"),
    status_filter: Optional[str] = Query("open", alias="status", description="Filter by status (open, resolved, dismissed, all)"),
    db: Session = Depends(get_db),
) -> ConflictListResponse:
    """Lists detected discrepancies with severity and status filters."""
    query = db.query(KnowledgeConflict)
    if conflict_type:
        query = query.filter(KnowledgeConflict.conflict_type == conflict_type.lower())
    if severity:
        query = query.filter(KnowledgeConflict.severity == severity.lower())
    if status_filter and status_filter.lower() != "all":
        query = query.filter(KnowledgeConflict.status == status_filter.lower())

    findings = query.order_by(desc(KnowledgeConflict.created_at)).all()
    all_open = db.query(KnowledgeConflict).filter(KnowledgeConflict.status == "open").all()

    return ConflictListResponse(
        items=[KnowledgeConflictResponse.model_validate(c) for c in findings],
        total=len(findings),
        open_count=len(all_open),
        critical_count=sum(1 for c in all_open if c.severity == "critical"),
    )


@router.get(
    "/api/v1/intelligence/conflicts/{conflict_id}",
    response_model=KnowledgeConflictResponse,
    summary="Get conflict details",
)
def get_conflict(
    conflict_id: str,
    db: Session = Depends(get_db),
) -> KnowledgeConflictResponse:
    """Fetches details for a single detected discrepancy."""
    conflict = db.query(KnowledgeConflict).filter(KnowledgeConflict.id == conflict_id).first()
    if not conflict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conflict with ID '{conflict_id}' not found.",
        )
    return KnowledgeConflictResponse.model_validate(conflict)


@router.patch(
    "/api/v1/intelligence/conflicts/{conflict_id}",
    response_model=KnowledgeConflictResponse,
    summary="Adjudicate or resolve conflict",
    description="Records human reviewer justification and marks a conflict as resolved or dismissed.",
)
@router.patch(
    "/api/v1/gaps/{conflict_id}",
    response_model=KnowledgeConflictResponse,
    include_in_schema=False,
)
def resolve_conflict(
    conflict_id: str,
    payload: KnowledgeConflictResolve,
    db: Session = Depends(get_db),
) -> KnowledgeConflictResponse:
    """Adjudicates a discrepancy with resolution notes."""
    conflict = OrganizationalIntelligenceService.resolve_conflict(
        db=db,
        conflict_id=conflict_id,
        resolution_notes=payload.resolution_notes,
        status=payload.status,
        resolved_by=payload.resolved_by or "auditor",
    )
    if not conflict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conflict with ID '{conflict_id}' not found.",
        )
    return KnowledgeConflictResponse.model_validate(conflict)


# =============================================================================
# 2. Organizational Continuity Analysis Endpoints
# =============================================================================

@router.get(
    "/api/v1/continuity/overview",
    response_model=ContinuityOverviewResponse,
    summary="Get organizational continuity overview",
    description="Synthesizes transition readiness scores, owned projects, direct reports, critical path blockers, and unassigned assets.",
)
@router.get(
    "/api/v1/responsibilities",
    response_model=ContinuityOverviewResponse,
    include_in_schema=False,
)
def get_continuity_overview(
    leader_id: Optional[str] = Query(None, description="Optional entity UUID of outgoing leader"),
    db: Session = Depends(get_db),
) -> ContinuityOverviewResponse:
    """Returns the comprehensive continuity readiness assessment."""
    return ContinuityService.get_continuity_overview(db=db, leader_id=leader_id)


# =============================================================================
# 3. Handover Dossier Generation Endpoints
# =============================================================================

@router.post(
    "/api/v1/handovers/generate",
    response_model=HandoverDossierResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate executive handover dossier",
    description="Synthesizes an evidence-grounded briefing book across 5 chapters with verbatim citations and an actionable Day-1 to Day-30 roadmap.",
)
def generate_dossier(
    payload: Optional[HandoverDossierCreateRequest] = None,
    db: Session = Depends(get_db),
) -> HandoverDossierResponse:
    """Compiles and persists a new handover dossier from current organizational evidence."""
    return HandoverDossierService.generate_dossier(db=db, request=payload)


@router.get(
    "/api/v1/handovers",
    response_model=HandoverDossierListResponse,
    summary="List compiled handover dossiers",
)
def list_dossiers(
    db: Session = Depends(get_db),
) -> HandoverDossierListResponse:
    """Lists all previously compiled dossiers."""
    return HandoverDossierService.list_dossiers(db=db)


@router.get(
    "/api/v1/handovers/{dossier_id}",
    response_model=HandoverDossierResponse,
    summary="Get handover dossier by ID",
)
def get_dossier_by_id(
    dossier_id: str,
    db: Session = Depends(get_db),
) -> HandoverDossierResponse:
    """Retrieves full briefing book content and chapters for a specific dossier."""
    dossier = HandoverDossierService.get_dossier(db=db, dossier_id=dossier_id)
    if not dossier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Handover dossier with ID '{dossier_id}' not found.",
        )
    return dossier


# =============================================================================
# 4. Evidence-Grounded Natural-Language Q&A Endpoints
# =============================================================================

@router.post(
    "/api/v1/qa/ask",
    response_model=QAResponse,
    summary="Ask organizational knowledge question",
    description="Accepts a natural-language inquiry from incoming leadership, retrieves matching stored facts and verbatim citations, strictly checks evidence sufficiency, and generates a grounded response.",
)
@router.post(
    "/api/v1/agents/ask",
    response_model=QAResponse,
    include_in_schema=False,
)
def ask_question(
    payload: QARequest,
    db: Session = Depends(get_db),
) -> QAResponse:
    """Queries institutional memory with evidence grounding."""
    return QuestionAnsweringService.answer_question(db=db, question=payload.question)


@router.get(
    "/api/v1/qa/history",
    response_model=QAHistoryResponse,
    summary="Get recent question answering audit history",
)
def get_qa_history(
    limit: int = Query(20, ge=1, le=100, description="Page limit"),
    db: Session = Depends(get_db),
) -> QAHistoryResponse:
    """Retrieves audit log of recent natural-language inquiries."""
    return QuestionAnsweringService.get_history(db=db, limit=limit)

