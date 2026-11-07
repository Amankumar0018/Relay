"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface TopologyNode {
  id: string;
  code: string;
  title: string;
  subtitle?: string;
  tier: "ARCHIVES" | "STEWARDS" | "ASSETS" | "ANOMALIES";
  variant: "default" | "orange" | "dark" | "pill";
  evidence?: {
    charStart: number;
    charEnd: number;
    source: string;
    quote: string;
  };
}

interface ContinuityTopologyRadarProps {
  activeStage?: string;
  onNodeSelect?: (nodeId: string) => void;
}

export const ContinuityTopologyRadar: React.FC<ContinuityTopologyRadarProps> = ({
  activeStage,
  onNodeSelect,
}) => {
  const [selectedNode, setSelectedNode] = useState<string | null>("GAP-02");
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const activeNodeId = hoveredNode || selectedNode;

  // Evidence data matching verified Relay SQLite database records
  const evidenceDetails: Record<string, { title: string; type: string; quote: string; coords: string; doc: string }> = {
    "DOC-01": {
      title: "Project Odyssey Launch Plan.txt",
      type: "PRIMARY ARCHIVE",
      quote: "Target production launch date is ratified for November 15, 2026 under Tier-1 SLO commitments.",
      coords: "char_start: 1420, char_end: 1515",
      doc: "DOC-01 // SHA-256: 8f4a...19e2",
    },
    "DOC-02": {
      title: "Schedule Amendment Memo.txt",
      type: "AMENDMENT ARCHIVE",
      quote: "Following load stress tests, deployment milestone is amended to December 20, 2026 pending sign-off.",
      coords: "char_start: 890, char_end: 994",
      doc: "DOC-02 // SHA-256: 3c1b...77d4",
    },
    "PER-01": {
      title: "Aman Kumar (Outgoing Lead)",
      type: "PRIMARY STEWARD",
      quote: "Relinquishing operational admin token for cluster Alpha-9 and Project Odyssey repository oversight.",
      coords: "char_start: 310, char_end: 412",
      doc: "Departure Charter 2026",
    },
    "PER-02": {
      title: "Marcus Vance (Incoming Successor)",
      type: "SUCCESSOR STEWARD",
      quote: "Confirmed recipient of 9-Chapter Executive Dossier, active RACI matrices, and Day 1-30 roadmap.",
      coords: "char_start: 540, char_end: 635",
      doc: "Succession Ledger 2026",
    },
    "AST-01": {
      title: "K8s Cluster Alpha-9",
      type: "UNASSIGNED ASSET",
      quote: "Cluster Alpha-9 hosts real-time ingest pipeline; active steward unlisted in current staffing roster.",
      coords: "char_start: 2200, char_end: 2298",
      doc: "Infrastructure Audit Q3",
    },
    "PRJ-01": {
      title: "Project Odyssey",
      type: "INITIATIVE",
      quote: "Core enterprise platform migration with conflicting rollout target dates in active charters.",
      coords: "char_start: 110, char_end: 195",
      doc: "Project Charter v2.1",
    },
    "PRJ-02": {
      title: "Project Aegis",
      type: "INITIATIVE",
      quote: "Secondary compliance framework with beta launch rescheduled to February 1, 2027.",
      coords: "char_start: 450, char_end: 530",
      doc: "Aegis Transition Memo",
    },
    "GAP-01": {
      title: "Critical Ownership Gap",
      type: "OPERATIONAL HAZARD",
      quote: "Zero registered owner for production Kubernetes cluster Alpha-9. Immediate operational liability.",
      coords: "char_start: 2240, char_end: 2298",
      doc: "Relay Discrepancy Engine",
    },
    "GAP-02": {
      title: "Launch Date Contradiction",
      type: "DIRECT CONFLICT",
      quote: "Direct Contradiction: Doc A specifies Nov 15; Doc B specifies Dec 20 following stress tests.",
      coords: "char_start: 1420, char_end: 1515 vs 890..994",
      doc: "Relay Discrepancy Engine",
    },
    "DEC-01": {
      title: "Superseded Roadmap Choice",
      type: "SUPERSEDED MATTERS",
      quote: "Beta launch postponed from Dec 15 to Feb 1, 2027. Superseded record marked to prevent hallucination.",
      coords: "char_start: 480, char_end: 575",
      doc: "Executive Decision Log",
    },
  };

  const handleNodeClick = (id: string) => {
    setSelectedNode(id);
    if (onNodeSelect) onNodeSelect(id);
  };

  return (
    <div className="relative w-full h-full bg-[#111111] text-white font-mono flex flex-col justify-between overflow-hidden select-none border-t-2 lg:border-t-0 lg:border-l-2 border-carbon">
      {/* Background Architectural Coordinate Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: "28px 28px",
        }}
      />

      {/* Subtle Concentric Radar Rings in Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-15">
        <div className="w-[360px] h-[360px] rounded-full border border-dashed border-white/40" />
        <div className="absolute w-[520px] h-[520px] rounded-full border border-white/20" />
      </div>

      {/* Top Header inside Radar Panel */}
      <div className="relative z-10 px-4 py-3 border-b border-white/15 flex items-center justify-between text-[11px] bg-[#141414]/95 backdrop-blur-sm whitespace-nowrap">
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#F15A24] animate-pulse" />
          <span className="font-bold tracking-wider uppercase text-white text-[10px] sm:text-[11px]">
            CONTINUITY TOPOLOGY RADAR
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#F15A24] tracking-widest text-[10px] sm:text-[11px]">
            [LIVE KNOWLEDGE GRAPH]
          </span>
        </div>
      </div>

      {/* Main Interactive Diagram Canvas with Dedicated Left Margin Column */}
      <div className="relative z-10 flex-1 min-h-[460px] sm:min-h-[480px] p-3 sm:p-4 flex">
        {/* Tier Vertical Guide Markers in Dedicated Left Column */}
        <div className="w-20 sm:w-24 shrink-0 flex flex-col justify-between py-4 text-[9px] text-zinc-500 font-bold tracking-widest border-r border-white/10 select-none">
          <div className="pt-2">01 // ARCHIVES</div>
          <div className="pt-8">02 // STEWARDS</div>
          <div className="pt-8">03 // ASSETS</div>
          <div className="pb-2">04 // ANOMALIES</div>
        </div>

        {/* Nodes and Connectors Area */}
        <div className="relative flex-1 flex flex-col justify-between pl-3 sm:pl-4">
          {/* SVG Connector Lines Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
              <filter id="glow-orange" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#F15A24" floodOpacity="0.8" />
              </filter>
            </defs>

            {/* DOC-01 down to PRJ-01 */}
            <line x1="28%" y1="12%" x2="52%" y2="58%" stroke="#666666" strokeWidth="1.2" />

            {/* DOC-01 down to PER-01 */}
            <line x1="28%" y1="12%" x2="28%" y2="34%" stroke="#666666" strokeWidth="1.2" />

            {/* DOC-02 down to PRJ-01 */}
            <line x1="75%" y1="12%" x2="52%" y2="58%" stroke="#888888" strokeWidth="1.2" />

            {/* DOC-02 down to PER-02 */}
            <line x1="75%" y1="12%" x2="75%" y2="34%" stroke="#888888" strokeWidth="1.2" />

            {/* DOC-02 down to PRJ-02 (dashed orange) */}
            <line
              x1="75%"
              y1="12%"
              x2="85%"
              y2="58%"
              stroke="#F15A24"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              filter="url(#glow-orange)"
            />

            {/* PER-01 to SUCCESSION to PER-02 */}
            <line x1="33%" y1="34%" x2="48%" y2="34%" stroke="#666666" strokeWidth="1.5" />
            <line x1="56%" y1="34%" x2="68%" y2="34%" stroke="#F15A24" strokeWidth="1.5" />

            {/* PER-01 to PRJ-01 */}
            <line x1="28%" y1="38%" x2="52%" y2="58%" stroke="#555555" strokeWidth="1" />

            {/* PER-02 down to PRJ-01 */}
            <line x1="75%" y1="38%" x2="52%" y2="58%" stroke="#F15A24" strokeWidth="1.2" />

            {/* AST-01 (K8s Cluster) vertical to UNASSIGNED to GAP-01 */}
            <line
              x1="18%"
              y1="64%"
              x2="18%"
              y2="83%"
              stroke="#F15A24"
              strokeWidth="2"
              filter="url(#glow-orange)"
            />

            {/* PRJ-01 (Odyssey) vertical to CONTRADICTION to GAP-02 */}
            <line
              x1="52%"
              y1="64%"
              x2="52%"
              y2="83%"
              stroke="#F15A24"
              strokeWidth="2"
              filter="url(#glow-orange)"
            />

            {/* PRJ-02 (Aegis) dashed line to DEC-01 */}
            <line
              x1="85%"
              y1="64%"
              x2="85%"
              y2="83%"
              stroke="#888888"
              strokeWidth="1.2"
              strokeDasharray="4 3"
            />
          </svg>

          {/* TIER 01: ARCHIVES */}
          <div className="relative z-10 w-full flex justify-around pr-2 pt-1">
            {/* Node: DOC-01 */}
            <motion.div
              whileHover={{ scale: 1.04 }}
              onClick={() => handleNodeClick("DOC-01")}
              className={`cursor-pointer px-3 py-1.5 bg-white text-black border-2 transition-all ${
                activeNodeId === "DOC-01"
                  ? "border-[#F15A24] ring-2 ring-[#F15A24] shadow-[0_0_12px_rgba(241,90,36,0.6)]"
                  : "border-black hover:border-[#F15A24]"
              }`}
            >
              <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider">
                [DOC-01] ARCHIVE
              </div>
              <div className="text-[11px] font-bold tracking-tight whitespace-nowrap">
                Odyssey Launch Plan
              </div>
            </motion.div>

            {/* Node: DOC-02 */}
            <motion.div
              whileHover={{ scale: 1.04 }}
              onClick={() => handleNodeClick("DOC-02")}
              className={`cursor-pointer px-3 py-1.5 bg-white text-black border-2 transition-all ${
                activeNodeId === "DOC-02"
                  ? "border-[#F15A24] ring-2 ring-[#F15A24] shadow-[0_0_12px_rgba(241,90,36,0.6)]"
                  : "border-black hover:border-[#F15A24]"
              }`}
            >
              <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider">
                [DOC-02] ARCHIVE
              </div>
              <div className="text-[11px] font-bold tracking-tight whitespace-nowrap">
                Schedule Amendment
              </div>
            </motion.div>
          </div>

          {/* TIER 02: STEWARDS */}
          <div className="relative z-10 w-full flex items-center justify-center gap-2 sm:gap-3 pr-2 my-2">
            {/* Node: PER-01 */}
            <motion.div
              whileHover={{ scale: 1.04 }}
              onClick={() => handleNodeClick("PER-01")}
              className={`cursor-pointer px-3 py-1.5 bg-white text-black border-2 transition-all ${
                activeNodeId === "PER-01"
                  ? "border-[#F15A24] ring-2 ring-[#F15A24] shadow-[0_0_12px_rgba(241,90,36,0.6)]"
                  : "border-black hover:border-[#F15A24]"
              }`}
            >
              <div className="text-[9px] text-[#F15A24] font-bold uppercase tracking-wider">
                [PER-01] OUTGOING
              </div>
              <div className="text-[11px] font-bold tracking-tight whitespace-nowrap">
                Aman Kumar
              </div>
            </motion.div>

            {/* Central Badge: SUCCESSION */}
            <div className="px-2 py-0.5 bg-white text-black text-[9px] font-black uppercase tracking-widest border border-black shadow-[1px_1px_0px_#000]">
              SUCCESSION
            </div>

            {/* Node: PER-02 (Solid Orange) */}
            <motion.div
              whileHover={{ scale: 1.04 }}
              onClick={() => handleNodeClick("PER-02")}
              className={`cursor-pointer px-3.5 py-1.5 bg-[#F15A24] text-white border-2 border-white transition-all shadow-[2px_2px_0px_#000] ${
                activeNodeId === "PER-02"
                  ? "ring-2 ring-white shadow-[0_0_16px_rgba(241,90,36,0.9)] scale-105"
                  : "hover:brightness-110"
              }`}
            >
              <div className="text-[9px] text-white/90 font-bold uppercase tracking-wider">
                [PER-02] SUCCESSOR
              </div>
              <div className="text-[11px] font-black tracking-tight whitespace-nowrap">
                Marcus Vance
              </div>
            </motion.div>
          </div>

          {/* TIER 03: ASSETS & INITIATIVES */}
          <div className="relative z-10 w-full flex items-center justify-between pr-2 my-2 gap-2">
            {/* Node: AST-01 */}
            <motion.div
              whileHover={{ scale: 1.04 }}
              onClick={() => handleNodeClick("AST-01")}
              className={`cursor-pointer px-2.5 py-1.5 bg-white text-black border-2 transition-all ${
                activeNodeId === "AST-01"
                  ? "border-[#F15A24] ring-2 ring-[#F15A24] shadow-[0_0_12px_rgba(241,90,36,0.6)]"
                  : "border-black hover:border-[#F15A24]"
              }`}
            >
              <div className="text-[8px] sm:text-[9px] text-[#F15A24] font-bold uppercase tracking-wider whitespace-nowrap">
                [AST-01] ORPHAN ASSET
              </div>
              <div className="text-[10px] sm:text-[11px] font-bold tracking-tight whitespace-nowrap">
                K8s Cluster Alpha-9
              </div>
            </motion.div>

            {/* Node: PRJ-01 */}
            <motion.div
              whileHover={{ scale: 1.04 }}
              onClick={() => handleNodeClick("PRJ-01")}
              className={`cursor-pointer px-3 py-1.5 bg-white text-black border-2 transition-all ${
                activeNodeId === "PRJ-01"
                  ? "border-[#F15A24] ring-2 ring-[#F15A24] shadow-[0_0_12px_rgba(241,90,36,0.6)]"
                  : "border-black hover:border-[#F15A24]"
              }`}
            >
              <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider">
                [PRJ-01] INITIATIVE
              </div>
              <div className="text-[10px] sm:text-[11px] font-bold tracking-tight whitespace-nowrap">
                Project Odyssey
              </div>
            </motion.div>

            {/* Node: PRJ-02 */}
            <motion.div
              whileHover={{ scale: 1.04 }}
              onClick={() => handleNodeClick("PRJ-02")}
              className={`cursor-pointer px-3 py-1.5 bg-white text-black border-2 transition-all ${
                activeNodeId === "PRJ-02"
                  ? "border-[#F15A24] ring-2 ring-[#F15A24] shadow-[0_0_12px_rgba(241,90,36,0.6)]"
                  : "border-black hover:border-[#F15A24]"
              }`}
            >
              <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider">
                [PRJ-02] INITIATIVE
              </div>
              <div className="text-[10px] sm:text-[11px] font-bold tracking-tight whitespace-nowrap">
                Project Aegis
              </div>
            </motion.div>
          </div>

          {/* INTERMEDIATE ANOMALY CONNECTOR BADGES */}
          <div className="relative z-10 w-full flex items-center justify-between pl-4 pr-6 -my-1 text-[9px] font-bold">
            {/* Pill 1 */}
            <div className="px-2 py-0.5 bg-[#F15A24] text-white border border-black shadow-[1px_1px_0px_#000]">
              UNASSIGNED
            </div>

            {/* Pill 2 */}
            <div className="px-2 py-0.5 bg-[#F15A24] text-white border border-black shadow-[1px_1px_0px_#000]">
              CONTRADICTION
            </div>

            {/* Space filler */}
            <div className="w-16" />
          </div>

          {/* TIER 04: ANOMALIES & GAPS */}
          <div className="relative z-10 w-full flex items-center justify-between pr-2 mb-3 sm:mb-4 gap-2">
            {/* Node: GAP-01 (Solid Orange) */}
            <motion.div
              whileHover={{ scale: 1.04 }}
              onClick={() => handleNodeClick("GAP-01")}
              className={`cursor-pointer px-3 py-1.5 bg-[#F15A24] text-white border-2 border-white transition-all shadow-[2px_2px_0px_#000] ${
                activeNodeId === "GAP-01"
                  ? "ring-2 ring-white shadow-[0_0_16px_rgba(241,90,36,0.9)] scale-105"
                  : "hover:brightness-110"
              }`}
            >
              <div className="text-[9px] text-white/90 font-bold uppercase tracking-wider">
                [GAP-01] CRITICAL
              </div>
              <div className="text-[10px] sm:text-[11px] font-black tracking-tight whitespace-nowrap">
                No Registered Owner
              </div>
            </motion.div>

            {/* Node: GAP-02 (Solid Orange) */}
            <motion.div
              whileHover={{ scale: 1.04 }}
              onClick={() => handleNodeClick("GAP-02")}
              className={`cursor-pointer px-3.5 py-1.5 bg-[#F15A24] text-white border-2 border-white transition-all shadow-[2px_2px_0px_#000] ${
                activeNodeId === "GAP-02"
                  ? "ring-2 ring-white shadow-[0_0_16px_rgba(241,90,36,0.9)] scale-105"
                  : "hover:brightness-110"
              }`}
            >
              <div className="text-[9px] text-white/90 font-bold uppercase tracking-wider">
                [GAP-02] CONFLICT
              </div>
              <div className="text-[10px] sm:text-[11px] font-black tracking-tight whitespace-nowrap">
                Nov 15 vs Dec 20
              </div>
            </motion.div>

            {/* Node: DEC-01 (Dark Card) */}
            <motion.div
              whileHover={{ scale: 1.04 }}
              onClick={() => handleNodeClick("DEC-01")}
              className={`cursor-pointer px-3 py-1.5 bg-[#1C1C1C] text-zinc-300 border border-zinc-600 transition-all ${
                activeNodeId === "DEC-01"
                  ? "border-[#F15A24] ring-1 ring-[#F15A24] text-white"
                  : "hover:border-zinc-400"
              }`}
            >
              <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
                [DEC-01] SUPERSEDED
              </div>
              <div className="text-[10px] sm:text-[11px] font-bold tracking-tight whitespace-nowrap">
                Feb 1 Postponement
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Interactive Evidence Citation Drawer / Pill */}
      <AnimatePresence>
        {activeNodeId && evidenceDetails[activeNodeId] && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-20 border-t border-white/20 bg-[#1A1A1A] px-4 py-2.5 text-xs"
          >
            <div className="flex items-center justify-between text-[10px] font-bold text-[#F15A24] pb-1">
              <span>{evidenceDetails[activeNodeId].type} // {evidenceDetails[activeNodeId].title}</span>
              <span className="text-zinc-400 font-mono">{evidenceDetails[activeNodeId].coords}</span>
            </div>
            <p className="text-[11px] text-zinc-300 leading-tight">
              &ldquo;{evidenceDetails[activeNodeId].quote}&rdquo;
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Sub-Bar inside Radar Panel */}
      <div className="relative z-10 px-4 py-2.5 border-t border-white/15 flex flex-wrap items-center justify-between text-[10px] bg-[#141414] text-zinc-400">
        <div>
          <span>TOPOLOGICAL ENGINE: </span>
          <span className="text-[#F15A24] font-bold">SQLITE WAL</span>
          <span> • DETERMINISTIC CITATIONS</span>
        </div>
        <div className="font-bold text-white tracking-widest text-[9px] uppercase">
          ZERO CLOUD RETENTION
        </div>
      </div>
    </div>
  );
};
