import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, Header, Request, status
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.config import settings
from app.core.database import get_db
from app.models.continuity import KnowledgeConflict, HandoverDossier, QuestionAnswerAudit
from app.schemas.continuity import (
    KnowledgeConflictResponse,
    KnowledgeConflictResolve,
    ConflictListResponse,
    ConflictApprovalRequestCreate,
    ConflictApprovalRequestResponse,
    ConflictHumanAdjudicateRequest,
    ConflictResolutionAuditResponse,
    MattermostLoginRequest,
    MattermostLoginResponse,
    ContinuityOverviewResponse,
    HandoverDossierCreateRequest,
    HandoverDossierResponse,
    HandoverDossierListResponse,
    QARequest,
    QAResponse,
    QAHistoryResponse,
)
from app.services.intelligence_analyzer import OrganizationalIntelligenceService
from app.services.approval_service import (
    ConflictApprovalService,
    ConflictApprovalError,
    ConflictNotFoundError,
    ApprovalRequestNotFoundError,
    UnauthorizedApproverError,
    InvalidTokenError,
    TokenExpiredError,
    TokenAlreadyConsumedError,
    TokenBindingMismatchError,
    TokenRejectedError,
)
from app.services.continuity_service import ContinuityService
from app.services.dossier_service import HandoverDossierService
from app.services.qa_service import QuestionAnsweringService
from app.core.rate_limiter import login_rate_limiter

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
    status_filter: Optional[str] = Query("open", alias="status", description="Filter by status (open, resolved, dismissed, archived, all)"),
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


