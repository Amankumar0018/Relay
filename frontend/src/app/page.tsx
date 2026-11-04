"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PublicNav } from "@/components/public/PublicNav";
import { PublicFooter } from "@/components/public/PublicFooter";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { EvidenceBadge } from "@/components/evidence/EvidenceBadge";
import {
  IconArrowRight,
  IconDocument,
  IconShield,
  IconBrain,
  IconNetwork,
  IconCheck,
  IconAlert,
  IconFileText,
  IconExternal,
  IconDatabase,
  IconTerminal,
} from "@/components/ui/Icons";

interface DemoDoc {
  id: string;
  code: string;
  title: string;
  category: string;
  excerpt: string;
  extractedFacts: string[];
  evidenceSource: string;
  anomalyDetected?: {
    type: "missing" | "conflicting";
    title: string;
    description: string;
    actionRequired: string;
  };
}

const DEMO_RECORDS: DemoDoc[] = [
  {
    id: "rec-01",
    code: "DOC-CSO-2024",
    title: "Chief Scientific Officer Departure Charter.pdf",
    category: "EXECUTIVE TRANSITION",
    excerpt:
      "Section 3.2: Dr. Eleanor Vance relinquishes executive sign-off authority for clinical trial budgets effective November 30, 2024. All FDA liaison duties transferred to successor upon board confirmation.",
    extractedFacts: [
      "Key Personnel: Dr. Eleanor Vance (Departing CSO)",
      "Effective Departure Date: November 30, 2024",
      "Regulatory Scope: FDA IND Filings #99201, #99204",
      "Financial Authorization Threshold: $250,000",
    ],
    evidenceSource: "Page 4, Paragraph 2 (Charters Binder 2024)",
  },
  {
    id: "rec-02",
    code: "DOC-MSA-82",
    title: "Spectrometry Lab Services Master Agreement.docx",
    category: "VENDOR CONTRACT",
    excerpt:
      "Section 8.2: Automatic 12-month extension activates on November 15, 2024 unless formal written notice of termination is delivered 30 days prior. Annual commitment fee: $140,000.",
    extractedFacts: [
      "Vendor: Apex BioAnalytical Labs Inc.",
      "Contract Renewal Trigger: November 15, 2024",
      "Notice Window Closes: October 15, 2024",
      "Financial Liability: $140,000 auto-commitment",
    ],
    evidenceSource: "Section 8.2, Exhibit B (Contracts Ledger)",
    anomalyDetected: {
      type: "missing",
      title: "Unassigned Contract Termination Authority",
      description:
        "The $140,000 auto-renewal notice deadline occurs 15 days before the incoming CSO start date. No interim sign-off authority is designated in the charter.",
      actionRequired:
        "Designate interim finance signatory or dispatch termination notice immediately.",
    },
  },
  {
    id: "rec-03",
    code: "DOC-FDA-1572",
    title: "FDA Form 1572 Principal Investigator Registry.pdf",
    category: "REGULATORY COMPLIANCE",
    excerpt:
      "Box 1: Primary Sponsor Representative named as Dr. Eleanor Vance. Box 6: Clinical protocol trial execution managed by Dr. Marcus Thorne (Site Lead).",
    extractedFacts: [
      "Regulatory Instrument: FDA Form 1572",
      "Active Protocols: ONCO-PHASE-II (Sites 101-108)",
      "Contradicting Document: Vendor Lab Execution MSA Amend. 3",
    ],
    evidenceSource: "Box 1 & 6 (Audit Submission Q3-2024)",
    anomalyDetected: {
      type: "conflicting",
      title: "Principal Investigator Authority Mismatch",
      description:
        "Vendor Amendment 3 names Dr. Thorne as primary trial sponsor, whereas FDA Form 1572 lists Dr. Vance. Discrepancy triggers an automatic FDA trial suspension if unclarified.",
      actionRequired:
        "Re-submit updated Form 1572 with incoming CSO co-signature before November 1.",
    },
  },
];

