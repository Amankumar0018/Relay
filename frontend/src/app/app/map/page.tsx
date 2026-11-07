"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconNetwork,
  IconDocument,
  IconUser,
  IconTask,
  IconAlert,
  IconClose,
  IconInfo,
  IconArrowRight,
  IconCheck,
  IconSearch,
} from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { fetchContinuityOverview, ContinuityOverview } from "@/lib/api";
import Link from "next/link";

export type NodeType =
  | "person"
  | "document"
  | "responsibility"
  | "decision"
  | "gap"
  | "project"
  | "asset";

export interface MapNode {
  id: string;
  code: string;
  label: string;
  type: NodeType;
  x: number; // 0 - 100 percentage
  y: number; // 0 - 85 percentage
  summary: string;
  evidenceSource: string;
  evidenceSection: string;
  status: "verified" | "unresolved" | "in-flight";
  connectedTo: string[];
}

export interface MapEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  isUnresolved?: boolean;
}

// Canonical live institutional ground truth from SQLite database
const INITIAL_MAP_NODES: MapNode[] = [
  // --- Strata 1: Archival Source Documents (Top) ---
  {
    id: "doc-odyssey-plan",
    code: "DOC-01",
    label: "Project Odyssey Launch Plan",
    type: "document",
    x: 18,
    y: 14,
    summary: "Baseline flagship product deployment schedule specifying initial November 15, 2026 beta milestone.",
    evidenceSource: "Project Odyssey Launch Plan.txt",
    evidenceSection: "Section 2.1 (Deployment Schedule)",
    status: "verified",
    connectedTo: ["prj-odyssey", "con-odyssey-deadline"],
  },
  {
    id: "doc-odyssey-amend",
    code: "DOC-02",
    label: "Odyssey Amendment Memo",
    type: "document",
    x: 42,
    y: 14,
    summary: "Infrastructure amendment revising Odyssey roadmap following testing on Kubernetes cluster Alpha-9.",
    evidenceSource: "Project Odyssey Schedule Amendment Memo.txt",
    evidenceSection: "Section 1.4 (Infrastructure Amendments)",
    status: "verified",
    connectedTo: ["prj-odyssey", "con-odyssey-deadline", "ast-alpha9"],
  },
  {
    id: "doc-aegis-brief",
    code: "DOC-03",
    label: "Project Aegis Transition Briefing",
    type: "document",
    x: 68,
    y: 14,
    summary: "Security gateway initiative transition charter detailing initial December 15, 2026 beta launch target.",
    evidenceSource: "Project Aegis Transition Briefing.txt",
    evidenceSection: "Paragraph 3 (Gateway Scope)",
    status: "verified",
    connectedTo: ["prj-aegis", "dec-aegis-postpone"],
  },
  {
    id: "doc-nova-test",
    code: "DOC-04",
    label: "Project Nova Architecture",
    type: "document",
    x: 88,
    y: 14,
    summary: "Infrastructure resilience verification document establishing automated failover parameters.",
    evidenceSource: "Project Nova Test.txt",
    evidenceSection: "Executive Summary & Architecture",
    status: "verified",
    connectedTo: ["prj-nova", "person-priya"],
  },

  // --- Strata 2: Leadership & Stewards ---
  {
    id: "person-aman",
    code: "PER-01",
    label: "Aman Kumar (Outgoing)",
    type: "person",
    x: 18,
    y: 35,
    summary: "Outgoing Leader and system architect transferring institutional custody, infrastructure keys, and charter authority.",
    evidenceSource: "Executive_Transition_Protocol.txt",
    evidenceSection: "Signatory Authority §1.1",
    status: "verified",
    connectedTo: ["person-marcus", "ast-alpha9"],
  },
  {
    id: "person-marcus",
    code: "PER-02",
    label: "Marcus Vance (Incoming)",
    type: "person",
    x: 38,
    y: 35,
    summary: "Incoming Successor and Engineering Lead designated to assume executive authority over Project Odyssey.",
    evidenceSource: "Executive_Transition_Protocol.txt",
    evidenceSection: "Succession Mandate §2.0",
    status: "verified",
    connectedTo: ["person-aman", "prj-odyssey"],
  },
  {
    id: "person-elena",
    code: "PER-03",
    label: "Elena Rostova (Odyssey)",
    type: "person",
    x: 55,
    y: 35,
    summary: "Product Steward and core contributor for Project Odyssey lifecycle execution and release delivery.",
    evidenceSource: "Project Odyssey Launch Plan.txt",
    evidenceSection: "Stewardship Ledger",
    status: "verified",
    connectedTo: ["prj-odyssey"],
  },
  {
    id: "person-thorne",
    code: "PER-04",
    label: "Dr. Aris Thorne (Aegis)",
    type: "person",
    x: 72,
    y: 35,
    summary: "Lead Steward for Project Aegis enterprise security gateway architecture and compliance filings.",
    evidenceSource: "Project Aegis Transition Briefing.txt",
    evidenceSection: "Engineering Roster",
    status: "verified",
    connectedTo: ["prj-aegis"],
  },
  {
    id: "person-priya",
    code: "PER-05",
    label: "Priya Sharma (Nova)",
    type: "person",
    x: 88,
    y: 35,
    summary: "Infrastructure Lead for Project Nova resilience testing and telemetry pipelines.",
    evidenceSource: "Project Nova Test.txt",
    evidenceSection: "Team Roster",
    status: "verified",
    connectedTo: ["prj-nova", "doc-nova-test"],
  },

  // --- Strata 3: Institutional Projects & Assets ---
  {
    id: "ast-alpha9",
    code: "AST-01",
    label: "Kubernetes cluster Alpha-9",
    type: "asset",
    x: 18,
    y: 56,
    summary: "Mission-critical container orchestration cluster running production workloads. Currently lacks designated owner.",
    evidenceSource: "Project Odyssey Schedule Amendment Memo.txt",
    evidenceSection: "Infrastructure Inventory",
    status: "unresolved",
    connectedTo: ["gap-alpha9-owner", "doc-odyssey-amend", "person-aman"],
  },
  {
    id: "prj-odyssey",
    code: "PRJ-01",
    label: "Project Odyssey",
    type: "project",
    x: 42,
    y: 56,
    summary: "Flagship organizational initiative with 7 tracked dependencies and active deadline contradiction.",
    evidenceSource: "Project Odyssey Launch Plan.txt",
    evidenceSection: "Charter Header",
    status: "in-flight",
    connectedTo: ["person-marcus", "person-elena", "con-odyssey-deadline", "doc-odyssey-plan", "doc-odyssey-amend"],
  },
  {
    id: "prj-aegis",
    code: "PRJ-02",
    label: "Project Aegis",
    type: "project",
    x: 68,
    y: 56,
    summary: "Enterprise security gateway initiative subject to schedule postponement following vendor integration delays.",
    evidenceSource: "Project Aegis Transition Briefing.txt",
    evidenceSection: "Project Scope",
    status: "in-flight",
    connectedTo: ["person-thorne", "dec-aegis-postpone", "doc-aegis-brief"],
  },
  {
    id: "prj-nova",
    code: "PRJ-03",
    label: "Project Nova",
    type: "project",
    x: 88,
    y: 56,
    summary: "Automated reliability framework maintaining continuous uptime SLA for distributed backend services.",
    evidenceSource: "Project Nova Test.txt",
    evidenceSection: "Charter §1",
    status: "verified",
    connectedTo: ["person-priya", "doc-nova-test"],
  },

  // --- Strata 4: Gaps, Contradictions & Decisions (Bottom) ---
  {
    id: "gap-alpha9-owner",
    code: "GAP-01",
    label: "Ownership Gap: Alpha-9",
    type: "gap",
    x: 18,
    y: 75,
    summary: "Kubernetes cluster Alpha-9 has no registered owner or lead steward in deposited documentation.",
    evidenceSource: "Contradiction Engine Audit",
    evidenceSection: "Conflict #a396bb97",
    status: "unresolved",
    connectedTo: ["ast-alpha9"],
  },
  {
    id: "con-odyssey-deadline",
    code: "GAP-02",
    label: "Contradiction: Odyssey Beta",
    type: "gap",
    x: 42,
    y: 75,
    summary: "Mutually inconsistent statements: Nov 15, 2026 vs Dec 20, 2026 beta launch dates.",
    evidenceSource: "Project Odyssey Launch Plan vs Amendment Memo",
    evidenceSection: "Conflict #f11b799f",
    status: "unresolved",
    connectedTo: ["prj-odyssey", "doc-odyssey-plan", "doc-odyssey-amend"],
  },
  {
    id: "dec-aegis-postpone",
    code: "DEC-01",
    label: "Postponement: Aegis Beta",
    type: "decision",
    x: 68,
    y: 75,
    summary: "Superseded decision: Aegis Beta Launch officially postponed from Dec 15, 2026 to Feb 1, 2027.",
    evidenceSource: "Project Aegis Schedule Postponement.txt",
    evidenceSection: "Conflict #60d7ae5f",
    status: "in-flight",
    connectedTo: ["prj-aegis", "doc-aegis-brief"],
  },
];

