"""
Switch-Side Human Approval Handler for Relay.

Provides a trusted interface for human reviewers and administrators in Switch / Mattermost
to inspect, adjudicate (approve or reject), and audit conflict resolution requests.
Enforces the Two-Phase Human Approval model: AI agents can request resolution, but only
a verified human operator can authorize changes.
"""

import os
import sys
import json
import logging
import argparse
from typing import Optional, Dict, Any, List
import httpx

from app.core.config import settings

logger = logging.getLogger("switch-approval-handler")

RELAY_API_URL = os.environ.get("RELAY_API_URL", "http://127.0.0.1:8000").rstrip("/")
DEFAULT_OPERATOR_SECRET = os.environ.get("SWITCH_OPERATOR_SECRET", settings.SWITCH_OPERATOR_SECRET)


class SwitchApprovalHandler:
    """
    Trusted handler running in the Switch environment.
    Connects to the Relay backend with verified human credentials (Mattermost session
    or Operator Secret) to:
    1. List pending conflict resolution requests queued by AI agents with full competing evidence.
    2. Retrieve details (Fact A vs Fact B, verbatim source citations) before approval.
    3. Authorize (approve) or reject pending requests with authenticated human identities.
    4. Generate single-use approval tokens for human-in-the-loop workflows.
    5. Inspect immutable audit trails for compliance.
    """

    def __init__(
        self,
        base_url: str = RELAY_API_URL,
        operator_secret: Optional[str] = None,
        timeout: float = 30.0,
    ):
        self.base_url = base_url.rstrip("/")
        self.operator_secret = operator_secret or os.environ.get("SWITCH_OPERATOR_SECRET") or settings.SWITCH_OPERATOR_SECRET
        self.timeout = timeout

    def _get_client(self, mattermost_token: Optional[str] = None) -> httpx.Client:
        headers = {
            "User-Agent": "Switch-Human-Approval-Handler/1.0",
        }
        if mattermost_token and mattermost_token.strip():
            headers["X-Mattermost-Token"] = mattermost_token.strip()
        elif self.operator_secret:
            headers["X-Operator-Secret"] = self.operator_secret

        return httpx.Client(
            base_url=self.base_url,
            timeout=self.timeout,
            headers=headers,
        )

    def verify_operator_credentials(self) -> bool:
        """Verifies if the configured operator secret is valid against the backend settings."""
        expected = settings.SWITCH_OPERATOR_SECRET
        return bool(expected and self.operator_secret and self.operator_secret == expected)

    def list_pending_requests(self, conflict_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Lists pending conflict resolution approval requests queued by AI agents."""
        params = {"conflict_id": conflict_id} if conflict_id else {}
        with self._get_client() as client:
            res = client.get("/api/v1/intelligence/approval-requests/pending", params=params)
            if res.status_code == 200:
                return res.json()
            logger.error("Failed to list pending requests: %s - %s", res.status_code, res.text)
            return []

    def get_request_details(self, request_id: str) -> Optional[Dict[str, Any]]:
        """Fetches full details of a pending approval request including competing facts and citations."""
        with self._get_client() as client:
            res = client.get(f"/api/v1/intelligence/approval-requests/{request_id}")
            if res.status_code == 200:
                return res.json()
            logger.error("Failed to fetch request %s: %s - %s", request_id, res.status_code, res.text)
            return None

    def adjudicate_request(
        self,
        conflict_id: str,
        request_id: str,
        decision: str,
        approver_id: Optional[str] = None,
        mattermost_token: Optional[str] = None,
        operator_secret: Optional[str] = None,
        decision_notes: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Adjudicates a pending resolution request with verified human reviewer identity.

        Args:
            conflict_id: UUID of the conflict.
            request_id: UUID of the pending approval request.
            decision: 'approved' or 'rejected'.
            approver_id: Optional display identity (overridden by verified Mattermost token).
            mattermost_token: Verified Mattermost user session token / PAT.
            operator_secret: Administrative operator secret.
            decision_notes: Justification or audit remarks.
        """
        clean_dec = decision.strip().lower()
        if clean_dec not in ("approved", "rejected"):
            return {
                "success": False,
                "error": "INVALID_DECISION",
                "message": "Decision must be 'approved' or 'rejected'.",
            }

        headers = {}
        if mattermost_token and mattermost_token.strip():
            headers["X-Mattermost-Token"] = mattermost_token.strip()
        else:
            op_sec = operator_secret or self.operator_secret
            if op_sec:
                headers["X-Operator-Secret"] = op_sec

        payload = {
            "request_id": request_id,
            "decision": clean_dec,
            "approver_id": approver_id.strip() if approver_id else None,
            "session_token": mattermost_token.strip() if mattermost_token else None,
            "decision_notes": decision_notes,
        }

        with httpx.Client(base_url=self.base_url, timeout=self.timeout) as client:
            res = client.post(
                f"/api/v1/intelligence/conflicts/{conflict_id}/adjudicate",
                json=payload,
                headers=headers,
            )
            if res.status_code == 200:
                return res.json()
            try:
                err_detail = res.json().get("detail", res.text)
            except Exception:
                err_detail = res.text
            return {
                "success": False,
                "status_code": res.status_code,
                "error": "ADJUDICATION_FAILED",
                "message": err_detail,
            }

    def issue_one_time_token(
        self,
        conflict_id: str,
        approver_id: str,
        resolution_notes: str,
        proposed_status: str = "resolved",
    ) -> Dict[str, Any]:
        """Issues a cryptographically secure, single-use approval token."""
        payload = {
            "proposed_status": proposed_status,
            "resolution_notes": resolution_notes,
            "requesting_agent": f"operator:{approver_id.strip()}",
        }
        with self._get_client() as client:
            res = client.post(
                f"/api/v1/intelligence/conflicts/{conflict_id}/issue-token",
                json=payload,
            )
            if res.status_code == 200:
                return res.json()
            return {
                "success": False,
                "status_code": res.status_code,
                "error": "TOKEN_ISSUANCE_FAILED",
                "message": res.text,
            }

    def get_audit_trail(self, conflict_id: str) -> List[Dict[str, Any]]:
        """Retrieves the immutable audit trail for a conflict."""
        with self._get_client() as client:
            res = client.get(f"/api/v1/intelligence/conflicts/{conflict_id}/audit-trail")
            if res.status_code == 200:
                return res.json()
            return []


def main():
    parser = argparse.ArgumentParser(description="Switch Human Approval Handler CLI")
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")

    # List pending requests
    subparsers.add_parser("list", help="List pending conflict resolution approval requests")

    # Show request details
    show_parser = subparsers.add_parser("show", help="Show full details, competing facts, and citations for an approval request")
    show_parser.add_argument("request_id", help="UUID of the pending approval request")

    # Approve request
    app_parser = subparsers.add_parser("approve", help="Approve a conflict resolution request")
    app_parser.add_argument("request_id", help="UUID of the pending approval request")
    app_parser.add_argument("--conflict-id", required=True, help="UUID of the conflict")
    app_parser.add_argument("--token", help="Mattermost session token or Personal Access Token (PAT)")
    app_parser.add_argument("--secret", help="Operator secret (if authenticating as operator)")
    app_parser.add_argument("--notes", help="Optional adjudication notes")

    # Reject request
    rej_parser = subparsers.add_parser("reject", help="Reject a conflict resolution request")
    rej_parser.add_argument("request_id", help="UUID of the pending approval request")
    rej_parser.add_argument("--conflict-id", required=True, help="UUID of the conflict")
    rej_parser.add_argument("--token", help="Mattermost session token or Personal Access Token (PAT)")
    rej_parser.add_argument("--secret", help="Operator secret (if authenticating as operator)")
    rej_parser.add_argument("--notes", help="Optional rejection justification")

    args = parser.parse_args()
    handler = SwitchApprovalHandler()

    if args.command == "list":
        requests = handler.list_pending_requests()
        print(f"Pending approval requests: {len(requests)}")
        for r in requests:
            c = r.get("conflict") or {}
            print(f"- Request ID: {r.get('id')}")
            print(f"  Conflict:   {c.get('title', 'Unknown')} (ID: {r.get('conflict_id')})")
            print(f"  Severity:   {c.get('severity', 'medium')}")
            print(f"  Proposed:   {r.get('proposed_status')} by {r.get('requesting_agent')}")
            print(f"  Review URL: {RELAY_API_URL}{r.get('review_url')}\n")

    elif args.command == "show":
        details = handler.get_request_details(args.request_id)
        if not details:
            print(f"Request '{args.request_id}' not found.")
            sys.exit(1)
        print(json.dumps(details, indent=2))

    elif args.command in ("approve", "reject"):
        res = handler.adjudicate_request(
            conflict_id=args.conflict_id,
            request_id=args.request_id,
            decision="approved" if args.command == "approve" else "rejected",
            mattermost_token=args.token,
            operator_secret=args.secret,
            decision_notes=args.notes,
        )
        print(json.dumps(res, indent=2))

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
