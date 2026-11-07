# Relay Demo Video — Master Storyboard

**Total Runtime:** 2 minutes 55 seconds (175 seconds)  
**Target Video Resolution:** 1920 × 1080 @ 30 FPS  
**Target Track:** Best Business Workflow (*Flip the Switch Hackathon 2026*)

---

## Storyboard Overview & Timeline

```
0:00 ──────── 0:18 ──────── 0:42 ──────── 1:12 ──────── 1:48 ──────── 2:15 ──────── 2:38 ──────── 2:55
[Scene 1]    [Scene 2]    [Scene 3]    [Scene 4]    [Scene 5]    [Scene 6]    [Scene 7]    [Outro]
Opening      Dashboard    Conflicts    Switch &     Human Gate   Handover &   Grounded     Closing
Hook         & Deposition & Gaps       OpenCode MCP Review Desk  Radar Map    Q&A Refusal  Branding
```

---

## Scene-by-Scene Breakdown

### Scene 1: Opening Hook & Brand Identity (0:00 – 0:18)
* **Duration:** 18 seconds (0:00 – 0:18)
* **Window / Display:** Branded Motion Graphic / Video Slate (Full 1920×1080)
* **Route / URL:** None (Pre-rendered brand asset)
* **Visual Action:**
  - Dark carbon background (`#171717`) with subtle technical blueprint grid.
  - The Signal Orange square logo reveals with an industrial brutalist offset (`3px 3px 0 #171717`), followed by the bold wordmark:
    **RELAY**  
    `// INSTITUTIONAL MEMORY & LEADERSHIP CONTINUITY`
  - Two concise typography cards slide into view:
    *Card 1:* "Every time a leader leaves, critical knowledge leaves with them."  
    *Card 2:* "What if the next leader never had to start from zero?"
* **Expected Output:** High-impact editorial title card introducing the organizational amnesia problem.
* **What to Highlight:** The high-contrast editorial typography and the core question.
* **What to Avoid Showing:** Generic AI robotic illustrations, spinning abstract globes, or distracting effects.
* **Voice-Over (0:01 – 0:17):**
  > *"When technical leaders depart, institutional memory evaporates. Decisions lose their rationale, conflicting dates persist uncorrected across competing memos, and cloud infrastructure sits silently orphaned. We built Relay to ensure that when leadership changes, institutional knowledge survives intact."*
* **Subtitles:**
  - `[00:00.500 --> 00:04.500] When technical leaders depart, institutional memory evaporates.`
  - `[00:04.700 --> 00:09.000] Decisions lose their rationale, conflicting dates persist uncorrected,`
  - `[00:09.200 --> 00:13.200] and mission-critical cloud infrastructure sits silently orphaned.`
  - `[00:13.500 --> 00:17.500] Relay ensures that when leadership changes, knowledge survives intact.`
* **Transition:** Smooth 10-frame cross-fade into the live Relay web dashboard.

---

### Scene 2: Executive Command & Document Deposition (0:18 – 0:42)
* **Duration:** 24 seconds (0:18 – 0:42)
* **Window / Display:** Web Browser (Chrome, maximized at 1920×1080, 100% zoom)
* **Route / URL:** `http://localhost:3000/app` ──▶ `http://localhost:3000/app/archive`
* **Visual Action:**
  - Cursor glides smoothly across the Executive Continuity Dashboard.
  - Highlight the live telemetry: **34% Readiness Score**, **10 Ingested Documents**, **16 Indexed Entities**, and **6 Flagged Conflicts**.
  - Click on the left navigation bar item **"Archive"** (`/app/archive`).
  - Scroll gently through the deposited records list (`Project Odyssey Launch Plan`, `Project Odyssey Schedule Amendment Memo`, `Project Aegis Transition Briefing`).
  - Hover over a SHA-256 document fingerprint badge to show cryptographic archive integrity.
* **Expected Real Output:** Next.js industrial editorial UI renders instant transitions; table displays real document titles and verification hashes from `relay.db`.
* **What to Highlight:** The character-level evidence coordinates and SHA-256 tamper-proof archive hashes.
* **What to Avoid Showing:** Browser bookmarks, personal extensions, or extraneous tabs.
* **Voice-Over (0:18 – 0:41):**
  > *"Relay operates as an evidence-grounded continuity desk. Outgoing leaders deposit organizational memos, charters, and roadmaps. Rather than generating loose AI summaries, Relay’s extraction pipeline anchors every single assertion to character-level evidence coordinates in the primary text."*
