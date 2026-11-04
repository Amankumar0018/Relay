"use client";

import React, { useState } from "react";
import {
  IconTask,
  IconCheck,
  IconAlert,
  IconDocument,
  IconUser,
  IconSearch,
} from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";

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
          {(["ALL", "ACTIVE", "COMPLETED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 uppercase text-[11px] font-bold border transition-colors ${
                filter === s
                  ? "bg-carbon text-raw-paper border-carbon shadow-brutal"
                  : "bg-raw-paper text-carbon border-carbon/40 hover:border-carbon"
              }`}
            >
              [{s}]
            </button>
          ))}
        </div>
      </div>

      {/* Responsibility Table */}
      <div className="border-2 border-carbon bg-raw-paper-light shadow-brutal overflow-x-auto">
        <table className="w-full text-left font-mono text-xs divide-y-2 divide-carbon">
          <thead className="bg-raw-paper uppercase font-bold text-carbon/70 text-[10px]">
            <tr>
              <th className="p-3 w-16">CODE</th>
              <th className="p-3">TASK & PRIMARY EVIDENCE</th>
              <th className="p-3 w-36">NATURE</th>
              <th className="p-3 w-48">OWNER → DELEGATE</th>
              <th className="p-3 w-28">DEADLINE</th>
              <th className="p-3 w-40">DEPENDENCIES</th>
              <th className="p-3 w-24 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-carbon/20">
            {filtered.map((item) => (
              <tr
                key={item.id}
                className={`hover:bg-concrete/30 transition-colors ${
                  item.status === "COMPLETED" ? "opacity-60 bg-concrete/20" : ""
                }`}
              >
                <td className="p-3 font-bold text-signal-orange">
                  {item.code}
                </td>
                <td className="p-3 space-y-1">
                  <div className="font-sans font-bold text-sm text-carbon">
                    {item.task}
                  </div>
                  <div className="text-[10px] text-carbon/60">
                    Source: {item.evidenceSource}
                  </div>
                </td>
                <td className="p-3">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-concrete border border-carbon text-carbon uppercase">
                    {item.nature}
                  </span>
                </td>
                <td className="p-3 space-y-0.5">
                  <div className="font-bold text-carbon">{item.assignedOwner}</div>
                  <div className="text-[10px] text-carbon/60">→ {item.incomingDelegate}</div>
                </td>
                <td className="p-3">
                  <span
                    className={`font-bold ${
                      item.status === "ACTIVE" ? "text-signal-orange" : "text-carbon/60"
                    }`}
                  >
                    {item.deadline}
                  </span>
                </td>
                <td className="p-3 space-y-1">
                  {item.dependencies.map((dep, idx) => (
                    <div key={idx} className="text-[10px] text-carbon/80 flex items-center gap-1.5">
                      <span className="w-1 h-1 bg-carbon" />
                      <span>{dep}</span>
                    </div>
                  ))}
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => toggleStatus(item.id)}
                    className={`px-2 py-1 text-[10px] uppercase font-bold border transition-colors ${
                      item.status === "COMPLETED"
                        ? "bg-industrial-green text-raw-paper border-carbon"
                        : "bg-raw-paper text-carbon border-carbon hover:bg-carbon hover:text-raw-paper"
                    }`}
                  >
                    {item.status === "COMPLETED" ? "DONE" : "TOGGLE"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
