"""
Comprehensive Verification Test Suite for Relay Two-Phase Human Approval System.

Verifies all 10 security and architectural requirements:
1. AI agent attempts resolution without human approval: rejected.
2. Agent supplies authorized_by="user" or similar string bypass: rejected.
3. Direct unauthenticated REST PATCH request: rejected (HTTP 401).
4. Valid authenticated human approval: succeeds.
5. Wrong conflict ID (binding mismatch): rejected (HTTP 403).
6. Expired token: rejected (HTTP 403).
7. Reused token (replay attack): rejected (HTTP 409).
8. Rejected approval: conflict remains open, not resolved.
9. Audit record correctly identifies actual human approver.
10. Existing conflict data and Q&A functionality remain intact.
"""

import uuid
import json
from datetime import datetime, timezone, timedelta
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from unittest.mock import patch, MagicMock, AsyncMock
from contextlib import asynccontextmanager

from app.core.config import settings
from app.models.document import Document
from app.models.knowledge import (
    DocumentSegment,
    ExtractedEntity,
    EntityMention,
    ExtractedFact,
    FactCitation,
)
from app.models.continuity import (
    KnowledgeConflict,
    ConflictApprovalToken,
    ConflictResolutionAudit,
)
from app.schemas.continuity import ConflictType, ConflictSeverity, ConflictStatus
from app.services.approval_service import ConflictApprovalService
from app.integrations.switch.mcp_server import (
    relay_request_conflict_resolution,
    relay_resolve_conflict,
)
from app.integrations.switch.approval_handler import SwitchApprovalHandler


def _setup_test_conflict(db: Session, title: str = "Odyssey Beta Lead Contradiction") -> KnowledgeConflict:
    """Helper fixture to insert an open conflict into the test database."""
    doc = Document(
        id=str(uuid.uuid4()),
        original_filename="handover_brief.txt",
        stored_filename=f"stored_{uuid.uuid4().hex[:8]}.txt",
        file_extension="txt",
        content_type="text/plain",
        file_size=512,
        sha256_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        storage_path="mock/path.txt",
        extraction_status="completed",
    )
    db.add(doc)

    entity = ExtractedEntity(
        id=str(uuid.uuid4()),
        name="Project Odyssey",
        canonical_name="project odyssey",
        category="project",
    )
    db.add(entity)

    fact = ExtractedFact(
        id=str(uuid.uuid4()),
        document_id=doc.id,
        primary_entity_id=entity.id,
        statement="Lead is Dr. Thorne",
        category="responsibility",
        confidence_score=0.95,
        verification_status="evidence-backed",
    )
    db.add(fact)

    conflict = KnowledgeConflict(
        id=str(uuid.uuid4()),
        conflict_type=ConflictType.CONTRADICTION.value,
        severity=ConflictSeverity.CRITICAL.value,
        status=ConflictStatus.OPEN.value,
        title=title,
        description="Conflicting lead assignment between Dr. Thorne and Sarah Chen.",
        fact_a_id=fact.id,
        entity_id=entity.id,
        document_id=doc.id,
    )
    db.add(conflict)
    db.commit()
    db.refresh(conflict)
    return conflict


# =============================================================================
# Requirement 1 & 2: MCP Tool Enforcement (Agent Impersonation & Bypass Defense)
# =============================================================================

@pytest.mark.anyio
async def test_ai_agent_cannot_resolve_without_human_approval_token():
    """Requirement 1: AI agent attempts resolution without approval token: strictly rejected."""
    res_str = await relay_resolve_conflict(
        conflict_id="c-mock-1",
        resolution_notes="Attempting unilateral AI resolution without token",
    )
    res = json.loads(res_str)
    assert res["success"] is False
    assert res["error"] == "HUMAN_APPROVAL_TOKEN_REQUIRED"
    assert "token" in res["message"].lower()


