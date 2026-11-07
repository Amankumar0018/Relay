"use client";

import React from "react";
import Link from "next/link";
import { PublicNav } from "@/components/public/PublicNav";
import { PublicFooter } from "@/components/public/PublicFooter";
import { Button } from "@/components/ui/Button";
import { EvidenceBadge } from "@/components/evidence/EvidenceBadge";
import { IndustrialCursor } from "@/components/ui/IndustrialCursor";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import {
  IconDatabase,
  IconShield,
  IconDocument,
  IconArrowRight,
} from "@/components/ui/Icons";

export default function PlatformPage() {
  return (
    <div className="min-h-screen flex flex-col bg-raw-paper text-carbon selection:bg-signal-orange selection:text-raw-paper font-sans relative">
      <IndustrialCursor />
      <PublicNav />

      <main className="flex-1">
        {/* Header Masthead */}
        <section className="border-b-2 border-carbon pt-12 sm:pt-16 pb-10 sm:pb-12 px-6 sm:px-10 lg:px-16 bg-raw-paper-light">
          <ScrollReveal variant="industrial">
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2.5 px-3 py-1 bg-carbon text-raw-paper font-mono text-xs uppercase tracking-widest border border-carbon">
                <span className="w-2 h-2 bg-signal-orange" />
                <span>ARCHITECTURAL SPECIFICATION</span>
              </div>
              <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-carbon">
                An analytical engine for institutional memory
              </h1>
              <p className="text-sm sm:text-base text-carbon/80 leading-relaxed max-w-3xl font-sans">
                Relay combines deterministic document extraction, multi-agent cross-examination, and direct cryptographic provenance to guarantee that no organizational transition occurs in the dark.
              </p>
            </div>
          </ScrollReveal>
        </section>

        {/* Pillar 01: Ingestion & Document Intelligence */}
        <section className="py-12 sm:py-16 px-6 sm:px-10 lg:px-16 border-b-2 border-carbon bg-raw-paper">
          <ScrollReveal variant="editorial">
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="space-y-2">
                <span className="font-mono text-xs uppercase font-bold text-signal-orange block">
                  PILLAR 01 // EXTRACTION
                </span>
                <h2 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-carbon">
                  Ingestion & Document Intelligence
                </h2>
                <p className="text-sm sm:text-base text-carbon/80 max-w-2xl leading-relaxed">
                  Relay ingests organizational records without altering their underlying structure, establishing a permanent, searchable institutional knowledge repository.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 border-2 border-carbon bg-raw-paper-light space-y-3 shadow-brutal hover:-translate-y-1 transition-transform">
                  <IconDocument size={24} className="text-signal-orange" />
                  <h3 className="font-display font-black text-base uppercase text-carbon">
                    Multi-Format Parsing
                  </h3>
                  <p className="text-xs sm:text-sm text-carbon/80 font-sans leading-relaxed">
                    Directly extracts textual structures, markdown hierarchy, and tabular data from PDF, DOCX, and TXT archives.
                  </p>
                </div>

                <div className="p-6 border-2 border-carbon bg-raw-paper-light space-y-3 shadow-brutal hover:-translate-y-1 transition-transform">
                  <IconDatabase size={24} className="text-signal-orange" />
                  <h3 className="font-display font-black text-base uppercase text-carbon">
                    Deterministic Entity Triples
                  </h3>
                  <p className="text-xs sm:text-sm text-carbon/80 font-sans leading-relaxed">
                    Identifies explicit relationships (reporting lines, renewal triggers, spend authorities) as structured triples.
                  </p>
                </div>

                <div className="p-6 border-2 border-carbon bg-raw-paper-light space-y-3 shadow-brutal hover:-translate-y-1 transition-transform">
                  <IconShield size={24} className="text-signal-orange" />
                  <h3 className="font-display font-black text-base uppercase text-carbon">
                    Cryptographic Anchors
                  </h3>
                  <p className="text-xs sm:text-sm text-carbon/80 font-sans leading-relaxed">
                    Every extracted claim preserves character-level start and end coordinates into the original source file with SHA-256 integrity hashes.
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* Pillar 02: The Evidence Taxonomy */}
        <section className="py-12 sm:py-16 px-6 sm:px-10 lg:px-16 border-b-2 border-carbon bg-raw-paper-light">
          <ScrollReveal variant="industrial">
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="space-y-2">
                <span className="font-mono text-xs uppercase font-bold text-signal-orange block">
                  PILLAR 02 // RIGOR
                </span>
                <h2 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-carbon">
                  The Multi-Tier Evidence Taxonomy
                </h2>
                <p className="text-sm sm:text-base text-carbon/80 max-w-2xl leading-relaxed">
                  Unlike traditional knowledge bases that treat all statements equally, Relay tags every assertion with an evidence classification.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                <div className="p-5 border-2 border-carbon bg-raw-paper space-y-2.5 shadow-brutal">
                  <EvidenceBadge status="evidence-backed" />
                  <p className="text-xs sm:text-sm text-carbon/80 font-sans leading-relaxed">
                    Ground-truth factual claims backed by verbatim character quotes from authoritative documents.
                  </p>
                </div>

                <div className="p-5 border-2 border-carbon bg-raw-paper space-y-2.5 shadow-brutal">
                  <EvidenceBadge status="inferred" />
                  <p className="text-xs sm:text-sm text-carbon/80 font-sans leading-relaxed">
                    Derived logically from adjacent context or patterns, but lacking an explicit, unequivocal primary citation.
                  </p>
                </div>

                <div className="p-5 border-2 border-carbon bg-raw-paper space-y-2.5 shadow-brutal">
                  <EvidenceBadge status="missing" />
                  <p className="text-xs sm:text-sm text-carbon/80 font-sans leading-relaxed">
                    Referenced in other records (e.g. &ldquo;See Schedule B&rdquo;) but absent from the institutional archive.
                  </p>
                </div>

                <div className="p-5 border-2 border-carbon bg-raw-paper space-y-2.5 shadow-brutal">
                  <EvidenceBadge status="conflicting" />
                  <p className="text-xs sm:text-sm text-carbon/80 font-sans leading-relaxed">
                    Two or more authoritative records make contradictory assertions (e.g. differing budget totals or conflicting sign-off owners).
                  </p>
                </div>

                <div className="p-5 border-2 border-carbon bg-raw-paper space-y-2.5 shadow-brutal">
                  <EvidenceBadge status="pending-review" />
                  <p className="text-xs sm:text-sm text-carbon/80 font-sans leading-relaxed">
                    Surfaced during automated pipeline processing and awaiting human adjudication at the Switch review desk.
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* CTA */}
        <section className="py-14 sm:py-16 px-6 sm:px-10 lg:px-16 bg-carbon text-raw-paper text-center">
          <ScrollReveal variant="editorial">
            <div className="max-w-2xl mx-auto space-y-4">
              <h2 className="font-display font-black text-2xl sm:text-4xl uppercase tracking-tight text-raw-paper">
                Experience Relay in action
              </h2>
              <p className="text-sm sm:text-base text-raw-paper/80 font-sans leading-relaxed">
                Open the live Acme BioSystems transition workspace and inspect real cross-examination results.
              </p>
              <div className="pt-3">
                <Link href="/app">
                  <Button variant="signal" size="lg" magnetic={true} data-cursor="WORKSPACE" className="px-6 py-3 text-sm font-bold">
                    Enter Organizational Workspace
                    <IconArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
