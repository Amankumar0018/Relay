"use client";

import React, { useState } from "react";
import {
  IconInvestigation,
  IconAlert,
  IconCheck,
  IconClose,
  IconDocument,
  IconUser,
  IconArrowRight,
} from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { EvidenceBadge } from "@/components/evidence/EvidenceBadge";

interface InvestigationCase {
  id: string;
  code: string;
  title: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  classification: "Record Contradiction" | "Missing Documentation" | "Ambiguous Ownership";
  status: "OPEN" | "RESOLVED";
  whyItMatters: string;
  sourceA: {
    doc: string;
    section: string;
    quote: string;
  };
  sourceB?: {
    doc: string;
    section: string;
    quote: string;
  };
  requiredClarification: string;
  responsibleReviewer: string;
  resolvedAt?: string;
  resolutionNote?: string;
}

const INITIAL_CASES: InvestigationCase[] = [
  {
    id: "case-01",
    code: "CASE-BIO-09",
    title: "FDA Form 1572 Principal Investigator Sign-Off Mismatch",
    severity: "CRITICAL",
    classification: "Record Contradiction",
    status: "OPEN",
    whyItMatters:
      "FDA Form 1572 designates Dr. Eleanor Vance as primary sponsor representative, whereas Vendor MSA Amendment 3 names Dr. Marcus Thorne. Discrepancy triggers an automatic clinical trial hold on Phase II Oncology protocols.",
    sourceA: {
      doc: "Regulatory-Audit-Q3-2024.pdf",
      section: "Box 1 & 6 (Audit Submission)",
      quote:
        "Box 1: Sponsor Representative designated as Dr. Eleanor Vance. Box 6: Clinical protocol trial execution managed by Dr. Marcus Thorne.",
    },
    sourceB: {
      doc: "Vendor-MSA-Amendment-3.pdf",
      section: "Section 2.1 (Principal Investigator)",
      quote:
        "Execution Sponsor is hereby reassigned exclusively to Dr. Marcus Thorne effective October 1, 2024.",
    },
    requiredClarification:
      "Re-submit updated FDA Form 1572 with co-signatures from Dr. Vance and Dr. Thorne before November 1, 2024.",
    responsibleReviewer: "General Counsel & Regulatory QA Liaison",
  },
  {
    id: "case-02",
    code: "CASE-BIO-14",
    title: "$140,000 Spectrometry Lab Contract Auto-Renewal",
    severity: "HIGH",
    classification: "Missing Documentation",
    status: "OPEN",
    whyItMatters:
      "Apex BioAnalytical master agreement auto-renews for 12 months ($140,000 commitment) on November 15 unless written opt-out is received 30 days prior (October 15). The transition charter lacks a designated signatory.",
    sourceA: {
      doc: "Vendor-Master-Agreement-2023.docx",
      section: "Section 8.2 (Renewal Terms)",
      quote:
        "Automatic 12-month extension activates on November 15, 2024 unless formal written notice of termination is delivered 30 days prior. Authorized signatory: Dr. Eleanor Vance.",
    },
    requiredClarification:
      "Authorize CFO or interim procurement lead to dispatch written termination or contract restructuring notice before October 15.",
    responsibleReviewer: "Procurement & Facilities Director",
  },
  {
    id: "case-03",
    code: "CASE-BIO-22",
    title: "Compound C-409 Patent Co-Inventor Assignment Gap",
    severity: "HIGH",
    classification: "Missing Documentation",
    status: "OPEN",
    whyItMatters:
      "Exhibit C (Co-inventor assignment declaration) referenced in the patent memo is absent from the legal archive binder. Threatens priority rights for European patent counterpart filing due December 15.",
    sourceA: {
      doc: "Patent-Filing-Memo-RevB.pdf",
      section: "Exhibit C (Co-inventor Assignment)",
      quote:
        "Referenced Exhibit C specifies irrevocable assignment of PCT priority rights to Acme BioSystems Inc. Signed counterpart required from all listed inventors.",
    },
    requiredClarification:
      "Locate physical executed counterpart in Dr. Vance's escrow binder or re-execute assignment before departure date.",
    responsibleReviewer: "Lead IP Counsel",
  },
];

