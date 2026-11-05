"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import {
  fetchConflicts,
  triggerIntelligenceAnalysis,
  resolveConflict,
  KnowledgeConflict,
} from "@/lib/api";

const INITIAL_FALLBACK_CASES = [
  {
    id: "case-01",
    title: "FDA Form 1572 Principal Investigator Sign-Off Mismatch",
    severity: "critical" as const,
    conflict_type: "contradiction",
    status: "open" as const,
    description:
      "FDA Form 1572 designates Dr. Eleanor Vance as primary sponsor representative, whereas Vendor MSA Amendment 3 names Dr. Marcus Thorne. Discrepancy triggers an automatic clinical trial hold on Phase II Oncology protocols.",
    document_filename: "Regulatory-Audit-Q3-2024.pdf",
    fact_a: {
      statement: "Box 1: Sponsor Representative designated as Dr. Eleanor Vance. Box 6: Clinical protocol trial execution managed by Dr. Marcus Thorne.",
      citations: [
        {
          verbatim_quote: "Box 1: Sponsor Representative designated as Dr. Eleanor Vance. Box 6: Clinical protocol trial execution managed by Dr. Marcus Thorne.",
          source_location: "Box 1 & 6 (Audit Submission)",
          document_filename: "Regulatory-Audit-Q3-2024.pdf",
        },
      ],
    },
    fact_b: {
      statement: "Execution Sponsor is hereby reassigned exclusively to Dr. Marcus Thorne effective October 1, 2024.",
      citations: [
        {
          verbatim_quote: "Execution Sponsor is hereby reassigned exclusively to Dr. Marcus Thorne effective October 1, 2024.",
          source_location: "Section 2.1 (Principal Investigator)",
          document_filename: "Vendor-MSA-Amendment-3.pdf",
        },
      ],
    },
    resolution_notes: null,
    resolved_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "case-02",
    title: "$140,000 Spectrometry Lab Contract Auto-Renewal",
    severity: "high" as const,
    conflict_type: "outdated_deadline",
    status: "open" as const,
    description:
      "Apex BioAnalytical master agreement auto-renews for 12 months ($140,000 commitment) on November 15 unless written opt-out is received 30 days prior (October 15). The transition charter lacks a designated signatory.",
    document_filename: "Vendor-Master-Agreement-2023.docx",
    fact_a: {
      statement: "Automatic 12-month extension activates on November 15, 2024 unless formal written notice of termination is delivered 30 days prior. Authorized signatory: Dr. Eleanor Vance.",
      citations: [
        {
          verbatim_quote: "Automatic 12-month extension activates on November 15, 2024 unless formal written notice of termination is delivered 30 days prior. Authorized signatory: Dr. Eleanor Vance.",
          source_location: "Section 8.2 (Renewal Terms)",
          document_filename: "Vendor-Master-Agreement-2023.docx",
        },
      ],
    },
    fact_b: null,
    resolution_notes: null,
    resolved_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "case-03",
    title: "Compound C-409 Patent Co-Inventor Assignment Gap",
    severity: "high" as const,
    conflict_type: "ownership_gap",
    status: "open" as const,
    description:
      "Exhibit C (Co-inventor assignment declaration) referenced in the patent memo is absent from the legal archive binder. Threatens priority rights for European patent counterpart filing due December 15.",
    document_filename: "Patent-Filing-Memo-RevB.pdf",
    fact_a: {
      statement: "Referenced Exhibit C specifies irrevocable assignment of PCT priority rights to Acme BioSystems Inc. Signed counterpart required from all listed inventors.",
      citations: [
        {
          verbatim_quote: "Referenced Exhibit C specifies irrevocable assignment of PCT priority rights to Acme BioSystems Inc. Signed counterpart required from all listed inventors.",
          source_location: "Exhibit C (Co-inventor Assignment)",
          document_filename: "Patent-Filing-Memo-RevB.pdf",
        },
      ],
    },
    fact_b: null,
    resolution_notes: null,
    resolved_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function InvestigationsPage() {
  const [cases, setCases] = useState<KnowledgeConflict[]>([]);
  const [activeCaseId, setActiveCaseId] = useState<string>("case-01");
  const [resolutionInput, setResolutionInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "RESOLVED">("ALL");
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  const loadConflicts = useCallback(async () => {
    try {
      const res = await fetchConflicts();
      if (res.items.length > 0) {
        setCases(res.items);
        if (!activeCaseId || activeCaseId === "case-01") {
          setActiveCaseId(res.items[0].id);
        }
      } else {
        // Fallback sample cases
        setCases(INITIAL_FALLBACK_CASES as any);
      }
    } catch (err) {
      console.warn("Failed to load backend conflicts, using default transition cases:", err);
      setCases(INITIAL_FALLBACK_CASES as any);
    }
  }, [activeCaseId]);

  useEffect(() => {
    loadConflicts();
  }, [loadConflicts]);

  const handleScanAnomalies = async () => {
    setIsScanning(true);
    setBannerNotice("Executing cross-document contradiction & discrepancy analysis...");

    try {
      const detected = await triggerIntelligenceAnalysis();
      setBannerNotice(`Anomaly analysis complete: ${detected.length} matters evaluated.`);
      await loadConflicts();
      setTimeout(() => setBannerNotice(null), 4000);
    } catch (err: any) {
      console.error("Scan error:", err);
      setBannerNotice(`Scan error: ${err.message || "Failed to analyze knowledge conflicts."}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleResolveCase = async (id: string) => {
    if (!resolutionInput.trim()) {
      alert("Please enter a resolution note or signatory justification.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (id.startsWith("case-")) {
        // Mock fallback resolution
        setCases((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  status: "resolved" as const,
                  resolved_at: new Date().toISOString(),
                  resolution_notes: resolutionInput.trim(),
                }
              : c
          )
        );
      } else {
        // Live backend resolution
        const updated = await resolveConflict(id, resolutionInput.trim(), "resolved");
        setCases((prev) => prev.map((c) => (c.id === id ? updated : c)));
      }

      setResolutionInput("");
      setBannerNotice(`Matter ${id.slice(0, 8)} successfully resolved and signed off.`);
      setTimeout(() => setBannerNotice(null), 4000);
    } catch (err: any) {
      console.error("Resolution error:", err);
      setBannerNotice(`Resolution failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCases = cases.filter((c) => {
    if (statusFilter === "ALL") return true;
    return c.status.toUpperCase() === statusFilter;
  });

  const activeCase = cases.find((c) => c.id === activeCaseId) || cases[0];

  const openCount = cases.filter((c) => c.status === "open").length;
  const criticalCount = cases.filter(
    (c) => c.severity === "critical" && c.status === "open"
  ).length;

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-carbon pb-4">
        <div>
          <span className="font-mono text-xs uppercase font-bold text-signal-orange">
            // SWITCH AUDIT DESK
          </span>
          <h2 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-carbon">
            Discrepancies & Conflict Adjudication
          </h2>
          <p className="font-mono text-xs text-carbon/70 uppercase">
            HUMAN-IN-THE-LOOP SWITCH REASONING • CROSS-EXAMINATION OF CONTRADICTIONS
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleScanAnomalies}
            disabled={isScanning}
          >
            <span>{isScanning ? "Scanning Graph..." : "Scan For Anomalies"}</span>
          </Button>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-2.5 py-1 bg-signal-orange text-raw-paper font-bold uppercase border border-carbon">
              {criticalCount} CRITICAL
            </span>
            <span className="px-2.5 py-1 bg-carbon text-raw-paper font-bold uppercase border border-carbon">
              {openCount} OPEN
            </span>
          </div>
        </div>
      </div>

      {bannerNotice && (
        <div className="p-3 bg-carbon text-raw-paper font-mono text-xs border border-carbon flex items-center justify-between">
          <span>{bannerNotice}</span>
          <button onClick={() => setBannerNotice(null)} className="underline uppercase text-[10px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-2 border-carbon bg-raw-paper-light p-2 font-mono text-xs">
        <div className="flex items-center gap-1.5">
          {(["ALL", "OPEN", "RESOLVED"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1 uppercase font-bold border transition-colors ${
                statusFilter === tab
                  ? "bg-carbon text-raw-paper border-carbon shadow-brutal"
                  : "bg-raw-paper text-carbon border-carbon/40 hover:border-carbon"
              }`}
            >
              {tab} ({tab === "ALL" ? cases.length : cases.filter((c) => c.status.toUpperCase() === tab).length})
            </button>
          ))}
        </div>

        <span className="text-[10px] text-carbon/60 uppercase hidden sm:inline">
          SWITCH GATEWAY ACTIVE • REQUIRES HUMAN SIGN-OFF
        </span>
      </div>

      {/* Main Two-Column Split Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Case List (5 cols) */}
        <div className="lg:col-span-5 border-2 border-carbon bg-raw-paper shadow-brutal overflow-hidden divide-y-2 divide-carbon">
          <div className="p-3.5 bg-raw-paper-light border-b-2 border-carbon flex items-center justify-between text-xs font-mono">
            <span className="font-bold uppercase text-carbon">
              ACTIVE CASE LOG ({filteredCases.length})
            </span>
            <span className="text-carbon/60 uppercase text-[10px]">SELECT TO ADJUDICATE</span>
          </div>

          {filteredCases.map((c, idx) => {
            const isSelected = c.id === activeCaseId;

            return (
              <div
                key={c.id}
                onClick={() => {
                  setActiveCaseId(c.id);
                  setResolutionInput("");
                }}
                className={`p-4 cursor-pointer transition-colors space-y-2 ${
                  isSelected
                    ? "bg-carbon text-raw-paper"
                    : "bg-raw-paper-light hover:bg-concrete/40 text-carbon"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-xs px-1.5 py-0.5 font-bold border ${
                        isSelected
                          ? "bg-signal-orange text-raw-paper border-raw-paper/30"
                          : "bg-concrete text-carbon border-carbon"
                      }`}
                    >
                      CASE-BIO-{String(idx + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`font-mono text-[10px] px-1.5 py-0.5 font-bold uppercase ${
                        c.severity === "critical"
                          ? "bg-signal-red text-raw-paper"
                          : c.severity === "high"
                          ? "bg-signal-orange text-raw-paper"
                          : "bg-carbon/20 text-current"
                      }`}
                    >
                      {c.severity}
                    </span>
                  </div>

                  <span
                    className={`font-mono text-[10px] px-2 py-0.5 font-bold uppercase border ${
                      c.status === "resolved"
                        ? isSelected
                          ? "bg-industrial-green-light text-carbon border-transparent"
                          : "bg-industrial-green text-raw-paper border-carbon"
                        : isSelected
                        ? "bg-signal-orange text-raw-paper border-transparent"
                        : "bg-raw-paper text-carbon border-carbon"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>

                <h4 className="font-display font-bold text-sm uppercase leading-tight">
                  {c.title}
                </h4>

                <p
                  className={`font-sans text-xs line-clamp-2 ${
                    isSelected ? "text-raw-paper/80" : "text-carbon/70"
                  }`}
                >
                  {c.description}
                </p>

                <div
                  className={`pt-2 border-t flex items-center justify-between font-mono text-[10px] ${
                    isSelected ? "border-raw-paper/20 text-raw-paper/60" : "border-carbon/20 text-carbon/60"
                  }`}
                >
                  <span>TYPE: {c.conflict_type.toUpperCase()}</span>
                  <span>{c.document_filename || "Repository"}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Case Deep Dive & Switch Adjudication (7 cols) */}
        <div className="lg:col-span-7 border-2 border-carbon bg-raw-paper shadow-brutal space-y-5 p-6">
          {activeCase ? (
            <>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b-2 border-carbon pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-signal-orange font-bold uppercase">
                      // {activeCase.conflict_type.replace("_", " ").toUpperCase()}
                    </span>
                    <span
                      className={`font-mono text-xs px-2 py-0.5 font-bold ${
                        activeCase.severity === "critical"
                          ? "bg-signal-red text-raw-paper"
                          : activeCase.severity === "high"
                          ? "bg-signal-orange text-raw-paper"
                          : "bg-carbon/20 text-carbon"
                      }`}
                    >
                      SEVERITY: {activeCase.severity.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-display font-black text-lg sm:text-xl uppercase text-carbon leading-snug">
                    {activeCase.title}
                  </h3>
                </div>

                <div className="font-mono text-xs">
                  <span
                    className={`px-2.5 py-1 font-bold border uppercase ${
                      activeCase.status === "resolved"
                        ? "bg-industrial-green text-raw-paper border-carbon"
                        : "bg-signal-orange text-raw-paper border-carbon"
                    }`}
                  >
                    STATUS: {activeCase.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Risk Impact Analysis */}
              <div className="space-y-1">
                <span className="font-mono text-[10px] uppercase font-bold text-carbon/60">
                  RISK VECTOR & OPERATIONAL IMPACT
                </span>
                <p className="text-xs text-carbon/90 font-sans leading-relaxed p-3.5 bg-raw-paper-light border border-carbon">
                  {activeCase.description}
                </p>
              </div>

              {/* Verbatim Document Cross-Examination (Side by Side) */}
              <div className="space-y-2">
                <span className="font-mono text-xs uppercase font-bold text-carbon">
                  VERBATIM DOCUMENT EVIDENCE CROSS-EXAMINATION
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Primary Record */}
                  <div className="p-3.5 bg-raw-paper-light border-l-4 border-carbon font-mono text-xs space-y-1.5">
                    <span className="text-[10px] text-carbon/60 uppercase font-bold block">
                      PRIMARY RECORD // {activeCase.document_filename || "Archive Record"}
                    </span>
                    <blockquote className="text-carbon leading-relaxed">
                      &ldquo;
                      {activeCase.fact_a?.citations && activeCase.fact_a.citations.length > 0
                        ? activeCase.fact_a.citations[0].verbatim_quote
                        : activeCase.fact_a?.statement || activeCase.description}
                      &rdquo;
                    </blockquote>
                    <span className="text-[10px] text-carbon/50 block">
                      Location:{" "}
                      {activeCase.fact_a?.citations && activeCase.fact_a.citations.length > 0
                        ? activeCase.fact_a.citations[0].source_location
                        : "Document Segment"}
                    </span>
                  </div>

                  {/* Contradicting Record */}
                  {activeCase.fact_b ? (
                    <div className="p-3.5 bg-raw-paper-light border-l-4 border-signal-orange font-mono text-xs space-y-1.5">
                      <span className="text-[10px] text-signal-orange uppercase font-bold block">
                        CONTRADICTING / SUPERSEDING RECORD
                      </span>
                      <blockquote className="text-carbon leading-relaxed">
                        &ldquo;
                        {activeCase.fact_b.citations && activeCase.fact_b.citations.length > 0
                          ? activeCase.fact_b.citations[0].verbatim_quote
                          : activeCase.fact_b.statement}
                        &rdquo;
                      </blockquote>
                      <span className="text-[10px] text-carbon/50 block">
                        Location:{" "}
                        {activeCase.fact_b.citations && activeCase.fact_b.citations.length > 0
                          ? activeCase.fact_b.citations[0].source_location
                          : "Document Segment"}
                      </span>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-signal-orange/10 border-l-4 border-signal-orange font-mono text-xs space-y-1.5">
                      <span className="text-[10px] text-signal-orange uppercase font-bold block">
                        GAP / MISSING COUNTERPART
                      </span>
                      <p className="text-carbon leading-relaxed">
                        This commitment or deadline lacks assigned ownership or documentation in subsequent governance charters.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Switch Human Resolution Desk Form */}
              <div className="pt-2 border-t-2 border-carbon space-y-3">
                <span className="font-mono text-xs uppercase font-bold text-carbon block">
                  // SWITCH HUMAN RESOLUTION DESK
                </span>

                {activeCase.status === "resolved" ? (
                  <div className="p-4 bg-industrial-green text-raw-paper font-mono text-xs border border-carbon space-y-1.5">
                    <div className="flex items-center justify-between font-bold">
                      <span>RESOLVED VIA SWITCH • HUMAN-VERIFIED</span>
                      <IconCheck size={16} />
                    </div>
                    <p className="text-raw-paper/90 font-sans">
                      {activeCase.resolution_notes || "Administrative sign-off completed."}
                    </p>
                    <span className="text-[10px] text-raw-paper/70 block">
                      Logged on{" "}
                      {activeCase.resolved_at
                        ? new Date(activeCase.resolved_at).toLocaleString()
                        : "Today"}{" "}
                      by Authorized Reviewer
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <textarea
                      rows={3}
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
                      disabled={isSubmitting}
                    >
                      <IconCheck size={14} className="mr-2" />
                      <span>{isSubmitting ? "Signing Off..." : "Sign Off & Resolve Anomaly via Switch Gate"}</span>
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-10 text-center font-mono text-xs text-carbon/60">
              Select a case to inspect evidence.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
