"use client";

import React, { useState } from "react";
import {
  IconDossier,
  IconCheck,
  IconAlert,
  IconDocument,
  IconUser,
  IconBuilding,
  IconChevronRight,
  IconExternal,
} from "@/components/ui/Icons";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EvidenceBadge } from "@/components/evidence/EvidenceBadge";

export default function HandoverDossiersPage() {
  const [activeSection, setActiveSection] = useState<
    "overview" | "week1" | "responsibilities" | "gaps" | "citations"
  >("overview");
  const [exportNotice, setExportNotice] = useState(false);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Dossier Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-rule">
        <div>
          <span className="text-[10px] uppercase font-mono text-ink-secondary block">
            Executive Deliverable #DOS-2026-CSO-01
          </span>
          <h1 className="text-xl font-serif font-semibold text-ink">
            Leadership Handover Briefing Dossier
          </h1>
          <p className="text-xs text-ink-secondary mt-0.5">
            Acme BioSystems Chief Scientific Officer Role Transfer
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
            variant="primary"
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
        <div className="p-3 rounded bg-olive-light border border-olive-border text-xs text-olive-dark flex items-center justify-between">
          <span>Dossier exported to local JSON archive with citation anchors intact.</span>
          <button onClick={() => setExportNotice(false)} className="underline text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Document Body */}
      <div className="border border-rule rounded bg-paper-surface">
        {/* Document Title Plate */}
        <div className="p-6 sm:p-8 border-b border-rule bg-paper space-y-4">
          <div className="flex items-center justify-between text-xs text-ink-secondary border-b border-rule/80 pb-3">
            <span>INSTITUTIONAL CONTINUITY DOSSIER</span>
            <div className="flex items-center gap-2">
              <span className="text-olive-dark font-medium flex items-center gap-1">
                <IconCheck size={12} />
                Human Audit in Progress
              </span>
              <span>•</span>
              <span>Effective Date: Nov 16, 2026</span>
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-serif font-bold text-ink leading-tight">
              Executive Briefing Book: Chief Scientific Officer Handover
            </h2>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Preserved organizational context, operational authorities, active milestones, and unresolved institutional gaps for incoming leadership.
            </p>
          </div>

          {/* Role Delegation Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3 rounded bg-paper-surface border border-rule">
              <span className="text-[10px] uppercase font-semibold text-ink-secondary block">
                Outgoing Authority
              </span>
              <p className="font-semibold text-ink mt-0.5">Dr. Marcus Vance</p>
              <p className="text-[11px] text-ink-secondary">Chief Scientific Officer (Tenure: 2020 – 2026)</p>
            </div>
            <div className="p-3 rounded bg-paper-surface border border-rule">
              <span className="text-[10px] uppercase font-semibold text-olive block">
                Incoming Designee
              </span>
              <p className="font-semibold text-ink mt-0.5">Dr. Elena Rostova</p>
              <p className="text-[11px] text-ink-secondary">Interim Head of Discovery Research</p>
            </div>
          </div>
        </div>

        {/* Dossier Navigation Tabs */}
        <div className="flex items-center gap-1 p-2 border-b border-rule bg-paper-secondary text-xs overflow-x-auto">
          {[
            { id: "overview", label: "1. Organization & Context" },
            { id: "week1", label: "2. First-Week Action Blueprint" },
            { id: "responsibilities", label: "3. Active Commitments" },
            { id: "gaps", label: "4. Knowledge Gaps" },
            { id: "citations", label: "5. Source References" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-3 py-1 rounded text-xs transition-colors whitespace-nowrap ${
                activeSection === tab.id
                  ? "bg-paper-surface text-ink font-semibold border border-rule shadow-xs"
                  : "text-ink-secondary hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Section Content */}
        <div className="p-6 sm:p-8 space-y-5 text-xs text-ink font-sans leading-relaxed">
          {activeSection === "overview" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-ink font-serif uppercase tracking-wider mb-1">
                  Historical Context & Mandate
                </h3>
                <p className="text-ink leading-relaxed">
                  Over the past six years, the Discovery Research division developed Acme BioSystems&apos; proprietary gene-editing assays and established a licensed Phase II GMP bioreactor facility. Dr. Vance transitions to the external Scientific Advisory Board to focus on corporate partnerships, delegating full administrative and scientific authority over internal laboratory operations.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-ink font-serif uppercase tracking-wider mb-1">
                  Key Strategic Decisions in Force
                </h3>
                <div className="space-y-2 pt-1">
                  <div className="p-3 rounded bg-paper border border-rule space-y-1">
                    <span className="font-semibold text-ink block">
                      Bioinformatics Multi-Cloud Migration Freeze
                    </span>
                    <p className="text-ink-secondary">
                      Executive Committee Resolution 2026-09 halts migration to GCP through Q1 2027. All genomic pipeline workflows remain anchored on AWS.
                    </p>
                  </div>

                  <div className="p-3 rounded bg-paper border border-rule space-y-1">
                    <span className="font-semibold text-ink block">
                      Novartis Phase II Partnership Deliverable
                    </span>
                    <p className="text-ink-secondary">
                      Contingent milestone payment of $4.2M linked directly to delivery of the Phase II bioreactor calibration dossier by Nov 28, 2026.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "week1" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-ink font-serif uppercase tracking-wider mb-1">
                  First-Week Operational Action Blueprint
                </h3>
                <p className="text-ink-secondary">
                  Structured day-by-day procedural checklist for Dr. Elena Rostova upon assuming interim authority.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded bg-paper border border-rule space-y-1.5">
                  <span className="font-semibold text-ink text-xs block">
                    Day 01 (Monday, Nov 16) — Administrative Transfer & Facilities
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-ink-secondary">
                    <li>Execute formal laboratory directorship transfer with General Counsel.</li>
                    <li>Verify Airgas liquid nitrogen signatory update with Facilities Lead.</li>
                    <li>Convene all-hands introductory meeting with Discovery Research staff (18 direct reports).</li>
                  </ul>
                </div>

                <div className="p-3 rounded bg-paper border border-rule space-y-1.5">
                  <span className="font-semibold text-ink text-xs block">
                    Day 02 (Tuesday, Nov 17) — Bioreactor Calibration Audit Review
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-ink-secondary">
                    <li>Review signed Nov 12 FDA calibration reports with QA Director.</li>
                    <li>Verify clean sterility documentation for clinical bioreactor line.</li>
                  </ul>
                </div>

                <div className="p-3 rounded bg-paper border border-rule space-y-1.5">
                  <span className="font-semibold text-ink text-xs block">
                    Day 03 (Wednesday, Nov 18) — Novartis Alliance Steering Committee
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-ink-secondary">
                    <li>Formally introduce interim role to Novartis partnership counterparts.</li>
                    <li>Confirm Nov 28 transmission date for Year-End IP Milestone filing.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeSection === "responsibilities" && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-ink font-serif uppercase tracking-wider mb-1">
                Active Obligations & Deadlines
              </h3>
              <div className="divide-y divide-rule/80 border border-rule rounded bg-paper">
                <div className="p-3 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-ink">FDA Bioreactor Calibration Sign-off</span>
                    <p className="text-ink-secondary text-[11px]">Due Nov 12 • Signatory authority required</p>
                  </div>
                  <span className="text-copper font-medium">Immediate Blocker</span>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-ink">Novartis Year-End IP Filing</span>
                    <p className="text-ink-secondary text-[11px]">Due Nov 28 • $4.2M Milestone Commercial Contingency</p>
                  </div>
                  <span className="text-ink-secondary font-medium">High Priority</span>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-ink">Biosafety Committee Directorship</span>
                    <p className="text-ink-secondary text-[11px]">Due Nov 15 • Handover to Dr. Sarah Chen</p>
                  </div>
                  <span className="text-olive-dark font-medium">Ready</span>
                </div>
              </div>
            </div>
          )}

          {activeSection === "gaps" && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-ink font-serif uppercase tracking-wider mb-1">
                Open Knowledge Discrepancies & Mitigation Notes
              </h3>
              <div className="space-y-2">
                <div className="p-3 rounded bg-copper-light border border-copper-border text-copper-dark space-y-1">
                  <span className="font-semibold block">Airgas Nitrogen Renewal Signatory</span>
                  <p className="text-xs">
                    Airgas agreement auto-renews Dec 1. Procurement has filed paperwork to name the VP of Facilities as secondary contact to ensure uninterrupted deliveries.
                  </p>
                </div>
                <div className="p-3 rounded bg-paper border border-rule space-y-1">
                  <span className="font-semibold text-ink block">Interim Authority Signatory Gap (Nov 12 vs Nov 16)</span>
                  <p className="text-ink-secondary text-xs">
                    Counsel has drafted an interim signatory delegation amendment authorizing Dr. Vance for the Nov 12 calibration visit.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === "citations" && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-ink font-serif uppercase tracking-wider mb-1">
                Source Document Citations
              </h3>
              <div className="space-y-2 font-mono text-[11px]">
                <div className="p-2.5 rounded bg-paper border border-rule">
                  <span className="text-olive font-semibold block">[CITATION-1] CSO Transition Protocol v2.4</span>
                  <span className="text-ink-secondary font-sans text-xs">Section 3.1 & 4.2 • Ratified by Acme Legal Oct 28, 2026</span>
                </div>
                <div className="p-2.5 rounded bg-paper border border-rule">
                  <span className="text-olive font-semibold block">[CITATION-2] Bioreactor GMP Validation Dossier</span>
                  <span className="text-ink-secondary font-sans text-xs">Appendix B • Quality Assurance Calibration Guidelines</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

