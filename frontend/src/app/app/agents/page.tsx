"use client";

import React, { useState } from "react";
import {
  IconAgent,
  IconDocument,
  IconAlert,
  IconCheck,
  IconChevronRight,
  IconUser,
  IconInfo,
} from "@/components/ui/Icons";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface AgentStage {
  id: string;
  name: string;
  order: number;
  role: string;
  currentTask: string;
  inputSpecification: string;
  findingsSummary: string;
  outputArtifact: string;
  handoffStatus: "Ready for Handoff" | "Awaiting Pipeline Activation" | "Standing By";
  humanReviewRequired: string;
  unresolvedWorkNote: string;
}

const COLLABORATIVE_AGENTS: AgentStage[] = [
  {
    id: "extractor",
    name: "Knowledge Extractor",
    order: 1,
    role: "Multimodal Document & Entity Ingestion",
    currentTask: "Indexed 3 core demonstration charters and governance agreements.",
    inputSpecification: "Raw PDF, DOCX, and TXT authorized organizational records.",
    findingsSummary: "Extracted 108 relational triples, 34 entity definitions, and 12 operational procedures.",
    outputArtifact: "Entity Graph & Citation Index",
    handoffStatus: "Ready for Handoff",
    humanReviewRequired: "Human ratification of extracted organizational hierarchy and role definitions.",
    unresolvedWorkNote: "Awaiting automated OCR pass on appendix scanned diagrams in Milestone 2.",
  },
  {
    id: "detective",
    name: "Gap Detective",
    order: 2,
    role: "Cross-Record Contradiction & Omission Analysis",
    currentTask: "Audited institutional records against transition checklists.",
    inputSpecification: "Indexed Entity Graph and cross-document citation anchors.",
    findingsSummary: "Discovered 1 critical missing vendor contact and 1 cloud migration policy contradiction.",
    outputArtifact: "Discrepancy Ledger & Contradiction Diffs",
    handoffStatus: "Ready for Handoff",
    humanReviewRequired: "Human decision on cloud freeze consensus and secondary signatory designation.",
    unresolvedWorkNote: "Requires human review on 3 open investigations before closing audit.",
  },
  {
    id: "analyst",
    name: "Continuity Analyst",
    order: 3,
    role: "Obligation & Dependency Risk Quantification",
    currentTask: "Mapped transition milestones to responsible owners and deadlines.",
    inputSpecification: "Audited entities, validated runbooks, and ratified decisions.",
    findingsSummary: "Cataloged 4 active handover obligations, identifying the Nov 12 FDA Calibration as critical blocker.",
    outputArtifact: "Operational Responsibility Matrix & Critical Path Schedule",
    handoffStatus: "Standing By",
    humanReviewRequired: "Outgoing and incoming leadership sign-off on delegation timeline.",
    unresolvedWorkNote: "FDA calibration signatory letter requires execution prior to Nov 10.",
  },
  {
    id: "architect",
    name: "Handover Architect",
    order: 4,
    role: "Executive Briefing Book & Dossier Synthesis",
    currentTask: "Compiled draft executive handover dossier with first-week action blueprint.",
    inputSpecification: "Adjudicated claims, resolved gaps, and active responsibility matrix.",
    findingsSummary: "Synthesized executive briefing dossier #DOS-2026-CSO-01 with 5 structured chapters.",
    outputArtifact: "Executive Handover Dossier & First-Week Action Blueprint",
    handoffStatus: "Standing By",
    humanReviewRequired: "Final formal acceptance by Incoming Interim Head and General Counsel.",
    unresolvedWorkNote: "Dossier remains in draft status pending resolution of 3 open investigations.",
  },
];

