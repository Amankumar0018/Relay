"use client";

import React, { useState, useMemo } from "react";
import {
  IconNetwork,
  IconDocument,
  IconUser,
  IconTask,
  IconAlert,
  IconClose,
  IconUpload,
  IconInfo,
  IconExternal,
} from "@/components/ui/Icons";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
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
  label: string;
  type: NodeType;
  x: number; // 0 - 100
  y: number; // 0 - 100
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
    label: "CSO Transition Charter v2.4",
    type: "document",
    x: 22,
    y: 28,
    summary: "Formal legal charter defining the handover of scientific directorship and committee responsibilities.",
    evidenceSource: "CSO_Transition_Protocol_v2.pdf",
    evidenceSection: "Section 3.1 & 4.2",
    status: "verified",
    connectedTo: ["person-vance", "person-rostova", "resp-bioreactor"],
  },
  {
    id: "person-vance",
    label: "Dr. Marcus Vance",
    type: "person",
    x: 44,
    y: 20,
    summary: "Outgoing Chief Scientific Officer. Transitioning to Scientific Advisory Board on Nov 15.",
    evidenceSource: "CSO_Transition_Protocol_v2.pdf",
    evidenceSection: "Section 1.2",
    status: "verified",
    connectedTo: ["doc-cso", "resp-bioreactor", "gap-nitrogen"],
  },
  {
    id: "person-rostova",
    label: "Dr. Elena Rostova",
    type: "person",
    x: 76,
    y: 24,
    summary: "Incoming Interim Head of Discovery Research assuming operational laboratory oversight on Nov 16.",
    evidenceSource: "CSO_Transition_Protocol_v2.pdf",
    evidenceSection: "Section 3.1",
    status: "verified",
    connectedTo: ["doc-cso", "resp-bioreactor"],
  },
  {
    id: "resp-bioreactor",
    label: "FDA Bioreactor Calibration Sign-off",
    type: "responsibility",
    x: 52,
    y: 48,
    summary: "Phase II GMP facility calibration sign-off scheduled for Nov 12. Precondition for Novartis milestone.",
    evidenceSource: "Bioreactor_GMP_Dossier.pdf",
    evidenceSection: "Appendix B",
    status: "in-flight",
    connectedTo: ["person-vance", "person-rostova", "dep-novartis"],
  },
  {
    id: "gap-nitrogen",
    label: "Liquid Nitrogen Secondary Signatory",
    type: "gap",
    x: 32,
    y: 72,
    summary: "Airgas master supply agreement names only Dr. Vance. Auto-renews Dec 1; lacks designated corporate backup.",
    evidenceSource: "Liquid_Nitrogen_SLA.docx",
    evidenceSection: "Clause 14.2",
    status: "unresolved",
    connectedTo: ["person-vance"],
  },
  {
    id: "dep-novartis",
    label: "Novartis Year-End IP Milestone",
    type: "dependency",
    x: 80,
    y: 56,
    summary: "$4.2M partner milestone payment contingent on successful bioreactor calibration data delivery by Nov 28.",
    evidenceSource: "Novartis_Partner_Agreement.pdf",
    evidenceSection: "Schedule 3",
    status: "in-flight",
    connectedTo: ["resp-bioreactor"],
  },
];

const DEMO_MAP_EDGES: MapEdge[] = [
  { id: "e1", source: "doc-cso", target: "person-vance", label: "defines role transfer" },
  { id: "e2", source: "doc-cso", target: "person-rostova", label: "delegates directorship" },
  { id: "e3", source: "person-vance", target: "resp-bioreactor", label: "holds current authority" },
  { id: "e4", source: "resp-bioreactor", target: "person-rostova", label: "transfers Nov 12" },
  { id: "e5", source: "resp-bioreactor", target: "dep-novartis", label: "commercial prerequisite" },
  { id: "e6", source: "person-vance", target: "gap-nitrogen", label: "sole registered contact", isUnresolved: true },
];

