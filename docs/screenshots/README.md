# Relay — Visual Documentation & Screenshot Index

This directory maintains the visual verification archive and user experience tour for the **Relay Evidence-Grounded Organizational Continuity Platform**. All screenshots depict the live, running system operating against authenticated local services (Relay FastAPI Backend `:8000`, Switch Console & Agent `:52066`, Mattermost Team Edition `:52067`, and Next.js Brutalist Frontend `:3000`).

---

## Directory Organization

```
docs/screenshots/
├── 01-dashboard/
│   ├── 01-dashboard-overview.png
│   └── 02-knowledge-metrics-breakdown.png
├── 02-ingestion/
│   ├── 01-document-archive-index.png
│   ├── 02-document-extracted-evidence.png
│   └── 03-document-upload-modal.png
├── 03-intelligence/
│   ├── 01-conflict-detection-overview.png
│   ├── 02-direct-contradiction-comparison.png
│   ├── 03-superseded-decision-tracking.png
│   └── 04-ownership-gap-detection.png
├── 04-investigations/
│   ├── 01-investigations-workspace.png
│   └── 02-conflict-evidence-citations.png
├── 05-responsibilities/
│   ├── 01-responsibility-matrix.png
│   └── 02-continuity-knowledge-map.png
├── 06-agent-integration/
│   ├── 01-agent-pipeline-stages.png
│   └── 02-switch-orchestration-desk.png
├── 07-human-approval/
│   ├── 01-human-approval-review-screen.png
│   └── 02-mattermost-auth-interface.png
├── 08-handover/
│   ├── 01-handover-dossier-overview.png
│   ├── 02-nine-chapter-navigation.png
│   ├── 03-representative-chapter-projects.png
│   ├── 04-discrepancies-and-conflicts-chapter.png
│   ├── 05-unassigned-assets-chapter.png
│   └── 06-day-1-to-30-roadmap.png
├── 09-grounded-qa/
│   ├── 01-grounded-qa-sufficient-evidence.png
│   └── 02-grounded-qa-insufficient-evidence.png
└── 10-exports/
    ├── 01-print-ready-dossier-view.png
    ├── 02-dossier-compilation-parameters.png
    └── 03-markdown-json-export-options.png
```

---

## Category Walkthrough & Verifications

### 01. Dashboard (`01-dashboard/`)
Demonstrates the high-level operational telemetry of organizational transition health.
- **`01-dashboard-overview.png`**: High-level telemetry showing readiness score (34%), 10 deposited documents, 15 indexed entities, and 6 open conflict anomalies awaiting human review.
- **`02-knowledge-metrics-breakdown.png`**: Extended view displaying critical unresolved discrepancies, active obligations, and immediate schedule blockers.

### 02. Ingestion & Archive (`02-ingestion/`)
Demonstrates document intake, parsing, and structured fact extraction.
- **`01-document-archive-index.png`**: The primary institutional repository index showing 10 ingested records (project launch plans, schedule amendments, charters, and status memos).
- **`02-document-extracted-evidence.png`**: Detail inspector for a deposited record showing character-offset segments, parsed entity triples, and verified fact claims.
- **`03-document-upload-modal.png`**: Brutalist drag-and-drop document deposit modal supporting PDF, TXT, and DOCX files.

### 03. Intelligence & Conflicts (`03-intelligence/`)
Demonstrates Relay's continuous intelligence analyzer identifying institutional discrepancies.
- **`01-conflict-detection-overview.png`**: Full conflict desk displaying all 6 active anomalies categorized by severity (Critical, High, Medium).
- **`02-direct-contradiction-comparison.png`**: Case BIO-02 showing side-by-side statement comparison for Project Odyssey Beta Release (Nov 15, 2026 vs Dec 20, 2026) with verbatim quotes.
- **`03-superseded-decision-tracking.png`**: Case BIO-01 showing historical amendment tracking where Project Odyssey deployment roadmap amendment officially supersedes the predecessor decision.
- **`04-ownership-gap-detection.png`**: Case BIO-06 highlighting unassigned organizational asset `Kubernetes cluster Alpha-9`, flagging it as an active operational hazard.

