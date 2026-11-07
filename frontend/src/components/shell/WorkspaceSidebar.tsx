"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  IconArchive,
  IconNetwork,
  IconInvestigation,
  IconTask,
  IconAgent,
  IconDossier,
  IconSettings,
  IconClose,
  IconExternal,
} from "@/components/ui/Icons";

interface NavItem {
  number: string;
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
}

const PRIMARY_NAV: NavItem[] = [
  { number: "01", name: "Overview", href: "/app", icon: IconArchive },
  { number: "02", name: "Knowledge Archive", href: "/app/archive", icon: IconArchive },
  { number: "03", name: "Continuity Map", href: "/app/map", icon: IconNetwork },
  { number: "04", name: "Investigations", href: "/app/investigations", icon: IconInvestigation, badge: "6 OPEN" },
  { number: "05", name: "Responsibilities", href: "/app/responsibilities", icon: IconTask, badge: "14 ACT" },
  { number: "06", name: "Agent Collaboration", href: "/app/agents", icon: IconAgent },
  { number: "07", name: "Handover Dossiers", href: "/app/handovers", icon: IconDossier },
];

interface WorkspaceSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-carbon/80 backdrop-blur-xs lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-raw-paper border-r-2 border-carbon flex flex-col transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] lg:translate-x-0 ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand & Organization Block */}
        <div className="p-4 border-b-2 border-carbon bg-raw-paper-light">
          <div className="flex items-center justify-between">
            <Link href="/" className="inline-block group" data-cursor="HOME">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-signal-orange border border-carbon group-hover:scale-105 transition-transform" />
                <span className="font-display font-black text-xl tracking-tight text-carbon uppercase">
                  Relay
                </span>
              </div>
              <span className="block font-mono text-[9px] uppercase tracking-widest text-carbon/60 mt-0.5">
                // INDUSTRIAL CONTINUITY
              </span>
            </Link>
            <button
              onClick={onClose}
              className="p-1.5 border border-carbon bg-raw-paper text-carbon hover:bg-concrete active:translate-x-0.5 active:translate-y-0.5 lg:hidden"
              aria-label="Close navigation"
            >
              <IconClose size={18} />
            </button>
          </div>

          <div className="mt-3 p-2.5 bg-concrete/60 border border-carbon relative overflow-hidden group space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase font-bold text-signal-orange">
                NODE #04 // SECURE BOUNDARY
              </span>
              <span className="w-2 h-2 bg-industrial-green border border-carbon animate-pulse" />
            </div>
            <div>
              <p className="font-display font-bold text-xs uppercase text-carbon truncate">
                Acme BioSystems
              </p>
              <p className="font-mono text-[9px] text-carbon/70 truncate">
                AMAN KUMAR → MARCUS VANCE
              </p>
            </div>

            {/* Active Role Indicator */}
            <div className="pt-1 border-t border-carbon/20 flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 bg-carbon text-raw-paper">
                AUTHORIZED REVIEWER
              </span>
              <span className="font-mono text-[8px] uppercase text-signal-orange font-bold">
                SWITCH GATE ACTIVE
              </span>
            </div>
            {/* Subtle telemetry line */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-carbon/20 group-hover:bg-signal-orange transition-colors" />
          </div>
        </div>

        {/* Primary Navigation */}
        <div className="p-3 flex-1 overflow-y-auto space-y-4">
          <div>
            <div className="px-2 pb-1 font-mono text-[9px] uppercase font-bold tracking-widest text-carbon/50 flex items-center justify-between">
              <span>[SYSTEM MODULES]</span>
              <span className="text-[8px] text-carbon/40">SYS.V2</span>
            </div>
            <LayoutGroup id="workspaceNavPlateGroup">
              <nav className="space-y-1.5 mt-1 relative">
                {PRIMARY_NAV.map((item) => {
                  const isActive =
                    item.href === "/app"
                      ? pathname === "/app"
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      data-cursor="NAV"
                      className={`relative flex items-center justify-between px-3 py-2.5 text-xs font-mono select-none overflow-hidden border ${
                        isActive
                          ? "text-raw-paper border-carbon font-bold shadow-brutal"
                          : "text-carbon border-transparent hover:bg-concrete/70 hover:border-carbon/40 hover:translate-x-1 active:translate-x-0.5 active:translate-y-0.5 transition-all duration-150"
                      }`}
                    >
                      {/* Active sliding background plate */}
                      {isActive && (
                        <motion.div
                          layoutId="activeNavPlate"
                          className="absolute inset-0 bg-carbon -z-10 shadow-brutal"
                          transition={{
                            type: "spring",
                            stiffness: 480,
                            damping: 36,
                            mass: 0.5,
                          }}
                        />
                      )}

                      {/* Active left signal indicator bar */}
                      {isActive && (
                        <motion.div
                          layoutId="activeNavAccent"
                          className="absolute left-0 top-0 bottom-0 w-1.5 bg-signal-orange z-10"
                          transition={{
                            type: "spring",
                            stiffness: 480,
                            damping: 36,
                            mass: 0.5,
                          }}
                        />
                      )}

                      <div className="flex items-center gap-2.5 min-w-0 z-10">
                        <span
                          className={`text-[10px] font-bold transition-colors ${
                            isActive
                              ? "text-signal-orange"
                              : "text-carbon/50 group-hover:text-carbon"
                          }`}
                        >
                          {item.number}
                        </span>
                        <span className="truncate uppercase font-bold tracking-tight">
                          {item.name}
                        </span>
                      </div>

                      {item.badge && (
                        <span
                          className={`z-10 text-[9px] px-1.5 py-0.5 border font-mono font-bold uppercase transition-transform ${
                            isActive
                              ? "bg-signal-orange text-raw-paper border-raw-paper/30"
                              : "bg-signal-orange/15 text-signal-orange border-signal-orange/40"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </LayoutGroup>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t-2 border-carbon space-y-1.5 bg-raw-paper-light">
          <Link
            href="/app/settings"
            onClick={onClose}
            data-cursor="CONFIG"
            className={`flex items-center gap-2.5 px-3 py-2 text-xs font-mono uppercase border select-none transition-all duration-150 ${
              pathname === "/app/settings"
                ? "bg-carbon text-raw-paper border-carbon font-bold shadow-brutal"
                : "text-carbon border-transparent hover:bg-concrete/70 hover:border-carbon/40 hover:translate-x-1 active:translate-x-0.5 active:translate-y-0.5"
            }`}
          >
            <IconSettings size={14} />
            <span>Workspace Config</span>
          </Link>

          <Link
            href="/"
            data-cursor="PORTAL"
            className="flex items-center justify-between px-3 py-1.5 text-xs font-mono text-carbon/70 hover:text-carbon hover:bg-concrete/40 transition-colors uppercase border border-transparent hover:border-carbon/30"
          >
            <span>Public Website</span>
            <IconExternal size={12} />
          </Link>
        </div>
      </aside>
    </>
  );
};
