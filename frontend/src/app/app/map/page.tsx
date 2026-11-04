"use client";

import React, { useState, useMemo } from "react";
import {
  IconNetwork,
  IconDocument,
  IconUser,
  IconTask,
  IconAlert,
  IconClose,
  IconInfo,
  IconExternal,
} from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
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

const DEMO_MAP_NODES: MapNode[] = [
  {
    id: "doc-cso",
    code: "DOC-01",
    label: "CSO Transition Charter v2.4",
    type: "document",
    x: 18,
    y: 20,
    summary: "Formal charter defining handover of scientific directorship and regulatory signatory powers.",
    evidenceSource: "CSO_Transition_Protocol_v2.pdf",
    evidenceSection: "Section 3.1 & 4.2",
    status: "verified",
    connectedTo: ["person-vance", "person-thorne", "resp-fda1572"],
  },
  {
    id: "person-vance",
    code: "PER-01",
    label: "Dr. Eleanor Vance",
    type: "person",
    x: 50,
    y: 16,
    summary: "Outgoing Chief Scientific Officer. Relinquishing trial protocol oversight on Nov 30, 2024.",
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
    x: 82,
    y: 20,
    summary: "Incoming Head of Translational Oncology assuming primary trial sponsorship.",
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
    summary: "Phase II Oncology trial sponsor re-submission deadline. Mandatory regulatory deliverable.",
    evidenceSource: "Regulatory_Audit_Q3_2024.pdf",
    evidenceSection: "Box 1 & 6",
    status: "in-flight",
    connectedTo: ["person-vance", "person-thorne", "dep-phase2"],
  },
  {
    id: "gap-nitrogen",
    code: "GAP-01",
    label: "$140K Spectrometry Lab Renewal",
    type: "gap",
    x: 20,
    y: 78,
    summary: "Apex BioAnalytical MSA auto-renews Nov 15; written notice required by Oct 15 without designated sign-off.",
    evidenceSource: "Vendor_Master_Agreement_2023.docx",
    evidenceSection: "Section 8.2",
    status: "unresolved",
    connectedTo: ["person-vance"],
  },
  {
    id: "dep-phase2",
    code: "DEP-01",
    label: "Phase II Oncology Continuation",
    type: "dependency",
    x: 82,
    y: 72,
    summary: "Clinical trial milestone contingent on updated FDA regulatory co-signature before November 1.",
    evidenceSource: "Clinical_Trial_Charter_ONCO.pdf",
    evidenceSection: "Schedule 2",
    status: "in-flight",
    connectedTo: ["resp-fda1572"],
  },
];

const DEMO_MAP_EDGES: MapEdge[] = [
  { id: "e1", source: "doc-cso", target: "person-vance", label: "TRANSFER PROTOCOL" },
  { id: "e2", source: "person-vance", target: "person-thorne", label: "SUCCESSOR MANDATE" },
  { id: "e3", source: "person-vance", target: "resp-fda1572", label: "CURRENT SIGNATORY" },
  { id: "e4", source: "resp-fda1572", target: "person-thorne", label: "CO-SIGNATORY REQUIRED" },
  { id: "e5", source: "resp-fda1572", target: "dep-phase2", label: "PREREQUISITE" },
  { id: "e6", source: "person-vance", target: "gap-nitrogen", label: "SOLE CONTACT (EXPIRES)", isUnresolved: true },
];

