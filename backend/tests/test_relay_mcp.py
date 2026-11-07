import pytest
import json
from unittest.mock import patch, MagicMock, AsyncMock
from contextlib import asynccontextmanager
import httpx

from app.integrations.switch.mcp_server import (
    relay_deposit_document,
    relay_ask_question,
    relay_get_conflicts,
    relay_request_conflict_resolution,
    relay_resolve_conflict,
)


def mock_get_client(client_mock):
    @asynccontextmanager
    async def _cm(*args, **kwargs):
        yield client_mock
    return _cm


@pytest.mark.anyio
async def test_relay_deposit_document_success():
    """Verify relay_deposit_document uploads, extracts, and analyzes successfully."""
    mock_upload_resp = MagicMock(status_code=201)
    mock_upload_resp.json.return_value = {
        "success": True,
        "document": {"id": "doc-123", "original_filename": "Memo.txt"},
    }

    mock_extract_resp = MagicMock(status_code=200)
    mock_extract_resp.json.return_value = {
        "success": True,
        "summary": {
            "entities_count": 3,
            "facts_count": 2,
            "relationships_count": 1,
            "citations_verified": 2,
            "citations_rejected": 0,
            "execution_duration_ms": 1200,
        },
    }

    mock_analyze_resp = MagicMock(status_code=200)
    mock_analyze_resp.json.return_value = {
        "items": [
            {
                "id": "conf-1",
                "conflict_type": "contradiction",
                "severity": "high",
                "title": "Deadline Conflict",
                "description": "Two conflicting dates",
            }
        ]
    }

    mock_client = AsyncMock()
    mock_client.post.side_effect = [mock_upload_resp, mock_extract_resp, mock_analyze_resp]

    with patch("app.integrations.switch.mcp_server._get_client", side_effect=mock_get_client(mock_client)):
        res_str = await relay_deposit_document("Handover Memo", "Valid long document text exceeding ten characters.")
        res = json.loads(res_str)

        assert res["success"] is True
        assert res["document_id"] == "doc-123"
        assert res["entities_extracted"] == 3
        assert res["facts_extracted"] == 2
        assert res["conflicts_detected"] == 1
        assert res["conflicts_summary"][0]["conflict_id"] == "conf-1"


@pytest.mark.anyio
async def test_relay_deposit_document_validation():
    """Verify validation for empty title or too-short text."""
    res_str1 = await relay_deposit_document("", "Valid text here.")
    res1 = json.loads(res_str1)
    assert res1["success"] is False
    assert res1["error"] == "INVALID_ARGUMENT"

    res_str2 = await relay_deposit_document("Title", "short")
    res2 = json.loads(res_str2)
    assert res2["success"] is False
    assert res2["error"] == "INVALID_ARGUMENT"


@pytest.mark.anyio
async def test_relay_deposit_document_extraction_failure_reported():
    """Verify extraction failure is not falsely marked as success."""
    mock_upload_resp = MagicMock(status_code=201)
    mock_upload_resp.json.return_value = {
        "success": True,
        "document": {"id": "doc-999"},
    }

    mock_extract_resp = MagicMock(status_code=502, text="Gemini extraction failed")

    mock_client = AsyncMock()
    mock_client.post.side_effect = [mock_upload_resp, mock_extract_resp]

    with patch("app.integrations.switch.mcp_server._get_client", side_effect=mock_get_client(mock_client)):
        res_str = await relay_deposit_document("Bad Doc", "Some text that triggers extraction error.")
        res = json.loads(res_str)

        assert res["success"] is False
        assert "EXTRACTION_FAILED_502" in res["error"]
        assert "Gemini extraction failed" in res["message"]


@pytest.mark.anyio
async def test_relay_ask_question_success():
    """Verify relay_ask_question queries Relay Q&A engine."""
    mock_resp = MagicMock(status_code=200)
    mock_resp.json.return_value = {
        "answer": "Project Titan transfers to Sarah Chen on Dec 1.",
        "confidence": 0.95,
        "is_grounded": True,
        "missing_evidence": False,
        "citations": [
            {
                "quote": "Titan transfers to Sarah Chen on Dec 1.",
                "source_document_title": "Memo Q4",
                "segment_id": "seg-1",
            }
        ],
    }

    mock_client = AsyncMock()
    mock_client.post.return_value = mock_resp

    with patch("app.integrations.switch.mcp_server._get_client", side_effect=mock_get_client(mock_client)):
        res_str = await relay_ask_question("When does Project Titan transfer?")
        res = json.loads(res_str)

        assert res["success"] is True
        assert res["confidence"] == 0.95
        assert res["is_grounded"] is True
        assert len(res["citations"]) == 1
        assert "Sarah Chen" in res["answer"]


