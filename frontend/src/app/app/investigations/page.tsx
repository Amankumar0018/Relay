"use client";

import React, { useState } from "react";
import {
  IconInvestigation,
  IconAlert,
  IconCheck,
  IconClose,
  IconDocument,
  IconUser,
  IconChevronRight,
} from "@/components/ui/Icons";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EvidenceBadge } from "@/components/evidence/EvidenceBadge";

interface InvestigationItem {
  id: string;
  title: string;
  classification: "Missing Documentation" | "Record Contradiction" | "Ambiguous Ownership" | "Unverified Fact";
  status: "Open Investigation" | "Human Review Required" | "Resolved";
  whyItMatters: string;
  sourceDocuments: string[];
  evidenceExcerpt: string;
  requiredClarification: string;
  responsibleReviewer: string;
  resolutionHistory?: string;
}

const SAMPLE_INVESTIGATIONS: InvestigationItem[] = [
  {
    id: "inv-01",
    title: "Liquid Nitrogen Supply SLA Lacks Secondary Corporate Signatory",
    classification: "Missing Documentation",
    status: "Human Review Required",
    whyItMatters:
      "If the contract auto-renews on Dec 1 without updating corporate contact records, critical nitrogen deliveries for cell line cryo-preservation could be suspended if payment authorization emails bounce.",
    sourceDocuments: ["Liquid_Nitrogen_SLA_Airgas.docx"],
    evidenceExcerpt:
      "Clause 14.2: Renewal notice delivered in writing exclusively to Dr. Marcus Vance (m.vance@acme-bio.internal).",
    requiredClarification:
      "Designate the incoming interim lead or the VP of Facilities as secondary authorized signatory on Airgas account.",
    responsibleReviewer: "Operations & Procurement Lead",
    resolutionHistory: "Discovered during initial archival audit on Oct 28.",
  },
  {
    id: "inv-02",
    title: "Cloud Infrastructure Migration Status Discrepancy",
    classification: "Record Contradiction",
    status: "Open Investigation",
    whyItMatters:
      "The engineering roadmap claims migration to GCP was finalized, while executive minutes record an explicit freeze on AWS through Q1 2027. Dual cloud spend or unmanaged AWS pipeline instances create budget liability.",
    sourceDocuments: [
      "Q3_Technology_Roadmap_Retrospective.pdf",
      "Executive_Committee_Minutes_Sep30.txt",
    ],
    evidenceExcerpt:
      "Roadmap: 'All bioinformatics pipelines transitioned to GCP on Sep 15' vs. Exec Minutes: 'Resolution: Pipelines remain on AWS to prevent transition disruptions.'",
    requiredClarification:
      "Confirm with Lead Bioinformatician which cloud provider currently executes the clinical variant analysis pipeline.",
    responsibleReviewer: "Director of Bioinformatics",
  },
  {
    id: "inv-03",
    title: "Ambiguity Regarding Regulatory Authority Sign-Off Window",
    classification: "Ambiguous Ownership",
    status: "Human Review Required",
    whyItMatters:
      "The transition protocol assigns laboratory directorship to Dr. Elena Rostova on Nov 16, but the mandatory FDA bioreactor calibration occurs Nov 12. Leaving a 4-day gap in formal regulatory delegation.",
    sourceDocuments: [
      "CSO_Transition_Protocol_v2.pdf",
      "Bioreactor_GMP_Validation_Dossier.pdf",
    ],
    evidenceExcerpt:
      "Transition date: Nov 16 (Protocol Section 3.1) vs. Calibration signature deadline: Nov 12 (Dossier Appendix B).",
    requiredClarification:
      "Execute an interim signatory delegation amendment authorizing Dr. Vance or Dr. Rostova for the specific Nov 12 inspection.",
    responsibleReviewer: "General Counsel & Regulatory QA",
  },
];