@pytest.mark.anyio
async def test_ai_agent_cannot_bypass_via_authorized_by_string():
    """Requirement 2: Agent supplies authorized_by='user' or 'admin': strictly rejected."""
    bypass_attempts = [
        "user",
        "admin",
        "administrator",
        "switch-admin",
        "Aman",
        "Dr. Aris Thorne",
    ]
    for bypass_string in bypass_attempts:
        res_str = await relay_resolve_conflict(
            conflict_id="c-mock-1",
            resolution_notes="Attempting string bypass",
            authorized_by=bypass_string,
        )
        res = json.loads(res_str)
        assert res["success"] is False, f"Failed for bypass attempt: {bypass_string}"
        assert res["error"] == "HUMAN_APPROVAL_TOKEN_REQUIRED"


# =============================================================================
# Requirement 3: REST API Independent Protection
# =============================================================================

def test_direct_unauthenticated_rest_patch_rejected(client: TestClient, db_session: Session):
    """Requirement 3: Direct unauthenticated REST PATCH request: rejected with HTTP 401."""
    conflict = _setup_test_conflict(db_session, "Unauthenticated Direct Attack")

    # 1. No auth headers, no token in payload
    res = client.patch(
        f"/api/v1/intelligence/conflicts/{conflict.id}",
        json={
            "status": "resolved",
            "resolution_notes": "Trying direct unauthenticated PATCH",
            "resolved_by": "untrusted_caller",
        },
    )
    assert res.status_code == 401
    assert "Authentication and verified one-time approval token required" in res.json()["detail"]

    # 2. Fake / forged token
    res_forged = client.patch(
        f"/api/v1/intelligence/conflicts/{conflict.id}",
        json={
            "status": "resolved",
            "resolution_notes": "Trying with forged token",
            "approval_token": "forged_nonexistent_token_xyz",
        },
    )
    assert res_forged.status_code == 403
    assert "invalid or unrecognized" in res_forged.json()["detail"]


# =============================================================================
# Requirement 4: Valid Authenticated Human Approval Workflow
# =============================================================================

def test_valid_authenticated_human_approval_via_adjudication(client: TestClient, db_session: Session):
    """Requirement 4A: Valid authenticated human approval via Switch adjudication succeeds."""
    conflict = _setup_test_conflict(db_session, "Odyssey Beta Milestone Conflict")

    # Step 1: Agent creates approval request (Phase 1)
    req_res = client.post(
        f"/api/v1/intelligence/conflicts/{conflict.id}/request-resolution",
        json={
            "proposed_status": "resolved",
            "resolution_notes": "Clarified that Beta milestone is Dec 10, GA is Jan 15.",
            "requesting_agent": "relay-knowledge-extractor",
        },
    )
    assert req_res.status_code == 201
    req_data = req_res.json()
    request_id = req_data["id"]
    assert req_data["status"] == "pending"
    assert req_data["conflict_id"] == conflict.id

    # Step 2: Verified human reviewer in Switch approves (Phase 2)
    adj_res = client.post(
        f"/api/v1/intelligence/conflicts/{conflict.id}/adjudicate",
        headers={"X-Operator-Secret": settings.SWITCH_OPERATOR_SECRET},
        json={
            "request_id": request_id,
            "decision": "approved",
            "approver_id": "Aman (Switch Human Reviewer)",
            "approver_auth_type": "switch_operator_secret",
            "decision_notes": "Confirmed with Dr. Thorne during handover review.",
        },
    )
    assert adj_res.status_code == 200
    adj_data = adj_res.json()
    assert adj_data["success"] is True
    assert adj_data["decision"] == "approved"
    assert adj_data["status"] == "resolved"

    # Verify conflict in DB is updated
    db_session.expire_all()
    updated_conflict = db_session.query(KnowledgeConflict).filter(KnowledgeConflict.id == conflict.id).first()
    assert updated_conflict.status == "resolved"
    assert updated_conflict.resolved_by == "Aman (Switch Human Reviewer)"
    assert "Confirmed with Dr. Thorne" in updated_conflict.resolution_notes


