"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { PublicNav } from "@/components/public/PublicNav";
import { PublicFooter } from "@/components/public/PublicFooter";
import { Button } from "@/components/ui/Button";
import { IndustrialCursor } from "@/components/ui/IndustrialCursor";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import {
  IconArrowRight,
  IconCheck,
} from "@/components/ui/Icons";

interface MethodologyPhase {
  step: string;
  name: string;
  tagline: string;
  agent: string;
  inputDescription: string;
  processingDetails: string[];
  outputArtifact: string;
  exampleOutcome: string;
}

const PHASES: MethodologyPhase[] = [
  {
    step: "01",
    name: "Record Deposit & Ingestion",
    tagline: "Unify fragmented organizational archives into a structured, citation-indexed knowledge base.",
    agent: "Knowledge Extractor (agent.extractor.v1)",
    inputDescription: "Raw organizational archives: Board minutes, regulatory filings, MSA contracts, system architecture diagrams, and handoff notes in PDF, DOCX, or TXT format.",
    processingDetails: [
      "Performs optical structure parsing and tabular cell extraction.",
      "Calculates cryptographic document hashes (SHA-256) for audit integrity.",
      "Identifies key named entities: persons, vendors, committee roles, and legal jurisdictions.",
      "Indexes verbatim character offsets for direct citation tracing.",
    ],
    outputArtifact: "Verifiable Entity Graph & Citation Concordance",
    exampleOutcome: "Parsed 10 records for Acme BioSystems, indexing 32 distinct commitments and active vendor relationships with 100% citation traceability.",
  },
  {
    step: "02",
    name: "Cross-Examination & Gap Detection",
    tagline: "Subject records to adversarial consistency checks to surface contradictions and missing documentation.",
    agent: "Gap Detective (agent.detective.v1)",
    inputDescription: "Ingested entity graph, contractual milestones, and organizational authority delegations.",
    processingDetails: [
      "Compares assertions across conflicting documents (e.g. Master Services Agreement vs. Amendment 3).",
      "Flags split decision-making authority or contradictory signatories.",
      "Detects references to missing schedules, appendices, and escrow keys.",
      "Classifies findings into the 6-tier evidence taxonomy (e.g. Conflicting, Missing, Inferred).",
    ],
    outputArtifact: "Classified Anomaly Register & Evidence Dossier",
    exampleOutcome: "Detected clinical trial PI sign-off contradiction between FDA Form 1572 and Vendor Amendment 3, preventing an imminent regulatory audit hold.",
  },
  {
    step: "03",
    name: "Obligation & Authority Mapping",
    tagline: "Chart every active obligation, financial threshold, and operational dependency to an explicit owner.",
    agent: "Continuity Analyst (agent.analyst.v1)",
    inputDescription: "Verified milestones, recurring vendor renewals, and regulatory compliance schedules.",
    processingDetails: [
      "Constructs directed acyclic graphs (DAGs) of operational dependencies.",
      "Identifies critical-path blockers where one uncompleted obligation halts multiple departments.",
      "Maps monetary signing thresholds against executive transition charters.",
      "Generates topological readiness scores for upcoming transition milestones.",
    ],
    outputArtifact: "Continuity Topology & Operational Responsibility Matrix",
    exampleOutcome: "Surfaced unassigned $140,000 spectrometry lab contract renewal window 15 days before successor start date.",
  },
  {
    step: "04",
    name: "The Switch Review Gate",
    tagline: "Incorporate mandatory human verification before any institutional decision is locked into the record.",
    agent: "Switch Console Orchestrator (orchestrator.switch.v1)",
    inputDescription: "Flagged anomalies, unassigned tasks, and candidate conflict resolutions.",
    processingDetails: [
      "Presents human reviewers with side-by-side verbatim document evidence.",
      "Enforces explicit administrative sign-off before closing an anomaly.",
      "Logs authorized reviewer identities and timestamps to an immutable audit ledger.",
      "Maintains human-in-the-loop oversight across all automated agent findings.",
    ],
    outputArtifact: "Adjudicated Resolution Record & Audit Trail",
    exampleOutcome: "Human reviewer confirmed signatory reassignment for the Phase II oncology trial, locking the resolution with an audit-traceable timestamp.",
  },
  {
    step: "05",
    name: "Handover Synthesis & Dossier Output",
    tagline: "Compile verified decisions, active obligations, and a 30-day operational roadmap into an executive dossier.",
    agent: "Handover Architect (agent.architect.v1)",
    inputDescription: "Adjudicated claims, resolved gaps, operational responsibility vectors, and verified entity graphs.",
    processingDetails: [
      "Synthesizes an executive transition briefing book with 9 grounded chapters.",
      "Generates an actionable Day-1 to Day-30 operational roadmap for incoming leadership.",
      "Binds every factual claim directly to cryptographic citation coordinates.",
      "Exports to board-ready formats: Structured JSON, Markdown, and print audit binders.",
    ],
    outputArtifact: "Executive Handover Dossier & 30-Day Operational Blueprint",
    exampleOutcome: "Generated comprehensive CSO transition dossier for Acme BioSystems with verified regulatory sign-offs and zero unaddressed liabilities.",
  },
];

