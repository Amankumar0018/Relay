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
  IconUser,
  IconDatabase,
} from "@/components/ui/Icons";

interface DemoCase {
  id: string;
  name: string;
  role: string;
  organization: string;
  situation: string;
  recordsCount: number;
  identifiedGaps: number;
  evidenceItems: {
    title: string;
    status: "evidence-backed" | "human-verified" | "inferred" | "missing" | "conflicting" | "pending-review";
    source: string;
    excerpt: string;
    analysis: string;
  }[];
}

const DEMO_CASES: DemoCase[] = [
  {
    id: "acme-cso",
    name: "Dr. Eleanor Vance",
    role: "Chief Scientific Officer",
    organization: "Acme BioSystems",
    situation: "Stepping down after 6 years to accept university tenure. Oversight over 3 Phase II oncology trials and FDA IND filings.",
    recordsCount: 42,
    identifiedGaps: 3,
    evidenceItems: [
      {
        title: "FDA Form 1572 Principal Investigator Sign-Off",
        status: "conflicting",
        source: "Regulatory-Audit-Q3-2024.pdf (Page 14, Line 3)",
        excerpt: "Section 4.1 specifies Dr. Vance as primary sponsor representative; however, Vendor MSA Amendment 3 names Dr. Marcus Thorne.",
        analysis: "Direct contradiction between regulatory trial registry and vendor lab execution contract. Unresolved PI change risks clinical hold.",
      },
      {
        title: "Spectrometry Lab Service Agreement Renewals",
        status: "evidence-backed",
        source: "Vendor-Master-Agreement-2023.docx (Section 8.2)",
        excerpt: "Automatic 12-month extension activates on November 15, 2024 unless written opt-out provided 30 days prior.",
        analysis: "Obligation verified. $140,000 auto-renewal commitment requires formal CFO authorization before October 15.",
      },
      {
        title: "Compound C-409 Intellectual Property Assignment",
        status: "missing",
        source: "Patent-Filing-Memo-RevB.pdf (Exhibit C)",
        excerpt: "Referenced Exhibit C (Co-inventor assignment declaration) absent from archival binder.",
        analysis: "Critical chain-of-title gap. Incoming CSO cannot file European counterpart without signed original declaration.",
      },
    ],
  },
  {
    id: "fintech-vp",
    name: "Arthur Pendelton",
    role: "VP Infrastructure & Security",
    organization: "Kite Financial Technologies",
    situation: "Sudden medical sabbatical during PCI-DSS Level 1 recertification and multi-cloud migration.",
    recordsCount: 78,
    identifiedGaps: 5,
    evidenceItems: [
      {
        title: "HSM Master Encryption Key Sharding Protocol",
        status: "human-verified",
        source: "SecOps-KMS-Runbook-v4.docx (Appendix B)",
        excerpt: "Physical safe combination held in escrow with Chief Legal Counsel; 2 of 3 cryptographic M-of-N keys verified.",
        analysis: "Verified by Legal Counsel on Oct 2. Ceremony documentation matches production vault status.",
      },
      {
        title: "Swift Payment Gateway Fallback Routing",
        status: "inferred",
        source: "Architecture-Review-Meeting-Notes.txt",
        excerpt: "Team discussed failover route B via Frankfurt datacenter, but no production DNS health check config found.",
        analysis: "Inferred architectural expectation without operational verification. Potential payment stall during EU outage.",
      },
    ],
  },
];