### 04. Investigations Workspace (`04-investigations/`)
Demonstrates deep cross-examination of institutional evidence.
- **`01-investigations-workspace.png`**: The complete audit desk interface showing case logs, status filters (ALL, OPEN, RESOLVED), and risk vector summaries.
- **`02-conflict-evidence-citations.png`**: High-resolution zoom on source document tags, paragraph locations, and exact verbatim citation quotes.

### 05. Responsibilities & Knowledge Map (`05-responsibilities/`)
Demonstrates governance obligations and relational structure.
- **`01-responsibility-matrix.png`**: The active obligation and delegation ledger tracking tasks, assigned leaders, incoming delegates, and originating decisions.
- **`02-continuity-knowledge-map.png`**: Interactive entity-relationship knowledge graph linking people, documents, decisions, and system assets.

### 06. Agent Integration (`06-agent-integration/`)
Demonstrates Relay's orchestration pipeline and integration with Switch Console.
- **`01-agent-pipeline-stages.png`**: The 4 specialized agent pipeline stages (Knowledge Extractor, Gap Detective, Continuity Analyst, Handover Architect).
- **`02-switch-orchestration-desk.png`**: Orchestration bus status, governance gates, and SQLite WAL storage telemetry.

### 07. Human Approval & Authentication (`07-human-approval/`)
Demonstrates the secure two-phase human approval workflow and reviewer identity verification.
- **`01-human-approval-review-screen.png`**: Human review screen rendered at `/api/v1/intelligence/approvals/review` showing Fact A vs Fact B, verbatim quotations, and the AI agent's proposed resolution note.
- **`02-mattermost-auth-interface.png`**: Mattermost authentication tab allowing human reviewers to authenticate server-to-server with credentials or Personal Access Tokens (PATs) with zero token exposure.

### 08. Handover Dossier (`08-handover/`)
Demonstrates the complete 9-chapter executive transition dossier.
- **`01-handover-dossier-overview.png`**: Dossier header showing outgoing authority (Marcus Vance), incoming successor (Aman Kumar), versioning (v1), and transition scope.
- **`02-nine-chapter-navigation.png`**: Tabbed navigation across all 9 chapters with Chapter 1 (Operational State) overview.
- **`03-representative-chapter-projects.png`**: Chapter 2 detailing active projects, delivery milestones, and timeline facts.
- **`04-discrepancies-and-conflicts-chapter.png`**: Chapter 6 segregating open discrepancies, ratified resolutions, and archived duplicates.
- **`05-unassigned-assets-chapter.png`**: Chapter 7 detailing ownership gaps and operational hazards, featuring `Kubernetes cluster Alpha-9`.
- **`06-day-1-to-30-roadmap.png`**: Chronological 4-phase, 12-action operational roadmap for incoming leadership.

### 09. Grounded Q&A Desk (`09-grounded-qa/`)
Demonstrates zero-hallucination evidence retrieval and honest boundary refusal.
- **`01-grounded-qa-sufficient-evidence.png`**: Query *"Who owns Kubernetes cluster Alpha-9?"* returning an `EVIDENCE BACKED (81%)` answer with 4 verbatim citations and highlighting the ownership gap.
- **`02-grounded-qa-insufficient-evidence.png`**: Unsupported query *"What is the operational budget of Project Pluto on Neptune?"* returning a strict `INSUFFICIENT EVIDENCE` refusal with 0 hallucinations.

### 10. Exports & Compilation (`10-exports/`)
Demonstrates multi-format output and compilation controls.
- **`01-print-ready-dossier-view.png`**: Clean, print-optimized stylesheet layout for executive briefing book generation.
- **`02-dossier-compilation-parameters.png`**: Modal dialog for customizing transition scope, roles, and compilation parameters.
- **`03-markdown-json-export-options.png`**: One-click export controls for downloading structured JSON (`docs/handover-dossier-v1.json`) and complete Markdown (`docs/handover-dossier-v1.md`).

