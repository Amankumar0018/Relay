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
  IconBuilding,
  IconExternal,
} from "@/components/ui/Icons";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
}

const PRIMARY_NAV: NavItem[] = [
  { name: "Overview", href: "/app", icon: IconArchive },
  { name: "Knowledge Archive", href: "/app/archive", icon: IconArchive },
  { name: "Continuity Map", href: "/app/map", icon: IconNetwork },
  { name: "Investigations", href: "/app/investigations", icon: IconInvestigation, badge: "3 open" },
  { name: "Responsibilities", href: "/app/responsibilities", icon: IconTask, badge: "4 active" },
  { name: "Agent Collaboration", href: "/app/agents", icon: IconAgent },
  { name: "Handover Dossiers", href: "/app/handovers", icon: IconDossier },
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
          className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-paper-secondary border-r border-rule flex flex-col transition-transform duration-150 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand & Organization Block */}
        <div className="p-4 border-b border-rule">
          <div className="flex items-center justify-between">
            <Link href="/" className="inline-block group">
              <span className="font-serif italic text-xl font-bold tracking-tight text-ink">
                Relay
              </span>
              <span className="block text-[10px] font-sans uppercase tracking-widest text-ink-secondary">
                Institutional Memory
              </span>
            </Link>
            <button
              onClick={onClose}
              className="p-1 rounded text-ink-secondary hover:text-ink lg:hidden"
              aria-label="Close navigation"
            >
              <IconClose size={16} />
            </button>
          </div>

          <div className="mt-3 p-2 rounded bg-paper-surface border border-rule/80">
            <div className="flex items-center gap-2">
              <IconBuilding size={14} className="text-olive shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink truncate">
                  Acme BioSystems
                </p>
                <p className="text-[11px] text-ink-secondary truncate">
                  CSO Transition 2026
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Navigation */}
        <div className="p-3 flex-1 overflow-y-auto space-y-4">
          <div>
            <div className="px-2 pb-1 text-[10px] uppercase font-semibold tracking-wider text-ink-secondary">
              Continuity Management
            </div>
            <nav className="space-y-0.5 mt-1">
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
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors ${
                      isActive
                        ? "bg-paper-surface font-semibold text-ink border border-rule shadow-sm"
                        : "text-ink-secondary hover:bg-paper hover:text-ink"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        size={15}
                        className={isActive ? "text-olive" : "text-ink-secondary"}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded border font-sans ${
                          item.badge.includes("open")
                            ? "bg-copper-light text-copper-dark border-copper-border"
                            : "bg-paper text-ink-secondary border-rule"
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
        <div className="p-3 border-t border-rule space-y-1 bg-paper-secondary">
          <Link
            href="/app/settings"
            onClick={onClose}
            className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs transition-colors ${
              pathname === "/app/settings"
                ? "bg-paper-surface font-semibold text-ink border border-rule"
                : "text-ink-secondary hover:text-ink hover:bg-paper"
            }`}
          >
            <IconSettings size={15} />
            <span>Workspace Settings</span>
          </Link>

          <Link
            href="/"
            className="flex items-center justify-between px-2.5 py-1.5 rounded text-xs text-ink-secondary hover:text-ink hover:bg-paper transition-colors"
          >
            <span>Public Overview</span>
            <IconExternal size={13} />
          </Link>
        </div>
      </aside>
    </>
  );
};