export default function PublicHomePage() {
  // Demonstration interactive state
  const [selectedRecordId, setSelectedRecordId] = useState("rec-02");
  const [clarificationResolved, setClarificationResolved] = useState(false);
  const [dossierGenerated, setDossierGenerated] = useState(false);

  const activeDoc =
    DEMO_RECORDS.find((r) => r.id === selectedRecordId) || DEMO_RECORDS[0];

  return (
    <div className="min-h-screen flex flex-col bg-raw-paper text-carbon selection:bg-signal-orange selection:text-raw-paper">
      <PublicNav />

      <main className="flex-1">
        {/* SECTION 01: ASYMMETRICAL INDUSTRIAL OPENING HERO */}
        <section className="border-b-2 border-carbon relative overflow-hidden">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
            {/* Left Column: Bold Asymmetric Headline & Copy */}
            <div className="lg:col-span-8 p-6 sm:p-10 lg:p-14 flex flex-col justify-between border-b-2 lg:border-b-0 lg:border-r-2 border-carbon bg-raw-paper">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-carbon text-raw-paper text-[10px] font-mono uppercase tracking-widest border border-carbon">
                  <span className="w-2 h-2 bg-signal-orange" />
                  // ORGANIZATIONAL CONTINUITY ENGINE
                </div>

                <div className="space-y-2">
                  <span className="font-mono text-xs uppercase tracking-widest text-signal-orange font-bold block">
                    [STATEMENT 01]
                  </span>
                  <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-7xl uppercase tracking-tighter text-carbon leading-[0.92]">
                    Every
                    <br />
                    organization
                    <br />
                    <span className="text-signal-orange">has a memory.</span>
                  </h1>
                </div>

                <p className="max-w-xl text-sm sm:text-base text-carbon/80 font-sans leading-relaxed pt-2">
                  Relay preserves the decisions, responsibilities and institutional knowledge that keep organizations moving through change.
                </p>
              </div>

              {/* Action row */}
              <div className="pt-8 border-t-2 border-carbon/20 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Link href="/app">
                  <Button variant="signal" size="lg">
                    Launch Relay Workspace
                    <IconArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/how-it-works">
                  <Button variant="outline" size="lg">
                    The 5-Phase Methodology
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column: Industrial Color-Blocked Telemetry & Continuity Motif */}
            <div className="lg:col-span-4 bg-carbon text-raw-paper p-6 sm:p-8 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-raw-paper/20 pb-3">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-raw-paper/60">
                    // SYSTEM ARCHITECTURE
                  </span>
                  <span className="font-mono text-[10px] text-signal-orange font-bold">
                    VERIFIED
                  </span>
                </div>

                {/* Industrial Continuity Graphic Motif */}
                <div className="p-4 border-2 border-raw-paper/20 bg-carbon-surface space-y-4">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-signal-orange font-bold">NODE: TRANSITION #04</span>
                    <span className="text-raw-paper/60">ACME BIO</span>
                  </div>

                  {/* Geometric Flow Diagram */}
                  <div className="space-y-2 font-mono text-xs">
                    <div className="p-2 border border-raw-paper/20 flex items-center justify-between bg-carbon">
                      <span>01. DEPOSITED RECORDS</span>
                      <span className="text-signal-orange font-bold">[42 DOCS]</span>
                    </div>
                    <div className="w-[2px] h-3 bg-signal-orange ml-4" />
                    <div className="p-2 border border-raw-paper/20 flex items-center justify-between bg-carbon">
                      <span>02. EXTRACTED CITATIONS</span>
                      <span className="text-industrial-green-light font-bold">[312 TRIPLES]</span>
                    </div>
                    <div className="w-[2px] h-3 bg-signal-orange ml-4" />
                    <div className="p-2 border border-signal-orange flex items-center justify-between bg-signal-orange/10 text-signal-orange font-bold">
                      <span>03. FLAGGED ANOMALIES</span>
                      <span>[3 CRITICAL]</span>
                    </div>
                    <div className="w-[2px] h-3 bg-signal-orange ml-4" />
                    <div className="p-2 border border-raw-paper/20 flex items-center justify-between bg-carbon">
                      <span>04. VERIFIED DOSSIER</span>
                      <span className="text-raw-paper">READY</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 font-mono text-[11px] text-raw-paper/70">
                  <p>• Local-first persistent SQLite engine (WAL)</p>
                  <p>• Multi-agent cross-examination with human Switch</p>
                  <p>• Zero document retention on commercial clouds</p>
                </div>
              </div>

              <div className="pt-6 border-t border-raw-paper/20 flex items-center justify-between text-[10px] font-mono text-raw-paper/50">
                <span>LOCAL DOCKER CLUSTER</span>
                <span className="text-signal-orange font-bold">ACTIVE :8000</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 02: THE INSTITUTIONAL PROBLEM (THE TRANSITION FRACTURE) */}
        <section className="border-b-2 border-carbon bg-raw-paper-light py-16 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-carbon pb-6">
              <div>
                <span className="font-mono text-xs uppercase tracking-widest text-signal-orange font-bold">
                  // THE INSTITUTIONAL FRACTURE
                </span>
                <h2 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-carbon mt-1">
                  How knowledge evaporates
                </h2>
              </div>
              <p className="max-w-md text-xs sm:text-sm text-carbon/80 font-sans leading-relaxed">
                When key leadership departs, corporate memory fragments across five vectors, leaving successors to navigate invisible liabilities.
              </p>
            </div>

            {/* 5 Distinct Industrial Problem Vectors */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="p-4 border-2 border-carbon bg-raw-paper space-y-2">
                <span className="font-mono text-[11px] font-bold text-signal-orange uppercase">
                  VEC.01 // RECORDS
                </span>
                <h3 className="font-display font-bold text-sm uppercase text-carbon">
                  Buried In PDF Binders
                </h3>
                <p className="text-xs text-carbon/70 leading-relaxed font-sans">
                  Vital commitments hide in hundred-page contract amendments that no one reads until a breach occurs.
                </p>
              </div>

              <div className="p-4 border-2 border-carbon bg-raw-paper space-y-2">
                <span className="font-mono text-[11px] font-bold text-signal-orange uppercase">
                  VEC.02 // DECISIONS
                </span>
                <h3 className="font-display font-bold text-sm uppercase text-carbon">
                  Lost Rationales
                </h3>
                <p className="text-xs text-carbon/70 leading-relaxed font-sans">
                  Why an architecture was selected or a partner rejected is never written down, leading teams to repeat costly mistakes.
                </p>
              </div>

              <div className="p-4 border-2 border-carbon bg-raw-paper space-y-2">
                <span className="font-mono text-[11px] font-bold text-signal-orange uppercase">
                  VEC.03 // PEOPLE
                </span>
                <h3 className="font-display font-bold text-sm uppercase text-carbon">
                  Siloed Relationships
                </h3>
                <p className="text-xs text-carbon/70 leading-relaxed font-sans">
                  Critical regulator liaisons and key vendor relationships exist solely on personal mobile phones.
                </p>
              </div>

              <div className="p-4 border-2 border-carbon bg-raw-paper space-y-2">
                <span className="font-mono text-[11px] font-bold text-signal-orange uppercase">
                  VEC.04 // OBLIGATIONS
                </span>
                <h3 className="font-display font-bold text-sm uppercase text-carbon">
                  Silent Deadlines
                </h3>
                <p className="text-xs text-carbon/70 leading-relaxed font-sans">
                  Auto-renewing six-figure SaaS and lab contracts trigger unprompted with no assigned successor aware.
                </p>
              </div>

              <div className="p-4 border-2 border-carbon bg-signal-orange text-raw-paper space-y-2">
                <span className="font-mono text-[11px] font-bold text-carbon uppercase">
                  VEC.05 // GAPS
                </span>
                <h3 className="font-display font-bold text-sm uppercase text-raw-paper">
                  Split Authorities
                </h3>
                <p className="text-xs text-raw-paper/90 leading-relaxed font-sans">
                  Contradictory filings designate two different decision-makers, freezing operational execution.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 03: HOW RELAY WORKS (THE CONTINUITY PIPELINE) */}
        <section className="border-b-2 border-carbon py-16 px-4 sm:px-6 bg-raw-paper">
          <div className="max-w-7xl mx-auto space-y-10">
            <div className="space-y-2">
              <span className="font-mono text-xs uppercase tracking-widest text-signal-orange font-bold">
                // SYSTEM PIPELINE
              </span>
              <h2 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-carbon">
                Records → Knowledge → Investigation → Collaboration → Handover
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-0 border-2 border-carbon divide-y md:divide-y-0 md:divide-x-2 divide-carbon bg-raw-paper-light">
              <div className="p-5 space-y-2">
                <span className="font-mono text-xs text-carbon/50 font-bold">STAGE 01</span>
                <h3 className="font-display font-bold text-sm uppercase text-carbon">
                  Records Deposit
                </h3>
                <p className="text-xs text-carbon/70 leading-relaxed font-sans">
                  Ingests PDF, DOCX, TXT archives with local SHA-256 cryptographic verification.
                </p>
              </div>

              <div className="p-5 space-y-2">
                <span className="font-mono text-xs text-carbon/50 font-bold">STAGE 02</span>
                <h3 className="font-display font-bold text-sm uppercase text-carbon">
                  Entity Extraction
                </h3>
                <p className="text-xs text-carbon/70 leading-relaxed font-sans">
                  Identifies people, monetary thresholds, dates, and verbatim character offsets.
                </p>
              </div>

              <div className="p-5 space-y-2 bg-concrete/40">
                <span className="font-mono text-xs text-signal-orange font-bold">STAGE 03</span>
                <h3 className="font-display font-bold text-sm uppercase text-carbon">
                  Gap Detection
                </h3>
                <p className="text-xs text-carbon/70 leading-relaxed font-sans">
                  Cross-examines documents to uncover contradictions and missing schedules.
                </p>
              </div>

              <div className="p-5 space-y-2">
                <span className="font-mono text-xs text-carbon/50 font-bold">STAGE 04</span>
                <h3 className="font-display font-bold text-sm uppercase text-carbon">
                  Switch Gate
                </h3>
                <p className="text-xs text-carbon/70 leading-relaxed font-sans">
                  Humans review, approve, or clarify flagged anomalies before decisions lock.
                </p>
              </div>

              <div className="p-5 space-y-2 bg-carbon text-raw-paper">
                <span className="font-mono text-xs text-signal-orange font-bold">STAGE 05</span>
                <h3 className="font-display font-bold text-sm uppercase text-raw-paper">
                  Dossier Output
                </h3>
                <p className="text-xs text-raw-paper/70 leading-relaxed font-sans">
                  Synthesizes executive briefing, 30-day roadmap, and line-item responsibilities.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 04: MANDATORY FUNCTIONAL PRODUCT DEMONSTRATION */}
        <section className="border-b-2 border-carbon py-20 px-4 sm:px-6 bg-concrete/30">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-signal-orange text-raw-paper font-mono text-[10px] uppercase font-bold border border-carbon">
                  MANDATORY LIVE DEMO
                </div>
                <h2 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-carbon mt-2">
                  Interactive Transition Inspector
                </h2>
                <p className="font-mono text-xs text-carbon/70 uppercase mt-1">
                  CASE: ACME BIOSYSTEMS // DR. ELEANOR VANCE (CSO TRANSITION) • ILLUSTRATIVE TEST DATA
                </p>
              </div>

              <div className="font-mono text-xs text-carbon bg-raw-paper p-2 border-2 border-carbon">
                STEP-BY-STEP: SELECT RECORD → INSPECT → RESOLVE → GENERATE
              </div>
            </div>

            {/* Main Interactive Stage Box */}
            <div className="border-2 border-carbon bg-raw-paper-light shadow-brutal-lg">
              {/* Record Selector Strip */}
              <div className="border-b-2 border-carbon bg-raw-paper p-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold uppercase text-carbon/60 mr-2">
                    SELECT RECORD:
                  </span>
                  {DEMO_RECORDS.map((rec) => (
                    <button
                      key={rec.id}
                      onClick={() => {
                        setSelectedRecordId(rec.id);
                        setClarificationResolved(false);
                      }}
                      className={`px-3 py-1.5 text-xs font-mono uppercase font-bold border transition-all ${
                        selectedRecordId === rec.id
                          ? "bg-carbon text-raw-paper border-carbon shadow-brutal"
                          : "bg-raw-paper-light text-carbon border-carbon/40 hover:border-carbon"
                      }`}
                    >
                      [{rec.code}]
                    </button>
                  ))}
                </div>

                <span className="font-mono text-[11px] text-signal-orange font-bold uppercase">
                  // DEMO ENGINE READY
                </span>
              </div>

              {/* Split-Screen Inspector Body */}
              <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[440px]">
                {/* Left Panel: Primary Record & Verbatim Citation */}
                <div className="lg:col-span-6 p-6 border-b-2 lg:border-b-0 lg:border-r-2 border-carbon space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase px-2 py-0.5 bg-carbon text-raw-paper font-bold">
                      {activeDoc.category}
                    </span>
                    <span className="font-mono text-[11px] text-carbon/60">
                      {activeDoc.evidenceSource}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-lg uppercase text-carbon">
                    {activeDoc.title}
                  </h3>

                  <div className="space-y-1.5">
                    <span className="font-mono text-[10px] uppercase font-bold text-carbon/60">
                      PRIMARY ARCHIVAL EXCERPT:
                    </span>
                    <blockquote className="p-3.5 bg-raw-paper border-l-4 border-signal-orange font-mono text-xs text-carbon leading-relaxed">
                      &ldquo;{activeDoc.excerpt}&rdquo;
                    </blockquote>
                  </div>

                  <div className="space-y-2 pt-2">
                    <span className="font-mono text-[10px] uppercase font-bold text-carbon/60">
                      STRUCTURED TRIPLES EXTRACTED:
                    </span>
                    <ul className="space-y-1 font-mono text-xs text-carbon">
                      {activeDoc.extractedFacts.map((fact, idx) => (
                        <li key={idx} className="flex items-center gap-2 p-1.5 bg-concrete/40 border border-carbon/20">
                          <span className="w-1.5 h-1.5 bg-carbon" />
                          <span>{fact}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Right Panel: Anomaly Cross-Examination & Human Resolution */}
                <div className="lg:col-span-6 p-6 bg-raw-paper flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-carbon/20 pb-3">
                      <span className="font-mono text-[11px] font-bold uppercase text-carbon">
                        CONTINUITY CROSS-EXAMINATION
                      </span>
                      {activeDoc.anomalyDetected ? (
                        <EvidenceBadge status={activeDoc.anomalyDetected.type} />
                      ) : (
                        <EvidenceBadge status="evidence-backed" />
                      )}
                    </div>

                    {activeDoc.anomalyDetected ? (
                      <div className="p-4 border-2 border-carbon bg-raw-paper-light space-y-3">
                        <div className="flex items-center gap-2">
                          <IconAlert size={16} className="text-signal-orange" />
                          <h4 className="font-display font-bold text-sm uppercase text-carbon">
                            {activeDoc.anomalyDetected.title}
                          </h4>
                        </div>

                        <p className="font-sans text-xs text-carbon leading-relaxed">
                          {activeDoc.anomalyDetected.description}
                        </p>

                        <div className="p-2.5 bg-signal-orange/10 border border-signal-orange font-mono text-xs text-signal-orange">
                          <strong>ACTION REQUIRED:</strong> {activeDoc.anomalyDetected.actionRequired}
                        </div>

                        {/* Interactive Clarification Action Button */}
                        <div className="pt-2">
                          {clarificationResolved ? (
                            <div className="p-2.5 bg-industrial-green text-raw-paper font-mono text-xs flex items-center justify-between border border-carbon">
                              <span className="font-bold">STATUS: RESOLVED VIA SWITCH (HUMAN-VERIFIED)</span>
                              <IconCheck size={16} />
                            </div>
                          ) : (
                            <Button
                              variant="signal"
                              size="sm"
                              className="w-full"
                              onClick={() => setClarificationResolved(true)}
                            >
                              Resolve Anomaly via Switch Gate
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 border border-carbon bg-raw-paper-light space-y-2">
                        <span className="font-mono text-xs font-bold text-industrial-green">
                          NO ANOMALIES DETECTED
                        </span>
                        <p className="text-xs text-carbon/70 font-sans">
                          All signatories and responsibilities in this record match existing operational records.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Generate Sample Handover Dossier Action */}
                  <div className="pt-4 border-t-2 border-carbon/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs uppercase font-bold text-carbon">
                        STEP 06: DOSSIER COMPILATION
                      </span>
                      <Button
                        variant={dossierGenerated ? "secondary" : "primary"}
                        size="sm"
                        onClick={() => setDossierGenerated(true)}
                      >
                        {dossierGenerated ? "Regenerate Dossier" : "Compile Handover Dossier"}
                      </Button>
                    </div>

                    {dossierGenerated && (
                      <div className="p-3 bg-carbon text-raw-paper font-mono text-xs border border-carbon space-y-2">
                        <div className="flex items-center justify-between text-signal-orange font-bold">
                          <span>// HANDOVER DOSSIER READY: ACME-CSO-2026</span>
                          <span>CHAPTERS: 5</span>
                        </div>
                        <p className="text-[11px] text-raw-paper/80 font-sans leading-relaxed">
                          Includes Day-1 to Day-30 executive roadmap, $140K spectrometry lab resolution, and FDA PI amendment package.
                        </p>
                        <Link href="/app/handovers" className="inline-block pt-1">
                          <span className="text-signal-orange underline text-xs font-bold">
                            Open full dossier studio in workspace →
                          </span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 05: AGENT COLLABORATION SYSTEM */}
        <section className="border-b-2 border-carbon py-20 px-4 sm:px-6 bg-raw-paper">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="space-y-2 border-b-2 border-carbon pb-6">
              <span className="font-mono text-xs uppercase tracking-widest text-signal-orange font-bold">
                // AGENT ARCHITECTURE
              </span>
              <h2 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-carbon">
                Four Specialized Collaborative Agents
              </h2>
              <p className="text-xs sm:text-sm text-carbon/70 font-sans max-w-xl">
                Relay abandons generalized conversational models in favor of four isolated, purpose-built analytical agents governed by Switch human approvals.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 border-2 border-carbon bg-raw-paper-light space-y-3 shadow-brutal">
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-carbon text-raw-paper inline-block">
                  AGENT 01
                </span>
                <h3 className="font-display font-bold text-base uppercase text-carbon">
                  Knowledge Extractor
                </h3>
                <p className="text-xs text-carbon/80 font-sans leading-relaxed">
                  Ingests multi-page PDFs, charters, and spreadsheets. Outputs structured entity triples, milestone dates, and monetary thresholds.
                </p>
                <div className="pt-2 border-t border-carbon/20 font-mono text-[10px] text-carbon/60">
                  INPUT: RAW ARCHIVES • OUTPUT: CITATION INDEX
                </div>
              </div>

              <div className="p-5 border-2 border-carbon bg-raw-paper-light space-y-3 shadow-brutal">
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-signal-orange text-raw-paper inline-block">
                  AGENT 02
                </span>
                <h3 className="font-display font-bold text-base uppercase text-carbon">
                  Gap Detective
                </h3>
                <p className="text-xs text-carbon/80 font-sans leading-relaxed">
                  Adversarially cross-examines documents to uncover split authority mandates, missing exhibits, and unassigned renewal clauses.
                </p>
                <div className="pt-2 border-t border-carbon/20 font-mono text-[10px] text-carbon/60">
                  INPUT: EXTRACTED TRIPLES • OUTPUT: ANOMALY LOG
                </div>
              </div>

              <div className="p-5 border-2 border-carbon bg-raw-paper-light space-y-3 shadow-brutal">
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-carbon text-raw-paper inline-block">
                  AGENT 03
                </span>
                <h3 className="font-display font-bold text-base uppercase text-carbon">
                  Continuity Analyst
                </h3>
                <p className="text-xs text-carbon/80 font-sans leading-relaxed">
                  Maps directed acyclic dependency trees, linking predecessor tasks, legal compliance filings, and contract deadlines to owners.
                </p>
                <div className="pt-2 border-t border-carbon/20 font-mono text-[10px] text-carbon/60">
                  INPUT: ANOMALIES + CALENDAR • OUTPUT: DEPENDENCY GRAPH
                </div>
              </div>

              <div className="p-5 border-2 border-carbon bg-raw-paper-light space-y-3 shadow-brutal">
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-industrial-green text-raw-paper inline-block">
                  AGENT 04
                </span>
                <h3 className="font-display font-bold text-base uppercase text-carbon">
                  Handover Architect
                </h3>
                <p className="text-xs text-carbon/80 font-sans leading-relaxed">
                  Compiles verified evidence, approved resolutions, and first-month milestones into a boardroom-ready executive handover dossier.
                </p>
                <div className="pt-2 border-t border-carbon/20 font-mono text-[10px] text-carbon/60">
                  INPUT: APPROVED RESOLUTIONS • OUTPUT: 30-DAY DOSSIER
                </div>
              </div>
            </div>

            {/* Switch Human Verification Protocol Notice */}
            <div className="p-4 border-2 border-carbon bg-carbon text-raw-paper flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 bg-signal-orange" />
                <span className="font-bold uppercase tracking-wider text-signal-orange">
                  THE SWITCH VERIFICATION PROTOCOL:
                </span>
                <span className="text-raw-paper/80 font-sans">
                  Agents never publish conclusions or close investigations without explicit human review.
                </span>
              </div>
              <Link href="/app/agents">
                <Button variant="signal" size="sm">
                  View Agent Pipeline →
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* SECTION 06: HANDOVER OUTPUT SHOWCASE */}
        <section className="border-b-2 border-carbon py-20 px-4 sm:px-6 bg-raw-paper-light">
          <div className="max-w-7xl mx-auto space-y-10">
            <div className="space-y-2">
              <span className="font-mono text-xs uppercase tracking-widest text-signal-orange font-bold">
                // SYSTEM DELIVERABLE
              </span>
              <h2 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-carbon">
                Evidence-Backed Handover Dossiers
              </h2>
            </div>

            <div className="border-2 border-carbon bg-raw-paper p-6 sm:p-8 space-y-6 shadow-brutal">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-carbon pb-4">
                <div>
                  <span className="font-mono text-[10px] uppercase font-bold text-signal-orange">
                    SAMPLE DOSSIER // CHAPTER INDEX
                  </span>
                  <h3 className="font-display font-black text-xl uppercase text-carbon mt-0.5">
                    Acme BioSystems Chief Scientific Officer Transition
                  </h3>
                </div>
                <div className="font-mono text-xs text-carbon/70">
                  EXPORT FORMAT: VERIFIED MMCIF / MARKDOWN / AUDIT BINDER
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
                <div className="space-y-2 p-4 border border-carbon bg-raw-paper-light">
                  <span className="font-bold text-signal-orange uppercase">[CH. 01 - 02]</span>
                  <h4 className="font-display font-bold text-sm uppercase text-carbon">
                    Context & Major Decisions
                  </h4>
                  <p className="font-sans text-xs text-carbon/70 leading-relaxed">
                    6-year chronological decision log: Phase II trial protocols, patent co-inventor declarations, and rejected clinical vendors.
                  </p>
                </div>

                <div className="space-y-2 p-4 border border-carbon bg-raw-paper-light">
                  <span className="font-bold text-signal-orange uppercase">[CH. 03 - 04]</span>
                  <h4 className="font-display font-bold text-sm uppercase text-carbon">
                    Obligations & Anomalies
                  </h4>
                  <p className="font-sans text-xs text-carbon/70 leading-relaxed">
                    $140,000 lab renewal resolution status, updated FDA Form 1572 filings, and signed IP assignment exhibits.
                  </p>
                </div>

                <div className="space-y-2 p-4 border border-carbon bg-raw-paper-light">
                  <span className="font-bold text-signal-orange uppercase">[CH. 05]</span>
                  <h4 className="font-display font-bold text-sm uppercase text-carbon">
                    First-Week Operational Blueprint
                  </h4>
                  <p className="font-sans text-xs text-carbon/70 leading-relaxed">
                    Hour-by-hour Day-1 to Day-7 schedule with key stakeholder contacts and compliance sign-offs.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Link href="/app/handovers">
                  <Button variant="primary" size="md">
                    Open Handover Dossier Studio →
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 07: FINAL CONVERSION CTA */}
        <section className="py-20 px-4 sm:px-6 bg-carbon text-raw-paper text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <span className="font-mono text-xs uppercase tracking-widest text-signal-orange font-bold">
              // PRODUCTION WORKSPACE ACTIVE
            </span>
            <h2 className="font-display font-black text-4xl sm:text-6xl uppercase tracking-tighter text-raw-paper leading-none">
              Protect your organization&rsquo;s next transition.
            </h2>
            <p className="max-w-xl mx-auto text-sm sm:text-base text-raw-paper/70 font-sans leading-relaxed">
              Deposit your institutional records, cross-examine hidden liabilities, and engineer verifiable handovers that survive any leadership departure.
            </p>
            <div className="pt-4 flex justify-center">
              <Link href="/app">
                <Button variant="signal" size="lg">
                  Enter Organizational Workspace
                  <IconArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
            <div className="pt-6 font-mono text-[10px] text-raw-paper/50 uppercase">
              LOCAL-FIRST ARCHITECTURE • PYTHON 3.12 BACKEND • SQLITE DOCKER CONTAINER
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
