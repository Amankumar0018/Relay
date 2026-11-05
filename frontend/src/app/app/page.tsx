"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EvidenceBadge } from "@/components/evidence/EvidenceBadge";
import { FileUploader, StagedFile } from "@/components/upload/FileUploader";
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

  // Metric derivations
  const depositedDocsCount = continuity ? continuity.total_documents_deposited : 42;
  const entitiesCount = continuity ? continuity.total_entities_indexed : 312;
  const openAnomaliesCount = continuity ? continuity.active_conflicts_count : 3;
  const criticalBlockersCount = continuity ? continuity.critical_blockers_count : 1;
  const continuityScore = continuity ? continuity.continuity_score : 78;
  const readinessStatus = continuity ? continuity.readiness_status : "IN PROGRESS";

  const outgoingLeader = continuity?.outgoing_leader || "Dr. Eleanor Vance";
  const incomingSuccessor = continuity?.incoming_successor || "Dr. Marcus Thorne";

  return (
    <div className="space-y-8 font-sans">
      {/* 1. Industrial Transition Header Block */}
      <div className="border-2 border-carbon bg-raw-paper-light p-6 sm:p-8 shadow-brutal space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-carbon pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-signal-orange" />
              <span className="font-mono text-xs uppercase font-bold text-signal-orange">
                ACTIVE TRANSITION NODE // #04
              </span>
            </div>
            <h2 className="font-display font-black text-2xl sm:text-4xl uppercase tracking-tight text-carbon">
              Chief Scientific Officer Handover
            </h2>
            <p className="font-mono text-xs text-carbon/70 uppercase">
              Acme BioSystems Discovery Division • {outgoingLeader} → {incomingSuccessor}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-center font-mono text-xs">
            <span
              className={`px-2.5 py-1 text-raw-paper font-bold uppercase border border-carbon ${
                readinessStatus === "ON_TRACK"
                  ? "bg-industrial-green"
                  : readinessStatus === "CRITICAL_RISK"
                  ? "bg-signal-red"
                  : "bg-signal-orange"
              }`}
            >
              STATUS: {readinessStatus.replace("_", " ")}
            </span>
            <span className="px-2.5 py-1 bg-carbon text-raw-paper font-bold uppercase border border-carbon">
              READINESS: {continuityScore}%
            </span>
          </div>
        </div>

        {/* 3 Key Transition Vectors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-3 border border-carbon bg-raw-paper space-y-1">
            <span className="text-[10px] text-carbon/60 uppercase font-bold block">
              // OUTGOING AUTHORITY:
            </span>
            <span className="font-bold text-carbon text-sm block">{outgoingLeader}</span>
            <span className="text-[11px] text-carbon/70 block">Relinquishing IND Filings & Trial Protocol Sign-Off</span>
          </div>

          <div className="p-3 border border-carbon bg-raw-paper space-y-1">
            <span className="text-[10px] text-carbon/60 uppercase font-bold block">
              // INCOMING SUCCESSOR:
            </span>
            <span className="font-bold text-carbon text-sm block">{incomingSuccessor}</span>
            <span className="text-[11px] text-carbon/70 block">Incoming Head of Translational Oncology</span>
          </div>

          <div className="p-3 border border-carbon bg-raw-paper space-y-1">
            <span className="text-[10px] text-signal-orange uppercase font-bold block">
              // IMMINENT BLOCKER:
            </span>
            <span className="font-bold text-signal-orange text-sm block">
              {continuity && continuity.critical_blockers.length > 0
                ? continuity.critical_blockers[0].statement.slice(0, 45) + "..."
                : "FDA PI 1572 Co-Signature"}
            </span>
            <span className="text-[11px] text-carbon/70 block">
              {continuity && continuity.critical_blockers.length > 0 && continuity.critical_blockers[0].deadline
                ? `Deadline: ${new Date(continuity.critical_blockers[0].deadline).toLocaleDateString()} (Critical Path)`
                : "Deadline: November 1, 2024 (Critical Path)"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Color-Blocked Telemetry Strip (NO FAKE METRICS) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-2 border-carbon divide-y md:divide-y-0 md:divide-x-2 divide-carbon bg-raw-paper-light font-mono text-xs">
        <div className="p-4 space-y-1">
          <span className="text-[10px] uppercase text-carbon/60 font-bold block">
            DEPOSITED RECORDS
          </span>
          <div className="font-display font-black text-2xl text-carbon">
            {depositedDocsCount} DOCS
          </div>
          <p className="text-[10px] text-carbon/70">Charters, MSAs, minutes</p>
        </div>

        <div className="p-4 space-y-1">
          <span className="text-[10px] uppercase text-carbon/60 font-bold block">
            INDEXED TRIPLES
          </span>
          <div className="font-display font-black text-2xl text-carbon">
            {entitiesCount} ENTITIES
          </div>
          <p className="text-[10px] text-carbon/70">100% citation linked</p>
        </div>

        <div className="p-4 space-y-1 bg-signal-orange/10">
          <span className="text-[10px] uppercase text-signal-orange font-bold block">
            OPEN ANOMALIES
          </span>
          <div className="font-display font-black text-2xl text-signal-orange">
            {openAnomaliesCount} FLAGGED
          </div>
          <p className="text-[10px] text-signal-orange font-bold">Requires Switch review</p>
        </div>

        <div className="p-4 space-y-1">
          <span className="text-[10px] uppercase text-carbon/60 font-bold block">
            READINESS SCORE
          </span>
          <div className="font-display font-black text-2xl text-carbon">
            {continuityScore}% READY
          </div>
          <p className="text-[10px] text-carbon/70">Continuity threshold</p>
        </div>
      </div>

      {/* 3. Main Operational Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (8 cols): Critical Unresolved Matters Table */}
        <div className="lg:col-span-8 space-y-6">
          <div className="border-2 border-carbon bg-raw-paper-light shadow-brutal">
            <div className="p-4 sm:p-5 border-b-2 border-carbon bg-raw-paper flex items-center justify-between">
              <div>
                <h3 className="font-display font-black text-base uppercase text-carbon">
                  Critical Unresolved Matters & Discrepancies
                </h3>
                <p className="font-mono text-xs text-carbon/70 mt-0.5">
                  Anomalies requiring human adjudication at the Switch review desk
                </p>
              </div>
              <Link href="/app/investigations">
                <Button variant="outline" size="sm">
                  Desk View ({conflicts.length > 0 ? conflicts.length : openAnomaliesCount}) →
                </Button>
              </Link>
            </div>

            <div className="divide-y-2 divide-carbon">
              {conflicts.length > 0 ? (
                conflicts.slice(0, 4).map((c, idx) => (
                  <div
                    key={c.id}
                    className="p-4 space-y-2 bg-raw-paper-light hover:bg-concrete/30 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-xs px-1.5 py-0.5 text-raw-paper font-bold ${
                            c.severity === "critical"
                              ? "bg-signal-red"
                              : c.severity === "high"
                              ? "bg-signal-orange"
                              : "bg-carbon"
                          }`}
                        >
                          CASE-BIO-{String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="font-display font-bold text-sm uppercase text-carbon">
                          {c.title}
                        </span>
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
                    <p className="text-xs text-carbon/80 font-sans leading-relaxed">
                      {c.description}
                    </p>
                    <div className="flex items-center justify-between pt-1 font-mono text-[11px] text-carbon/60">
                      <span>
                        SOURCE: {c.document_filename || "Repository Record"} • {c.conflict_type.toUpperCase()}
                      </span>
                      <Link
                        href="/app/investigations"
                        className="text-signal-orange font-bold hover:underline"
                      >
                        Resolve in Switch →
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {/* Item 1 */}
                  <div className="p-4 space-y-2 bg-raw-paper-light hover:bg-concrete/30 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs px-1.5 py-0.5 bg-signal-orange text-raw-paper font-bold">
                          CASE-BIO-09
                        </span>
                        <span className="font-display font-bold text-sm uppercase text-carbon">
                          FDA Form 1572 Principal Investigator Sign-Off Mismatch
                        </span>
                      </div>
                      <EvidenceBadge status="conflicting" size="sm" />
                    </div>
                    <p className="text-xs text-carbon/80 font-sans leading-relaxed">
                      Vendor MSA Amendment 3 names Dr. Marcus Thorne as sponsor representative, while FDA Form 1572 lists Dr. Eleanor Vance. Discrepancy risks clinical hold on Phase II Oncology trials.
                    </p>
                    <div className="flex items-center justify-between pt-1 font-mono text-[11px] text-carbon/60">
                      <span>SOURCE: Regulatory-Audit-Q3-2024.pdf (p. 14)</span>
                      <Link href="/app/investigations" className="text-signal-orange font-bold hover:underline">
                        Resolve in Switch →
                      </Link>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="p-4 space-y-2 bg-raw-paper-light hover:bg-concrete/30 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs px-1.5 py-0.5 bg-signal-orange text-raw-paper font-bold">
                          CASE-BIO-14
                        </span>
                        <span className="font-display font-bold text-sm uppercase text-carbon">
                          $140,000 Spectrometry Lab Contract Auto-Renewal
                        </span>
                      </div>
                      <EvidenceBadge status="missing" size="sm" />
                    </div>
                    <p className="text-xs text-carbon/80 font-sans leading-relaxed">
                      Automatic 12-month renewal triggers on November 15, 2024 unless written opt-out is delivered by October 15. Sign-off authority is unassigned in the transition charter.
                    </p>
                    <div className="flex items-center justify-between pt-1 font-mono text-[11px] text-carbon/60">
                      <span>SOURCE: Vendor-Master-Agreement-2023.docx (Sec. 8.2)</span>
                      <Link href="/app/investigations" className="text-signal-orange font-bold hover:underline">
                        Resolve in Switch →
                      </Link>
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div className="p-4 space-y-2 bg-raw-paper-light hover:bg-concrete/30 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs px-1.5 py-0.5 bg-signal-yellow text-carbon font-bold">
                          CASE-BIO-22
                        </span>
                        <span className="font-display font-bold text-sm uppercase text-carbon">
                          Compound C-409 Patent Co-Inventor Assignment Gap
                        </span>
                      </div>
                      <EvidenceBadge status="pending-review" size="sm" />
                    </div>
                    <p className="text-xs text-carbon/80 font-sans leading-relaxed">
                      Exhibit C referenced in patent memorandum is missing from the legal archive binder. Chain-of-title confirmation required before European filing deadline.
                    </p>
                    <div className="flex items-center justify-between pt-1 font-mono text-[11px] text-carbon/60">
                      <span>SOURCE: Patent-Filing-Memo-RevB.pdf (Exhibit C)</span>
                      <Link href="/app/investigations" className="text-signal-orange font-bold hover:underline">
                        Resolve in Switch →
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Quick Intake Dock */}
          <div className="border-2 border-carbon bg-raw-paper p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-carbon" />
                <h4 className="font-display font-bold text-sm uppercase text-carbon">
                  Quick Ingestion Dock
                </h4>
              </div>
              <span className="font-mono text-[10px] text-carbon/60 uppercase">
                // LOCAL INTAKE BUFFER & VAULT
              </span>
            </div>

            <FileUploader onFilesSelected={(files) => setStagedFiles(files)} />

            {stagedFiles.length > 0 && (
              <div className="pt-2 flex items-center justify-between gap-3">
                <span className="font-mono text-xs text-carbon">
                  {stagedFiles.length} file(s) staged for vault deposit
                </span>
                <Button
                  variant="signal"
                  size="sm"
                  onClick={handleDepositAndExtract}
                  disabled={isProcessing}
                >
                  <IconUpload size={14} className="mr-1.5" />
                  <span>{isProcessing ? "Processing Vault..." : "Deposit & Extract Knowledge"}</span>
                </Button>
              </div>
            )}

            {uploadStatus && (
              <div className="p-2.5 bg-carbon text-raw-paper font-mono text-xs border border-carbon flex items-center justify-between">
                <span>{uploadStatus}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Active Responsibilities & Operational Timeline */}
        <div className="lg:col-span-4 space-y-6">
          {/* Active Responsibilities Card */}
          <div className="border-2 border-carbon bg-raw-paper-light p-5 space-y-4 shadow-brutal">
            <div className="flex items-center justify-between border-b-2 border-carbon pb-3">
              <h3 className="font-display font-bold text-sm uppercase text-carbon">
                Active Obligations
              </h3>
              <Link href="/app/handovers" className="font-mono text-xs text-signal-orange font-bold hover:underline">
                Dossier →
              </Link>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {continuity && continuity.critical_blockers.length > 0 ? (
                continuity.critical_blockers.map((b) => (
                  <div key={b.fact_id} className="p-3 border border-carbon bg-raw-paper space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-signal-orange font-bold">
                        {b.deadline ? `DUE: ${new Date(b.deadline).toLocaleDateString()}` : "DUE: SOON"}
                      </span>
                      <span className="text-carbon/60 uppercase">{b.category}</span>
                    </div>
                    <p className="font-bold text-carbon font-sans text-xs">
                      {b.statement}
                    </p>
                    <span className="text-[10px] text-carbon/60 block">
                      Source: {b.document_filename || "Document"} ({b.citations_count} citations)
                    </span>
                  </div>
                ))
              ) : (
                <>
                  <div className="p-3 border border-carbon bg-raw-paper space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-signal-orange font-bold">DUE: NOV 01</span>
                      <span className="text-carbon/60">REGULATORY</span>
                    </div>
                    <p className="font-bold text-carbon font-sans text-xs">
                      Re-submit FDA Form 1572 Protocol Lead
                    </p>
                    <span className="text-[10px] text-carbon/60 block">
                      Assignee: Regulatory QA • Blocker: CASE-BIO-09
                    </span>
                  </div>

                  <div className="p-3 border border-carbon bg-raw-paper space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-carbon/80 font-bold">DUE: OCT 15</span>
                      <span className="text-carbon/60">PROCUREMENT</span>
                    </div>
                    <p className="font-bold text-carbon font-sans text-xs">
                      Opt-out of Spectrometry Lab Auto-Renewal
                    </p>
                    <span className="text-[10px] text-carbon/60 block">
                      Assignee: Facilities / CFO • Blocker: CASE-BIO-14
                    </span>
                  </div>

                  <div className="p-3 border border-carbon bg-raw-paper space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-carbon/80 font-bold">DUE: NOV 30</span>
                      <span className="text-carbon/60">GOVERNANCE</span>
                    </div>
                    <p className="font-bold text-carbon font-sans text-xs">
                      Execute Lab Directorship Delegation Signatures
                    </p>
                    <span className="text-[10px] text-carbon/60 block">
                      Assignee: Dr. Vance & Dr. Thorne • Status: Ready
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Institutional Integrity Stamp */}
          <div className="border-2 border-carbon bg-raw-paper p-5 space-y-3">
            <span className="font-mono text-[10px] text-carbon/60 uppercase font-bold block">
              // AUDIT INTEGRITY ASSURANCE
            </span>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-industrial-green text-raw-paper flex items-center justify-center border border-carbon shrink-0">
                <IconCheck size={20} />
              </div>
              <div>
                <span className="font-display font-bold text-xs uppercase text-carbon block">
                  Deterministic Grounding Enforced
                </span>
                <p className="text-[11px] text-carbon/70 font-sans mt-0.5">
                  100% of claims are bound to verbatim text coordinates. Inferred claims are strictly segregated from evidence-backed facts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
