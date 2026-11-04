"use client";

import React from "react";
import Link from "next/link";
import { PublicNav } from "@/components/public/PublicNav";
import { PublicFooter } from "@/components/public/PublicFooter";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { EvidenceBadge } from "@/components/evidence/EvidenceBadge";
import {
  IconDatabase,
  IconShield,
  IconBrain,
  IconNetwork,
  IconDocument,
  IconArrowRight,
  IconCheck,
  IconFileText,
  IconAlert,
  IconTerminal,
} from "@/components/ui/Icons";

export default function PlatformPage() {
  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink selection:bg-copper-light selection:text-ink">
      <PublicNav />

      <main className="flex-1">
        {/* Header */}
        <section className="border-b border-rule pt-16 pb-14 px-4 sm:px-6 bg-paper-surface">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-paper border border-rule rounded-sm text-[11px] font-sans uppercase tracking-widest text-ink-secondary">
              Platform Architecture & Capabilities
            </div>
            <h1 className="font-serif italic text-3xl sm:text-5xl font-bold text-ink tracking-tight">
              An analytical engine for institutional memory
            </h1>
            <p className="text-sm sm:text-base text-ink-secondary leading-relaxed max-w-2xl font-light">
              Relay combines deterministic document extraction, multi-agent cross-examination, and direct cryptographic provenance to guarantee that no organizational transition occurs in the dark.
            </p>
          </div>
        </section>

        {/* Section 1: Ingestion & Document Intelligence */}
        <section className="py-16 px-4 sm:px-6 border-b border-rule">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="space-y-2">
              <span className="text-[11px] font-sans uppercase tracking-widest text-copper font-medium">
                Pillar 01
              </span>
              <h2 className="font-serif italic text-2xl sm:text-3xl font-bold text-ink">
                Ingestion & Document Intelligence
              </h2>
              <p className="text-xs sm:text-sm text-ink-secondary max-w-2xl">
                Relay ingests organizational documents without altering their underlying structure, establishing a permanent, searchable institutional knowledge repository.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-5 bg-paper-surface space-y-3">
                <IconDocument className="w-5 h-5 text-olive" />
                <h3 className="font-serif font-bold text-sm text-ink">
                  Multi-Format Parsing
                </h3>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Support for PDF, DOCX, and TXT records including board charters, vendor master agreements, compliance filings, and meeting records up to 25MB per record.
                </p>
              </Card>

              <Card className="p-5 bg-paper-surface space-y-3">
                <IconFileText className="w-5 h-5 text-copper" />
                <h3 className="font-serif font-bold text-sm text-ink">
                  Verbatim Character Offsets
                </h3>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Every extracted fact retains its exact document page, section, paragraph, and character offset so humans can verify claims directly against primary records.
                </p>
              </Card>

              <Card className="p-5 bg-paper-surface space-y-3">
                <IconDatabase className="w-5 h-5 text-ink" />
                <h3 className="font-serif font-bold text-sm text-ink">
                  Deterministic Entity Triples
                </h3>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Extracts Subject-Predicate-Object triples representing people, roles, financial authorities, reporting lines, and contract milestones.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 2: The Multi-Agent Pipeline */}
        <section className="py-16 px-4 sm:px-6 border-b border-rule bg-paper-secondary/30">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="space-y-2">
              <span className="text-[11px] font-sans uppercase tracking-widest text-olive font-medium">
                Pillar 02
              </span>
              <h2 className="font-serif italic text-2xl sm:text-3xl font-bold text-ink">
                Four Specialized Collaborative Agents
              </h2>
              <p className="text-xs sm:text-sm text-ink-secondary max-w-2xl">
                Rather than relying on an unconstrained conversational assistant, Relay organizes transition intelligence across four distinct agents with isolated inputs and deterministic outputs.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-5 bg-paper border border-rule rounded-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-ink">agent.extractor.v1</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-sm bg-olive-light text-olive font-mono">Stage 1</span>
                  </div>
                  <h3 className="font-serif font-bold text-base text-ink">Knowledge Extractor</h3>
                  <p className="text-xs text-ink-secondary max-w-xl">
                    Parses unstructured documents into structured entity graphs, timeline milestones, and monetary commitments.
                  </p>
                </div>
                <div className="text-xs font-mono text-ink-secondary text-right shrink-0">
                  Model: Gemini 3.8 Flash
                </div>
              </div>

              <div className="p-5 bg-paper border border-rule rounded-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-ink">agent.detective.v1</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-sm bg-copper-light text-copper font-mono">Stage 2</span>
                  </div>
                  <h3 className="font-serif font-bold text-base text-ink">Continuity Detective</h3>
                  <p className="text-xs text-ink-secondary max-w-xl">
                    Performs adversarial consistency checks across documents to surface policy contradictions, unassigned responsibilities, and missing attachments.
                  </p>
                </div>
                <div className="text-xs font-mono text-ink-secondary text-right shrink-0">
                  Model: Gemini 3.8 Pro
                </div>
              </div>

              <div className="p-5 bg-paper border border-rule rounded-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-ink">agent.analyst.v1</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-sm bg-paper-secondary text-ink font-mono">Stage 3</span>
                  </div>
                  <h3 className="font-serif font-bold text-base text-ink">Responsibility Analyst</h3>
                  <p className="text-xs text-ink-secondary max-w-xl">
                    Constructs directed dependency trees, mapping predecessor blockers, authority delegation vectors, and upcoming compliance renewals.
                  </p>
                </div>
                <div className="text-xs font-mono text-ink-secondary text-right shrink-0">
                  Model: Gemini 3.8 Flash
                </div>
              </div>

              <div className="p-5 bg-paper border border-rule rounded-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-ink">agent.architect.v1</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-sm bg-olive-light text-olive font-mono">Stage 4</span>
                  </div>
                  <h3 className="font-serif font-bold text-base text-ink">Dossier Architect</h3>
                  <p className="text-xs text-ink-secondary max-w-xl">
                    Synthesizes verified facts, resolved anomalies, and critical path items into an executive-ready handover dossier.
                  </p>
                </div>
                <div className="text-xs font-mono text-ink-secondary text-right shrink-0">
                  Model: Gemini 3.8 Pro
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Evidence Classification Taxonomy */}
        <section className="py-16 px-4 sm:px-6 border-b border-rule">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="space-y-2">
              <span className="text-[11px] font-sans uppercase tracking-widest text-copper font-medium">
                Pillar 03
              </span>
              <h2 className="font-serif italic text-2xl sm:text-3xl font-bold text-ink">
                The 6-Tier Evidence Classification Model
              </h2>
              <p className="text-xs sm:text-sm text-ink-secondary max-w-2xl">
                Relay enforces a rigorous taxonomy for all organizational assertions. Successors never confuse a verified contractual fact with an unvalidated AI inference.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-paper-surface border border-rule rounded-sm space-y-2">
                <EvidenceBadge status="evidence-backed" />
                <p className="text-xs text-ink-secondary mt-2 leading-relaxed">
                  Directly substantiated by verifiable primary text citations in deposited documents with page and line references.
                </p>
              </div>

              <div className="p-4 bg-paper-surface border border-rule rounded-sm space-y-2">
                <EvidenceBadge status="human-verified" />
                <p className="text-xs text-ink-secondary mt-2 leading-relaxed">
                  Explicitly confirmed and signed off by an authorized human administrator or departing department lead.
                </p>
              </div>

              <div className="p-4 bg-paper-surface border border-rule rounded-sm space-y-2">
                <EvidenceBadge status="inferred" />
                <p className="text-xs text-ink-secondary mt-2 leading-relaxed">
                  Derived logically from adjacent context or patterns, but lacking an explicit, unequivocal primary citation.
                </p>
              </div>

              <div className="p-4 bg-paper-surface border border-rule rounded-sm space-y-2">
                <EvidenceBadge status="missing" />
                <p className="text-xs text-ink-secondary mt-2 leading-relaxed">
                  Referenced in other records (e.g. &ldquo;See Schedule B&rdquo;) but absent from the institutional archive.
                </p>
              </div>

              <div className="p-4 bg-paper-surface border border-rule rounded-sm space-y-2">
                <EvidenceBadge status="conflicting" />
                <p className="text-xs text-ink-secondary mt-2 leading-relaxed">
                  Two or more authoritative records make contradictory assertions (e.g. differing budget totals or conflicting sign-off owners).
                </p>
              </div>

              <div className="p-4 bg-paper-surface border border-rule rounded-sm space-y-2">
                <EvidenceBadge status="pending-review" />
                <p className="text-xs text-ink-secondary mt-2 leading-relaxed">
                  Surfaced during automated pipeline processing and awaiting human adjudication at the Switch review desk.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Local-First Engineering & Docker Isolation */}
        <section className="py-16 px-4 sm:px-6 border-b border-rule bg-paper-surface">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="space-y-2">
              <span className="text-[11px] font-sans uppercase tracking-widest text-olive font-medium">
                Pillar 04
              </span>
              <h2 className="font-serif italic text-2xl sm:text-3xl font-bold text-ink">
                Local-First Infrastructure & Security
              </h2>
              <p className="text-xs sm:text-sm text-ink-secondary max-w-2xl">
                Relay was engineered from the first commit to run within your isolated perimeter. Sensitive organizational files never leave your control.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-5 bg-paper space-y-3">
                <div className="flex items-center gap-2">
                  <IconTerminal className="w-4 h-4 text-copper" />
                  <h3 className="font-serif font-bold text-sm text-ink">
                    Python 3.12 + FastAPI + SQLite Engine
                  </h3>
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Relay executes within a hardened Python 3.12 slim Docker container with native SQLite WAL mode and connection-level foreign key enforcement. Storage is bound directly to persistent local volumes.
                </p>
                <div className="p-2.5 bg-paper-secondary border border-rule rounded-xs font-mono text-[11px] text-ink">
                  docker compose up --build backend
                </div>
              </Card>

              <Card className="p-5 bg-paper space-y-3">
                <div className="flex items-center gap-2">
                  <IconShield className="w-4 h-4 text-olive" />
                  <h3 className="font-serif font-bold text-sm text-ink">
                    Air-Gapped & Offline Ready
                  </h3>
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  No telemetry, no tracking cookies, and no third-party cloud analytics. Document extraction and vector generation can be pointed directly at your on-premise inference endpoints or local models.
                </p>
                <div className="p-2.5 bg-paper-secondary border border-rule rounded-xs font-mono text-[11px] text-ink">
                  DATA_RESIDENCY=LOCAL_MOUNT_ONLY
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 px-4 sm:px-6 text-center">
          <div className="max-w-xl mx-auto space-y-4">
            <h2 className="font-serif italic text-2xl sm:text-3xl font-bold text-ink">
              Experience Relay in action
            </h2>
            <p className="text-xs sm:text-sm text-ink-secondary">
              Open the live Acme BioSystems transition workspace and inspect real cross-examination results.
            </p>
            <div className="pt-2">
              <Link href="/app">
                <Button variant="primary" size="md">
                  Enter Organizational Workspace
                  <IconArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

