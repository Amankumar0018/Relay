"use client";

import React, { useState } from "react";
import {
  IconDossier,
  IconCheck,
  IconAlert,
  IconDocument,
  IconUser,
  IconArrowRight,
  IconBuilding,
} from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { EvidenceBadge } from "@/components/evidence/EvidenceBadge";

export default function HandoverDossiersPage() {
  const [activeChapter, setActiveChapter] = useState<
    "ch1" | "ch2" | "ch3" | "ch4" | "ch5"
  >("ch1");
  const [exportNotice, setExportNotice] = useState(false);

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-carbon pb-4">
        <div>
          <span className="font-mono text-xs uppercase font-bold text-signal-orange">
            // MASTER DELIVERABLE
          </span>
          <h2 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-carbon">
            Executive Handover Dossier
          </h2>
          <p className="font-mono text-xs text-carbon/70 uppercase">
            DELIVERABLE #DOS-2024-CSO-01 • ACME BIOSYSTEMS TRANSITION NODE
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
          >
            <span>Print View</span>
          </Button>
          <Button
            variant="signal"
            size="sm"
            onClick={() => {
              setExportNotice(true);
              setTimeout(() => setExportNotice(false), 4000);
            }}
          >
            <span>Export Structured Dossier</span>
          </Button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 bg-industrial-green text-raw-paper font-mono text-xs border border-carbon flex items-center justify-between">
          <span className="font-bold">✓ DOSSIER EXPORTED TO LOCAL DISK WITH CRYPTOGRAPHIC CITATION ANCHORS</span>
          <button onClick={() => setExportNotice(false)} className="underline uppercase">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Document Plate */}
      <article className="border-2 border-carbon bg-raw-paper shadow-brutal-lg overflow-hidden">
        {/* Document Binder Cover Header */}
        <div className="p-6 sm:p-10 border-b-2 border-carbon bg-carbon text-raw-paper space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono border-b border-raw-paper/20 pb-4">
            <span className="text-signal-orange font-bold uppercase tracking-wider">
              // INSTITUTIONAL CONTINUITY DOSSIER
            </span>
            <div className="flex items-center gap-3 text-raw-paper/60 uppercase">
              <span>STATUS: COMPILED</span>
              <span>•</span>
              <span>EFFECTIVE: NOVEMBER 30, 2024</span>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="font-display font-black text-2xl sm:text-4xl uppercase tracking-tight text-raw-paper leading-tight">
              Executive Briefing Book: Chief Scientific Officer Transition
            </h1>
            <p className="font-sans text-xs sm:text-sm text-raw-paper/80 leading-relaxed max-w-2xl">
              Preserved organizational decisions, operational obligations, active trial protocols, and resolved institutional matters for incoming leadership.
            </p>
          </div>

          {/* Signatory Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
            <div className="p-3 bg-carbon-surface border border-raw-paper/20 space-y-1">
              <span className="text-[10px] text-raw-paper/60 uppercase font-bold block">
                OUTGOING AUTHORITY:
              </span>
              <span className="font-bold text-raw-paper block">Dr. Eleanor Vance (CSO)</span>
              <span className="text-industrial-green-light text-[10px] block">✓ Signed Oct 28, 2024</span>
            </div>

            <div className="p-3 bg-carbon-surface border border-raw-paper/20 space-y-1">
              <span className="text-[10px] text-raw-paper/60 uppercase font-bold block">
                INCOMING SUCCESSOR:
              </span>
              <span className="font-bold text-raw-paper block">Dr. Marcus Thorne</span>
              <span className="text-signal-yellow text-[10px] block">⏳ Counter-signature Pending</span>
            </div>

            <div className="p-3 bg-carbon-surface border border-raw-paper/20 space-y-1">
              <span className="text-[10px] text-raw-paper/60 uppercase font-bold block">
                COMPLIANCE OVERSIGHT:
              </span>
              <span className="font-bold text-raw-paper block">General Counsel & QA</span>
              <span className="text-signal-orange text-[10px] block">⏳ Awaiting CASE-BIO-09</span>
            </div>
          </div>
        </div>

        {/* Chapter Navigation Bar */}
        <div className="border-b-2 border-carbon bg-concrete/40 p-2 flex flex-wrap gap-1 font-mono text-xs">
          {[
            { id: "ch1", label: "CH.01 BACKGROUND & CHARTER" },
            { id: "ch2", label: "CH.02 OPERATIONAL OBLIGATIONS" },
            { id: "ch3", label: "CH.03 ANOMALIES & GAPS" },
            { id: "ch4", label: "CH.04 FIRST-WEEK BLUEPRINT" },
            { id: "ch5", label: "CH.05 CITATIONS & HASHES" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveChapter(tab.id as any)}
              className={`px-3 py-1.5 uppercase font-bold border transition-colors ${
                activeChapter === tab.id
                  ? "bg-carbon text-raw-paper border-carbon shadow-brutal"
                  : "bg-raw-paper text-carbon border-carbon/40 hover:border-carbon"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Chapter Content Area */}
        <div className="p-6 sm:p-10 space-y-8 bg-raw-paper-light">
          {/* Chapter 01: Background & Charter */}
          {activeChapter === "ch1" && (
            <div className="space-y-6">
              <div className="space-y-1 border-b-2 border-carbon pb-3">
                <span className="font-mono text-xs font-bold text-signal-orange">
                  CHAPTER 01 // FOUNDATIONS
                </span>
                <h3 className="font-display font-black text-xl uppercase text-carbon">
                  Organizational Context & Mandate Handover
                </h3>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-carbon leading-relaxed font-sans">
                <p>
                  Acme BioSystems Discovery Research Division oversees Phase II Oncology clinical trial assets and preclinical kinase inhibitor discovery. Following six years of leadership under Chief Scientific Officer Dr. Eleanor Vance, operational directorship transfers to Dr. Marcus Thorne effective November 30, 2024.
                </p>
                <p>
                  Pursuant to Executive Committee Charter Section 3.1, this transition dossier documents all active trial protocols, vendor renewal opt-outs, and pending regulatory declarations to guarantee uninterrupted FDA compliance.
                </p>
              </div>

              <div className="p-4 border-2 border-carbon bg-raw-paper space-y-2 font-mono text-xs">
                <span className="text-[10px] uppercase font-bold text-signal-orange">
                  KEY DECISION REGISTER (2020 - 2024):
                </span>
                <ul className="space-y-1.5 text-carbon">
                  <li className="flex items-start gap-2">
                    <span className="font-bold">[2021]</span>
                    <span>Selection of Compound C-409 as lead kinase inhibitor program candidate.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">[2023]</span>
                    <span>Execution of Master Services Agreement with Apex BioAnalytical for spectrometry testing.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">[2024]</span>
                    <span>Submission of FDA IND Filings #99201 and #99204 for multi-site Phase II oncology trials.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Chapter 02: Operational Obligations */}
          {activeChapter === "ch2" && (
            <div className="space-y-6">
              <div className="space-y-1 border-b-2 border-carbon pb-3">
                <span className="font-mono text-xs font-bold text-signal-orange">
                  CHAPTER 02 // COMMITMENTS
                </span>
                <h3 className="font-display font-black text-xl uppercase text-carbon">
                  Active Operational Obligations & Delegations
                </h3>
              </div>

              <div className="divide-y-2 divide-carbon border-2 border-carbon bg-raw-paper font-mono text-xs">
                <div className="p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-signal-orange">[RES-01] FDA Form 1572 Co-Signature</span>
                    <span className="text-carbon/60">DEADLINE: NOV 01</span>
                  </div>
                  <p className="font-sans text-xs text-carbon">
                    Submit updated sponsor protocol representation to FDA trial registry. Lead: Dr. Thorne.
                  </p>
                </div>

                <div className="p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-signal-orange">[RES-02] Spectrometry Lab Termination Notice</span>
                    <span className="text-carbon/60">DEADLINE: OCT 15</span>
                  </div>
                  <p className="font-sans text-xs text-carbon">
                    Deliver written 30-day non-renewal notice to Apex BioAnalytical to prevent $140K auto-commitment.
                  </p>
                </div>

                <div className="p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-signal-orange">[RES-03] Biosafety Committee Chair Transfer</span>
                    <span className="text-carbon/60">DEADLINE: NOV 15</span>
                  </div>
                  <p className="font-sans text-xs text-carbon">
                    Ratify delegation of Institutional Biosafety Committee chairmanship to Dr. Thorne.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Chapter 03: Anomalies & Gaps */}
          {activeChapter === "ch3" && (
            <div className="space-y-6">
              <div className="space-y-1 border-b-2 border-carbon pb-3">
                <span className="font-mono text-xs font-bold text-signal-orange">
                  CHAPTER 03 // ANOMALIES & AUDIT
                </span>
                <h3 className="font-display font-black text-xl uppercase text-carbon">
                  Classified Institutional Gaps & Action Log
                </h3>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div className="p-4 border-2 border-carbon bg-raw-paper space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-signal-orange">CASE-BIO-09: FDA Form 1572 Signatory Contradiction</span>
                    <EvidenceBadge status="conflicting" size="sm" />
                  </div>
                  <p className="font-sans text-xs text-carbon">
                    Discrepancy between Vendor Amendment 3 and Form 1572. Action: Joint re-filing scheduled for Oct 30.
                  </p>
                </div>

                <div className="p-4 border-2 border-carbon bg-raw-paper space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-signal-orange">CASE-BIO-14: Spectrometry Renewal Window</span>
                    <EvidenceBadge status="missing" size="sm" />
                  </div>
                  <p className="font-sans text-xs text-carbon">
                    Unassigned termination authority resolved via Switch delegation memo to interim finance liaison.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Chapter 04: First-Week Action Blueprint */}
          {activeChapter === "ch4" && (
            <div className="space-y-6">
              <div className="space-y-1 border-b-2 border-carbon pb-3">
                <span className="font-mono text-xs font-bold text-signal-orange">
                  CHAPTER 04 // TIMELINE
                </span>
                <h3 className="font-display font-black text-xl uppercase text-carbon">
                  Incoming Leader First-Week Action Blueprint
                </h3>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-4 border-2 border-carbon bg-raw-paper space-y-1.5">
                  <div className="flex items-center justify-between text-signal-orange font-bold">
                    <span>DAY 01 // NOVEMBER 18, 2024</span>
                    <span>PROTOCOL CO-SIGNATURE</span>
                  </div>
                  <p className="font-sans text-xs text-carbon">
                    Execute formal joint submission of FDA Form 1572 with Dr. Vance. Receive physical lab notebook escrow keys from Facilities Director.
                  </p>
                </div>

                <div className="p-4 border-2 border-carbon bg-raw-paper space-y-1.5">
                  <div className="flex items-center justify-between text-signal-orange font-bold">
                    <span>DAY 02 // NOVEMBER 19, 2024</span>
                    <span>VENDOR ALLIANCE REVIEW</span>
                  </div>
                  <p className="font-sans text-xs text-carbon">
                    Review restructured service tier with Apex BioAnalytical Labs. Confirm delivery of written non-renewal notice.
                  </p>
                </div>

                <div className="p-4 border-2 border-carbon bg-raw-paper space-y-1.5">
                  <div className="flex items-center justify-between text-signal-orange font-bold">
                    <span>DAY 03 // NOVEMBER 20, 2024</span>
                    <span>ONCOLOGY STEERING COMMITTEE</span>
                  </div>
                  <p className="font-sans text-xs text-carbon">
                    Convene Phase II Oncology trial clinical leads (Sites 101 through 108). Ratify updated reporting channels.
                  </p>
                </div>

                <div className="p-4 border-2 border-carbon bg-raw-paper space-y-1.5">
                  <div className="flex items-center justify-between text-signal-orange font-bold">
                    <span>DAY 04 // NOVEMBER 21, 2024</span>
                    <span>PATENT PRIORITY EXECUTION</span>
                  </div>
                  <p className="font-sans text-xs text-carbon">
                    Execute retrieved Exhibit C co-inventor assignment declaration with IP Counsel for European counterpart entry.
                  </p>
                </div>

                <div className="p-4 border-2 border-carbon bg-raw-paper space-y-1.5">
                  <div className="flex items-center justify-between text-industrial-green font-bold">
                    <span>DAY 05 // NOVEMBER 22, 2024</span>
                    <span>FORMAL GOVERNANCE TRANSFER</span>
                  </div>
                  <p className="font-sans text-xs text-carbon">
                    Division-wide scientific briefing. Formal assumption of Institutional Biosafety Committee chair.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Chapter 05: Citations & Hashes */}
          {activeChapter === "ch5" && (
            <div className="space-y-6">
              <div className="space-y-1 border-b-2 border-carbon pb-3">
                <span className="font-mono text-xs font-bold text-signal-orange">
                  CHAPTER 05 // PROVENANCE
                </span>
                <h3 className="font-display font-black text-xl uppercase text-carbon">
                  Cryptographic Citation Concordance & Hashes
                </h3>
              </div>

              <div className="divide-y divide-carbon/20 border border-carbon bg-raw-paper font-mono text-xs">
                <div className="p-3 space-y-1">
                  <span className="font-bold text-carbon">DOC-CSO-2024: CSO Transition Protocol v2.4.pdf</span>
                  <p className="text-[10px] text-carbon/60 break-all">
                    SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                  </p>
                </div>

                <div className="p-3 space-y-1">
                  <span className="font-bold text-carbon">DOC-FDA-1572: FDA Form 1572 Investigator Registry.pdf</span>
                  <p className="text-[10px] text-carbon/60 break-all">
                    SHA-256: 8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4
                  </p>
                </div>

                <div className="p-3 space-y-1">
                  <span className="font-bold text-carbon">DOC-MSA-82: Spectrometry Lab Services Agreement.docx</span>
                  <p className="text-[10px] text-carbon/60 break-all">
                    SHA-256: ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Audit Stamp */}
        <div className="p-6 border-t-2 border-carbon bg-concrete/40 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-carbon">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-signal-orange" />
            <span className="font-bold uppercase">RELAY AUDIT VERIFIED: SHA-256 SIGNATURE VALID</span>
          </div>
          <span className="text-carbon/60 uppercase text-[10px]">
            ARCHIVAL COPY PERSISTED TO SQLITE REPOSITORY
          </span>
        </div>
      </article>
    </div>
  );
}
