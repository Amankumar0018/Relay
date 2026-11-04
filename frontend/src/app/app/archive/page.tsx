"use client";

import React, { useState } from "react";
import {
  IconDocument,
  IconSearch,
  IconUpload,
  IconCheck,
  IconAlert,
  IconClose,
  IconInfo,
} from "@/components/ui/Icons";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EvidenceBadge } from "@/components/evidence/EvidenceBadge";
import { FileUploader, StagedFile } from "@/components/upload/FileUploader";

interface ArchiveRecord {
  id: string;
  title: string;
  category: "Charters & Governance" | "Lab & Compliance" | "Vendor Agreements";
  format: "PDF" | "DOCX" | "TXT";
  size: string;
  pages: number;
  extractedEntities: number;
  status: "Indexed & Verified" | "Discrepancy Flagged" | "Staged in Memory";
  date: string;
  sourceAuthority: string;
  summary: string;
  originalExcerpt: string;
  extractedFacts: string[];
  relatedRecords: string[];
}

const ARCHIVE_RECORDS: ArchiveRecord[] = [
  {
    id: "rec-cso-protocol",
    title: "CSO Transition Protocol & Governance Charter v2.4",
    category: "Charters & Governance",
    format: "PDF",
    size: "2.4 MB",
    pages: 42,
    extractedEntities: 34,
    status: "Indexed & Verified",
    date: "Oct 28, 2026",
    sourceAuthority: "Legal & People Operations",
    summary:
      "Defines the formal transfer of scientific governance, lab directorship, and committee chairs from Dr. Marcus Vance to interim leadership.",
    originalExcerpt:
      "Section 3.1: Effective November 16, 2026, the Interim Head of Discovery Research assumes full administrative oversight of discovery laboratories and lab notebook archives.",
    extractedFacts: [
      "Interim Head assumes lab directorship on Nov 16, 2026.",
      "Outgoing CSO maintains advisory role on Scientific Advisory Board through 2027.",
      "Signatory delegation for FDA Bioreactor line must be executed prior to transfer.",
    ],
    relatedRecords: [
      "Phase II Bioreactor GMP Validation Dossier",
      "Executive Committee Resolution on Cloud Migration",
    ],
  },
  {
    id: "rec-bioreactor-spec",
    title: "Phase II Bioreactor GMP Validation Dossier",
    category: "Lab & Compliance",
    format: "PDF",
    size: "8.1 MB",
    pages: 118,
    extractedEntities: 62,
    status: "Indexed & Verified",
    date: "Oct 15, 2026",
    sourceAuthority: "GMP Quality Assurance",
    summary:
      "Full calibration protocol and validation specs for clinical bioreactor line. Mandatory deliverable for Novartis Phase II milestone payment.",
    originalExcerpt:
      "Appendix B: Final system calibration certificate must be signed by the licensed Lab Director in physical presence of the QA Auditor on or before Nov 12, 2026.",
    extractedFacts: [
      "Calibration deadline is Nov 12, 2026 (4 days before formal CSO role transition).",
      "Contingent on continuous liquid nitrogen supply line validation.",
      "Linked to $4.2M Novartis commercial development milestone.",
    ],
    relatedRecords: [
      "CSO Transition Protocol & Governance Charter v2.4",
      "Liquid Nitrogen Supply & Facility SLA (Airgas)",
    ],
  },
  {
    id: "rec-cryo-nitrogen",
    title: "Liquid Nitrogen Supply & Facility SLA (Airgas)",
    category: "Vendor Agreements",
    format: "DOCX",
    size: "1.1 MB",
    pages: 16,
    extractedEntities: 12,
    status: "Discrepancy Flagged",
    date: "Aug 12, 2024",
    sourceAuthority: "Procurement & Facilities",
    summary:
      "Vendor SLA for regular liquid nitrogen delivery for cell line cryo-preservation. Auto-renews Dec 1, 2026. Only Dr. Vance is currently named as authorized signatory.",
    originalExcerpt:
      "Clause 14.2: Notice of renewal or cancellation shall be delivered in writing exclusively to Dr. Marcus Vance (m.vance@acme-bio.internal) thirty days prior to expiration.",
    extractedFacts: [
      "Auto-renewal triggers December 1, 2026.",
      "No secondary corporate contact or deputy signatory is registered on vendor file.",
      "Identified as critical institutional blind spot during transition audit.",
    ],
    relatedRecords: [
      "Phase II Bioreactor GMP Validation Dossier",
    ],
  },
];

