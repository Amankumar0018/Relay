"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  IconDossier,
  IconCheck,
  IconAlert,
  IconDocument,
  IconUser,
  IconArrowRight,
  IconBuilding,
  IconShield,
  IconChevronDown,
  IconInfo,
} from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { EvidenceBadge } from "@/components/evidence/EvidenceBadge";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import {
  fetchHandoverDossiers,
  generateHandoverDossier,
  HandoverDossier,
} from "@/lib/api";

const CHAPTER_LABELS: Record<string, string> = {
  ch1: "CH 01 // OVERVIEW",
  ch2: "CH 02 // PROJECTS",
  ch3: "CH 03 // OWNERSHIP",
  ch4: "CH 04 // DECISIONS",
  ch5: "CH 05 // DEADLINES",
  ch6: "CH 06 // CONFLICTS",
  ch7: "CH 07 // GAPS & RISKS",
  ch8: "CH 08 // CONTACTS",
  ch9: "CH 09 // CITATIONS",
};

export default function HandoverDossiersPage() {
  const [dossiers, setDossiers] = useState<HandoverDossier[]>([]);
  const [activeDossier, setActiveDossier] = useState<HandoverDossier | null>(null);
  const [activeChapter, setActiveChapter] = useState<string>("ch1");
  const [isCompiling, setIsCompiling] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Customization Form State
  const [title, setTitle] = useState(
    "Executive Briefing Book: Engineering Leadership & Technical Operations Transition"
  );
  const [targetRole, setTargetRole] = useState(
    "Engineering Leadership & Technical Operations"
  );
  const [outgoingLeaderName, setOutgoingLeaderName] = useState("Marcus Vance");
  const [incomingLeaderName, setIncomingLeaderName] = useState("Incoming Successor");

  const loadDossiers = useCallback(async () => {
    try {
      const res = await fetchHandoverDossiers();
      if (res.items && res.items.length > 0) {
        setDossiers(res.items);
        setActiveDossier((prev) => {
          if (prev) {
            const found = res.items.find((d) => d.id === prev.id);
            return found || res.items[0];
          }
          return res.items[0];
        });
      }
    } catch (err) {
      console.warn("Failed to load dossiers:", err);
    }
  }, []);

  useEffect(() => {
    loadDossiers();
  }, [loadDossiers]);

  const handleCompileDossier = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsCompiling(true);
    setShowConfigModal(false);
    setExportNotice(
      "Synthesizing 9-chapter executive transition dossier from verified institutional memory..."
    );

    try {
      const newDossier = await generateHandoverDossier({
        title: title.trim() || undefined,
        target_role: targetRole.trim() || undefined,
        outgoing_leader_name: outgoingLeaderName.trim() || undefined,
        incoming_leader_name: incomingLeaderName.trim() || undefined,
      });

      setDossiers((prev) => [newDossier, ...prev]);
      setActiveDossier(newDossier);
      setActiveChapter("ch1");
      setExportNotice(
        `Dossier compiled successfully (v${newDossier.version}, ${newDossier.content.chapters.length} chapters) with cryptographic citation anchors.`
      );
      setTimeout(() => setExportNotice(null), 5000);
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

  const handleExportMarkdown = () => {
    if (!activeDossier) return;

    const outgoingName = activeDossier.outgoing_leader?.name || outgoingLeaderName || "Executive Authority";
    const incomingName = activeDossier.incoming_leader?.name || incomingLeaderName || "Incoming Successor";

    let md = `# ${activeDossier.title}\n\n`;
    md += `**Version**: v${activeDossier.version} | **Status**: ${activeDossier.status.toUpperCase()} | **Role**: ${activeDossier.target_role || "Executive Leadership"}\n`;
    md += `**Outgoing Authority**: ${outgoingName} | **Incoming Successor**: ${incomingName}\n`;
    md += `**Date**: ${new Date(activeDossier.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}\n\n`;
    md += `---\n\n`;

    md += `## Executive Summary\n\n${activeDossier.content.executive_summary}\n\n`;
    md += `## Mandate Overview\n\n${activeDossier.content.mandate_overview}\n\n`;

    md += `## Day 1 to Day 30 Operational Roadmap\n\n`;
    activeDossier.content.recommended_day_1_to_30_actions.forEach((act, idx) => {
      md += `${idx + 1}. ${act}\n`;
    });
    md += `\n---\n\n`;

    md += `## Chapters\n\n`;
    activeDossier.content.chapters.forEach((ch, idx) => {
      md += `### Chapter ${idx + 1}: ${ch.title} (${ch.chapter_id.toUpperCase()})\n\n`;
      md += `> ${ch.summary}\n\n`;

      if (ch.action_items && ch.action_items.length > 0) {
        md += `#### Chapter Directives & Transition Mandates\n\n`;
        ch.action_items.forEach((item, aIdx) => {
          md += `- [ACTION-${aIdx + 1}] ${item}\n`;
        });
        md += `\n`;
      }

      if (ch.facts && ch.facts.length > 0) {
        md += `#### Ratified Claims & Evidence Anchors\n\n`;
        ch.facts.forEach((f) => {
          md += `- **[${f.category.toUpperCase()}]** (${f.verification_status}): ${f.statement}\n`;
          if (f.citations && f.citations.length > 0) {
            f.citations.forEach((c) => {
              md += `  > Quotation (${c.source_location}): "${c.verbatim_quote}"\n`;
            });
          }
        });
        md += `\n`;
      }
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Relay-Handover-v${activeDossier.version}-${activeDossier.id.slice(0, 8)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setExportNotice("Full Markdown Handover Dossier exported to local disk.");
    setTimeout(() => setExportNotice(null), 4000);
  };

  // Find currently active chapter
  const currentChapter =
    activeDossier?.content.chapters.find((c) => c.chapter_id === activeChapter) ||
    activeDossier?.content.chapters[0];

  const outgoingDisplayName =
    activeDossier?.outgoing_leader?.name || outgoingLeaderName || "Marcus Vance";
  const incomingDisplayName =
    activeDossier?.incoming_leader?.name || incomingLeaderName || "Incoming Successor";

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans pb-16">
      {/* Top Action Bar */}
      <ScrollReveal variant="industrial">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-carbon pb-4">
          <div>
            <span className="font-mono text-[10px] uppercase font-bold text-signal-orange block mb-0.5">
              MASTER DELIVERABLE • CONTINUITY DOSSIER
            </span>
            <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-carbon">
              Executive Handover Dossier
            </h1>
            <p className="font-mono text-xs text-carbon/70 uppercase mt-0.5">
              {activeDossier
                ? `DELIVERABLE #DOS-v${activeDossier.version} • ${activeDossier.id.slice(0, 8)} • ${activeDossier.content.chapters.length} CHAPTERS GROUNDED`
                : "MULTI-CHAPTER BRIEFING BOOK GROUNDED IN PRIMARY EVIDENCE"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            {/* Dossier Version Selector */}
            {dossiers.length > 0 && (
              <div className="relative">
                <select
                  aria-label="Select Compiled Dossier"
                  value={activeDossier?.id || ""}
                  onChange={(e) => {
                    const sel = dossiers.find((d) => d.id === e.target.value);
                    if (sel) {
                      setActiveDossier(sel);
                      setActiveChapter(sel.content.chapters[0]?.chapter_id || "ch1");
                    }
                  }}
                  className="p-1.5 border-2 border-carbon bg-raw-paper font-mono text-xs uppercase font-bold text-carbon focus:outline-none cursor-pointer"
                >
                  {dossiers.map((d) => (
                    <option key={d.id} value={d.id}>
                      v{d.version} ({new Date(d.created_at).toLocaleDateString()}): {d.title.slice(0, 28)}...
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              magnetic={true}
              data-cursor="COMPILE"
              onClick={() => setShowConfigModal(true)}
              disabled={isCompiling}
            >
              <span>{isCompiling ? "Compiling..." : "Compile New"}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              magnetic={true}
              onClick={() => window.print()}
            >
              <span>Print</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              magnetic={true}
              data-cursor="EXPORT"
              onClick={handleExportMarkdown}
              disabled={!activeDossier}
            >
              <span>Markdown</span>
            </Button>

            <Button
              variant="signal"
              size="sm"
              magnetic={true}
              data-cursor="EXPORT"
              onClick={handleExportJSON}
              disabled={!activeDossier}
            >
              <span>JSON</span>
            </Button>
          </div>
        </div>
      </ScrollReveal>

      {exportNotice && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="p-3 bg-industrial-green text-raw-paper font-mono text-xs border border-carbon flex items-center justify-between shadow-brutal"
        >
          <span className="font-bold">✓ {exportNotice}</span>
          <button onClick={() => setExportNotice(null)} className="underline uppercase text-xs font-bold">
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Compile Config Modal */}
      <AnimatePresence>
        {showConfigModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            className="p-6 bg-raw-paper-light border-2 border-carbon shadow-brutal-lg space-y-4"
          >
            <div className="flex items-center justify-between border-b-2 border-carbon pb-2.5">
              <div>
                <span className="font-mono text-xs font-bold text-signal-orange uppercase">
                  COMPILATION PARAMETERS
                </span>
                <h3 className="font-display font-black text-lg uppercase text-carbon mt-0.5">
                  Synthesize Dedicated Transition Dossier
                </h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-carbon hover:text-signal-orange font-mono text-xs font-bold uppercase"
              >
                [Close]
              </button>
            </div>

            <form onSubmit={handleCompileDossier} className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-carbon font-bold uppercase mb-1">
                    Briefing Book Title:
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2 border-2 border-carbon bg-raw-paper font-sans text-xs text-carbon focus:outline-none"
                    placeholder="e.g. Executive Briefing Book"
                  />
                </div>

                <div>
                  <label className="block text-carbon font-bold uppercase mb-1">
                    Target Executive Role:
                  </label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full p-2 border-2 border-carbon bg-raw-paper font-sans text-xs text-carbon focus:outline-none"
                    placeholder="e.g. Engineering Leadership"
                  />
                </div>

                <div>
                  <label className="block text-carbon font-bold uppercase mb-1">
                    Outgoing Authority Name:
                  </label>
                  <input
                    type="text"
                    value={outgoingLeaderName}
                    onChange={(e) => setOutgoingLeaderName(e.target.value)}
                    className="w-full p-2 border-2 border-carbon bg-raw-paper font-sans text-xs text-carbon focus:outline-none"
                    placeholder="e.g. Marcus Vance"
                  />
                </div>

                <div>
                  <label className="block text-carbon font-bold uppercase mb-1">
                    Incoming Successor Name:
                  </label>
                  <input
                    type="text"
                    value={incomingLeaderName}
                    onChange={(e) => setIncomingLeaderName(e.target.value)}
                    className="w-full p-2 border-2 border-carbon bg-raw-paper font-sans text-xs text-carbon focus:outline-none"
                    placeholder="e.g. Elena Rostova or Successor"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                >
                  <span>Cancel</span>
                </Button>
                <Button
                  variant="signal"
                  size="sm"
                  type="submit"
                  magnetic={true}
                  disabled={isCompiling}
                >
                  <span>{isCompiling ? "Compiling..." : "Generate 9-Chapter Dossier"}</span>
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Document Plate */}
      <article className="border-2 border-carbon bg-raw-paper shadow-brutal-lg overflow-hidden relative">
        {/* Dynamic Reading Progress Bar */}
        <ScrollProgress className="sticky top-0 z-20" />

        {/* Document Binder Cover Header */}
        <div className="p-6 sm:p-8 border-b-2 border-carbon bg-carbon text-raw-paper space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono border-b border-raw-paper/20 pb-3">
            <span className="text-signal-orange font-bold uppercase tracking-wider text-[11px]">
              INSTITUTIONAL CONTINUITY DOSSIER • MASTER ARCHIVE
            </span>
            <div className="flex flex-wrap items-center gap-3 text-raw-paper/70 uppercase text-[11px]">
              <span>STATUS: {activeDossier ? activeDossier.status.toUpperCase() : "READY"}</span>
              <span>•</span>
              <span>VERSION: {activeDossier ? `v${activeDossier.version}` : "v1.0"}</span>
              <span>•</span>
              <span>
                COMPILED:{" "}
                {activeDossier
                  ? new Date(activeDossier.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "NOVEMBER 2026"}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="font-display font-black text-xl sm:text-2xl uppercase tracking-tight text-raw-paper leading-snug">
              {activeDossier?.title || "Executive Briefing Book: Engineering Leadership Transition"}
            </h2>
            <p className="font-sans text-xs sm:text-sm text-raw-paper/85 leading-relaxed max-w-3xl">
              {activeDossier?.content.executive_summary ||
                "Preserved organizational decisions, operational obligations, active project roadmaps, and resolved institutional matters for incoming leadership."}
            </p>
          </div>

          {/* Signatory Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs font-mono">
            <div className="p-3 bg-carbon-surface border border-raw-paper/20 space-y-1 hover:border-raw-paper/40 transition-colors">
              <span className="text-[10px] text-raw-paper/60 uppercase font-bold block">
                OUTGOING AUTHORITY:
              </span>
              <span className="font-bold text-raw-paper text-xs block">{outgoingDisplayName}</span>
              <span className="text-industrial-green-light text-[10px] block">✓ Verified Primary Signatory</span>
            </div>

            <div className="p-3 bg-carbon-surface border border-raw-paper/20 space-y-1 hover:border-raw-paper/40 transition-colors">
              <span className="text-[10px] text-raw-paper/60 uppercase font-bold block">
                INCOMING SUCCESSOR:
              </span>
              <span className="font-bold text-raw-paper text-xs block">{incomingDisplayName}</span>
              <span className="text-signal-yellow text-[10px] block">⏳ Counter-signature In Progress</span>
            </div>

            <div className="p-3 bg-carbon-surface border border-raw-paper/20 space-y-1 hover:border-raw-paper/40 transition-colors">
              <span className="text-[10px] text-raw-paper/60 uppercase font-bold block">
                GOVERNANCE PLATFORM:
              </span>
              <span className="font-bold text-raw-paper text-xs block">Relay Continuity Console</span>
              <span className="text-signal-orange text-[10px] block">✓ Two-Phase Review Active</span>
            </div>
          </div>
        </div>

        {/* Mandate Overview Banner */}
        {activeDossier?.content.mandate_overview && (
          <ScrollReveal variant="editorial">
            <div className="p-4 sm:p-5 bg-raw-paper-light border-b-2 border-carbon font-mono text-xs space-y-1">
              <span className="font-bold text-signal-orange uppercase block text-[11px]">
                EXECUTIVE MANDATE &amp; GOVERNANCE SCOPE
              </span>
              <p className="font-sans text-xs sm:text-sm text-carbon leading-relaxed">
                {activeDossier.content.mandate_overview}
              </p>
            </div>
          </ScrollReveal>
        )}

        {/* Dynamic Chapter Navigation Bar with Animated Sliding Indicator */}
        <LayoutGroup id="chapterTabsLayoutGroup">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-9 border-b-2 border-carbon bg-raw-paper-light divide-x-2 divide-carbon font-mono text-[11px] relative">
            {(activeDossier?.content.chapters || [
              { chapter_id: "ch1" },
              { chapter_id: "ch2" },
              { chapter_id: "ch3" },
              { chapter_id: "ch4" },
              { chapter_id: "ch5" },
              { chapter_id: "ch6" },
              { chapter_id: "ch7" },
              { chapter_id: "ch8" },
              { chapter_id: "ch9" },
            ]).map((tab) => {
              const chId = tab.chapter_id;
              const label = CHAPTER_LABELS[chId] || chId.toUpperCase();
              const isActive = activeChapter === chId;

              return (
                <button
                  key={chId}
                  onClick={() => setActiveChapter(chId)}
                  data-cursor="TAB"
                  className={`relative p-2.5 text-center font-bold uppercase select-none transition-colors truncate ${
                    isActive
                      ? "text-raw-paper bg-carbon"
                      : "hover:bg-concrete/60 text-carbon"
                  }`}
                  title={label}
                >
                  {/* Sliding active tab plate */}
                  {isActive && (
                    <motion.div
                      layoutId="activeChapterTabIndicator"
                      className="absolute inset-0 bg-carbon z-0 shadow-brutal"
                      transition={{ type: "spring", stiffness: 480, damping: 36, mass: 0.5 }}
                    />
                  )}
                  {/* Bottom orange accent bar */}
                  {isActive && (
                    <motion.div
                      layoutId="activeChapterTabAccent"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-signal-orange z-10"
                      transition={{ type: "spring", stiffness: 480, damping: 36, mass: 0.5 }}
                    />
                  )}
                  <span className="relative z-10">{label}</span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>

        {/* Chapter Content Plate */}
        <div className="p-6 sm:p-8 space-y-6 min-h-[380px]">
          {currentChapter ? (
            <motion.div
              key={currentChapter.chapter_id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              {/* Chapter Title & Synthesis */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs uppercase px-2 py-0.5 bg-signal-orange text-raw-paper font-bold">
                    {currentChapter.chapter_id.toUpperCase()}
                  </span>
                  <h3 className="font-display font-black text-lg sm:text-xl uppercase text-carbon">
                    {currentChapter.title}
                  </h3>
                </div>
                <p className="font-sans text-xs sm:text-sm text-carbon/90 leading-relaxed bg-raw-paper-light p-4 border border-carbon shadow-brutal">
                  {currentChapter.summary}
                </p>
              </div>

              {/* Recommended Chapter Action Directives */}
              {currentChapter.action_items && currentChapter.action_items.length > 0 && (
                <div className="p-4 bg-concrete/30 border-2 border-carbon space-y-2.5 font-mono text-xs shadow-brutal">
                  <span className="font-bold text-carbon uppercase block text-[11px]">
                    CHAPTER ACTION DIRECTIVES &amp; TRANSITION MANDATES
                  </span>
                  <ul className="space-y-1.5 list-disc list-inside font-sans text-xs text-carbon/90">
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

              {/* Verified Facts & Claims */}
              {currentChapter.facts && currentChapter.facts.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b-2 border-carbon pb-2">
                    <span className="font-mono text-xs uppercase font-bold text-carbon">
                      RATIFIED CLAIMS &amp; EVIDENCE ANCHORS ({currentChapter.facts.length})
                    </span>
                    <span className="font-mono text-[10px] text-carbon/60 uppercase">
                      100% PROVENANCE TRACEABLE
                    </span>
                  </div>

                  <div className="space-y-3">
                    {currentChapter.facts.map((fact) => (
                      <div
                        key={fact.id}
                        className="p-3.5 border-2 border-carbon bg-raw-paper-light space-y-2 shadow-brutal"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[10px] px-1.5 py-0.5 bg-carbon text-raw-paper font-bold uppercase">
                            {fact.category}
                          </span>
                          <span className="font-mono text-[10px] text-industrial-green font-bold uppercase">
                            ✓ {fact.verification_status}
                          </span>
                        </div>

                        <p className="font-sans text-xs sm:text-sm text-carbon leading-relaxed">
                          {fact.statement}
                        </p>

                        {fact.citations && fact.citations.length > 0 && (
                          <div className="space-y-1.5 pt-1.5 border-t border-carbon/20 font-mono text-xs">
                            <span className="text-carbon/60 uppercase font-bold text-[10px] block">
                              VERBATIM QUOTATION:
                            </span>
                            {fact.citations.map((c, cIdx) => (
                              <blockquote
                                key={cIdx}
                                className="p-2.5 bg-raw-paper border-l-4 border-signal-orange text-xs text-carbon/90 italic leading-relaxed"
                              >
                                &ldquo;{c.verbatim_quote}&rdquo;
                                <span className="block text-carbon/60 text-[10px] not-italic mt-0.5">
                                  — Source: {c.document_filename || "Archive Record"} ({c.source_location})
                                </span>
                              </blockquote>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="p-10 text-center font-mono text-xs text-carbon/60">
              Select a chapter above to inspect the briefing content.
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
