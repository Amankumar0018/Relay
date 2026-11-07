"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
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
import { ScrollReveal } from "@/components/ui/ScrollReveal";
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
      console.error("Deposit error:", err);
      setActionNotice(`Deposit failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleExtractDocument = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExtracting(id);
    setActionNotice(`Re-extracting factual triples for document...`);

    try {
      await extractDocument(id);
      setActionNotice("Factual triples extracted successfully.");
      await loadDocuments();
      if (selectedDocId === id) {
        const [knowData, textData] = await Promise.all([
          fetchDocumentKnowledge(id).catch(() => null),
          fetchDocumentText(id).catch(() => null),
        ]);
        setSelectedKnowledge(knowData);
        setSelectedText(textData);
      }
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      console.error("Extraction error:", err);
      setActionNotice(`Extraction failed: ${err.message}`);
    } finally {
      setIsExtracting(null);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchQuery =
      searchQuery === "" ||
      doc.original_filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.sha256_hash.toLowerCase().includes(searchQuery.toLowerCase());

    const matchExt =
      selectedCategory === "ALL" ||
      doc.file_extension.toUpperCase() === selectedCategory;

    return matchQuery && matchExt;
  });

  const selectedDoc = documents.find((d) => d.id === selectedDocId);

  return (
    <div className="space-y-5 font-sans">
      {/* Page Header */}
      <ScrollReveal variant="industrial">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-carbon pb-4">
          <div>
            <span className="font-mono text-[10px] uppercase font-bold text-signal-orange block mb-0.5">
              REPOSITORY MODULE
            </span>
            <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-carbon">
              Institutional Knowledge Archive
            </h1>
            <p className="font-mono text-xs text-carbon/70 uppercase mt-0.5">
              {documents.length} VERIFIED ARCHIVAL RECORDS • LOCAL PERSISTENT STORAGE
            </p>
          </div>

          <Button
            variant="signal"
            size="sm"
            magnetic={true}
            data-cursor="DEPOSIT"
            onClick={() => setUploadModalOpen(true)}
          >
            <IconUpload size={14} />
            <span>+ Deposit New Record</span>
          </Button>
        </div>
      </ScrollReveal>

      {actionNotice && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="p-3 bg-carbon text-raw-paper font-mono text-xs border border-carbon flex items-center justify-between shadow-brutal"
        >
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="underline uppercase text-xs font-bold">
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Filter and Search Bar */}
      <ScrollReveal variant="editorial" delay={0.05}>
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-2 border-carbon bg-raw-paper-light p-2.5 shadow-brutal">
          {/* Search */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-raw-paper border border-carbon flex-1 max-w-md">
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
                data-cursor="FILTER"
                className={`px-2.5 py-1 uppercase font-bold border transition-all text-xs ${
                  selectedCategory === ext
                    ? "bg-carbon text-raw-paper border-carbon shadow-brutal"
                    : "bg-raw-paper text-carbon border-carbon/40 hover:border-carbon hover:bg-concrete/40"
                }`}
              >
                {ext}
              </button>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* Main Workspace Split: Table + Record Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Table Column (7 cols) */}
        <div className="lg:col-span-7 border-2 border-carbon bg-raw-paper shadow-brutal overflow-hidden">
          <div className="p-3 bg-raw-paper-light border-b-2 border-carbon flex items-center justify-between text-xs font-mono">
            <span className="font-bold uppercase text-carbon">
              PRIMARY RECORDS REPOSITORY ({filteredDocs.length})
            </span>
            <span className="text-carbon/60 uppercase text-[10px]">
              CLICK TO INSPECT EXTRACTED TRIPLE GRAPH
            </span>
          </div>

          {filteredDocs.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <div className="w-12 h-12 bg-raw-paper-light border-2 border-carbon mx-auto flex items-center justify-center text-carbon/60">
                <IconDocument size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-black text-sm uppercase text-carbon">
                  No Archival Records Found
                </h4>
                <p className="font-sans text-xs text-carbon/70 max-w-md mx-auto">
                  Deposit PDF charters, regulatory filings, or vendor agreements to begin deterministic extraction.
                </p>
              </div>
              <Button
                variant="signal"
                size="sm"
                magnetic={true}
                onClick={() => setUploadModalOpen(true)}
              >
                Deposit First Record →
              </Button>
            </div>
          ) : (
            <LayoutGroup id="archiveDocListGroup">
              <div
                data-lenis-prevent
                className="divide-y-2 divide-carbon max-h-[600px] overflow-y-auto"
              >
                {filteredDocs.map((rec) => {
                  const isSelected = rec.id === selectedDocId;

                  return (
                    <div
                      key={rec.id}
                      data-cursor="INSPECT"
                      onClick={() => setSelectedDocId(rec.id)}
                      className={`p-3.5 cursor-pointer transition-all space-y-2 relative select-none ${
                        isSelected
                          ? "bg-carbon text-raw-paper shadow-inner"
                          : "bg-raw-paper-light hover:bg-concrete/60 text-carbon hover:translate-x-1"
                      }`}
                    >
                      {/* Active sliding indicator */}
                      {isSelected && (
                        <motion.div
                          layoutId="activeDocRowIndicator"
                          className="absolute left-0 top-0 bottom-0 w-1.5 bg-signal-orange z-10"
                          transition={{
                            type: "spring",
                            stiffness: 450,
                            damping: 35,
                          }}
                        />
                      )}
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`font-mono text-[10px] px-1.5 py-0.5 font-bold uppercase border shrink-0 ${
                              isSelected
                                ? "bg-signal-orange text-raw-paper border-raw-paper/30"
                                : "bg-concrete text-carbon border-carbon"
                            }`}
                          >
                            {rec.file_extension}
                          </span>
                          <h4 className="font-display font-black text-sm uppercase truncate">
                            {rec.original_filename}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 font-mono uppercase font-bold border ${
                              rec.extraction_status === "completed"
                                ? isSelected
                                  ? "bg-industrial-green-light text-carbon border-transparent"
                                  : "bg-industrial-green text-raw-paper border-carbon"
                                : isSelected
                                ? "bg-signal-orange text-raw-paper border-transparent"
                                : "bg-signal-orange/20 text-signal-orange border-signal-orange"
                            }`}
                          >
                            {rec.extraction_status}
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
                        className={`flex flex-wrap items-center justify-between text-[11px] font-mono pt-1.5 border-t ${
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
            </LayoutGroup>
          )}
        </div>

        {/* Detail Inspection Column (5 cols) */}
        <div
          data-lenis-prevent
          className="lg:col-span-5 border-2 border-carbon bg-raw-paper shadow-brutal space-y-4 p-5 min-h-[420px] max-h-[600px] overflow-y-auto"
        >
          {selectedDoc && (
            <motion.div
              key={selectedDoc.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4"
            >
              {/* Header */}
              <div className="border-b-2 border-carbon pb-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase font-bold text-signal-orange">
                    RECORD INSPECTION DESK
                  </span>
                  <span className="font-mono text-[10px] text-carbon/60">
                    SHA256: {selectedDoc.sha256_hash.slice(0, 10)}...
                  </span>
                </div>
                <h3 className="font-display font-black text-lg uppercase text-carbon leading-snug">
                  {selectedDoc.original_filename}
                </h3>
                <div className="flex items-center gap-2 font-mono text-[11px] text-carbon/70">
                  <span>FORMAT: {selectedDoc.file_extension.toUpperCase()}</span>
                  <span>•</span>
                  <span>SIZE: {formatBytes(selectedDoc.file_size)}</span>
                </div>
              </div>

              {/* Extracted Knowledge Graph Summary */}
              {selectedKnowledge && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 border border-carbon bg-raw-paper-light shadow-brutal">
                      <span className="text-[10px] text-carbon/60 block">FACTS</span>
                      <span className="font-bold text-sm text-carbon">
                        {selectedKnowledge.total_facts}
                      </span>
                    </div>
                    <div className="p-2 border border-carbon bg-raw-paper-light shadow-brutal">
                      <span className="text-[10px] text-carbon/60 block">ENTITIES</span>
                      <span className="font-bold text-sm text-carbon">
                        {selectedKnowledge.total_entities}
                      </span>
                    </div>
                    <div className="p-2 border border-carbon bg-raw-paper-light shadow-brutal">
                      <span className="text-[10px] text-carbon/60 block">RELATIONS</span>
                      <span className="font-bold text-sm text-carbon">
                        {selectedKnowledge.total_relationships}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1 border-t border-carbon/20">
                    <span className="font-bold text-carbon uppercase block text-[10px]">
                      EXTRACTED FACTS SAMPLER ({selectedKnowledge.facts.length})
                    </span>
                    <div
                      data-lenis-prevent
                      className="space-y-2 max-h-44 overflow-y-auto pr-1"
                    >
                      {selectedKnowledge.facts.map((fact) => (
                        <div
                          key={fact.id}
                          className="p-2.5 bg-raw-paper-light border-l-2 border-carbon text-xs space-y-1 shadow-brutal"
                        >
                          <span className="text-[10px] font-bold text-signal-orange uppercase block">
                            [{fact.category}] • {fact.verification_status}
                          </span>
                          <p className="font-sans text-xs text-carbon leading-snug">
                            {fact.statement}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Text Preview */}
              {selectedText && selectedText.extracted_text && (
                <div className="space-y-1.5 pt-1 border-t-2 border-carbon font-mono text-xs">
                  <span className="font-bold text-carbon uppercase block text-[10px]">
                    RAW EXTRACTED CORPUS PREVIEW ({selectedText.character_count} CHARACTERS)
                  </span>
                  <div
                    data-lenis-prevent
                    className="p-3 bg-raw-paper-light border border-carbon max-h-36 overflow-y-auto text-[11px] text-carbon/80 leading-relaxed font-mono whitespace-pre-wrap shadow-inner"
                  >
                    {selectedText.extracted_text.slice(0, 800)}
                    {selectedText.extracted_text.length > 800 ? "..." : ""}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {uploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-carbon/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-raw-paper border-2 border-carbon p-6 max-w-lg w-full space-y-4 shadow-brutal-lg"
            >
              <div className="flex items-center justify-between border-b-2 border-carbon pb-3">
                <h3 className="font-display font-black text-lg uppercase text-carbon">
                  Deposit Archival Record
                </h3>
                <button
                  onClick={() => setUploadModalOpen(false)}
                  className="text-carbon hover:text-signal-orange font-mono text-xs font-bold uppercase"
                >
                  [Close]
                </button>
              </div>

              <FileUploader onFilesSelected={(files) => setStagedFiles(files)} />

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUploadModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="signal"
                  size="sm"
                  onClick={handleDepositFiles}
                  disabled={stagedFiles.length === 0 || isUploading}
                >
                  {isUploading ? "Uploading..." : `Deposit ${stagedFiles.length} Record(s)`}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
