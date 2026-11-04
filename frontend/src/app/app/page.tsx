"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  IconBuilding,
  IconDocument,
  IconAlert,
  IconTask,
  IconCheck,
  IconChevronRight,
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
    <div className="space-y-6">
      {/* 1. Transition Header Brief */}
      <div className="p-5 rounded bg-paper-surface border border-rule">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rule">
          <div>
            <span className="text-[10px] font-sans uppercase tracking-wider text-ink-secondary block">
              Active Institutional Transition
            </span>
            <h2 className="text-xl font-serif text-ink font-semibold">
              Chief Scientific Officer Leadership Handover
            </h2>
            <p className="text-xs text-ink-secondary mt-0.5">
              Acme BioSystems Discovery Research Division
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-olive-light text-olive-dark border border-olive-border text-xs font-medium">
              <IconCheck size={12} />
              In Progress
            </span>
            <span className="text-xs text-ink-secondary font-sans border border-rule px-2 py-1 rounded bg-paper">
              Target: Nov 16, 2026
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 text-xs">
          <div>
            <span className="text-ink-secondary block text-[11px]">Outgoing Authority:</span>
            <span className="font-semibold text-ink">Dr. Marcus Vance (CSO)</span>
            <span className="text-ink-secondary block text-[10px]">Transitioning to Advisory Board</span>
          </div>
          <div>
            <span className="text-ink-secondary block text-[11px]">Incoming Authority:</span>
            <span className="font-semibold text-ink">Dr. Elena Rostova</span>
            <span className="text-ink-secondary block text-[10px]">Interim Head of Discovery Research</span>
          </div>
          <div>
            <span className="text-ink-secondary block text-[11px]">Critical Milestone:</span>
            <span className="font-semibold text-copper">FDA Calibration Sign-off</span>
            <span className="text-ink-secondary block text-[10px]">Due Nov 12, 2026</span>
          </div>
        </div>
      </div>

      {/* 2. Main Two-Column Editorial Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Important Unresolved Matters */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Important Unresolved Matters</CardTitle>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Knowledge gaps and policy contradictions requiring human decision before handover.
                </p>
              </div>
              <Link
                href="/app/investigations"
                className="text-xs text-copper hover:underline inline-flex items-center gap-1 font-medium"
              >
                View all (3)
                <IconChevronRight size={12} />
              </Link>
            </CardHeader>
            <CardContent className="divide-y divide-rule/70 p-0">
              <div className="p-4 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-ink">
                    Liquid Nitrogen Cryo-Preservation Contract Lacks Secondary Signatory
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-copper-light text-copper-dark border border-copper-border rounded font-medium">
                    Critical
                  </span>
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Dr. Marcus Vance is the sole authorized signatory on the master facility agreement. Auto-renewal triggers Dec 1. Without an updated corporate signatory, replenishment orders could be delayed.
                </p>
                <div className="pt-1 flex items-center gap-3 text-[11px] text-ink-secondary">
                  <span>Source: Liquid Nitrogen SLA (Airgas)</span>
                  <span>•</span>
                  <Link href="/app/investigations" className="text-olive hover:underline">
                    Review required action
                  </Link>
                </div>
              </div>

              <div className="p-4 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-ink">
                    Cloud Infrastructure Migration Status Contradiction
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-paper-secondary text-ink-secondary border border-rule rounded">
                    Moderate
                  </span>
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Q3 Technology Roadmap states genomics pipeline migration to GCP was 100% completed, whereas Executive Minutes record an explicit freeze on AWS through Q1 2027.
                </p>
                <div className="pt-1 flex items-center gap-3 text-[11px] text-ink-secondary">
                  <span>Source: Q3 Roadmap vs Exec Minutes</span>
                  <span>•</span>
                  <Link href="/app/investigations" className="text-olive hover:underline">
                    Clarify consensus
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Record Ingestion Status & In-line Terminal */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Organizational Record Ingestion</CardTitle>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Authorized charters, SLAs, and runbooks indexed for this workspace.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUploaderOpen(!uploaderOpen)}
              >
                <IconUpload size={13} />
                <span>{uploaderOpen ? "Close Ingestion" : "Stage New Record"}</span>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {uploaderOpen && (
                <div className="p-3 bg-paper rounded border border-rule mb-3">
                  <FileUploader
                    onFilesSelected={(files: StagedFile[]) => {
                      // Handled in component
                    }}
                  />
                </div>
              )}

              <div className="divide-y divide-rule/60 border border-rule rounded bg-paper-surface">
                <div className="p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <IconDocument size={15} className="text-olive" />
                    <div>
                      <p className="font-medium text-ink">CSO Transition Protocol & Governance Charter v2.4</p>
                      <p className="text-[11px] text-ink-secondary">PDF • 42 Pages • Ratified by Legal</p>
                    </div>
                  </div>
                  <EvidenceBadge status="evidence-backed" size="sm" />
                </div>

                <div className="p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <IconDocument size={15} className="text-olive" />
                    <div>
                      <p className="font-medium text-ink">Phase II Bioreactor GMP Validation Dossier</p>
                      <p className="text-[11px] text-ink-secondary">PDF • 118 Pages • GMP Quality Assurance</p>
                    </div>
                  </div>
                  <EvidenceBadge status="evidence-backed" size="sm" />
                </div>

                <div className="p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <IconDocument size={15} className="text-copper" />
                    <div>
                      <p className="font-medium text-ink">Liquid Nitrogen Supply & Facility SLA (Airgas)</p>
                      <p className="text-[11px] text-ink-secondary">DOCX • 16 Pages • Procurement</p>
                    </div>
                  </div>
                  <EvidenceBadge status="missing" size="sm" />
                </div>
              </div>

              <div className="text-right">
                <Link href="/app/archive" className="text-xs text-ink-secondary hover:text-ink inline-flex items-center gap-1">
                  <span>Open Knowledge Archive</span>
                  <IconChevronRight size={12} />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 col) */}
        <div className="space-y-6">
          {/* Handover Dossier Readiness */}
          <Card>
            <CardHeader>
              <CardTitle>Handover Dossier Readiness</CardTitle>
              <p className="text-xs text-ink-secondary mt-0.5">
                Executive briefing book compilation state.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-paper rounded border border-rule space-y-1">
                <span className="text-[11px] text-ink-secondary uppercase tracking-wider block">
                  Dossier Status
                </span>
                <p className="font-semibold text-ink text-sm">
                  Draft Structured & Citation-Anchored
                </p>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Includes first-week action blueprint, 4 active obligations, and 3 open discrepancy notices.
                </p>
              </div>

              <Link href="/app/handovers" className="block">
                <Button variant="primary" size="sm" className="w-full">
                  <IconDossier size={14} />
                  <span>Review Handover Dossier</span>
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Pending Responsibilities Summary */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Operational Responsibilities</CardTitle>
              <Link href="/app/responsibilities" className="text-xs text-ink-secondary hover:text-ink">
                View matrix
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded bg-paper border border-rule">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-ink">FDA Bioreactor Calibration Sign-off</span>
                    <span className="text-[10px] text-copper font-medium">Due Nov 12</span>
                  </div>
                  <p className="text-[11px] text-ink-secondary mt-0.5">
                    Dr. Marcus Vance &rarr; Dr. Elena Rostova
                  </p>
                </div>

                <div className="p-2.5 rounded bg-paper border border-rule">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-ink">Novartis Year-End Milestone Filing</span>
                    <span className="text-[10px] text-ink-secondary">Due Nov 28</span>
                  </div>
                  <p className="text-[11px] text-ink-secondary mt-0.5">
                    $4.2M Milestone Commercial Contingency
                  </p>
                </div>

                <div className="p-2.5 rounded bg-paper border border-rule">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-ink">Biosafety Committee Directorship</span>
                    <span className="text-[10px] text-ink-secondary">Due Nov 15</span>
                  </div>
                  <p className="text-[11px] text-ink-secondary mt-0.5">
                    Formal delegation to Dr. Sarah Chen
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Continuity Map Quick Jump */}
          <Card className="bg-paper-secondary">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                <IconNetwork size={16} className="text-olive" />
                <span>Continuity Topology Map</span>
              </div>
              <p className="text-xs text-ink-secondary leading-relaxed">
                Inspect interconnections between people, documents, decisions, and dependencies.
              </p>
              <Link href="/app/map" className="inline-block pt-1">
                <Button variant="secondary" size="sm">
                  <span>Open Interactive Map</span>
                  <IconChevronRight size={12} />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

