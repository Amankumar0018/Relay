"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  { number: "04", name: "Investigations", href: "/app/investigations", icon: IconInvestigation, badge: "3 OPEN" },
  { number: "05", name: "Responsibilities", href: "/app/responsibilities", icon: IconTask, badge: "4 ACT" },
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
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-carbon/80 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-raw-paper border-r-2 border-carbon flex flex-col transition-transform duration-150 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand & Organization Block */}
        <div className="p-4 border-b-2 border-carbon bg-raw-paper-light">
          <div className="flex items-center justify-between">
            <Link href="/" className="inline-block group">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-signal-orange border border-carbon" />
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
              className="p-1 text-carbon hover:text-signal-orange lg:hidden"
              aria-label="Close navigation"
            >
              <IconClose size={18} />
            </button>
          </div>

          <div className="mt-3 p-2.5 bg-concrete/60 border border-carbon">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase font-bold text-signal-orange">
                NODE #04
              </span>
              <span className="w-2 h-2 bg-industrial-green border border-carbon animate-pulse" />
            </div>
            <p className="font-display font-bold text-xs uppercase text-carbon mt-1 truncate">
              Acme BioSystems
            </p>
            <p className="font-mono text-[10px] text-carbon/70 truncate">
              CSO TRANSITION 2026
            </p>
          </div>
        </div>

        {/* Primary Navigation */}
        <div className="p-3 flex-1 overflow-y-auto space-y-4">
          <div>
            <div className="px-2 pb-1 font-mono text-[9px] uppercase font-bold tracking-widest text-carbon/50">
              [SYSTEM MODULES]
            </div>
            <nav className="space-y-1 mt-1">
              {PRIMARY_NAV.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/app"
                    ? pathname === "/app"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center justify-between px-3 py-2 text-xs font-mono transition-all border ${
                      isActive
                        ? "bg-carbon text-raw-paper border-carbon font-bold shadow-brutal translate-x-[2px]"
                        : "text-carbon border-transparent hover:bg-concrete/60 hover:border-carbon"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`text-[10px] ${
                          isActive ? "text-signal-orange font-bold" : "text-carbon/50"
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
                        className={`text-[9px] px-1.5 py-0.2 border font-mono font-bold uppercase ${
                          isActive
                            ? "bg-signal-orange text-raw-paper border-carbon"
                            : "bg-signal-orange/20 text-signal-orange border-signal-orange/40"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t-2 border-carbon space-y-1.5 bg-raw-paper-light">
          <Link
            href="/app/settings"
            onClick={onClose}
            className={`flex items-center gap-2.5 px-3 py-1.5 text-xs font-mono uppercase transition-colors border ${
              pathname === "/app/settings"
                ? "bg-carbon text-raw-paper border-carbon font-bold"
                : "text-carbon border-transparent hover:bg-concrete/60 hover:border-carbon"
            }`}
          >
            <IconSettings size={14} />
            <span>Workspace Config</span>
          </Link>

          <Link
            href="/"
            className="flex items-center justify-between px-3 py-1.5 text-xs font-mono text-carbon/70 hover:text-carbon hover:bg-concrete/40 transition-colors uppercase"
          >
            <span>Public Website</span>
            <IconExternal size={12} />
          </Link>
        </div>
      </aside>
    </>
  );
};