export default function HowItWorksPage() {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const currentPhase = PHASES[activeStepIndex];

  return (
    <div className="min-h-screen flex flex-col bg-raw-paper text-carbon selection:bg-signal-orange selection:text-raw-paper font-sans relative">
      <IndustrialCursor />
      <PublicNav />

      <main className="flex-1">
        {/* Header Masthead */}
        <section className="border-b-2 border-carbon pt-12 sm:pt-16 pb-10 sm:pb-12 px-6 sm:px-10 lg:px-16 bg-raw-paper-light">
          <ScrollReveal variant="industrial">
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2.5 px-3 py-1 bg-carbon text-raw-paper font-mono text-xs uppercase tracking-widest border border-carbon">
                <span className="w-2 h-2 bg-signal-orange" />
                <span>METHODOLOGICAL SPECIFICATION</span>
              </div>
              <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-carbon">
                The 5-phase continuity methodology
              </h1>
              <p className="text-sm sm:text-base text-carbon/80 leading-relaxed max-w-3xl font-sans">
                A deterministic, evidence-backed framework for capturing, cross-examining, and handing over institutional knowledge through leadership change.
              </p>
            </div>
          </ScrollReveal>
        </section>

        {/* Interactive Phase Walkthrough */}
        <section className="py-12 sm:py-16 px-6 sm:px-10 lg:px-16 border-b-2 border-carbon bg-raw-paper">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Phase Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 border-2 border-carbon bg-raw-paper-light divide-y sm:divide-y-0 sm:divide-x-2 divide-carbon font-mono text-xs shadow-brutal">
              {PHASES.map((phase, idx) => (
                <button
                  key={phase.step}
                  onClick={() => setActiveStepIndex(idx)}
                  data-cursor="PHASE"
                  className={`p-3.5 sm:p-4 text-left transition-all ${
                    activeStepIndex === idx
                      ? "bg-carbon text-raw-paper shadow-inner"
                      : "hover:bg-concrete/40 text-carbon"
                  }`}
                >
                  <span className="text-2xs text-signal-orange font-bold block mb-0.5">
                    PHASE {phase.step}
                  </span>
                  <span className="font-display font-black text-xs sm:text-sm uppercase block truncate">
                    {phase.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Active Phase Card with AnimatePresence */}
            <div className="border-2 border-carbon bg-raw-paper-light p-6 sm:p-8 space-y-8 shadow-brutal-lg">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPhase.step}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
                  className="space-y-6"
                >
                  {/* Phase Title Block */}
                  <div className="space-y-3 border-b-2 border-carbon pb-6">
                    <div className="flex items-center gap-2.5 font-mono text-xs">
                      <span className="px-2 py-0.5 bg-signal-orange text-raw-paper font-bold">
                        PHASE {currentPhase.step}
                      </span>
                      <span className="text-carbon/60 uppercase font-bold text-2xs">
                        // {currentPhase.agent}
                      </span>
                    </div>

                    <h2 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-carbon">
                      {currentPhase.name}
                    </h2>

                    <p className="text-sm sm:text-base text-carbon/80 font-sans leading-relaxed">
                      {currentPhase.tagline}
                    </p>
                  </div>

                  {/* Two-Column Phase Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
                    {/* Left: Input & Processing */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-2xs uppercase tracking-wider text-carbon font-bold mb-1.5">
                          INPUT ARTIFACTS:
                        </h3>
                        <p className="p-3 bg-raw-paper border border-carbon text-carbon/80 font-sans text-xs sm:text-sm leading-relaxed">
                          {currentPhase.inputDescription}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-2xs uppercase tracking-wider text-carbon font-bold mb-1.5">
                          DETERMINISTIC PROCESSING PIPELINE:
                        </h3>
                        <ul className="space-y-2 font-sans text-xs sm:text-sm text-carbon/90">
                          {currentPhase.processingDetails.map((detail, dIdx) => (
                            <li key={dIdx} className="flex items-start gap-2 p-2.5 bg-raw-paper border border-carbon/20">
                              <span className="text-signal-orange font-bold font-mono">[{dIdx + 1}]</span>
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Right: Output Artifact & Example Outcome */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-2xs uppercase tracking-wider text-carbon font-bold mb-1.5">
                          OUTPUT ARTIFACT:
                        </h3>
                        <div className="p-3 bg-concrete border border-carbon font-bold text-xs sm:text-sm text-carbon">
                          {currentPhase.outputArtifact}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-2xs uppercase tracking-wider text-carbon font-bold mb-1.5">
                          REAL-WORLD OUTCOME (ACME BIOSYSTEMS CASE):
                        </h3>
                        <div className="p-3.5 bg-raw-paper border-l-4 border-signal-orange text-xs sm:text-sm text-carbon font-sans leading-relaxed shadow-brutal">
                          {currentPhase.exampleOutcome}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation buttons */}
              <div className="pt-4 border-t-2 border-carbon flex items-center justify-between font-mono text-xs">
                <button
                  onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                  disabled={activeStepIndex === 0}
                  className="text-carbon hover:text-signal-orange uppercase font-bold disabled:opacity-40"
                >
                  ← Previous Phase
                </button>
                <span className="text-carbon/60 font-bold">
                  [{activeStepIndex + 1} OF {PHASES.length}]
                </span>
                <button
                  onClick={() => setActiveStepIndex((prev) => Math.min(PHASES.length - 1, prev + 1))}
                  disabled={activeStepIndex === PHASES.length - 1}
                  className="text-carbon hover:text-signal-orange uppercase font-bold disabled:opacity-40"
                >
                  Next Phase →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-14 sm:py-16 px-6 sm:px-10 lg:px-16 bg-carbon text-raw-paper text-center">
          <ScrollReveal variant="editorial">
            <div className="max-w-2xl mx-auto space-y-4">
              <h2 className="font-display font-black text-2xl sm:text-4xl uppercase tracking-tight text-raw-paper">
                Ready to safeguard your organization?
              </h2>
              <p className="text-sm sm:text-base text-raw-paper/80 font-sans leading-relaxed">
                Explore the Acme BioSystems demonstration workspace or configure a custom transition dossier.
              </p>
              <div className="pt-3">
                <Link href="/app">
                  <Button variant="signal" size="lg" magnetic={true} data-cursor="WORKSPACE" className="px-6 py-3 text-sm font-bold">
                    Enter Organizational Workspace
                    <IconArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
