"use client";

import React, { useState } from "react";
import {
  IconTask,
  IconCheck,
  IconAlert,
  IconDocument,
  IconUser,
  IconChevronRight,
  IconSearch,
} from "@/components/ui/Icons";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Obligation {
  id: string;
  task: string;
  nature: "Assigned Authority" | "Actionable Task" | "Standing Ritual";
  assignedOwner: string;
  incomingDelegate?: string;
  deadline: string;
  originatingDecision: string;
  dependencies: string[];
  evidenceSource: string;
  status: "Active Handover" | "Standing Commitment" | "Completed";
  lastVerifiedDate: string;
}

const SAMPLE_OBLIGATIONS: Obligation[] = [
  {
    id: "ob-1",
    task: "FDA Bioreactor Phase II GMP Calibration Sign-off",
    nature: "Actionable Task",
    assignedOwner: "Dr. Marcus Vance (CSO)",
    incomingDelegate: "Dr. Elena Rostova",
    deadline: "Nov 12, 2026",
    originatingDecision: "Phase II GMP Validation Protocol Ratification",
    dependencies: [
      "Cryo-nitrogen validation log",
      "QA Sterility sign-off",
    ],
    evidenceSource: "Bioreactor_GMP_Validation_Dossier.pdf (Appendix B)",
    status: "Active Handover",
    lastVerifiedDate: "Oct 28, 2026",
  },
  {
    id: "ob-2",
    task: "Novartis Year-End Co-development IP Milestone Filing",
    nature: "Actionable Task",
    assignedOwner: "Dr. Marcus Vance (CSO)",
    incomingDelegate: "Dr. Elena Rostova",
    deadline: "Nov 28, 2026",
    originatingDecision: "Novartis Alliance Steering Committee Agreement",
    dependencies: ["Phase II Bioreactor calibration data"],
    evidenceSource: "Novartis_Partner_Agreement_2025.pdf (Schedule 3)",
    status: "Active Handover",
    lastVerifiedDate: "Oct 20, 2026",
  },
  {
    id: "ob-3",
    task: "Institutional Biosafety Committee (IBC) Chairmanship",
    nature: "Assigned Authority",
    assignedOwner: "Dr. Marcus Vance (CSO)",
    incomingDelegate: "Dr. Sarah Chen (Senior Fellow)",
    deadline: "Nov 15, 2026",
    originatingDecision: "CSO Governance Charter Section 6.1",
    dependencies: ["Corporate Secretariat notification"],
    evidenceSource: "CSO_Transition_Protocol_v2.pdf (Section 6.1)",
    status: "Active Handover",
    lastVerifiedDate: "Oct 28, 2026",
  },
  {
    id: "ob-4",
    task: "Airgas Liquid Nitrogen SLA Corporate Signatory Update",
    nature: "Actionable Task",
    assignedOwner: "Operations & Procurement Lead",
    deadline: "Dec 01, 2026",
    originatingDecision: "Facility SLA Auto-Renewal Clause 14.2",
    dependencies: ["Designation of secondary authorized corporate signatory"],
    evidenceSource: "Liquid_Nitrogen_SLA_Airgas.docx (Clause 14.2)",
    status: "Active Handover",
    lastVerifiedDate: "Oct 30, 2026",
  },
  {
    id: "ob-5",
    task: "AWS Bioinformatics Cloud Infrastructure Freeze Governance",
    nature: "Standing Ritual",
    assignedOwner: "Lead Bioinformatics Engineer",
    deadline: "Ongoing through Q1 2027",
    originatingDecision: "Executive Resolution 2026-09",
    dependencies: ["Monthly billing verification"],
    evidenceSource: "Executive_Committee_Minutes_Sep30.txt",
    status: "Standing Commitment",
    lastVerifiedDate: "Oct 15, 2026",
  },
];