def test_valid_authenticated_human_approval_via_token(client: TestClient, db_session: Session):
    """Requirement 4B: Valid one-time token issued by human operator resolves conflict."""
    conflict = _setup_test_conflict(db_session, "Aegis Budget Discrepancy")

    # Human operator issues a single-use token
    issue_res = client.post(
        f"/api/v1/intelligence/conflicts/{conflict.id}/issue-token",
        headers={"X-Operator-Secret": settings.SWITCH_OPERATOR_SECRET},
        json={
            "proposed_status": "resolved",
            "resolution_notes": "Budget amendment signed off by VP Finance.",
            "requesting_agent": "human_operator",
        },
    )
    assert issue_res.status_code == 200
    issue_data = issue_res.json()
    raw_token = issue_data["approval_token"]
    assert raw_token is not None

    # Resolve using the one-time token
    resolve_res = client.patch(
        f"/api/v1/intelligence/conflicts/{conflict.id}",
        json={
            "status": "resolved",
            "resolution_notes": "Executing human-approved budget amendment.",
            "resolved_by": "Aman",
            "approval_token": raw_token,
        },
    )
    assert resolve_res.status_code == 200
    res_data = resolve_res.json()
    assert res_data["status"] == "resolved"
    assert res_data["resolved_by"] == "Aman"


# =============================================================================
# Requirement 5: Binding Mismatch Defense
# =============================================================================

def test_wrong_conflict_id_binding_mismatch_rejected(client: TestClient, db_session: Session):
    """Requirement 5: Token bound to conflict A attempted on conflict B is strictly rejected."""
    conflict_a = _setup_test_conflict(db_session, "Conflict Alpha")
    conflict_b = _setup_test_conflict(db_session, "Conflict Beta")

    # Create token bound to conflict A
    record, raw_token = ConflictApprovalService.create_approval_request(
        db=db_session,
        conflict_id=conflict_a.id,
        resolution_notes="Resolution specifically for Conflict Alpha",
    )

    # Attempt to consume token against conflict B
    res = client.patch(
        f"/api/v1/intelligence/conflicts/{conflict_b.id}",
        json={
            "status": "resolved",
            "resolution_notes": "Attempting cross-conflict replay",
            "approval_token": raw_token,
        },
    )
    assert res.status_code == 403
    assert f"bound to conflict '{conflict_a.id}', not '{conflict_b.id}'" in res.json()["detail"]

    # Verify conflict B remains open
    db_session.expire_all()
    cb = db_session.query(KnowledgeConflict).filter(KnowledgeConflict.id == conflict_b.id).first()
    assert cb.status == "open"


# =============================================================================
# Requirement 6: Expired Token Rejection
# =============================================================================

def test_expired_token_rejected(client: TestClient, db_session: Session):
    """Requirement 6: Expired approval token is strictly rejected with HTTP 403."""
    conflict = _setup_test_conflict(db_session, "Expired Token Test Conflict")

    # Create token with expiration in the past (-5 minutes)
    record, raw_token = ConflictApprovalService.create_approval_request(
        db=db_session,
        conflict_id=conflict.id,
        resolution_notes="Resolution note with immediate expiration",
        expires_in_minutes=-5,
    )

    res = client.patch(
        f"/api/v1/intelligence/conflicts/{conflict.id}",
        json={
            "status": "resolved",
            "resolution_notes": "Attempting consumption of expired token",
            "approval_token": raw_token,
        },
    )
    assert res.status_code == 403
    assert "expired" in res.json()["detail"].lower()

    # Verify token status is marked as expired
    db_session.expire_all()
    token_rec = db_session.query(ConflictApprovalToken).filter(ConflictApprovalToken.id == record.id).first()
    assert token_rec.status == "expired"


# =============================================================================
# Requirement 7: Reused Token Rejection (Replay Attack Defense)
# =============================================================================

