# Relay Technical Build Blog — Publication Package & Editorial Guide

This directory contains the publication-ready competition and engineering build story for **Relay**, prepared for publication on DEV Community (`dev.to`) and as the primary build documentation for the **Flip the Switch Hackathon** (WeMakeDevs × DevTools Academy × Switch).

---

## Directory Structure & Deliverables

```
docs/blog/
├── relay-technical-build-story.md    # Primary publication-ready technical build story
├── README.md                         # Package documentation, publishing guide & recording script
└── assets/
    ├── relay-blog-cover.png          # 1920x1080 Editorial Blog Cover Image
    ├── relay-architecture.png        # 1920x1080 Full-Stack Architecture Infographic
    ├── relay-workflow.png            # 1920x1080 End-to-End Continuity Lifecycle Graphic
    └── relay-evidence-trust.png      # 1920x1080 Evidence & Trust / Three Knowledge States Visual
```

---

## Article Metadata

* **Proposed Title**: *The Next Leader Shouldn't Start from Zero: Building an Evidence-Grounded Institutional Continuity Engine with FastMCP, Switch, and Gemini*
* **Target Publication Platform**: DEV Community (`dev.to`)
* **Tags**: `#ai`, `#devtools`, `#architecture`, `#python`, `#webdev`
* **Target Track**: Best Business Workflow (*Flip the Switch Hackathon 2026*)
* **Author**: Aman Kumar (Lead Full-Stack & Systems Architect)
* **Word Count**: ~3,400 words (excluding code, tables, and frontmatter)
* **License**: MIT Open Source License

---

## Complete Image Assets & Provenance Index

All visual assets and screenshots in the article are hosted on GitHub on the `main` branch. Every raw GitHub URL below has been verified with HTTP `HEAD` requests returning `200 OK` and valid `image/png` payloads:

### Editorial Visual Package (`docs/blog/assets/`)

| Figure | Asset Name | Dimensions | Purpose & Placement in Article | Verified Raw GitHub URL |
|:---:|:---|:---:|:---|:---|
| **Fig A** | `relay-blog-cover.png` | 1920 × 1080 | Executive blog cover placed before Section 1 | `https://raw.githubusercontent.com/Amankumar0018/Relay/main/docs/blog/assets/relay-blog-cover.png` |
| **Fig B** | `relay-workflow.png` | 1920 × 1080 | 8-stage continuity lifecycle in Section 2 | `https://raw.githubusercontent.com/Amankumar0018/Relay/main/docs/blog/assets/relay-workflow.png` |
| **Fig C** | `relay-architecture.png` | 1920 × 1080 | System architecture & topology in Section 4 | `https://raw.githubusercontent.com/Amankumar0018/Relay/main/docs/blog/assets/relay-architecture.png` |
| **Fig D** | `relay-evidence-trust.png` | 1920 × 1080 | The Three Knowledge States in Section 4.8 | `https://raw.githubusercontent.com/Amankumar0018/Relay/main/docs/blog/assets/relay-evidence-trust.png` |

### Production Application Screenshots (`docs/screenshots/`)

| Figure | Repository Path | Dimensions | Interface Subject | Verified Raw GitHub URL |
|:---:|:---|:---:|:---|:---|
| **Fig 1** | `docs/screenshots/01-dashboard/01-dashboard-overview.png` | 1920 × 1080 | Executive Continuity Dashboard & Readiness Score | `https://raw.githubusercontent.com/Amankumar0018/Relay/main/docs/screenshots/01-dashboard/01-dashboard-overview.png` |
| **Fig 2** | `docs/screenshots/02-ingestion/01-document-archive-index.png` | 1920 × 1080 | Document Archive Index with SHA-256 Hashes | `https://raw.githubusercontent.com/Amankumar0018/Relay/main/docs/screenshots/02-ingestion/01-document-archive-index.png` |
| **Fig 3** | `docs/screenshots/02-ingestion/02-document-extracted-evidence.png` | 1920 × 1080 | Evidence Inspector with Verbatim Character Offsets | `https://raw.githubusercontent.com/Amankumar0018/Relay/main/docs/screenshots/02-ingestion/02-document-extracted-evidence.png` |
| **Fig 4** | `docs/screenshots/03-intelligence/02-direct-contradiction-comparison.png` | 1920 × 1080 | Direct Contradiction Comparison (Nov 15 vs Dec 20) | `https://raw.githubusercontent.com/Amankumar0018/Relay/main/docs/screenshots/03-intelligence/02-direct-contradiction-comparison.png` |
| **Fig 5** | `docs/screenshots/03-intelligence/04-ownership-gap-detection.png` | 1920 × 1080 | Unassigned Ownership Gap (K8s Cluster Alpha-9) | `https://raw.githubusercontent.com/Amankumar0018/Relay/main/docs/screenshots/03-intelligence/04-ownership-gap-detection.png` |
| **Fig 6** | `docs/screenshots/master/master_03_continuity_map_radar.png` | 1920 × 1080 | Continuity Map in Dynamic Radar Mode | `https://raw.githubusercontent.com/Amankumar0018/Relay/main/docs/screenshots/master/master_03_continuity_map_radar.png` |
| **Fig 7** | `docs/screenshots/master/master_04_continuity_map_ledger.png` | 1920 × 1080 | Accessible Entity Ledger Table View | `https://raw.githubusercontent.com/Amankumar0018/Relay/main/docs/screenshots/master/master_04_continuity_map_ledger.png` |
| **Fig 8** | `docs/screenshots/07-human-approval/01-human-approval-review-screen.png` | 1920 × 1080 | Two-Phase Human Conflict Review Desk | `https://raw.githubusercontent.com/Amankumar0018/Relay/main/docs/screenshots/07-human-approval/01-human-approval-review-screen.png` |
| **Fig 9** | `docs/screenshots/07-human-approval/02-mattermost-auth-interface.png` | 1920 × 1080 | Server-to-Server Mattermost Authentication | `https://raw.githubusercontent.com/Amankumar0018/Relay/main/docs/screenshots/07-human-approval/02-mattermost-auth-interface.png` |
| **Fig 10** | `docs/screenshots/08-handover/01-handover-dossier-overview.png` | 1920 × 1080 | 9-Chapter Executive Handover Dossier | `https://raw.githubusercontent.com/Amankumar0018/Relay/main/docs/screenshots/08-handover/01-handover-dossier-overview.png` |
| **Fig 11** | `docs/screenshots/09-grounded-qa/01-grounded-qa-sufficient-evidence.png` | 1920 × 1080 | Grounded Q&A Desk with Verbatim Citations | `https://raw.githubusercontent.com/Amankumar0018/Relay/main/docs/screenshots/09-grounded-qa/01-grounded-qa-sufficient-evidence.png` |

