import React from "react";
import Link from "next/link";
import { PublicNav } from "@/components/public/PublicNav";
import { PublicFooter } from "@/components/public/PublicFooter";

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink selection:bg-copper-light selection:text-ink">
      <PublicNav />

      <main className="flex-1 py-16 px-4 sm:px-6">
        <article className="max-w-3xl mx-auto space-y-8">
          <header className="border-b border-rule pb-6 space-y-2">
            <span className="text-[11px] font-sans uppercase tracking-widest text-olive font-medium">
              Legal Agreement
            </span>
            <h1 className="font-serif italic text-3xl sm:text-4xl font-bold text-ink">
              Terms & Conditions of Service
            </h1>
            <p className="text-xs font-mono text-ink-secondary">
              Effective Date: November 4, 2024 • Version 1.0.0
            </p>
          </header>

          <div className="space-y-6 text-xs sm:text-sm text-ink-secondary leading-relaxed font-sans">
            <section className="space-y-2">
              <h2 className="font-serif font-bold text-base text-ink">
                1. Acceptance of Terms
              </h2>
              <p>
                By deploying, accessing, or utilizing the Relay platform (the &ldquo;Software&rdquo;), you, on behalf of yourself or the entity you represent (&ldquo;Customer&rdquo; or &ldquo;User&rdquo;), agree to be bound by these Terms and Conditions. If you do not agree to these terms, you must not install or operate the Software.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif font-bold text-base text-ink">
                2. Scope of Software & Intended Use
              </h2>
              <p>
                Relay is an agentic organizational continuity environment engineered to assist organizations in indexing historical records, surfacing conflicting authorities, tracking operational responsibilities, and compiling structured transition dossiers during leadership or personnel changes.
              </p>
              <p>
                The Software operates as an analytical aid. It is designed to assist human decision-makers, not to replace executive, legal, compliance, or regulatory judgment.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif font-bold text-base text-ink">
                3. Customer Data & Intellectual Property Ownership
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Customer Records:</strong> Customer retains exclusive and unencumbered ownership of all documents, files, contracts, board records, and data deposited into the Software.
                </li>
                <li>
                  <strong>Generated Deliverables:</strong> Customer exclusively owns all synthesized transition dossiers, responsibility matrices, and evidence reports produced by the Software.
                </li>
                <li>
                  <strong>Software Rights:</strong> Relay Systems retains all rights, title, and interest in and to the platform codebase, agent orchestration frameworks, user interfaces, and associated documentation.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif font-bold text-base text-ink">
                4. Mandatory Human Verification (Switch Protocol)
              </h2>
              <p>
                The Software employs specialized multi-agent models to categorize evidence and detect potential knowledge gaps. However, machine-generated inferences may contain inaccuracies, hallucinations, or incomplete context.
              </p>
              <p>
                Customer agrees that no legal action, financial transaction, employment decision, or contractual renewal termination shall be executed solely in reliance on automated agent output without independent human verification through the Switch review desk.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif font-bold text-base text-ink">
                5. Local Deployment & Infrastructure Responsibilities
              </h2>
              <p>
                When deployed on customer-managed hardware or virtual private clouds, Customer is solely responsible for maintaining appropriate infrastructure security, database backup routines, container access controls, and network firewalls surrounding the Docker host and persistent SQLite storage volumes.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif font-bold text-base text-ink">
                6. Limitation of Liability
              </h2>
              <p>
                To the maximum extent permitted by applicable law, Relay Systems and its contributors shall not be liable for any indirect, incidental, consequential, special, or punitive damages arising out of or related to organizational transition failures, missed contract deadlines, regulatory penalties, or data loss occurring during system use.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif font-bold text-base text-ink">
                7. Governing Law
              </h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Customer is incorporated, without regard to conflict of law principles.
              </p>
            </section>
          </div>
        </article>
      </main>

      <PublicFooter />
    </div>
  );
}

