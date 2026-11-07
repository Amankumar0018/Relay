"""
Relay MCP Server for Switch and OpenCode.
Exposes evidence-grounded organizational continuity tools to Switch agents.
"""

import os
import sys
import json
import logging
from typing import Optional, Dict, Any, List
import httpx
from mcp.server.mcpserver import MCPServer

# Configure logging to stderr so stdio JSON-RPC on stdout remains clean
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    stream=sys.stderr,
)
logger = logging.getLogger("relay-mcp")

RELAY_API_URL = os.environ.get("RELAY_API_URL", "http://127.0.0.1:8000").rstrip("/")
DEFAULT_TIMEOUT_SECONDS = float(os.environ.get("RELAY_API_TIMEOUT", "60.0"))

app = MCPServer("relay")


def _get_client(timeout: float = DEFAULT_TIMEOUT_SECONDS) -> httpx.AsyncClient:
    """Creates an async HTTP client configured for Relay API."""
    return httpx.AsyncClient(
        base_url=RELAY_API_URL,
        timeout=timeout,
        headers={"User-Agent": "Relay-MCP-Server/0.1.0"},
    )


def _sanitize_error(exc: Exception) -> str:
    """Formats an exception into a safe, informative string without exposing secrets."""
    msg = str(exc)
    if "api_key" in msg.lower() or "authorization" in msg.lower():
        return "Internal API authentication error occurred."
    return msg


@app.tool(
    name="relay_deposit_document",
    description=(
        "Ingests text or handover notes into Relay, segments it, and triggers "
        "full evidence-grounded extraction, entity resolution, and conflict analysis. "
        "Use this whenever a human in the Switch room provides institutional documentation, "
        "handover memos, policy updates, meeting notes, or project status records."
    ),
)
async def relay_deposit_document(title: str, text: str) -> str:
    """
    Ingests and extracts structured organizational knowledge from text.

    Args:
        title: Human-readable title or document name (e.g. 'Project Titan Handover Memo')
        text: Raw textual content of the document or handover note.
    """
    title_clean = title.strip() if title else ""
    text_clean = text.strip() if text else ""

    if not title_clean:
        return json.dumps({
            "success": False,
            "error": "INVALID_ARGUMENT",
            "message": "Document title cannot be blank.",
        })

    if not text_clean or len(text_clean) < 10:
        return json.dumps({
            "success": False,
            "error": "INVALID_ARGUMENT",
            "message": "Document text must contain at least 10 characters.",
        })

    safe_filename = f"{title_clean.replace('/', '_').replace('\\', '_')}.txt"

    async with _get_client() as client:
        # 1. Ingest / Upload Document
        try:
            files = {"file": (safe_filename, text_clean.encode("utf-8"), "text/plain")}
            upload_res = await client.post("/api/v1/documents", files=files)
            if upload_res.status_code != 201:
                return json.dumps({
                    "success": False,
                    "error": f"UPLOAD_FAILED_{upload_res.status_code}",
                    "message": f"Failed to ingest document into Relay: {upload_res.text}",
                })
            upload_data = upload_res.json()
            document_id = upload_data["document"]["id"]
        except httpx.ConnectError:
            return json.dumps({
                "success": False,
                "error": "RELAY_BACKEND_UNAVAILABLE",
                "message": f"Cannot connect to Relay backend at {RELAY_API_URL}. Ensure Relay is running.",
            })
        except Exception as exc:
            return json.dumps({
                "success": False,
                "error": "INGESTION_ERROR",
                "message": f"Failed to ingest document: {_sanitize_error(exc)}",
            })

        # 2. Trigger Extraction & Evidence Grounding
        try:
            extract_res = await client.post(f"/api/v1/documents/{document_id}/extract")
            if extract_res.status_code != 200:
                return json.dumps({
                    "success": False,
                    "document_id": document_id,
                    "error": f"EXTRACTION_FAILED_{extract_res.status_code}",
                    "message": f"Document uploaded, but extraction failed: {extract_res.text}",
                })
            extract_data = extract_res.json()
            summary = extract_data.get("summary", {})
        except Exception as exc:
            return json.dumps({
                "success": False,
                "document_id": document_id,
                "error": "EXTRACTION_PIPELINE_ERROR",
                "message": f"Document uploaded, but extraction encountered an error: {_sanitize_error(exc)}",
            })

        # 3. Trigger Conflict Analysis
        new_conflicts = []
        try:
            analyze_res = await client.post(f"/api/v1/intelligence/analyze?document_id={document_id}")
            if analyze_res.status_code == 200:
                analyze_data = analyze_res.json()
                new_conflicts = analyze_data.get("items", [])
        except Exception as exc:
            logger.warning("Conflict analysis scan encountered warning: %s", exc)

        return json.dumps({
            "success": True,
            "document_id": document_id,
            "title": title_clean,
            "status": "completed",
            "entities_extracted": summary.get("entities_count", 0),
            "facts_extracted": summary.get("facts_count", 0),
            "relationships_extracted": summary.get("relationships_count", 0),
            "citations_verified": summary.get("citations_verified", 0),
            "citations_rejected": summary.get("citations_rejected", 0),
            "conflicts_detected": len(new_conflicts),
            "conflicts_summary": [
                {
                    "conflict_id": c.get("id"),
                    "conflict_type": c.get("conflict_type"),
                    "severity": c.get("severity"),
                    "title": c.get("title"),
                    "description": c.get("description"),
                }
                for c in new_conflicts[:5]
            ],
            "execution_duration_ms": summary.get("execution_duration_ms", 0),
            "message": f"Document '{title_clean}' successfully deposited, grounded, and committed to Relay memory.",
        }, indent=2)