export default function AgentCollaborationPage() {
  const [selectedAgent, setSelectedAgent] = useState<AgentStage>(COLLABORATIVE_AGENTS[0]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-rule">
        <div>
          <h1 className="text-xl font-serif font-semibold text-ink">
            Agent Collaboration Workflow
          </h1>
          <p className="text-xs text-ink-secondary mt-0.5">
            Sequential orchestration of four specialized agents accessing Relay&apos;s persistent backend knowledge repository.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-sans text-ink-secondary border border-rule px-2.5 py-1 rounded bg-paper-surface">
          <IconAgent size={14} className="text-olive" />
          <span>Orchestration Layer: Switch Standby</span>
        </div>
      </div>

      {/* Collaboration Flow Sequence */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {COLLABORATIVE_AGENTS.map((agent) => {
          const isSelected = selectedAgent.id === agent.id;

          return (
            <div
              key={agent.id}
              onClick={() => setSelectedAgent(agent)}
              className={`p-4 rounded border cursor-pointer transition-colors space-y-3 flex flex-col justify-between ${
                isSelected
                  ? "bg-paper-surface border-ink shadow-xs"
                  : "bg-paper-surface border-rule hover:bg-paper-secondary/40"
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-mono text-ink-secondary text-[11px]">
                    STAGE 0{agent.order}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-olive" />
                </div>
                <h3 className="text-sm font-semibold text-ink font-sans">
                  {agent.name}
                </h3>
                <p className="text-xs text-ink-secondary mt-1 line-clamp-2">
                  {agent.role}
                </p>
              </div>

              <div className="pt-2 border-t border-rule text-[11px] text-ink-secondary flex items-center justify-between">
                <span>{agent.handoffStatus}</span>
                <IconChevronRight size={12} className={isSelected ? "text-ink" : "text-rule"} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Agent Detailed Ledger */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>{selectedAgent.name} Operational Details</CardTitle>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded border bg-paper-secondary text-ink-secondary border-rule">
                Stage 0{selectedAgent.order}
              </span>
            </div>
            <p className="text-xs text-ink-secondary mt-0.5">
              {selectedAgent.role}
            </p>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-olive-light text-olive-dark border border-olive-border font-medium">
            {selectedAgent.handoffStatus}
          </span>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 rounded bg-paper border border-rule space-y-1">
              <span className="text-[10px] uppercase font-semibold text-ink-secondary block">
                Upstream Input Specification
              </span>
              <p className="text-ink">{selectedAgent.inputSpecification}</p>
            </div>

            <div className="p-3 rounded bg-paper border border-rule space-y-1">
              <span className="text-[10px] uppercase font-semibold text-olive block">
                Downstream Output Artifact
              </span>
              <p className="text-ink font-medium">{selectedAgent.outputArtifact}</p>
            </div>
          </div>

          <div className="p-3 rounded bg-paper-secondary border border-rule space-y-1">
            <span className="text-[10px] uppercase font-semibold text-ink-secondary block">
              Current Extraction & Finding Summary
            </span>
            <p className="text-ink leading-relaxed font-sans">{selectedAgent.findingsSummary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 rounded bg-paper-surface border border-rule space-y-1">
              <span className="text-[10px] uppercase font-semibold text-copper block">
                Human Review & Sign-Off Gate
              </span>
              <p className="text-ink-secondary leading-relaxed">
                {selectedAgent.humanReviewRequired}
              </p>
            </div>

            <div className="p-3 rounded bg-paper-surface border border-rule space-y-1">
              <span className="text-[10px] uppercase font-semibold text-ink-secondary block">
                Open / Unresolved Work Note
              </span>
              <p className="text-ink-secondary leading-relaxed">
                {selectedAgent.unresolvedWorkNote}
              </p>
            </div>
          </div>

          <div className="p-3 rounded bg-paper border border-rule flex items-start gap-2.5 text-ink-secondary">
            <IconInfo size={16} className="text-olive shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-ink">Architecture note:</strong> Agents do not operate as independent chatbots. All four agents read from and persist structured records into Relay&apos;s persistent SQLite database through documented FastAPI endpoints, with Switch managing collaborative orchestration.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

