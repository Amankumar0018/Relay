"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  IconSearch,
  IconClose,
  IconArchive,
  IconNetwork,
  IconInvestigation,
  IconTask,
  IconAgent,
  IconDossier,
  IconSettings,
  IconUpload,
  IconArrowRight,
} from "@/components/ui/Icons";

interface CommandItem {
  id: string;
  category: "Navigation" | "Action" | "Record" | "Case";
  title: string;
  subtitle: string;
  shortcut?: string;
  href?: string;
  onSelect?: () => void;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUpload?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenUpload,
}) => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = [
    {
      id: "nav-overview",
      category: "Navigation",
      title: "01 Overview",
      subtitle: "Executive continuity telemetry and transition status",
      shortcut: "G O",
      href: "/app",
      icon: IconArchive,
    },
    {
      id: "nav-archive",
      category: "Navigation",
      title: "02 Knowledge Archive",
      subtitle: "Indexed documents, contracts, and verbatim extractions",
      shortcut: "G A",
      href: "/app/archive",
      icon: IconArchive,
    },
    {
      id: "nav-map",
      category: "Navigation",
      title: "03 Continuity Map",
      subtitle: "Interactive relationship network and dependency graph",
      shortcut: "G M",
      href: "/app/map",
      icon: IconNetwork,
    },
    {
      id: "nav-investigations",
      category: "Navigation",
      title: "04 Investigations",
      subtitle: "Cross-examination desk for contradictions and gaps",
      shortcut: "G I",
      href: "/app/investigations",
      icon: IconInvestigation,
    },
    {
      id: "nav-responsibilities",
      category: "Navigation",
      title: "05 Responsibilities",
      subtitle: "Operational obligations, renewal deadlines, and owners",
      shortcut: "G R",
      href: "/app/responsibilities",
      icon: IconTask,
    },
    {
      id: "nav-agents",
      category: "Navigation",
      title: "06 Agent Collaboration",
      subtitle: "Multi-agent pipeline and Switch human verification gate",
      shortcut: "G C",
      href: "/app/agents",
      icon: IconAgent,
    },
    {
      id: "nav-handovers",
      category: "Navigation",
      title: "07 Handover Dossiers",
      subtitle: "Synthesized executive briefing and 30-day blueprints",
      shortcut: "G H",
      href: "/app/handovers",
      icon: IconDossier,
    },
    {
      id: "action-upload",
      category: "Action",
      title: "Deposit Institutional Record",
      subtitle: "Stage new PDF, DOCX, or TXT records for processing",
      shortcut: "D R",
      onSelect: () => {
        onClose();
        onOpenUpload?.();
      },
      icon: IconUpload,
    },
    {
      id: "case-fda",
      category: "Case",
      title: "CASE-BIO-09: FDA PI Sign-Off Contradiction",
      subtitle: "Contradiction between Form 1572 and Vendor Amendment 3",
      href: "/app/investigations",
      icon: IconInvestigation,
    },
    {
      id: "record-cso",
      category: "Record",
      title: "DOC-01: CSO-Departure-Charter-2024.pdf",
      subtitle: "Dr. Eleanor Vance transition agreement and milestones",
      href: "/app/archive",
      icon: IconArchive,
    },
    {
      id: "nav-settings",
      category: "Navigation",
      title: "Workspace Settings",
      subtitle: "Configuration, database telemetry, and instance specs",
      href: "/app/settings",
      icon: IconSettings,
    },
  ];

  const filtered = commands.filter((cmd) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.subtitle.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Triggers open if controlled externally
        }
      }
      if (isOpen && e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSelect = (item: CommandItem) => {
    if (item.onSelect) {
      item.onSelect();
    } else if (item.href) {
      router.push(item.href);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-carbon/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="relative w-full max-w-xl bg-raw-paper-light border-2 border-carbon shadow-brutal-lg overflow-hidden z-10"
        role="dialog"
        aria-modal="true"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b-2 border-carbon bg-raw-paper">
          <IconSearch size={18} className="text-carbon/60" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, route number, or search archive records..."
            className="flex-1 bg-transparent border-none text-carbon text-sm font-mono placeholder:text-carbon/40 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % filtered.length);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
              } else if (e.key === "Enter" && filtered[selectedIndex]) {
                e.preventDefault();
                handleSelect(filtered[selectedIndex]);
              }
            }}
          />
          <button
            onClick={onClose}
            className="p-1 text-carbon/60 hover:text-signal-orange"
            aria-label="Close"
          >
            <IconClose size={16} />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-carbon/10">
          {filtered.length === 0 ? (
            <div className="p-8 text-center font-mono text-xs text-carbon/50 uppercase">
              No matching commands or institutional records found.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = selectedIndex === idx;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left p-2.5 flex items-center justify-between gap-3 text-xs font-mono transition-colors ${
                    isSelected
                      ? "bg-carbon text-raw-paper"
                      : "text-carbon hover:bg-concrete/40"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-6 h-6 flex items-center justify-center border shrink-0 ${
                        isSelected
                          ? "bg-signal-orange text-raw-paper border-carbon"
                          : "bg-concrete text-carbon border-carbon"
                      }`}
                    >
                      <Icon size={12} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold uppercase truncate">{item.title}</div>
                      <div
                        className={`text-[11px] truncate ${
                          isSelected ? "text-raw-paper/70" : "text-carbon/60"
                        }`}
                      >
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.5 border ${
                        isSelected
                          ? "border-raw-paper/40 text-raw-paper/80"
                          : "border-carbon/30 text-carbon/50"
                      }`}
                    >
                      {item.category}
                    </span>
                    {item.shortcut && (
                      <kbd
                        className={`text-[10px] px-1.5 py-0.5 border font-mono ${
                          isSelected
                            ? "bg-carbon-surface text-signal-orange border-carbon"
                            : "bg-concrete/60 text-carbon border-carbon/40"
                        }`}
                      >
                        {item.shortcut}
                      </kbd>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-2.5 px-4 bg-concrete/40 border-t-2 border-carbon flex items-center justify-between text-[11px] font-mono text-carbon/70">
          <div className="flex items-center gap-3">
            <span>[↑↓ Navigate]</span>
            <span>[↵ Select]</span>
            <span>[Esc Close]</span>
          </div>
          <span className="text-signal-orange font-bold">// RELAY COMMAND BUS</span>
        </div>
      </div>
    </div>
  );
};