@pytest.mark.anyio
async def test_relay_get_conflicts_success():
    """Verify relay_get_conflicts fetches active discrepancies."""
    mock_resp = MagicMock(status_code=200)
    mock_resp.json.return_value = {
        "total": 2,
        "open_count": 2,
        "critical_count": 1,
        "items": [
            {
                "id": "c-1",
                "conflict_type": "contradiction",
                "severity": "critical",
                "title": "Lead conflict",
                "description": "Two individuals claim ownership",
                "status": "open",
                "created_at": "2026-11-06T10:00:00Z",
            }
        ],
    }

    mock_client = AsyncMock()
    mock_client.get.return_value = mock_resp

    with patch("app.integrations.switch.mcp_server._get_client", side_effect=mock_get_client(mock_client)):
        res_str = await relay_get_conflicts(status="open")
        res = json.loads(res_str)

        assert res["success"] is True
        assert res["open_count"] == 2
        assert res["critical_count"] == 1
        assert len(res["conflicts"]) == 1
        assert res["conflicts"][0]["id"] == "c-1"


@pytest.mark.anyio
async def test_relay_request_conflict_resolution_success():
    """Verify relay_request_conflict_resolution queues an approval request in Relay."""
    mock_resp = MagicMock(status_code=201)
    mock_resp.json.return_value = {
        "id": "req-123",
        "conflict_id": "c-1",
        "status": "pending",
        "proposed_status": "resolved",
        "expires_at": "2026-11-06T12:00:00Z",
    }

    mock_client = AsyncMock()
    mock_client.post.return_value = mock_resp

    with patch("app.integrations.switch.mcp_server._get_client", side_effect=mock_get_client(mock_client)):
        res_str = await relay_request_conflict_resolution("c-1", "Clarified timeline with Dr. Thorne")
        res = json.loads(res_str)

        assert res["success"] is True
        assert res["request_id"] == "req-123"
        assert res["conflict_id"] == "c-1"
        assert res["status"] == "pending"
        assert "Awaiting verified human adjudication" in res["message"]


@pytest.mark.anyio
async def test_relay_resolve_conflict_requires_human_approval_token():
    """Verify that an AI cannot resolve a conflict without explicit human one-time approval token."""
    # Attempt 1: No approval token provided
    res_str1 = await relay_resolve_conflict("c-1", "Resolution notes")
    res1 = json.loads(res_str1)
    assert res1["success"] is False
    assert res1["error"] == "HUMAN_APPROVAL_TOKEN_REQUIRED"

    # Attempt 2: Supplying string bypass authorized_by="user" without a token
    res_str2 = await relay_resolve_conflict("c-1", "Resolution notes", authorized_by="user")
    res2 = json.loads(res_str2)
    assert res2["success"] is False
    assert res2["error"] == "HUMAN_APPROVAL_TOKEN_REQUIRED"

    # Attempt 3: Supplying string bypass authorized_by="admin" without a token
    res_str3 = await relay_resolve_conflict("c-1", "Resolution notes", authorized_by="admin")
    res3 = json.loads(res_str3)
    assert res3["success"] is False
    assert res3["error"] == "HUMAN_APPROVAL_TOKEN_REQUIRED"


@pytest.mark.anyio
async def test_relay_resolve_conflict_success_with_human_token():
    """Verify successful resolution when a valid human one-time approval token is provided."""
    mock_resp = MagicMock(status_code=200)
    mock_resp.json.return_value = {
        "id": "c-1",
        "status": "resolved",
        "resolved_by": "Aman (Verified Human via Switch)",
        "resolution_notes": "Confirmed with Dr. Thorne that Sarah Chen is sole owner.",
        "resolved_at": "2026-11-06T11:00:00Z",
    }

    mock_client = AsyncMock()
    mock_client.patch.return_value = mock_resp

    with patch("app.integrations.switch.mcp_server._get_client", side_effect=mock_get_client(mock_client)):
        res_str = await relay_resolve_conflict(
            conflict_id="c-1",
            resolution_notes="Confirmed with Dr. Thorne that Sarah Chen is sole owner.",
            approval_token="valid_cryptographic_one_time_token_123",
            authorized_by="Aman",
        )
        res = json.loads(res_str)

        assert res["success"] is True
        assert res["status"] == "resolved"
        assert res["conflict_id"] == "c-1"
        assert "successfully resolved" in res["message"]


@pytest.mark.anyio
async def test_relay_resolve_conflict_rejects_already_consumed_token():
    """Verify that a reused approval token returns TOKEN_ALREADY_USED (single-use enforcement)."""
    mock_resp = MagicMock(status_code=409, text="Approval token has already been used.")

    mock_client = AsyncMock()
    mock_client.patch.return_value = mock_resp

    with patch("app.integrations.switch.mcp_server._get_client", side_effect=mock_get_client(mock_client)):
        res_str = await relay_resolve_conflict(
            conflict_id="c-1",
            resolution_notes="Attempting replay attack",
            approval_token="already_consumed_token_456",
        )
        res = json.loads(res_str)

        assert res["success"] is False
        assert res["error"] == "TOKEN_ALREADY_USED"
