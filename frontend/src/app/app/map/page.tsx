"use client";

import React, { useState, useMemo } from "react";
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
} from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import Link from "next/link";

type NodeType =
  | "person"
  | "document"
  | "responsibility"
  | "decision"
  | "gap"
  | "dependency";

interface MapNode {
  id: string;
  code: string;
  label: string;
  type: NodeType;
  x: number; // 0 - 100 percentage
  y: number; // 0 - 100 percentage
  summary: string;
  evidenceSource: string;
  evidenceSection: string;
  status: "verified" | "unresolved" | "in-flight";
  connectedTo: string[];
}

interface MapEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  isUnresolved?: boolean;
}

// Optimized topological coordinates with zero line-node collisions
const DEMO_MAP_NODES: MapNode[] = [
  {
    id: "doc-cso",
    code: "DOC-01",
    label: "CSO Transition Charter v2.4",
    type: "document",
    x: 50,
    y: 12,
    summary: "Formal charter defining handover of scientific directorship, protocol authority, and regulatory signatory powers.",
    evidenceSource: "CSO_Transition_Protocol_v2.pdf",
    evidenceSection: "Section 3.1 & 4.2",
    status: "verified",
    connectedTo: ["person-vance", "person-thorne"],
  },
  {
    id: "person-vance",
    code: "PER-01",
    label: "Dr. Eleanor Vance",
    type: "person",
    x: 24,
    y: 26,
    summary: "Outgoing Chief Scientific Officer. Relinquishing trial protocol oversight and IND sponsorship on Nov 30, 2024.",
    evidenceSource: "CSO_Transition_Protocol_v2.pdf",
    evidenceSection: "Section 1.2",
    status: "verified",
    connectedTo: ["doc-cso", "resp-fda1572", "gap-nitrogen"],
  },
  {
    id: "person-thorne",
    code: "PER-02",
    label: "Dr. Marcus Thorne",
    type: "person",
    x: 76,
    y: 26,
    summary: "Incoming Head of Translational Oncology designated to assume primary oncology protocol sponsorship.",
    evidenceSource: "CSO_Transition_Protocol_v2.pdf",
    evidenceSection: "Section 3.1",
    status: "verified",
    connectedTo: ["doc-cso", "resp-fda1572"],
  },
  {
    id: "resp-fda1572",
    code: "RES-01",
    label: "FDA Form 1572 Protocol Co-Signature",
    type: "responsibility",
    x: 50,
    y: 52,
    summary: "Phase II Oncology trial sponsor re-submission deadline. Mandatory regulatory compliance instrument.",
    evidenceSource: "Regulatory_Audit_Q3_2024.pdf",
    evidenceSection: "Box 1 & 6",
    status: "in-flight",
    connectedTo: ["person-vance", "person-thorne", "dep-phase2"],
  },
  {
    id: "gap-nitrogen",
    code: "GAP-01",
    label: "Liquid Nitrogen Facility Lease Renewal",
    type: "gap",
    x: 24,
    y: 74,
    summary: "Unassigned facility lease auto-renewal ($140,000 liability) with 30-day notice window expiring before successor start.",
    evidenceSource: "Vendor_Master_Agreement_2023.docx",
    evidenceSection: "Section 8.2",
    status: "unresolved",
    connectedTo: ["person-vance"],
  },
  {
    id: "dep-phase2",
    code: "DEC-01",
    label: "Phase II Clinical Hold Contingency",
    type: "decision",
    x: 76,
    y: 74,
    summary: "Superseded protocol execution schedule pending FDA Form 1572 regulatory sign-off confirmation.",
    evidenceSource: "Executive_Committee_Minutes_Oct2024.pdf",
    evidenceSection: "Agenda 4",
    status: "in-flight",
    connectedTo: ["resp-fda1572"],
  },
];

