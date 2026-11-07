"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconMenu,
  IconSearch,
  IconUpload,
  IconCheck,
  IconAlert,
  IconCommand,
} from "@/components/ui/Icons";
import { fetchBackendHealth, HealthCheckData } from "@/lib/api";
import { Button } from "@/components/ui/Button";

interface WorkspaceHeaderProps {
  onToggleSidebar: () => void;
  onOpenUpload?: () => void;
  onOpenCommandPalette?: () => void;
}

const PAGE_META: Record<
  string,
  { code: string; title: string; section: string; actionLabel?: string }
> = {
  "/app": { code: "01", title: "Continuity Overview", section: "TELEMETRY", actionLabel: "+ DEPOSIT RECORD" },
  "/app/archive": { code: "02", title: "Knowledge Archive", section: "RECORDS", actionLabel: "+ STAGE ARCHIVE" },
  "/app/map": { code: "03", title: "Continuity Map", section: "TOPOLOGY" },
  "/app/investigations": { code: "04", title: "Investigation Desk", section: "CROSS-EXAMINATION" },
  "/app/responsibilities": { code: "05", title: "Operational Obligations", section: "COMMITMENTS" },
  "/app/agents": { code: "06", title: "Agent Collaboration", section: "ORCHESTRATION" },
  "/app/handovers": { code: "07", title: "Handover Dossiers", section: "DELIVERABLES", actionLabel: "COMPILE DOSSIER" },
  "/app/settings": { code: "08", title: "Workspace Config", section: "SYSTEM" },
};

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  onToggleSidebar,
  onOpenUpload,
  onOpenCommandPalette,
}) => {
  const pathname = usePathname();
  const meta = PAGE_META[pathname] || {
    code: "00",
    title: "Relay Console",
    section: "WORKSPACE",
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
    <header className="sticky top-0 z-30 h-14 bg-raw-paper border-b-2 border-carbon px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 text-carbon hover:bg-concrete/60 border border-carbon lg:hidden"
          aria-label="Open sidebar"
        >
          <IconMenu size={18} />
        </button>

        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-baseline gap-2.5"
        >
          <span className="font-mono text-xs font-bold px-1.5 py-0.5 bg-carbon text-raw-paper border border-carbon">
            [{meta.code}]
          </span>
          <div>
            <span className="font-display font-black text-sm sm:text-base text-carbon uppercase tracking-tight">
              {meta.title}
            </span>
          </div>
          <span className="hidden md:inline font-mono text-[10px] text-carbon/50 uppercase tracking-widest">
            // {meta.section}
          </span>
        </motion.div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          data-cursor="SEARCH"
          className="hidden sm:flex items-center gap-2 px-2.5 py-1 text-xs font-mono text-carbon/80 bg-raw-paper-light border border-carbon hover:bg-concrete/60 hover:shadow-brutal transition-all active:translate-x-[1px] active:translate-y-[1px]"
          title="Search or trigger commands"
        >
          <IconSearch size={13} className="text-carbon/60" />
          <span className="text-[11px] uppercase">Command Bus</span>
          <kbd className="px-1 bg-carbon text-raw-paper text-[9px] font-bold">
            ⌘K
          </kbd>
        </button>

        {/* Backend Connectivity Badge */}
        <div
          className="hidden md:flex items-center gap-1.5 px-2 py-1 border border-carbon bg-raw-paper-light text-[10px] font-mono"
          title={
            backendHealth
              ? `FastAPI ${backendHealth.version} connected`
              : "Checking backend connectivity"
          }
        >
          <span className="font-bold uppercase text-carbon/60">BACKEND:</span>
          {isChecked ? (
            backendHealth ? (
              <span className="flex items-center gap-1.5 font-bold text-industrial-green uppercase">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full bg-industrial-green opacity-75" />
                  <span className="relative inline-flex w-2 h-2 bg-industrial-green border border-carbon" />
                </span>
                LIVE
              </span>
            ) : (
              <span className="flex items-center gap-1.5 font-bold text-signal-orange uppercase">
                <span className="w-2 h-2 bg-signal-orange" />
                OFFLINE
              </span>
            )
          ) : (
            <span className="text-carbon/40">POLLING...</span>
          )}
        </div>

        {/* Contextual Action Button with magnetic effect */}
        {meta.actionLabel && onOpenUpload && (
          <Button
            variant="signal"
            size="sm"
            onClick={onOpenUpload}
            magnetic={true}
            data-cursor="UPLOAD"
          >
            <IconUpload size={13} />
            <span className="hidden sm:inline">{meta.actionLabel}</span>
            <span className="sm:hidden">+ RECORD</span>
          </Button>
        )}
      </div>
    </header>
  );
};