export default function KnowledgeArchivePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedRecord, setSelectedRecord] = useState<ArchiveRecord | null>(null);
  const [showUploader, setShowUploader] = useState(false);

  const filtered = ARCHIVE_RECORDS.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.summary.toLowerCase().includes(search.toLowerCase()) ||
      r.sourceAuthority.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || r.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-rule">
        <div>
          <h1 className="text-xl font-serif font-semibold text-ink">
            Knowledge Archive
          </h1>
          <p className="text-xs text-ink-secondary mt-0.5">
            Indexed organizational records, procedural runbooks, and verified primary sources.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowUploader(!showUploader)}
        >
          <IconUpload size={14} />
          <span>{showUploader ? "Close Ingestion" : "Stage Document"}</span>
        </Button>
      </div>

      {showUploader && (
        <Card className="p-4 bg-paper-surface">
          <FileUploader
            onFilesSelected={(files: StagedFile[]) => {
              // Staged
            }}
          />
        </Card>
      )}

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <IconSearch size={14} className="text-ink-secondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search records by title, authority, or excerpt..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-rule bg-paper-surface text-ink placeholder:text-ink-disabled focus:outline-none focus:ring-1 focus:ring-olive font-sans"
          />
        </div>

        <div className="flex items-center gap-1 bg-paper-secondary p-0.5 rounded border border-rule text-xs overflow-x-auto">
          {["All", "Charters & Governance", "Lab & Compliance", "Vendor Agreements"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-2.5 py-1 rounded text-[11px] whitespace-nowrap transition-colors ${
                category === cat
                  ? "bg-paper-surface text-ink font-semibold shadow-xs border border-rule"
                  : "text-ink-secondary hover:text-ink"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Record Table / List */}
      <div className="border border-rule rounded bg-paper-surface overflow-hidden">
        <div className="divide-y divide-rule/70">
          {filtered.map((record) => (
            <div
              key={record.id}
              onClick={() => setSelectedRecord(record)}
              className="p-4 hover:bg-paper-secondary/40 cursor-pointer transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-8 h-8 rounded bg-paper-secondary border border-rule flex items-center justify-center text-ink-secondary shrink-0 mt-0.5">
                  <IconDocument size={16} />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-semibold text-ink truncate">
                      {record.title}
                    </h3>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-paper-secondary text-ink-secondary border border-rule">
                      {record.format}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded border font-sans ${
                        record.status === "Indexed & Verified"
                          ? "bg-olive-light text-olive-dark border-olive-border"
                          : "bg-copper-light text-copper-dark border-copper-border"
                      }`}
                    >
                      {record.status}
                    </span>
                  </div>
                  <p className="text-xs text-ink-secondary line-clamp-1">
                    {record.summary}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-ink-secondary font-sans pt-0.5">
                    <span>Authority: {record.sourceAuthority}</span>
                    <span>•</span>
                    <span>{record.pages} Pages ({record.size})</span>
                    <span>•</span>
                    <span className="text-olive font-medium">
                      {record.extractedEntities} Extracted Entities
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end md:self-center text-xs">
                <span className="text-ink-secondary text-[11px]">
                  {record.date}
                </span>
                <Button variant="outline" size="sm">
                  View Record
                </Button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="p-8 text-center text-xs text-ink-secondary">
              No institutional records match the selected filter.
            </div>
          )}
        </div>
      </div>

      {/* Document Detail Drawer */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          <div
            className="fixed inset-0 bg-ink/40 backdrop-blur-xs"
            onClick={() => setSelectedRecord(null)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-xl h-full bg-paper-surface border-l border-rule p-6 overflow-y-auto z-10 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-rule">
                <div>
                  <span className="text-[10px] uppercase font-mono text-ink-secondary">
                    {selectedRecord.category}
                  </span>
                  <div className="text-xs font-semibold text-ink">
                    Document Detail Dossier
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="p-1 text-ink-secondary hover:text-ink rounded"
                >
                  <IconClose size={16} />
                </button>
              </div>

              <div>
                <h2 className="text-base font-serif font-bold text-ink">
                  {selectedRecord.title}
                </h2>
                <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
                  {selectedRecord.summary}
                </p>
              </div>

              {/* Distinguish Original Document from AI Extracted Information */}
              <div className="p-3.5 rounded bg-paper-secondary border border-rule space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-ink-secondary uppercase tracking-wider">
                  <span>Original Document Text (Verbatim Excerpt)</span>
                  <span className="text-ink-secondary text-[10px] font-mono">Page Verified</span>
                </div>
                <blockquote className="text-xs text-ink font-serif italic border-l-2 border-olive pl-3 leading-relaxed">
                  &ldquo;{selectedRecord.originalExcerpt}&rdquo;
                </blockquote>
              </div>

              <div className="p-3.5 rounded bg-paper-surface border border-rule space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-olive uppercase tracking-wider">
                  <span>AI Extracted Knowledge & Entities</span>
                  <span className="text-[10px] font-sans text-ink-secondary">Awaiting Human Confirmation</span>
                </div>
                <ul className="space-y-1.5 text-xs text-ink-secondary pl-3 list-disc">
                  {selectedRecord.extractedFacts.map((fact, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {fact}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Related Records */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-ink-secondary uppercase tracking-wider block">
                  Cross-Referenced Organizational Records
                </span>
                <div className="space-y-1.5">
                  {selectedRecord.relatedRecords.map((rel, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-paper border border-rule text-xs text-ink flex items-center gap-2"
                    >
                      <IconDocument size={13} className="text-olive shrink-0" />
                      <span>{rel}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-rule flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRecord(null)}
              >
                Close Record
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

