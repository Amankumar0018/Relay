import React from "react";
import Link from "next/link";
import { PublicNav } from "@/components/public/PublicNav";
import { PublicFooter } from "@/components/public/PublicFooter";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink selection:bg-copper-light selection:text-ink">
      <PublicNav />

      <main className="flex-1 py-16 px-4 sm:px-6">
        <article className="max-w-3xl mx-auto space-y-8">
          <header className="border-b border-rule pb-6 space-y-2">
            <span className="text-[11px] font-sans uppercase tracking-widest text-copper font-medium">
              Institutional Privacy Notice
            </span>
            <h1 className="font-serif italic text-3xl sm:text-4xl font-bold text-ink">
              Privacy Policy & Data Sovereignty
            </h1>
            <p className="text-xs font-mono text-ink-secondary">
              Effective Date: November 4, 2024 • Version 1.0.0
            </p>
          </header>

          <div className="space-y-6 text-xs sm:text-sm text-ink-secondary leading-relaxed font-sans">
            <section className="space-y-2">
              <h2 className="font-serif font-bold text-base text-ink">
                1. Architectural Foundations: Local-First Data Sovereignty
              </h2>
              <p>
                Relay is engineered as an organizational continuity platform built to run within your organization’s controlled compute infrastructure. Unlike conventional SaaS products that ingest confidential corporate archives into centralized multi-tenant databases, Relay deploys via containerized environments (Docker) and persists all knowledge locally using an isolated SQLite database engine with Write-Ahead Logging (WAL) and strict foreign-key enforcement.
              </p>
              <p>
                Your institutional documents, board minutes, personnel records, regulatory audits, and responsibility graphs reside on your designated persistent storage mounts. Relay Systems does not host, mirror, or inspect your primary organizational records.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif font-bold text-base text-ink">
                2. Information Processing & Document Extraction
              </h2>
              <p>
                When you stage records in the Relay Knowledge Archive (such as PDF, DOCX, or TXT files), processing occurs locally within the backend container. During Milestone 1 and Milestone 2 operations:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Client-Side Validation:</strong> Files are validated for size (up to 25MB) and MIME type directly in your browser session before submission.
                </li>
                <li>
                  <strong>Cryptographic Integrity:</strong> Ingested files receive SHA-256 hashes to guarantee data provenance and prevent tampering.
                </li>
                <li>
                  <strong>Entity & Citation Triples:</strong> Verbatim text excerpts are indexed strictly for organizational citation and handover cross-referencing.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif font-bold text-base text-ink">
                3. Artificial Intelligence & Model Invocation Boundaries
              </h2>
              <p>
                When Relay’s specialized continuity agents (Knowledge Extractor, Continuity Detective, Responsibility Analyst, Dossier Architect) execute analytical pipelines:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Organizational text passages are transmitted solely for ephemeral contextual inference.
                </li>
                <li>
                  Zero customer data is ever permitted to be used for commercial model training, tuning, or evaluation by external LLM vendors.
                </li>
                <li>
                  Self-hosted or air-gapped LLM inference backends can be configured in your environment variables without modifying application business logic.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif font-bold text-base text-ink">
                4. Telemetry, Tracking, and Cookies
              </h2>
              <p>
                Relay does not implement third-party tracking scripts, marketing pixels, behavioral telemetry, or commercial advertising analytics. We believe organizational transitions involve the most sensitive corporate assets; tracking user behavior inside an institutional archive is incompatible with our security principles.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif font-bold text-base text-ink">
                5. Data Retention, Purging, and Deletion
              </h2>
              <p>
                Because Relay stores data on your local host volume (e.g. <code>backend/data/relay.db</code>), your administrators retain complete, unilateral authority over data retention. You may prune documents, archive transition cases, or purge the database volume entirely using standard container commands:
              </p>
              <div className="p-3 bg-paper-secondary border border-rule rounded-sm font-mono text-[11px] text-ink">
                docker compose down -v
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif font-bold text-base text-ink">
                6. Contact & Enterprise Governance
              </h2>
              <p>
                For questions regarding Relay architecture, compliance verification, or air-gapped enterprise deployments, consult your organization&rsquo;s Relay system administrator or review our project documentation.
              </p>
            </section>
          </div>
        </article>
      </main>

      <PublicFooter />
    </div>
  );
}