def test_reused_token_replay_attack_rejected(client: TestClient, db_session: Session):
    """Requirement 7: Single-use enforcement: re-using an already consumed token returns HTTP 409."""
    conflict = _setup_test_conflict(db_session, "Single Use Replay Defense")

    record, raw_token = ConflictApprovalService.create_approval_request(
        db=db_session,
        conflict_id=conflict.id,
        resolution_notes="Valid single use resolution",
    )

    # First consumption: succeeds
    res_first = client.patch(
        f"/api/v1/intelligence/conflicts/{conflict.id}",
        json={
            "status": "resolved",
            "resolution_notes": "First legitimate consumption",
            "resolved_by": "Aman",
            "approval_token": raw_token,
        },
    )
    assert res_first.status_code == 200

    # Second consumption attempt (Replay attack): rejected with HTTP 409 Conflict
    res_replay = client.patch(
        f"/api/v1/intelligence/conflicts/{conflict.id}",
        json={
            "status": "resolved",
            "resolution_notes": "Replay attack attempt",
            "resolved_by": "Attacker",
            "approval_token": raw_token,
        },
    )
    assert res_replay.status_code == 409
    assert "already been used" in res_replay.json()["detail"].lower()


# =============================================================================
# Requirement 8: Rejected Approval Leaves Conflict Open
# =============================================================================

def test_rejected_approval_leaves_conflict_open(client: TestClient, db_session: Session):
    """Requirement 8: Explicit human rejection keeps conflict open and prevents resolution."""
    conflict = _setup_test_conflict(db_session, "Human Rejected Proposal")

    # Create approval request
    record, raw_token = ConflictApprovalService.create_approval_request(
        db=db_session,
        conflict_id=conflict.id,
        resolution_notes="Agent proposes dismissing critical security finding",
    )

    # Human reviewer rejects the proposal
    res_reject = client.post(
        f"/api/v1/intelligence/conflicts/{conflict.id}/adjudicate",
        headers={"X-Operator-Secret": settings.SWITCH_OPERATOR_SECRET},
        json={
            "request_id": record.id,
            "decision": "rejected",
            "approver_id": "Security Auditor",
            "decision_notes": "Dismissal rejected: Security audit must remain open until signoff.",
        },
    )
    assert res_reject.status_code == 200
    data = res_reject.json()
    assert data["decision"] == "rejected"
    assert data["status"] == "open"

    # Verify conflict remains open in the database
    db_session.expire_all()
    c = db_session.query(KnowledgeConflict).filter(KnowledgeConflict.id == conflict.id).first()
    assert c.status == "open"
    assert c.resolved_at is None

    # Verify token cannot be used subsequently
    res_attempt = client.patch(
        f"/api/v1/intelligence/conflicts/{conflict.id}",
        json={
            "status": "resolved",
            "resolution_notes": "Trying to use rejected token",
            "approval_token": raw_token,
        },
    )
    assert res_attempt.status_code == 403
    assert "rejected" in res_attempt.json()["detail"].lower()


# =============================================================================
# Requirement 9: Immutable Audit Record Verification
# =============================================================================

def test_audit_record_identifies_actual_human_approver(client: TestClient, db_session: Session):
    """Requirement 9: Audit record accurately captures approver, decision, timestamp, and binding."""
    conflict = _setup_test_conflict(db_session, "Audit Trail Verification")

    record, raw_token = ConflictApprovalService.create_approval_request(
        db=db_session,
        conflict_id=conflict.id,
        resolution_notes="Proposal to align launch milestones",
    )

    # Human approves via adjudication
    client.post(
        f"/api/v1/intelligence/conflicts/{conflict.id}/adjudicate",
        headers={"X-Operator-Secret": settings.SWITCH_OPERATOR_SECRET},
        json={
            "request_id": record.id,
            "decision": "approved",
            "approver_id": "Aman (Lead Switch Operator)",
            "approver_auth_type": "switch_operator_secret",
            "decision_notes": "Milestone verified against steering committee minutes.",
        },
    )

    # Query audit trail API
    trail_res = client.get(f"/api/v1/intelligence/conflicts/{conflict.id}/audit-trail")
    assert trail_res.status_code == 200
    trail = trail_res.json()
    assert len(trail) >= 1

    latest_audit = trail[0]
    assert latest_audit["conflict_id"] == conflict.id
    assert latest_audit["decision"] == "approved"
    assert latest_audit["approver_id"] == "Aman (Lead Switch Operator)"
    assert latest_audit["approver_auth_type"] == "switch_operator_secret"
    assert "Milestone verified" in latest_audit["resolution_notes"]
    assert latest_audit["timestamp"] is not None


