"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PublicNav } from "@/components/public/PublicNav";
import { PublicFooter } from "@/components/public/PublicFooter";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import {
  IconArrowRight,
  IconDocument,
  IconBrain,
  IconShield,
  IconNetwork,
  IconCheck,
  IconAlert,
  IconFileText,
  IconUser,
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
    agent: "Continuity Detective (agent.detective.v1)",
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
    agent: "Responsibility Analyst (agent.analyst.v1)",
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
    agent: "Dossier Architect (agent.architect.v1)",
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
    <div className="min-h-screen flex flex-col bg-paper text-ink selection:bg-copper-light selection:text-ink">
      <PublicNav />

      <main className="flex-1">
        {/* Header */}
        <section className="border-b border-rule pt-16 pb-14 px-4 sm:px-6 bg-paper-surface">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-paper border border-rule rounded-sm text-[11px] font-sans uppercase tracking-widest text-ink-secondary">
              The Continuity Methodology
            </div>
            <h1 className="font-serif italic text-3xl sm:text-5xl font-bold text-ink tracking-tight">
              How Relay engineers institutional continuity
            </h1>
            <p className="text-sm sm:text-base text-ink-secondary leading-relaxed max-w-2xl font-light">
              Transition management should not rely on oral tradition or hasty exit interviews. Relay transforms messy historical documents into a verifiable, structured operational handover.
            </p>
          </div>
        </section>

        {/* The 5-Phase Interactive Stepper */}
        <section className="py-16 px-4 sm:px-6 border-b border-rule">
          <div className="max-w-5xl mx-auto space-y-10">
            {/* Phase Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 border-b border-rule pb-4">
              {PHASES.map((phase, idx) => (
                <button
                  key={phase.step}
                  onClick={() => setActiveStepIndex(idx)}
                  className={`text-left p-3 rounded-sm border transition-all ${
                    activeStepIndex === idx
                      ? "bg-paper-surface border-ink/40 shadow-xs"
                      : "bg-paper border-rule/80 hover:border-rule text-ink-secondary"
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold block text-copper">
                    Phase {phase.step}
                  </span>
                  <span className="text-xs font-serif font-bold text-ink mt-0.5 line-clamp-1">
                    {phase.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Active Phase Deep Dive */}
            <Card className="bg-paper-surface border-rule p-6 sm:p-8 space-y-6">
              <div className="space-y-2 border-b border-rule pb-5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-sm bg-copper-light border border-copper-border text-copper text-xs font-mono font-bold">
                    Phase {currentPhase.step}
                  </span>
                  <span className="text-xs font-mono text-ink-secondary">
                    {currentPhase.agent}
                  </span>
                </div>
                <h2 className="font-serif italic text-2xl sm:text-3xl font-bold text-ink">
                  {currentPhase.name}
                </h2>
                <p className="text-sm text-ink-secondary font-light">
                  {currentPhase.tagline}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-sans uppercase tracking-wider text-ink font-bold mb-1.5">
                      Input Materials
                    </h3>
                    <p className="text-xs text-ink-secondary leading-relaxed bg-paper p-3 border border-rule rounded-sm">
                      {currentPhase.inputDescription}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xs font-sans uppercase tracking-wider text-ink font-bold mb-1.5">
                      Analytical Procedures
                    </h3>
                    <ul className="space-y-2 text-xs text-ink-secondary">
                      {currentPhase.processingDetails.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <IconCheck className="w-3.5 h-3.5 text-olive shrink-0 mt-0.5" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-sans uppercase tracking-wider text-ink font-bold mb-1.5">
                      Output Deliverable
                    </h3>
                    <div className="p-3 bg-paper-secondary border border-rule rounded-sm text-xs font-mono text-ink">
                      {currentPhase.outputArtifact}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-sans uppercase tracking-wider text-ink font-bold mb-1.5">
                      Real-World Outcome (Acme BioSystems Case)
                    </h3>
                    <div className="p-3 bg-paper border-l-2 border-olive text-xs text-ink leading-relaxed">
                      {currentPhase.exampleOutcome}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-rule flex items-center justify-between">
                <button
                  onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                  disabled={activeStepIndex === 0}
                  className="text-xs font-sans text-ink-secondary hover:text-ink disabled:opacity-40 disabled:hover:text-ink-secondary"
                >
                  ← Previous Phase
                </button>
                <span className="text-xs font-mono text-ink-disabled">
                  {activeStepIndex + 1} of {PHASES.length}
                </span>
                <button
                  onClick={() => setActiveStepIndex((prev) => Math.min(PHASES.length - 1, prev + 1))}
                  disabled={activeStepIndex === PHASES.length - 1}
                  className="text-xs font-sans text-ink-secondary hover:text-ink disabled:opacity-40 disabled:hover:text-ink-secondary"
                >
                  Next Phase →
                </button>
              </div>
            </Card>
          </div>
        </section>

        {/* Core Principles */}
        <section className="py-16 px-4 sm:px-6 bg-paper-surface">
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="font-serif italic text-2xl sm:text-3xl font-bold text-ink text-center">
              Our Core Continuity Principles
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="space-y-2">
                <h3 className="font-serif font-bold text-sm text-ink">
                  1. Evidence Over Recall
                </h3>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Memory fades and opinions conflict. Every assertion must be anchored in an immutable documentary source or explicitly acknowledged as missing.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-serif font-bold text-sm text-ink">
                  2. No Autonomous Unvetted Release
                </h3>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  AI agents synthesize, cross-examine, and flag anomalies, but humans retain absolute editorial authority over final handover dossiers.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-serif font-bold text-sm text-ink">
                  3. Continuity As An Operational Asset
                </h3>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Transitions are not mere HR offboarding rituals. They are mission-critical operational handovers that determine organizational longevity.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 sm:px-6 border-t border-rule text-center">
          <div className="max-w-xl mx-auto space-y-4">
            <h2 className="font-serif italic text-2xl sm:text-3xl font-bold text-ink">
              Ready to safeguard your organization?
            </h2>
            <p className="text-xs sm:text-sm text-ink-secondary">
              Explore the Acme BioSystems demonstration workspace or configure a custom transition dossier.
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

