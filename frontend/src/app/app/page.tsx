"use client";

import React, { useState } from "react";
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

export default function WorkspaceOverviewPage() {
  const [uploaderOpen, setUploaderOpen] = useState(false);

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
              Acme BioSystems Discovery Division • Dr. Eleanor Vance → Dr. Marcus Thorne
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-center font-mono text-xs">
            <span className="px-2.5 py-1 bg-industrial-green text-raw-paper font-bold uppercase border border-carbon">
              STATUS: IN PROGRESS
            </span>
            <span className="px-2.5 py-1 bg-carbon text-raw-paper font-bold uppercase border border-carbon">
              TARGET: NOV 30, 2024
            </span>
          </div>
        </div>

        {/* 3 Key Transition Vectors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-3 border border-carbon bg-raw-paper space-y-1">
            <span className="text-[10px] text-carbon/60 uppercase font-bold block">
              // OUTGOING AUTHORITY:
            </span>
            <span className="font-bold text-carbon text-sm block">Dr. Eleanor Vance</span>
            <span className="text-[11px] text-carbon/70 block">Relinquishing IND Filings & Trial Protocol Sign-Off</span>
          </div>

          <div className="p-3 border border-carbon bg-raw-paper space-y-1">
            <span className="text-[10px] text-carbon/60 uppercase font-bold block">
              // INCOMING SUCCESSOR:
            </span>
            <span className="font-bold text-carbon text-sm block">Dr. Marcus Thorne</span>
            <span className="text-[11px] text-carbon/70 block">Incoming Head of Translational Oncology</span>
          </div>

          <div className="p-3 border border-carbon bg-raw-paper space-y-1">
            <span className="text-[10px] text-signal-orange uppercase font-bold block">
              // IMMINENT BLOCKER:
            </span>
            <span className="font-bold text-signal-orange text-sm block">FDA PI 1572 Co-Signature</span>
            <span className="text-[11px] text-carbon/70 block">Deadline: November 1, 2024 (Critical Path)</span>
          </div>
        </div>
      </div>

      {/* 2. Color-Blocked Telemetry Strip (NO FAKE METRICS) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-2 border-carbon divide-y md:divide-y-0 md:divide-x-2 divide-carbon bg-raw-paper-light font-mono text-xs">
        <div className="p-4 space-y-1">
          <span className="text-[10px] uppercase text-carbon/60 font-bold block">
            DEPOSITED RECORDS
          </span>
          <div className="font-display font-black text-2xl text-carbon">42 DOCS</div>
          <p className="text-[10px] text-carbon/70">Charters, MSAs, minutes</p>
        </div>

        <div className="p-4 space-y-1">
          <span className="text-[10px] uppercase text-carbon/60 font-bold block">
            INDEXED TRIPLES
          </span>
          <div className="font-display font-black text-2xl text-carbon">312 ENTITIES</div>
          <p className="text-[10px] text-carbon/70">100% citation linked</p>
        </div>

        <div className="p-4 space-y-1 bg-signal-orange/10">
          <span className="text-[10px] uppercase text-signal-orange font-bold block">
            OPEN ANOMALIES
          </span>
          <div className="font-display font-black text-2xl text-signal-orange">3 FLAGGED</div>
          <p className="text-[10px] text-signal-orange font-bold">Requires Switch review</p>
        </div>

        <div className="p-4 space-y-1">
          <span className="text-[10px] uppercase text-carbon/60 font-bold block">
            ACTIVE OBLIGATIONS
          </span>
          <div className="font-display font-black text-2xl text-carbon">4 ASSIGNED</div>
          <p className="text-[10px] text-carbon/70">Upcoming 30-day window</p>
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
                  Critical Unresolved Matters
                </h3>
                <p className="font-mono text-xs text-carbon/70 mt-0.5">
                  Anomalies requiring human adjudication at the Switch review desk
                </p>
              </div>
              <Link href="/app/investigations">
                <Button variant="outline" size="sm">
                  Desk View (3) →
                </Button>
              </Link>
            </div>

            <div className="divide-y-2 divide-carbon">
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
                // LOCAL INTAKE BUFFER
              </span>
            </div>
            <FileUploader />
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
              <Link href="/app/responsibilities" className="font-mono text-xs text-signal-orange font-bold hover:underline">
                Matrix →
              </Link>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 border border-carbon bg-raw-paper space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-signal-orange font-bold">DUE: NOV 01</span>
                  <span className="text-carbon/60">REGULATORY</span>
                </div>
                <p className="font-bold text-carbon font-sans text-xs">
                  Re-submit FDA Form 1572 Protocol Lead
                </p>
                <span className="text-[10px] text-carbon/60 block">Owner: Dr. Marcus Thorne</span>
              </div>

              <div className="p-3 border border-carbon bg-raw-paper space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-signal-orange font-bold">DUE: OCT 15</span>
                  <span className="text-carbon/60">FINANCIAL</span>
                </div>
                <p className="font-bold text-carbon font-sans text-xs">
                  Spectrometry Lab Contract Termination Notice
                </p>
                <span className="text-[10px] text-carbon/60 block">Owner: Unassigned (Finance Liaison)</span>
              </div>

              <div className="p-3 border border-carbon bg-raw-paper space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-carbon/60 font-bold">DUE: NOV 20</span>
                  <span className="text-carbon/60">LEGAL</span>
                </div>
                <p className="font-bold text-carbon font-sans text-xs">
                  Execute Compound C-409 Patent Assignment
                </p>
                <span className="text-[10px] text-carbon/60 block">Owner: Legal Escrow Officer</span>
              </div>
            </div>
          </div>

          {/* Handover Dossier Readiness */}
          <div className="border-2 border-carbon bg-carbon text-raw-paper p-5 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-signal-orange font-bold">
              <span>// DOSSIER GENERATION</span>
              <span>READY</span>
            </div>
            <p className="font-sans text-xs text-raw-paper/80 leading-relaxed">
              Dossier Architect has compiled Chapters 1 through 5. Final board sign-off awaiting resolution of CASE-BIO-09.
            </p>
            <Link href="/app/handovers" className="block pt-2">
              <Button variant="signal" size="sm" className="w-full">
                Review Handover Dossier
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