export default function InvestigationsPage() {
  const [filter, setFilter] = useState("All");
  const [activeItem, setActiveItem] = useState<InvestigationItem | null>(SAMPLE_INVESTIGATIONS[0]);
  const [items, setItems] = useState<InvestigationItem[]>(SAMPLE_INVESTIGATIONS);
  const [resolutionNote, setResolutionNote] = useState("");

  const handleResolve = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "Resolved",
              resolutionHistory: `Resolved by user on ${new Date().toLocaleDateString()}: "${resolutionNote || 'Clarification confirmed with responsible reviewer.'}"`,
            }
          : item
      )
    );
    setResolutionNote("");
  };

  const filtered = items.filter((item) => {
    if (filter === "All") return true;
    if (filter === "Open") return item.status !== "Resolved";
    if (filter === "Resolved") return item.status === "Resolved";
    return item.classification === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-rule">
        <div>
          <h1 className="text-xl font-serif font-semibold text-ink">
            Knowledge Investigations
          </h1>
          <p className="text-xs text-ink-secondary mt-0.5">
            Evidence-oriented investigation workspace for resolving record contradictions and missing documentation.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-ink-secondary font-sans border border-rule px-2.5 py-1 rounded bg-paper-surface">
          <IconAlert size={14} className="text-copper" />
          <span>{items.filter((i) => i.status !== "Resolved").length} Unresolved Matters</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-paper-secondary p-0.5 rounded border border-rule text-xs overflow-x-auto">
        {["All", "Open", "Missing Documentation", "Record Contradiction", "Ambiguous Ownership", "Resolved"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded text-[11px] whitespace-nowrap transition-colors ${
              filter === f
                ? "bg-paper-surface text-ink font-semibold shadow-xs border border-rule"
                : "text-ink-secondary hover:text-ink"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Two-Column Investigation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Investigation List (1.2 cols) */}
        <div className="space-y-3">
          {filtered.map((inv) => {
            const isSelected = activeItem?.id === inv.id;
            const isResolved = inv.status === "Resolved";

            return (
              <div
                key={inv.id}
                onClick={() => setActiveItem(inv)}
                className={`p-4 rounded border cursor-pointer transition-colors space-y-2 ${
                  isSelected
                    ? "bg-paper-surface border-ink shadow-xs"
                    : "bg-paper-surface border-rule hover:bg-paper-secondary/40"
                } ${isResolved ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded border font-sans ${
                      isResolved
                        ? "bg-olive-light text-olive-dark border-olive-border"
                        : "bg-copper-light text-copper-dark border-copper-border font-medium"
                    }`}
                  >
                    {inv.status}
                  </span>
                  <span className="text-[10px] text-ink-secondary">
                    {inv.classification}
                  </span>
                </div>

                <h3 className="text-xs sm:text-sm font-semibold text-ink font-sans leading-snug">
                  {inv.title}
                </h3>

                <p className="text-xs text-ink-secondary line-clamp-2 leading-relaxed">
                  {inv.whyItMatters}
                </p>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="p-8 text-center text-xs text-ink-secondary border border-rule rounded bg-paper-surface">
              No investigations match the selected view.
            </div>
          )}
        </div>

        {/* Detailed Investigation Dossier & Resolution Desk (2 cols) */}
        {activeItem && (
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-ink-secondary">
                    Investigation Dossier #{activeItem.id.toUpperCase()}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded border ${
                      activeItem.status === "Resolved"
                        ? "bg-olive-light text-olive-dark border-olive-border"
                        : "bg-copper-light text-copper-dark border-copper-border font-medium"
                    }`}
                  >
                    {activeItem.status}
                  </span>
                </div>
                <CardTitle className="text-base sm:text-lg font-serif">
                  {activeItem.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {/* Why It Matters */}
                <div>
                  <h4 className="text-[11px] font-semibold text-ink uppercase tracking-wider mb-1">
                    Institutional Risk & Why It Matters
                  </h4>
                  <p className="text-ink leading-relaxed">
                    {activeItem.whyItMatters}
                  </p>
                </div>

                {/* Evidence Excerpt */}
                <div className="p-3 bg-paper rounded border border-rule space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-ink-secondary uppercase">
                    <span>Cited Document Evidence</span>
                    <span className="text-[10px] font-sans">Verbatim Record</span>
                  </div>
                  <blockquote className="font-serif italic text-ink border-l-2 border-olive pl-3 leading-relaxed">
                    &ldquo;{activeItem.evidenceExcerpt}&rdquo;
                  </blockquote>
                  <div className="pt-1 text-[11px] text-ink-secondary flex items-center gap-1.5">
                    <IconDocument size={12} className="text-olive" />
                    <span>Sources: {activeItem.sourceDocuments.join(", ")}</span>
                  </div>
                </div>

                {/* Required Clarification & Assignee */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-2.5 rounded bg-paper-surface border border-rule">
                    <span className="text-[10px] font-semibold uppercase text-ink-secondary block">
                      Required Action / Decision
                    </span>
                    <p className="text-ink mt-0.5 leading-relaxed">
                      {activeItem.requiredClarification}
                    </p>
                  </div>
                  <div className="p-2.5 rounded bg-paper-surface border border-rule">
                    <span className="text-[10px] font-semibold uppercase text-ink-secondary block">
                      Responsible Reviewer
                    </span>
                    <p className="text-ink mt-0.5 font-medium">
                      {activeItem.responsibleReviewer}
                    </p>
                  </div>
                </div>

                {/* Resolution Status or Action Form */}
                {activeItem.status === "Resolved" ? (
                  <div className="p-3 rounded bg-olive-light border border-olive-border text-olive-dark">
                    <span className="font-semibold text-xs block mb-1">
                      Resolution Record:
                    </span>
                    <p className="leading-relaxed">
                      {activeItem.resolutionHistory}
                    </p>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-rule space-y-2.5">
                    <h4 className="text-[11px] font-semibold text-ink uppercase tracking-wider">
                      Record Human Decision / Resolution
                    </h4>
                    <textarea
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      placeholder="Add institutional clarification note or ratify resolution..."
                      rows={2}
                      className="w-full p-2 text-xs rounded border border-rule bg-paper text-ink placeholder:text-ink-disabled focus:outline-none focus:ring-1 focus:ring-olive font-sans"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleResolve(activeItem.id)}
                      >
                        <IconCheck size={13} />
                        <span>Ratify Decision & Resolve</span>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

