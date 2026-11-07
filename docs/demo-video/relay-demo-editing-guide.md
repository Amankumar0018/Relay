# Relay Demo Video — Post-Production & Editing Guide

This guide details the technical and stylistic editing standards for assembling the Relay hackathon demonstration video.

---

## 1. Technical Export Specifications

| Attribute | Specification |
|:---|:---|
| **Container & Format** | `MP4` (MPEG-4 Part 14) |
| **Video Codec** | `H.264 / AVC` (High Profile, Level 4.2) |
| **Resolution** | `1920 × 1080` (16:9 Full HD) |
| **Frame Rate** | `30.000 FPS` (Constant Frame Rate) |
| **Pixel Format** | `YUV 4:2:0` (8-bit, Rec. 709 Color Space) |
| **Target Video Bitrate** | `16,000 – 20,000 kbps` (VBR 2-Pass or CQP 18) |
| **Audio Codec** | `AAC-LC` Stereo, `48.0 kHz`, `320 kbps` |
| **Integrated Audio Loudness** | `-16.0 LUFS` (&plusmn;1.0 LUFS), True Peak max `-1.0 dBFS` |

---

## 2. Visual Identity & Brand Styling

Maintain Relay’s signature **Industrial Editorial Brutalism** throughout all graphic overlays, lower-thirds, and transitions:

```
Canvas Background : #EAE5D8 (Raw Architectural Paper)
Deep Carbon       : #171717 (Borders, Drop Shadows & Frame Elements)
Signal Orange     : #F15A24 (Primary Highlights, Warnings & Logo Mark)
Telemetry Green   : #2E7D32 / #00C853 (Live Status Indicators & Validations)
Concrete Muted    : #767676 / #D5CEBD (Auxiliary Metadata & Technical Labels)
```

### Typography Hierarchy
* **Title & Headlines**: `Archivo:wght@900`, uppercase, letter-spacing `-0.03em`.
* **Technical Labels & Badges**: `Space Mono:wght@700`, uppercase, letter-spacing `0.08em`.
* **Subtitles & Captions**: `IBM Plex Sans:wght@600`, sentence case, letter-spacing `0.01em`.

---

## 3. Application Switching & Contextual Badges

When cutting between the web browser, Switch desktop, and the review desk, display a subtle lower-third badge in the top-left or bottom-left corner for 2.5 seconds to orient the viewer:

| Scene | Lower-Third Badge Text | Visual Style |
|:---|:---|:---|
| **Scene 2** | `APP 01 // RELAY COMMAND CENTER (:3000)` | Dark carbon pill, white mono text, green pulse dot |
| **Scene 3** | `APP 01 // DISCREPANCY INTELLIGENCE (:3000)` | Dark carbon pill, white mono text, orange accent border |
| **Scene 4** | `APP 02 // SWITCH WORKSPACE & OPENCODE AGENT (:52066)` | Carbon pill, signal orange tag `FASTMCP STDIO` |
| **Scene 5** | `APP 03 // HUMAN ADJUDICATION DESK (:8000)` | Hazard orange border, white mono text `HUMAN GATE` |
| **Scene 6** | `APP 01 // CONTINUITY RADAR & DOSSIER (:3000)` | Carbon pill, white mono text `TOPOLOGY ENGINE` |
| **Scene 7** | `APP 01 // GROUNDED CITATION SEARCH (:3000)` | Carbon pill, green tag `VERIFIED PROVENANCE` |

---

## 4. Controlled Zooms & Pointer Motion

* **Zoom Intensity**: When focusing on critical UI elements (e.g. the Odyssey date contradiction diff or the MCP tool calls in Switch), apply a subtle **110% zoom** centered on the element.
* **Easing**: Use smooth Bezier curves (`ease-in-out`, duration 0.45s) for all punch-in zooms. Never use abrupt, jerky jumps.
* **Pointer Dynamics**: Highlight mouse clicks with an expanding 20px circular ripple (50% opacity, fade out in 200ms).

---

## 5. Audio Engineering & Mixing

### Channel 1: Voiceover Narration
* **Processing Chain**:
  1. High-Pass Filter: Roll off below `80 Hz` (18 dB/octave).
  2. Subtractive EQ: Notch out boxiness at `350 Hz` (-2 dB) and sibilance at `6.5 kHz` (-1.5 dB).
  3. Compressor: 3:1 ratio, 20ms attack, 120ms release, 2–3 dB gain reduction.
  4. De-Esser: Threshold set for smooth natural high-end.
* **Target Level**: Dialogue should peak between `-6.0 dBFS` and `-4.0 dBFS`.

### Channel 2: Background Music Bed
* **Genre**: Minimal ambient tech, atmospheric downtempo, or industrial lo-fi (warm analog synths, subtle rhythmic pulse, zero vocal elements).
* **Base Level**: `-22.0 dBFS` during intro and outro.
* **Sidechain Ducking**: Automatically duck music by `-6 dB` (down to `-28.0 dBFS`) whenever voiceover is active, with a 200ms attack and 500ms release.

---

## 6. Subtitle Styling & Positioning

* **File Reference**: Use [`relay-demo.en.srt`](relay-demo.en.srt).
* **Font**: `IBM Plex Sans SemiBold`, `42pt` at 1080p.
* **Color**: Pure white (`#FFFFFF`) with a subtle `2px` black border and semi-transparent carbon box (`#171717`, 85% opacity, `8px` padding).
* **Placement**: Centered horizontally, bottom-aligned at `96px` above the bottom edge. Max 2 lines per subtitle cue, max 42 characters per line.

---

## 7. Timeline Assembly Checklist

1. [ ] **0:00 – 0:18**: Title Reveal graphic with subtle ambient music swelling.
2. [ ] **0:18 – 0:42**: Clean cut to browser overview; lower-third badge appears.
3. [ ] **0:42 – 1:12**: Cut to Investigations desk; subtle 110% punch-in on the Odyssey contradiction comparison.
4. [ ] **1:12 – 1:48**: Cut to Switch workspace; highlight OpenCode FastMCP tool invocations.
5. [ ] **1:48 – 2:15**: Cut to Human Review Desk; zoom on Mattermost auth box and token status.
6. [ ] **2:15 – 2:38**: Cut to Handover Dossier & Continuity Radar; smooth pan across knowledge graph nodes.
7. [ ] **2:38 – 2:55**: Cut to Grounded Q&A search; showcase the honest refusal; transition to branded closing card.
8. [ ] **2:55**: Fade to black over 0.5 seconds.

