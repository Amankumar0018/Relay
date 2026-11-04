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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-carbon pb-4">
        <div>
          <span className="font-mono text-xs uppercase font-bold text-signal-orange">
            // CONFIGURATION MODULE
          </span>
          <h2 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-carbon">
            Workspace Settings & Telemetry
          </h2>
          <p className="font-mono text-xs text-carbon/70 uppercase">
            LOCAL-FIRST DATA SPECIFICATIONS, TRANSITION PARAMETERS, AND REPOSITORY TELEMETRY
          </p>
        </div>

        {saved && (
          <div className="px-3 py-1 bg-industrial-green text-raw-paper font-mono text-xs font-bold border border-carbon flex items-center gap-1.5">
            <IconCheck size={14} />
            <span>CONFIG SAVED</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Organization Scope */}
        <div className="border-2 border-carbon bg-raw-paper-light p-6 space-y-4 shadow-brutal">
          <div className="border-b-2 border-carbon pb-3">
            <h3 className="font-display font-bold text-base uppercase text-carbon">
              Organizational Node Parameters
            </h3>
            <p className="font-mono text-xs text-carbon/70">
              Active enterprise entity and transition milestone schedule.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className="space-y-1">
              <label className="font-bold text-carbon uppercase block">
                ORGANIZATION IDENTIFIER
              </label>
              <input
                type="text"
                defaultValue="Acme BioSystems Inc."
                className="w-full p-2.5 bg-raw-paper border-2 border-carbon text-carbon font-mono text-xs focus:outline-none focus:border-signal-orange"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-carbon uppercase block">
                TRANSITION CASE DESIGNATION
              </label>
              <input
                type="text"
                defaultValue="NODE-04: CSO Executive Transition 2024"
                className="w-full p-2.5 bg-raw-paper border-2 border-carbon text-carbon font-mono text-xs focus:outline-none focus:border-signal-orange"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-carbon uppercase block">
                OUTGOING AUTHORITY CONTACT
              </label>
              <input
                type="text"
                defaultValue="Dr. Eleanor Vance (e.vance@acme-bio.internal)"
                className="w-full p-2.5 bg-raw-paper border-2 border-carbon text-carbon font-mono text-xs focus:outline-none focus:border-signal-orange"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-carbon uppercase block">
                INCOMING SUCCESSOR CONTACT
              </label>
              <input
                type="text"
                defaultValue="Dr. Marcus Thorne (m.thorne@acme-bio.internal)"
                className="w-full p-2.5 bg-raw-paper border-2 border-carbon text-carbon font-mono text-xs focus:outline-none focus:border-signal-orange"
              />
            </div>
          </div>
        </div>

        {/* Database & Storage Telemetry */}
        <div className="border-2 border-carbon bg-raw-paper-light p-6 space-y-4 shadow-brutal">
          <div className="border-b-2 border-carbon pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-base uppercase text-carbon">
                Persistent Database Telemetry
              </h3>
              <p className="font-mono text-xs text-carbon/70">
                Containerized SQLite engine running on Docker host volume.
              </p>
            </div>
            <span className="font-mono text-xs px-2 py-0.5 bg-industrial-green text-raw-paper font-bold uppercase">
              LOCAL WAL ENFORCED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div className="p-3 bg-raw-paper border border-carbon space-y-1">
              <span className="text-[10px] text-carbon/60 uppercase font-bold block">
                DATABASE PATH
              </span >
              <span className="font-bold text-carbon block">/backend/data/relay.db</span>
              <span className="text-[10px] text-industrial-green block">Mounted Volume</span>
            </div>

            <div className="p-3 bg-raw-paper border border-carbon space-y-1">
              <span className="text-[10px] text-carbon/60 uppercase font-bold block">
                JOURNAL MODE
              </span>
              <span className="font-bold text-carbon block">WAL (Write-Ahead Log)</span>
              <span className="text-[10px] text-industrial-green block">Concurrent Reads</span>
            </div>

            <div className="p-3 bg-raw-paper border border-carbon space-y-1">
              <span className="text-[10px] text-carbon/60 uppercase font-bold block">
                FOREIGN KEYS
              </span>
              <span className="font-bold text-carbon block">PRAGMA foreign_keys = ON</span>
              <span className="text-[10px] text-industrial-green block">Referential Integrity</span>
            </div>
          </div>
        </div>

        {/* Save Actions */}
        <div className="flex justify-end pt-2">
          <Button variant="signal" size="md" type="submit">
            Save Workspace Configuration
          </Button>
        </div>
      </form>
    </div>
  );
}