export default function PublicHomePage() {
  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0);
  const [activeEvidenceIndex, setActiveEvidenceIndex] = useState(0);
  const activeCase = DEMO_CASES[selectedCaseIndex];
  const activeItem = activeCase.evidenceItems[activeEvidenceIndex] || activeCase.evidenceItems[0];

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink selection:bg-copper-light selection:text-ink">
      <PublicNav />

      <main className="flex-1">
        {/* Editorial Masthead Hero */}
        <section className="border-b border-rule pt-20 pb-16 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-paper-surface border border-rule rounded-sm text-[11px] font-sans uppercase tracking-widest text-ink-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-olive animate-pulse" />
              Organizational Continuity Platform
            </div>

            <h1 className="font-serif italic text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-ink leading-[1.08]">
              Every organization has a memory.
              <br />
              <span className="not-italic font-normal text-ink-secondary block mt-2 text-3xl sm:text-5xl lg:text-6xl font-serif">
                Make sure it survives.
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-base sm:text-lg text-ink-secondary leading-relaxed font-sans font-light">
              Relay connects organizational records, decisions, and responsibilities to preserve the institutional context required for every critical transition.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/app">
                <Button variant="primary" size="lg" className="w-full sm:w-auto text-sm px-6">
                  Enter Organizational Workspace
                  <IconArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-sm">
                  The Continuity Methodology
                </Button>
              </Link>
            </div>

            <div className="pt-8 flex items-center justify-center gap-8 text-[11px] uppercase tracking-wider text-ink-disabled font-sans border-t border-rule/60 max-w-xl mx-auto">
              <span>Local-First SQLite Engine</span>
              <span>•</span>
              <span>Python 3.12 Backend</span>
              <span>•</span>
              <span>Zero Document Leakage</span>
            </div>
          </div>
        </section>

        {/* The Institutional Problem: The Transition Fracture */}
        <section className="py-16 px-4 sm:px-6 border-b border-rule bg-paper-surface">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              <div className="md:col-span-5 space-y-3">
                <p className="text-[11px] font-sans uppercase tracking-widest text-copper font-medium">
                  The Institutional Vulnerability
                </p>
                <h2 className="font-serif italic text-2xl sm:text-3xl font-bold text-ink leading-snug">
                  What actually happens when a leader leaves?
                </h2>
                <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                  Organizational memory rarely resides in clean Notion databases. It lives in fragmented vendor amendments, unrecorded email threads, and oral commitments.
                </p>
              </div>

              <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-paper p-4">
                  <span className="text-[10px] font-mono uppercase text-copper font-medium tracking-wider">
                    01. Evaporated Context
                  </span>
                  <h3 className="font-serif font-bold text-sm text-ink mt-1">
                    Unwritten Rationales
                  </h3>
                  <p className="text-xs text-ink-secondary mt-1.5 leading-relaxed">
                    The rationale behind why a critical partner was rejected or a regulatory waiver requested is lost, leaving successors to repeat past failures.
                  </p>
                </Card>

                <Card className="bg-paper p-4">
                  <span className="text-[10px] font-mono uppercase text-copper font-medium tracking-wider">
                    02. Silent Obligations
                  </span>
                  <h3 className="font-serif font-bold text-sm text-ink mt-1">
                    Hidden Liabilities
                  </h3>
                  <p className="text-xs text-ink-secondary mt-1.5 leading-relaxed">
                    Auto-renewing six-figure SaaS contracts, compliance filings, and clinical trial renewals trigger with no assigned successor aware of the deadline.
                  </p>
                </Card>

                <Card className="bg-paper p-4">
                  <span className="text-[10px] font-mono uppercase text-copper font-medium tracking-wider">
                    03. Contradictory Authority
                  </span>
                  <h3 className="font-serif font-bold text-sm text-ink mt-1">
                    Split Mandates
                  </h3>
                  <p className="text-xs text-ink-secondary mt-1.5 leading-relaxed">
                    Board resolutions clash with operational agreements. When two documents designate different decision-makers, projects freeze indefinitely.
                  </p>
                </Card>

                <Card className="bg-paper p-4">
                  <span className="text-[10px] font-mono uppercase text-copper font-medium tracking-wider">
                    04. Superficial Handovers
                  </span>
                  <h3 className="font-serif font-bold text-sm text-ink mt-1">
                    Static Handover Memos
                  </h3>
                  <p className="text-xs text-ink-secondary mt-1.5 leading-relaxed">
                    Rushed two-page farewell notes drafted during the final 48 hours provide zero verifiable citations, leaving teams disoriented.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Demonstration: The Archival Continuity Inspector */}
        <section className="py-20 px-4 sm:px-6 border-b border-rule">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-sans uppercase tracking-widest text-olive font-medium">
                  Interactive Live Verification
                </p>
                <h2 className="font-serif italic text-3xl sm:text-4xl font-bold text-ink mt-1">
                  Examine how Relay cross-examines evidence
                </h2>
                <p className="text-xs sm:text-sm text-ink-secondary mt-2 max-w-xl">
                  Select a live transition scenario below to inspect how Relay ingests raw records, extracts conflicting evidence, and generates actionable resolution briefs.
                </p>
              </div>

              {/* Scenario Selector Tabs */}
              <div className="flex items-center gap-2 p-1 bg-paper-secondary border border-rule rounded-sm self-start">
                {DEMO_CASES.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedCaseIndex(idx);
                      setActiveEvidenceIndex(0);
                    }}
                    className={`px-3 py-1.5 text-xs font-sans rounded-xs transition-colors ${
                      selectedCaseIndex === idx
                        ? "bg-paper-surface text-ink font-semibold shadow-xs"
                        : "text-ink-secondary hover:text-ink"
                    }`}
                  >
                    {item.role}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Stage Card */}
            <Card className="border-rule bg-paper-surface overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-rule bg-paper flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-serif italic text-lg font-bold text-ink">
                      {activeCase.name}
                    </span>
                    <span className="text-xs text-ink-secondary">
                      ({activeCase.role}, {activeCase.organization})
                    </span>
                  </div>
                  <p className="text-xs text-ink-secondary">
                    {activeCase.situation}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-sans">
                  <div className="px-3 py-1 rounded-sm bg-paper-secondary border border-rule">
                    <span className="text-ink font-bold">{activeCase.recordsCount}</span> records processed
                  </div>
                  <div className="px-3 py-1 rounded-sm bg-copper-light border border-copper-border text-copper">
                    <span className="font-bold">{activeCase.identifiedGaps}</span> knowledge anomalies
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[380px]">
                {/* Left: Identified Evidence & Anomalies List */}
                <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-rule p-4 space-y-2 bg-paper/50">
                  <p className="text-[10px] font-sans uppercase tracking-wider text-ink-secondary font-medium px-2 py-1">
                    Detected Evidence Items ({activeCase.evidenceItems.length})
                  </p>
                  <div className="space-y-1.5">
                    {activeCase.evidenceItems.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveEvidenceIndex(idx)}
                        className={`w-full text-left p-3 rounded-sm border transition-all text-xs ${
                          activeEvidenceIndex === idx
                            ? "bg-paper-surface border-ink/40 shadow-xs"
                            : "bg-paper border-rule hover:border-ink/20 text-ink-secondary"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="font-medium text-ink leading-snug">
                            {item.title}
                          </span>
                          <EvidenceBadge status={item.status} size="sm" />
                        </div>
                        <p className="text-[11px] text-ink-secondary font-mono truncate">
                          {item.source}
                        </p>
                      </button>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-rule mt-4 px-2">
                    <p className="text-[11px] text-ink-secondary leading-relaxed">
                      Every statement in Relay links to a verifiable page and paragraph in the institutional archive.
                    </p>
                  </div>
                </div>

                {/* Right: Verbatim Evidence & Cross-Examination View */}
                <div className="lg:col-span-7 p-6 space-y-6 bg-paper-surface flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-rule">
                      <div>
                        <h4 className="font-serif font-bold text-base text-ink">
                          {activeItem.title}
                        </h4>
                        <p className="text-xs text-ink-secondary font-mono mt-0.5">
                          Source Document: {activeItem.source}
                        </p>
                      </div>
                      <EvidenceBadge status={activeItem.status} />
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-sans uppercase tracking-wider text-ink-secondary font-medium block">
                        Archived Verbatim Excerpt
                      </span>
                      <blockquote className="p-3 bg-paper border-l-2 border-copper text-xs italic text-ink font-serif leading-relaxed">
                        &ldquo;{activeItem.excerpt}&rdquo;
                      </blockquote>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-sans uppercase tracking-wider text-ink-secondary font-medium block">
                        Continuity Detective Analysis
                      </span>
                      <div className="p-3.5 bg-paper-secondary border border-rule rounded-sm text-xs text-ink leading-relaxed">
                        {activeItem.analysis}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-rule flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <span className="text-ink-secondary text-[11px]">
                      Ready to resolve this item in the live investigation desk?
                    </span>
                    <Link href="/app/investigations">
                      <Button variant="primary" size="sm">
                        Open Investigation Desk
                        <IconArrowRight className="ml-1.5 w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* The 4 Collaborative Agents System */}
        <section className="py-20 px-4 sm:px-6 border-b border-rule bg-paper-secondary/40">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <p className="text-[11px] font-sans uppercase tracking-widest text-copper font-medium">
                Autonomous Precision × Human Oversight
              </p>
              <h2 className="font-serif italic text-3xl sm:text-4xl font-bold text-ink">
                Four specialized agents engineered for transitions
              </h2>
              <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                Relay replaces generic conversational models with a deterministic four-stage analytical pipeline governed by human verification gates.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-5 bg-paper space-y-3">
                <div className="w-8 h-8 rounded-sm bg-olive-light border border-olive-border flex items-center justify-center text-olive font-mono text-xs font-bold">
                  01
                </div>
                <h3 className="font-serif font-bold text-base text-ink">
                  Knowledge Extractor
                </h3>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Ingests messy documents, board minutes, and charters. Parses structured entities, key dates, monetary commitments, and reporting lines.
                </p>
                <div className="pt-3 border-t border-rule text-[11px] font-mono text-ink-secondary">
                  Output: Entity graph & direct citation index
                </div>
              </Card>

              <Card className="p-5 bg-paper space-y-3">
                <div className="w-8 h-8 rounded-sm bg-copper-light border border-copper-border flex items-center justify-center text-copper font-mono text-xs font-bold">
                  02
                </div>
                <h3 className="font-serif font-bold text-base text-ink">
                  Continuity Detective
                </h3>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Cross-examines ingested records to uncover conflicting authorities, missing signatory documents, and ambiguous project handoffs.
                </p>
                <div className="pt-3 border-t border-rule text-[11px] font-mono text-ink-secondary">
                  Output: Ranked anomalies & contradictory citations
                </div>
              </Card>

              <Card className="p-5 bg-paper space-y-3">
                <div className="w-8 h-8 rounded-sm bg-paper-secondary border border-rule flex items-center justify-center text-ink font-mono text-xs font-bold">
                  03
                </div>
                <h3 className="font-serif font-bold text-base text-ink">
                  Responsibility Analyst
                </h3>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Maps all pending operational obligations, authority delegation vectors, renewal deadlines, and blockers to explicit owners.
                </p>
                <div className="pt-3 border-t border-rule text-[11px] font-mono text-ink-secondary">
                  Output: Dependency tree & authority delegation map
                </div>
              </Card>

              <Card className="p-5 bg-paper space-y-3">
                <div className="w-8 h-8 rounded-sm bg-olive-light border border-olive-border flex items-center justify-center text-olive font-mono text-xs font-bold">
                  04
                </div>
                <h3 className="font-serif font-bold text-base text-ink">
                  Dossier Architect
                </h3>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Compiles verified facts, resolved matters, and chronological roadmaps into an executive handover dossier ready for board sign-off.
                </p>
                <div className="pt-3 border-t border-rule text-[11px] font-mono text-ink-secondary">
                  Output: 30-Day Transition Dossier & executive briefing
                </div>
              </Card>
            </div>

            <div className="p-4 bg-paper-surface border border-rule rounded-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-olive animate-pulse" />
                <span className="font-medium text-ink">
                  The Switch Human Verification Protocol:
                </span>
                <span className="text-ink-secondary">
                  Agents do not publish decisions or close investigations without explicit human administrator approval.
                </span>
              </div>
              <Link href="/app/agents">
                <Button variant="outline" size="sm">
                  View Agent Pipeline
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Technical Architecture & Data Sovereignty */}
        <section className="py-20 px-4 sm:px-6 border-b border-rule">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="space-y-3 text-center max-w-2xl mx-auto">
              <p className="text-[11px] font-sans uppercase tracking-widest text-ink-secondary font-medium">
                Engineered For High-Stakes Environments
              </p>
              <h2 className="font-serif italic text-3xl sm:text-4xl font-bold text-ink">
                Built on local-first, auditable foundations
              </h2>
              <p className="text-xs sm:text-sm text-ink-secondary">
                Designed for healthcare, defense, financial services, and research organizations where data confidentiality is non-negotiable.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 bg-paper-surface border border-rule space-y-3">
                <IconDatabase className="w-5 h-5 text-copper" />
                <h3 className="font-serif font-bold text-base text-ink">
                  Isolated SQLite & Docker Persistence
                </h3>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  All databases and records run in containerized volumes with Write-Ahead Logging (WAL) and foreign-key integrity enforcement. Zero cloud sync required.
                </p>
              </div>

              <div className="p-5 bg-paper-surface border border-rule space-y-3">
                <IconShield className="w-5 h-5 text-olive" />
                <h3 className="font-serif font-bold text-base text-ink">
                  Zero Document Telemetry
                </h3>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Your internal contracts, clinical trial memos, and transition charters never train commercial AI models or leave your network perimeter.
                </p>
              </div>

              <div className="p-5 bg-paper-surface border border-rule space-y-3">
                <IconDocument className="w-5 h-5 text-ink" />
                <h3 className="font-serif font-bold text-base text-ink">
                  Cryptographic Citation Verification
                </h3>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Every extraction maintains an immutable reference to document hashes, paragraph coordinates, and original character offsets for peer audit.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final Conversion Call to Action */}
        <section className="py-20 px-4 sm:px-6 bg-paper-surface text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="font-serif italic text-3xl sm:text-5xl font-bold text-ink">
              Protect your organization’s next transition.
            </h2>
            <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
              Stage your documents, map your authority chains, and ensure your institutional knowledge endures beyond any single departure.
            </p>
            <div className="pt-2">
              <Link href="/app">
                <Button variant="primary" size="lg" className="text-sm px-8">
                  Launch Relay Workspace
                  <IconArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
            <p className="text-[11px] text-ink-disabled font-sans">
              Acme BioSystems demonstration workspace loaded • No external account required
            </p>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
