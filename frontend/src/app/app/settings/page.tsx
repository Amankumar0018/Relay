"use client";

import React, { useState } from "react";
import {
  IconSettings,
  IconCheck,
  IconDatabase,
  IconShield,
  IconTerminal,
} from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export default function WorkspaceSettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl font-sans">
      {/* Header */}
      <ScrollReveal variant="industrial">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-carbon pb-4">
          <div>
            <span className="font-mono text-xs uppercase font-bold text-signal-orange block mb-0.5">
              CONFIGURATION MODULE
            </span>
            <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-carbon">
              Workspace Settings & Telemetry
            </h1>
            <p className="font-mono text-xs text-carbon/70 uppercase mt-0.5">
              LOCAL-FIRST DATA SPECIFICATIONS • TRANSITION PARAMETERS • AUDIT TELEMETRY
            </p>
          </div>

          {saved && (
            <div className="px-3 py-1.5 bg-industrial-green text-raw-paper font-mono text-xs font-bold border border-carbon flex items-center gap-2 shadow-brutal">
              <IconCheck size={14} />
              <span>CONFIG SAVED</span>
            </div>
          )}
        </div>
      </ScrollReveal>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Organization Scope */}
        <ScrollReveal variant="industrial" delay={0.05}>
          <div className="border-2 border-carbon bg-raw-paper-light p-5 sm:p-6 space-y-5 shadow-brutal">
            <div className="border-b-2 border-carbon pb-3">
              <h2 className="font-display font-black text-lg sm:text-xl uppercase text-carbon">
                Organizational Node Parameters
              </h2>
              <p className="text-xs sm:text-sm text-carbon/70 font-sans mt-0.5">
                Active enterprise entity and transition milestone schedule.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-carbon uppercase block text-xs">
                  ORGANIZATION IDENTIFIER
                </label>
                <input
                  type="text"
                  defaultValue="Acme BioSystems Inc."
                  className="w-full p-2.5 bg-raw-paper border-2 border-carbon text-carbon font-mono text-xs sm:text-sm focus:outline-none focus:border-signal-orange"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-carbon uppercase block text-xs">
                  TRANSITION CASE DESIGNATION
                </label>
                <input
                  type="text"
                  defaultValue="NODE-04: CSO Executive Transition 2024"
                  className="w-full p-2.5 bg-raw-paper border-2 border-carbon text-carbon font-mono text-xs sm:text-sm focus:outline-none focus:border-signal-orange"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-carbon uppercase block text-xs">
                  OUTGOING AUTHORITY CONTACT
                </label>
                <input
                  type="text"
                  defaultValue="Dr. Eleanor Vance (e.vance@acme-bio.internal)"
                  className="w-full p-2.5 bg-raw-paper border-2 border-carbon text-carbon font-mono text-xs sm:text-sm focus:outline-none focus:border-signal-orange"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-carbon uppercase block text-xs">
                  INCOMING SUCCESSOR CONTACT
                </label>
                <input
                  type="text"
                  defaultValue="Dr. Marcus Thorne (m.thorne@acme-bio.internal)"
                  className="w-full p-2.5 bg-raw-paper border-2 border-carbon text-carbon font-mono text-xs sm:text-sm focus:outline-none focus:border-signal-orange"
                />
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Local-First Architecture Telemetry */}
        <ScrollReveal variant="editorial" delay={0.1}>
          <div className="border-2 border-carbon bg-raw-paper p-5 sm:p-6 space-y-5 shadow-brutal font-mono text-xs">
            <div className="border-b-2 border-carbon pb-3">
              <h2 className="font-display font-black text-lg sm:text-xl uppercase text-carbon">
                Persistent Engine Specifications
              </h2>
              <p className="text-xs sm:text-sm text-carbon/70 font-sans mt-0.5">
                Local SQLite database and encryption configuration.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-raw-paper-light border border-carbon space-y-1 shadow-brutal">
                <span className="text-carbon/60 uppercase block text-2xs">STORAGE ENGINE</span>
                <span className="font-bold text-sm sm:text-base text-carbon block">SQLite 3.45 (WAL)</span>
                <span className="text-industrial-green text-2xs block">✓ Active &amp; Consistent</span>
              </div>

              <div className="p-3 bg-raw-paper-light border border-carbon space-y-1 shadow-brutal">
                <span className="text-carbon/60 uppercase block text-2xs">INTEGRITY HASH</span>
                <span className="font-bold text-sm sm:text-base text-carbon block">SHA-256 Anchors</span>
                <span className="text-industrial-green text-2xs block">✓ Cryptographic Verified</span>
              </div>

              <div className="p-3 bg-raw-paper-light border border-carbon space-y-1 shadow-brutal">
                <span className="text-carbon/60 uppercase block text-2xs">CLOUD SYNC</span>
                <span className="font-bold text-sm sm:text-base text-carbon block">Disabled (Local)</span>
                <span className="text-signal-orange text-2xs block">🔒 Zero-Retention Mode</span>
              </div>
            </div>
          </div>
        </ScrollReveal>

        <div className="flex justify-end pt-2">
          <Button variant="signal" size="md" type="submit" magnetic={true} data-cursor="SAVE">
            Save Configuration Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