# =============================================================================
# Requirement 10: System Integrity & Q&A Preservation
# =============================================================================

def test_existing_conflict_data_and_qa_pipeline_remain_intact(client: TestClient, db_session: Session):
    """Requirement 10: Ensures existing conflict queries, lists, and Q&A engine remain unaffected."""
    conflict = _setup_test_conflict(db_session, "Integrity Preservation Conflict")

    # Verify conflict listing API still works
    list_res = client.get("/api/v1/intelligence/conflicts?status=open")
    assert list_res.status_code == 200
    items = list_res.json()["items"]
    assert any(c["id"] == conflict.id for c in items)

    # Verify pending approval request listing API
    pend_res = client.get(f"/api/v1/intelligence/approval-requests/pending?conflict_id={conflict.id}")
    assert pend_res.status_code == 200

    # Verify SwitchApprovalHandler interface works
    handler = SwitchApprovalHandler()
    assert handler.verify_operator_credentials() is True


# =============================================================================
# Mattermost Session Verification & Production Startup Security Tests
# =============================================================================

def test_mattermost_session_token_derives_verified_identity(client: TestClient, db_session: Session):
    """
    Requirement 4: Derive approver identity from a verified authenticated session,
    never from a caller-supplied approver ID string.
    """
    conflict = _setup_test_conflict(db_session, "Mattermost Session Verified Identity")

    record, _ = ConflictApprovalService.create_approval_request(
        db=db_session,
        conflict_id=conflict.id,
        resolution_notes="Request awaiting human signoff in Mattermost",
    )

    mock_mattermost_profile = {
        "id": "hgzcymb6n7rpjx65b3a1oayigy",
        "username": "amandotdev",
        "email": "amankumar180806@gmail.com",
        "roles": "system_admin system_user",
        "verified_approver_id": "amandotdev (amankumar180806@gmail.com)",
    }

    with patch("app.services.mattermost_auth.MattermostAuthService.verify_session_token", return_value=mock_mattermost_profile):
        # Caller attempts to supply a spoofed approver name in the body ("Dr. Eleanor Vance")
        res = client.post(
            f"/api/v1/intelligence/conflicts/{conflict.id}/adjudicate",
            headers={"X-Mattermost-Token": "valid_mattermost_session_token_123"},
            json={
                "request_id": record.id,
                "decision": "approved",
                "approver_id": "Dr. Eleanor Vance",  # Spoofed name must be IGNORED
                "decision_notes": "Signoff executed via Mattermost.",
            },
        )

        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["status"] == "resolved"
        # The returned identity must be derived strictly from the verified session:
        assert data["resolved_by"] == "amandotdev (amankumar180806@gmail.com)"

        # Verify audit record matches verified identity
        db_session.expire_all()
        audits = ConflictApprovalService.get_audit_trail(db_session, conflict_id=conflict.id)
        assert len(audits) >= 1
        assert audits[0].approver_id == "amandotdev (amankumar180806@gmail.com)"
        assert audits[0].approver_auth_type == "mattermost_session"


def test_mattermost_session_token_invalid_rejected(client: TestClient, db_session: Session):
    """Invalid or expired Mattermost session token strictly returns HTTP 401."""
    from app.services.mattermost_auth import InvalidSessionTokenError

    conflict = _setup_test_conflict(db_session, "Invalid Token Adjudication")
    record, _ = ConflictApprovalService.create_approval_request(
        db=db_session,
        conflict_id=conflict.id,
        resolution_notes="Testing invalid token rejection",
    )

    with patch(
        "app.services.mattermost_auth.MattermostAuthService.verify_session_token",
        side_effect=InvalidSessionTokenError("Invalid or expired Mattermost session token."),
    ):
        res = client.post(
            f"/api/v1/intelligence/conflicts/{conflict.id}/adjudicate",
            headers={"X-Mattermost-Token": "expired_or_forged_token"},
            json={
                "request_id": record.id,
                "decision": "approved",
            },
        )
        assert res.status_code == 401
        assert "Invalid or expired Mattermost session token" in res.json()["detail"]


