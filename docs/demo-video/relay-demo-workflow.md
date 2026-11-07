# Relay Demo Video — Workflow Architecture & Security Boundaries

This document provides the technical reference for the real system integration demonstrated in the Relay hackathon video, connecting **Mattermost**, **Switch**, **OpenCode**, the **Relay FastMCP Server**, and the **FastAPI/SQLite Core Engine**.

---

## 1. End-to-End Workflow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       DEMONSTRATED WORKFLOW PIPELINE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. INCOMING LEADER MESSAGE (Mattermost / Switch Room)                       │
│    Marcus Vance asks: "What is the confirmed delivery date for Odyssey?"    │
│                                  │                                          │
│                                  ▼                                          │
│ 2. SWITCH ORCHESTRATION & ROUTING (:52066)                                  │
│    Switch intercepts prompt and dispatches to OpenCode agent runtime.       │
│                                  │                                          │
│                                  ▼                                          │
│ 3. OPENCODE AGENT EXECUTION (relay-knowledge-extractor)                     │
│    Agent executes in local sandbox, querying tools defined in opencode.jsonc│
│                                  │                                          │
│                                  ▼                                          │
│ 4. FASTMCP SERVER VIA STDIO JSON-RPC                                        │
│    Calls: relay_get_conflicts(status="open")                                │
│    Calls: relay_ask_question("Odyssey schedule amendment reason")           │
│                                  │                                          │
│                                  ▼                                          │
│ 5. RELAY REST API GATEWAY (:8000)                                           │
│    GET /api/v1/intelligence/conflicts                                       │
│    POST /api/v1/continuity/qa                                               │
│                                  │                                          │
│                                  ▼                                          │
│ 6. RELATIONAL PERSISTENCE (relay.db - SQLite WAL)                           │
│    Retrieves Conflict #f11b799f (Nov 15 vs Dec 20) with character offsets.  │
│                                  │                                          │
│                                  ▼                                          │
│ 7. GROUNDED PROPOSAL & ESCALATION                                           │
│    Agent outputs context in Switch; calls relay_request_conflict_resolution │
│    Relay generates 32-byte single-use cryptographic token.                  │
│                                  │                                          │
│                                  ▼                                          │
│ 8. TWO-PHASE HUMAN GOVERNANCE DESK (:8000)                                  │
│    Reviewer opens /api/v1/intelligence/approvals/review?request_id=...       │
│    Authenticates server-to-server with Mattermost credentials.              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. FastMCP Tool Interface Specifications

Relay exposes five registered tools to the OpenCode agent via standard input/output JSON-RPC:

| FastMCP Tool | Input Parameters | Return Value | Demonstrated in Video |
|:---|:---|:---|:---:|
| `relay_deposit_document` | `title: str`, `text: str` | `document_id`, `sha256_hash`, `segments_count` | Pre-demonstrated (Scene 2) |
| `relay_get_conflicts` | `status: str`, `severity: Optional[str]` | List of flagged contradictions, gaps, and superseded decisions | **Live Call in Scene 4** |
| `relay_ask_question` | `question: str` | Grounded answer with verbatim quotations and character coordinates | **Live Call in Scene 4 & 7** |
| `relay_request_conflict_resolution` | `conflict_id: str`, `resolution_notes: str`, `proposed_status: str` | Request UUID, review URL, and token metadata | **Live Call in Scene 4 & 5** |
| `relay_resolve_conflict` | `conflict_id: str`, `resolution_notes: str`, `approval_token: str` | Resolution audit record with sealed approver identity | Gated by Human Approval Token |

---

## 3. Security Gate & Governance Evaluation

The security boundary of Relay's human approval mechanism was systematically audited and tested:

### 3.1 Approver Identity Verification & Anti-Spoofing
* **Verified Behavior**: Callers cannot forge approver identity via payload strings (such as `approver_id="admin"`).
* **Implementation**: In `backend/app/services/approval_service.py`, `approver_id` is derived strictly from verified Mattermost session profiles (`POST /api/v4/users/login` or `GET /api/v4/users/me`) or verified operator secrets.
* **Test Evidence**: Passed test `test_ai_agent_cannot_bypass_via_authorized_by_string` in `test_two_phase_approval.py`.

### 3.2 Token Single-Use & Replay Protection
* **Verified Behavior**: Reused, expired, or rejected approval tokens cannot be consumed.
* **Implementation**: Raw tokens are 32-byte cryptographically secure strings (`secrets.token_urlsafe(32)`). The database stores exclusively their SHA-256 hash. Once consumed, the token record is marked `status = "consumed"` with `consumed_at = now()`. Subsequent consumption attempts immediately raise `TokenAlreadyConsumedError`.
* **Test Evidence**: Passed tests `test_reused_token_replay_attack_rejected` and `test_expired_token_rejected`.

### 3.3 Concurrency Status & Non-Consequential Demonstration Rule
* **Concurrency Audit**: While SQLite in WAL mode serializes write transactions at the database engine level, an application-level concurrent race test on identical tokens across multiple async workers has not been performed.
* **Adherence to Demonstration Rule**: In strict compliance with hackathon safety requirements, the demo video **does not execute consequential conflict resolution** on live database records. Instead, it demonstrates:
  1. The OpenCode agent discovering the conflict and proposing resolution.
  2. The generation of the pending approval request and review URL.
  3. The dedicated Human Conflict Review Screen displaying competing claims with verbatim citations.
  4. The server-to-server Mattermost authentication form requiring reviewer verification.

---

## 4. Evidence Grounding vs. Refusal Semantics

Relay enforces a clear boundary between evidence-backed statements and unsupported queries:

1. **Character-Level Grounding**: Every persisted citation record contains `char_start` and `char_end` integer offsets within the primary document segment text. The runtime enforces the slicing invariant `assert seg.content[char_start:char_end] == verbatim_quote`.
2. **Honest Refusal Threshold**: When an incoming leader queries topics unsupported by deposited records, Relay token-match scoring returns `has_sufficient_evidence: false` and `confidence_score: 0.0`. The system explicitly returns:
   > *"Insufficient evidence in current institutional records. The deposited documentation does not contain verified claims regarding this topic."*
3. **No Speculative Interpolation**: Unlike standard chatbots that attempt to synthesize compromise dates, Relay exposes the raw institutional tension for human decision-makers.