@router.post(
    "/api/v1/intelligence/conflicts/{conflict_id}/request-resolution",
    response_model=ConflictApprovalRequestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Request human approval for conflict resolution",
    description="Initiates two-phase resolution: generates a single-use approval token (stored as SHA-256 hash) and queues an approval request for the human reviewer in Switch.",
)
def request_conflict_resolution(
    conflict_id: str,
    payload: ConflictApprovalRequestCreate,
    db: Session = Depends(get_db),
) -> ConflictApprovalRequestResponse:
    """Initiates an approval request for a conflict resolution."""
    try:
        record, _raw_token = ConflictApprovalService.create_approval_request(
            db=db,
            conflict_id=conflict_id,
            resolution_notes=payload.resolution_notes,
            proposed_status=payload.proposed_status,
            requesting_agent=payload.requesting_agent or "relay-knowledge-extractor",
        )
        return ConflictApprovalRequestResponse(
            id=record.id,
            conflict_id=record.conflict_id,
            requesting_agent=record.requesting_agent,
            proposed_status=record.proposed_status,
            resolution_notes=record.resolution_notes,
            status=record.status,
            expires_at=record.expires_at,
            created_at=record.created_at,
            message="Resolution request submitted. Awaiting authenticated human decision from Switch.",
        )
    except ConflictNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except ConflictApprovalError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post(
    "/api/v1/intelligence/conflicts/{conflict_id}/adjudicate",
    summary="Adjudicate conflict resolution request (trusted human reviewer)",
    description="Authorizes or rejects a pending conflict resolution request with authenticated human credentials (Mattermost session or Operator Secret).",
)
def adjudicate_conflict_resolution(
    conflict_id: str,
    payload: ConflictHumanAdjudicateRequest,
    request: Request,
    x_mattermost_token: Optional[str] = Header(None, alias="X-Mattermost-Token"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
    x_operator_secret: Optional[str] = Header(None, alias="X-Operator-Secret"),
    db: Session = Depends(get_db),
):
    """Adjudicates a pending resolution request with verified human credentials."""
    rate_key = None
    if payload.login_id:
        client_ip = request.client.host if request.client else "unknown"
        rate_key = f"{client_ip}:{payload.login_id.strip().lower()}"
        is_locked, remaining = login_rate_limiter.is_locked_out(rate_key)
        if is_locked:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many failed login attempts. Please wait {remaining} seconds before trying again.",
                headers={"Retry-After": str(remaining)},
            )

    mm_token = (
        payload.session_token
        or x_mattermost_token
        or (authorization.replace("Bearer ", "").strip() if authorization and authorization.startswith("Bearer ") else None)
    )

    try:
        record, conflict = ConflictApprovalService.human_adjudicate_request(
            db=db,
            request_id=payload.request_id,
            decision=payload.decision,
            approver_id=payload.approver_id,
            approver_auth_type=payload.approver_auth_type,
            operator_secret=x_operator_secret,
            mattermost_token=mm_token,
            login_id=payload.login_id,
            password=payload.password,
            decision_notes=payload.decision_notes,
        )
        if rate_key:
            login_rate_limiter.record_success(rate_key)
        resolved_by = conflict.resolved_by if conflict else f"Rejected by reviewer"
        return {
            "success": True,
            "decision": payload.decision,
            "request_id": record.id,
            "conflict_id": conflict_id,
            "status": conflict.status if conflict else "open",
            "resolved_by": resolved_by,
            "message": f"Conflict resolution request {payload.decision} by {resolved_by}.",
        }
    except UnauthorizedApproverError as exc:
        if rate_key:
            is_now_locked, lock_rem = login_rate_limiter.record_failure(rate_key)
            if is_now_locked:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Too many failed login attempts. Account temporarily locked for {lock_rem} seconds.",
                    headers={"Retry-After": str(lock_rem)},
                )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))
    except ApprovalRequestNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except TokenExpiredError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except (TokenAlreadyConsumedError, TokenRejectedError) as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    except ConflictApprovalError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post(
    "/api/v1/intelligence/approvals/auth/login",
    response_model=MattermostLoginResponse,
    summary="Authenticate human reviewer via Mattermost credentials",
    description="Validates human reviewer credentials server-to-server against Mattermost with sliding-window rate limiting and safe failure handling.",
)
def mattermost_human_login(
    payload: MattermostLoginRequest,
    request: Request,
):
    """Authenticates human reviewer against Mattermost server-to-server with rate limiting and safe failure handling."""
    client_ip = request.client.host if request.client else "unknown"
    rate_key = f"{client_ip}:{payload.login_id.strip().lower()}"

    is_locked, remaining = login_rate_limiter.is_locked_out(rate_key)
    if is_locked:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed login attempts. Please wait {remaining} seconds before trying again.",
            headers={"Retry-After": str(remaining)},
        )

    from app.services.mattermost_auth import (
        MattermostAuthService,
        InvalidCredentialsError,
        InvalidSessionTokenError,
        MattermostServiceUnavailableError,
    )

    try:
        profile = MattermostAuthService.login_with_credentials(payload.login_id, payload.password)
        login_rate_limiter.record_success(rate_key)
        return MattermostLoginResponse(
            success=True,
            user_id=profile["id"],
            username=profile["username"],
            email=profile.get("email"),
            token=profile["session_token"],
            verified_approver_id=profile["verified_approver_id"],
            message=f"Authenticated as {profile['verified_approver_id']}",
        )
    except (InvalidCredentialsError, InvalidSessionTokenError):
        is_now_locked, lock_rem = login_rate_limiter.record_failure(rate_key)
        if is_now_locked:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many failed login attempts. Account temporarily locked for {lock_rem} seconds.",
                headers={"Retry-After": str(lock_rem)},
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
        )
    except MattermostServiceUnavailableError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Mattermost authentication service is temporarily unavailable. Please try again shortly.",
        )
    except Exception as exc:
        logger.error("Unexpected error in mattermost_human_login: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed due to an internal error.",
        )