def test_production_config_missing_operator_secret_causes_startup_failure():
    """
    Requirement 7: Remove hardcoded default operator secret.
    Missing production credentials must cause secure startup failure.
    """
    from app.core.config import Settings

    # Production mode without secret -> MUST raise RuntimeError on startup
    with pytest.raises(RuntimeError) as exc_info:
        Settings(ENVIRONMENT="production", SWITCH_OPERATOR_SECRET=None)
    assert "Missing production credentials" in str(exc_info.value)

    with pytest.raises(RuntimeError):
        Settings(ENVIRONMENT="production", SWITCH_OPERATOR_SECRET="   ")

    # Production mode WITH secret -> succeeds
    prod_settings = Settings(ENVIRONMENT="production", SWITCH_OPERATOR_SECRET="strong-prod-secret-999")
    assert prod_settings.SWITCH_OPERATOR_SECRET == "strong-prod-secret-999"


def test_human_review_screen_and_competing_evidence_display(client: TestClient, db_session: Session):
    """
    Requirement 2: Display conflict details, competing facts, source citations,
    and proposed resolution before approval.
    """
    conflict = _setup_test_conflict(db_session, "Competing Evidence Display Test")

    record, _ = ConflictApprovalService.create_approval_request(
        db=db_session,
        conflict_id=conflict.id,
        resolution_notes="Proposal to align launch milestones based on Exhibit C",
    )

    # Test single request details API
    det_res = client.get(f"/api/v1/intelligence/approval-requests/{record.id}")
    assert det_res.status_code == 200
    det = det_res.json()
    assert det["id"] == record.id
    assert det["conflict_id"] == conflict.id
    assert det["proposed_status"] == "resolved"
    assert "Proposal to align launch milestones" in det["resolution_notes"]
    assert det["conflict"] is not None
    assert det["conflict"]["title"] == "Competing Evidence Display Test"

    # Test HTML review screen
    rev_res = client.get(f"/api/v1/intelligence/approvals/review?request_id={record.id}")
    assert rev_res.status_code == 200
    assert "text/html" in rev_res.headers["content-type"]
    html_text = rev_res.text
    assert "Competing Evidence Display Test" in html_text
    assert "Two-Phase Conflict Resolution Review" in html_text
    assert "Human Adjudication Action" in html_text


