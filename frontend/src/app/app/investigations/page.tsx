"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
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
import { ScrollReveal } from "@/components/ui/ScrollReveal";
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
  const [cases, setCases] = useState<KnowledgeConflict[]>(INITIAL_FALLBACK_CASES as any);
  const [activeCaseId, setActiveCaseId] = useState<string>("case-01");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "RESOLVED">("ALL");
  const [resolutionInput, setResolutionInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  const loadCases = useCallback(async () => {
    try {
      const res = await fetchConflicts();
      if (res.items && res.items.length > 0) {
        setCases(res.items);
        setActiveCaseId((prev) => {
          const found = res.items.find((c) => c.id === prev);
          return found ? found.id : res.items[0].id;
        });
      }
    } catch (err) {
      console.warn("Using fallback cases for investigation desk:", err);
    }
  }, []);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const handleScanAnomalies = async () => {
    setIsScanning(true);
    setBannerNotice("Triggering multi-document knowledge graph cross-examination...");
    try {
      await triggerIntelligenceAnalysis();
      await loadCases();
      setBannerNotice("Anomalies scan complete. Contradictions cross-checked against source records.");
      setTimeout(() => setBannerNotice(null), 4000);
    } catch (err: any) {
      console.error("Scan error:", err);
      setBannerNotice(`Scan failed: ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleResolveCase = async (id: string) => {
    if (!resolutionInput.trim()) {
      alert("Please provide human sign-off notes or delegation confirmation.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (id.startsWith("case-0")) {
        // Mock fallback update
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
    <div className="space-y-5 font-sans">
      {/* Page Header */}
      <ScrollReveal variant="industrial">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-carbon pb-4">
          <div>
            <span className="font-mono text-[10px] uppercase font-bold text-signal-orange block mb-0.5">
              SWITCH AUDIT DESK
            </span>
            <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-carbon">
              Discrepancies & Conflict Adjudication
            </h1>
            <p className="font-mono text-xs text-carbon/70 uppercase mt-0.5">
              HUMAN-IN-THE-LOOP SWITCH REASONING • CROSS-EXAMINATION OF CONTRADICTIONS
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              magnetic={true}
              onClick={handleScanAnomalies}
              disabled={isScanning}
            >
              <span>{isScanning ? "Scanning Graph..." : "Scan For Anomalies"}</span>
            </Button>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="px-2.5 py-1 bg-signal-orange text-raw-paper font-bold uppercase border border-carbon shadow-brutal">
                {criticalCount} CRITICAL
              </span>
              <span className="px-2.5 py-1 bg-carbon text-raw-paper font-bold uppercase border border-carbon shadow-brutal">
                {openCount} OPEN
              </span>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {bannerNotice && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="p-3 bg-carbon text-raw-paper font-mono text-xs border border-carbon flex items-center justify-between shadow-brutal"
        >
          <span>{bannerNotice}</span>
          <button onClick={() => setBannerNotice(null)} className="underline uppercase text-xs font-bold">
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Filter Tabs */}
      <ScrollReveal variant="editorial" delay={0.05}>
        <div className="flex items-center justify-between border-2 border-carbon bg-raw-paper-light p-2 font-mono text-xs shadow-brutal">
          <div className="flex items-center gap-1.5">
            {(["ALL", "OPEN", "RESOLVED"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                data-cursor="FILTER"
                className={`px-3 py-1 uppercase font-bold border transition-all ${
                  statusFilter === tab
                    ? "bg-carbon text-raw-paper border-carbon shadow-brutal"
                    : "bg-raw-paper text-carbon border-carbon/40 hover:border-carbon hover:bg-concrete/40"
                }`}
              >
                {tab} ({tab === "ALL" ? cases.length : cases.filter((c) => c.status.toUpperCase() === tab).length})
              </button>
            ))}
          </div>

          <span className="text-[11px] text-carbon/70 uppercase font-mono hidden sm:inline">
            SWITCH GATEWAY ACTIVE • REQUIRES HUMAN SIGN-OFF
          </span>
        </div>
      </ScrollReveal>

      {/* Main Two-Column Split Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Case List (5 cols) */}
        <div className="lg:col-span-5 border-2 border-carbon bg-raw-paper shadow-brutal overflow-hidden divide-y-2 divide-carbon">
          <div className="p-3 bg-raw-paper-light border-b-2 border-carbon flex items-center justify-between text-xs font-mono">
            <span className="font-bold uppercase text-carbon">
              ACTIVE CASE LOG ({filteredCases.length})
            </span>
            <span className="text-carbon/60 uppercase text-[10px] font-bold">SELECT TO ADJUDICATE</span>
          </div>

          <LayoutGroup id="investigationCasesGroup">
            <div
              data-lenis-prevent
              className="divide-y-2 divide-carbon max-h-[600px] overflow-y-auto"
            >
              {filteredCases.map((c, idx) => {
                const isSelected = c.id === activeCaseId;

                return (
                  <div
                    key={c.id}
                    data-cursor="INSPECT"
                    onClick={() => {
                      setActiveCaseId(c.id);
                      setResolutionInput("");
                    }}
                    className={`p-3.5 cursor-pointer transition-all space-y-2 relative select-none ${
                      isSelected
                        ? "bg-carbon text-raw-paper shadow-inner"
                        : "bg-raw-paper-light hover:bg-concrete/60 text-carbon hover:translate-x-1"
                    }`}
                  >
                    {/* Active sliding indicator */}
                    {isSelected && (
                      <motion.div
                        layoutId="activeCaseCardIndicator"
                        className="absolute left-0 top-0 bottom-0 w-1.5 bg-signal-orange z-10"
                        transition={{
                          type: "spring",
                          stiffness: 450,
                          damping: 35,
                        }}
                      />
                    )}

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-mono text-[10px] px-1.5 py-0.5 font-bold border ${
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

                    <h4 className="font-display font-black text-sm uppercase leading-tight line-clamp-2">
                      {c.title}
                    </h4>

                    <p
                      className={`font-sans text-xs line-clamp-2 leading-relaxed ${
                        isSelected ? "text-raw-paper/80" : "text-carbon/70"
                      }`}
                    >
                      {c.description}
                    </p>

                    <div
                      className={`pt-1.5 border-t flex items-center justify-between font-mono text-[10px] ${
                        isSelected ? "border-raw-paper/20 text-raw-paper/60" : "border-carbon/20 text-carbon/60"
                      }`}
                    >
                      <span>TYPE: {c.conflict_type.toUpperCase()}</span>
                      <span className="truncate max-w-[140px]">{c.document_filename || "Repository"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </LayoutGroup>
        </div>

        {/* Right Column: Case Deep Dive & Switch Adjudication (7 cols) */}
        <div
          data-lenis-prevent
          className="lg:col-span-7 border-2 border-carbon bg-raw-paper shadow-brutal space-y-4 p-5 min-h-[460px] max-h-[600px] overflow-y-auto"
        >
          {activeCase && (
            <motion.div
              key={activeCase.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4"
            >
              {/* Header Box */}
              <div className="border-b-2 border-carbon pb-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-signal-orange font-bold uppercase">
                      // {activeCase.conflict_type.replace("_", " ").toUpperCase()}
                    </span>
                    <span
                      className={`font-mono text-[10px] px-2 py-0.5 font-bold uppercase ${
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

                  <span
                    className={`font-mono text-xs px-2.5 py-0.5 font-bold border uppercase ${
                      activeCase.status === "resolved"
                        ? "bg-industrial-green text-raw-paper border-carbon"
                        : "bg-signal-orange text-raw-paper border-carbon"
                    }`}
                  >
                    STATUS: {activeCase.status.toUpperCase()}
                  </span>
                </div>

                <h3 className="font-display font-black text-lg uppercase text-carbon leading-snug">
                  {activeCase.title}
                </h3>
              </div>

              {/* Risk Impact Analysis */}
              <div className="space-y-1">
                <span className="font-mono text-[10px] uppercase font-bold text-carbon/60 block">
                  RISK VECTOR &amp; OPERATIONAL IMPACT
                </span>
                <p className="text-xs sm:text-sm text-carbon/90 font-sans leading-relaxed p-3 bg-raw-paper-light border border-carbon shadow-brutal">
                  {activeCase.description}
                </p>
              </div>

              {/* Side-by-Side Citations */}
              <div className="space-y-2">
                <span className="font-mono text-[10px] uppercase font-bold text-carbon/60 block">
                  VERBATIM EVIDENCE CROSS-EXAMINATION
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
                  {/* Record A */}
                  <div className="p-3 bg-raw-paper-light border border-carbon space-y-1.5 shadow-brutal">
                    <div className="flex items-center justify-between border-b border-carbon/20 pb-1.5">
                      <span className="font-bold text-carbon uppercase text-[10px]">RECORD A</span>
                      <EvidenceBadge status="conflicting" size="sm" />
                    </div>
                    <blockquote className="text-[11px] text-carbon/90 font-mono italic leading-relaxed">
                      &ldquo;
                      {activeCase.fact_a?.citations?.[0]?.verbatim_quote ||
                        activeCase.fact_a?.statement ||
                        "Primary record assertion on file."}
                      &rdquo;
                    </blockquote>
                    <span className="text-carbon/60 text-[10px] block pt-1 border-t border-carbon/10 truncate">
                      SOURCE: {activeCase.document_filename || "Archive Record"}
                    </span>
                  </div>

                  {/* Record B */}
                  <div className="p-3 bg-raw-paper-light border border-carbon space-y-1.5 shadow-brutal">
                    <div className="flex items-center justify-between border-b border-carbon/20 pb-1.5">
                      <span className="font-bold text-carbon uppercase text-[10px]">RECORD B</span>
                      <EvidenceBadge status="missing" size="sm" />
                    </div>
                    <blockquote className="text-[11px] text-carbon/90 font-mono italic leading-relaxed">
                      &ldquo;
                      {activeCase.fact_b?.citations?.[0]?.verbatim_quote ||
                        activeCase.fact_b?.statement ||
                        "Contradicting statement or omitted clause detected during cross-examination pass."}
                      &rdquo;
                    </blockquote>
                    <span className="text-carbon/60 text-[10px] block pt-1 border-t border-carbon/10 truncate">
                      SOURCE: Counterpart Archival Instrument
                    </span>
                  </div>
                </div>
              </div>

              {/* Resolution Form / Notes */}
              <div className="pt-3 border-t-2 border-carbon space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase font-bold text-carbon">
                    HUMAN RESOLUTION SIGN-OFF
                  </span>
                  {activeCase.resolved_at && (
                    <span className="font-mono text-xs text-industrial-green font-bold">
                      ✓ SIGNED OFF: {new Date(activeCase.resolved_at).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {activeCase.status === "resolved" ? (
                  <div className="p-3 bg-industrial-green/10 border-2 border-industrial-green space-y-1">
                    <span className="font-mono text-xs font-bold text-industrial-green uppercase block">
                      RESOLUTION RATIFIED INTO AUDIT LEDGER:
                    </span>
                    <p className="font-sans text-xs text-carbon leading-relaxed">
                      {activeCase.resolution_notes || "Human administrator ratified the discrepancy resolution."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      value={resolutionInput}
                      onChange={(e) => setResolutionInput(e.target.value)}
                      placeholder="Enter formal administrative resolution, reassigned authority, or legal clarification..."
                      rows={2}
                      className="w-full p-2.5 border-2 border-carbon bg-raw-paper font-sans text-xs text-carbon focus:outline-none focus:border-signal-orange"
                    />

                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="signal"
                        size="sm"
                        magnetic={true}
                        onClick={() => handleResolveCase(activeCase.id)}
                        disabled={isSubmitting || !resolutionInput.trim()}
                      >
                        {isSubmitting ? "Ratifying..." : "Ratify & Sign Off in Switch →"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