@app.tool(
    name="relay_ask_question",
    description=(
        "Queries Relay's evidence-grounded institutional memory using natural language. "
        "Returns a factual answer strictly backed by stored document citations, confidence score, "
        "and verbatim evidence excerpts. Use this whenever answering questions about past decisions, "
        "owners, deadlines, responsibilities, or project statuses in the Switch room."
    ),
)
async def relay_ask_question(question: str) -> str:
    """
    Queries institutional knowledge with strict evidence grounding.

    Args:
        question: The natural language inquiry (e.g. 'Who is leading Project Titan and when does it transfer?')
    """
    q_clean = question.strip() if question else ""
    if not q_clean:
        return json.dumps({
            "success": False,
            "error": "INVALID_ARGUMENT",
            "message": "Question cannot be empty.",
        })

    async with _get_client() as client:
        try:
            res = await client.post("/api/v1/qa/ask", json={"question": q_clean})
            if res.status_code != 200:
                return json.dumps({
                    "success": False,
                    "error": f"QA_REQUEST_FAILED_{res.status_code}",
                    "message": f"Relay Q&A engine returned an error: {res.text}",
                })
            qa_data = res.json()
            is_grounded = bool(qa_data.get("is_grounded", qa_data.get("has_sufficient_evidence", False)))
            raw_confidence = qa_data.get("confidence", qa_data.get("confidence_score", 0.0))
            try:
                confidence_val = round(float(raw_confidence), 2)
            except (ValueError, TypeError):
                confidence_val = 0.0

            raw_citations = qa_data.get("citations", [])
            citations_list = []
            for c in raw_citations:
                quote = c.get("quote") or c.get("verbatim_quote")
                src_doc = (
                    c.get("source_document")
                    or c.get("source_document_title")
                    or c.get("document_filename")
                    or c.get("document_id")
                )
                seg_id = c.get("segment_id") or c.get("document_segment_id")
                citations_list.append({
                    "quote": quote,
                    "source_document": src_doc,
                    "segment_id": seg_id,
                })

            return json.dumps({
                "success": True,
                "question": q_clean,
                "answer": qa_data.get("answer"),
                "confidence": confidence_val,
                "is_grounded": is_grounded,
                "is_grounding": is_grounded,
                "missing_evidence": not is_grounded,
                "citations": citations_list,
            }, indent=2)
        except httpx.ConnectError:
            return json.dumps({
                "success": False,
                "error": "RELAY_BACKEND_UNAVAILABLE",
                "message": f"Cannot connect to Relay backend at {RELAY_API_URL}.",
            })
        except Exception as exc:
            return json.dumps({
                "success": False,
                "error": "QA_ERROR",
                "message": f"Failed to query knowledge base: {_sanitize_error(exc)}",
            })


