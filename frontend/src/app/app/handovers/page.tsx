"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import {
  fetchHandoverDossiers,
  generateHandoverDossier,
  HandoverDossier,
} from "@/lib/api";

export default function HandoverDossiersPage() {
  const [dossiers, setDossiers] = useState<HandoverDossier[]>([]);
  const [activeDossier, setActiveDossier] = useState<HandoverDossier | null>(null);
  const [activeChapter, setActiveChapter] = useState<string>("ch1");
  const [isCompiling, setIsCompiling] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const loadDossiers = useCallback(async () => {
    try {
      const res = await fetchHandoverDossiers();
      if (res.items.length > 0) {
        setDossiers(res.items);
        setActiveDossier(res.items[0]);
      }
    } catch (err) {
      console.warn("Failed to load dossiers:", err);
    }
  }, []);

  useEffect(() => {
    loadDossiers();
  }, [loadDossiers]);

  const handleCompileDossier = async () => {
    setIsCompiling(true);
    setExportNotice("Compiling executive transition briefing book from verified knowledge graph...");

    try {
      const newDossier = await generateHandoverDossier({
        title: "Executive Briefing Book: Chief Scientific Officer Transition",
        target_role: "Chief Scientific Officer",
        outgoing_leader_name: "Dr. Eleanor Vance",
        incoming_leader_name: "Dr. Marcus Thorne",
      });

      setDossiers((prev) => [newDossier, ...prev]);
      setActiveDossier(newDossier);
      setActiveChapter("ch1");
      setExportNotice("Dossier compiled successfully with cryptographic citation anchors.");
      setTimeout(() => setExportNotice(null), 4500);
    } catch (err: any) {
      console.error("Compilation error:", err);
      setExportNotice(`Compilation failed: ${err.message}`);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleExportJSON = () => {
    if (!activeDossier) return;
    const blob = new Blob([JSON.stringify(activeDossier, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Relay-Dossier-v${activeDossier.version}-${activeDossier.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportNotice("Structured dossier JSON exported to local disk.");
    setTimeout(() => setExportNotice(null), 4000);
  };

  // Find currently active chapter
  const currentChapter =
    activeDossier?.content.chapters.find((c) => c.chapter_id === activeChapter) ||
    activeDossier?.content.chapters[0];

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
            {activeDossier
              ? `DELIVERABLE #DOS-2024-CSO-v${activeDossier.version} • ACME BIOSYSTEMS TRANSITION NODE`
              : "ACME BIOSYSTEMS TRANSITION NODE • VERIFIED MULTI-CHAPTER BRIEFING BOOK"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCompileDossier}
            disabled={isCompiling}
          >
            <span>{isCompiling ? "Compiling Dossier..." : "Compile Live Dossier"}</span>
          </Button>

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
            onClick={handleExportJSON}
            disabled={!activeDossier}
          >
            <span>Export Structured Dossier</span>
          </Button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 bg-industrial-green text-raw-paper font-mono text-xs border border-carbon flex items-center justify-between">
          <span className="font-bold">✓ {exportNotice}</span>
          <button onClick={() => setExportNotice(null)} className="underline uppercase text-[10px]">
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
              <span>STATUS: {activeDossier ? activeDossier.status.toUpperCase() : "COMPILED"}</span>
              <span>•</span>
              <span>
                VERSION: {activeDossier ? `v${activeDossier.version}` : "v1.0"}
              </span>
              <span>•</span>
              <span>EFFECTIVE: NOVEMBER 30, 2024</span>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="font-display font-black text-2xl sm:text-4xl uppercase tracking-tight text-raw-paper leading-tight">
              {activeDossier?.title || "Executive Briefing Book: Chief Scientific Officer Transition"}
            </h1>
            <p className="font-sans text-xs sm:text-sm text-raw-paper/80 leading-relaxed max-w-2xl">
              {activeDossier?.content.executive_summary ||
                "Preserved organizational decisions, operational obligations, active trial protocols, and resolved institutional matters for incoming leadership."}
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
        <div className="grid grid-cols-2 sm:grid-cols-5 border-b-2 border-carbon bg-raw-paper-light divide-x-2 divide-carbon font-mono text-xs">
          {[
            { id: "ch1", label: "CH 01 // MANDATE" },
            { id: "ch2", label: "CH 02 // DECISIONS" },
            { id: "ch3", label: "CH 03 // OBLIGATIONS" },
            { id: "ch4", label: "CH 04 // RISKS & GAPS" },
            { id: "ch5", label: "CH 05 // DAY 1-30" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveChapter(tab.id)}
              className={`p-3 text-left font-bold uppercase transition-colors ${
                activeChapter === tab.id
                  ? "bg-carbon text-raw-paper shadow-inner"
                  : "hover:bg-concrete/40 text-carbon"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Chapter Content Plate */}
        <div className="p-6 sm:p-10 space-y-8">
          {currentChapter ? (
            <>
              {/* Chapter Title & Synthesis */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs uppercase px-2 py-0.5 bg-signal-orange text-raw-paper font-bold">
                    {currentChapter.chapter_id.toUpperCase()}
                  </span>
                  <h2 className="font-display font-black text-xl sm:text-2xl uppercase text-carbon">
                    {currentChapter.title}
                  </h2>
                </div>
                <p className="font-sans text-sm text-carbon/90 leading-relaxed bg-raw-paper-light p-4 border border-carbon">
                  {currentChapter.summary}
                </p>
              </div>

              {/* Verified Facts & Evidence Slices */}
              {currentChapter.facts && currentChapter.facts.length > 0 && (
                <div className="space-y-4">
                  <span className="font-mono text-xs uppercase font-bold text-carbon block">
                    // RATIFIED CLAIMS & EVIDENCE ANCHORS ({currentChapter.facts.length})
                  </span>

                  <div className="space-y-3">
                    {currentChapter.facts.map((fact) => (
                      <div
                        key={fact.id}
                        className="p-4 bg-raw-paper-light border-l-4 border-carbon font-mono text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-signal-orange uppercase">
                            CATEGORY: {fact.category}
                          </span>
                          <EvidenceBadge
                            status={
                              fact.verification_status === "evidence-backed"
                                ? "evidence-backed"
                                : "inferred"
                            }
                            size="sm"
                          />
                        </div>

                        <p className="font-sans text-xs sm:text-sm text-carbon font-medium">
                          {fact.statement}
                        </p>

                        {fact.citations && fact.citations.length > 0 && (
                          <div className="pt-2 border-t border-carbon/20 space-y-1">
                            <span className="text-[10px] text-carbon/60 uppercase font-bold block">
                              VERBATIM QUOTE [{fact.citations[0].source_location}]:
                            </span>
                            <blockquote className="italic text-carbon/80 text-[11px] leading-relaxed">
                              &ldquo;{fact.citations[0].verbatim_quote}&rdquo;
                            </blockquote>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Action Items */}
              {currentChapter.action_items && currentChapter.action_items.length > 0 && (
                <div className="p-5 bg-concrete/30 border-2 border-carbon space-y-3 font-mono text-xs">
                  <span className="font-bold text-carbon uppercase block">
                    // CHAPTER ACTION DIRECTIVES & TRANSITION MANDATES
                  </span>
                  <ul className="space-y-2 list-disc list-inside font-sans text-xs text-carbon/90">
                    {currentChapter.action_items.map((item, i) => (
                      <li key={i} className="leading-relaxed">
                        <strong className="font-mono text-signal-orange font-bold mr-1">
                          [ACTION-{i + 1}]
                        </strong>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            /* Fallback Chapter 1 when no dossier generated yet */
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="font-mono text-xs uppercase px-2 py-0.5 bg-signal-orange text-raw-paper font-bold">
                  CHAPTER 01
                </span>
                <h2 className="font-display font-black text-2xl uppercase text-carbon">
                  Executive Context & Institutional Mandate
                </h2>
                <p className="font-sans text-sm text-carbon/90 leading-relaxed bg-raw-paper-light p-4 border border-carbon">
                  Dr. Eleanor Vance has served as Chief Scientific Officer since January 2021. The transition to Dr. Marcus Thorne transfers regulatory oversight of IND filings, discovery chemistry laboratories, and cross-functional research committees.
                </p>
              </div>

              <div className="p-4 bg-signal-orange/10 border-2 border-signal-orange space-y-2 font-mono text-xs">
                <span className="font-bold text-signal-orange uppercase block">
                  READY TO COMPILE DEDICATED BRIEFING BOOK
                </span>
                <p className="font-sans text-xs text-carbon">
                  Click &ldquo;Compile Live Dossier&rdquo; above to synthesize all 5 chapters directly from your active knowledge graph with cryptographic citations.
                </p>
              </div>
            </div>
          )}

          {/* Day 1-30 Roadmap Preview */}
          {activeDossier?.content.recommended_day_1_to_30_actions &&
            activeDossier.content.recommended_day_1_to_30_actions.length > 0 && (
              <div className="pt-6 border-t-2 border-carbon space-y-4">
                <span className="font-mono text-xs uppercase font-bold text-carbon block">
                  // DAY 1 TO DAY 30 EXECUTIVE OPERATIONAL ROADMAP
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                  {activeDossier.content.recommended_day_1_to_30_actions.map(
                    (action, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-raw-paper-light border border-carbon space-y-1"
                      >
                        <span className="text-[10px] text-signal-orange uppercase font-bold">
                          PHASE STEP {idx + 1}
                        </span>
                        <p className="font-sans text-xs text-carbon leading-snug">
                          {action}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
        </div>
      </article>
    </div>
  );
}
