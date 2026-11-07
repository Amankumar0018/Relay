# Relay — Hackathon Demo Video & Production Package

> 🏆 **Flip the Switch Hackathon** — *WeMakeDevs × DevTools Academy × Switch*  
> 🎯 **Target Track**: Best Business Workflow  
> 🎬 **Master Video**: [`relay-demo.mp4`](relay-demo.mp4) (1080p60 Full HD, 2m 50s)

---

## 📹 Watch the Demo Video

The final, publication-ready demonstration video is located directly in this directory:

▶️ **[Download / Watch `relay-demo.mp4`](relay-demo.mp4)** *(9.63 MB, 1920×1080 @ 30 FPS)*

Synchronized English captions are also available as a standalone subtitle file:  
📄 **[English Subtitles (`relay-demo.en.srt`)](relay-demo.en.srt)**

---

## Master Video Specifications

| Parameter | Verified Value |
| :--- | :--- |
| **Output File** | [`docs/demo-video/relay-demo.mp4`](relay-demo.mp4) |
| **Duration** | **2 minutes 50 seconds** (170.03s — optimal hackathon format) |
| **Resolution** | **1920 × 1080** (Full HD, 16:9 widescreen) |
| **Frame Rate** | **30.00 fps** progressive |
| **Video Codec** | **H.264 (High Profile)**, CRF 18, `yuv420p`, web-optimized (`+faststart`) |
| **Audio Codec** | **AAC (LC)**, 48,000 Hz, 192 kbps |
| **Narration** | Neural Voice (`en-US-ChristopherNeural`, calibrated pacing ~132 wpm) |
| **Soundtrack** | Ambient harmonic chord synthesis ducked to -24 dB |
| **Subtitles** | Synchronized burned-in lower-third captions with semi-transparent backing |
| **Total File Size** | **9.63 MB** (10,097,641 bytes) — lightweight for seamless Git & browser streaming |

---

## Video Chapter Index & Scene Walkthrough

```
00:00 ─── Scene 1: The Problem (Hook Slate) ────────────────── 00:22 (22.0s)
00:22 ─── Scene 2: The Solution (Archive & Coordinates) ────── 00:44 (22.0s)
00:44 ─── Scene 3: The Engine (Contradiction & Orphans) ────── 01:11 (27.0s)
01:11 ─── Scene 4: Switch Integration (FastMCP & OpenCode) ─── 01:40 (29.0s)
01:40 ─── Scene 5: Governance (Cryptographic Review Desk) ──── 02:06 (26.0s)
02:06 ─── Scene 6: Executive Artifacts (Dossier & Radar) ───── 02:29 (23.0s)
02:29 ─── Scene 7: Conclusion & Grounded Trust (Outro) ─────── 02:50 (21.0s)
```

| Timestamp | Scene Name | Application View / Interface | Narrative Objective |
| :--- | :--- | :--- | :--- |
| **00:00 – 00:22** | **Scene 1: The Problem** | Animated Title Slate | Introduces institutional memory evaporation when technical leaders depart. |
| **00:22 – 00:44** | **Scene 2: The Solution** | Executive Dashboard (`:3000/app`) & Cryptographic Vault (`/app/archive`) | Outlines document ingestion with character-level evidence coordinates (`char_start`, `char_end`). |
| **00:44 – 01:11** | **Scene 3: The Engine** | Discrepancy Intelligence Engine (`/app/investigations`) | Detects real database contradictions (Project Odyssey Nov 15 vs Dec 20) and unassigned Kubernetes cluster Alpha-9. |
| **01:11 – 01:40** | **Scene 4: Switch Workflow** | Switch Workspace & OpenCode FastMCP | Shows autonomous agent executing Relay FastMCP tools to audit discrepancies without hallucinating. |
| **01:40 – 02:06** | **Scene 5: Governance Desk** | Adjudication Desk (`:8000/api/v1/...`) | Demonstrates two-phase approval doctrine with single-use 32-byte cryptographic token and Mattermost authentication. |
| **02:06 – 02:29** | **Scene 6: Executive Artifacts** | Handover Dossier (`/app/handovers`) & Continuity Radar (`/app/map`) | Compiles weeks of manual archaeology into an audited 9-Chapter Dossier and dynamic relationship topology. |
| **02:29 – 02:50** | **Scene 7: Grounded Trust** | Grounded Q&A & GitHub Call-to-Action | Demonstrates honest refusal on insufficient evidence, references 229 verified automated tests, and presents project links. |

---

## Directory Manifest

```
docs/demo-video/
├── relay-demo.mp4                      # Final 1080p master demonstration video (9.63 MB)
├── relay-demo.en.srt                  # Synchronized English subtitles
├── README.md                          # This master video package guide
├── relay-demo-storyboard.md           # 7-scene storyboard with timestamps and visual cues
├── relay-demo-voiceover.md            # Word-for-word narration script and pacing guide
├── relay-demo-workflow.md             # Technical architecture of the demonstrated workflow
├── relay-demo-recording-checklist.md  # Service health and live environment checklist
├── relay-demo-editing-guide.md        # Video composition, audio mixing, and export standards
├── audio/                             # Individual scene voiceover tracks (Edge Neural TTS)
│   ├── scene_01.mp3 ... scene_07.mp3
├── frames/                            # Lossless 1920x1080 UI captures from live services
│   ├── scene_01_hook.png ... scene_07_outro.png
└── qa_samples/                        # Verification frames extracted from final master video
    ├── scene_01_verify.png ... scene_07_verify.png
```

---

## Production Pipeline

The video was autonomously produced using Relay's automated media pipeline:
1. **Live UI Screen Capture**: Captured directly from running local instances (`localhost:3000`, `localhost:8000`, `localhost:52066`, `localhost:52067`) at native 1920×1080 via Chrome DevTools Protocol (`scripts/capture_live_video_frames.js`).
2. **Neural TTS Generation**: Generated using Microsoft Neural Speech (`en-US-ChristopherNeural`) calibrated to 132 wpm with natural pauses between conceptual blocks (`scripts/generate_voiceover.py`).
3. **Master Assembly & Subtitle Burn-In**: Built using modern FFmpeg 9.0.2 with high-fidelity libx264 (CRF 18), AAC 192k audio, synthesized ambient harmonic pad at -24 dB, and semi-transparent boxed lower-third subtitles (`scripts/assemble_video.py`).

---

## Security & Demonstration Boundaries Followed

- **Character-Level Coordinates**: Evidence coordinates (`char_start`, `char_end`) are strictly character-level coordinates within primary text segments.
- **Evidence-Grounding Refusal**: Accurately demonstrates Relay's refusal to guess when evidence is insufficient, rather than claiming unverified "zero hallucination".
- **Non-Consequential Demonstration**: The approval gate is demonstrated up to the proposal and human-review desk stage (displaying competing evidence and Mattermost authentication requirements), preserving database integrity.
- **Single-Agent Scope**: Accurately represents the OpenCode agent executing Relay's registered FastMCP tools without multi-agent overstatements.