const INITIAL_MAP_EDGES: MapEdge[] = [
  { id: "e1", source: "person-aman", target: "person-marcus", label: "Succession Line" },
  { id: "e2", source: "person-marcus", target: "prj-odyssey", label: "Successor Lead" },
  { id: "e3", source: "person-elena", target: "prj-odyssey", label: "Product Lead" },
  { id: "e4", source: "person-thorne", target: "prj-aegis", label: "Security Lead" },
  { id: "e5", source: "person-priya", target: "prj-nova", label: "Infra Lead" },
  { id: "e6", source: "doc-odyssey-plan", target: "prj-odyssey", label: "Initial Charter" },
  { id: "e7", source: "doc-odyssey-amend", target: "prj-odyssey", label: "Amendment Memo" },
  { id: "e8", source: "doc-aegis-brief", target: "prj-aegis", label: "Security Brief" },
  { id: "e9", source: "doc-nova-test", target: "prj-nova", label: "Spec Archive" },
  { id: "e10", source: "ast-alpha9", target: "gap-alpha9-owner", label: "Unassigned Asset", isUnresolved: true },
  { id: "e11", source: "prj-odyssey", target: "con-odyssey-deadline", label: "Date Discrepancy", isUnresolved: true },
  { id: "e12", source: "prj-aegis", target: "dec-aegis-postpone", label: "Superseded Date", isUnresolved: true },
  { id: "e13", source: "doc-odyssey-amend", target: "ast-alpha9", label: "References Cluster" },
];

