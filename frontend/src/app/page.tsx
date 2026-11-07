"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { PublicNav } from "@/components/public/PublicNav";
import { PublicFooter } from "@/components/public/PublicFooter";
import { Button } from "@/components/ui/Button";
import { EvidenceBadge } from "@/components/evidence/EvidenceBadge";
import { IndustrialCursor } from "@/components/ui/IndustrialCursor";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { ContinuityTopologyRadar } from "@/components/public/ContinuityTopologyRadar";
import {
  IconArrowRight,
  IconDocument,
  IconShield,
  IconBrain,
  IconNetwork,
  IconCheck,
  IconAlert,
  IconFileText,
  IconDatabase,
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

type ArtifactStage = "DOCUMENTS" | "FACTS" | "DECISIONS" | "RESPONSIBILITIES" | "CONTINUITY";

interface StageInfo {
  id: ArtifactStage;
  label: string;
  tagline: string;
  count: string;
  example: string;
  evidence: string;
}

const STAGE_DETAILS: Record<ArtifactStage, StageInfo> = {
  DOCUMENTS: {
    id: "DOCUMENTS",
    label: "01 // INGESTION",
    tagline: "Cryptographic Archive Deposition",
    count: "10 DEPOSITED RECORDS",
    example: "Project Odyssey Launch Plan.txt, Aegis Transition Briefing.txt, Departure Charters",
    evidence: "SHA-256 integrity anchors • Local-first storage • Zero cloud retention",
  },
  FACTS: {
    id: "FACTS",
    label: "02 // TRIPLES",
    tagline: "Granular Knowledge Extraction",
    count: "32 VERIFIED TRIPLES",
    example: "Entity (Marcus Vance) → Relation (OWNS) → Entity (Project Odyssey)",
    evidence: "Every fact anchored to character offsets [char_start, char_end] in primary source",
  },
  DECISIONS: {
    id: "DECISIONS",
    label: "03 // RATIONALES",
    tagline: "Superseding & Amendment Tracking",
    count: "6 ADJUDICATED CHOICES",
    example: "Beta Launch postponed from Dec 15, 2026 to Feb 1, 2027 per infrastructure memo",
    evidence: "Temporal ordering prevents successors from acting on superseded roadmaps",
  },
  RESPONSIBILITIES: {
    id: "RESPONSIBILITIES",
    label: "04 // OWNERSHIP",
    tagline: "RACI & Infrastructure Custody",
    count: "14 ACTIVE RESPONSIBILITIES",
    example: "Elena Rostova (Odyssey Lead), Dr. Aris Thorne (Aegis Lead), Kubernetes Alpha-9",
    evidence: "Unassigned assets instantly flagged as critical institutional liabilities",
  },
  CONTINUITY: {
    id: "CONTINUITY",
    label: "05 // HANDOVER",
    tagline: "9-Chapter Boardroom Dossier",
    count: "100% COMPLETE DOSSIER",
    example: "Executive Briefing, Day 1-30 Roadmap, Ratified Decisions, Full Citations",
    evidence: "Grounded Q&A engine with strict refusal on unsupported institutional queries",
  },
};

export default function HomePage() {
  const [selectedRecordId, setSelectedRecordId] = useState<string>("rec-01");
  const [clarificationResolved, setClarificationResolved] = useState<boolean>(false);
  const [dossierGenerated, setDossierGenerated] = useState<boolean>(false);
  const [activeStage, setActiveStage] = useState<ArtifactStage>("DOCUMENTS");

  const activeDoc = DEMO_RECORDS.find((r) => r.id === selectedRecordId) || DEMO_RECORDS[0];
  const stageInfo = STAGE_DETAILS[activeStage];

  return (
    <div className="min-h-screen bg-raw-paper text-carbon flex flex-col selection:bg-signal-orange selection:text-raw-paper relative">
      <IndustrialCursor />
      <PublicNav />

      <main className="flex-1">
        {/* =========================================================================
            MASTER BLUEPRINT HERO FRAME — EXACT ALIGNMENT TO RELAY-BLOG-COVER.PNG
            ========================================================================= */}
        <section className="bg-raw-paper p-3 sm:p-5 lg:p-8 border-b-2 sm:border-b-[3px] border-carbon">
          <div className="max-w-7xl mx-auto border-2 sm:border-[3px] border-carbon bg-[#F6F3EC] shadow-[6px_6px_0px_#171717] relative">
            {/* Corner Crosshair Ticks */}
            <div className="absolute -top-2.5 -left-2.5 text-carbon font-mono text-sm font-black pointer-events-none select-none">
              +
            </div>
            <div className="absolute -top-2.5 -right-2.5 text-carbon font-mono text-sm font-black pointer-events-none select-none">
              +
            </div>
            <div className="absolute -bottom-2.5 -left-2.5 text-carbon font-mono text-sm font-black pointer-events-none select-none">
              +
            </div>
            <div className="absolute -bottom-2.5 -right-2.5 text-carbon font-mono text-sm font-black pointer-events-none select-none">
              +
            </div>

            {/* TOP UTILITY HEADER BAR */}
            <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b-2 sm:border-b-[3px] border-carbon bg-[#F6F3EC] flex flex-wrap items-center justify-between gap-3">
              {/* Brand Left */}
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-[#F15A24] border-2 border-carbon shadow-[1.5px_1.5px_0px_#171717]" />
                <span className="font-display font-black text-xl sm:text-2xl uppercase tracking-tighter text-carbon leading-none">
                  RELAY
                </span>
                <span className="font-mono text-[10px] sm:text-[11px] text-carbon/70 uppercase tracking-widest pl-1 sm:pl-2 font-bold">
                  // CONTINUITY PLATFORM
                </span>
              </div>

              {/* Status & Hackathon Badge Right */}
              <div className="flex items-center gap-2 sm:gap-3 font-mono text-[10px] sm:text-[11px]">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-carbon shadow-[1.5px_1.5px_0px_#171717]">
                  <span className="w-2 h-2 rounded-full bg-[#00C853] animate-pulse" />
                  <span className="font-bold text-carbon">LOCAL ENGINE :8000 LIVE</span>
                </div>
                <a
                  href="https://github.com/Amankumar0018/Relay"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-carbon text-white font-bold uppercase tracking-wider hover:bg-[#F15A24] transition-colors border border-carbon shadow-[1.5px_1.5px_0px_#171717]"
                >
                  FLIP THE SWITCH HACKATHON
                </a>
              </div>
            </div>

            {/* MAIN SPLIT-SCREEN BLUEPRINT (Left Editorial Narrative + Right Continuity Topology Radar) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
              {/* LEFT COLUMN: Editorial Value Proposition & Metrics */}
              <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between border-b-2 lg:border-b-0 lg:border-r-2 sm:lg:border-r-[3px] border-carbon bg-[#F6F3EC] space-y-6">
                <div className="space-y-5">
                  {/* Category Pill */}
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-carbon text-white text-[10px] sm:text-[11px] font-mono uppercase tracking-widest border border-carbon shadow-[1px_1px_0px_#000]">
                    <span className="w-2 h-2 bg-[#F15A24]" />
                    <span className="font-bold">ENGINEERING ARCHITECTURE &amp; BUILD REPORT</span>
                  </div>

                  {/* Massive Bold Headline matching reference 3-line layout */}
                  <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl lg:text-[40px] xl:text-[52px] uppercase tracking-tighter text-carbon leading-[0.92]">
                    <span className="block whitespace-nowrap">THE NEXT LEADER</span>
                    <span className="block whitespace-nowrap">SHOULDN&apos;T START</span>
                    <span className="block whitespace-nowrap text-[#F15A24]">FROM ZERO.</span>
                  </h1>

                  {/* Subtitle */}
                  <h2 className="font-display font-black text-xs sm:text-sm lg:text-base uppercase tracking-wider text-carbon">
                    AI-POWERED INSTITUTIONAL MEMORY &amp; LEADERSHIP CONTINUITY
                  </h2>

                  {/* Body Copy */}
                  <p className="text-xs sm:text-sm lg:text-[15px] text-carbon/85 font-sans leading-relaxed max-w-xl">
                    Building an evidence-grounded institutional continuity engine with FastMCP, Switch, and Gemini to reconstruct organizational knowledge, unmask hidden liabilities, and synthesize verifiable handovers.
                  </p>

                  {/* Interactive Pipeline Bar */}
                  <div className="p-2 sm:p-2.5 bg-white border-2 border-carbon shadow-brutal flex flex-wrap items-center justify-between gap-1 text-[10px] sm:text-[11px] font-mono font-bold">
                    {[
                      { id: "DOCUMENTS", code: "01", label: "DOCUMENTS" },
                      { id: "FACTS", code: "02", label: "TRIPLES" },
                      { id: "DECISIONS", code: "03", label: "DECISIONS" },
                      { id: "RESPONSIBILITIES", code: "04", label: "OWNERSHIP" },
                      { id: "CONTINUITY", code: "05", label: "CONTINUITY" },
                    ].map((step, idx) => (
                      <button
                        key={step.id}
                        onClick={() => setActiveStage(step.id as ArtifactStage)}
                        className={`flex items-center gap-1 px-1.5 py-0.5 uppercase transition-colors ${
                          activeStage === step.id
                            ? "text-[#F15A24] font-black underline underline-offset-4"
                            : "text-carbon/70 hover:text-carbon"
                        }`}
                      >
                        <span>
                          {step.code} {step.label}
                        </span>
                        {idx < 4 && <span className="text-carbon/40 ml-1">▶</span>}
                      </button>
                    ))}
                  </div>

                  {/* Action CTAs */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Link href="/app">
                      <Button
                        variant="signal"
                        size="md"
                        magnetic={true}
                        data-cursor="WORKSPACE"
                        className="px-5 py-2.5 text-xs sm:text-sm font-mono font-bold uppercase tracking-wider"
                      >
                        Enter Workspace
                        <IconArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>

                    <Link href="/platform">
                      <Button
                        variant="outline"
                        size="md"
                        magnetic={true}
                        data-cursor="PLATFORM"
                        className="px-5 py-2.5 text-xs sm:text-sm font-mono font-bold uppercase tracking-wider"
                      >
                        Explore Platform
                      </Button>
                    </Link>

                    <Link href="/docs/blog/relay-technical-build-story.md" target="_blank">
                      <Button
                        variant="secondary"
                        size="md"
                        magnetic={true}
                        className="px-4 py-2.5 text-xs sm:text-sm font-mono font-bold uppercase tracking-wider"
                      >
                        Build Story
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Bottom Three Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t-2 border-carbon/20">
                  <div className="p-3 bg-white border-2 border-carbon shadow-brutal space-y-1">
                    <span className="font-mono text-[9px] text-[#F15A24] font-bold block uppercase tracking-wider">
                      01 // AUTOMATION QA
                    </span>
                    <div className="font-display font-black text-lg sm:text-xl uppercase text-carbon leading-none">
                      229 VERIFIED TESTS
                    </div>
                    <p className="font-mono text-[10px] text-carbon/70 leading-tight">
                      Pytest Suite • 0 Failures
                    </p>
                  </div>

                  <div className="p-3 bg-white border-2 border-carbon shadow-brutal space-y-1">
                    <span className="font-mono text-[9px] text-[#F15A24] font-bold block uppercase tracking-wider">
                      02 // MCP PROTOCOL
                    </span>
                    <div className="font-display font-black text-lg sm:text-xl uppercase text-carbon leading-none">
                      5 FASTMCP TOOLS
                    </div>
                    <p className="font-mono text-[10px] text-carbon/70 leading-tight">
                      Switch &amp; OpenCode Integration
                    </p>
                  </div>

                  <div className="p-3 bg-white border-2 border-carbon shadow-brutal space-y-1">
                    <span className="font-mono text-[9px] text-[#F15A24] font-bold block uppercase tracking-wider">
                      03 // DELIVERABLE
                    </span>
                    <div className="font-display font-black text-lg sm:text-xl uppercase text-carbon leading-none">
                      9-CHAPTER DOSSIER
                    </div>
                    <p className="font-mono text-[10px] text-carbon/70 leading-tight">
                      Day 1–30 Operational Roadmap
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: The Continuity Topology Radar */}
              <div className="lg:col-span-5 bg-[#111111] flex flex-col justify-between">
                <ContinuityTopologyRadar activeStage={activeStage} />
              </div>
            </div>

            {/* MASTER FRAME BOTTOM FOOTER BAR */}
            <div className="border-t-2 sm:border-t-[3px] border-carbon bg-[#F6F3EC] px-4 py-2.5 sm:px-6 font-mono text-[10px] sm:text-[11px] text-carbon/80 flex flex-col md:flex-row items-center justify-between gap-2">
              <div>
                <span className="font-bold text-carbon">TRACK: </span>
                <span>BEST BUSINESS WORKFLOW // FLIP THE SWITCH HACKATHON 2026</span>
              </div>
              <div className="hidden lg:block text-carbon/70 font-bold">
                AUTHOR: AMAN KUMAR // FULL-STACK &amp; SYSTEMS ARCHITECT
              </div>
              <div>
                <span className="font-bold text-carbon">GITHUB: </span>
                <a
                  href="https://github.com/Amankumar0018/Relay"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#F15A24] font-bold hover:underline"
                >
                  GITHUB.COM/AMANKUMAR0018/RELAY
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1: ORGANIZATIONS FORGET */}
        <section className="border-b-2 border-carbon bg-raw-paper-light py-16 px-4 sm:px-8 lg:px-12">
          <ScrollReveal variant="industrial">
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-carbon pb-6">
                <div>
                  <span className="font-mono text-xs uppercase tracking-widest text-signal-orange font-bold block mb-1">
                    SECTION 01 // THE INSTITUTIONAL VULNERABILITY
                  </span>
                  <h2 className="font-display font-black text-3xl sm:text-4xl uppercase tracking-tight text-carbon">
                    Organizations forget.
                  </h2>
                </div>
                <p className="max-w-md text-xs sm:text-sm text-carbon/80 font-sans leading-relaxed">
                  When key leaders depart, corporate memory fragments across buried files and unrecorded conversations. Successors inherit blind spots, hidden liabilities, and lost rationales.
                </p>
              </div>

              {/* 4 Brutalist Problem Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 border-2 border-carbon bg-raw-paper space-y-2.5 shadow-brutal hover:-translate-y-0.5 transition-transform">
                  <span className="font-mono text-[11px] font-bold text-signal-orange uppercase">
                    01 // BURIED RECORDS
                  </span>
                  <h3 className="font-display font-black text-base uppercase text-carbon">
                    Buried In Binders
                  </h3>
                  <p className="text-xs text-carbon/80 leading-relaxed font-sans">
                    Vital commitments hide in hundred-page contract amendments and chat channels that no one reads until a costly breach occurs.
                  </p>
                </div>

                <div className="p-5 border-2 border-carbon bg-raw-paper space-y-2.5 shadow-brutal hover:-translate-y-0.5 transition-transform">
                  <span className="font-mono text-[11px] font-bold text-signal-orange uppercase">
                    02 // LOST RATIONALES
                  </span>
                  <h3 className="font-display font-black text-base uppercase text-carbon">
                    Vanishing Context
                  </h3>
                  <p className="text-xs text-carbon/80 leading-relaxed font-sans">
                    Why an architecture was chosen or a vendor rejected is never formally captured, causing successors to repeat costly missteps.
                  </p>
                </div>

                <div className="p-5 border-2 border-carbon bg-raw-paper space-y-2.5 shadow-brutal hover:-translate-y-0.5 transition-transform">
                  <span className="font-mono text-[11px] font-bold text-signal-orange uppercase">
                    03 // SILENT DEADLINES
                  </span>
                  <h3 className="font-display font-black text-base uppercase text-carbon">
                    Invisible Clauses
                  </h3>
                  <p className="text-xs text-carbon/80 leading-relaxed font-sans">
                    Auto-renewing six-figure SaaS agreements and vendor contracts trigger unprompted with no assigned successor aware of cancellation windows.
                  </p>
                </div>

                <div className="p-5 border-2 border-carbon bg-signal-orange text-raw-paper space-y-2.5 shadow-brutal hover:-translate-y-0.5 transition-transform">
                  <span className="font-mono text-[11px] font-bold text-carbon uppercase">
                    04 // ORPHANED ASSETS
                  </span>
                  <h3 className="font-display font-black text-base uppercase text-raw-paper">
                    Split Authority
                  </h3>
                  <p className="text-xs text-raw-paper/90 leading-relaxed font-sans">
                    Critical infrastructure like Kubernetes cluster Alpha-9 is left without an assigned owner or steward, creating immediate operational vulnerabilities.
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* SECTION 2: RELAY CONNECTS THE RECORD */}
        <section className="border-b-2 border-carbon py-16 px-4 sm:px-8 lg:px-12 bg-raw-paper">
          <ScrollReveal variant="editorial">
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="space-y-2">
                <span className="font-mono text-xs uppercase tracking-widest text-signal-orange font-bold block">
                  SECTION 02 // INGESTION &amp; EXTRACTION ENGINE
                </span>
                <h2 className="font-display font-black text-3xl sm:text-4xl uppercase tracking-tight text-carbon">
                  Relay connects the record.
                </h2>
                <p className="text-xs sm:text-sm text-carbon/80 font-sans max-w-xl leading-relaxed">
                  Relay ingests raw institutional archives, verifies cryptographic hashes, and maps people, assets, decisions, and dates into an interconnected topological graph.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-0 border-2 border-carbon divide-y md:divide-y-0 md:divide-x-2 divide-carbon bg-raw-paper-light shadow-brutal">
                <div className="p-4 space-y-2">
                  <span className="font-mono text-[11px] text-carbon/60 font-bold block">STAGE 01</span>
                  <h3 className="font-display font-bold text-sm uppercase text-carbon">
                    Deposit
                  </h3>
                  <p className="text-xs text-carbon/80 leading-relaxed font-sans">
                    Ingests PDF, DOCX, TXT archives with local SHA-256 cryptographic verification.
                  </p>
                </div>

                <div className="p-4 space-y-2">
                  <span className="font-mono text-[11px] text-carbon/60 font-bold block">STAGE 02</span>
                  <h3 className="font-display font-bold text-sm uppercase text-carbon">
                    Extract
                  </h3>
                  <p className="text-xs text-carbon/80 leading-relaxed font-sans">
                    Identifies people, monetary thresholds, dates, and verbatim character offsets.
                  </p>
                </div>

                <div className="p-4 space-y-2 bg-concrete/40">
                  <span className="font-mono text-[11px] text-signal-orange font-bold block">STAGE 03</span>
                  <h3 className="font-display font-bold text-sm uppercase text-carbon">
                    Cross-Examine
                  </h3>
                  <p className="text-xs text-carbon/80 leading-relaxed font-sans">
                    Detects contradictory dates, superseded roadmaps, and unassigned infrastructure.
                  </p>
                </div>

                <div className="p-4 space-y-2">
                  <span className="font-mono text-[11px] text-carbon/60 font-bold block">STAGE 04</span>
                  <h3 className="font-display font-bold text-sm uppercase text-carbon">
                    Switch Gate
                  </h3>
                  <p className="text-xs text-carbon/80 leading-relaxed font-sans">
                    Authenticated humans review, approve, or clarify flagged anomalies before decisions lock.
                  </p>
                </div>

                <div className="p-4 space-y-2 bg-carbon text-raw-paper">
                  <span className="font-mono text-[11px] text-signal-orange font-bold block">STAGE 05</span>
                  <h3 className="font-display font-bold text-sm uppercase text-raw-paper">
                    Continuity
                  </h3>
                  <p className="text-xs text-raw-paper/80 leading-relaxed font-sans">
                    Synthesizes executive briefing, 30-day roadmap, and line-item responsibilities.
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* SECTION 3: NOT JUST WHAT HAPPENED. WHAT NO LONGER ADDS UP */}
        <section className="border-b-2 border-carbon py-16 px-4 sm:px-8 lg:px-12 bg-concrete/30">
          <div className="max-w-6xl mx-auto space-y-8">
            <ScrollReveal variant="industrial">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-signal-orange text-raw-paper font-mono text-[10px] uppercase font-bold border border-carbon">
                    SECTION 03 // ADVERSARIAL DISCOVERY
                  </div>
                  <h2 className="font-display font-black text-2xl sm:text-4xl uppercase tracking-tight text-carbon mt-2">
                    Not just what happened. What no longer adds up.
                  </h2>
                  <p className="font-mono text-xs text-carbon/70 uppercase mt-1">
                    RELAY CROSS-EXAMINES DOCUMENTS TO EXPOSE CONFLICTS, GAPS, AND UNASSIGNED LIABILITIES
                  </p>
                </div>

                <div className="font-mono text-[11px] text-carbon bg-raw-paper p-2.5 border-2 border-carbon shadow-brutal">
                  SELECT RECORD → INSPECT CITATIONS → RESOLVE → GENERATE
                </div>
              </div>
            </ScrollReveal>

            {/* Main Interactive Stage Box */}
            <div className="border-2 border-carbon bg-raw-paper-light shadow-brutal-lg">
              {/* Record Selector Strip */}
              <div className="border-b-2 border-carbon bg-raw-paper p-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] font-bold uppercase text-carbon/70 mr-1">
                    SELECT RECORD:
                  </span>
                  {DEMO_RECORDS.map((rec) => (
                    <button
                      key={rec.id}
                      onClick={() => {
                        setSelectedRecordId(rec.id);
                        setClarificationResolved(false);
                      }}
                      data-cursor="INSPECT"
                      className={`px-3 py-1 text-xs font-mono uppercase font-bold border transition-all ${
                        selectedRecordId === rec.id
                          ? "bg-carbon text-raw-paper border-carbon shadow-brutal"
                          : "bg-raw-paper-light text-carbon border-carbon/40 hover:border-carbon hover:bg-concrete/40"
                      }`}
                    >
                      [{rec.code}]
                    </button>
                  ))}
                </div>

                <span className="font-mono text-xs text-signal-orange font-bold uppercase">
                  ACTIVE CASE ARCHIVE
                </span>
              </div>

              {/* Split-Screen Inspector Body with AnimatePresence */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeDoc.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
                  className="grid grid-cols-1 lg:grid-cols-12 min-h-[420px]"
                >
                  {/* Left Panel: Primary Record & Verbatim Citation */}
                  <div className="lg:col-span-6 p-6 border-b-2 lg:border-b-0 lg:border-r-2 border-carbon space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase px-2 py-0.5 bg-carbon text-raw-paper font-bold">
                        {activeDoc.category}
                      </span>
                      <span className="font-mono text-xs text-carbon/60">
                        {activeDoc.evidenceSource}
                      </span>
                    </div>

                    <h3 className="font-display font-black text-lg uppercase text-carbon">
                      {activeDoc.title}
                    </h3>

                    <div className="space-y-1.5">
                      <span className="font-mono text-[10px] uppercase font-bold text-carbon/60">
                        ARCHIVAL EXCERPT:
                      </span>
                      <blockquote className="p-3.5 bg-raw-paper border-l-4 border-signal-orange font-mono text-xs text-carbon leading-relaxed shadow-brutal">
                        &ldquo;{activeDoc.excerpt}&rdquo;
                      </blockquote>
                    </div>

                    <div className="space-y-2 pt-1">
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
                  <div className="lg:col-span-6 p-6 bg-raw-paper flex flex-col justify-between space-y-5">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-carbon/20 pb-3">
                        <span className="font-mono text-xs font-bold uppercase text-carbon">
                          CONTINUITY CROSS-EXAMINATION
                        </span>
                        {activeDoc.anomalyDetected ? (
                          <EvidenceBadge status={activeDoc.anomalyDetected.type} />
                        ) : (
                          <EvidenceBadge status="evidence-backed" />
                        )}
                      </div>

                      {activeDoc.anomalyDetected ? (
                        <div className="p-4 border-2 border-carbon bg-raw-paper-light space-y-3 shadow-brutal">
                          <div className="flex items-center gap-2">
                            <IconAlert size={16} className="text-signal-orange shrink-0" />
                            <h4 className="font-display font-black text-sm uppercase text-carbon">
                              {activeDoc.anomalyDetected.title}
                            </h4>
                          </div>

                          <p className="font-sans text-xs text-carbon/90 leading-relaxed">
                            {activeDoc.anomalyDetected.description}
                          </p>

                          <div className="p-2.5 bg-signal-orange/10 border border-signal-orange font-mono text-xs text-signal-orange font-bold">
                            ACTION REQUIRED: {activeDoc.anomalyDetected.actionRequired}
                          </div>

                          {/* Interactive Clarification Action Button */}
                          <div className="pt-1">
                            {clarificationResolved ? (
                              <div className="p-2.5 bg-industrial-green text-raw-paper font-mono text-xs flex items-center justify-between border border-carbon font-bold">
                                <span>STATUS: RESOLVED VIA SWITCH (HUMAN-VERIFIED)</span>
                                <IconCheck size={16} />
                              </div>
                            ) : (
                              <Button
                                variant="signal"
                                size="sm"
                                className="w-full"
                                magnetic={true}
                                data-cursor="RESOLVE"
                                onClick={() => setClarificationResolved(true)}
                              >
                                Resolve Anomaly via Switch Gate
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 border border-carbon bg-raw-paper-light space-y-2">
                          <span className="font-mono text-xs font-bold text-industrial-green block">
                            NO ANOMALIES DETECTED
                          </span>
                          <p className="text-xs text-carbon/80 font-sans leading-relaxed">
                            All signatories and responsibilities in this record match existing operational records.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Generate Sample Handover Dossier Action */}
                    <div className="pt-4 border-t-2 border-carbon/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs uppercase font-bold text-carbon">
                          DOSSIER COMPILATION
                        </span>
                        <Button
                          variant={dossierGenerated ? "secondary" : "primary"}
                          size="sm"
                          magnetic={true}
                          onClick={() => setDossierGenerated(true)}
                        >
                          {dossierGenerated ? "Regenerate Dossier" : "Compile Handover Dossier"}
                        </Button>
                      </div>

                      {dossierGenerated && (
                        <div className="p-3 bg-carbon text-raw-paper font-mono text-xs border border-carbon space-y-2 shadow-brutal">
                          <div className="flex items-center justify-between text-signal-orange font-bold">
                            <span>// HANDOVER DOSSIER READY: ACME-CSO-2026</span>
                            <span>CHAPTERS: 9</span>
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
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* SECTION 4: CONTINUITY IS THE DELIVERABLE */}
        <section className="border-b-2 border-carbon py-16 px-4 sm:px-8 lg:px-12 bg-raw-paper-light">
          <ScrollReveal variant="industrial">
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="space-y-2">
                <span className="font-mono text-xs uppercase tracking-widest text-signal-orange font-bold block">
                  SECTION 04 // THE CONTINUITY DELIVERABLE
                </span>
                <h2 className="font-display font-black text-3xl sm:text-4xl uppercase tracking-tight text-carbon">
                  Continuity is the deliverable.
                </h2>
                <p className="text-xs sm:text-sm text-carbon/80 font-sans max-w-xl leading-relaxed">
                  Relay turns months of fragmented records into an authoritative Nine-Chapter Handover Dossier with grounded citations, Day-1 roadmaps, and honest insufficient-evidence refusals.
                </p>
              </div>

              <div className="border-2 border-carbon bg-raw-paper p-6 sm:p-8 space-y-6 shadow-brutal">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-carbon pb-4">
                  <div>
                    <span className="font-mono text-[10px] uppercase font-bold text-signal-orange">
                      MASTER BRIEFING BOOK
                    </span>
                    <h3 className="font-display font-black text-lg sm:text-xl uppercase text-carbon mt-0.5">
                      Acme BioSystems Chief Scientific Officer Transition
                    </h3>
                  </div>
                  <div className="font-mono text-[11px] text-carbon/70 uppercase">
                    EXPORT FORMATS: MARKDOWN • JSON • PRINT BINDER
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-2 p-4 border border-carbon bg-raw-paper-light shadow-brutal">
                    <span className="font-mono font-bold text-signal-orange uppercase text-[10px] block">[CH. 01 - 03]</span>
                    <h4 className="font-display font-black text-sm uppercase text-carbon">
                      Context & Decisions
                    </h4>
                    <p className="font-sans text-xs text-carbon/80 leading-relaxed">
                      Complete decision log: Phase II trial protocols, patent co-inventor declarations, and active projects.
                    </p>
                  </div>

                  <div className="space-y-2 p-4 border border-carbon bg-raw-paper-light shadow-brutal">
                    <span className="font-mono font-bold text-signal-orange uppercase text-[10px] block">[CH. 04 - 06]</span>
                    <h4 className="font-display font-black text-sm uppercase text-carbon">
                      Obligations & Conflicts
                    </h4>
                    <p className="font-sans text-xs text-carbon/80 leading-relaxed">
                      $140,000 lab renewal resolution status, FDA Form 1572 filings, and ratified claims.
                    </p>
                  </div>

                  <div className="space-y-2 p-4 border border-carbon bg-raw-paper-light shadow-brutal">
                    <span className="font-mono font-bold text-signal-orange uppercase text-[10px] block">[CH. 07 - 09]</span>
                    <h4 className="font-display font-black text-sm uppercase text-carbon">
                      Roadmap & Citations
                    </h4>
                    <p className="font-sans text-xs text-carbon/80 leading-relaxed">
                      First-month operational blueprint with key stakeholder contacts and cryptographic citation indices.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Link href="/app/handovers">
                    <Button variant="primary" size="sm" magnetic={true}>
                      Open Handover Dossier Studio →
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* SECTION 5: LEAVE KNOWLEDGE, NOT JUST DOCUMENTS */}
        <section className="py-16 px-4 sm:px-8 lg:px-12 bg-carbon text-raw-paper text-center">
          <ScrollReveal variant="editorial">
            <div className="max-w-3xl mx-auto space-y-6">
              <span className="font-mono text-[10px] uppercase tracking-widest text-signal-orange font-bold block">
                SECTION 05 // SYSTEM COMPLETION &amp; ONBOARDING
              </span>
              <h2 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tighter text-raw-paper leading-tight">
                Leave knowledge, not just documents.
              </h2>
              <p className="max-w-xl mx-auto text-xs sm:text-sm text-raw-paper/80 font-sans leading-relaxed">
                Deposit your institutional records, cross-examine hidden liabilities, and synthesize verifiable handovers that survive any leadership departure.
              </p>
              <div className="pt-4 flex justify-center">
                <Link href="/app">
                  <Button variant="signal" size="md" magnetic={true} data-cursor="WORKSPACE" className="px-6 py-2.5 text-sm">
                    Enter Organizational Workspace
                    <IconArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <div className="pt-6 font-mono text-[10px] text-raw-paper/50 uppercase">
                LOCAL-FIRST ARCHITECTURE • FASTAPI PYTHON 3.12 BACKEND • SQLITE DOCKER CONTAINER
              </div>
            </div>
          </ScrollReveal>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}