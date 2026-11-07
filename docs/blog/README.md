# Relay Technical Build Blog — Publication Package

This directory contains the publication-ready competition and engineering build story for **Relay**, prepared for publication on DEV Community and hackathon submission.

---

## Deliverables in This Directory

| File | Purpose | Status |
|:---|:---|:---|
| [`relay-technical-build-story.md`](relay-technical-build-story.md) | Full publication-ready technical build story for DEV Community. | **Complete & Verified** |
| [`README.md`](README.md) | Package documentation, editorial metadata, image index, and author confirmation checklist. | **Current Document** |

---

## Article Metadata

* **Proposed Title**: *The Next Leader Shouldn't Start from Zero: Building an Evidence-Grounded Institutional Continuity Engine with FastMCP, Switch, and Gemini*
* **Target Publication Platform**: DEV Community (`dev.to`)
* **Tags**: `#ai`, `#devtools`, `#architecture`, `#python`, `#webdev`
* **Target Track**: Best Business Workflow (*Flip the Switch Hackathon — WeMakeDevs × DevTools Academy × Switch*)
* **Word Count**: ~3,150 words (excluding code and raw tables)
* **Tone**: Technical build narrative from the perspective of the systems architect and full-stack engineer who built Relay.

---

## Structural & Technical Verification Checklist

- [x] **Compulsory Summary ("The Short Version")**: 5 high-impact bullet points with concrete metrics.
- [x] **Concrete Leadership Transition Scenario**: Uses synthetic demonstration records from the repository (`Project Odyssey Launch Plan`, `Schedule Amendment Memo`, `Project Aegis`, `Kubernetes cluster Alpha-9`, `Aman Kumar`, `Marcus Vance`).
- [x] **Mermaid Diagrams Included & Validated**:
  1. System Architecture Flowchart (`flowchart TD`)
  2. Relational Knowledge Graph ER Diagram (`erDiagram`)
  3. Property-Aware Conflict Detection Flowchart (`flowchart TD`)
  4. Two-Phase Human Governance Sequence Diagram (`sequenceDiagram`)
- [x] **Real Code Snippets**:
  - Verbatim citation offset validation (`backend/app/services/grounding.py` & `intelligence_service.py`)
  - Two-Phase approval token adjudication and replay protection (`backend/app/services/approval_service.py`)
  - Exact OpenCode FastMCP agent configuration (`opencode.jsonc`)
- [x] **FastMCP Tools Table**: All 5 registered tools documented (`relay_deposit_document`, `relay_ask_question`, `relay_get_conflicts`, `relay_request_conflict_resolution`, `relay_resolve_conflict`).
- [x] **Handover Dossier Matrix**: Full table describing all 9 implemented chapters and the 4-phase Day 1–30 Roadmap.
- [x] **Technology Fit Rationale**: Structured technology-to-responsibility table explaining architectural decisions.
- [x] **Visual Product Tour**: 11 referenced screenshots with captions and verified relative paths (`../screenshots/...`).
- [x] **Genuine Limitations Section**: Honest discussion of SQLite concurrency, synchronous LLM extraction latency, OCR degradation, and local Mattermost configuration.
- [x] **Engineering Lessons Learned**: 5 numbered takeaways grounded in actual implementation trade-offs.
- [x] **Closing Discussion Question**: Open-ended prompt inviting DEV Community technical dialogue.
- [x] **Verified Links & References**: GitHub repository, hackathon portal, and framework specifications.

---

## Image References Index

All images referenced in the article point to actual screenshots captured from the running production application:

| Figure # | File Path in Repository | Description |
|:---|:---|:---|
| Figure 1 | `../screenshots/01-dashboard/01-dashboard-overview.png` | Executive Continuity Dashboard overview with live telemetry |
| Figure 2 | `../screenshots/02-ingestion/01-document-archive-index.png` | Archive index with SHA-256 verification hashes |
| Figure 3 | `../screenshots/02-ingestion/02-document-extracted-evidence.png` | Document evidence inspector with character offsets |
| Figure 4 | `../screenshots/03-intelligence/02-direct-contradiction-comparison.png` | Direct contradiction comparison (Nov 15 vs Dec 20) |
| Figure 5 | `../screenshots/03-intelligence/04-ownership-gap-detection.png` | Kubernetes cluster Alpha-9 unassigned ownership gap |
| Figure 6 | `../screenshots/master/master_03_continuity_map_radar.png` | Dynamic Continuity Map in Topology Radar mode with zoom/pan |
| Figure 7 | `../screenshots/master/master_04_continuity_map_ledger.png` | Accessible Entity Ledger table mode with search filtering |
| Figure 8 | `../screenshots/07-human-approval/01-human-approval-review-screen.png` | Two-Phase human conflict review desk |
| Figure 9 | `../screenshots/07-human-approval/02-mattermost-auth-interface.png` | Server-to-server Mattermost credential verification |
| Figure 10 | `../screenshots/08-handover/01-handover-dossier-overview.png` | 9-Chapter Handover Dossier overview |
| Figure 11 | `../screenshots/09-grounded-qa/01-grounded-qa-sufficient-evidence.png` | Grounded Q&A desk returning verbatim citations |

*Note for DEV Community publication*: When uploading to dev.to, either upload the screenshots directly via DEV's image uploader or point the markdown image URLs to raw GitHub URLs once pushed (e.g., `https://raw.githubusercontent.com/Amankumar0018/Relay/main/docs/screenshots/...`).

---

## Pre-Publication Author Confirmations

Before publishing on DEV Community, the author should verify:

1. **GitHub Repository Visibility**: Confirm that `https://github.com/Amankumar0018/Relay` is set to Public for judges and readers.
2. **Author Bio & DEV Username**: Ensure your DEV Community account profile links to your GitHub and LinkedIn.
3. **Canonical Link**: If cross-posting to personal blogs or Medium, set the canonical URL to the primary DEV Community post.