@router.get(
    "/api/v1/intelligence/approval-requests/pending",
    summary="List pending conflict resolution approval requests with full competing evidence",
)
def list_pending_approval_requests(
    conflict_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Lists pending approval requests awaiting human review in Switch, including full competing evidence."""
    requests = ConflictApprovalService.list_pending_requests(db, conflict_id=conflict_id)
    items = []
    for r in requests:
        conflict = db.query(KnowledgeConflict).filter(KnowledgeConflict.id == r.conflict_id).first()
        conflict_data = KnowledgeConflictResponse.model_validate(conflict) if conflict else None
        items.append({
            "id": r.id,
            "request_id": r.id,
            "conflict_id": r.conflict_id,
            "requesting_agent": r.requesting_agent,
            "proposed_status": r.proposed_status,
            "resolution_notes": r.resolution_notes,
            "status": r.status,
            "expires_at": r.expires_at,
            "created_at": r.created_at,
            "conflict": conflict_data.model_dump() if conflict_data else None,
            "review_url": f"/api/v1/intelligence/approvals/review?request_id={r.id}",
        })
    return items


@router.get(
    "/api/v1/intelligence/approval-requests/{request_id}",
    summary="Get details of a specific approval request with competing facts and source citations",
)
def get_approval_request_details(
    request_id: str,
    db: Session = Depends(get_db),
):
    """Fetches details of an approval request with both competing facts and verbatim citations."""
    record = ConflictApprovalService.get_pending_request(db, request_id=request_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Approval request '{request_id}' not found.")

    conflict = db.query(KnowledgeConflict).filter(KnowledgeConflict.id == record.conflict_id).first()
    conflict_data = KnowledgeConflictResponse.model_validate(conflict) if conflict else None

    return {
        "id": record.id,
        "request_id": record.id,
        "conflict_id": record.conflict_id,
        "requesting_agent": record.requesting_agent,
        "proposed_status": record.proposed_status,
        "resolution_notes": record.resolution_notes,
        "status": record.status,
        "expires_at": record.expires_at,
        "created_at": record.created_at,
        "conflict": conflict_data.model_dump() if conflict_data else None,
        "review_url": f"/api/v1/intelligence/approvals/review?request_id={record.id}",
    }


@router.post(
    "/api/v1/intelligence/conflicts/{conflict_id}/issue-token",
    summary="Issue a one-time human approval token (authorized human operator only)",
)
def issue_approval_token(
    conflict_id: str,
    payload: ConflictApprovalRequestCreate,
    x_operator_secret: Optional[str] = Header(None, alias="X-Operator-Secret"),
    db: Session = Depends(get_db),
):
    """Generates a one-time approval token for an authenticated human operator."""
    expected = settings.SWITCH_OPERATOR_SECRET
    if not expected or not x_operator_secret or x_operator_secret != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Human operator authorization required to issue one-time approval tokens.",
        )
    try:
        record, raw_token = ConflictApprovalService.create_approval_request(
            db=db,
            conflict_id=conflict_id,
            resolution_notes=payload.resolution_notes,
            proposed_status=payload.proposed_status,
            requesting_agent=payload.requesting_agent or "human_operator",
        )
        return {
            "success": True,
            "request_id": record.id,
            "conflict_id": record.conflict_id,
            "approval_token": raw_token,
            "expires_at": record.expires_at,
            "status": record.status,
            "message": "One-time human approval token generated securely. Valid for single use only.",
        }
    except ConflictNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except ConflictApprovalError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get(
    "/api/v1/intelligence/approvals/review",
    response_class=HTMLResponse,
    summary="Human Review Screen for Conflict Resolution Approval",
)
def review_approval_request_html(
    request_id: str = Query(..., description="UUID of pending approval request"),
    db: Session = Depends(get_db),
):
    """Renders human-facing review UI with competing facts, verbatim citations, and decision controls."""
    record = ConflictApprovalService.get_pending_request(db, request_id=request_id)
    if not record:
        return HTMLResponse(
            content=f"<html><body style='font-family:sans-serif;padding:40px;background:#0d1117;color:#fff;'><h2>Approval Request Not Found</h2><p>Request ID '{request_id}' does not exist or has expired.</p></body></html>",
            status_code=404,
        )

    conflict = db.query(KnowledgeConflict).filter(KnowledgeConflict.id == record.conflict_id).first()
    conflict_data = KnowledgeConflictResponse.model_validate(conflict) if conflict else None

    # Render competing facts and citations
    fact_a_text = conflict_data.fact_a.statement if conflict_data and conflict_data.fact_a else "No primary statement recorded."
    fact_b_text = conflict_data.fact_b.statement if conflict_data and conflict_data.fact_b else "No competing statement recorded."

    citations_a_html = ""
    if conflict_data and conflict_data.fact_a and conflict_data.fact_a.citations:
        for c in conflict_data.fact_a.citations:
            source_label = getattr(c, 'source_location', None) or 'Document Reference'
            citations_a_html += f"<blockquote style='border-left:3px solid #58a6ff;margin:8px 0;padding:6px 12px;background:#161b22;font-size:13px;'>&ldquo;{c.verbatim_quote}&rdquo;<br><span style='color:#8b949e;font-size:11px;'>Source: {source_label}</span></blockquote>"
    else:
        citations_a_html = "<p style='color:#8b949e;font-size:12px;'>No direct citation attached.</p>"

    citations_b_html = ""
    if conflict_data and conflict_data.fact_b and conflict_data.fact_b.citations:
        for c in conflict_data.fact_b.citations:
            source_label = getattr(c, 'source_location', None) or 'Document Reference'
            citations_b_html += f"<blockquote style='border-left:3px solid #f85149;margin:8px 0;padding:6px 12px;background:#161b22;font-size:13px;'>&ldquo;{c.verbatim_quote}&rdquo;<br><span style='color:#8b949e;font-size:11px;'>Source: {source_label}</span></blockquote>"
    else:
        citations_b_html = "<p style='color:#8b949e;font-size:12px;'>No direct citation attached.</p>"

    title = conflict_data.title if conflict_data else "Organizational Conflict"
    desc = conflict_data.description if conflict_data else "Discrepancy awaiting human adjudication."
    severity = (conflict_data.severity if conflict_data else "medium").upper()
    sev_color = "#f85149" if severity in ("CRITICAL", "HIGH") else "#d29922"

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Relay Human Approval - {title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0b0f19; color: #c9d1d9; margin: 0; padding: 24px; }}
    .container {{ max-width: 960px; margin: 0 auto; background: #111827; border: 1px solid #374151; border-radius: 8px; padding: 28px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }}
    .badge {{ display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: bold; background: {sev_color}22; color: {sev_color}; border: 1px solid {sev_color}44; }}
    .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 24px 0; }}
    .card {{ background: #1f2937; border: 1px solid #374151; border-radius: 6px; padding: 18px; }}
    .card h4 {{ margin-top: 0; color: #9ca3af; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; }}
    .notes-box {{ background: #1e293b; border: 1px dashed #475569; padding: 14px; border-radius: 6px; margin: 18px 0; }}
    .form-group {{ margin-bottom: 16px; }}
    label {{ display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #e5e7eb; }}
    input, textarea {{ width: 100%; box-sizing: border-box; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #f8fafc; padding: 10px; font-size: 14px; }}
    .btn {{ display: inline-block; padding: 10px 20px; border-radius: 6px; font-weight: 600; font-size: 14px; cursor: pointer; border: none; }}
    .btn-approve {{ background: #10b981; color: white; margin-right: 12px; }}
    .btn-approve:hover {{ background: #059669; }}
    .btn-reject {{ background: #ef4444; color: white; }}
    .btn-reject:hover {{ background: #dc2626; }}
    .btn-secondary {{ background: #374151; color: white; padding: 8px 14px; font-size: 13px; }}
    .btn-secondary:hover {{ background: #4b5563; }}
    .auth-tabs {{ display: flex; gap: 8px; margin-bottom: 16px; border-bottom: 1px solid #374151; padding-bottom: 8px; }}
    .tab-btn {{ background: transparent; border: 1px solid transparent; color: #9ca3af; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; }}
    .tab-btn.active {{ background: #1f2937; color: #60a5fa; border-color: #3b82f6; }}
    #result-box {{ margin-top: 20px; padding: 14px; border-radius: 6px; display: none; font-size: 14px; }}
    .verified-banner {{ background: #064e3b; border: 1px solid #059669; color: #a7f3d0; padding: 10px 14px; border-radius: 6px; margin-bottom: 16px; font-size: 13px; display: none; }}
  </style>
</head>
<body>
  <div class="container">
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <h2 style="margin:0; color:#f9fafb;">Two-Phase Conflict Resolution Review</h2>
      <span class="badge">{severity} SEVERITY</span>
    </div>
    <p style="color:#9ca3af; font-size:14px; margin: 8px 0 20px 0;">Request ID: <code>{record.id}</code> &bull; Conflict ID: <code>{record.conflict_id}</code></p>

    <div style="background:#1f2937; border-left:4px solid #3b82f6; padding:14px; border-radius:4px; margin-bottom:20px;">
      <h3 style="margin:0 0 6px 0; font-size:16px; color:#60a5fa;">{title}</h3>
      <p style="margin:0; font-size:14px; color:#d1d5db;">{desc}</p>
    </div>

    <div class="grid">
      <div class="card" style="border-top:3px solid #38bdf8;">
        <h4>Current / Recorded Assertion (Fact A)</h4>
        <p style="font-size:14px; line-height:1.5; color:#f3f4f6; font-weight:500;">{fact_a_text}</p>
        <div style="margin-top:14px;">
          <span style="font-size:11px; color:#9ca3af; font-weight:bold; text-transform:uppercase;">Source Evidence Citations:</span>
          {citations_a_html}
        </div>
      </div>
      <div class="card" style="border-top:3px solid #f87171;">
        <h4>Competing / Superseding Assertion (Fact B)</h4>
        <p style="font-size:14px; line-height:1.5; color:#f3f4f6; font-weight:500;">{fact_b_text}</p>
        <div style="margin-top:14px;">
          <span style="font-size:11px; color:#9ca3af; font-weight:bold; text-transform:uppercase;">Source Evidence Citations:</span>
          {citations_b_html}
        </div>
      </div>
    </div>

    <div class="notes-box">
      <h4 style="margin:0 0 6px 0; color:#94a3b8; font-size:12px; text-transform:uppercase;">Proposed Resolution by AI Agent ({record.requesting_agent})</h4>
      <p style="margin:0; font-size:14px; color:#e2e8f0;">Proposed Status: <strong>{record.proposed_status}</strong></p>
      <p style="margin:6px 0 0 0; font-size:13px; color:#cbd5e1; font-style:italic;">&ldquo;{record.resolution_notes}&rdquo;</p>
    </div>

    <div style="border-top: 1px solid #374151; padding-top: 20px; margin-top: 24px;">
      <h3 style="margin-top:0; color:#f3f4f6; font-size:16px;">Human Adjudication Action</h3>
      <p style="color:#9ca3af; font-size:13px; margin-bottom:16px;">Verified human identity is cryptographically required. Choose your preferred authentication method:</p>

      <div class="auth-tabs">
        <button class="tab-btn active" id="tab-token-btn" onclick="selectAuthTab('token')">Personal Access Token / PAT</button>
        <button class="tab-btn" id="tab-login-btn" onclick="selectAuthTab('login')">Sign In with Mattermost Account</button>
      </div>

      <div id="verified-banner" class="verified-banner">
        <strong>Verified Reviewer:</strong> <span id="verified-identity-label"></span>
      </div>

      <!-- Mode 1: Token / PAT -->
      <div id="auth-token-pane">
        <div class="form-group">
          <label for="auth_token">Mattermost Personal Access Token (PAT) or Active Session Token:</label>
          <input type="password" id="auth_token" placeholder="Paste your token from Profile → Security → Personal Access Tokens">
          <p style="color:#6b7280; font-size:12px; margin:4px 0 0 0;">Navigate to Mattermost <code>Profile → Security → Personal Access Tokens</code> to generate or view your personal access token.</p>
        </div>
      </div>

      <!-- Mode 2: Username & Password Login -->
      <div id="auth-login-pane" style="display:none;">
        <div class="form-group">
          <label for="login_id">Mattermost Username or Email:</label>
          <input type="text" id="login_id" placeholder="e.g. user or user@localhost.local">
        </div>
        <div class="form-group">
          <label for="login_pwd">Mattermost Account Password:</label>
          <input type="password" id="login_pwd" placeholder="Enter your password">
        </div>
        <button class="btn btn-secondary" type="button" onclick="verifyCredentialsOnly()">Verify Credentials</button>
      </div>

      <div class="form-group" style="margin-top:20px;">
        <label for="decision_notes">Reviewer Adjudication Justification & Notes:</label>
        <textarea id="decision_notes" rows="2" placeholder="Explain the rationale for this adjudication decision..."></textarea>
      </div>

      <div style="margin-top:20px;">
        <button class="btn btn-approve" onclick="submitDecision('approved')">Approve Resolution</button>
        <button class="btn btn-reject" onclick="submitDecision('rejected')">Reject Proposal</button>
      </div>

      <div id="result-box"></div>
    </div>
  </div>

  <script>
    let currentAuthMode = 'token';
    let verifiedSessionToken = null;

    function selectAuthTab(mode) {{
      currentAuthMode = mode;
      document.getElementById('tab-token-btn').className = 'tab-btn' + (mode === 'token' ? ' active' : '');
      document.getElementById('tab-login-btn').className = 'tab-btn' + (mode === 'login' ? ' active' : '');
      document.getElementById('auth-token-pane').style.display = (mode === 'token' ? 'block' : 'none');
      document.getElementById('auth-login-pane').style.display = (mode === 'login' ? 'block' : 'none');
    }}

    async function verifyCredentialsOnly() {{
      const loginId = document.getElementById('login_id').value.trim();
      const pwd = document.getElementById('login_pwd').value;
      const resBox = document.getElementById('result-box');

      if (!loginId || !pwd) {{
        resBox.style.display = 'block';
        resBox.style.background = '#7f1d1d';
        resBox.style.color = '#fecaca';
        resBox.innerText = 'Username/email and password are required.';
        return;
      }}

      resBox.style.display = 'block';
      resBox.style.background = '#1e293b';
      resBox.style.color = '#94a3b8';
      resBox.innerText = 'Verifying credentials with Mattermost...';

      try {{
        const resp = await fetch('/api/v1/intelligence/approvals/auth/login', {{
          method: 'POST',
          headers: {{ 'Content-Type': 'application/json' }},
          body: JSON.stringify({{ login_id: loginId, password: pwd }})
        }});
        const data = await resp.json();
        if (resp.ok && data.success) {{
          verifiedSessionToken = data.token;
          const banner = document.getElementById('verified-banner');
          document.getElementById('verified-identity-label').innerText = data.verified_approver_id;
          banner.style.display = 'block';
          resBox.style.background = '#064e3b';
          resBox.style.color = '#a7f3d0';
          resBox.innerText = 'Identity verified: ' + data.verified_approver_id + '. You may now approve or reject.';
        }} else {{
          resBox.style.background = '#7f1d1d';
          resBox.style.color = '#ffffff';
          resBox.innerText = 'Authentication failed: ' + (data.detail || data.message || 'Invalid credentials');
        }}
      }} catch (err) {{
        resBox.style.background = '#7f1d1d';
        resBox.style.color = '#ffffff';
        resBox.innerText = 'Network error verifying credentials: ' + err.message;
      }}
    }}

    async function submitDecision(decision) {{
      const notes = document.getElementById('decision_notes').value.trim();
      const resBox = document.getElementById('result-box');

      let token = verifiedSessionToken;
      let loginId = null;
      let pwd = null;

      if (!token) {{
        if (currentAuthMode === 'token') {{
          token = document.getElementById('auth_token').value.trim();
        }} else {{
          loginId = document.getElementById('login_id').value.trim();
          pwd = document.getElementById('login_pwd').value;
        }}
      }}

      if (!token && (!loginId || !pwd)) {{
        resBox.style.display = 'block';
        resBox.style.background = '#7f1d1d';
        resBox.style.color = '#fecaca';
        resBox.innerText = currentAuthMode === 'token'
          ? 'Personal Access Token is required to adjudicate.'
          : 'Mattermost login credentials are required to adjudicate.';
        return;
      }}

      resBox.style.display = 'block';
      resBox.style.background = '#1e293b';
      resBox.style.color = '#94a3b8';
      resBox.innerText = 'Submitting human decision...';

      const payload = {{
        request_id: '{record.id}',
        decision: decision,
        decision_notes: notes || undefined
      }};

      const headers = {{
        'Content-Type': 'application/json'
      }};

      if (token) {{
        headers['X-Mattermost-Token'] = token;
      }} else {{
        payload.login_id = loginId;
        payload.password = pwd;
      }}

      try {{
        const response = await fetch('/api/v1/intelligence/conflicts/{record.conflict_id}/adjudicate', {{
          method: 'POST',
          headers: headers,
          body: JSON.stringify(payload)
        }});

        const data = await response.json();
        if (response.ok && data.success) {{
          resBox.style.background = decision === 'approved' ? '#064e3b' : '#7f1d1d';
          resBox.style.color = '#ffffff';
          resBox.innerHTML = '<strong>Decision Recorded:</strong> ' + data.message + '<br><span style="font-size:12px;opacity:0.9;">Status: ' + data.status + ' | Approver: ' + data.resolved_by + '</span>';
        }} else {{
          resBox.style.background = '#7f1d1d';
          resBox.style.color = '#ffffff';
          resBox.innerHTML = '<strong>Error:</strong> ' + (data.detail || data.message || 'Adjudication failed.');
        }}
      }} catch (err) {{
        resBox.style.background = '#7f1d1d';
        resBox.style.color = '#ffffff';
        resBox.innerText = 'Network error submitting decision: ' + err.message;
      }}
    }}
  </script>
</body>
</html>
"""
    return HTMLResponse(content=html_content, status_code=200)


@router.get(
    "/api/v1/intelligence/conflicts/{conflict_id}/audit-trail",
    response_model=List[ConflictResolutionAuditResponse],
    summary="Get conflict resolution audit trail",
)
def get_conflict_audit_trail(
    conflict_id: str,
    db: Session = Depends(get_db),
) -> List[ConflictResolutionAuditResponse]:
    """Retrieves chronological audit trail of human decisions for a conflict."""
    audits = ConflictApprovalService.get_audit_trail(db, conflict_id=conflict_id)
    return [ConflictResolutionAuditResponse.model_validate(a) for a in audits]


@router.patch(
    "/api/v1/intelligence/conflicts/{conflict_id}",
    response_model=KnowledgeConflictResponse,
    summary="Adjudicate or resolve conflict",
    description="Records human reviewer justification and marks a conflict as resolved or dismissed. Requires an authenticated human operator secret or a valid one-time human approval token.",
)
@router.patch(
    "/api/v1/gaps/{conflict_id}",
    response_model=KnowledgeConflictResponse,
    include_in_schema=False,
)
def resolve_conflict(
    conflict_id: str,
    payload: KnowledgeConflictResolve,
    x_approval_token: Optional[str] = Header(None, alias="X-Approval-Token"),
    x_operator_secret: Optional[str] = Header(None, alias="X-Operator-Secret"),
    db: Session = Depends(get_db),
) -> KnowledgeConflictResponse:
    """Adjudicates a discrepancy with resolution notes."""
    # Independent protection: Unauthenticated requests are strictly rejected
    token = payload.approval_token or x_approval_token
    is_operator = x_operator_secret and x_operator_secret == settings.SWITCH_OPERATOR_SECRET

    if not token and not is_operator:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication and verified one-time approval token required. Direct unauthenticated requests are forbidden.",
        )

    if token:
        try:
            conflict = ConflictApprovalService.verify_and_consume_token(
                db=db,
                conflict_id=conflict_id,
                raw_token=token,
                approver_id=payload.resolved_by or "human_operator",
                resolution_notes=payload.resolution_notes,
            )
            return KnowledgeConflictResponse.model_validate(conflict)
        except ConflictNotFoundError as exc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
        except TokenBindingMismatchError as exc:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
        except TokenExpiredError as exc:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
        except TokenAlreadyConsumedError as exc:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
        except TokenRejectedError as exc:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
        except InvalidTokenError as exc:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
        except ConflictApprovalError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    # Operator secret path
    conflict = OrganizationalIntelligenceService.resolve_conflict(
        db=db,
        conflict_id=conflict_id,
        resolution_notes=payload.resolution_notes,
        status=payload.status,
        resolved_by=payload.resolved_by or "switch_operator",
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