* **Subtitles:**
  - `[00:18.200 --> 00:22.800] Relay operates as an evidence-grounded continuity desk.`
  - `[00:23.000 --> 00:27.500] Outgoing leaders deposit operational memos, charters, and roadmaps.`
  - `[00:27.800 --> 00:32.400] Rather than generating loose summaries, Relay's extraction pipeline`
  - `[00:32.600 --> 00:37.000] anchors every single assertion to character-level evidence coordinates`
  - `[00:37.200 --> 00:41.000] directly within primary organizational records.`
* **Transition:** Clean cut to `/app/investigations`.

---

### Scene 3: Property-Aware Conflict Detection & Ownership Gaps (0:42 – 1:12)
* **Duration:** 30 seconds (0:42 – 1:12)
* **Window / Display:** Web Browser (`http://localhost:3000/app/investigations`)
* **Route / URL:** `http://localhost:3000/app/investigations`
* **Visual Action:**
  - Click into **Conflict #f11b799f** (Critical Contradiction).
  - Zoom subtly (110%) into the side-by-side comparison:
    *Claim A:* `Project Odyssey Launch Plan` states Beta Release is **November 15, 2026**.  
    *Claim B:* `Project Odyssey Schedule Amendment Memo` states Beta Release is **December 20, 2026**.
  - Show the verbatim citation excerpt with exact character offsets.
  - Scroll down to highlight **Conflict #a396bb97** (High-Severity Ownership Gap):  
    *Kubernetes cluster Alpha-9* is heavily cited as a runtime dependency, yet has **zero assigned stewards**.
* **Expected Real Output:** Split comparative view highlighting semantic property matching (`project:odyssey:milestone:beta`) and the unassigned infrastructure warning.
* **What to Highlight:** How property-aware matching identifies logical contradictions that embedding models overlook.
* **What to Avoid Showing:** DevTools console or raw database UUIDs.
* **Voice-Over (0:42 – 1:11):**
  > *"Instead of smoothing over differences, Relay cross-examines records using property-aware semantic matching. Here, Document A specifies November 15 for launch, while an amendment memo references December 20. Relay flags a Direct Contradiction. It also unmasks an unassigned Kubernetes cluster—detecting an operational liability before an outage occurs."*
* **Subtitles:**
  - `[00:42.200 --> 00:46.800] Instead of smoothing over differences, Relay cross-examines records`
  - `[00:47.000 --> 00:51.000] using property-aware semantic matching across institutional facts.`
  - `[00:51.300 --> 00:55.200] Here, Document A specifies November 15 for launch,`
  - `[00:55.500 --> 01:00.000] while an amendment memo references December 20 following cluster testing.`
  - `[01:00.200 --> 01:05.000] Relay flags a Direct Contradiction and surfaces an unassigned Kubernetes cluster,`
  - `[01:05.200 --> 01:10.500] catching an operational liability before it impacts production.`
* **Transition:** Wipe left with an animated application badge: `SWITCH CONSOLE DESKTOP`.

---

### Scene 4: Live Mattermost → Switch → OpenCode → FastMCP Workflow (1:12 – 1:48)
* **Duration:** 36 seconds (1:12 – 1:48) — **Core Integration Focus**
* **Window / Display:** Split Screen or Focus Switch Desktop (`:52066`) & OpenCode Console
* **Route / URL:** Switch Desktop Workspace / OpenCode Agent View
* **Visual Action:**
  - Show the transition channel in Switch / Mattermost.
  - Incoming leader Marcus Vance submits the question:  
    `"What is the confirmed delivery date for Project Odyssey?"`
  - Show Switch routing the request to the autonomous OpenCode agent (`relay-knowledge-extractor`).
  - Terminal/Inspector view shows the agent invoking Relay’s registered FastMCP tools via stdio JSON-RPC:
    1. Tool call: `relay_get_conflicts(status="open")`
    2. Tool call: `relay_ask_question(question="Odyssey schedule amendment reason")`
  - Show Relay returning the conflicting claims and the amendment rationale.
  - The OpenCode agent outputs its response in the Switch room:  
    *"Two conflicting dates exist in primary records: Nov 15 vs Dec 20. Would you like me to initiate human review to ratify Dec 20?"*
