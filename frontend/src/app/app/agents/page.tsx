"use client";

import React, { useState } from "react";
import {
  IconAgent,
  IconDocument,
  IconAlert,
  IconCheck,
  IconUser,
  IconInfo,
  IconArrowRight,
} from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";

interface AgentStage {
  id: string;
  code: string;
  name: string;
  order: string;
  role: string;
  model: string;
  status: "ACTIVE" | "STANDBY";
  inputSpec: string;
  findings: string;
  outputArtifact: string;
  humanApprovalGate: string;
  switchOrchestrationState: string;
}

const AGENTS: AgentStage[] = [
  {
    id: "extractor",
    code: "AGT-01",
    name: "Knowledge Extractor",
    order: "STAGE 01",
    role: "Multimodal Document & Entity Ingestion",
    model: "Gemini 3.8 Flash (High Throughput)",
    status: "ACTIVE",
    inputSpec: "Raw PDF, DOCX, TXT archives deposited into local storage.",
    findings: "Parsed 42 primary records, indexing 312 relational entity triples and 100% character-level citation coordinates.",
    outputArtifact: "Entity Graph & Verbatim Citation Concordance",
    humanApprovalGate: "Human review of extracted organizational hierarchy and financial authority thresholds.",
    switchOrchestrationState: "Pipeline stage completed. Citations committed to persistent SQLite database.",
  },
  {
    id: "detective",
    code: "AGT-02",
    name: "Gap Detective",
    order: "STAGE 02",
    role: "Cross-Record Contradiction & Omission Analysis",
    model: "Gemini 3.8 Pro (Adversarial Reasoning)",
    status: "ACTIVE",
    inputSpec: "Entity graph, charter clauses, regulatory filings, and vendor agreements.",
    findings: "Flagged 3 anomalies: FDA Form 1572 PI mismatch, $140K spectrometry lab auto-renewal, and missing patent exhibit.",
    outputArtifact: "Classified Anomaly Register & Evidence Dossier",
    humanApprovalGate: "Mandatory Switch Gate: Human adjudication required to resolve CASE-BIO-09, CASE-BIO-14, CASE-BIO-22.",
    switchOrchestrationState: "Awaiting human resolution on 3 open matters before closing audit pass.",
  },
  {
    id: "analyst",
    code: "AGT-03",
    name: "Continuity Analyst",
    order: "STAGE 03",
    role: "Obligation & Dependency Risk Mapping",
    model: "Gemini 3.8 Flash (Fast Topological Evaluation)",
    status: "STANDBY",
    inputSpec: "Ratified decisions, verified entities, and contractual calendar dates.",
    findings: "Cataloged 5 operational obligations, establishing the November 1 FDA PI co-signature as critical path blocker.",
    outputArtifact: "Directed Dependency Tree & Operational Responsibility Matrix",
    humanApprovalGate: "Departing and incoming leadership sign-off on delegation timeline.",
    switchOrchestrationState: "Standby for Switch resolution of CASE-BIO-09 to calculate downstream risk scores.",
  },
  {
    id: "architect",
    code: "AGT-04",
    name: "Handover Architect",
    order: "STAGE 04",
    role: "Executive Briefing Book & Dossier Synthesis",
    model: "Gemini 3.8 Pro (Structured Synthesis)",
    status: "STANDBY",
    inputSpec: "Adjudicated claims, resolved gaps, and operational responsibility vectors.",
    findings: "Synthesized draft executive handover dossier DOS-2024-CSO with 5 chapters and Day-1 to Day-30 blueprint.",
    outputArtifact: "Executive Transition Dossier & First-Week Operational Blueprint",
    humanApprovalGate: "Final formal acceptance and digital sign-off by Incoming CSO and General Counsel.",
    switchOrchestrationState: "Dossier preview compiled. Final release locked pending Switch gate approvals.",
  },
];