@app.tool(
    name="relay_get_conflicts",
    description=(
        "Retrieves active organizational contradictions, superseded decisions, outdated deadlines, "
        "and unassigned roles stored in Relay. Use this to audit knowledge gaps, surface discrepancies "
        "to human reviewers in the Switch room, or prepare for conflict resolution."
    ),
)
async def relay_get_conflicts(status: str = "open", severity: Optional[str] = None) -> str:
    """
    Lists detected discrepancies and contradictions.

    Args:
        status: Filter by status ('open', 'resolved', 'dismissed', 'archived', 'all'). Defaults to 'open'.
        severity: Optional severity filter ('critical', 'high', 'medium', 'low').
    """
    params = {"status": status}
    if severity:
        params["severity"] = severity

    async with _get_client() as client:
        try:
            res = await client.get("/api/v1/intelligence/conflicts", params=params)
            if res.status_code != 200:
                return json.dumps({
                    "success": False,
                    "error": f"CONFLICTS_REQUEST_FAILED_{res.status_code}",
                    "message": f"Failed to retrieve conflicts: {res.text}",
                })
            data = res.json()
            return json.dumps({
                "success": True,
                "total": data.get("total", 0),
                "open_count": data.get("open_count", 0),
                "critical_count": data.get("critical_count", 0),
                "conflicts": [
                    {
                        "id": item.get("id"),
                        "conflict_type": item.get("conflict_type"),
                        "severity": item.get("severity"),
                        "title": item.get("title"),
                        "description": item.get("description"),
                        "status": item.get("status"),
                        "resolved_by": item.get("resolved_by"),
                        "resolved_at": item.get("resolved_at"),
                        "resolution_notes": item.get("resolution_notes"),
                        "created_at": item.get("created_at"),
                    }
                    for item in data.get("items", [])
                ],
            }, indent=2)
        except httpx.ConnectError:
            return json.dumps({
                "success": False,
                "error": "RELAY_BACKEND_UNAVAILABLE",
                "message": f"Cannot connect to Relay backend at {RELAY_API_URL}.",
            })
        except Exception as exc:
            return json.dumps({
                "success": False,
                "error": "CONFLICTS_ERROR",
                "message": f"Failed to retrieve conflicts: {_sanitize_error(exc)}",
            })


@app.tool(
    name="relay_request_conflict_resolution",
    description=(
        "Requests human approval to adjudicate or resolve an organizational conflict in Relay. "
        "AI agents cannot authorize conflict resolution unilaterally. This tool queues an approval "
        "request in Relay with a cryptographic one-time approval token for the human reviewer in Switch."
    ),
)
async def relay_request_conflict_resolution(
    conflict_id: str,
    resolution_notes: str,
    proposed_status: str = "resolved",
) -> str:
    """
    Initiates a two-phase human approval request for conflict resolution.

    Args:
        conflict_id: UUID of the KnowledgeConflict to resolve.
        resolution_notes: Detailed explanation and justification for the proposed resolution.
        proposed_status: Proposed final status ('resolved' or 'dismissed'). Defaults to 'resolved'.
    """
    cid_clean = conflict_id.strip() if conflict_id else ""
    notes_clean = resolution_notes.strip() if resolution_notes else ""

    if not cid_clean:
        return json.dumps({
            "success": False,
            "error": "INVALID_ARGUMENT",
            "message": "conflict_id must be provided.",
        })

    if not notes_clean or len(notes_clean) < 3:
        return json.dumps({
            "success": False,
            "error": "INVALID_ARGUMENT",
            "message": "resolution_notes must explain the justification for resolution.",
        })

    payload = {
        "proposed_status": proposed_status if proposed_status in ("resolved", "dismissed") else "resolved",
        "resolution_notes": notes_clean,
        "requesting_agent": "relay-knowledge-extractor",
    }

    async with _get_client() as client:
        try:
            res = await client.post(
                f"/api/v1/intelligence/conflicts/{cid_clean}/request-resolution",
                json=payload,
            )
            if res.status_code == 404:
                return json.dumps({
                    "success": False,
                    "error": "CONFLICT_NOT_FOUND",
                    "message": f"Conflict with ID '{cid_clean}' does not exist in Relay.",
                })
            elif res.status_code != 201:
                return json.dumps({
                    "success": False,
                    "error": f"REQUEST_RESOLUTION_FAILED_{res.status_code}",
                    "message": f"Failed to initiate resolution request: {res.text}",
                })

            data = res.json()
            req_id = data.get("id")
            review_url = f"{RELAY_API_URL}/api/v1/intelligence/approvals/review?request_id={req_id}"
            return json.dumps({
                "success": True,
                "request_id": req_id,
                "conflict_id": data.get("conflict_id"),
                "status": data.get("status"),
                "proposed_status": data.get("proposed_status"),
                "expires_at": data.get("expires_at"),
                "review_url": review_url,
                "message": (
                    f"Conflict resolution request submitted (ID: {req_id}). "
                    f"Awaiting verified human adjudication from the Switch reviewer. "
                    f"The human reviewer must inspect the competing facts, verbatim source citations, "
                    f"and submit their authenticated decision at: {review_url}"
                ),
            }, indent=2)
        except httpx.ConnectError:
            return json.dumps({
                "success": False,
                "error": "RELAY_BACKEND_UNAVAILABLE",
                "message": f"Cannot connect to Relay backend at {RELAY_API_URL}.",
            })
        except Exception as exc:
            return json.dumps({
                "success": False,
                "error": "REQUEST_ERROR",
                "message": f"Failed to submit resolution request: {_sanitize_error(exc)}",
            })


