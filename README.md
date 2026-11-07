# Relay

> **Evidence-Grounded Organizational Memory & Institutional Continuity Platform**  
> Preserving institutional truth, detecting operational contradictions, and synthesizing verifiable leadership handovers.

[![System Status](https://img.shields.io/badge/status-active%20%2F%20verified-success?style=for-the-badge)](https://github.com)
[![Automated Tests](https://img.shields.io/badge/backend%20tests-229%20passed-blue?style=for-the-badge)](https://github.com)
[![Frontend Routes](https://img.shields.io/badge/frontend%20build-17%2F17%20prerendered-blueviolet?style=for-the-badge)](https://github.com)
[![Governance](https://img.shields.io/badge/governance-two--phase%20human%20approval-orange?style=for-the-badge)](https://github.com)
[![License](https://img.shields.io/badge/license-MIT%20Pending-lightgrey?style=for-the-badge)](https://github.com)

---

## Visual Product Tour

| Operational Continuity Dashboard | Two-Phase Human Conflict Review |
|:---:|:---:|
| ![Relay Dashboard](docs/screenshots/01-dashboard/01-dashboard-overview.png) | ![Human Approval Review](docs/screenshots/07-human-approval/01-human-approval-review-screen.png) |
| *Readiness telemetry, indexed triples, and open anomalies* | *Verbatim claim comparison and Mattermost authentication* |

| 9-Chapter Executive Briefing Book | Zero-Hallucination Grounded Q&A |
|:---:|:---:|
| ![Handover Dossier](docs/screenshots/08-handover/01-handover-dossier-overview.png) | ![Grounded QA Desk](docs/screenshots/09-grounded-qa/01-grounded-qa-sufficient-evidence.png) |
| *Evidence-grounded transition briefing with 30-day roadmap* | *Strict citation verification and honest insufficient-evidence refusals* |

👉 **Explore the complete 28-image screenshot index in [`docs/screenshots/README.md`](docs/screenshots/README.md)**.

---

## Table of Contents

1. [Project Introduction](#1-project-introduction)
2. [Problem Statement](#2-problem-statement)
3. [Solution Overview](#3-solution-overview)
4. [Key Features](#4-key-features)
5. [System Architecture](#5-system-architecture)
6. [Complete System Workflow](#6-complete-system-workflow)
7. [Conflict Detection Lifecycle](#7-conflict-detection-lifecycle)
8. [Human Approval & Security Architecture](#8-human-approval--security-architecture)
9. [Handover Dossier Structure](#9-handover-dossier-structure)
10. [Technology Stack](#10-technology-stack)
11. [Repository Structure](#11-repository-structure)
12. [Installation & Local Setup](#12-installation--local-setup)
13. [Environment Variables](#13-environment-variables)
14. [API & FastMCP Documentation](#14-api--fastmcp-documentation)
15. [Testing & Quality Assurance](#15-testing--quality-assurance)
16. [Screenshots & Product Walkthrough](#16-screenshots--product-walkthrough)
17. [Security & Data Integrity](#17-security--data-integrity)
18. [Limitations & Future Roadmap](#18-limitations--future-roadmap)
19. [Contribution & License](#19-contribution--license)
20. [Closing Summary](#20-closing-summary)

---

## 1. Project Introduction

**Relay** is an evidence-grounded institutional continuity and memory platform designed to solve the structural amnesia that plagues organizations during leadership transitions, restructuring, and rapid operational scaling.

### What Relay Is
Relay transforms unstructured institutional documents—project charters, architecture roadmaps, schedule amendment memos, governance delegations, and meeting minutes—into an immutable, citation-grounded knowledge graph. When institutional documents contradict one another or leave critical infrastructure unassigned, Relay proactively detects the anomaly, flags the discrepancy, and enforces a **Two-Phase Human Approval workflow** so AI agents can never unilaterally overwrite institutional truth.

### Why Traditional Solutions Fail
- **Cloud Drives & Wikis Rot**: Traditional document storage (Google Drive, SharePoint, Notion) functions as passive digital landfills. Documents are filed and forgotten, predecessor decisions remain unflagged when amended, and superseded deadlines silently mislead teams.
- **Chat Histories Bury Rationale**: Conversations in Slack or Mattermost contain critical decisions, but their searchability is ephemeral. Context is scattered across hundreds of channels and private threads without structured ownership or evidence links.
- **Unowned Commitments Slip Through Cracks**: Critical infrastructure assets, server clusters, vendor auto-renewals, and regulatory filings frequently lack explicit owners, only surfacing after catastrophic outages or missed deadlines.
- **LLM Hallucinations Compound Risk**: Unconstrained LLMs summarize text by inventing plausibly sounding facts, smoothing over contradictory dates, and guessing unassigned leadership roles.

### Relay's Core Value Proposition
Relay bridges human collaboration tools (Switch, Mattermost) and institutional records with strict cryptographic citations, continuous contradiction detection, and automated synthesis of a **9-Chapter Executive Briefing Book** paired with a **Day 1–30 Operational Roadmap**.

---

## 2. Problem Statement

Organizational leadership transitions are high-friction, high-risk operational choke points:

1. **Catastrophic Knowledge Bleed**: Departing executives take unwritten operational history, informal agreements, and risk registers with them. Successors spend their first 90 days rediscovering operational context rather than executing strategy.
2. **Fragmented & Contradictory Decisions**: Critical project milestones exist in competing formats across different memos (e.g. Project Odyssey launch dates cited as November 15, 2026 in original charters, but amended to December 20, 2026 in technical review memos). Teams operate against disparate versions of reality.
3. **Orphaned Infrastructure & Ownership Gaps**: Critical assets (e.g. Kubernetes cluster Alpha-9) are mentioned in operational documents without assigned organizational stewards, creating severe compliance and continuity hazards.
4. **Lack of Verifiable Grounding**: Incoming leaders have no verifiable mechanism to validate whether briefing claims originate from ratified decisions or ungrounded assumptions.

---

## 3. Solution Overview

Relay introduces an active, continuous intelligence fabric that guarantees institutional continuity across four interconnected operational planes:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          RELAY OPERATIONAL PLANES                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. INGESTION & GROUNDING: Multimodal document extraction with               │
│    character-exact coordinates and verbatim source citations.               │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. CONTINUOUS INTELLIGENCE: Automated detection of direct contradictions,   │
│    superseded decisions, ownership gaps, and missing knowledge.             │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. GOVERNED HUMAN ADJUDICATION: Two-phase approval requiring authenticated  │
│    human reviewers (Mattermost/Switch) to resolve organizational conflicts. │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. TRANSITION SYNTHESIS: Compilation of an evidence-backed 9-chapter        │
│    Executive Briefing Book and chronological Day 1–30 Operational Roadmap.  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Key Features

### Implemented & Verified Capabilities

- [x] **Deterministic Document Segmentation**: Parses raw text, PDFs, and documentation into indexed segments with exact start and end character offsets.
- [x] **Multimodal AI Structured Extraction**: Leverages Google Gemini multimodal intelligence to extract structured entities, mentions, typed facts, and relationship triples.
- [x] **100% Verbatim Citation Anchoring**: Every fact persisted in Relay is permanently linked to an immutable segment ID and verbatim quotation from primary documents.
- [x] **Contradiction & Discrepancy Engine**: Cross-compares factual claims across the entire repository to detect conflicting dates, mismatched roles, and conflicting mandates.
- [x] **Superseded Decision Tracking**: Recognizes explicit amendment language (e.g. *"amends or supersedes prior decision"*) to preserve historical decision lineage while recognizing the active policy.
- [x] **Ownership & Knowledge Gap Detection**: Proactively surfaces high-value infrastructure assets (e.g. `Kubernetes cluster Alpha-9`) and unverified claims lacking an assigned steward.
- [x] **Two-Phase Human Approval Security**: AI agents can request conflict resolutions via FastMCP, but only an authenticated human reviewer can review competing claims and authorize updates.
- [x] **Cryptographic Single-Use Tokens**: Every pending resolution generates a cryptographically random, time-expiring `ConflictApprovalToken` with replay protection.
- [x] **Server-to-Server Mattermost Authentication**: Reviewer identities are authenticated server-to-server against Mattermost (`/api/v4/users/login`) with rate limiting (5 attempts, 300s lockout) and zero token leakage.
- [x] **Immutable Adjudication Audit Log**: Every approval, rejection, and deduplication action is immutably logged with approver identity, auth method, resolution notes, and token hash.
- [x] **9-Chapter Executive Briefing Book**: Synthesizes institutional memory across 9 comprehensive operational chapters with zero hallucinated names.
- [x] **Day 1–30 Operational Roadmap**: 4-phase, 12-action chronological roadmap structured for incoming leadership onboarding.
- [x] **Zero-Hallucination Incoming Leader Q&A**: Q&A engine queries verified facts and handover dossiers; queries lacking evidence return an honest refusal (`has_sufficient_evidence: false`).
- [x] **FastMCP Agent Integration**: 5 registered tools connecting Switch Console and OpenCode agents directly to Relay.
- [x] **Multi-Format Export**: One-click exports to structured JSON, full Markdown (`.md`), and clean print view stylesheets.

### Future Roadmap (Unimplemented Capabilities)
- [ ] Distributed vector database integration (Qdrant / pgvector) for multi-million document semantic scaling.
- [ ] Live audio transcription and meeting minute grounding via Gemini Live API.
- [ ] Multi-tenant organizational workspace isolation.

---

## 5. System Architecture

Relay is built on a modular, decoupled architecture connecting frontend interfaces, human chat tools, autonomous agents, and persistent storage.

```mermaid
flowchart TD
    subgraph HumanInterfaces["Human & Collaboration Interfaces"]
        FE["Next.js Brutalist Web UI\n(Port 3000)"]
        SW["Switch Console\n(Port 52066)"]
        MM["Mattermost Team Edition\n(Port 52067)"]
    end

    subgraph AgentLayer["Agent & Orchestration Layer"]
        OCA["OpenCode Agent\n(Relay Test Agent)"]
        MCP["Relay FastMCP Server\n(Stdio Transport)"]
    end

    subgraph RelayCore["Relay Backend Core (FastAPI :8000)"]
        API["FastAPI REST API Gateway"]
        
        subgraph Services["Core Processing Services"]
            DOC["Document Ingestion\n& Segmentation"]
            LLM["Gemini Extraction\n& Grounding Provider"]
            INT["Intelligence Analyzer\n(Conflict Engine)"]
            APP["Two-Phase Human\nApproval Service"]
            DOS["9-Chapter Dossier\nSynthesis Service"]
            QA["Evidence-Grounded\nQ&A Service"]
        end
        
        SEC["Security & Auth Guard\n(Rate Limiter & Operator Secret)"]
    end

    subgraph StorageLayer["Persistence & Ground Truth"]
        DB[("SQLite 3 Database\n(WAL Mode Enabled)\n15 Core Tables")]
        BACKUP[("Timestamped Backups\n& Audit Provenance")]
    end

    %% Wiring
    FE -->|REST API Calls| API
    SW --> OCA
    OCA -->|JSON-RPC Tools| MCP
    MCP -->|HTTP REST| API
    MM -->|Server-to-Server Auth| APP

    API --> SEC
    SEC --> Services

    DOC --> LLM
    LLM --> DB
    INT --> DB
    APP --> DB
    DOS --> DB
    QA --> DB
    DB --> BACKUP
```

---

## 6. Complete System Workflow

The end-to-end lifecycle guarantees that no ungrounded claim enters institutional memory and no conflict is resolved without verified human oversight.

```mermaid
flowchart TD
    A["1. Document Ingestion\n(PDF, TXT, DOCX)"] --> B["2. Deterministic Segmentation\n(Character Offsets)"]
    B --> C["3. Multimodal Fact Extraction\n(Google Gemini)"]
    C --> D["4. Entity Resolution &\nCitation Grounding"]
    D --> E[("5. Persistent Storage\n(Relay SQLite WAL)")]
    
    E --> F["6. Continuous Intelligence\nAnalyzer Scan"]
    
    F --> G{"Conflict\nDetected?"}
    G -- "Corroborated / No Conflict" --> H["Knowledge Graph Updated"]
    
    G -- "Contradiction / Gap / Superseded" --> I["Flag Knowledge Conflict\n(Open Anomaly)"]
    
    I --> J["7. AI Agent Investigation\n(Switch FastMCP Tool)"]
    J --> K["8. Agent Requests Resolution\n(relay_request_conflict_resolution)"]
    K --> L["Generate Single-Use\nConflictApprovalToken"]
    
    L --> M["9. Human Review Desk\n(/api/v1/intelligence/approvals/review)"]
    
    subgraph HumanApprovalBoundary["Strict Human Approval Boundary"]
        M --> N["Human Reviewer Authenticates\n(Mattermost Login / PAT)"]
        N --> O{"Reviewer\nDecision"}
        O -- "Approve" --> P["Adjudicate Resolution\n(Consume Token & Update Truth)"]
        O -- "Reject" --> Q["Reject Proposal\n(Preserve Conflict State)"]
    end
    
    P --> R["10. Immutable Audit Log\n(conflict_resolution_audits)"]
    R --> S["11. Executive Handover Dossier\n(9 Chapters & 30-Day Roadmap)"]
    S --> T["12. Incoming Leader Grounded Q&A\n(Zero-Hallucination Retrieval)"]
```

---

## 7. Conflict Detection Lifecycle

Relay classifies organizational knowledge interactions into distinct cognitive categories:

```mermaid
flowchart LR
    A["Extracted Fact B"] --> B{"Compare with\nFact A"}
    
    B -- "Same claim &\nsame timeline" --> C["Corroboration\n(Increases Confidence)"]
    B -- "Incompatible dates\nor opposing statements" --> D["Direct Contradiction\n(CRITICAL SEVERITY)"]
    B -- "Explicit amendment\nof earlier decision" --> E["Superseded Decision\n(MEDIUM SEVERITY)"]
    B -- "Asset mentioned\nwithout steward" --> F["Ownership Gap\n(HIGH SEVERITY)"]
    B -- "Unverified citation\nor absent source" --> G["Evidence Gap\n(HIGH SEVERITY)"]

    D --> H["Queue for Human Review"]
    E --> H
    F --> H
    G --> H
```

### Conflict Classification Matrix

| Conflict Category | Severity | Example from Ingested Data | Resolution Mechanism |
|:---|:---:|:---|:---|
| **Direct Contradiction** | `CRITICAL` | Odyssey Beta launch: Nov 15, 2026 vs Dec 20, 2026 | Human reviewer ratifies valid date via Mattermost |
| **Direct Contradiction** | `CRITICAL` | Odyssey GA release: Jan 15, 2027 vs Feb 28, 2027 | Human reviewer ratifies production release date |
| **Superseded Decision** | `MEDIUM` | Deployment roadmap amendment supersedes launch memo | Successor amendment adopted while preserving history |
| **Superseded Decision** | `MEDIUM` | Aegis Beta postponed from Dec 15, 2026 to Feb 1, 2027 | Postponement ratified; technical scope confirmed |
| **Ownership Gap** | `HIGH` | `Kubernetes cluster Alpha-9` lacks assigned steward | Incoming leadership assigns responsible architect |
| **Knowledge Gap** | `HIGH` | ACM student chapter role cited without verified documentation | Marked as unverified pending primary record ingestion |

---

## 8. Human Approval & Security Architecture

Relay enforces a zero-trust model between AI agents and organizational ground truth:

```mermaid
sequenceDiagram
    autonumber
    actor Agent as Switch AI Agent (OpenCode)
    participant Relay as Relay API Gateway
    participant DB as Relay SQLite Database
    actor Human as Human Compliance Reviewer
    participant MM as Mattermost Auth Service

    Agent->>Relay: POST /api/v1/conflicts/{id}/request-resolution
    Note over Relay: Validates conflict exists & is open
    Relay->>DB: Create ConflictApprovalToken (Status: pending, Expiry: 24h)
    Relay-->>Agent: Returns Request ID & Review Link URL
    
    Agent-->>Human: Posts Review Link into Mattermost/Switch Channel
    Human->>Relay: Opens Review Screen (GET /approvals/review?request_id=...)
    Relay-->>Human: Renders Fact A vs Fact B & Verbatim Citations

    Human->>Relay: Submits Credentials (Username/Password or PAT)
    Relay->>MM: Server-to-Server Verify (POST /api/v4/users/login)
    MM-->>Relay: User Authenticated (human-reviewer)
    Note over Relay: Sliding-Window Rate Limiter Enforced (5 max, 300s lockout)

    Human->>Relay: Clicks "Approve Resolution" + Justification Notes
    Relay->>Relay: Verify Operator Secret & Match Token Hash
    Relay->>DB: Update Conflict Status -> resolved
    Relay->>DB: Mark ConflictApprovalToken -> consumed
    Relay->>DB: Write conflict_resolution_audits (Immutable Provenance)
    Relay-->>Human: Adjudication Confirmed & Audit Sealed
```

---

## 9. Handover Dossier Structure

The Executive Handover Dossier compiles institutional memory into **9 structured chapters** without generic placeholders or hallucinated names:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       9-CHAPTER EXECUTIVE DOSSIER                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ Chapter 1: Organizational Overview & Current Operational State              │
│   • Synthesizes total records, entities, and active organizational streams. │
├─────────────────────────────────────────────────────────────────────────────┤
│ Chapter 2: Active Projects, Milestones & Timeline Delivery                  │
│   • Tracks Project Odyssey, Project Aegis, and Project Nova milestones.     │
├─────────────────────────────────────────────────────────────────────────────┤
│ Chapter 3: Responsibilities, Ownership Matrix & Governance Hierarchy        │
│   • Maps reporting lines and active stewardships across key personnel.      │
├─────────────────────────────────────────────────────────────────────────────┤
│ Chapter 4: Strategic Decisions & Superseded History                         │
│   • Chronicles ratified decisions alongside historical amendments.         │
├─────────────────────────────────────────────────────────────────────────────┤
│ Chapter 5: Pending Deliverables, Commitments & Upcoming Deadlines           │
│   • Audits time-sensitive operational commitments and vendor milestones.    │
├─────────────────────────────────────────────────────────────────────────────┤
│ Chapter 6: Open Discrepancies, Adjudication Queue & Ratified Matters        │
│   • Segregates open conflicts from human-adjudicated resolutions.           │
├─────────────────────────────────────────────────────────────────────────────┤
│ Chapter 7: Ownership Gaps, Missing Knowledge & Operational Hazards          │
│   • Highlights unassigned assets (Kubernetes cluster Alpha-9).              │
├─────────────────────────────────────────────────────────────────────────────┤
│ Chapter 8: Institutional Contacts, Stakeholders & System Dependencies       │
│   • Indexes key personnel (Elena Rostova, Dr. Aris Thorne, Priya Sharma).   │
├─────────────────────────────────────────────────────────────────────────────┤
│ Chapter 9: Grounding Source Document Archive & Citation Register            │
│   • Complete bibliographic register of deposited primary sources.           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Day 1 to Day 30 Operational Roadmap
Accompanying the dossier is a 4-phase chronological guide for the incoming leader:
1. **Days 1–7 (Immediate Orientation & Bilateral Briefing)**: Direct handover sessions between outgoing leader (`Marcus Vance`) and incoming successor (`Aman Kumar`). Review technical migration status with Elena Rostova.
2. **Days 8–14 (Discrepancy Adjudication & Infrastructure Stewardship)**: Formal assignment of `Kubernetes cluster Alpha-9` ownership. Two-phase human review on pending schedule conflicts.
3. **Days 15–21 (Stakeholder Alignment & Architecture Review)**: Review API Gateway to Service Mesh migration with Maya Lin. Align engineering units on postponed Feb 1, 2027 Project Aegis Beta.
4. **Days 22–30 (Operational Autonomy & Readiness Gate)**: Pre-flight verification for Project Nova security testing completion. Formal countersigning of the Executive Briefing Book.

---

## 10. Technology Stack

Verified against repository dependencies and runtime configurations:

```
┌─────────────────┬───────────────────────────────────────────────────────────┐
│ Layer           │ Technology & Version                                      │
├─────────────────┼───────────────────────────────────────────────────────────┤
│ Frontend        │ Next.js 15.1.0 (App Router), React 19.0.0,                │
│                 │ Tailwind CSS 3.4.17, Lucide Icons, Framer Motion          │
├─────────────────┼───────────────────────────────────────────────────────────┤
│ Backend API     │ Python 3.12, FastAPI 0.115+, Uvicorn 0.32+,               │
│                 │ Pydantic v2.10, Pydantic-Settings                         │
├─────────────────┼───────────────────────────────────────────────────────────┤
│ Database & ORM  │ SQLite 3 (WAL mode, Foreign Keys ON), SQLAlchemy 2.0,     │
│                 │ Alembic 1.14 database migrations                          │
├─────────────────┼───────────────────────────────────────────────────────────┤
│ AI & Grounding  │ Google GenAI SDK (google-genai 1.4+),                     │
│                 │ Gemini 2.5 Flash / Gemini 3.5 Flash, deterministic fallback│
├─────────────────┼───────────────────────────────────────────────────────────┤
│ MCP Protocol    │ FastMCP (Model Context Protocol) 1.2+                     │
│                 │ Stdio JSON-RPC transport with OpenCode runner             │
├─────────────────┼───────────────────────────────────────────────────────────┤
│ Collaboration   │ Switch Console 0.31, Mattermost Team Edition 11.9         │
├─────────────────┼───────────────────────────────────────────────────────────┤
│ Infrastructure  │ Docker Desktop, Docker Compose, Windows WSL2 compatibility│
└─────────────────┴───────────────────────────────────────────────────────────┘
```

---

## 11. Repository Structure

```text
Relay/
├── .env.example                     # Environment template with safe placeholders
├── .gitignore                       # Git exclusions (credentials, databases, caches)
├── docker-compose.yml               # Production container configuration
├── README.md                        # Primary platform documentation
│
├── backend/                         # FastAPI core backend
│   ├── .env.example                 # Backend-specific environment template
│   ├── Dockerfile                   # Python 3.12 container build definition
│   ├── requirements.txt             # Locked Python backend dependencies
│   ├── pytest.ini                   # Pytest test runner configuration
│   ├── relay.db                     # Live institutional SQLite database
│   │
│   ├── app/
│   │   ├── main.py                  # Application entrypoint & middleware
│   │   ├── api/
│   │   │   ├── continuity_api.py    # Handover, review, & approval endpoints
│   │   │   ├── documents.py         # Document deposit & text extraction
│   │   │   ├── endpoints.py         # Grounded Q&A endpoints
│   │   │   └── intelligence.py      # Conflict detection triggers
│   │   ├── core/
│   │   │   ├── config.py            # Pydantic BaseSettings & secrets
│   │   │   ├── database.py          # SQLAlchemy engine & SQLite pragmas
│   │   │   └── rate_limiter.py      # Sliding-window login rate limiter
│   │   ├── integrations/
│   │   │   ├── llm/
│   │   │   │   └── gemini_provider.py # Multimodal structured extraction
│   │   │   └── switch/
│   │   │       ├── approval_handler.py# Switch & Mattermost approval gateway
│   │   │       ├── mcp_server.py    # FastMCP server exposing 5 Relay tools
│   │   │       └── AGENTS.md        # AI agent instructions & governance
│   │   ├── models/
│   │   │   ├── continuity.py        # Conflicts, tokens, audits, dossiers
│   │   │   └── document.py         # Documents, segments, entities, facts
│   │   ├── schemas/
│   │   │   ├── continuity.py        # Dossier & approval Pydantic schemas
│   │   │   └── extraction.py        # Extraction & citation schemas
│   │   └── services/
│   │       ├── approval_service.py  # Two-phase token lifecycle
│   │       ├── dossier_service.py   # 9-chapter briefing book synthesis
│   │       ├── intelligence_analyzer.py # Contradiction & gap detection
│   │       ├── mattermost_auth.py   # Server-to-server Mattermost auth
│   │       └── qa_service.py        # Citation-grounded Q&A engine
│   └── tests/                       # Automated test suite (229 tests)
│
├── frontend/                        # Next.js Brutalist web application
│   ├── package.json                 # Node.js dependencies & scripts
│   ├── tsconfig.json                # TypeScript compiler configuration
│   ├── tailwind.config.ts           # Visual Brutalist design system tokens
│   └── src/
│       ├── app/
│       │   ├── page.tsx             # Public landing & architecture overview
│       │   └── app/
│       │       ├── page.tsx         # Executive Continuity Dashboard
│       │       ├── archive/         # Document Archive & Fact Inspector
│       │       ├── investigations/  # Conflict Adjudication Desk
│       │       ├── responsibilities/# Responsibility Matrix
│       │       ├── map/             # Knowledge Graph & Entity Visualizer
│       │       ├── agents/          # Agent Pipeline & Grounded Q&A Desk
│       │       └── handovers/       # 9-Chapter Dossier Viewer & Exports
│       ├── components/              # Brutalist UI components & badges
│       └── lib/
│           └── api.ts               # Typed frontend HTTP client
│
├── docs/
│   ├── handover-dossier-v1.json     # Real exported dossier in JSON format
│   ├── handover-dossier-v1.md       # Real exported dossier in Markdown format
│   └── screenshots/                 # Organized screenshot gallery (28 images)
│       └── README.md                # Screenshot catalog and visual walkthrough
│
└── scripts/
    ├── capture_all_screenshots.js   # Automated headless Chrome screenshot runner
    └── export_dossier.py            # Handover export generator
```

---

## 12. Installation & Local Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher (Node 22 LTS recommended)
- **Python**: v3.11 or v3.12
- **Docker**: Docker Desktop with Compose v2+
- **Git**: v2.30+

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-org/relay.git
cd Relay
```

### Step 2: Environment Configuration
Copy the template files and insert your API keys:
```bash
cp .env.example .env
cp backend/.env.example backend/.env
```
Edit `backend/.env` to include your Google Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
SWITCH_OPERATOR_SECRET=generate_a_random_32_character_secret
```

### Step 3: Start Services via Docker Compose
Run the containerized backend:
```bash
docker compose up -d --build
```
Verify the backend is healthy:
```bash
curl http://localhost:8000/health
# Returns: {"status":"ok","database":"connected","environment":"development","version":"0.1.0"}
```

### Step 4: Install and Run Frontend
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
The web dashboard is now accessible at `http://localhost:3000`.

---

## 13. Environment Variables

| Variable Name | Required | Default / Example | Purpose |
|:---|:---:|:---|:---|
| `ENVIRONMENT` | Yes | `development` | Application runtime environment |
| `DEBUG` | No | `True` | Enables SQL echoing and debug logging |
| `PORT` | No | `8000` | Backend API listener port |
| `DATABASE_URL` | Yes | `sqlite:///./relay.db` | SQLAlchemy connection string |
| `GEMINI_API_KEY` | Yes | `AQ...` | Google GenAI API key for structured extraction |
| `SWITCH_OPERATOR_SECRET` | Yes | `[cryptographic-secret]` | Required secret for human adjudication endpoints |
| `MATTERMOST_URL` | Yes | `http://127.0.0.1:52067` | Base URL of local Mattermost instance |
| `MATTERMOST_API_URL` | Yes | `http://127.0.0.1:52067/api/v4` | Mattermost REST API v4 endpoint |
| `RELAY_API_URL` | Yes | `http://127.0.0.1:8000` | Target URL used by FastMCP and frontend |

---

## 14. API & FastMCP Documentation

### Key REST API Endpoints

| Method | Route | Description | Auth / Security |
|:---|:---|:---|:---|
| `GET` | `/health` | Liveness & database connection probe | Public |
| `GET` | `/api/v1/continuity/overview` | Readiness score, open anomalies, & metrics | Public |
| `GET` | `/api/v1/conflicts` | Returns active, resolved, or all conflicts | Public |
| `POST` | `/api/v1/conflicts/{id}/request-resolution` | AI agent queues pending resolution | Public (Generates token) |
| `POST` | `/api/v1/conflicts/{id}/adjudicate` | Executes human adjudication | Requires Token + Operator Secret |
| `POST` | `/api/v1/intelligence/approvals/auth/login` | Server-to-server Mattermost auth | Rate-limited (5 attempts) |
| `GET` | `/api/v1/intelligence/approvals/review` | Interactive human review screen | Requires Request UUID |
| `GET` | `/api/v1/handovers` | Lists compiled handover dossiers | Public |
| `POST` | `/api/v1/handovers/generate` | Synthesizes 9-chapter briefing book | Public |
| `POST` | `/api/v1/qa/ask` | Evidence-grounded transition query | Public |

### FastMCP Tool Reference for Switch / OpenCode

Relay exposes **5 FastMCP tools** to autonomous agents via stdio JSON-RPC:

#### 1. `relay_deposit_document(title: str, text: str) -> str`
- **Purpose**: Ingests project charters, memos, or minutes into Relay. Runs deterministic segmentation, triggers Gemini structured extraction, links citations, and scans for conflicts.
- **Input**: Document title and raw text string.
- **Output**: JSON string containing document ID, extracted fact count, and new conflict alerts.

#### 2. `relay_ask_question(question: str) -> str`
- **Purpose**: Answers user questions strictly grounded in deposited institutional evidence.
- **Input**: Natural language inquiry string.
- **Output**: Synthesized answer with confidence score, verbatim quotations, and document segment citations.

#### 3. `relay_get_conflicts(status: str = "open", severity: Optional[str] = None) -> str`
- **Purpose**: Audits institutional contradictions and discrepancies across deposited records.
- **Input**: Status filter (`open`, `resolved`, `dismissed`) and optional severity.
- **Output**: Formatted list of conflict pairs with Statement A vs Statement B and source tags.

#### 4. `relay_request_conflict_resolution(conflict_id: str, proposed_status: str, resolution_notes: str, requesting_agent: str = "relay-test-agent") -> str`
- **Purpose**: Enforces Two-Phase Human Approval. Creates a cryptographically secured pending approval request and returns a human review URL.
- **Input**: Target conflict UUID, proposed resolution state, and justification notes.
- **Output**: Request ID, token expiration timestamp, and human review URL.

#### 5. `relay_resolve_conflict(conflict_id: str, resolution_notes: str, approval_token: str) -> str`
- **Purpose**: Finalizes conflict adjudication. Strictly requires a valid one-time token issued through the human review process.
- **Restriction**: Direct calls with fake tokens or string names are strictly rejected by the security boundary.

---

## 15. Testing & Quality Assurance

Relay enforces strict test-driven quality assurance across all layers.

### Test Execution Commands
```bash
# Backend Automated Test Suite (Pytest)
pytest backend/tests

# Frontend TypeScript Typecheck
cd frontend && npx tsc --noEmit

# Frontend Optimized Production Build
cd frontend && npm run build
```

### Verified QA Audit Results (November 7, 2026)
```text
============================= test session starts =============================
platform win32 -- Python 3.14.7, pytest-8.4.2, pluggy-1.7.0
rootdir: C:\Users\Aman\Desktop\Relay\backend
configfile: pytest.ini
collected 231 items / 2 deselected / 229 selected

backend\tests\test_api.py ................................... [ 100% ]
backend\tests\test_conflict_detection.py .................... [ 100% ]
backend\tests\test_continuity_intelligence.py .............. [ 100% ]
backend\tests\test_documents.py ............................ [ 100% ]
backend\tests\test_extraction_pipeline.py .................. [ 100% ]
backend\tests\test_extraction_runs.py ...................... [ 100% ]
backend\tests\test_extraction_schemas.py ................... [ 100% ]
backend\tests\test_grounding.py ............................ [ 100% ]
backend\tests\test_handovers.py ............................ [ 100% ]
backend\tests\test_knowledge_models.py ..................... [ 100% ]
backend\tests\test_llm_provider.py ......................... [ 100% ]
backend\tests\test_persistence.py .......................... [ 100% ]
backend\tests\test_qa_grounding.py ......................... [ 100% ]
backend\tests\test_relay_mcp.py ............................ [ 100% ]
backend\tests\test_segmentation.py ......................... [ 100% ]
backend\tests\test_two_phase_approval.py ................... [ 100% ]

================ 229 passed, 2 deselected, 1 warning in 17.62s ================
```
- **Backend Test Suite**: **229 passed, 0 failed** in 17.62s.
- **Frontend TypeScript**: **0 errors**.
- **Next.js Production Build**: **17/17 routes successfully prerendered as static content**.

---

## 16. Screenshots & Product Walkthrough

### 1. Ingestion & Document Archive
Deposit institutional records, review extracted facts, and inspect character-exact citations.

| Document Archive Index | Extracted Evidence & Citations |
|:---:|:---:|
| ![Archive Index](docs/screenshots/02-ingestion/01-document-archive-index.png) | ![Evidence Inspector](docs/screenshots/02-ingestion/02-document-extracted-evidence.png) |

### 2. Discrepancy & Contradiction Intelligence
Cross-examine contradictory dates, historical superseded decisions, and unassigned infrastructure assets.

| Direct Contradiction Comparison | Unassigned Ownership Gap |
|:---:|:---:|
| ![Contradiction](docs/screenshots/03-intelligence/02-direct-contradiction-comparison.png) | ![Ownership Gap](docs/screenshots/03-intelligence/04-ownership-gap-detection.png) |

### 3. Two-Phase Human Approval & Review Desk
AI agents request resolution; human reviewers authenticate with Mattermost to ratify decisions.

| Human Review Screen | Mattermost Reviewer Login |
|:---:|:---:|
| ![Human Review](docs/screenshots/07-human-approval/01-human-approval-review-screen.png) | ![Mattermost Auth](docs/screenshots/07-human-approval/02-mattermost-auth-interface.png) |

### 4. Executive Handover Dossier & 30-Day Roadmap
Synthesize 9-chapter briefing books and phased roadmaps for incoming leaders.

| 9-Chapter Navigation (Projects) | 30-Day Operational Roadmap |
|:---:|:---:|
| ![Chapter 2 Projects](docs/screenshots/08-handover/03-representative-chapter-projects.png) | ![Roadmap](docs/screenshots/08-handover/06-day-1-to-30-roadmap.png) |

### 5. Grounded Q&A Desk & Boundary Enforcement
Query institutional knowledge with strict evidence citations; unsupported queries trigger honest refusals.

| Evidence-Backed Answer (81%) | Insufficient Evidence Refusal |
|:---:|:---:|
| ![Grounded Answer](docs/screenshots/09-grounded-qa/01-grounded-qa-sufficient-evidence.png) | ![Insufficient Refusal](docs/screenshots/09-grounded-qa/02-grounded-qa-insufficient-evidence.png) |

---

## 17. Security & Data Integrity

- **Anti-Impersonation Boundary**: AI agents cannot pass `authorized_by` or resolve conflicts directly. The system enforces cryptographic separation between agent inquiry and human adjudication.
- **Single-Use Approval Tokens**: Approval tokens (`ConflictApprovalToken`) are 32-byte cryptographically random hex strings with 24-hour expiration. Once consumed or rejected, they cannot be replayed.
- **Zero Token & Password Leakage**: Passwords and session tokens are validated server-to-server and never returned in API response bodies, logged to disk, or exposed in URLs.
- **Brute-Force Protection**: Sliding-window rate limiting locks out IPs or usernames after 5 failed login attempts for 300 seconds (`HTTP 429 Too Many Requests`).
- **Immutable Provenance**: Every conflict modification writes to `conflict_resolution_audits` with approver identity, auth type, resolution notes, and token hash.

---

## 18. Limitations & Future Roadmap

### Honest Current Limitations
1. **SQLite Storage Concurrency**: The current implementation utilizes SQLite with Write-Ahead Logging (WAL). While highly performant for hundreds of documents and single-organization transitions, enterprise multi-tenant deployments require PostgreSQL.
2. **Synchronous LLM Extraction**: Extracting 50+ page PDF documents synchronously may encounter HTTP timeout limits. Asynchronous Celery/Redis background task queues are planned.
3. **Local Mattermost Instance**: The current authentication service targets a local containerized Mattermost instance (`:52067`). Production deployments should configure OAuth 2.0 PKCE flow.

### Future Enhancements
- **pgvector Vector Concordance**: Hybrid dense-sparse retrieval combining BM25 keyword matching with vector embeddings.
- **Real-Time WebSocket Conflict Feeds**: Pushing immediate contradiction alerts into Mattermost and Switch channels when new documents are deposited.
- **Automated Audio Meeting Grounding**: Ingesting recorded transition handover meetings and transcribing spoken commitments into verifiable citations.

---

## 19. Contribution & License

### Contribution Workflow
1. Fork the repository.
2. Create an isolated feature branch (`git checkout -b feature/governance-enhancement`).
3. Ensure all tests pass (`pytest backend/tests` and `npm run build`).
4. Submit a descriptive Pull Request referencing the verified acceptance criteria.

### License
This project is currently distributed as an open-source evaluation and hackathon submission. Standard open-source licensing (MIT License) will be formalized upon public release. All rights reserved by the original contributors.

---

## 20. Closing Summary

Modern organizations suffer not from a lack of information, but from a **lack of verifiable truth**. When leaders transition, institutional knowledge dissolves into fragmented inboxes, unlinked cloud drives, and undocumented assumptions.

**Relay changes this paradigm.** By enforcing cryptographic citation grounding, continuously cross-examining documents for contradictions, protecting truth behind authenticated human approval, and automatically compiling evidence-backed handover dossiers, Relay ensures that organizations remember what they know.

*Built for hackathons, engineered for institutional truth.*
