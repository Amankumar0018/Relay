"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  IconTask,
  IconCheck,
  IconAlert,
  IconDocument,
  IconUser,
  IconSearch,
} from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { fetchContinuityOverview, ContinuityOverview } from "@/lib/api";

interface Obligation {
  id: string;
  code: string;
  task: string;
  nature: "Delegated Authority" | "Actionable Task" | "Regulatory Sign-off";
  assignedOwner: string;
  incomingDelegate: string;
  deadline: string;
  originatingDecision: string;
  dependencies: string[];
  evidenceSource: string;
  status: "ACTIVE" | "COMPLETED";
}

const INITIAL_OBLIGATIONS: Obligation[] = [
  {
    id: "ob-1",
    code: "RES-01",
    task: "Re-submit FDA Form 1572 Protocol Co-Signature",
    nature: "Regulatory Sign-off",
    assignedOwner: "Dr. Eleanor Vance (CSO)",
    incomingDelegate: "Dr. Marcus Thorne",
    deadline: "Nov 01, 2024",
    originatingDecision: "Phase II Clinical Oncology Protocol Audit",
    dependencies: ["FDA 1572 Co-signature", "Vendor MSA Amend. 3 alignment"],
    evidenceSource: "Regulatory-Audit-Q3-2024.pdf (Box 1 & 6)",
    status: "ACTIVE",
  },
  {
    id: "ob-2",
    code: "RES-02",
    task: "Spectrometry Lab Services Contract Termination Notice",
    nature: "Actionable Task",
    assignedOwner: "Unassigned (Finance / Procurement)",
    incomingDelegate: "Interim Procurement Lead",
    deadline: "Oct 15, 2024",
    originatingDecision: "Contract Renewal Opt-Out Window",
    dependencies: ["Executive finance authorization", "Notice dispatch to Apex Bio"],
    evidenceSource: "Vendor-Master-Agreement-2023.docx (Sec. 8.2)",
    status: "ACTIVE",
  },
  {
    id: "ob-3",
    code: "RES-03",
    task: "Institutional Biosafety Committee (IBC) Chairmanship",
    nature: "Delegated Authority",
    assignedOwner: "Dr. Eleanor Vance (CSO)",
    incomingDelegate: "Dr. Marcus Thorne",
    deadline: "Nov 15, 2024",
    originatingDecision: "CSO Governance Charter Section 6.1",
    dependencies: ["Corporate Secretariat notification", "Charter Amendment"],
    evidenceSource: "CSO-Departure-Charter-2024.pdf (Sec. 6.1)",
    status: "ACTIVE",
  },
  {
    id: "ob-4",
    code: "RES-04",
    task: "Compound C-409 Patent Co-Inventor Assignment Execution",
    nature: "Actionable Task",
    assignedOwner: "Legal Escrow Officer",
    incomingDelegate: "IP Counsel",
    deadline: "Nov 20, 2024",
    originatingDecision: "National Phase Patent Priority Deadlines",
    dependencies: ["Exhibit C retrieval", "Inventor counterpart signatures"],
    evidenceSource: "Patent-Filing-Memo-RevB.pdf (Exhibit C)",
    status: "ACTIVE",
  },
  {
    id: "ob-5",
    code: "RES-05",
    task: "Discovery Laboratories Physical Keycard & Vault Escrow",
    nature: "Delegated Authority",
    assignedOwner: "Facilities Director",
    incomingDelegate: "Dr. Marcus Thorne",
    deadline: "Nov 30, 2024",
    originatingDecision: "CSO Departure Protocol Section 4.4",
    dependencies: ["Vault code rotation", "Security badge re-issue"],
    evidenceSource: "CSO-Departure-Charter-2024.pdf (Sec. 4.4)",
    status: "COMPLETED",
  },
];

