"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  IconMenu,
  IconSearch,
  IconUpload,
  IconChevronRight,
  IconCheck,
  IconAlert,
  IconUser,
} from "@/components/ui/Icons";
import { fetchBackendHealth, HealthCheckData } from "@/lib/api";
import { Button } from "@/components/ui/Button";

interface WorkspaceHeaderProps {
  onToggleSidebar: () => void;
  onOpenUpload?: () => void;
}

const PAGE_META: Record<string, { title: string; section: string; actionLabel?: string }> = {
  "/app": { title: "Continuity Overview", section: "Workspace", actionLabel: "Stage Records" },
  "/app/archive": { title: "Knowledge Archive", section: "Records", actionLabel: "Upload Document" },
  "/app/map": { title: "Continuity Map", section: "Topology" },
  "/app/investigations": { title: "Knowledge Investigations", section: "Evidence" },
  "/app/responsibilities": { title: "Operational Responsibilities", section: "Commitments" },
  "/app/agents": { title: "Agent Collaboration", section: "Orchestration" },
  "/app/handovers": { title: "Handover Dossiers", section: "Deliverables", actionLabel: "Compile Dossier" },
  "/app/settings": { title: "Workspace Settings", section: "Administration" },
};

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  onToggleSidebar,
  onOpenUpload,
}) => {
  const pathname = usePathname();
  const meta = PAGE_META[pathname] || {
    title: "Relay Console",
    section: "Workspace",
  };

  const [backendHealth, setBackendHealth] = useState<HealthCheckData | null>(null);
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchBackendHealth().then((data) => {
      if (mounted) {
        setBackendHealth(data);
        setIsChecked(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 h-14 bg-paper/95 backdrop-blur-xs border-b border-rule px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded text-ink-secondary hover:text-ink hover:bg-paper-secondary lg:hidden"
          aria-label="Open sidebar"
        >
          <IconMenu size={18} />
        </button>

        <div>
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-ink-secondary">
            <span>Relay</span>
            <IconChevronRight size={10} className="text-rule" />
            <span>{meta.section}</span>
          </div>
          <h1 className="text-sm font-semibold text-ink font-sans">
            {meta.title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Honest Backend Connectivity Indicator */}
        <div
          className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded border border-rule bg-paper-surface text-[11px] text-ink-secondary"
          title={
            backendHealth
              ? `FastAPI v${backendHealth.version} connected on localhost:8000`
              : "Verifying FastAPI backend connectivity on localhost:8000"
          }
        >
          <span className="font-sans">FastAPI:</span>
          {isChecked ? (
            backendHealth ? (
              <span className="flex items-center gap-1 text-olive-dark font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-olive" />
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-copper font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-copper" />
                Offline
              </span>
            )
          ) : (
            <span className="text-ink-disabled">Checking...</span>
          )}
        </div>

        {/* Contextual primary action */}
        {meta.actionLabel && onOpenUpload && (
          <Button variant="primary" size="sm" onClick={onOpenUpload}>
            <IconUpload size={14} />
            <span>{meta.actionLabel}</span>
          </Button>
        )}
      </div>
    </header>
  );
};

