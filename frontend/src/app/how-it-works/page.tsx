"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PublicNav } from "@/components/public/PublicNav";
import { PublicFooter } from "@/components/public/PublicFooter";
import { Button } from "@/components/ui/Button";
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
    exampleOutcome: "Parsed 42 records for Acme BioSystems, indexing 312 distinct commitments and 18 vendor relationships with 100% citation traceability.",
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
      "Identifies upcoming deadlines, notice windows, and auto-renewal triggers.",
      "Maps explicit vs. unassigned operational ownership.",
      "Constructs directed dependency trees showing predecessor blockers.",
      "Calculates organizational risk scores for unassigned high-value liabilities.",
    ],
    outputArtifact: "Active Continuity Dependency Map",
    exampleOutcome: "Identified $140,000 spectrometry lab contract auto-renewal triggering in 30 days without an assigned successor signatory.",
  },
  {
    step: "04",
    name: "Human-in-the-Loop Adjudication",
    tagline: "Empower departing and incoming leaders to resolve ambiguities before knowledge is set in stone.",
    agent: "Switch Human Verification Desk",
    inputDescription: "Classified anomalies, pending obligations, and proposed resolution briefs.",
    processingDetails: [
      "Departing lead provides institutional context to clarify ambiguous clauses.",
      "Incoming lead reviews and acknowledges assigned operational obligations.",
      "Human administrators approve or reject AI-inferred relationships.",
      "Resolutions receive immutable human-verified status in the knowledge archive.",
    ],
    outputArtifact: "Human-Signed Resolution Manifest",
    exampleOutcome: "Dr. Eleanor Vance confirmed that Spectrometry Lab renewal was intended for termination, saving Acme $140,000 in unnecessary fees.",
  },
  {
    step: "05",
    name: "Dossier Synthesis & Transition Blueprint",
    tagline: "Generate an executive-grade, evidence-backed handover dossier and 30-day operational blueprint.",
    agent: "Handover Architect (agent.architect.v1)",
    inputDescription: "Full concordance of verified facts, resolved anomalies, and confirmed responsibility vectors.",
    processingDetails: [
      "Compiles high-level Executive Transition Brief for board and leadership review.",
      "Structures Week-1 to Week-4 chronological operational milestones.",
      "Attaches verified document citations and key stakeholder contact directories.",
      "Generates exportable, audit-ready PDF/Markdown dossier.",
    ],
    outputArtifact: "Executive Transition Dossier & 30-Day Blueprint",
    exampleOutcome: "Delivered comprehensive 5-chapter dossier to Acme BioSystems board, enabling incoming CSO to assume full operational oversight on Day 1.",
  },
];

export default function HowItWorksPage() {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const currentPhase = PHASES[activeStepIndex];

  return (
    <div className="min-h-screen flex flex-col bg-raw-paper text-carbon selection:bg-signal-orange selection:text-raw-paper font-sans">
      <PublicNav />

      <main className="flex-1">
        {/* Header */}
        <section className="border-b-2 border-carbon pt-16 pb-14 px-4 sm:px-6 bg-raw-paper-light">
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-carbon text-raw-paper font-mono text-[10px] uppercase tracking-widest border border-carbon">
              // METHODOLOGY MANUAL
            </div>
            <h1 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-carbon">
              How Relay engineers institutional continuity
            </h1>
            <p className="text-sm sm:text-base text-carbon/80 leading-relaxed max-w-2xl font-sans">
              Transition management should not rely on oral tradition or hasty exit interviews. Relay transforms messy historical documents into a verifiable, structured operational handover.
            </p>
          </div>
        </section>

        {/* The 5-Phase Interactive Stepper */}
        <section className="py-16 px-4 sm:px-6 border-b-2 border-carbon">
          <div className="max-w-5xl mx-auto space-y-10">
            {/* Phase Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 border-b-2 border-carbon pb-4">
              {PHASES.map((phase, idx) => (
                <button
                  key={phase.step}
                  onClick={() => setActiveStepIndex(idx)}
                  className={`text-left p-3 border-2 transition-all font-mono ${
                    activeStepIndex === idx
                      ? "bg-carbon text-raw-paper border-carbon shadow-brutal translate-y-[-2px]"
                      : "bg-raw-paper-light text-carbon border-carbon/40 hover:border-carbon"
                  }`}
                >
                  <span className="text-[10px] font-bold block text-signal-orange">
                    PHASE {phase.step}
                  </span>
                  <span className="text-xs font-display font-bold uppercase mt-0.5 line-clamp-1">
                    {phase.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Active Phase Deep Dive */}
            <div className="bg-raw-paper-light border-2 border-carbon p-6 sm:p-8 space-y-6 shadow-brutal">
              <div className="space-y-2 border-b-2 border-carbon pb-5">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-2 py-0.5 bg-signal-orange text-raw-paper font-bold">
                    PHASE {currentPhase.step}
                  </span>
                  <span className="text-carbon/60 uppercase">
                    // {currentPhase.agent}
                  </span>
                </div>
                <h2 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-carbon">
                  {currentPhase.name}
                </h2>
                <p className="text-sm text-carbon/80 font-sans">
                  {currentPhase.tagline}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-mono text-xs">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs uppercase tracking-wider text-carbon font-bold mb-1.5">
                      INPUT MATERIALS
                    </h3>
                    <p className="text-xs text-carbon/80 leading-relaxed bg-raw-paper p-3.5 border border-carbon">
                      {currentPhase.inputDescription}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xs uppercase tracking-wider text-carbon font-bold mb-1.5">
                      ANALYTICAL PROCEDURES
                    </h3>
                    <ul className="space-y-2 text-xs text-carbon/80 font-sans">
                      {currentPhase.processingDetails.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <IconCheck size={14} className="text-industrial-green shrink-0 mt-0.5" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs uppercase tracking-wider text-carbon font-bold mb-1.5">
                      OUTPUT DELIVERABLE
                    </h3>
                    <div className="p-3 bg-concrete border border-carbon font-bold text-carbon">
                      {currentPhase.outputArtifact}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs uppercase tracking-wider text-carbon font-bold mb-1.5">
                      REAL-WORLD OUTCOME (ACME BIOSYSTEMS CASE)
                    </h3>
                    <div className="p-3.5 bg-raw-paper border-l-4 border-signal-orange text-xs text-carbon font-sans leading-relaxed">
                      {currentPhase.exampleOutcome}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-carbon flex items-center justify-between font-mono text-xs">
                <button
                  onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                  disabled={activeStepIndex === 0}
                  className="text-carbon hover:text-signal-orange uppercase font-bold disabled:opacity-40"
                >
                  ← Previous Phase
                </button>
                <span className="text-carbon/60">
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
        <section className="py-16 px-4 sm:px-6 bg-carbon text-raw-paper text-center">
          <div className="max-w-xl mx-auto space-y-4">
            <h2 className="font-display font-black text-2xl sm:text-4xl uppercase tracking-tight text-raw-paper">
              Ready to safeguard your organization?
            </h2>
            <p className="text-xs sm:text-sm text-raw-paper/70 font-sans">
              Explore the Acme BioSystems demonstration workspace or configure a custom transition dossier.
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
