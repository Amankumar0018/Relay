"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  IconAgent,
  IconDocument,
  IconAlert,
  IconCheck,
  IconUser,
  IconInfo,
  IconArrowRight,
  IconSearch,
} from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { EvidenceBadge } from "@/components/evidence/EvidenceBadge";
import {
  askQuestion,
  fetchQAHistory,
  QAResponse,
  QACitation,
} from "@/lib/api";

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
    model: "Gemini 3.5 Flash (High Throughput)",
    status: "ACTIVE",
    inputSpec: "Raw PDF, DOCX, TXT archives deposited into local storage.",
    findings: "Parsed and segmented primary records, indexing relational entity triples and character-level citation coordinates.",
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
    model: "Gemini 3.5 Flash (Adversarial Reasoning)",
    status: "ACTIVE",
    inputSpec: "Entity graph, charter clauses, regulatory filings, and vendor agreements.",
    findings: "Flagged anomalies: FDA Form 1572 PI mismatch, $140K spectrometry lab auto-renewal, and unassigned project ownership.",
    outputArtifact: "Classified Anomaly Register & Evidence Dossier",
    humanApprovalGate: "Mandatory Switch Gate: Human adjudication required to resolve open contradictions and gaps.",
    switchOrchestrationState: "Awaiting human resolution on open matters before closing audit pass.",
  },
  {
    id: "analyst",
    code: "AGT-03",
    name: "Continuity Analyst",
    order: "STAGE 03",
    role: "Obligation & Dependency Risk Mapping",
    model: "Gemini 3.5 Flash (Deterministic Topological Scoring)",
    status: "STANDBY",
    inputSpec: "Ratified decisions, verified entities, and contractual calendar dates.",
    findings: "Cataloged operational obligations, establishing critical blockers and readiness scores.",
    outputArtifact: "Directed Dependency Tree & Operational Responsibility Matrix",
    humanApprovalGate: "Departing and incoming leadership sign-off on delegation timeline.",
    switchOrchestrationState: "Standby for Switch resolution of open matters to calculate downstream risk scores.",
  },
  {
    id: "architect",
    code: "AGT-04",
    name: "Handover Architect",
    order: "STAGE 04",
    role: "Executive Briefing Book & Dossier Synthesis",
    model: "Gemini 3.5 Flash (Structured Synthesis)",
    status: "STANDBY",
    inputSpec: "Adjudicated claims, resolved gaps, and operational responsibility vectors.",
    findings: "Synthesized draft executive handover dossier with 5 chapters and Day-1 to Day-30 blueprint.",
    outputArtifact: "Executive Transition Dossier & First-Week Operational Blueprint",
    humanApprovalGate: "Final formal acceptance and digital sign-off by Incoming Leadership and General Counsel.",
    switchOrchestrationState: "Dossier preview compiled. Final release locked pending Switch gate approvals.",
  },
];