* **Expected Real Output:** Real tool calls logged and returned via FastMCP stdio transport; grounded response displayed in Switch chat.
* **What to Highlight:** The live, bidirectional interaction between Switch, OpenCode, and Relay FastMCP tools.
* **What to Avoid Showing:** Plaintext API keys, environment files (`.env`), or internal authorization secrets.
* **Voice-Over (1:12 – 1:47):**
  > *"This is where Switch and the Model Context Protocol transform the workflow. When the incoming leader asks about the timeline in Switch, the OpenCode agent executes Relay’s registered FastMCP tools. It audits open discrepancies, retrieves the amendment evidence, and accurately explains the conflict rather than guessing an answer."*
* **Subtitles:**
  - `[01:12.500 --> 01:17.000] This is where Switch and FastMCP transform the workflow.`
  - `[01:17.200 --> 01:21.800] When the incoming leader queries the launch timeline in Switch,`
  - `[01:22.000 --> 01:26.500] the OpenCode agent invokes Relay's registered FastMCP tools.`
  - `[01:26.800 --> 01:31.500] It audits open discrepancies, retrieves the primary amendment evidence,`
  - `[01:31.800 --> 01:36.500] and transparently explains the conflicting records in the room`
  - `[01:36.800 --> 01:41.500] rather than guessing or smoothing over institutional reality.`
  - `[01:41.800 --> 01:46.500] The agent then proposes escalating the matter for human review.`
* **Transition:** Push left into the Human Review Desk.

---

### Scene 5: Human Conflict Review & Authority Boundary (1:48 – 2:15)
* **Duration:** 27 seconds (1:48 – 2:15)
* **Window / Display:** Web Browser on `http://localhost:8000/api/v1/intelligence/approvals/review?request_id=73b6938d-905f-4d39-b67e-7bfe1d08242a`
* **Route / URL:** Relay Human Review Screen (FastAPI Server-Rendered HTML)
* **Visual Action:**
  - Display the dedicated **Two-Phase Human Conflict Review Screen**.
  - Show the pending request details: Conflict Title, Claim A vs Claim B, primary document citations, and the single-use token status.
  - Highlight the **Mattermost Authentication Gate**: The reviewer must authenticate credentials or session token to verify approver identity.
  - Highlight the on-screen governance principle: Agents propose; only authenticated humans possess authority to resolve.
  - Demonstrate entering reviewer notes without submitting an irreversible database change.
* **Expected Real Output:** Functional HTML review desk rendering real pending request `73b6938d` with verbatim citations and Mattermost auth form.
* **What to Highlight:** The cryptographic single-use token boundary and anti-spoofing reviewer identity derivation.
* **What to Avoid Showing:** Real administrator passwords or clicking destructive commit actions on production data.
* **Voice-Over (1:48 – 2:14):**
  > *"Here is Relay’s defining governance doctrine: An AI agent may discover discrepancies and propose adjudications, but it must never possess the authority to unilaterally decide corporate truth. When human review is requested, Relay generates a 32-byte single-use cryptographic token. Ratification requires an authenticated human reviewer verified through Mattermost."*
* **Subtitles:**
  - `[01:48.200 --> 01:52.500] Here is Relay's defining governance doctrine:`
  - `[01:52.700 --> 01:57.200] An AI agent may discover discrepancies and propose adjudications,`
  - `[01:57.500 --> 02:02.000] but it must never unilaterally decide corporate truth.`
  - `[02:02.200 --> 02:06.500] Relay generates a single-use 32-byte cryptographic token.`
  - `[02:06.800 --> 02:11.200] Ratification strictly requires an authenticated human reviewer`
  - `[02:11.500 --> 02:14.500] verified server-to-server through Mattermost.`
* **Transition:** Dissolve to the Relay Executive Handover Dossier.

---