export default function ContinuityMapPage() {
  const [filterType, setFilterType] = useState<NodeType | "all">("all");
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(DEMO_MAP_NODES[3]);

  const visibleNodes = useMemo(() => {
    if (filterType === "all") return DEMO_MAP_NODES;
    return DEMO_MAP_NODES.filter((n) => n.type === filterType);
  }, [filterType]);

  const visibleNodeIds = useMemo(
    () => new Set(visibleNodes.map((n) => n.id)),
    [visibleNodes]
  );

  const visibleEdges = useMemo(() => {
    return DEMO_MAP_EDGES.filter(
      (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
    );
  }, [visibleNodeIds]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, MapNode>();
    DEMO_MAP_NODES.forEach((n) => map.set(n.id, n));
    return map;
  }, []);

  const filterOptions: { type: NodeType | "all"; label: string }[] = [
    { type: "all", label: "ALL ENTITIES" },
    { type: "person", label: "PEOPLE" },
    { type: "document", label: "DOCUMENTS" },
    { type: "responsibility", label: "RESPONSIBILITIES" },
    { type: "gap", label: "ANOMALIES & GAPS" },
    { type: "dependency", label: "DEPENDENCIES" },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-carbon pb-4">
        <div>
          <span className="font-mono text-xs uppercase font-bold text-signal-orange">
            // TOPOLOGY VISUALIZER
          </span>
          <h2 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-carbon">
            Continuity Relational Map
          </h2>
          <p className="font-mono text-xs text-carbon/70 uppercase">
            GEOMETRIC GRAPH LINKING AUTHORITIES, OBLIGATIONS, AND EVIDENCE VECTORS
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2 py-1 bg-carbon text-raw-paper font-bold uppercase">
            NODE COUNT: {visibleNodes.length}
          </span>
          <span className="px-2 py-1 bg-signal-orange text-raw-paper font-bold uppercase">
            EDGES: {visibleEdges.length}
          </span>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="flex flex-wrap items-center gap-1.5 p-2.5 border-2 border-carbon bg-raw-paper-light font-mono text-xs">
        <span className="text-[10px] font-bold text-carbon/60 uppercase mr-2">
          FILTER TYPE:
        </span>
        {filterOptions.map((opt) => (
          <button
            key={opt.type}
            onClick={() => setFilterType(opt.type)}
            className={`px-2.5 py-1 uppercase text-[11px] font-bold border transition-colors ${
              filterType === opt.type
                ? "bg-carbon text-raw-paper border-carbon shadow-brutal"
                : "bg-raw-paper text-carbon border-carbon/40 hover:border-carbon"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Main Visualization Canvas with Split Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: SVG Canvas (8 cols) */}
        <div className="lg:col-span-8 border-2 border-carbon bg-raw-paper-light shadow-brutal relative overflow-hidden min-h-[560px]">
          {/* Industrial Grid Background */}
          <div className="absolute inset-0 industrial-grid-pattern opacity-60 pointer-events-none" />

          {/* Canvas Status Badge */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2 font-mono text-[10px] bg-carbon text-raw-paper px-2 py-1 border border-carbon">
            <span className="w-2 h-2 bg-signal-orange animate-pulse" />
            <span>INTERACTIVE GRAPH BUS</span>
          </div>

          <svg
            className="w-full h-[560px] relative z-0 select-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Render Edges */}
            {visibleEdges.map((edge) => {
              const src = nodeMap.get(edge.source);
              const tgt = nodeMap.get(edge.target);
              if (!src || !tgt) return null;

              const isEdgeConnectedToSelected =
                selectedNode &&
                (selectedNode.id === edge.source || selectedNode.id === edge.target);

              return (
                <g key={edge.id}>
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke={
                      edge.isUnresolved
                        ? "#F15A24"
                        : isEdgeConnectedToSelected
                        ? "#171717"
                        : "#B8B09E"
                    }
                    strokeWidth={
                      isEdgeConnectedToSelected ? "1.2" : edge.isUnresolved ? "1.0" : "0.6"
                    }
                    strokeDasharray={edge.isUnresolved ? "1.5, 1" : undefined}
                  />
                  {/* Midpoint Label with subtle backing */}
                  <rect
                    x={(src.x + tgt.x) / 2 - 10}
                    y={(src.y + tgt.y) / 2 - 2.5}
                    width="20"
                    height="3.5"
                    fill="#F4F1E8"
                    stroke="#171717"
                    strokeWidth="0.2"
                  />
                  <text
                    x={(src.x + tgt.x) / 2}
                    y={(src.y + tgt.y) / 2}
                    dominantBaseline="middle"
                    textAnchor="middle"
                    fill={edge.isUnresolved ? "#F15A24" : "#171717"}
                    fontSize="1.9"
                    fontFamily="monospace"
                    fontWeight="bold"
                    className="select-none"
                  >
                    {edge.label}
                  </text>
                </g>
              );
            })}

            {/* Render Geometric Nodes */}
            {visibleNodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const isConnected =
                selectedNode && selectedNode.connectedTo.includes(node.id);

              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className="cursor-pointer"
                  tabIndex={0}
                >
                  {/* Geometric Shape per Node Type */}
                  {node.type === "gap" ? (
                    // Octagonal / Alert node for gaps
                    <rect
                      x={node.x - 4.5}
                      y={node.y - 4.5}
                      width="9"
                      height="9"
                      fill="#F15A24"
                      stroke="#171717"
                      strokeWidth={isSelected ? "1.2" : "0.75"}
                    />
                  ) : node.type === "person" ? (
                    // Person: Circular glyph inside square frame
                    <rect
                      x={node.x - 4}
                      y={node.y - 4}
                      width="8"
                      height="8"
                      fill={isSelected ? "#171717" : "#F4F1E8"}
                      stroke="#171717"
                      strokeWidth={isSelected ? "1.2" : "0.75"}
                    />
                  ) : node.type === "document" ? (
                    // Document: Rectangular binder frame
                    <rect
                      x={node.x - 5}
                      y={node.y - 3.5}
                      width="10"
                      height="7"
                      fill={isSelected ? "#171717" : "#D5CEBD"}
                      stroke="#171717"
                      strokeWidth={isSelected ? "1.2" : "0.75"}
                    />
                  ) : (
                    // Default Geometric Node
                    <rect
                      x={node.x - 4}
                      y={node.y - 4}
                      width="8"
                      height="8"
                      fill={
                        node.status === "unresolved"
                          ? "#F15A24"
                          : isSelected
                          ? "#171717"
                          : "#353C35"
                      }
                      stroke="#171717"
                      strokeWidth={isSelected ? "1.2" : "0.75"}
                    />
                  )}

                  {/* Node Code Label */}
                  <text
                    x={node.x}
                    y={node.y + 1}
                    textAnchor="middle"
                    fill={
                      node.type === "gap" || isSelected || node.type === "responsibility"
                        ? "#EAE5D8"
                        : "#171717"
                    }
                    fontSize="2.4"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {node.code}
                  </text>

                  {/* Node Full Title Below */}
                  <text
                    x={node.x}
                    y={node.y + 7.5}
                    textAnchor="middle"
                    fill="#171717"
                    fontSize="2.5"
                    fontFamily="sans-serif"
                    fontWeight={isSelected ? "bold" : "600"}
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Legend Strip */}
          <div className="p-3 border-t-2 border-carbon bg-raw-paper flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] text-carbon">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-raw-paper border border-carbon" />
                <span>PERSON</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-concrete border border-carbon" />
                <span>DOCUMENT</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-industrial-green border border-carbon" />
                <span>RESPONSIBILITY</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-signal-orange border border-carbon" />
                <span>ANOMALY / GAP</span>
              </span>
            </div>

            <span className="text-carbon/60">// CLICK NODE TO INSPECT EVIDENCE</span>
          </div>
        </div>

        {/* Right: Detailed Node Inspector (4 cols) */}
        <div className="lg:col-span-4 border-2 border-carbon bg-raw-paper p-5 space-y-4 shadow-brutal">
          {selectedNode ? (
            <div className="space-y-4">
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
                  // {selectedNode.status}
                </span>
              </div>

              <div>
                <span className="font-mono text-[10px] uppercase text-carbon/60 font-bold block">
                  NODE CLASSIFICATION: {selectedNode.type}
                </span>
                <h3 className="font-display font-black text-lg uppercase text-carbon mt-1">
                  {selectedNode.label}
                </h3>
              </div>

              <div className="space-y-1">
                <span className="font-mono text-[10px] uppercase font-bold text-carbon/60">
                  TOPOLOGY SUMMARY
                </span>
                <p className="text-xs text-carbon/80 font-sans leading-relaxed p-3 bg-raw-paper-light border border-carbon">
                  {selectedNode.summary}
                </p>
              </div>

              <div className="space-y-1 font-mono text-xs">
                <span className="text-[10px] uppercase font-bold text-carbon/60">
                  EVIDENCE PROVENANCE
                </span>
                <div className="p-3 bg-raw-paper-light border border-carbon space-y-1">
                  <div className="flex justify-between">
                    <span className="text-carbon/60">RECORD:</span>
                    <span className="font-bold text-carbon">{selectedNode.evidenceSource}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-carbon/60">SECTION:</span>
                    <span className="text-carbon">{selectedNode.evidenceSection}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1 font-mono text-xs">
                <span className="text-[10px] uppercase font-bold text-carbon/60">
                  CONNECTED NODES ({selectedNode.connectedTo.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.connectedTo.map((targetId) => {
                    const target = nodeMap.get(targetId);
                    return (
                      <button
                        key={targetId}
                        onClick={() => target && setSelectedNode(target)}
                        className="px-2 py-1 bg-concrete/60 border border-carbon text-carbon hover:bg-carbon hover:text-raw-paper transition-colors"
                      >
                        {target ? target.code : targetId}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-carbon/20">
                <Link href="/app/archive" className="block">
                  <Button variant="outline" size="sm" className="w-full">
                    View Primary Document →
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center font-mono text-xs text-carbon/60 uppercase">
              Select any geometric node on the canvas to inspect its relational evidence.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