@app.tool(
    name="relay_resolve_conflict",
    description=(
        "Adjudicates and resolves an organizational conflict in Relay using a verified one-time human approval token. "
        "SECURITY ENFORCEMENT: AI agents cannot authorize conflict resolution unilaterally or bypass authentication "
        "using 'authorized_by' strings. A valid, unconsumed, non-expired one-time approval token issued by an "
        "authenticated human reviewer in Switch must be supplied."
    ),
)
async def relay_resolve_conflict(
    conflict_id: str,
    resolution_notes: str,
    approval_token: Optional[str] = None,
    authorized_by: Optional[str] = None,
    status: str = "resolved",
) -> str:
    """
    Resolves a conflict with mandatory one-time human approval token.

    Args:
        conflict_id: UUID of the KnowledgeConflict to resolve.
        resolution_notes: Explanation of how the discrepancy was adjudicated.
        approval_token: Cryptographically random one-time human approval token.
        authorized_by: (Deprecated/Ignored for authorization) Identity name string.
        status: Status to assign ('resolved' or 'dismissed'). Defaults to 'resolved'.
    """
    cid_clean = conflict_id.strip() if conflict_id else ""
    notes_clean = resolution_notes.strip() if resolution_notes else ""
    token_clean = approval_token.strip() if approval_token else ""

    if not cid_clean:
        return json.dumps({
            "success": False,
            "error": "INVALID_ARGUMENT",
            "message": "conflict_id must be provided.",
        })

    if not notes_clean or len(notes_clean) < 3:
        return json.dumps({
            "success": False,
            "error": "INVALID_ARGUMENT",
            "message": "resolution_notes must explain the reason for resolution.",
        })

    # Hard security gate: Identity strings like authorized_by="user" or "admin" are strictly rejected as authorization
    if not token_clean:
        return json.dumps({
            "success": False,
            "error": "HUMAN_APPROVAL_TOKEN_REQUIRED",
            "message": (
                "Direct conflict resolution by AI agents or plain text 'authorized_by' strings is forbidden. "
                "Conflict resolution requires a cryptographic one-time human approval token. "
                "Use 'relay_request_conflict_resolution' to request approval from the human reviewer in Switch."
            ),
        })

    headers = {"X-Approval-Token": token_clean}
    payload = {
        "status": status if status in ("resolved", "dismissed") else "resolved",
        "resolution_notes": notes_clean,
        "resolved_by": authorized_by.strip() if authorized_by else "verified_human_operator",
        "approval_token": token_clean,
    }

    async with _get_client() as client:
        try:
            res = await client.patch(
                f"/api/v1/intelligence/conflicts/{cid_clean}",
                json=payload,
                headers=headers,
            )
            if res.status_code == 401:
                return json.dumps({
                    "success": False,
                    "error": "UNAUTHORIZED",
                    "message": "Approval token missing, invalid, or human authorization rejected.",
                })
            elif res.status_code == 403:
                return json.dumps({
                    "success": False,
                    "error": "FORBIDDEN",
                    "message": f"Approval token is expired, invalid, or bound to a different conflict: {res.text}",
                })
            elif res.status_code == 404:
                return json.dumps({
                    "success": False,
                    "error": "CONFLICT_NOT_FOUND",
                    "message": f"Conflict with ID '{cid_clean}' does not exist in Relay.",
                })
            elif res.status_code == 409:
                return json.dumps({
                    "success": False,
                    "error": "TOKEN_ALREADY_USED",
                    "message": "This approval token has already been consumed (single-use replay prevention).",
                })
            elif res.status_code != 200:
                return json.dumps({
                    "success": False,
                    "error": f"RESOLUTION_FAILED_{res.status_code}",
                    "message": f"Failed to resolve conflict: {res.text}",
                })

            updated = res.json()
            return json.dumps({
                "success": True,
                "conflict_id": updated.get("id"),
                "status": updated.get("status"),
                "resolved_by": updated.get("resolved_by"),
                "resolution_notes": updated.get("resolution_notes"),
                "resolved_at": updated.get("resolved_at"),
                "message": f"Conflict '{cid_clean}' successfully resolved with verified human approval token.",
            }, indent=2)
        except httpx.ConnectError:
            return json.dumps({
                "success": False,
                "error": "RELAY_BACKEND_UNAVAILABLE",
                "message": f"Cannot connect to Relay backend at {RELAY_API_URL}.",
            })
        except Exception as exc:
            return json.dumps({
                "success": False,
                "error": "RESOLVE_ERROR",
                "message": f"Failed to execute conflict resolution: {_sanitize_error(exc)}",
            })