export default function AgentCollaborationPage() {
  const [selectedAgentId, setSelectedAgentId] = useState<string>("extractor");
  const selectedAgent = AGENTS.find((a) => a.id === selectedAgentId) || AGENTS[0];

  // Q&A State
  const [questionInput, setQuestionInput] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<QAResponse | null>(null);
  const [qaHistory, setQaHistory] = useState<QAResponse[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetchQAHistory();
      if (res.items.length > 0) {
        setQaHistory(res.items);
      }
    } catch (err) {
      console.warn("Could not load QA history:", err);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleAsk = async (queryText?: string) => {
    const q = (queryText || questionInput).trim();
    if (!q) return;

    setIsAsking(true);
    setErrorMessage(null);

    try {
      const res = await askQuestion(q);
      setCurrentResponse(res);
      setQuestionInput("");
      await loadHistory();
    } catch (err: any) {
      console.error("QA error:", err);
      setErrorMessage(err.message || "Failed to answer question.");
    } finally {
      setIsAsking(false);
    }
  };

  const sampleQuestions = [
    "Who is designated as sponsor representative for trial protocol sign-off?",
    "What contracts or commitments are auto-renewing soon?",
    "What projects or assets currently lack assigned ownership?",
    "What are the critical blockers for incoming leadership?",
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-carbon pb-4">
        <div>
          <span className="font-mono text-xs uppercase font-bold text-signal-orange">
            // ORCHESTRATION PIPELINE
          </span>
          <h2 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-carbon">
            Agent Collaboration & Grounded Q&A
          </h2>
          <p className="font-mono text-xs text-carbon/70 uppercase">
            EVIDENCE-GROUNDED REASONING DESK • ZERO-HALLUCINATION ENFORCEMENT
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

      {/* =========================================================================
          SECTION 1: Evidence-Grounded AI Question Answering Desk
      ========================================================================= */}
      <div className="border-2 border-carbon bg-raw-paper shadow-brutal p-6 space-y-6">
        <div className="border-b-2 border-carbon pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-signal-orange" />
              <span className="font-mono text-xs uppercase font-bold text-signal-orange">
                // EXECUTIVE REASONING ASSISTANT
              </span>
            </div>
            <h3 className="font-display font-black text-xl uppercase text-carbon mt-1">
              Ask Relay: Transition Intelligence Query
            </h3>
            <p className="font-mono text-xs text-carbon/70">
              Deterministic verification against deposited records • Inferred claims and open contradictions highlighted
            </p>
          </div>

          <div className="font-mono text-xs">
            <span className="px-2.5 py-1 bg-carbon text-raw-paper font-bold uppercase border border-carbon">
              EVIDENCE GROUNDING: STRICT
            </span>
          </div>
        </div>

        {/* Input Bar */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-2 border-carbon bg-raw-paper-light p-2">
            <IconSearch size={18} className="text-carbon/60 ml-2" />
            <input
              type="text"
              value={questionInput}
              onChange={(e) => setQuestionInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isAsking) {
                  handleAsk();
                }
              }}
              placeholder="Ask about decisions, obligations, deadlines, unowned assets, or contradictions..."
              className="w-full bg-transparent border-none text-xs sm:text-sm font-mono text-carbon placeholder:text-carbon/40 focus:outline-none px-2"
            />
            <Button
              variant="signal"
              size="sm"
              onClick={() => handleAsk()}
              disabled={isAsking || !questionInput.trim()}
              className="shrink-0"
            >
              <span>{isAsking ? "Evaluating Evidence..." : "Query Knowledge Base →"}</span>
            </Button>
          </div>

          {/* Preset Prompts */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="text-[10px] text-carbon/60 uppercase font-bold">
              SUGGESTED QUERIES:
            </span>
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuestionInput(q);
                  handleAsk(q);
                }}
                className="px-2 py-0.5 bg-raw-paper-light border border-carbon/40 hover:border-carbon hover:bg-concrete/40 text-[11px] text-carbon text-left"
              >
                &ldquo;{q.slice(0, 48)}...&rdquo;
              </button>
            ))}
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-signal-red text-raw-paper font-mono text-xs border border-carbon">
            <strong>Error:</strong> {errorMessage}
          </div>
        )}

        {/* Live Answer Plate */}
        {currentResponse && (
          <div className="border-2 border-carbon bg-raw-paper-light p-5 space-y-4 font-mono text-xs">
            {/* Answer Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-carbon/30 pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] text-carbon/60 uppercase font-bold block">
                  QUESTION:
                </span>
                <span className="font-bold text-sm text-carbon font-sans">
                  &ldquo;{currentResponse.question}&rdquo;
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`px-2 py-0.5 font-bold uppercase text-[10px] border border-carbon ${
                    currentResponse.has_sufficient_evidence
                      ? "bg-industrial-green text-raw-paper"
                      : "bg-signal-red text-raw-paper"
                  }`}
                >
                  {currentResponse.has_sufficient_evidence
                    ? `EVIDENCE BACKED (${Math.round(currentResponse.confidence_score * 100)}%)`
                    : "INSUFFICIENT EVIDENCE"}
                </span>
              </div>
            </div>

            {/* Contradiction Warning Alert */}
            {currentResponse.conflicts_detected &&
              currentResponse.conflicts_detected.length > 0 && (
                <div className="p-3.5 bg-signal-orange/15 border-2 border-signal-orange space-y-1">
                  <div className="flex items-center gap-2 text-signal-orange font-bold text-xs uppercase">
                    <IconAlert size={16} />
                    <span>OPEN CONTRADICTION DETECTED ON THIS TOPIC</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 pt-1 font-sans text-xs text-carbon">
                    {currentResponse.conflicts_detected.map((conf, i) => (
                      <li key={i} className="leading-snug">
                        {conf}
                      </li>
                    ))}
                  </ul>
                  <span className="text-[10px] text-carbon/60 block pt-1">
                    Adjudication required in the Switch Human Resolution Desk.
                  </span>
                </div>
              )}

            {/* Answer Content */}
            <div className="space-y-1">
              <span className="text-[10px] text-carbon/60 uppercase font-bold block">
                GROUNDED SYNTHESIS:
              </span>
              <p className="font-sans text-xs sm:text-sm text-carbon leading-relaxed p-4 bg-raw-paper border border-carbon whitespace-pre-wrap">
                {currentResponse.answer}
              </p>
            </div>

            {/* Verbatim Citations */}
            {currentResponse.citations && currentResponse.citations.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-carbon/20">
                <span className="font-bold text-carbon uppercase block">
                  SUPPORTING SOURCE CITATIONS ({currentResponse.citations.length})
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentResponse.citations.map((c, i) => (
                    <div
                      key={i}
                      className="p-3 bg-raw-paper border-l-4 border-carbon space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] text-carbon/60 font-bold uppercase">
                        <span>{c.document_filename}</span>
                        <span>{c.source_location}</span>
                      </div>
                      <blockquote className="italic text-carbon leading-relaxed">
                        &ldquo;{c.verbatim_quote}&rdquo;
                      </blockquote>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Past Audit History Log */}
        {qaHistory.length > 0 && (
          <div className="space-y-2 pt-4 border-t-2 border-carbon font-mono text-xs">
            <span className="font-bold uppercase text-carbon block">
              // AUDITED QUESTION & CITATION LOG ({qaHistory.length})
            </span>
            <div className="max-h-40 overflow-y-auto divide-y divide-carbon/20 border border-carbon bg-raw-paper-light">
              {qaHistory.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setCurrentResponse(item)}
                  className="p-2.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-concrete/40 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-carbon truncate font-sans text-xs">
                      {item.question}
                    </p>
                    <span className="text-[10px] text-carbon/60">
                      {item.citations.length} citation(s) •{" "}
                      {item.has_sufficient_evidence ? "Evidence backed" : "Insufficient evidence"}
                    </span>
                  </div>

                  <span className="text-[10px] text-signal-orange font-bold uppercase shrink-0">
                    Inspect Evidence →
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 2: Specialized Agent Pipeline Stages
      ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase font-bold text-carbon">
            // PIPELINE ARCHITECTURE: SPECIALIZED AGENT STAGES
          </span>
          <span className="font-mono text-[10px] text-carbon/60 uppercase">
            CLICK STAGE TO INSPECT GOVERNANCE GATES
          </span>
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
    </div>
  );
}