### Scene 6: The 9-Chapter Handover Dossier & Continuity Radar (2:15 – 2:38)
* **Duration:** 23 seconds (2:15 – 2:38)
* **Window / Display:** Web Browser on `http://localhost:3000/app/handovers` ──▶ `http://localhost:3000/app/map`
* **Route / URL:** `/app/handovers` and `/app/map`
* **Visual Action:**
  - Open the **9-Chapter Handover Dossier** (`/app/handovers`).
  - Rapidly showcase the chapter navigation:
    *Chapter 1:* Operational Health  
    *Chapter 2:* Active Initiatives (Odyssey, Aegis, Nova)  
    *Chapter 3:* Responsibility Matrix  
    *Chapter 4:* Decision & Amendment Lineage  
    *Chapter 6:* Discrepancy Ledger  
    *Section B:* The Day 1–30 Operational Roadmap across 4 transition phases.
  - Click into the **Continuity Map** (`/app/map`).
  - Demonstrate the dynamic SVG Topology Radar: Pan across the knowledge network, subduing unrelated nodes, and showing the verified stewardship link from outgoing leader Aman Kumar to incoming leader Marcus Vance.
* **Expected Real Output:** Instant client-side chapter rendering; smooth SVG radar interactions with zoom and node focus.
* **What to Highlight:** The comprehensive, boardroom-ready handover deliverable that eliminates weeks of exploratory meetings.
* **What to Avoid Showing:** Unformatted raw JSON or laggy canvas rendering.
* **Voice-Over (2:15 – 2:37):**
  > *"For the incoming leader, Relay compiles weeks of manual archaeology into an audited 9-Chapter Handover Dossier and a chronological Day 1 to 30 Roadmap. The interactive Continuity Radar maps every relationship across people, projects, and infrastructure, turning fragmented records into an operational compass."*
* **Subtitles:**
  - `[02:15.200 --> 02:19.500] For the incoming leader, Relay compiles weeks of manual archaeology`
  - `[02:19.800 --> 02:24.200] into an audited 9-Chapter Executive Briefing Book`
  - `[02:24.500 --> 02:28.000] and a chronological Day 1 to 30 Operational Roadmap.`
  - `[02:28.200 --> 02:32.800] The interactive Continuity Radar visually maps relationships`
  - `[02:33.000 --> 02:37.000] between people, projects, and critical infrastructure.`
* **Transition:** Quick cut to the Grounded Q&A search console.

---

### Scene 7: Grounded Q&A, Honest Refusal & Closing (2:38 – 2:55)
* **Duration:** 17 seconds (2:38 – 2:55)
* **Window / Display:** Web Browser (Grounded Q&A component) ──▶ Branded Outro Slate
* **Route / URL:** `/app` (Grounded Q&A section)
* **Visual Action:**
  - Enter supported query: `"What is Project Aegis Beta launch date?"`  
    *Output:* Direct response citing `February 1, 2027` with character coordinates `[312..358]`.
  - Enter unsupported query: `"Who is the on-call engineer for Redis cluster Beta-3?"`  
    *Output:* Explicit refusal badge:  
    `"Insufficient evidence in current institutional records. The deposited documentation does not contain verified claims regarding this topic."`
  - Fade smoothly to closing Relay brand screen:
    **RELAY**  
    *Evidence-Grounded Institutional Continuity Engine*  
    `github.com/Amankumar0018/Relay` &bull; `Flip the Switch Hackathon 2026`
* **Expected Real Output:** High-confidence answer with primary quotation followed by clean, honest refusal for ungrounded topic.
* **What to Highlight:** The honest refusal behavior that protects incoming leadership from false operational assumptions.
* **What to Avoid Showing:** Ambiguous responses or fabricated citations.
* **Voice-Over (2:38 – 2:54):**
  > *"When evidence exists, Relay anchors answers to exact source citations. When records are silent, it refuses to guess. Backed by 229 verified tests, Relay guarantees that the next leader never has to start from zero."*
* **Subtitles:**
  - `[02:38.200 --> 02:42.500] When evidence exists, Relay anchors answers to exact source citations.`
  - `[02:42.800 --> 02:46.500] When records are silent, it refuses to guess.`
  - `[02:46.800 --> 02:50.500] Backed by 229 verified automated tests,`
  - `[02:50.800 --> 02:54.500] Relay ensures the next leader never starts from zero.`
* **Transition:** Hold closing slate for 1.5 seconds, then fade to black at 2:55.

