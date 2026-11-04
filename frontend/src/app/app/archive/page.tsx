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
  IconFileText,
} from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { EvidenceBadge } from "@/components/evidence/EvidenceBadge";
import { FileUploader } from "@/components/upload/FileUploader";

interface ArchiveRecord {
  id: string;
  code: string;
  title: string;
  category: "Charters & Governance" | "Regulatory & Compliance" | "Vendor Agreements";
  format: "PDF" | "DOCX" | "TXT";
  size: string;
  pages: number;
  extractedEntities: number;
  status: "Indexed & Verified" | "Discrepancy Flagged" | "Staged in Memory";
  date: string;
  sourceAuthority: string;
  summary: string;
  sha256: string;
  originalExcerpt: string;
  extractedFacts: string[];
  relatedRecords: string[];
}

const ARCHIVE_RECORDS: ArchiveRecord[] = [
  {
    id: "rec-cso-charter",
    code: "DOC-CSO-2024",
    title: "CSO Transition Protocol & Governance Charter v2.4.pdf",
    category: "Charters & Governance",
    format: "PDF",
    size: "2.4 MB",
    pages: 42,
    extractedEntities: 34,
    status: "Indexed & Verified",
    date: "Oct 28, 2024",
    sourceAuthority: "Legal & People Operations",
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    summary:
      "Defines the formal transfer of scientific governance, lab directorship, and committee chairs from Dr. Eleanor Vance to incoming leadership.",
    originalExcerpt:
      "Section 3.1: Effective November 30, 2024, the Interim Head of Discovery Research assumes full administrative oversight of discovery laboratories, IND protocols, and lab notebook archives. Dr. Eleanor Vance retains emeritus advisory rights on the Scientific Advisory Board through 2025.",
    extractedFacts: [
      "Interim Head assumes lab directorship on Nov 30, 2024.",
      "Outgoing CSO maintains advisory role on Scientific Advisory Board through 2025.",
      "Signatory delegation for FDA Bioreactor line must be executed prior to transfer.",
    ],
    relatedRecords: [
      "FDA Form 1572 Principal Investigator Registry",
      "Spectrometry Lab Services Master Agreement",
    ],
  },
  {
    id: "rec-fda-1572",
    code: "DOC-FDA-1572",
    title: "FDA Form 1572 Principal Investigator Registry.pdf",
    category: "Regulatory & Compliance",
    format: "PDF",
    size: "4.1 MB",
    pages: 28,
    extractedEntities: 24,
    status: "Discrepancy Flagged",
    date: "Sep 18, 2024",
    sourceAuthority: "Regulatory Compliance Group",
    sha256: "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
    summary:
      "Primary regulatory submission for Phase II Oncology clinical trials (Protocols ONCO-101 to ONCO-108).",
    originalExcerpt:
      "Box 1: Sponsor Representative designated as Dr. Eleanor Vance. Box 6: Clinical protocol trial execution managed by Dr. Marcus Thorne (Site Lead). Any change in primary sponsor representative requires formal re-submission within 30 days of personnel modification.",
    extractedFacts: [
      "FDA Form 1572 currently lists Dr. Eleanor Vance as primary sponsor representative.",
      "Direct conflict with Vendor Lab Execution MSA Amend. 3 (which names Dr. Thorne).",
      "Re-submission deadline is November 1, 2024 to avoid clinical trial hold.",
    ],
    relatedRecords: [
      "CSO Transition Protocol & Governance Charter v2.4",
      "Spectrometry Lab Services Master Agreement",
    ],
  },
  {
    id: "rec-spectrometry-msa",
    code: "DOC-MSA-82",
    title: "Spectrometry Lab Services Master Agreement.docx",
    category: "Vendor Agreements",
    format: "DOCX",
    size: "1.8 MB",
    pages: 18,
    extractedEntities: 18,
    status: "Discrepancy Flagged",
    date: "Aug 12, 2023",
    sourceAuthority: "Procurement & Facilities",
    sha256: "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
    summary:
      "Master service agreement for external spectrometry validation with Apex BioAnalytical Labs Inc.",
    originalExcerpt:
      "Section 8.2: Automatic 12-month extension activates on November 15, 2024 unless formal written notice of termination is delivered 30 days prior. Annual commitment fee: $140,000. Authorized signatory: Dr. Eleanor Vance.",
    extractedFacts: [
      "Vendor: Apex BioAnalytical Labs Inc.",
      "Contract auto-renews on November 15, 2024 for $140,000.",
      "Written notice window closes October 15, 2024.",
      "Only Dr. Vance is currently named as authorized signatory.",
    ],
    relatedRecords: [
      "CSO Transition Protocol & Governance Charter v2.4",
      "FDA Form 1572 Principal Investigator Registry",
    ],
  },
  {
    id: "rec-patent-c409",
    code: "DOC-PAT-409",
    title: "Compound C-409 Patent Filing Memorandum RevB.pdf",
    category: "Regulatory & Compliance",
    format: "PDF",
    size: "6.2 MB",
    pages: 36,
    extractedEntities: 42,
    status: "Discrepancy Flagged",
    date: "Jul 22, 2024",
    sourceAuthority: "IP & Legal Operations",
    sha256: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
    summary:
      "Chain-of-title documentation for novel kinase inhibitor compound C-409.",
    originalExcerpt:
      "Exhibit C (Co-inventor assignment declaration) specifies assignment of priority PCT rights to Acme BioSystems Inc. Signed counterpart from Dr. Vance and Dr. Thorne required prior to national phase entry.",
    extractedFacts: [
      "Exhibit C referenced in text is absent from archival repository.",
      "Critical chain-of-title gap for European patent filing.",
      "National phase entry deadline: December 15, 2024.",
    ],
    relatedRecords: [
      "CSO Transition Protocol & Governance Charter v2.4",
    ],
  },
];