export default function ResponsibilitiesPage() {
  const [filter, setFilter] = useState("All");
  const [items, setItems] = useState<Obligation[]>(SAMPLE_OBLIGATIONS);

  const toggleComplete = (id: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              status: i.status === "Completed" ? "Active Handover" : "Completed",
            }
          : i
      )
    );
  };

  const filtered = items.filter((item) => {
    if (filter === "All") return true;
    if (filter === "Actionable Tasks") return item.nature === "Actionable Task";
    if (filter === "Assigned Authorities") return item.nature === "Assigned Authority";
    if (filter === "Standing Commitments") return item.nature === "Standing Ritual";
    if (filter === "Completed") return item.status === "Completed";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-rule">
        <div>
          <h1 className="text-xl font-serif font-semibold text-ink">
            Operational Responsibilities & Obligations
          </h1>
          <p className="text-xs text-ink-secondary mt-0.5">
            Catalog of active commitments, regulatory milestones, and role delegations undergoing transition.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-ink-secondary font-sans border border-rule px-2.5 py-1 rounded bg-paper-surface">
          <IconTask size={14} className="text-olive" />
          <span>{items.filter((i) => i.status !== "Completed").length} Active Obligations</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-paper-secondary p-0.5 rounded border border-rule text-xs overflow-x-auto">
        {["All", "Actionable Tasks", "Assigned Authorities", "Standing Commitments", "Completed"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1 rounded text-[11px] whitespace-nowrap transition-colors ${
              filter === tab
                ? "bg-paper-surface text-ink font-semibold shadow-xs border border-rule"
                : "text-ink-secondary hover:text-ink"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Obligations Table / Ledger */}
      <div className="border border-rule rounded bg-paper-surface overflow-hidden">
        <div className="divide-y divide-rule/70">
          {filtered.map((item) => {
            const isCompleted = item.status === "Completed";

            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 transition-colors ${
                  isCompleted ? "bg-paper-secondary/30 opacity-60" : "hover:bg-paper-secondary/20"
                }`}
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => toggleComplete(item.id)}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        isCompleted
                          ? "bg-olive text-paper border-olive"
                          : "border-rule hover:border-ink"
                      }`}
                      aria-label="Toggle completed"
                    >
                      {isCompleted && <IconCheck size={12} />}
                    </button>

                    <h3
                      className={`text-sm font-semibold text-ink font-sans ${
                        isCompleted ? "line-through text-ink-secondary" : ""
                      }`}
                    >
                      {item.task}
                    </h3>

                    <span className="text-[10px] px-1.5 py-0.2 rounded border bg-paper-secondary text-ink-secondary border-rule">
                      {item.nature}
                    </span>

                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded border ${
                        item.status === "Completed"
                          ? "bg-olive-light text-olive-dark border-olive-border"
                          : item.status === "Standing Commitment"
                          ? "bg-paper text-ink-secondary border-rule"
                          : "bg-paper text-ink border-rule font-medium"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  {/* Delegation Vector */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2 rounded bg-paper border border-rule/80">
                      <span className="text-[10px] uppercase text-ink-secondary block">
                        Assigned Authority
                      </span>
                      <span className="text-ink font-medium">
                        {item.assignedOwner}
                      </span>
                      {item.incomingDelegate && (
                        <span className="text-[11px] text-olive-dark block mt-0.5">
                          &rarr; Handover to: {item.incomingDelegate}
                        </span>
                      )}
                    </div>

                    <div className="p-2 rounded bg-paper border border-rule/80">
                      <span className="text-[10px] uppercase text-ink-secondary block">
                        Originating Event / Decision
                      </span>
                      <span className="text-ink">
                        {item.originatingDecision}
                      </span>
                    </div>
                  </div>

                  {/* Preconditions & Document Citation */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-ink-secondary pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-ink-secondary">Preconditions:</span>
                      <span>{item.dependencies.join(", ")}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1 text-[11px]">
                      <IconDocument size={12} className="text-olive" />
                      <span>{item.evidenceSource}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex md:flex-col items-center md:items-end justify-between md:justify-start gap-2 pt-1 md:pt-0">
                  <span className="text-xs font-semibold text-copper">
                    Due: {item.deadline}
                  </span>
                  <span className="text-[11px] text-ink-secondary">
                    Verified: {item.lastVerifiedDate}
                  </span>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="p-8 text-center text-xs text-ink-secondary">
              No responsibilities found matching the selected filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