export default function ResponsibilitiesPage() {
  const [obligations, setObligations] = useState<Obligation[]>(INITIAL_OBLIGATIONS);
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [continuity, setContinuity] = useState<ContinuityOverview | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchContinuityOverview();
        setContinuity(data);

        // If backend returned real critical blockers, convert them to obligations
        if (data && data.critical_blockers && data.critical_blockers.length > 0) {
          const liveBlockers: Obligation[] = data.critical_blockers.map((b, idx) => ({
            id: `live-${b.fact_id}`,
            code: `BLK-${String(idx + 1).padStart(2, "0")}`,
            task: b.statement,
            nature: (b.category === "decision" ? "Delegated Authority" : "Actionable Task") as any,
            assignedOwner: data.outgoing_leader || "Outgoing Leadership",
            incomingDelegate: data.incoming_successor || "Incoming Successor",
            deadline: b.deadline ? new Date(b.deadline).toLocaleDateString() : "Immediate",
            originatingDecision: `${b.severity.toUpperCase()} Priority Blocker`,
            dependencies: [`Citations: ${b.citations_count}`],
            evidenceSource: b.document_filename || "Repository Record",
            status: "ACTIVE",
          }));

          setObligations((prev) => {
            const combined = [...liveBlockers];
            prev.forEach((p) => {
              if (!combined.some((c) => c.task.toLowerCase() === p.task.toLowerCase())) {
                combined.push(p);
              }
            });
            return combined;
          });
        }
      } catch (err) {
        console.warn("Could not load live continuity overview:", err);
      }
    })();
  }, []);

  const toggleStatus = (id: string) => {
    setObligations((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === "ACTIVE" ? "COMPLETED" : "ACTIVE",
            }
          : item
      )
    );
  };

  const filtered = obligations.filter((item) => {
    const matchesFilter = filter === "ALL" || item.status === filter;
    const matchesSearch =
      item.task.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.assignedOwner.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-carbon pb-4">
        <div>
          <span className="font-mono text-xs uppercase font-bold text-signal-orange">
            // OPERATIONAL MATRIX
          </span>
          <h2 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-carbon">
            Operational Responsibilities & Obligations
          </h2>
          <p className="font-mono text-xs text-carbon/70 uppercase">
            DIRECTED TRACKING OF MANDATES, DEADLINES, AND PRECURSOR BLOCKERS
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2 py-1 bg-signal-orange text-raw-paper font-bold uppercase">
            ACTIVE: {obligations.filter((o) => o.status === "ACTIVE").length}
          </span>
          <span className="px-2 py-1 bg-industrial-green text-raw-paper font-bold uppercase">
            COMPLETED: {obligations.filter((o) => o.status === "COMPLETED").length}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-2 border-carbon bg-raw-paper-light p-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-raw-paper border border-carbon flex-1 max-w-md">
          <IconSearch size={14} className="text-carbon/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search obligations by code, task, or owner..."
            className="w-full bg-transparent border-none text-xs font-mono text-carbon placeholder:text-carbon/40 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs">
          {(["ALL", "ACTIVE", "COMPLETED"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 uppercase font-bold border transition-colors ${
                filter === tab
                  ? "bg-carbon text-raw-paper border-carbon shadow-brutal"
                  : "bg-raw-paper text-carbon border-carbon/40 hover:border-carbon"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Obligations Table / Grid */}
      <div className="border-2 border-carbon bg-raw-paper shadow-brutal overflow-hidden divide-y-2 divide-carbon">
        <div className="p-3.5 bg-raw-paper-light border-b-2 border-carbon flex items-center justify-between text-xs font-mono">
          <span className="font-bold uppercase text-carbon">
            DIRECTED TRANSITION OBLIGATIONS REGISTER ({filtered.length})
          </span>
          <span className="text-carbon/60 uppercase text-[10px]">
            ALL ACTIONS ANCHORED TO VERIFIED CITATIONS
          </span>
        </div>

        {filtered.map((item) => {
          const isCompleted = item.status === "COMPLETED";

          return (
            <div
              key={item.id}
              className={`p-5 transition-colors space-y-3 ${
                isCompleted
                  ? "bg-concrete/20 opacity-70"
                  : "bg-raw-paper-light hover:bg-concrete/40"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-carbon/20 pb-2">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-1.5 py-0.5 bg-carbon text-raw-paper font-bold">
                    {item.code}
                  </span>
                  <span className="px-2 py-0.5 border border-carbon bg-raw-paper font-bold uppercase text-[10px]">
                    {item.nature}
                  </span>
                  <span className="text-carbon/60 text-[11px] truncate">
                    // ORIGIN: {item.originatingDecision}
                  </span>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-signal-orange font-bold">
                    DUE: {item.deadline}
                  </span>
                  <button
                    onClick={() => toggleStatus(item.id)}
                    className={`px-2 py-0.5 text-[10px] font-bold uppercase border transition-colors ${
                      isCompleted
                        ? "bg-industrial-green text-raw-paper border-carbon"
                        : "bg-raw-paper text-carbon border-carbon hover:bg-carbon hover:text-raw-paper"
                    }`}
                  >
                    {isCompleted ? "✓ COMPLETED" : "MARK DONE"}
                  </button>
                </div>
              </div>

              <div>
                <h3
                  className={`font-display font-bold text-base sm:text-lg uppercase text-carbon leading-snug ${
                    isCompleted ? "line-through opacity-70" : ""
                  }`}
                >
                  {item.task}
                </h3>
              </div>

              {/* Stakeholders & Precursors */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs pt-1">
                <div className="p-2.5 bg-raw-paper border border-carbon space-y-0.5">
                  <span className="text-[10px] text-carbon/60 uppercase font-bold block">
                    ASSIGNED OWNER:
                  </span>
                  <span className="font-bold text-carbon block truncate">
                    {item.assignedOwner}
                  </span>
                </div>

                <div className="p-2.5 bg-raw-paper border border-carbon space-y-0.5">
                  <span className="text-[10px] text-carbon/60 uppercase font-bold block">
                    INCOMING DELEGATE:
                  </span>
                  <span className="font-bold text-carbon block truncate">
                    {item.incomingDelegate}
                  </span>
                </div>

                <div className="p-2.5 bg-raw-paper border border-carbon space-y-0.5">
                  <span className="text-[10px] text-carbon/60 uppercase font-bold block">
                    PRECURSOR DEPENDENCIES:
                  </span>
                  <span className="text-carbon/80 text-[11px] block truncate">
                    {item.dependencies.join(", ")}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-carbon/60 pt-1">
                <span>EVIDENCE ANCHOR: {item.evidenceSource}</span>
                <span className="uppercase text-signal-orange font-bold">
                  Human Sign-Off Mandatory
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
