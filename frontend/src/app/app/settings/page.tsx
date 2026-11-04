"use client";

import React, { useState } from "react";
import {
  IconSettings,
  IconBuilding,
  IconCheck,
  IconDocument,
  IconUser,
} from "@/components/ui/Icons";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function WorkspaceSettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="pb-4 border-b border-rule">
        <h1 className="text-xl font-serif font-semibold text-ink">
          Workspace Settings
        </h1>
        <p className="text-xs text-ink-secondary mt-0.5">
          Configure organization identity, persistent database connection, and role transition contacts.
        </p>
      </div>

      {saved && (
        <div className="p-3 rounded bg-olive-light border border-olive-border text-xs text-olive-dark flex items-center gap-2">
          <IconCheck size={14} />
          <span>Workspace configuration saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Workspace Identity */}
        <Card>
          <CardHeader>
            <CardTitle>Organization Identity</CardTitle>
            <p className="text-xs text-ink-secondary mt-0.5">
              The primary organizational entity and transition scope.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-ink block">Organization Name</label>
              <input
                type="text"
                defaultValue="Acme BioSystems"
                className="w-full p-2 text-xs rounded border border-rule bg-paper text-ink focus:outline-none focus:ring-1 focus:ring-olive"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-ink block">Department / Transition Scope</label>
              <input
                type="text"
                defaultValue="Discovery Research Division"
                className="w-full p-2 text-xs rounded border border-rule bg-paper text-ink focus:outline-none focus:ring-1 focus:ring-olive"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-ink block">Transition Effective Date</label>
              <input
                type="date"
                defaultValue="2026-11-16"
                className="w-full sm:w-60 p-2 text-xs rounded border border-rule bg-paper text-ink focus:outline-none focus:ring-1 focus:ring-olive font-sans"
              />
            </div>
          </CardContent>
        </Card>

        {/* Database & Persistent Engine */}
        <Card>
          <CardHeader>
            <CardTitle>Persistent Storage & Backend Engine</CardTitle>
            <p className="text-xs text-ink-secondary mt-0.5">
              Local persistent storage configuration.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="p-3 rounded bg-paper border border-rule space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between text-ink-secondary">
                <span>Database Engine:</span>
                <span className="text-ink">SQLite 3.x (WAL Enabled)</span>
              </div>
              <div className="flex justify-between text-ink-secondary">
                <span>Database URL:</span>
                <span className="text-ink">sqlite:///./relay.db</span>
              </div>
              <div className="flex justify-between text-ink-secondary">
                <span>Foreign Keys Pragma:</span>
                <span className="text-olive">Enforced</span>
              </div>
              <div className="flex justify-between text-ink-secondary">
                <span>FastAPI Service Host:</span>
                <span className="text-ink">http://localhost:8000</span>
              </div>
            </div>
            <p className="text-[11px] text-ink-secondary">
              Relay records persist in the mounted `./backend/relay.db` file on your host machine.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="submit" variant="primary" size="sm">
            <span>Save Settings</span>
          </Button>
        </div>
      </form>
    </div>
  );
}

