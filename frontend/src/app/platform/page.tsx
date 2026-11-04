"use client";

import React from "react";
import Link from "next/link";
import { PublicNav } from "@/components/public/PublicNav";
import { PublicFooter } from "@/components/public/PublicFooter";
import { Button } from "@/components/ui/Button";
import { EvidenceBadge } from "@/components/evidence/EvidenceBadge";
import {
  IconDatabase,
  IconShield,
  IconDocument,
  IconArrowRight,
  IconCheck,
  IconFileText,
  IconTerminal,
} from "@/components/ui/Icons";

export default function PlatformPage() {
  return (
    <div className="min-h-screen flex flex-col bg-raw-paper text-carbon selection:bg-signal-orange selection:text-raw-paper font-sans">
      <PublicNav />

      <main className="flex-1">
        {/* Header Masthead */}
        <section className="border-b-2 border-carbon pt-16 pb-14 px-4 sm:px-6 bg-raw-paper-light">
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-carbon text-raw-paper font-mono text-[10px] uppercase tracking-widest border border-carbon">
              // ARCHITECTURAL SPECIFICATION
            </div>
            <h1 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-carbon">
              An analytical engine for institutional memory
            </h1>
            <p className="text-sm sm:text-base text-carbon/80 leading-relaxed max-w-2xl font-sans">
              Relay combines deterministic document extraction, multi-agent cross-examination, and direct cryptographic provenance to guarantee that no organizational transition occurs in the dark.
            </p>
          </div>
        </section>

        {/* Pillar 01: Ingestion & Document Intelligence */}
        <section className="py-16 px-4 sm:px-6 border-b-2 border-carbon bg-raw-paper">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="space-y-1">
              <span className="font-mono text-xs uppercase font-bold text-signal-orange">
                PILLAR 01 // EXTRACTION
              </span>
              <h2 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-carbon">
                Ingestion & Document Intelligence
              </h2>
              <p className="text-xs sm:text-sm text-carbon/70 max-w-xl">
                Relay ingests organizational records without altering their underlying structure, establishing a permanent, searchable institutional knowledge repository.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 border-2 border-carbon bg-raw-paper-light space-y-3 shadow-brutal">
                <IconDocument size={20} className="text-signal-orange" />
                <h3 className="font-display font-bold text-sm uppercase text-carbon">
                  Multi-Format Parsing
                </h3>
                <p className="text-xs text-carbon/80 leading-relaxed font-sans">
                  Support for PDF, DOCX, and TXT records including board charters, vendor master agreements, compliance filings, and meeting minutes up to 25MB per file.
                </p>
              </div>

              <div className="p-5 border-2 border-carbon bg-raw-paper-light space-y-3 shadow-brutal">
                <IconFileText size={20} className="text-signal-orange" />
                <h3 className="font-display font-bold text-sm uppercase text-carbon">
                  Verbatim Character Offsets
                </h3>
                <p className="text-xs text-carbon/80 leading-relaxed font-sans">
                  Every extracted fact retains its exact document page, section, paragraph, and character offset so humans can verify claims directly against primary records.
                </p>
              </div>

              <div className="p-5 border-2 border-carbon bg-raw-paper-light space-y-3 shadow-brutal">
                <IconDatabase size={20} className="text-signal-orange" />
                <h3 className="font-display font-bold text-sm uppercase text-carbon">
                  Deterministic Entity Triples
                </h3>
                <p className="text-xs text-carbon/80 leading-relaxed font-sans">
                  Extracts Subject-Predicate-Object triples representing people, roles, financial authorities, reporting lines, and contract milestones.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pillar 02: The Multi-Agent Pipeline */}
        <section className="py-16 px-4 sm:px-6 border-b-2 border-carbon bg-concrete/30">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="space-y-1">
              <span className="font-mono text-xs uppercase font-bold text-signal-orange">
                PILLAR 02 // MULTI-AGENT
              </span>
              <h2 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-carbon">
                Four Specialized Collaborative Agents
              </h2>
              <p className="text-xs sm:text-sm text-carbon/70 max-w-xl">
                Rather than relying on an unconstrained conversational assistant, Relay organizes transition intelligence across four distinct agents with isolated inputs and deterministic outputs.
              </p>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-4 bg-raw-paper border-2 border-carbon flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-carbon">agent.extractor.v1</span>
                    <span className="px-1.5 py-0.2 bg-carbon text-raw-paper font-bold text-[10px]">STAGE 01</span>
                  </div>
                  <h3 className="font-display font-bold text-base uppercase text-carbon">Knowledge Extractor</h3>
                  <p className="text-xs text-carbon/70 font-sans max-w-xl">
                    Parses unstructured documents into structured entity graphs, timeline milestones, and monetary commitments.
                  </p>
                </div>
                <div className="text-right shrink-0 text-carbon/60">
                  Model: Gemini 3.8 Flash
                </div>
              </div>

              <div className="p-4 bg-raw-paper border-2 border-carbon flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-carbon">agent.detective.v1</span>
                    <span className="px-1.5 py-0.2 bg-signal-orange text-raw-paper font-bold text-[10px]">STAGE 02</span>
                  </div>
                  <h3 className="font-display font-bold text-base uppercase text-carbon">Gap Detective</h3>
                  <p className="text-xs text-carbon/70 font-sans max-w-xl">
                    Performs adversarial consistency checks across documents to surface policy contradictions, unassigned responsibilities, and missing attachments.
                  </p>
                </div>
                <div className="text-right shrink-0 text-carbon/60">
                  Model: Gemini 3.8 Pro
                </div>
              </div>

              <div className="p-4 bg-raw-paper border-2 border-carbon flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-carbon">agent.analyst.v1</span>
                    <span className="px-1.5 py-0.2 bg-carbon text-raw-paper font-bold text-[10px]">STAGE 03</span>
                  </div>
                  <h3 className="font-display font-bold text-base uppercase text-carbon">Continuity Analyst</h3>
                  <p className="text-xs text-carbon/70 font-sans max-w-xl">
                    Constructs directed dependency trees, mapping predecessor blockers, authority delegation vectors, and upcoming compliance renewals.
                  </p>
                </div>
                <div className="text-right shrink-0 text-carbon/60">
                  Model: Gemini 3.8 Flash
                </div>
              </div>

              <div className="p-4 bg-raw-paper border-2 border-carbon flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-carbon">agent.architect.v1</span>
                    <span className="px-1.5 py-0.2 bg-industrial-green text-raw-paper font-bold text-[10px]">STAGE 04</span>
                  </div>
                  <h3 className="font-display font-bold text-base uppercase text-carbon">Handover Architect</h3>
                  <p className="text-xs text-carbon/70 font-sans max-w-xl">
                    Synthesizes verified facts, resolved anomalies, and critical path items into an executive-ready handover dossier.
                  </p>
                </div>
                <div className="text-right shrink-0 text-carbon/60">
                  Model: Gemini 3.8 Pro
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pillar 03: Evidence Taxonomy */}
        <section className="py-16 px-4 sm:px-6 border-b-2 border-carbon bg-raw-paper">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="space-y-1">
              <span className="font-mono text-xs uppercase font-bold text-signal-orange">
                PILLAR 03 // TAXONOMY
              </span>
              <h2 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-carbon">
                The 6-Tier Evidence Classification Model
              </h2>
              <p className="text-xs sm:text-sm text-carbon/70 max-w-xl">
                Relay enforces a rigorous taxonomy for all organizational assertions. Successors never confuse a verified contractual fact with an unvalidated AI inference.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border-2 border-carbon bg-raw-paper-light space-y-2">
                <EvidenceBadge status="evidence-backed" />
                <p className="text-xs text-carbon/80 font-sans mt-2 leading-relaxed">
                  Directly substantiated by verifiable primary text citations in deposited documents with page and line references.
                </p>
              </div>

              <div className="p-4 border-2 border-carbon bg-raw-paper-light space-y-2">
                <EvidenceBadge status="human-verified" />
                <p className="text-xs text-carbon/80 font-sans mt-2 leading-relaxed">
                  Explicitly confirmed and signed off by an authorized human administrator or departing department lead.
                </p>
              </div>

              <div className="p-4 border-2 border-carbon bg-raw-paper-light space-y-2">
                <EvidenceBadge status="inferred" />
                <p className="text-xs text-carbon/80 font-sans mt-2 leading-relaxed">
                  Derived logically from adjacent context or patterns, but lacking an explicit, unequivocal primary citation.
                </p>
              </div>

              <div className="p-4 border-2 border-carbon bg-raw-paper-light space-y-2">
                <EvidenceBadge status="missing" />
                <p className="text-xs text-carbon/80 font-sans mt-2 leading-relaxed">
                  Referenced in other records (e.g. &ldquo;See Schedule B&rdquo;) but absent from the institutional archive.
                </p>
              </div>

              <div className="p-4 border-2 border-carbon bg-raw-paper-light space-y-2">
                <EvidenceBadge status="conflicting" />
                <p className="text-xs text-carbon/80 font-sans mt-2 leading-relaxed">
                  Two or more authoritative records make contradictory assertions (e.g. differing budget totals or conflicting sign-off owners).
                </p>
              </div>

              <div className="p-4 border-2 border-carbon bg-raw-paper-light space-y-2">
                <EvidenceBadge status="pending-review" />
                <p className="text-xs text-carbon/80 font-sans mt-2 leading-relaxed">
                  Surfaced during automated pipeline processing and awaiting human adjudication at the Switch review desk.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 sm:px-6 bg-carbon text-raw-paper text-center">
          <div className="max-w-xl mx-auto space-y-4">
            <h2 className="font-display font-black text-2xl sm:text-4xl uppercase tracking-tight text-raw-paper">
              Experience Relay in action
            </h2>
            <p className="text-xs sm:text-sm text-raw-paper/70 font-sans">
              Open the live Acme BioSystems transition workspace and inspect real cross-examination results.
            </p>
            <div className="pt-2">
              <Link href="/app">
                <Button variant="signal" size="md">
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