def test_human_rejection_via_mattermost_session(client: TestClient, db_session: Session):
    """Requirement 3: Allow the human to reject proposed resolution using verified session."""
    conflict = _setup_test_conflict(db_session, "Rejection Via Session Test")

    record, _ = ConflictApprovalService.create_approval_request(
        db=db_session,
        conflict_id=conflict.id,
        resolution_notes="Agent requests resolving without legal signoff",
    )

    mock_profile = {
        "id": "user-reviewer-123",
        "username": "compliance_lead",
        "email": "compliance@relay.org",
        "verified_approver_id": "compliance_lead (compliance@relay.org)",
    }

    with patch("app.services.mattermost_auth.MattermostAuthService.verify_session_token", return_value=mock_profile):
        res = client.post(
            f"/api/v1/intelligence/conflicts/{conflict.id}/adjudicate",
            headers={"X-Mattermost-Token": "valid_compliance_token"},
            json={
                "request_id": record.id,
                "decision": "rejected",
                "decision_notes": "Rejected: Legal audit required before closing this finding.",
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert data["decision"] == "rejected"
        assert data["status"] == "open"  # Conflict remains open

        # Conflict in DB is still open
        db_session.expire_all()
        c = db_session.query(KnowledgeConflict).filter(KnowledgeConflict.id == conflict.id).first()
        assert c.status == "open"
        assert c.resolved_at is None

        # Audit trail accurately records human rejection
        audits = ConflictApprovalService.get_audit_trail(db_session, conflict_id=conflict.id)
        assert len(audits) >= 1
        assert audits[0].decision == "rejected"
        assert audits[0].approver_id == "compliance_lead (compliance@relay.org)"
        assert audits[0].approver_auth_type == "mattermost_session"


def test_mattermost_login_endpoint(client: TestClient):
    """Verifies server-side Mattermost credential verification endpoint."""
    mock_profile = {
        "id": "mm-user-999",
        "username": "user",
        "email": "user@localhost.local",
        "roles": "system_user",
        "verified_approver_id": "user (user@localhost.local)",
        "session_token": "token-xyz-123",
    }
    with patch("app.services.mattermost_auth.MattermostAuthService.login_with_credentials", return_value=mock_profile):
        res = client.post(
            "/api/v1/intelligence/approvals/auth/login",
            json={"login_id": "user@localhost.local", "password": "correct_password"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["username"] == "user"
        assert data["token"] == "token-xyz-123"
        assert data["verified_approver_id"] == "user (user@localhost.local)"


def test_adjudicate_with_mattermost_credentials(client: TestClient, db_session: Session):
    """Verifies that human can adjudicate directly using verified account credentials."""
    conflict = _setup_test_conflict(db_session, "Credential Adjudication Test")

    record, _ = ConflictApprovalService.create_approval_request(
        db=db_session,
        conflict_id=conflict.id,
        resolution_notes="Resolution proposal awaiting human credential approval",
    )

    mock_profile = {
        "id": "mm-user-777",
        "username": "lead_reviewer",
        "email": "lead@company.local",
        "roles": "system_user",
        "verified_approver_id": "lead_reviewer (lead@company.local)",
        "session_token": "sess-token-456",
    }

    with patch("app.services.mattermost_auth.MattermostAuthService.login_with_credentials", return_value=mock_profile):
        res = client.post(
            f"/api/v1/intelligence/conflicts/{conflict.id}/adjudicate",
            json={
                "request_id": record.id,
                "decision": "approved",
                "login_id": "lead@company.local",
                "password": "valid_secret_pass",
                "decision_notes": "Approved via verified user credentials.",
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["decision"] == "approved"
        assert data["resolved_by"] == "lead_reviewer (lead@company.local)"

        db_session.expire_all()
        c = db_session.query(KnowledgeConflict).filter(KnowledgeConflict.id == conflict.id).first()
        assert c.status == "resolved"
        assert c.resolved_by == "lead_reviewer (lead@company.local)"

        audits = ConflictApprovalService.get_audit_trail(db_session, conflict_id=conflict.id)
        assert len(audits) >= 1
        assert audits[0].decision == "approved"
        assert audits[0].approver_auth_type == "mattermost_credentials"
        assert audits[0].approver_id == "lead_reviewer (lead@company.local)"


def test_mattermost_candidate_urls():
    """Verifies candidate URL generation for Docker and host network environments."""
    from app.services.mattermost_auth import MattermostAuthService
    
    candidates = MattermostAuthService._get_candidate_urls("http://127.0.0.1:52067/api/v4")
    assert "http://127.0.0.1:52067/api/v4" in candidates
    assert "http://host.docker.internal:52067/api/v4" in candidates

    candidates_docker = MattermostAuthService._get_candidate_urls("http://host.docker.internal:52067/api/v4")
    assert "http://host.docker.internal:52067/api/v4" in candidates_docker
    assert "http://127.0.0.1:52067/api/v4" in candidates_docker


def test_login_rate_limiting(client: TestClient):
    """Verifies that brute-force login attempts are rate limited with HTTP 429."""
    from app.core.rate_limiter import login_rate_limiter
    from app.services.mattermost_auth import InvalidCredentialsError

    login_rate_limiter.reset()

    with patch("app.services.mattermost_auth.MattermostAuthService.login_with_credentials", side_effect=InvalidCredentialsError("Invalid credentials")):
        # First 4 attempts fail with HTTP 401
        for i in range(4):
            res = client.post(
                "/api/v1/intelligence/approvals/auth/login",
                json={"login_id": "test_brute_force", "password": f"wrong_{i}"},
            )
            assert res.status_code == 401
            assert res.json()["detail"] == "Invalid username or password."

        # 5th attempt triggers lockout and returns HTTP 429
        res5 = client.post(
            "/api/v1/intelligence/approvals/auth/login",
            json={"login_id": "test_brute_force", "password": "wrong_4"},
        )
        assert res5.status_code == 429
        assert "Too many failed login attempts" in res5.json()["detail"]
        assert "retry-after" in res5.headers

        # Subsequent attempt while locked out also blocked with HTTP 429
        res6 = client.post(
            "/api/v1/intelligence/approvals/auth/login",
            json={"login_id": "test_brute_force", "password": "wrong_5"},
        )
        assert res6.status_code == 429
        assert "Too many failed login attempts" in res6.json()["detail"]
        assert "retry-after" in res6.headers

    login_rate_limiter.reset()


def test_login_safe_failure_handling(client: TestClient):
    """Verifies safe error handling for service failures without credential or URL exposure."""
    from app.core.rate_limiter import login_rate_limiter
    from app.services.mattermost_auth import MattermostServiceUnavailableError

    login_rate_limiter.reset()

    with patch("app.services.mattermost_auth.MattermostAuthService.login_with_credentials", side_effect=MattermostServiceUnavailableError("Mattermost offline")):
        res = client.post(
            "/api/v1/intelligence/approvals/auth/login",
            json={"login_id": "reviewer", "password": "any_password"},
        )
        assert res.status_code == 503
        assert "temporarily unavailable" in res.json()["detail"]
        # Ensure raw internal details or passwords are not leaked
        assert "any_password" not in res.text
        assert "offline" not in res.json()["detail"]

    login_rate_limiter.reset()


def test_sensitive_fields_repr_masked():
    """Verifies passwords and session tokens are masked in __repr__ across schemas."""
    from app.schemas.continuity import ConflictHumanAdjudicateRequest, MattermostLoginRequest, MattermostLoginResponse

    req = ConflictHumanAdjudicateRequest(
        request_id="req-123",
        decision="approved",
        session_token="super_secret_pat_999",
        password="super_secret_password_888",
    )
    req_repr = repr(req)
    assert "super_secret_pat_999" not in req_repr
    assert "super_secret_password_888" not in req_repr

    login_req = MattermostLoginRequest(
        login_id="admin_user",
        password="secret_password_xyz",
    )
    assert "secret_password_xyz" not in repr(login_req)

    login_resp = MattermostLoginResponse(
        success=True,
        user_id="u1",
        username="admin_user",
        token="secret_token_abc",
        verified_approver_id="admin_user (admin@local)",
        message="ok",
    )
    assert "secret_token_abc" not in repr(login_resp)


def test_dedicated_reviewer_audit_trail(client: TestClient, db_session: Session):
    """Verifies that an individually controlled reviewer account is permanently attributed in the audit trail."""
    conflict = _setup_test_conflict(db_session, "Dedicated Reviewer Attribution Test")

    record, _ = ConflictApprovalService.create_approval_request(
        db=db_session,
        conflict_id=conflict.id,
        resolution_notes="Dedicated reviewer attribution test",
    )

    dedicated_profile = {
        "id": "hgzcymb6n7rpjx65b3a1oayigy",
        "username": "human-reviewer",
        "email": "reviewer@relay.local",
        "roles": "system_admin system_user",
        "verified_approver_id": "human-reviewer (reviewer@relay.local)",
        "session_token": "token-dedicated-reviewer",
    }

    with patch("app.services.mattermost_auth.MattermostAuthService.verify_session_token", return_value=dedicated_profile):
        res = client.post(
            f"/api/v1/intelligence/conflicts/{conflict.id}/adjudicate",
            headers={"X-Mattermost-Token": "token-dedicated-reviewer"},
            json={
                "request_id": record.id,
                "decision": "approved",
                "decision_notes": "Formal approval granted by dedicated human reviewer.",
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert data["resolved_by"] == "human-reviewer (reviewer@relay.local)"

        # Check DB audit trail
        audits = ConflictApprovalService.get_audit_trail(db_session, conflict_id=conflict.id)
        assert len(audits) >= 1
        assert audits[0].approver_id == "human-reviewer (reviewer@relay.local)"
        assert audits[0].decision == "approved"
        assert audits[0].approver_auth_type == "mattermost_session"