# ============================================================================
# Tool Aliases for OpenCode and Standard MCP Clients
# ============================================================================
# When an MCP server is configured as "relay", OpenCode prepends the server
# name to all exposed tools (e.g., "deposit_document" -> "relay_deposit_document").
# We register both forms so all tools resolve whether the client prefixes or not.

@app.tool(
    name="deposit_document",
    description=(
        "Ingests text or handover notes into Relay, segments it, and triggers "
        "full evidence-grounded extraction, entity resolution, and conflict analysis."
    ),
)
async def deposit_document(title: str, text: str) -> str:
    """Ingests and extracts structured organizational knowledge from text."""
    return await relay_deposit_document(title, text)


@app.tool(
    name="ask_question",
    description=(
        "Queries Relay's evidence-grounded institutional memory using natural language. "
        "Returns a factual answer strictly backed by stored document citations, confidence score, "
        "and verbatim evidence excerpts."
    ),
)
async def ask_question(question: str) -> str:
    """Queries institutional knowledge with strict evidence grounding."""
    return await relay_ask_question(question)


@app.tool(
    name="get_conflicts",
    description=(
        "Retrieves active organizational contradictions, superseded decisions, outdated deadlines, "
        "and unassigned roles stored in Relay."
    ),
)
async def get_conflicts(status: str = "open", severity: Optional[str] = None) -> str:
    """Lists detected discrepancies and contradictions."""
    return await relay_get_conflicts(status=status, severity=severity)


@app.tool(
    name="request_conflict_resolution",
    description=(
        "Requests human approval to adjudicate or resolve an organizational conflict in Relay. "
        "AI agents cannot authorize conflict resolution unilaterally. This tool queues an approval "
        "request in Relay with a cryptographic one-time approval token for the human reviewer in Switch."
    ),
)
async def request_conflict_resolution(
    conflict_id: str,
    resolution_notes: str,
    proposed_status: str = "resolved",
) -> str:
    """Initiates a two-phase human approval request for conflict resolution."""
    return await relay_request_conflict_resolution(
        conflict_id=conflict_id,
        resolution_notes=resolution_notes,
        proposed_status=proposed_status,
    )


@app.tool(
    name="resolve_conflict",
    description=(
        "Adjudicates and resolves an organizational conflict in Relay using a verified one-time human approval token. "
        "SECURITY ENFORCEMENT: AI agents cannot authorize conflict resolution unilaterally or bypass authentication "
        "using 'authorized_by' strings. A valid, unconsumed, non-expired one-time approval token issued by an "
        "authenticated human reviewer in Switch must be supplied."
    ),
)
async def resolve_conflict(
    conflict_id: str,
    resolution_notes: str,
    approval_token: Optional[str] = None,
    authorized_by: Optional[str] = None,
    status: str = "resolved",
) -> str:
    """Resolves a conflict with mandatory one-time human approval token."""
    return await relay_resolve_conflict(
        conflict_id=conflict_id,
        resolution_notes=resolution_notes,
        approval_token=approval_token,
        authorized_by=authorized_by,
        status=status,
    )


def main():
    """Main entrypoint running the Relay MCP server over stdio."""
    logger.info("Starting Relay MCP Server (stdio transport)...")
    app.run(transport="stdio")


if __name__ == "__main__":
    main()