export default function ContinuityMapPage() {
  const [nodes, setNodes] = useState<MapNode[]>(INITIAL_MAP_NODES);
  const [edges, setEdges] = useState<MapEdge[]>(INITIAL_MAP_EDGES);
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(INITIAL_MAP_NODES[6]); // Marcus Vance
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"RADAR" | "LEDGER">("RADAR");

  // Canvas Zoom and Pan states
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Live telemetry summary
  const [backendOverview, setBackendOverview] = useState<ContinuityOverview | null>(null);

  useEffect(() => {
    fetchContinuityOverview()
      .then((data) => {
        setBackendOverview(data);
      })
      .catch((err) => {
        console.warn("Continuity overview fetch fallback:", err);
      });
  }, []);

  // Compute set of connected node IDs for the selected node (Highlighting & Subduing)
  const connectedNodeIds = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    const ids = new Set<string>([selectedNode.id]);
    edges.forEach((edge) => {
      if (edge.source === selectedNode.id) ids.add(edge.target);
      if (edge.target === selectedNode.id) ids.add(edge.source);
    });
    return ids;
  }, [selectedNode, edges]);

  // Filtering nodes by Category and Search
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      const matchesFilter =
        activeFilter === "ALL" ||
        (activeFilter === "PERSON" && node.type === "person") ||
        (activeFilter === "DOCUMENT" && node.type === "document") ||
        (activeFilter === "PROJECT" && (node.type === "project" || node.type === "asset")) ||
        (activeFilter === "GAP" && node.type === "gap") ||
        (activeFilter === "DECISION" && node.type === "decision");

      const matchesSearch =
        !searchQuery ||
        node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.summary.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [nodes, activeFilter, searchQuery]);

  // Zoom handlers
  const handleZoomIn = () => setZoom((z) => Math.min(2.0, Number((z + 0.15).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.75, Number((z - 0.15).toFixed(2))));
  const handleResetZoom = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  // Pan event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (viewMode !== "RADAR") return;
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - startPan.x,
      y: e.clientY - startPan.y,
    });
  };

  const handleMouseUp = () => setIsPanning(false);

  return (
    <div className="space-y-5 font-sans">
      {/* Header */}
      <ScrollReveal variant="industrial">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-carbon pb-4">
          <div>
            <span className="font-mono text-[10px] uppercase font-bold text-signal-orange block mb-0.5">
              TOPOLOGY MODULE // CONTINUITY RADAR
            </span>
            <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-carbon">
              Continuity Topology &amp; Entity Graph
            </h1>
            <p className="font-mono text-xs text-carbon/70 uppercase mt-0.5">
              INTER-DOCUMENT DEPENDENCIES • DELEGATED OBLIGATIONS • CRITICAL ANOMALIES
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            {/* View Mode Toggle Pill */}
            <div className="border-2 border-carbon bg-raw-paper p-0.5 flex items-center">
              <button
                onClick={() => setViewMode("RADAR")}
                className={`px-3 py-1 text-xs uppercase font-bold transition-all ${
                  viewMode === "RADAR"
                    ? "bg-carbon text-raw-paper shadow-brutal"
                    : "text-carbon/70 hover:text-carbon"
                }`}
              >
                Topology Radar
              </button>
              <button
                onClick={() => setViewMode("LEDGER")}
                className={`px-3 py-1 text-xs uppercase font-bold transition-all ${
                  viewMode === "LEDGER"
                    ? "bg-carbon text-raw-paper shadow-brutal"
                    : "text-carbon/70 hover:text-carbon"
                }`}
              >
                Entity Ledger
              </button>
            </div>

            <span className="px-2.5 py-1 bg-carbon text-raw-paper font-bold uppercase shadow-brutal hidden sm:inline">
              NODES: {nodes.length}
            </span>
            <span className="px-2.5 py-1 bg-signal-orange text-raw-paper font-bold uppercase shadow-brutal hidden sm:inline">
              EDGES: {edges.length}
            </span>
          </div>
        </div>
      </ScrollReveal>

      {/* Filter and Search Bar */}
      <ScrollReveal variant="editorial" delay={0.05}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-2 border-carbon bg-raw-paper-light p-2.5 font-mono text-xs shadow-brutal">
          <div className="flex flex-wrap items-center gap-1.5">
            {["ALL", "PERSON", "PROJECT", "DOCUMENT", "GAP", "DECISION"].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                data-cursor="FILTER"
                className={`px-2.5 py-1 uppercase font-bold border transition-all ${
                  activeFilter === f
                    ? "bg-carbon text-raw-paper border-carbon shadow-brutal"
                    : "bg-raw-paper text-carbon border-carbon/40 hover:border-carbon hover:bg-concrete/40"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="Search entities or relations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-2.5 py-1 text-xs font-mono bg-raw-paper border border-carbon text-carbon focus:outline-none focus:border-signal-orange"
              />
              <IconSearch size={12} className="absolute left-2 top-2 text-carbon/50" />
            </div>

            {selectedNode && (
              <button
                onClick={() => setSelectedNode(null)}
                className="px-2 py-1 text-[10px] font-mono uppercase bg-concrete border border-carbon text-carbon hover:bg-carbon hover:text-raw-paper transition-colors"
                title="Clear selected focus"
              >
                Clear Focus
              </button>
            )}
          </div>
        </div>
      </ScrollReveal>

      {/* MAIN VIEW: RADAR VS LEDGER */}
      {viewMode === "RADAR" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left: Cinematic Radar Canvas (8 cols) */}
          <div className="lg:col-span-8 border-2 border-carbon bg-raw-paper shadow-brutal overflow-hidden relative">
            <div className="p-3 border-b-2 border-carbon bg-carbon text-raw-paper flex items-center justify-between font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-signal-orange animate-pulse" />
                <span className="font-bold uppercase tracking-wider text-raw-paper text-xs">
                  TOPOLOGY RADAR // LIVE PROVENANCE
                </span>
                {backendOverview && (
                  <span className="text-industrial-green-light text-[10px] ml-2">
                    [DB: {backendOverview.total_entities_indexed} ENTITIES • {backendOverview.active_conflicts_count} FLAGGED]
                  </span>
                )}
              </div>

              {/* Zoom & Pan Toolbar */}
              <div className="flex items-center gap-1 font-mono text-xs">
                <button
                  onClick={handleZoomOut}
                  className="px-2 py-0.5 bg-carbon-surface border border-raw-paper/30 hover:border-signal-orange text-raw-paper font-bold"
                  title="Zoom Out"
                >
                  -
                </button>
                <span className="px-1.5 text-[10px] text-raw-paper/80 font-bold min-w-10 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="px-2 py-0.5 bg-carbon-surface border border-raw-paper/30 hover:border-signal-orange text-raw-paper font-bold"
                  title="Zoom In"
                >
                  +
                </button>
                <button
                  onClick={handleResetZoom}
                  className="px-2 py-0.5 bg-carbon-surface border border-raw-paper/30 hover:border-signal-orange text-raw-paper/80 hover:text-raw-paper text-[10px] uppercase ml-1"
                  title="Reset Canvas View"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Interactive SVG Canvas */}
            <div
              className={`relative bg-raw-paper p-3 overflow-hidden select-none ${
                isPanning ? "cursor-grabbing" : "cursor-grab"
              }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <svg
                ref={svgRef}
                viewBox="0 0 100 85"
                className="w-full h-auto select-none transition-transform duration-75"
                style={{
                  maxHeight: "520px",
                  transform: `translate(${pan.x * 0.1}px, ${pan.y * 0.1}px) scale(${zoom})`,
                  transformOrigin: "center center",
                }}
              >
                {/* Radar Grid Pattern */}
                <defs>
                  <pattern id="radarGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#D5CEBD" strokeWidth="0.4" strokeOpacity="0.5" />
                  </pattern>
                </defs>
                <rect width="100" height="85" fill="url(#radarGrid)" />

                {/* Range Concentric Rings */}
                <circle cx="50" cy="42" r="36" fill="none" stroke="#171717" strokeWidth="0.3" strokeDasharray="1 3" strokeOpacity="0.2" />
                <circle cx="50" cy="42" r="22" fill="none" stroke="#171717" strokeWidth="0.3" strokeDasharray="1 3" strokeOpacity="0.2" />
                <circle cx="50" cy="42" r="9" fill="none" stroke="#171717" strokeWidth="0.3" strokeDasharray="1 3" strokeOpacity="0.2" />

                {/* Axis Crosshairs */}
                <line x1="50" y1="0" x2="50" y2="85" stroke="#171717" strokeWidth="0.2" strokeOpacity="0.12" />
                <line x1="0" y1="42" x2="100" y2="42" stroke="#171717" strokeWidth="0.2" strokeOpacity="0.12" />

                {/* Connecting Edges */}
                {edges.map((edge) => {
                  const src = nodes.find((n) => n.id === edge.source);
                  const tgt = nodes.find((n) => n.id === edge.target);
                  if (!src || !tgt) return null;

                  const isEdgeConnected =
                    !selectedNode ||
                    (connectedNodeIds.has(src.id) && connectedNodeIds.has(tgt.id));

                  const isEdgeUnresolved = edge.isUnresolved;
                  const midX = (src.x + tgt.x) / 2;
                  const midY = (src.y + tgt.y) / 2;

                  return (
                    <g
                      key={edge.id}
                      className="transition-opacity duration-200"
                      opacity={isEdgeConnected ? 1 : 0.15}
                    >
                      <line
                        x1={src.x}
                        y1={src.y}
                        x2={tgt.x}
                        y2={tgt.y}
                        stroke={isEdgeUnresolved ? "#F15A24" : "#171717"}
                        strokeWidth={isEdgeConnected && selectedNode ? "0.8" : isEdgeUnresolved ? "0.65" : "0.45"}
                        strokeDasharray={isEdgeUnresolved ? "1.5 1" : undefined}
                        strokeOpacity={0.85}
                      />
                      {/* Edge Label Pill */}
                      <g transform={`translate(${midX}, ${midY})`}>
                        <rect
                          x="-8"
                          y="-1.8"
                          width="16"
                          height="3.6"
                          fill="#EAE5D8"
                          stroke={isEdgeUnresolved ? "#F15A24" : "#171717"}
                          strokeWidth="0.3"
                        />
                        <text
                          x="0"
                          y="0.7"
                          textAnchor="middle"
                          fill={isEdgeUnresolved ? "#F15A24" : "#171717"}
                          fontSize="1.3"
                          fontFamily="monospace"
                          fontWeight="bold"
                          className="select-none"
                        >
                          {edge.label}
                        </text>
                      </g>
                    </g>
                  );
                })}

                {/* Map Nodes */}
                {filteredNodes.map((node) => {
                  const isSelected = selectedNode?.id === node.id;
                  const isConnected = !selectedNode || connectedNodeIds.has(node.id);
                  const isGap = node.type === "gap";

                  return (
                    <g
                      key={node.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNode(node);
                      }}
                      data-cursor="NODE"
                      className="cursor-pointer transition-all duration-200"
                      opacity={isConnected ? 1 : 0.25}
                      tabIndex={0}
                    >
                      {/* Pulsing alert halo for gap nodes */}
                      {isGap && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r="5.5"
                          fill="none"
                          stroke="#F15A24"
                          strokeWidth="0.5"
                          strokeOpacity="0.7"
                          strokeDasharray="1 1"
                        />
                      )}

                      {/* Selected Focus Halo */}
                      {isSelected && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r="5.4"
                          fill="none"
                          stroke="#F15A24"
                          strokeWidth="0.8"
                        />
                      )}

                      {/* Node Geometry */}
                      {node.type === "gap" ? (
                        <rect
                          x={node.x - 3.8}
                          y={node.y - 3.8}
                          width="7.6"
                          height="7.6"
                          fill="#F15A24"
                          stroke="#171717"
                          strokeWidth={isSelected ? "1.2" : "0.7"}
                        />
                      ) : node.type === "person" ? (
                        <rect
                          x={node.x - 3.5}
                          y={node.y - 3.5}
                          width="7"
                          height="7"
                          fill={isSelected ? "#171717" : "#F4F1E8"}
                          stroke="#171717"
                          strokeWidth={isSelected ? "1.2" : "0.7"}
                        />
                      ) : node.type === "document" ? (
                        <rect
                          x={node.x - 4.5}
                          y={node.y - 3}
                          width="9"
                          height="6"
                          fill={isSelected ? "#171717" : "#D5CEBD"}
                          stroke="#171717"
                          strokeWidth={isSelected ? "1.2" : "0.7"}
                        />
                      ) : node.type === "decision" ? (
                        <rect
                          x={node.x - 3.6}
                          y={node.y - 3.6}
                          width="7.2"
                          height="7.2"
                          fill={isSelected ? "#171717" : "#353C35"}
                          stroke="#171717"
                          strokeWidth={isSelected ? "1.2" : "0.7"}
                        />
                      ) : (
                        <rect
                          x={node.x - 3.5}
                          y={node.y - 3.5}
                          width="7"
                          height="7"
                          fill={
                            node.status === "unresolved"
                              ? "#F15A24"
                              : isSelected
                              ? "#171717"
                              : "#263238"
                          }
                          stroke="#171717"
                          strokeWidth={isSelected ? "1.2" : "0.7"}
                        />
                      )}

                      {/* Node Code Label */}
                      <text
                        x={node.x}
                        y={node.y + 0.9}
                        textAnchor="middle"
                        fill={
                          node.type === "gap" || isSelected || node.type === "decision" || node.type === "project"
                            ? "#EAE5D8"
                            : "#171717"
                        }
                        fontSize="2.0"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {node.code}
                      </text>

                      {/* Node Full Title */}
                      <text
                        x={node.x}
                        y={node.type === "document" ? node.y - 4.2 : node.y + 5.5}
                        textAnchor="middle"
                        fill={isSelected ? "#171717" : "#353C35"}
                        fontSize="1.55"
                        fontFamily="sans-serif"
                        fontWeight={isSelected ? "bold" : "600"}
                        className="select-none"
                      >
                        {node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Legend Strip */}
            <div className="p-3 border-t-2 border-carbon bg-raw-paper flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] text-carbon">
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-raw-paper border border-carbon" />
                  <span className="font-bold">PERSON</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-concrete border border-carbon" />
                  <span className="font-bold">DOCUMENT</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-[#263238] border border-carbon" />
                  <span className="font-bold">PROJECT / ASSET</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-signal-orange border border-carbon" />
                  <span className="font-bold">ANOMALY / GAP</span>
                </span>
              </div>

              <span className="text-carbon/60 font-bold">// CLICK NODE TO SUBDUE UNCONNECTED ELEMENTS</span>
            </div>
          </div>

          {/* Right: Detailed Node Inspector (4 cols) */}
          <div
            data-lenis-prevent
            className="lg:col-span-4 border-2 border-carbon bg-raw-paper p-5 space-y-4 shadow-brutal max-h-[580px] overflow-y-auto"
          >
            <AnimatePresence mode="wait">
              {selectedNode ? (
                <motion.div
                  key={selectedNode.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between border-b-2 border-carbon pb-3">
                    <span className="font-mono text-xs px-2 py-0.5 bg-carbon text-raw-paper font-bold">
                      {selectedNode.code}
                    </span>
                    <span
                      className={`font-mono text-xs uppercase font-bold ${
                        selectedNode.status === "unresolved"
                          ? "text-signal-orange"
                          : "text-industrial-green"
                      }`}
                    >
                      STATUS: {selectedNode.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="font-mono text-[10px] uppercase text-carbon/60 font-bold block">
                      NODE CLASSIFICATION: {selectedNode.type.toUpperCase()}
                    </span>
                    <h3 className="font-display font-black text-lg uppercase text-carbon leading-snug">
                      {selectedNode.label}
                    </h3>
                  </div>

                  <div className="space-y-1.5">
                    <span className="font-mono text-[10px] uppercase font-bold text-carbon/60 block">
                      TOPOLOGY PROVENANCE
                    </span>
                    <p className="text-xs text-carbon/90 font-sans leading-relaxed p-3 bg-raw-paper-light border border-carbon shadow-brutal">
                      {selectedNode.summary}
                    </p>
                  </div>

                  <div className="space-y-1.5 font-mono text-xs">
                    <span className="text-[10px] uppercase font-bold text-carbon/60 block">
                      ANCHOR EVIDENCE SOURCE
                    </span>
                    <div className="p-2.5 bg-raw-paper-light border border-carbon space-y-0.5">
                      <span className="text-signal-orange font-bold block text-xs">
                        {selectedNode.evidenceSource}
                      </span>
                      <span className="text-carbon/70 text-[11px] block">
                        Location: {selectedNode.evidenceSection}
                      </span>
                    </div>
                  </div>

                  {/* Connected Relationships Ledger */}
                  <div className="space-y-1.5 font-mono text-xs">
                    <span className="text-[10px] uppercase font-bold text-carbon/60 block">
                      TOPOLOGICAL CONNECTIONS ({connectedNodeIds.size - 1})
                    </span>
                    <div className="p-2 bg-raw-paper-light border border-carbon space-y-1 max-h-36 overflow-y-auto">
                      {edges
                        .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                        .map((edge) => {
                          const isSource = edge.source === selectedNode.id;
                          const otherId = isSource ? edge.target : edge.source;
                          const otherNode = nodes.find((n) => n.id === otherId);
                          return (
                            <div
                              key={edge.id}
                              onClick={() => otherNode && setSelectedNode(otherNode)}
                              className="p-1.5 bg-raw-paper border border-carbon/30 flex items-center justify-between cursor-pointer hover:bg-concrete transition-colors"
                            >
                              <span className="truncate text-[11px] font-bold text-carbon">
                                {otherNode?.label || otherId}
                              </span>
                              <span className="text-[9px] uppercase px-1.5 py-0.5 bg-carbon text-raw-paper ml-2 shrink-0">
                                {edge.label}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-carbon/20 space-y-2">
                    {selectedNode.type === "gap" || selectedNode.type === "decision" ? (
                      <Link href="/app/investigations" data-cursor="ACTION">
                        <Button variant="signal" size="sm" className="w-full" magnetic={true}>
                          Cross-Examine in Desk →
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/app/responsibilities" data-cursor="ACTION">
                        <Button variant="signal" size="sm" className="w-full" magnetic={true}>
                          View Responsibility Ledger →
                        </Button>
                      </Link>
                    )}
                    <Link href="/app/archive">
                      <Button variant="outline" size="sm" className="w-full" magnetic={true}>
                        View Primary Archival Record
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <div className="p-8 text-center font-mono text-xs text-carbon/60">
                  Click any node on the topology grid to inspect its provenance.
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        /* ALTERNATIVE VIEW: ACCESSIBLE ENTITY LEDGER TABLE */
        <div className="border-2 border-carbon bg-raw-paper shadow-brutal overflow-hidden">
          <div className="p-3 border-b-2 border-carbon bg-carbon text-raw-paper flex items-center justify-between font-mono text-xs">
            <span className="font-bold uppercase tracking-wider text-raw-paper text-xs">
              ENTITY &amp; RELATIONSHIP ACCESSIBLE LEDGER
            </span>
            <span className="text-raw-paper/70 uppercase text-[10px]">
              SHOWING {filteredNodes.length} OF {nodes.length} INDEXED ENTITIES
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-carbon bg-raw-paper-light text-carbon font-bold uppercase text-[10px]">
                  <th className="p-3 border-r border-carbon">CODE</th>
                  <th className="p-3 border-r border-carbon">ENTITY / LABEL</th>
                  <th className="p-3 border-r border-carbon">CATEGORY</th>
                  <th className="p-3 border-r border-carbon">STATUS</th>
                  <th className="p-3 border-r border-carbon">EVIDENCE SOURCE</th>
                  <th className="p-3 border-r border-carbon">RELATIONS</th>
                  <th className="p-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-carbon/20">
                {filteredNodes.map((node) => {
                  const isSelected = selectedNode?.id === node.id;
                  const relCount = edges.filter((e) => e.source === node.id || e.target === node.id).length;

                  return (
                    <tr
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`hover:bg-concrete/40 transition-colors cursor-pointer ${
                        isSelected ? "bg-signal-orange/10 font-bold" : ""
                      }`}
                    >
                      <td className="p-3 border-r border-carbon/20 font-bold text-signal-orange">
                        {node.code}
                      </td>
                      <td className="p-3 border-r border-carbon/20 text-carbon font-sans font-bold text-sm">
                        {node.label}
                      </td>
                      <td className="p-3 border-r border-carbon/20 uppercase text-[10px]">
                        <span className="px-1.5 py-0.5 bg-carbon text-raw-paper">
                          {node.type}
                        </span>
                      </td>
                      <td className="p-3 border-r border-carbon/20 uppercase text-[10px]">
                        <span
                          className={`font-bold ${
                            node.status === "unresolved" ? "text-signal-orange" : "text-industrial-green"
                          }`}
                        >
                          {node.status}
                        </span>
                      </td>
                      <td className="p-3 border-r border-carbon/20 text-carbon/80 truncate max-w-xs">
                        {node.evidenceSource}
                      </td>
                      <td className="p-3 border-r border-carbon/20 text-center font-bold">
                        {relCount}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNode(node);
                            setViewMode("RADAR");
                          }}
                          className="px-2 py-1 bg-carbon text-raw-paper text-[10px] font-bold uppercase hover:bg-signal-orange transition-colors"
                        >
                          Focus on Radar →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}