"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  IconDocument,
  IconAlert,
  IconTask,
  IconCheck,
  IconArrowRight,
  IconUpload,
  IconNetwork,
  IconDossier,
  IconInfo,
} from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { EvidenceBadge } from "@/components/evidence/EvidenceBadge";
import { FileUploader, StagedFile } from "@/components/upload/FileUploader";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import {
  fetchContinuityOverview,
  fetchConflicts,
  uploadDocumentFile,
  extractDocument,
  triggerIntelligenceAnalysis,
  ContinuityOverview,
  KnowledgeConflict,
} from "@/lib/api";

export default function WorkspaceOverviewPage() {
  const [continuity, setContinuity] = useState<ContinuityOverview | null>(null);
  const [conflicts, setConflicts] = useState<KnowledgeConflict[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [contData, confData] = await Promise.all([
        fetchContinuityOverview().catch((err) => {
          console.warn("Could not load continuity overview:", err);
          return null;
        }),
        fetchConflicts("open").catch((err) => {
          console.warn("Could not load conflicts:", err);
          return null;
        }),
      ]);

      if (contData) setContinuity(contData);
      if (confData && confData.items) setConflicts(confData.items);
    } catch (err) {
      console.error("Error loading workspace overview:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDepositAndExtract = async () => {
    if (stagedFiles.length === 0) return;
    setIsProcessing(true);
    setUploadStatus("Uploading records to persistent vault...");

    try {
      for (let i = 0; i < stagedFiles.length; i++) {
        const item = stagedFiles[i];
        setUploadStatus(`[${i + 1}/${stagedFiles.length}] Storing ${item.name}...`);
        const uploadRes = await uploadDocumentFile(item.file);

        setUploadStatus(`[${i + 1}/${stagedFiles.length}] Extracting knowledge from ${item.name}...`);
        await extractDocument(uploadRes.document.id);
      }

      setUploadStatus("Synthesizing organizational intelligence & detecting conflicts...");
      await triggerIntelligenceAnalysis().catch(() => {});

      setUploadStatus("Records successfully deposited and extracted.");
      setStagedFiles([]);
      await loadData();
      setTimeout(() => setUploadStatus(null), 4000);
    } catch (err: any) {
      console.error("Upload/extract failed:", err);
      setUploadStatus(`Error: ${err.message || "Failed to process files."}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Metric derivations (strictly derived from live backend API telemetry)
  const depositedDocsCount = continuity ? continuity.total_documents_deposited : 0;
  const entitiesCount = continuity ? continuity.total_entities_indexed : 0;
  const openAnomaliesCount = continuity ? continuity.active_conflicts_count : (conflicts.length || 0);
  const criticalBlockersCount = continuity ? continuity.critical_blockers_count : 0;
  const continuityScore = continuity ? continuity.continuity_score : 0;
  const readinessStatus = continuity ? continuity.readiness_status : "CALCULATING";

  const outgoingLeader = continuity?.outgoing_leader || "Aman Kumar";
  const incomingSuccessor = continuity?.incoming_successor || "Marcus Vance";

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Transition Header Block */}
      <ScrollReveal variant="industrial">
        <div className="border-2 border-carbon bg-raw-paper-light p-5 sm:p-6 shadow-brutal space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-carbon pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-signal-orange" />
                <span className="font-mono text-[11px] uppercase font-bold text-signal-orange">
                  ACTIVE TRANSITION // NODE #04
                </span>
              </div>
              <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-carbon">
                Chief Scientific Officer Handover
              </h1>
              <p className="font-mono text-xs text-carbon/70 uppercase">
                Acme BioSystems Discovery Division • {outgoingLeader} → {incomingSuccessor}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center font-mono text-xs">
              <span
                className={`px-2.5 py-1 text-raw-paper font-bold uppercase border border-carbon shadow-sm ${
                  readinessStatus === "ON_TRACK"
                    ? "bg-industrial-green"
                    : readinessStatus === "CRITICAL_RISK"
                    ? "bg-signal-red text-raw-paper font-bold"
                    : "bg-signal-orange text-raw-paper"
                }`}
              >
                STATUS: {readinessStatus.replace("_", " ")}
              </span>
              <span className="px-2.5 py-1 bg-carbon text-raw-paper font-bold uppercase border border-carbon">
                READINESS: <AnimatedCounter value={continuityScore} suffix="%" />
              </span>
            </div>
          </div>

          {/* 3 Key Transition Vectors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 font-mono text-xs">
            <div className="p-3 border border-carbon bg-raw-paper space-y-1 hover:border-carbon/80 transition-colors shadow-brutal">
              <span className="text-[10px] text-carbon/60 uppercase font-bold block">
                OUTGOING AUTHORITY:
              </span>
              <span className="font-bold text-carbon text-sm block">{outgoingLeader}</span>
              <span className="text-[11px] text-carbon/70 block font-sans">
                Relinquishing IND Filings & Trial Protocol Sign-Off
              </span>
            </div>

            <div className="p-3 border border-carbon bg-raw-paper space-y-1 hover:border-carbon/80 transition-colors shadow-brutal">
              <span className="text-[10px] text-carbon/60 uppercase font-bold block">
                INCOMING SUCCESSOR:
              </span>
              <span className="font-bold text-carbon text-sm block">{incomingSuccessor}</span>
              <span className="text-[11px] text-carbon/70 block font-sans">
                Incoming Head of Translational Oncology
              </span>
            </div>

            <div className="p-3 border border-carbon bg-raw-paper space-y-1 hover:border-signal-orange/60 transition-colors shadow-brutal">
              <span className="text-[10px] text-signal-orange uppercase font-bold block">
                IMMINENT BLOCKER:
              </span>
              <span className="font-bold text-signal-orange text-sm block truncate">
                {continuity && continuity.critical_blockers.length > 0
                  ? continuity.critical_blockers[0].statement.slice(0, 48) + "..."
                  : (isLoading ? "Loading blockers..." : "No critical path blockers")}
              </span>
              <span className="text-[11px] text-carbon/70 block font-sans">
                {continuity && continuity.critical_blockers.length > 0 && continuity.critical_blockers[0].deadline
                  ? `Deadline: ${new Date(continuity.critical_blockers[0].deadline).toLocaleDateString()} (Critical Path)`
                  : (isLoading ? "Synchronizing ledger..." : "Primary operational roadmap")}
              </span>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* 2. Color-Blocked Telemetry Strip with Balanced Numbers */}
      <ScrollReveal variant="editorial" delay={0.05}>
        <div className="border-2 border-carbon bg-raw-paper-light font-mono text-xs shadow-brutal">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-y md:divide-y-0 md:divide-x-2 divide-carbon">
            <div className="p-4 space-y-1 hover:bg-concrete/40 transition-colors">
              <span className="text-[10px] uppercase text-carbon/60 font-bold block">
                DEPOSITED RECORDS
              </span>
              <div className="font-display font-black text-2xl text-carbon">
                <AnimatedCounter value={depositedDocsCount} suffix=" DOCS" />
              </div>
              <p className="text-[11px] text-carbon/70 font-sans">Charters, MSAs, minutes</p>
            </div>

            <div className="p-4 space-y-1 hover:bg-concrete/40 transition-colors">
              <span className="text-[10px] uppercase text-carbon/60 font-bold block">
                INDEXED TRIPLES
              </span>
              <div className="font-display font-black text-2xl text-carbon">
                <AnimatedCounter value={entitiesCount} suffix=" ENTITIES" />
              </div>
              <p className="text-[11px] text-carbon/70 font-sans">100% citation linked</p>
            </div>

            <div className="p-4 space-y-1 bg-signal-orange/10 hover:bg-signal-orange/15 transition-colors">
              <span className="text-[10px] uppercase text-signal-orange font-bold block">
                OPEN ANOMALIES
              </span>
              <div className="font-display font-black text-2xl text-signal-orange">
                <AnimatedCounter value={openAnomaliesCount} suffix=" FLAGGED" />
              </div>
              <p className="text-[11px] text-signal-orange font-bold font-sans">Requires Switch review</p>
            </div>

            <div className="p-4 space-y-1 hover:bg-concrete/40 transition-colors">
              <span className="text-[10px] uppercase text-carbon/60 font-bold block">
                READINESS SCORE
              </span>
              <div className="font-display font-black text-2xl text-carbon">
                <AnimatedCounter value={continuityScore} suffix="% READY" />
              </div>
              <p className="text-[11px] text-carbon/70 font-sans">Continuity threshold</p>
            </div>
          </div>

          {/* Telemetry Progress Bar */}
          <div className="border-t-2 border-carbon bg-carbon p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-signal-orange" />
              <span className="text-raw-paper font-bold uppercase text-[10px]">
                CONTINUITY VULNERABILITY INDEX:
              </span>
              <span className="text-raw-paper/70 text-[10px]">
                TARGET &ge; 80% (CURRENT: {continuityScore}%)
              </span>
            </div>
            <div className="flex-1 max-w-sm h-3 bg-carbon-surface border border-raw-paper/30 relative overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${continuityScore}%` }}
                transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                className={`h-full ${
                  continuityScore >= 80
                    ? "bg-industrial-green"
                    : continuityScore >= 50
                    ? "bg-signal-orange"
                    : "bg-signal-red"
                }`}
              />
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* 3. Main Operational Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Critical Unresolved Matters Table */}
        <div className="lg:col-span-8 space-y-5">
          <ScrollReveal variant="industrial" delay={0.1}>
            <div className="border-2 border-carbon bg-raw-paper-light shadow-brutal">
              <div className="p-4 sm:p-5 border-b-2 border-carbon bg-raw-paper flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-display font-black text-lg uppercase text-carbon">
                    Critical Unresolved Matters & Discrepancies
                  </h2>
                  <p className="text-xs text-carbon/70 font-sans mt-0.5">
                    Anomalies requiring human adjudication at the Switch review desk
                  </p>
                </div>
                <Link href="/app/investigations" data-cursor="VIEW">
                  <Button variant="outline" size="sm" magnetic={true}>
                    Desk View ({conflicts.length > 0 ? conflicts.length : openAnomaliesCount}) →
                  </Button>
                </Link>
              </div>

              <div className="divide-y-2 divide-carbon">
                {conflicts.length > 0 ? (
                  conflicts.slice(0, 4).map((c, idx) => (
                    <div
                      key={c.id}
                      data-cursor="INSPECT"
                      className="p-4 space-y-2 bg-raw-paper-light hover:bg-concrete/30 transition-all hover:translate-x-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono text-xs px-2 py-0.5 text-raw-paper font-bold ${
                              c.severity === "critical"
                                ? "bg-signal-red"
                                : c.severity === "high"
                                ? "bg-signal-orange"
                                : "bg-carbon"
                            }`}
                          >
                            CASE-BIO-{String(idx + 1).padStart(2, "0")}
                          </span>
                          <h3 className="font-display font-black text-sm uppercase text-carbon">
                            {c.title}
                          </h3>
                        </div>
                        <EvidenceBadge
                          status={
                            c.conflict_type === "contradiction"
                              ? "conflicting"
                              : c.conflict_type === "superseded_decision"
                              ? "pending-review"
                              : "missing"
                          }
                          size="sm"
                        />
                      </div>
                      <p className="text-xs sm:text-sm text-carbon/80 font-sans leading-relaxed">
                        {c.description}
                      </p>
                      <div className="flex items-center justify-between pt-1 font-mono text-[11px] text-carbon/60 border-t border-carbon/10">
                        <span>
                          SOURCE: {c.document_filename || "Repository Record"} • {c.conflict_type.toUpperCase()}
                        </span>
                        <Link
                          href="/app/investigations"
                          data-cursor="ADJUDICATE"
                          className="text-signal-orange font-bold hover:underline inline-flex items-center gap-1"
                        >
                          Resolve in Switch →
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div
                      data-cursor="INSPECT"
                      className="p-4 space-y-2 bg-raw-paper-light hover:bg-concrete/30 transition-all hover:translate-x-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs px-2 py-0.5 bg-signal-orange text-raw-paper font-bold">
                            CASE-BIO-09
                          </span>
                          <h3 className="font-display font-black text-sm uppercase text-carbon">
                            FDA Form 1572 Principal Investigator Sign-Off Mismatch
                          </h3>
                        </div>
                        <EvidenceBadge status="conflicting" size="sm" />
                      </div>
                      <p className="text-xs sm:text-sm text-carbon/80 font-sans leading-relaxed">
                        Vendor MSA Amendment 3 names Dr. Marcus Thorne as sponsor representative, while FDA Form 1572 lists Dr. Eleanor Vance. Discrepancy risks clinical hold on Phase II Oncology trials.
                      </p>
                      <div className="flex items-center justify-between pt-1 font-mono text-[11px] text-carbon/60 border-t border-carbon/10">
                        <span>SOURCE: Regulatory-Audit-Q3-2024.pdf (p. 14)</span>
                        <Link href="/app/investigations" data-cursor="ADJUDICATE" className="text-signal-orange font-bold hover:underline inline-flex items-center gap-1">
                          Resolve in Switch →
                        </Link>
                      </div>
                    </div>

                    <div
                      data-cursor="INSPECT"
                      className="p-4 space-y-2 bg-raw-paper-light hover:bg-concrete/30 transition-all hover:translate-x-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs px-2 py-0.5 bg-signal-orange text-raw-paper font-bold">
                            CASE-BIO-14
                          </span>
                          <h3 className="font-display font-black text-sm uppercase text-carbon">
                            $140,000 Spectrometry Lab Contract Auto-Renewal
                          </h3>
                        </div>
                        <EvidenceBadge status="missing" size="sm" />
                      </div>
                      <p className="text-xs sm:text-sm text-carbon/80 font-sans leading-relaxed">
                        Automatic 12-month renewal triggers on November 15, 2024 unless written opt-out is delivered by October 15. Sign-off authority is unassigned in the transition charter.
                      </p>
                      <div className="flex items-center justify-between pt-1 font-mono text-[11px] text-carbon/60 border-t border-carbon/10">
                        <span>SOURCE: Vendor-Master-Agreement-2023.docx (Sec. 8.2)</span>
                        <Link href="/app/investigations" data-cursor="ADJUDICATE" className="text-signal-orange font-bold hover:underline inline-flex items-center gap-1">
                          Resolve in Switch →
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </ScrollReveal>

          {/* Quick Intake Dock */}
          <ScrollReveal variant="industrial" delay={0.15}>
            <div className="border-2 border-carbon bg-raw-paper p-4 sm:p-5 space-y-3 shadow-brutal">
              <div className="flex items-center justify-between border-b border-carbon/20 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-carbon" />
                  <h3 className="font-display font-black text-sm uppercase text-carbon">
                    Quick Ingestion Dock
                  </h3>
                </div>
                <span className="font-mono text-[10px] text-carbon/60 uppercase">
                  LOCAL INTAKE BUFFER
                </span>
              </div>

              <FileUploader onFilesSelected={(files) => setStagedFiles(files)} />

              {stagedFiles.length > 0 && (
                <div className="pt-2 flex items-center justify-between gap-3">
                  <span className="font-mono text-xs text-carbon font-bold">
                    {stagedFiles.length} file(s) staged for vault deposit
                  </span>
                  <Button
                    variant="signal"
                    size="sm"
                    magnetic={true}
                    onClick={handleDepositAndExtract}
                    disabled={isProcessing}
                    data-cursor="COMMIT"
                  >
                    Deposit &amp; Extract Structured Triples →
                  </Button>
                </div>
              )}

              {uploadStatus && (
                <div className="p-2.5 bg-carbon text-raw-paper font-mono text-xs border border-carbon">
                  {uploadStatus}
                </div>
              )}
            </div>
          </ScrollReveal>
        </div>

        {/* Right Column (4 cols): Quick Navigator & Modules */}
        <div className="lg:col-span-4 space-y-5">
          <ScrollReveal variant="editorial" delay={0.15}>
            <div className="border-2 border-carbon bg-raw-paper-light p-5 space-y-5 shadow-brutal">
              <div className="border-b-2 border-carbon pb-3">
                <span className="font-mono text-[10px] uppercase font-bold text-signal-orange block">
                  CONTINUITY MODULES
                </span>
                <h3 className="font-display font-black text-base uppercase text-carbon mt-0.5">
                  Workspace Navigation
                </h3>
              </div>

              <div className="space-y-2.5 font-mono text-xs">
                <Link
                  href="/app/archive"
                  className="p-3 border border-carbon bg-raw-paper flex items-center justify-between hover:bg-carbon hover:text-raw-paper transition-all group shadow-brutal block"
                >
                  <div className="flex items-center gap-2">
                    <IconDocument size={14} className="text-signal-orange" />
                    <span className="font-bold uppercase text-[11px]">Knowledge Archive</span>
                  </div>
                  <IconArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/app/investigations"
                  className="p-3 border border-carbon bg-raw-paper flex items-center justify-between hover:bg-carbon hover:text-raw-paper transition-all group shadow-brutal block"
                >
                  <div className="flex items-center gap-2">
                    <IconAlert size={14} className="text-signal-orange" />
                    <span className="font-bold uppercase text-[11px]">Discrepancy Desk</span>
                  </div>
                  <IconArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/app/map"
                  className="p-3 border border-carbon bg-raw-paper flex items-center justify-between hover:bg-carbon hover:text-raw-paper transition-all group shadow-brutal block"
                >
                  <div className="flex items-center gap-2">
                    <IconNetwork size={14} className="text-signal-orange" />
                    <span className="font-bold uppercase text-[11px]">Continuity Topology</span>
                  </div>
                  <IconArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/app/handovers"
                  className="p-3 border border-carbon bg-raw-paper flex items-center justify-between hover:bg-carbon hover:text-raw-paper transition-all group shadow-brutal block"
                >
                  <div className="flex items-center gap-2">
                    <IconDossier size={14} className="text-signal-orange" />
                    <span className="font-bold uppercase text-[11px]">Handover Dossiers</span>
                  </div>
                  <IconArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="pt-3 border-t border-carbon/20 font-mono text-[10px] text-carbon/70 space-y-0.5">
                <p>• Local SQLite database (WAL)</p>
                <p>• Direct SHA-256 integrity verification</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}