export default function AgentCollaborationPage() {
  const [selectedAgentId, setSelectedAgentId] = useState<string>("extractor");
  const selectedAgent = AGENTS.find((a) => a.id === selectedAgentId) || AGENTS[0];

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-carbon pb-4">
        <div>
          <span className="font-mono text-xs uppercase font-bold text-signal-orange">
            // ORCHESTRATION PIPELINE
          </span>
          <h2 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-carbon">
            Agent Collaboration & Switch Governance
          </h2>
          <p className="font-mono text-xs text-carbon/70 uppercase">
            FOUR SPECIALIZED AGENTS • HUMAN-IN-THE-LOOP SWITCH REASONING DESK
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2 py-1 bg-carbon text-raw-paper font-bold uppercase">
            ORCHESTRATOR: SWITCH BUS
          </span>
          <span className="px-2 py-1 bg-industrial-green text-raw-paper font-bold uppercase">
            STORAGE: SQLITE WAL
          </span>
        </div>
      </div>

      {/* Switch Orchestration Architectural Notice */}
      <div className="p-4 border-2 border-carbon bg-carbon text-raw-paper font-mono text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-signal-orange font-bold uppercase">
            <span className="w-2.5 h-2.5 bg-signal-orange" />
            <span>SWITCH COLLABORATION PROTOCOL</span>
          </div>
          <p className="font-sans text-xs text-raw-paper/80 leading-relaxed max-w-2xl">
            Switch serves as the collaboration and workflow orchestration layer between human administrators and specialized agents. Persistent organizational memory resides locally in Relay&apos;s containerized SQLite database.
          </p>
        </div>

        <div className="text-right shrink-0">
          <span className="px-2 py-1 bg-signal-orange text-raw-paper font-bold uppercase text-[10px]">
            HUMAN GATES ENFORCED
          </span>
        </div>
      </div>

      {/* 4 Agent Pipeline Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {AGENTS.map((agent) => {
          const isSelected = agent.id === selectedAgentId;

          return (
            <button
              key={agent.id}
              onClick={() => setSelectedAgentId(agent.id)}
              className={`text-left p-5 border-2 border-carbon transition-all font-mono ${
                isSelected
                  ? "bg-carbon text-raw-paper shadow-brutal translate-y-[-2px]"
                  : "bg-raw-paper-light text-carbon hover:bg-concrete/40"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 border ${
                    isSelected
                      ? "bg-signal-orange text-raw-paper border-carbon"
                      : "bg-concrete text-carbon border-carbon"
                  }`}
                >
                  {agent.order}
                </span>
                <span
                  className={`text-[10px] font-bold ${
                    agent.status === "ACTIVE"
                      ? isSelected
                        ? "text-industrial-green-light"
                        : "text-industrial-green"
                      : "opacity-50"
                  }`}
                >
                  // {agent.status}
                </span>
              </div>

              <h3 className="font-display font-black text-base uppercase leading-tight">
                {agent.name}
              </h3>

              <p
                className={`font-sans text-xs mt-1.5 leading-relaxed line-clamp-2 ${
                  isSelected ? "text-raw-paper/70" : "text-carbon/70"
                }`}
              >
                {agent.role}
              </p>

              <div className="pt-4 mt-3 border-t border-current/20 text-[10px] opacity-70">
                {agent.model}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Agent Detailed Manifest */}
      <div className="border-2 border-carbon bg-raw-paper p-6 sm:p-8 space-y-6 shadow-brutal">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-carbon pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 bg-carbon text-raw-paper font-bold">
                {selectedAgent.code}
              </span>
              <span className="font-mono text-xs text-signal-orange font-bold uppercase">
                {selectedAgent.order}
              </span>
            </div>
            <h3 className="font-display font-black text-2xl uppercase text-carbon mt-1">
              {selectedAgent.name}
            </h3>
            <p className="font-mono text-xs text-carbon/60 uppercase">
              ROLE: {selectedAgent.role} • ENGINE: {selectedAgent.model}
            </p>
          </div>

          <div className="font-mono text-xs">
            <span className="px-3 py-1 bg-carbon text-raw-paper font-bold uppercase border border-carbon">
              STATUS: {selectedAgent.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
          {/* Input & Output */}
          <div className="space-y-4">
            <div className="p-4 bg-raw-paper-light border border-carbon space-y-1">
              <span className="text-[10px] text-carbon/60 uppercase font-bold block">
                INPUT SPECIFICATION:
              </span>
              <p className="font-sans text-xs text-carbon leading-relaxed">
                {selectedAgent.inputSpec}
              </p>
            </div>

            <div className="p-4 bg-raw-paper-light border border-carbon space-y-1">
              <span className="text-[10px] text-carbon/60 uppercase font-bold block">
                OUTPUT DELIVERABLE ARTIFACT:
              </span>
              <div className="p-2 bg-raw-paper border border-carbon font-bold text-carbon">
                {selectedAgent.outputArtifact}
              </div>
            </div>
          </div>

          {/* Findings & Human Review Gate */}
          <div className="space-y-4">
            <div className="p-4 bg-raw-paper-light border border-carbon space-y-1">
              <span className="text-[10px] text-carbon/60 uppercase font-bold block">
                FINDINGS SUMMARY:
              </span>
              <p className="font-sans text-xs text-carbon leading-relaxed">
                {selectedAgent.findings}
              </p>
            </div>

            <div className="p-4 bg-signal-orange/10 border-2 border-signal-orange space-y-1">
              <span className="text-[10px] text-signal-orange uppercase font-bold block">
                MANDATORY HUMAN APPROVAL GATE:
              </span>
              <p className="font-sans text-xs text-carbon font-semibold leading-relaxed">
                {selectedAgent.humanApprovalGate}
              </p>
            </div>
          </div>
        </div>

        {/* Switch Live State */}
        <div className="p-4 bg-concrete/40 border border-carbon flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-carbon" />
            <span className="font-bold uppercase text-carbon">SWITCH PIPELINE STATE:</span>
            <span className="text-carbon/80 font-sans">{selectedAgent.switchOrchestrationState}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