export default function ContinuityMapPage() {
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [filterType, setFilterType] = useState<NodeType | "all">("all");
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);

  const visibleNodes = useMemo(() => {
    if (!isDemoMode) return [];
    if (filterType === "all") return DEMO_MAP_NODES;
    return DEMO_MAP_NODES.filter((n) => n.type === filterType);
  }, [isDemoMode, filterType]);

  const visibleNodeIds = useMemo(
    () => new Set(visibleNodes.map((n) => n.id)),
    [visibleNodes]
  );

  const visibleEdges = useMemo(() => {
    if (!isDemoMode) return [];
    return DEMO_MAP_EDGES.filter(
      (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
    );
  }, [visibleNodeIds, isDemoMode]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, MapNode>();
    DEMO_MAP_NODES.forEach((n) => map.set(n.id, n));
    return map;
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-rule">
        <div>
          <h1 className="text-xl font-serif font-semibold text-ink">
            Continuity Map
          </h1>
          <p className="text-xs text-ink-secondary mt-0.5">
            Structured relational topology linking people, records, commitments, and institutional dependencies.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1 bg-paper-secondary p-0.5 rounded border border-rule text-xs">
          <button
            onClick={() => setIsDemoMode(true)}
            className={`px-3 py-1 rounded text-[11px] transition-colors ${
              isDemoMode
                ? "bg-paper-surface text-ink font-semibold border border-rule shadow-xs"
                : "text-ink-secondary hover:text-ink"
            }`}
          >
            Demonstration Network
          </button>
          <button
            onClick={() => setIsDemoMode(false)}
            className={`px-3 py-1 rounded text-[11px] transition-colors ${
              !isDemoMode
                ? "bg-paper-surface text-ink font-semibold border border-rule shadow-xs"
                : "text-ink-secondary hover:text-ink"
            }`}
          >
            Current Workspace (Empty)
          </button>
        </div>
      </div>

      {isDemoMode && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-ink-secondary text-[11px]">Filter entity type:</span>
          <div className="flex items-center gap-1 overflow-x-auto">
            {(
              [
                { id: "all", label: "All Entities" },
                { id: "person", label: "People" },
                { id: "document", label: "Documents" },
                { id: "responsibility", label: "Responsibilities" },
                { id: "gap", label: "Unresolved Gaps" },
                { id: "dependency", label: "Dependencies" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setFilterType(t.id)}
                className={`px-2.5 py-0.5 rounded text-[11px] border transition-colors ${
                  filterType === t.id
                    ? "bg-olive text-paper border-olive font-medium"
                    : "bg-paper-surface text-ink-secondary border-rule hover:bg-paper-secondary"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Map Canvas Surface */}
      <div className="relative border border-rule rounded bg-paper-surface h-[520px] overflow-hidden select-none">
        {isDemoMode ? (
          <div className="w-full h-full relative p-4">
            {/* SVG Connecting Edges */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {visibleEdges.map((edge) => {
                const s = nodeMap.get(edge.source);
                const t = nodeMap.get(edge.target);
                if (!s || !t) return null;

                const isHighlighted =
                  selectedNode &&
                  (selectedNode.id === edge.source || selectedNode.id === edge.target);

                return (
                  <g key={edge.id}>
                    <line
                      x1={`${s.x}%`}
                      y1={`${s.y}%`}
                      x2={`${t.x}%`}
                      y2={`${t.y}%`}
                      stroke={edge.isUnresolved ? "#A16C49" : isHighlighted ? "#737B64" : "#D4D1C7"}
                      strokeWidth={isHighlighted ? 2 : 1.25}
                      strokeDasharray={edge.isUnresolved ? "4,4" : undefined}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Nodes */}
            {visibleNodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const isConnected =
                selectedNode &&
                (selectedNode.id === node.id ||
                  selectedNode.connectedTo.includes(node.id) ||
                  node.connectedTo.includes(selectedNode.id));

              const nodeColor =
                node.type === "gap"
                  ? "border-copper text-copper-dark bg-copper-light"
                  : node.type === "person"
                  ? "border-olive text-ink bg-olive-light"
                  : node.type === "document"
                  ? "border-rule text-ink bg-paper-surface"
                  : "border-rule text-ink bg-paper";

              return (
                <div
                  key={node.id}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  onClick={() => setSelectedNode(node)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all ${
                    selectedNode && !isConnected ? "opacity-35" : "opacity-100"
                  }`}
                >
                  <div
                    className={`p-2 px-3 rounded border text-left shadow-xs transition-colors ${nodeColor} ${
                      isSelected ? "ring-2 ring-ink ring-offset-1 ring-offset-paper" : ""
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                      <span className="text-xs font-semibold tracking-tight truncate max-w-[150px]">
                        {node.label}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-sans text-ink-secondary block truncate mt-0.5">
                      {node.type}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Node Detail Inspector Drawer */}
            {selectedNode && (
              <div className="absolute top-3 right-3 bottom-3 w-80 bg-paper-surface border border-rule rounded shadow-md p-4 overflow-y-auto space-y-3.5 z-10">
                <div className="flex items-center justify-between pb-2 border-b border-rule">
                  <span className="text-[10px] uppercase font-mono text-ink-secondary">
                    {selectedNode.type} Entity
                  </span>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="p-1 text-ink-secondary hover:text-ink rounded"
                  >
                    <IconClose size={14} />
                  </button>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-ink font-sans">
                    {selectedNode.label}
                  </h3>
                  <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
                    {selectedNode.summary}
                  </p>
                </div>

                <div className="p-2.5 rounded bg-paper-secondary border border-rule space-y-1 text-xs">
                  <span className="text-[10px] uppercase font-semibold text-ink-secondary block">
                    Source Attribution
                  </span>
                  <p className="font-medium text-ink">
                    {selectedNode.evidenceSource}
                  </p>
                  <p className="text-ink-secondary text-[11px]">
                    {selectedNode.evidenceSection}
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedNode(null)}
                    className="w-full"
                  >
                    Close Inspector
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Honest Empty State */
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-10 h-10 rounded bg-paper-secondary border border-rule flex items-center justify-center text-ink-secondary">
              <IconNetwork size={20} />
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="text-sm font-semibold text-ink font-sans">
                No Knowledge Topology Loaded for this Workspace
              </h3>
              <p className="text-xs text-ink-secondary leading-relaxed">
                Relay generates the Continuity Map by cross-referencing ingested organizational records, roles, and commitments. Upload your organization&apos;s records to construct the initial topology.
              </p>
            </div>
            <Link href="/app/archive">
              <Button variant="primary" size="sm">
                <IconUpload size={14} />
                <span>Stage Initial Document</span>
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