export default function KnowledgeArchivePage() {
  const [selectedRecordId, setSelectedRecordId] = useState<string>("rec-cso-charter");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const categories = [
    "ALL",
    "Charters & Governance",
    "Regulatory & Compliance",
    "Vendor Agreements",
  ];

  const filteredRecords = ARCHIVE_RECORDS.filter((rec) => {
    const matchesSearch =
      rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "ALL" || rec.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const selectedRecord =
    ARCHIVE_RECORDS.find((r) => r.id === selectedRecordId) || ARCHIVE_RECORDS[0];

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-carbon pb-4">
        <div>
          <span className="font-mono text-xs uppercase font-bold text-signal-orange">
            // REPOSITORY MODULE
          </span>
          <h2 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-carbon">
            Institutional Knowledge Archive
          </h2>
          <p className="font-mono text-xs text-carbon/70 uppercase">
            {ARCHIVE_RECORDS.length} VERIFIED ARCHIVAL RECORDS • LOCAL PERSISTENT STORAGE
          </p>
        </div>

        <Button variant="signal" size="sm" onClick={() => setUploadModalOpen(true)}>
          <IconUpload size={14} />
          <span>+ Deposit New Record</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-2 border-carbon bg-raw-paper-light p-3">
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-raw-paper border border-carbon flex-1 max-w-md">
          <IconSearch size={14} className="text-carbon/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by code, title, or keywords..."
            className="w-full bg-transparent border-none text-xs font-mono text-carbon placeholder:text-carbon/40 focus:outline-none"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 uppercase text-[11px] font-bold border transition-colors ${
                selectedCategory === cat
                  ? "bg-carbon text-raw-paper border-carbon shadow-brutal"
                  : "bg-raw-paper text-carbon border-carbon/40 hover:border-carbon"
              }`}
            >
              {cat === "ALL" ? "[ALL]" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Split-Screen Document Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Document Listing (5 cols) */}
        <div className="lg:col-span-5 border-2 border-carbon bg-raw-paper-light divide-y-2 divide-carbon shadow-brutal">
          <div className="p-3 bg-raw-paper border-b-2 border-carbon flex items-center justify-between font-mono text-xs font-bold text-carbon">
            <span>INDEXED RECORDS ({filteredRecords.length})</span>
            <span className="text-[10px] text-signal-orange">SELECT TO INSPECT</span>
          </div>

          <div className="max-h-[640px] overflow-y-auto divide-y divide-carbon/20">
            {filteredRecords.map((doc) => {
              const isSelected = doc.id === selectedRecordId;

              return (
                <button
                  key={doc.id}
                  onClick={() => setSelectedRecordId(doc.id)}
                  className={`w-full text-left p-4 transition-all text-xs font-mono ${
                    isSelected
                      ? "bg-carbon text-raw-paper border-l-4 border-signal-orange"
                      : "bg-raw-paper-light text-carbon hover:bg-concrete/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 border ${
                        isSelected
                          ? "bg-signal-orange text-raw-paper border-carbon"
                          : "bg-concrete text-carbon border-carbon"
                      }`}
                    >
                      {doc.code}
                    </span>
                    <span className="text-[10px] opacity-70 uppercase font-bold">
                      {doc.format} • {doc.size}
                    </span>
                  </div>

                  <h3 className="font-sans font-bold text-sm leading-snug line-clamp-2">
                    {doc.title}
                  </h3>

                  <p
                    className={`font-sans text-xs mt-1.5 line-clamp-2 ${
                      isSelected ? "text-raw-paper/80" : "text-carbon/70"
                    }`}
                  >
                    {doc.summary}
                  </p>

                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-current/10 text-[10px]">
                    <span className="opacity-70">{doc.date}</span>
                    <span
                      className={`font-bold uppercase ${
                        doc.status.includes("Flagged")
                          ? isSelected
                            ? "text-signal-orange"
                            : "text-signal-orange"
                          : isSelected
                          ? "text-industrial-green-light"
                          : "text-industrial-green"
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Detailed Document Inspector (7 cols) */}
        <div className="lg:col-span-7 border-2 border-carbon bg-raw-paper p-6 space-y-6 shadow-brutal">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-carbon pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 bg-carbon text-raw-paper font-bold">
                  {selectedRecord.code}
                </span>
                <span className="font-mono text-xs text-signal-orange font-bold uppercase">
                  {selectedRecord.category}
                </span>
              </div>
              <h3 className="font-display font-black text-lg sm:text-xl uppercase text-carbon leading-snug">
                {selectedRecord.title}
              </h3>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center font-mono text-xs">
              <span className="px-2 py-1 bg-concrete border border-carbon text-carbon font-bold">
                {selectedRecord.pages} PAGES
              </span>
              <span className="px-2 py-1 bg-concrete border border-carbon text-carbon font-bold">
                {selectedRecord.extractedEntities} TRIPLES
              </span>
            </div>
          </div>

          {/* Cryptographic SHA-256 Provenance Box */}
          <div className="p-3 bg-raw-paper-light border border-carbon font-mono text-xs space-y-1">
            <div className="flex items-center justify-between text-[10px] text-carbon/60 uppercase font-bold">
              <span>CRYPTOGRAPHIC PROVENANCE</span>
              <span>SHA-256 VERIFIED</span>
            </div>
            <p className="text-[11px] text-carbon break-all font-mono">
              {selectedRecord.sha256}
            </p>
          </div>

          {/* Original Verbatim Document Excerpt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase font-bold text-carbon">
                VERBATIM DOCUMENT EXCERPT
              </span>
              <span className="font-mono text-[10px] text-signal-orange font-bold">
                PAGE 4 // PARA 2
              </span>
            </div>
            <blockquote className="p-4 bg-raw-paper-light border-l-4 border-signal-orange font-mono text-xs text-carbon leading-relaxed">
              &ldquo;{selectedRecord.originalExcerpt}&rdquo;
            </blockquote>
          </div>

          {/* Extracted Structured Entities & Facts */}
          <div className="space-y-2">
            <span className="font-mono text-xs uppercase font-bold text-carbon">
              STRUCTURED ENTITY TRIPLES
            </span>
            <div className="divide-y divide-carbon/20 border border-carbon bg-raw-paper-light font-mono text-xs">
              {selectedRecord.extractedFacts.map((fact, idx) => (
                <div key={idx} className="p-2.5 flex items-start gap-2.5">
                  <span className="text-signal-orange font-bold">[{idx + 1}]</span>
                  <span className="text-carbon leading-relaxed">{fact}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Related Cross-References */}
          <div className="space-y-2 pt-2 border-t border-carbon/20">
            <span className="font-mono text-[11px] uppercase font-bold text-carbon/60">
              CROSS-REFERENCED RECORDS
            </span>
            <div className="flex flex-wrap gap-2 font-mono text-xs">
              {selectedRecord.relatedRecords.map((rel, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-concrete/60 border border-carbon text-carbon"
                >
                  {rel}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal Integration */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-carbon/75 backdrop-blur-xs"
            onClick={() => setUploadModalOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-xl bg-raw-paper-light border-2 border-carbon shadow-brutal-lg p-6 z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-carbon">
              <div>
                <h2 className="font-display font-bold text-base uppercase text-carbon">
                  Deposit Records to Archive
                </h2>
                <p className="font-mono text-xs text-carbon/70">
                  Validated files are staged into the persistent archive buffer.
                </p>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="p-1 text-carbon hover:text-signal-orange"
              >
                <IconClose size={18} />
              </button>
            </div>

            <FileUploader />

            <div className="pt-3 border-t border-carbon flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setUploadModalOpen(false)}>
                Done Staging
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