const DEMO_MAP_EDGES: MapEdge[] = [
  { id: "e1", source: "doc-cso", target: "person-vance", label: "Governs Handover" },
  { id: "e2", source: "doc-cso", target: "person-thorne", label: "Designates Successor" },
  { id: "e3", source: "person-vance", target: "resp-fda1572", label: "Current Signatory" },
  { id: "e4", source: "person-thorne", target: "resp-fda1572", label: "Pending Assignee" },
  { id: "e5", source: "resp-fda1572", target: "dep-phase2", label: "Blocks Initiation", isUnresolved: true },
  { id: "e6", source: "person-vance", target: "gap-nitrogen", label: "Sole Signatory", isUnresolved: true },
];

export default function ContinuityMapPage() {
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(DEMO_MAP_NODES[3]);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  const filteredNodes = useMemo(() => {
    if (activeFilter === "ALL") return DEMO_MAP_NODES;
    return DEMO_MAP_NODES.filter((n) => n.type === activeFilter.toLowerCase());
  }, [activeFilter]);

  return (
    <div className="space-y-5 font-sans">
      {/* Header */}
      <ScrollReveal variant="industrial">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-carbon pb-4">
          <div>
            <span className="font-mono text-[10px] uppercase font-bold text-signal-orange block mb-0.5">
              TOPOLOGY MODULE // TELEMETRIC RADAR
            </span>
            <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-carbon">
              Continuity Topology & Entity Graph
            </h1>
            <p className="font-mono text-xs text-carbon/70 uppercase mt-0.5">
              INTER-DOCUMENT DEPENDENCIES • DELEGATED OBLIGATIONS • CRITICAL ANOMALIES
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-2.5 py-1 bg-carbon text-raw-paper font-bold uppercase shadow-brutal">
              NODES: {DEMO_MAP_NODES.length}
            </span>
            <span className="px-2.5 py-1 bg-signal-orange text-raw-paper font-bold uppercase shadow-brutal">
              RELATIONS: {DEMO_MAP_EDGES.length}
            </span>
          </div>
        </div>
      </ScrollReveal>

      {/* Filter Bar */}
      <ScrollReveal variant="editorial" delay={0.05}>
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-2 border-carbon bg-raw-paper-light p-2.5 font-mono text-xs shadow-brutal">
          <div className="flex flex-wrap items-center gap-1.5">
            {["ALL", "PERSON", "DOCUMENT", "RESPONSIBILITY", "DECISION", "GAP"].map((f) => (
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

          <span className="text-[11px] text-carbon/70 uppercase font-mono hidden sm:inline">
            COORDINATE MATRIX: 100 × 85 TELEMETRIC
          </span>
        </div>
      </ScrollReveal>

      {/* Main Map Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Cinematic Radar Canvas (8 cols) */}
        <div className="lg:col-span-8 border-2 border-carbon bg-raw-paper shadow-brutal overflow-hidden relative">
          <div className="p-3 border-b-2 border-carbon bg-carbon text-raw-paper flex items-center justify-between font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-signal-orange animate-pulse" />
              <span className="font-bold uppercase tracking-wider text-raw-paper text-xs">
                TOPOLOGY RADAR // LIVE PROVENANCE
              </span>
            </div>
            <span className="text-raw-paper/60 uppercase text-[10px]">
              CLICK NODE TO INSPECT
            </span>
          </div>

          {/* Radar Canvas with Ambient Grid */}
          <div className="relative bg-raw-paper p-3">
            <svg
              viewBox="0 0 100 85"
              className="w-full h-auto select-none"
              style={{ maxHeight: "490px" }}
            >
              {/* Radar Pattern & Range Circles */}
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

              {/* Crosshair Center */}
              <line x1="50" y1="0" x2="50" y2="85" stroke="#171717" strokeWidth="0.2" strokeOpacity="0.12" />
              <line x1="0" y1="42" x2="100" y2="42" stroke="#171717" strokeWidth="0.2" strokeOpacity="0.12" />

              {/* Connecting Edges */}
              {DEMO_MAP_EDGES.map((edge) => {
                const src = DEMO_MAP_NODES.find((n) => n.id === edge.source);
                const tgt = DEMO_MAP_NODES.find((n) => n.id === edge.target);
                if (!src || !tgt) return null;

                const isEdgeUnresolved = edge.isUnresolved;
                const midX = (src.x + tgt.x) / 2;
                const midY = (src.y + tgt.y) / 2;

                return (
                  <g key={edge.id} className="transition-opacity duration-200">
                    <line
                      x1={src.x}
                      y1={src.y}
                      x2={tgt.x}
                      y2={tgt.y}
                      stroke={isEdgeUnresolved ? "#F15A24" : "#171717"}
                      strokeWidth={isEdgeUnresolved ? "0.7" : "0.45"}
                      strokeDasharray={isEdgeUnresolved ? "1.5 1" : undefined}
                      strokeOpacity={0.8}
                    />
                    {/* Edge Label Pill */}
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect
                        x="-7.5"
                        y="-1.8"
                        width="15"
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
                        fontSize="1.4"
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
                const isGap = node.type === "gap";

                return (
                  <g
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    data-cursor="NODE"
                    className="cursor-pointer transition-transform hover:scale-105"
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
                        strokeOpacity="0.6"
                        strokeDasharray="1 1"
                      />
                    )}

                    {/* Selected Halo */}
                    {isSelected && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="5.2"
                        fill="none"
                        stroke="#171717"
                        strokeWidth="0.7"
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
                        strokeWidth={isSelected ? "1.1" : "0.7"}
                      />
                    ) : node.type === "person" ? (
                      <rect
                        x={node.x - 3.5}
                        y={node.y - 3.5}
                        width="7"
                        height="7"
                        fill={isSelected ? "#171717" : "#F4F1E8"}
                        stroke="#171717"
                        strokeWidth={isSelected ? "1.1" : "0.7"}
                      />
                    ) : node.type === "document" ? (
                      <rect
                        x={node.x - 4.5}
                        y={node.y - 3}
                        width="9"
                        height="6"
                        fill={isSelected ? "#171717" : "#D5CEBD"}
                        stroke="#171717"
                        strokeWidth={isSelected ? "1.1" : "0.7"}
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
                            : "#353C35"
                        }
                        stroke="#171717"
                        strokeWidth={isSelected ? "1.1" : "0.7"}
                      />
                    )}

                    {/* Node Code Label */}
                    <text
                      x={node.x}
                      y={node.y + 0.9}
                      textAnchor="middle"
                      fill={
                        node.type === "gap" || isSelected || node.type === "responsibility"
                          ? "#EAE5D8"
                          : "#171717"
                      }
                      fontSize="2.1"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {node.code}
                    </text>

                    {/* Node Full Title */}
                    <text
                      x={node.x}
                      y={node.type === "document" ? node.y - 4.5 : node.y + 6.2}
                      textAnchor="middle"
                      fill="#171717"
                      fontSize="2.1"
                      fontFamily="sans-serif"
                      fontWeight={isSelected ? "bold" : "600"}
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
                <span className="w-3 h-3 bg-industrial-green border border-carbon" />
                <span className="font-bold">RESPONSIBILITY</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-signal-orange border border-carbon" />
                <span className="font-bold">ANOMALY / GAP</span>
              </span>
            </div>

            <span className="text-carbon/60 font-bold">// CLICK NODE TO INSPECT</span>
          </div>
        </div>

        {/* Right: Detailed Node Inspector (4 cols) with data-lenis-prevent */}
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

                <div className="pt-2 border-t border-carbon/20 space-y-2">
                  <Link href="/app/investigations" data-cursor="ACTION">
                    <Button variant="signal" size="sm" className="w-full" magnetic={true}>
                      Cross-Examine in Desk →
                    </Button>
                  </Link>
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
    </div>
  );
}