export default function InvestigationsPage() {
  const [cases, setCases] = useState<InvestigationCase[]>(INITIAL_CASES);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("case-01");
  const [resolutionInput, setResolutionInput] = useState("");

  const activeCase =
    cases.find((c) => c.id === selectedCaseId) || cases[0];

  const handleResolveCase = (caseId: string) => {
    setCases((prev) =>
      prev.map((item) =>
        item.id === caseId
          ? {
              ...item,
              status: "RESOLVED",
              resolvedAt: new Date().toISOString().split("T")[0],
              resolutionNote:
                resolutionInput ||
                "Clarification confirmed and counter-signed by authorized human reviewer.",
            }
          : item
      )
    );
    setResolutionInput("");
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-carbon pb-4">
        <div>
          <span className="font-mono text-xs uppercase font-bold text-signal-orange">
            // ADJUDICATION MODULE
          </span>
          <h2 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-carbon">
            Investigation Case Files
          </h2>
          <p className="font-mono text-xs text-carbon/70 uppercase">
            CROSS-EXAMINATION OF CONTRADICTIONS, SILENT LIABILITIES, AND UNRESOLVED GAPS
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2 py-1 bg-signal-orange text-raw-paper font-bold uppercase">
            OPEN: {cases.filter((c) => c.status === "OPEN").length}
          </span>
          <span className="px-2 py-1 bg-industrial-green text-raw-paper font-bold uppercase">
            RESOLVED: {cases.filter((c) => c.status === "RESOLVED").length}
          </span>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Case Index (5 cols) */}
        <div className="lg:col-span-5 border-2 border-carbon bg-raw-paper-light divide-y-2 divide-carbon shadow-brutal">
          <div className="p-3 bg-raw-paper flex items-center justify-between font-mono text-xs font-bold text-carbon">
            <span>ACTIVE CASE FILES ({cases.length})</span>
            <span className="text-[10px] text-signal-orange">SELECT TO REVIEW</span>
          </div>

          <div className="divide-y divide-carbon/20">
            {cases.map((c) => {
              const isSelected = c.id === selectedCaseId;

              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCaseId(c.id)}
                  className={`w-full text-left p-4 transition-all font-mono text-xs ${
                    isSelected
                      ? "bg-carbon text-raw-paper border-l-4 border-signal-orange"
                      : "bg-raw-paper-light text-carbon hover:bg-concrete/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 border ${
                        c.severity === "CRITICAL"
                          ? "bg-signal-orange text-raw-paper border-carbon"
                          : "bg-signal-yellow text-carbon border-carbon"
                      }`}
                    >
                      {c.severity}
                    </span>
                    <span className="text-[10px] font-bold">
                      {c.code}
                    </span>
                  </div>

                  <h3 className="font-sans font-bold text-sm leading-snug line-clamp-2">
                    {c.title}
                  </h3>

                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-current/10 text-[10px]">
                    <span className="opacity-70">{c.classification}</span>
                    <span
                      className={`font-bold uppercase ${
                        c.status === "RESOLVED"
                          ? isSelected
                            ? "text-industrial-green-light"
                            : "text-industrial-green"
                          : isSelected
                          ? "text-signal-orange"
                          : "text-signal-orange"
                      }`}
                    >
                      // {c.status}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Case File Details & Switch Resolution Desk (7 cols) */}
        <div className="lg:col-span-7 border-2 border-carbon bg-raw-paper p-6 space-y-6 shadow-brutal">
          {/* Case Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-carbon pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 bg-carbon text-raw-paper font-bold">
                  {activeCase.code}
                </span>
                <span
                  className={`font-mono text-xs px-2 py-0.5 font-bold ${
                    activeCase.severity === "CRITICAL"
                      ? "bg-signal-orange text-raw-paper"
                      : "bg-signal-yellow text-carbon"
                  }`}
                >
                  SEVERITY: {activeCase.severity}
                </span>
              </div>
              <h3 className="font-display font-black text-lg sm:text-xl uppercase text-carbon leading-snug">
                {activeCase.title}
              </h3>
            </div>

            <div className="font-mono text-xs">
              <span
                className={`px-2.5 py-1 font-bold border uppercase ${
                  activeCase.status === "RESOLVED"
                    ? "bg-industrial-green text-raw-paper border-carbon"
                    : "bg-signal-orange text-raw-paper border-carbon"
                }`}
              >
                STATUS: {activeCase.status}
              </span>
            </div>
          </div>

          {/* Risk Impact Analysis */}
          <div className="space-y-1">
            <span className="font-mono text-[10px] uppercase font-bold text-carbon/60">
              RISK VECTOR & OPERATIONAL IMPACT
            </span>
            <p className="text-xs text-carbon/90 font-sans leading-relaxed p-3.5 bg-raw-paper-light border border-carbon">
              {activeCase.whyItMatters}
            </p>
          </div>

          {/* Verbatim Document Cross-Examination (Side by Side) */}
          <div className="space-y-2">
            <span className="font-mono text-xs uppercase font-bold text-carbon">
              VERBATIM DOCUMENT CROSS-EXAMINATION
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-raw-paper-light border-l-4 border-carbon font-mono text-xs space-y-1.5">
                <span className="text-[10px] text-carbon/60 uppercase font-bold block">
                  PRIMARY RECORD // {activeCase.sourceA.doc}
                </span>
                <blockquote className="text-carbon leading-relaxed">
                  &ldquo;{activeCase.sourceA.quote}&rdquo;
                </blockquote>
                <span className="text-[10px] text-carbon/50 block">
                  Location: {activeCase.sourceA.section}
                </span>
              </div>

              {activeCase.sourceB ? (
                <div className="p-3.5 bg-raw-paper-light border-l-4 border-signal-orange font-mono text-xs space-y-1.5">
                  <span className="text-[10px] text-signal-orange uppercase font-bold block">
                    CONTRADICTING RECORD // {activeCase.sourceB.doc}
                  </span>
                  <blockquote className="text-carbon leading-relaxed">
                    &ldquo;{activeCase.sourceB.quote}&rdquo;
                  </blockquote>
                  <span className="text-[10px] text-carbon/50 block">
                    Location: {activeCase.sourceB.section}
                  </span>
                </div>
              ) : (
                <div className="p-3.5 bg-signal-orange/10 border-l-4 border-signal-orange font-mono text-xs space-y-1.5">
                  <span className="text-[10px] text-signal-orange uppercase font-bold block">
                    MISSING RECORD
                  </span>
                  <p className="text-carbon leading-relaxed">
                    Document or exhibit referenced in primary text is absent from the institutional archive.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Required & Reviewer */}
          <div className="p-3.5 bg-concrete/40 border border-carbon font-mono text-xs space-y-2">
            <div className="flex justify-between text-[11px]">
              <span className="text-carbon/60 uppercase font-bold">REQUIRED ACTION:</span>
              <span className="text-signal-orange font-bold uppercase">
                REVIEWER: {activeCase.responsibleReviewer}
              </span>
            </div>
            <p className="text-carbon font-sans font-medium">
              {activeCase.requiredClarification}
            </p>
          </div>

          {/* Switch Human Resolution Desk Form */}
          <div className="pt-2 border-t-2 border-carbon space-y-3">
            <span className="font-mono text-xs uppercase font-bold text-carbon block">
              // SWITCH HUMAN RESOLUTION DESK
            </span>

            {activeCase.status === "RESOLVED" ? (
              <div className="p-4 bg-industrial-green text-raw-paper font-mono text-xs border border-carbon space-y-1.5">
                <div className="flex items-center justify-between font-bold">
                  <span>RESOLVED VIA SWITCH • HUMAN-VERIFIED</span>
                  <IconCheck size={16} />
                </div>
                <p className="text-raw-paper/90 font-sans">
                  {activeCase.resolutionNote}
                </p>
                <span className="text-[10px] text-raw-paper/70 block">
                  Logged on {activeCase.resolvedAt} by Authorized Admin
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  rows={2}
                  value={resolutionInput}
                  onChange={(e) => setResolutionInput(e.target.value)}
                  placeholder="Record administrative decision, signatory delegation confirmation, or resolution rationale..."
                  className="w-full p-3 bg-raw-paper-light border-2 border-carbon text-xs font-mono text-carbon placeholder:text-carbon/40 focus:outline-none focus:border-signal-orange"
                />
                <Button
                  variant="signal"
                  size="md"
                  className="w-full"
                  onClick={() => handleResolveCase(activeCase.id)}
                >
                  <IconCheck size={14} className="mr-2" />
                  Sign Off & Resolve Anomaly via Switch Gate
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
