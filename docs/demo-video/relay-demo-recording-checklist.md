# Relay Demo Video — Recording Checklist & Live Procedure

This checklist outlines the exact, step-by-step procedure for capturing authentic, publication-quality demo footage of Relay.

---

## 1. System Startup & Service Preparation

Before starting recording software (OBS Studio / Screen Studio), execute the following startup sequence:

### Terminal 1: FastAPI Core Engine
```bash
cd C:\Users\Aman\Desktop\Relay\backend
.\.venv\Scripts\activate
uvicorn app.main:app --host 127.0.0.1 --port 8000
```
*Health Check:* Open `http://localhost:8000/health` in browser.  
*Expected Output:* `{"status":"ok","database":"connected","environment":"development","version":"0.1.0"}`

### Terminal 2: Next.js Frontend Application
```bash
cd C:\Users\Aman\Desktop\Relay\frontend
npm run start
```
*Health Check:* Open `http://localhost:3000` in browser.  
*Expected Output:* Relay Landing Page renders cleanly with zero console warnings.

### Service 3: Mattermost Authentication Server
*Port:* `:52067`  
*Health Check:* Open `http://localhost:52067/api/v4/system/ping`  
*Expected Output:* `{"status":"OK"}`

### Service 4: Switch Desktop Console
*Port:* `:52066`  
*Workspace:* Ensure Switch Console is running and the `relay` FastMCP tool is active in `opencode.jsonc`.

---

## 2. Display & Screen Recording Setup

- [ ] **Display Resolution**: Set primary monitor to exact `1920 × 1080` (100% DPI scaling).
- [ ] **Browser Window**: Chrome or Brave running full screen (F11 or hidden bookmark bar).
- [ ] **Browser Zoom**: Exactly 100% (Reset with `Ctrl + 0`).
- [ ] **Mouse Pointer**: Enable subtle pointer highlighting (e.g. 24px subtle ring, 40% opacity).
- [ ] **Recording Tool Settings**:
  - Resolution: `1920 × 1080`
  - Frame Rate: `30 FPS` (or `60 FPS` downsampled to 30)
  - Color Format: `NV12` or `I420` (Rec. 709)
  - Bitrate: `18,000 kbps` CBR or CQP 18

---

## 3. Scene-by-Scene Screen Navigation & Recording Procedure

### Scene 1: Opening Hook (0:00 – 0:18)
*Asset:* Pre-rendered title card or graphic asset [`relay-blog-cover.png`](../blog/assets/relay-blog-cover.png).  
*Action:* No live capture needed; assemble in video editor.

---

### Scene 2: Dashboard & Document Archive (0:18 – 0:42)
*Screen:* Browser on `http://localhost:3000/app`  
*Recording Steps:*
1. [0:18 – 0:26] Start on the **Executive Continuity Dashboard** (`/app`).
   - Allow the overview cards to be visible: Readiness Score (34%), Ingested Documents (10), Entities (16), Open Conflicts (6).
   - Smoothly move mouse from the Readiness gauge down across the knowledge counter badges.
2. [0:26 – 0:32] Click **"Archive"** in the left sidebar navigation (`/app/archive`).
3. [0:32 – 0:42] Scroll smoothly through the repository list:
   - Hover momentarily over `Project Odyssey Launch Plan.txt`.
   - Hover momentarily over `Project Odyssey Schedule Amendment Memo.txt`.
   - Point to the `SHA-256` badge.
4. Pause for 1 second before navigating.

---

### Scene 3: Investigations & Ownership Gaps (0:42 – 1:12)
*Screen:* Browser on `http://localhost:3000/app/investigations`  
*Recording Steps:*
1. [0:42 – 0:48] Click **"Investigations"** (`/app/investigations`).
2. [0:48 – 0:58] Click on the **Critical Contradiction card** (`Conflict #f11b799f`):
   - Show the side-by-side claim comparison:
     - Claim A: Launch Plan (Nov 15, 2026).
     - Claim B: Schedule Amendment (Dec 20, 2026).
   - Hover over the verbatim quotation highlight showing character-level evidence coordinates.
3. [0:58 – 1:10] Scroll down to **Conflict #a396bb97** (High-Severity Ownership Gap):
   - Highlight the alert: *Unassigned Ownership: Kubernetes cluster Alpha-9*.
   - Point to the missing owner warning badge.
