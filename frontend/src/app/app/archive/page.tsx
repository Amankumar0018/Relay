"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { FileUploader, StagedFile } from "@/components/upload/FileUploader";
import {
  fetchDocuments,
  fetchDocumentById,
  fetchDocumentKnowledge,
  fetchDocumentText,
  uploadDocumentFile,
  extractDocument,
  IngestedDocument,
  DocumentKnowledge,
  DocumentTextData,
} from "@/lib/api";
import { formatBytes } from "@/lib/utils";

export default function KnowledgeArchivePage() {
  const [documents, setDocuments] = useState<IngestedDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedKnowledge, setSelectedKnowledge] = useState<DocumentKnowledge | null>(null);
  const [selectedText, setSelectedText] = useState<DocumentTextData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    try {
      const res = await fetchDocuments(0, 100);
      setDocuments(res.items);
      if (res.items.length > 0 && !selectedDocId) {
        setSelectedDocId(res.items[0].id);
      }
    } catch (err) {
      console.warn("Failed to load backend documents:", err);
    }
  }, [selectedDocId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Load details whenever selectedDocId changes
  useEffect(() => {
    if (!selectedDocId) return;

    let isMounted = true;
    (async () => {
      try {
        const [knowData, textData] = await Promise.all([
          fetchDocumentKnowledge(selectedDocId).catch(() => null),
          fetchDocumentText(selectedDocId).catch(() => null),
        ]);
        if (isMounted) {
          setSelectedKnowledge(knowData);
          setSelectedText(textData);
        }
      } catch (err) {
        console.warn("Error fetching document details:", err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [selectedDocId]);

  const handleDepositFiles = async () => {
    if (stagedFiles.length === 0) return;
    setIsUploading(true);
    setActionNotice("Uploading records to persistent vault...");

    try {
      for (const item of stagedFiles) {
        setActionNotice(`Storing ${item.name}...`);
        const res = await uploadDocumentFile(item.file);

        setActionNotice(`Extracting structured knowledge from ${item.name}...`);
        await extractDocument(res.document.id);
      }

      setActionNotice("All files deposited and knowledge extracted successfully.");
      setStagedFiles([]);
      setUploadModalOpen(false);
      await loadDocuments();
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      console.error("Upload error:", err);
      setActionNotice(`Deposit error: ${err.message || "Failed to process files."}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleExtractDocument = async (docId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsExtracting(docId);
    setActionNotice(`Executing deterministic grounding extraction on document ${docId.slice(0, 8)}...`);

    try {
      await extractDocument(docId);
      setActionNotice("Extraction and evidence verification completed.");
      await loadDocuments();
      if (selectedDocId === docId) {
        const [knowData, textData] = await Promise.all([
          fetchDocumentKnowledge(docId).catch(() => null),
          fetchDocumentText(docId).catch(() => null),
        ]);
        setSelectedKnowledge(knowData);
        setSelectedText(textData);
      }
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      console.error("Extraction error:", err);
      setActionNotice(`Extraction failed: ${err.message || "Error running extraction pipeline"}`);
    } finally {
      setIsExtracting(null);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.original_filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.sha256_hash.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "ALL" ||
      doc.file_extension.toUpperCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const selectedDoc = documents.find((d) => d.id === selectedDocId) || documents[0];

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
            {documents.length} VERIFIED ARCHIVAL RECORDS • LOCAL PERSISTENT STORAGE
          </p>
        </div>

        <Button variant="signal" size="sm" onClick={() => setUploadModalOpen(true)}>
          <IconUpload size={14} />
          <span>+ Deposit New Record</span>
        </Button>
      </div>

      {actionNotice && (
        <div className="p-3 bg-carbon text-raw-paper font-mono text-xs border border-carbon flex items-center justify-between">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="underline uppercase text-[10px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-2 border-carbon bg-raw-paper-light p-3">
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-raw-paper border border-carbon flex-1 max-w-md">
          <IconSearch size={14} className="text-carbon/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by filename or hash..."
            className="w-full bg-transparent border-none text-xs font-mono text-carbon placeholder:text-carbon/40 focus:outline-none"
          />
        </div>

        {/* Extensions */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          {["ALL", "PDF", "DOCX", "TXT"].map((ext) => (
            <button
              key={ext}
              onClick={() => setSelectedCategory(ext)}
              className={`px-2.5 py-1 uppercase text-[11px] font-bold border transition-colors ${
                selectedCategory === ext
                  ? "bg-carbon text-raw-paper border-carbon shadow-brutal"
                  : "bg-raw-paper text-carbon border-carbon/40 hover:border-carbon"
              }`}
            >
              {ext}
            </button>
          ))}
        </div>
      </div>

      {/* Main Workspace Split: Table + Record Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Table Column (7 cols) */}
        <div className="lg:col-span-7 border-2 border-carbon bg-raw-paper shadow-brutal overflow-hidden">
          <div className="p-3.5 bg-raw-paper-light border-b-2 border-carbon flex items-center justify-between text-xs font-mono">
            <span className="font-bold uppercase text-carbon">
              PRIMARY RECORDS REPOSITORY ({filteredDocs.length})
            </span>
            <span className="text-carbon/60 uppercase text-[10px]">
              CLICK TO INSPECT EXTRACTED TRIPLE GRAPH
            </span>
          </div>

          {filteredDocs.length === 0 ? (
            <div className="p-10 text-center space-y-4">
              <div className="w-12 h-12 bg-raw-paper-light border-2 border-carbon mx-auto flex items-center justify-center text-carbon/60">
                <IconDocument size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-bold text-sm uppercase text-carbon">
                  No Archival Records Found
                </h4>
                <p className="font-mono text-xs text-carbon/70 max-w-md mx-auto">
                  Deposit PDF charters, regulatory filings, or vendor agreements to begin deterministic extraction.
                </p>
              </div>
              <Button
                variant="signal"
                size="sm"
                onClick={() => setUploadModalOpen(true)}
              >
                Deposit First Record →
              </Button>
            </div>
          ) : (
            <div className="divide-y-2 divide-carbon">
              {filteredDocs.map((rec) => {
                const isSelected = rec.id === selectedDocId;

                return (
                  <div
                    key={rec.id}
                    onClick={() => setSelectedDocId(rec.id)}
                    className={`p-4 cursor-pointer transition-colors space-y-2 ${
                      isSelected
                        ? "bg-carbon text-raw-paper"
                        : "bg-raw-paper-light hover:bg-concrete/40 text-carbon"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono text-[10px] px-1.5 py-0.2 font-bold uppercase border ${
                              isSelected
                                ? "bg-signal-orange text-raw-paper border-raw-paper/30"
                                : "bg-carbon text-raw-paper border-carbon"
                            }`}
                          >
                            {rec.file_extension.toUpperCase()}
                          </span>
                          <span className="font-mono text-[10px] opacity-60 truncate">
                            {rec.id.slice(0, 8)}...
                          </span>
                        </div>
                        <h4 className="font-display font-bold text-sm uppercase truncate">
                          {rec.original_filename}
                        </h4>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`font-mono text-[10px] px-2 py-0.5 font-bold uppercase border ${
                            rec.extraction_status === "completed"
                              ? isSelected
                                ? "bg-industrial-green-light text-carbon border-transparent"
                                : "bg-industrial-green text-raw-paper border-carbon"
                              : rec.extraction_status === "failed"
                              ? "bg-signal-red text-raw-paper border-carbon"
                              : "bg-signal-yellow text-carbon border-carbon"
                          }`}
                        >
                          {rec.extraction_status === "completed"
                            ? "Indexed & Grounded"
                            : rec.extraction_status === "failed"
                            ? "Extraction Error"
                            : "Pending Extraction"}
                        </span>

                        <Button
                          variant={isSelected ? "outline" : "primary"}
                          size="sm"
                          onClick={(e) => handleExtractDocument(rec.id, e)}
                          disabled={isExtracting === rec.id}
                          className="text-[10px] py-0.5 px-2 h-auto"
                        >
                          {isExtracting === rec.id
                            ? "Extracting..."
                            : rec.extraction_status === "completed"
                            ? "Re-Extract"
                            : "Extract Now"}
                        </Button>
                      </div>
                    </div>

                    <div
                      className={`flex flex-wrap items-center justify-between text-[11px] font-mono pt-1 border-t ${
                        isSelected ? "border-raw-paper/20 text-raw-paper/70" : "border-carbon/20 text-carbon/70"
                      }`}
                    >
                      <span>Size: {formatBytes(rec.file_size)}</span>
                      <span>Words: {rec.word_count || 0}</span>
                      <span>Date: {new Date(rec.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail Inspection Column (5 cols) */}
        <div className="lg:col-span-5 border-2 border-carbon bg-raw-paper shadow-brutal space-y-5 p-5">
          {selectedDoc ? (
            <>
              {/* Header */}
              <div className="border-b-2 border-carbon pb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase font-bold text-signal-orange">
                    // RECORD INSPECTION DESK
                  </span>
                  <span className="font-mono text-[10px] text-carbon/60">
                    SHA256: {selectedDoc.sha256_hash.slice(0, 12)}...
                  </span>
                </div>
                <h3 className="font-display font-black text-lg uppercase text-carbon leading-snug">
                  {selectedDoc.original_filename}
                </h3>
                <div className="flex items-center gap-2 font-mono text-xs text-carbon/70">
                  <span>FORMAT: {selectedDoc.file_extension.toUpperCase()}</span>
                  <span>•</span>
                  <span>SIZE: {formatBytes(selectedDoc.file_size)}</span>
                </div>
              </div>

              {/* Extracted Knowledge Graph Summary */}
              {selectedKnowledge && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 border border-carbon bg-raw-paper-light">
                      <span className="text-[10px] text-carbon/60 block">FACTS</span>
                      <span className="font-bold text-sm text-carbon">
                        {selectedKnowledge.total_facts}
                      </span>
                    </div>
                    <div className="p-2 border border-carbon bg-raw-paper-light">
                      <span className="text-[10px] text-carbon/60 block">ENTITIES</span>
                      <span className="font-bold text-sm text-carbon">
                        {selectedKnowledge.total_entities}
                      </span>
                    </div>
                    <div className="p-2 border border-carbon bg-raw-paper-light">
                      <span className="text-[10px] text-carbon/60 block">RELATIONS</span>
                      <span className="font-bold text-sm text-carbon">
                        {selectedKnowledge.total_relationships}
                      </span>
                    </div>
                  </div>

                  {/* Fact List with Citations */}
                  <div className="space-y-2 pt-2">
                    <span className="font-mono text-xs font-bold text-carbon uppercase block">
                      GROUNDED STATEMENTS & EVIDENCE ({selectedKnowledge.facts.length})
                    </span>
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                      {selectedKnowledge.facts.map((fact) => (
                        <div
                          key={fact.id}
                          className="p-3 bg-raw-paper-light border border-carbon space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold uppercase text-signal-orange">
                              {fact.category}
                            </span>
                            <EvidenceBadge
                              status={
                                fact.verification_status === "evidence-backed"
                                  ? "evidence-backed"
                                  : "inferred"
                              }
                              size="sm"
                            />
                          </div>
                          <p className="font-sans text-xs text-carbon leading-relaxed">
                            {fact.statement}
                          </p>

                          {fact.citations && fact.citations.length > 0 && (
                            <div className="pt-1 border-t border-carbon/20 font-mono text-[10px] text-carbon/70">
                              <span className="font-bold block text-carbon/60">
                                CITATION [{fact.citations[0].source_location}]:
                              </span>
                              <blockquote className="italic">
                                &ldquo;{fact.citations[0].verbatim_quote}&rdquo;
                              </blockquote>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Text Preview */}
              {selectedText && selectedText.extracted_text && (
                <div className="space-y-2 pt-2 border-t-2 border-carbon font-mono text-xs">
                  <span className="font-bold text-carbon uppercase block">
                    RAW EXTRACTED CORPUS PREVIEW ({selectedText.character_count} CHARACTERS)
                  </span>
                  <div className="p-3 bg-raw-paper-light border border-carbon max-h-40 overflow-y-auto text-[11px] text-carbon/80 leading-relaxed font-mono whitespace-pre-wrap">
                    {selectedText.extracted_text.slice(0, 800)}
                    {selectedText.extracted_text.length > 800 ? "..." : ""}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-xs font-mono text-carbon/60">
              Select a deposited record from the table to inspect details.
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-carbon/80 flex items-center justify-center p-4">
          <div className="bg-raw-paper border-2 border-carbon max-w-xl w-full p-6 space-y-4 shadow-brutal-lg">
            <div className="flex items-center justify-between border-b-2 border-carbon pb-3">
              <div>
                <span className="font-mono text-xs uppercase font-bold text-signal-orange">
                  // VAULT DEPOSIT DOCK
                </span>
                <h3 className="font-display font-black text-lg uppercase text-carbon">
                  Deposit Archival Records
                </h3>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="p-1 hover:text-signal-orange"
              >
                <IconClose size={18} />
              </button>
            </div>

            <FileUploader onFilesSelected={(files) => setStagedFiles(files)} />

            {stagedFiles.length > 0 && (
              <div className="pt-2 flex items-center justify-between gap-3">
                <span className="font-mono text-xs text-carbon">
                  {stagedFiles.length} file(s) staged for vault deposit
                </span>
                <Button
                  variant="signal"
                  size="sm"
                  onClick={handleDepositFiles}
                  disabled={isUploading}
                >
                  <IconUpload size={14} className="mr-1.5" />
                  <span>{isUploading ? "Uploading & Extracting..." : "Deposit Records Now"}</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
