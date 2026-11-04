import React from "react";
import Link from "next/link";
import { PublicNav } from "@/components/public/PublicNav";
import { PublicFooter } from "@/components/public/PublicFooter";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-raw-paper text-carbon selection:bg-signal-orange selection:text-raw-paper font-sans">
      <PublicNav />

      <main className="flex-1 py-16 px-4 sm:px-6">
        <article className="max-w-4xl mx-auto space-y-8">
          <header className="border-b-2 border-carbon pb-6 space-y-2">
            <span className="font-mono text-xs uppercase tracking-widest text-signal-orange font-bold">
              // DATA GOVERNANCE & SOVEREIGNTY
            </span>
            <h1 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-carbon">
              Privacy Policy & Data Sovereignty
            </h1>
            <p className="font-mono text-xs text-carbon/60 uppercase">
              EFFECTIVE DATE: NOVEMBER 4, 2024 • VERSION 2.0.0
            </p>
          </header>

          <div className="space-y-6 text-xs sm:text-sm text-carbon/90 leading-relaxed font-sans">
            <section className="space-y-2 p-5 border-2 border-carbon bg-raw-paper-light">
              <h2 className="font-display font-bold text-base uppercase text-carbon">
                1. Architectural Foundations: Local-First Data Sovereignty
              </h2>
              <p>
                Relay is engineered as an organizational continuity platform built to run within your organization&rsquo;s controlled compute infrastructure. Unlike conventional SaaS products that ingest confidential corporate archives into centralized multi-tenant databases, Relay deploys via containerized environments (Docker) and persists all knowledge locally using an isolated SQLite database engine with Write-Ahead Logging (WAL) and strict foreign-key enforcement.
              </p>
              <p>
                Your institutional documents, board minutes, personnel records, regulatory audits, and responsibility graphs reside on your designated persistent storage mounts. Relay Systems does not host, mirror, or inspect your primary organizational records.
              </p>
            </section>

            <section className="space-y-2 p-5 border-2 border-carbon bg-raw-paper-light">
              <h2 className="font-display font-bold text-base uppercase text-carbon">
                2. Information Processing & Document Extraction
              </h2>
              <p>
                When you stage records in the Relay Knowledge Archive (such as PDF, DOCX, or TXT files), processing occurs locally within the backend container.
              </p>
              <ul className="list-disc pl-5 space-y-1 font-mono text-xs text-carbon">
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

            <section className="space-y-2 p-5 border-2 border-carbon bg-raw-paper-light">
              <h2 className="font-display font-bold text-base uppercase text-carbon">
                3. Artificial Intelligence & Model Invocation Boundaries
              </h2>
              <p>
                When Relay&rsquo;s specialized continuity agents (Knowledge Extractor, Gap Detective, Continuity Analyst, Handover Architect) execute analytical pipelines:
              </p>
              <ul className="list-disc pl-5 space-y-1 font-mono text-xs text-carbon">
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

            <section className="space-y-2 p-5 border-2 border-carbon bg-raw-paper-light">
              <h2 className="font-display font-bold text-base uppercase text-carbon">
                4. Telemetry, Tracking, and Cookies
              </h2>
              <p>
                Relay does not implement third-party tracking scripts, marketing pixels, behavioral telemetry, or commercial advertising analytics. We believe organizational transitions involve the most sensitive corporate assets; tracking user behavior inside an institutional archive is incompatible with our security principles.
              </p>
            </section>

            <section className="space-y-2 p-5 border-2 border-carbon bg-raw-paper-light">
              <h2 className="font-display font-bold text-base uppercase text-carbon">
                5. Data Retention, Purging, and Deletion
              </h2>
              <p>
                Because Relay stores data on your local host volume (e.g. <code>backend/data/relay.db</code>), your administrators retain complete, unilateral authority over data retention. You may prune documents, archive transition cases, or purge the database volume entirely using standard container commands:
              </p>
              <div className="p-3 bg-carbon text-raw-paper font-mono text-xs">
                docker compose down -v
              </div>
            </section>
          </div>
        </article>
      </main>

      <PublicFooter />
    </div>
  );
}