4. Pause for 1 second before switching applications.

---

### Scene 4: Switch Console & OpenCode Agent (1:12 – 1:48) — PRIMARY INTEGRATION
*Screen:* Switch Desktop Workspace (`:52066`) & OpenCode Console  
*Recording Steps:*
1. [1:12 – 1:20] Switch window to the active Switch transition room.
2. [1:20 – 1:28] In the chat input, type:  
   `What is the confirmed delivery date for Project Odyssey?`  
   and press Enter.
3. [1:28 – 1:38] Show the OpenCode agent invoking FastMCP tools:
   - Tool Call: `relay_get_conflicts(status="open")` ──▶ Returns open contradiction #f11b799f.
   - Tool Call: `relay_ask_question("Odyssey schedule amendment reason")` ──▶ Returns amendment context.
4. [1:38 – 1:48] Highlight the OpenCode agent's response in Switch:
   - Points out the two competing dates (Nov 15 vs Dec 20).
   - Proposes escalating to human review to ratify Dec 20.

---

### Scene 5: Human Review Desk & Governance Boundary (1:48 – 2:15)
*Screen:* Browser on `http://localhost:8000/api/v1/intelligence/approvals/review?request_id=73b6938d-905f-4d39-b67e-7bfe1d08242a`  
*Recording Steps:*
1. [1:48 – 1:58] Open the dedicated **Human Conflict Review Screen**.
   - Show the competing evidence cards (Claim A vs Claim B) and primary citations.
2. [1:58 – 2:06] Move mouse over the **Mattermost Authentication Form**:
   - Highlight the username and password fields or session token verification.
   - Highlight the single-use token status indicator.
3. [2:06 – 2:14] Point to the Reviewer Justification field.
   - Type sample note: `Verified against staging cluster load tests.` (Do not click Submit on live data).
   - Emphasize the governance rule: Agents propose; only authenticated humans possess authority to resolve.

---

### Scene 6: Handover Dossier & Continuity Radar (2:15 – 2:38)
*Screen:* Browser on `http://localhost:3000/app/handovers` ──▶ `http://localhost:3000/app/map`  
*Recording Steps:*
1. [2:15 – 2:25] Navigate to `/app/handovers`:
   - Click through Chapters 1, 2, 3, and the **Day 1–30 Operational Roadmap**.
   - Highlight the 4 transition phases (Orientation, Adjudication, Architecture, Autonomy).
2. [2:25 – 2:38] Click **"Map"** (`/app/map`):
   - Demonstrate the dynamic SVG Topology Radar.
   - Drag to pan across the network; click on incoming leader *Marcus Vance*.
   - Watch the related stewardship connections illuminate while unrelated nodes subdue.

---

### Scene 7: Grounded Q&A with Honest Refusal & Outro (2:38 – 2:55)
*Screen:* Browser on Grounded Q&A Desk (`/app`) ──▶ Closing Brand Screen  
*Recording Steps:*
1. [2:38 – 2:44] Enter supported question:  
   `What is Project Aegis Beta launch date?`  
   - Press Enter ──▶ Shows `February 1, 2027` with exact citation segment and character coordinates.
2. [2:44 – 2:50] Enter unsupported question:  
   `Who is on call for Redis cluster Beta-3?`  
   - Press Enter ──▶ Shows honest refusal badge:  
     `"Insufficient evidence in current institutional records. The deposited documentation does not contain verified claims regarding this topic."`
3. [2:50 – 2:55] Cut to closing title card:
   - **RELAY** (Signal Orange Mark + Archivo Typography)
   - `github.com/Amankumar0018/Relay` &bull; `Flip the Switch Hackathon 2026`

---

## 4. Security & Compliance Rules During Recording

- [ ] **NO Credentials on Screen**: Ensure no terminal shows `.env`, `GEMINI_API_KEY`, or `SWITCH_OPERATOR_SECRET`.
- [ ] **NO DB Mutations**: Do not click destructive conflict resolutions or reset the SQLite database.
- [ ] **NO Fabricated Overlays**: All screen actions must be executed in real browser and terminal windows.
- [ ] **NO Personal Information**: Ensure OS notifications and personal messaging apps are closed.