---

## DEV Community Publishing Guide

### Why Raw GitHub URLs are Used
DEV Community markdown parsers cannot resolve relative filesystem paths (such as `../screenshots/...` or `assets/...`). Using relative paths causes DEV to render the dreaded *"image no longer exists"* placeholder. All images in `relay-technical-build-story.md` are configured with verified, publicly accessible raw GitHub URLs pointing to `https://raw.githubusercontent.com/Amankumar0018/Relay/main/...`.

### Step-by-Step Publishing Steps
1. **Open DEV Editor**: Log in to [dev.to/new](https://dev.to/new).
2. **Copy Article**: Copy the full contents of [`relay-technical-build-story.md`](relay-technical-build-story.md) into the markdown editor.
3. **Set Frontmatter**: Ensure the title, tags, and cover image URL are configured:
   ```yaml
   ---
   title: "The Next Leader Shouldn't Start from Zero: Building an Evidence-Grounded Institutional Continuity Engine with FastMCP, Switch, and Gemini"
   published: true
   tags: ai, devtools, architecture, python
   cover_image: https://raw.githubusercontent.com/Amankumar0018/Relay/main/docs/blog/assets/relay-blog-cover.png
   canonical_url: https://github.com/Amankumar0018/Relay
   ---
   ```
4. **Mermaid Diagram Handling on DEV Community**:
   * DEV Community does not natively execute JavaScript for ```mermaid code blocks.
   * The article includes high-resolution infographics (`Figure B: relay-workflow.png` and `Figure C: relay-architecture.png`) directly adjacent to the Mermaid blocks, providing immediate visual comprehension regardless of parser capabilities.
   * If desired, the author can leave the raw Mermaid blocks (which render cleanly as readable code fences on DEV) or collapse them inside `<details><summary>View Mermaid Code</summary>...</details>` tags.
5. **Preview & Verify**: Click **Preview** in the DEV editor to confirm all 15 images load crisply.

---

## Practical Video Demonstration Recording Sequence (60–90 Seconds)

To create an authentic, high-impact video demonstration of the Switch + FastMCP + Mattermost workflow, follow this exact 6-step recording sequence:

| Timestamp | Screen / Interface | Action & Narrative |
|:---|:---|:---|
| **0:00 – 0:15** | **Switch / Mattermost Chat** | Incoming engineering lead Marcus Vance types: *"What is the confirmed delivery date for Project Odyssey?"* in the transition channel. |
| **0:15 – 0:30** | **Switch Console / Terminal** | Switch receives the event and invokes the OpenCode agent (`relay-knowledge-extractor`). OpenCode makes a FastMCP tool call: `relay_get_conflicts(status="open")`. |
| **0:30 – 0:45** | **Relay Core Engine Terminal** | Relay queries SQLite `relay.db`, retrieves Conflict `#f11b799f`, and returns the discrepancy: *Launch Plan states Nov 15, while Amendment Memo states Dec 20*. |
| **0:45 – 0:60** | **Switch Chat Room** | The agent responds in chat: *"Two conflicting dates exist in primary records. Would you like me to request human adjudication?"* Upon confirmation, agent calls `relay_request_conflict_resolution`, generating a 32-byte single-use token and returning the review link. |
| **0:60 – 0:75** | **Relay Human Review Desk** | Human reviewer opens the Adjudication Desk (`/approvals/review`), authenticates with Mattermost PAT credentials, compares Claim A vs Claim B side-by-side, and clicks **Ratify December 20**. |
| **0:75 – 0:90** | **Audit Trail & Handover Dossier** | Show the token consumed, the immutable audit log entry sealed, and the 9-Chapter Handover Dossier dynamically updating Project Odyssey's delivery milestone to ratified December 20. |

---

## Pre-Publication Author Confirmations

Before publishing, verify:
- [x] **Repository Visibility**: `https://github.com/Amankumar0018/Relay` is public.
- [x] **Local Test Status**: 229 verified automated tests passing (`pytest backend/tests`).
- [x] **Assets Pushed**: Ensure all four visual assets in `docs/blog/assets/` are pushed to GitHub `main`.
- [x] **Author Bio & DEV Username**: Set up author profile and links on dev.to.
