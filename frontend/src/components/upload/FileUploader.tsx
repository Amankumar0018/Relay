"use client";

import React, { useState, useRef, useCallback } from "react";
import { IconUpload, IconDocument, IconClose, IconAlert, IconInfo } from "@/components/ui/Icons";
import { formatBytes } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export interface StagedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
}

interface FileUploaderProps {
  onFilesSelected?: (files: StagedFile[]) => void;
  className?: string;
  maxFileSizeMb?: number;
}

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt"];
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
];

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesSelected,
  className = "",
  maxFileSizeMb = 25,
}) => {
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxFileSizeBytes = maxFileSizeMb * 1024 * 1024;

  const validateAndAddFiles = useCallback(
    (files: FileList | File[]) => {
      setErrorMessage(null);
      const newStaged: StagedFile[] = [];
      const errors: string[] = [];

      Array.from(files).forEach((file) => {
        const ext = "." + file.name.split(".").pop()?.toLowerCase();

        if (
          !ALLOWED_EXTENSIONS.includes(ext) &&
          !ALLOWED_MIME_TYPES.includes(file.type)
        ) {
          errors.push(
            `"${file.name}" has an unsupported format. Only PDF, DOCX, and TXT are accepted.`
          );
          return;
        }

        if (file.size > maxFileSizeBytes) {
          errors.push(`"${file.name}" exceeds the ${maxFileSizeMb}MB size limit.`);
          return;
        }

        if (stagedFiles.some((f) => f.name === file.name && f.size === file.size)) {
          return;
        }

        newStaged.push({
          id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
          file,
          name: file.name,
          size: file.size,
          type: ext.replace(".", "").toUpperCase(),
        });
      });

      if (errors.length > 0) {
        setErrorMessage(errors.join(" "));
      }

      if (newStaged.length > 0) {
        const updated = [...stagedFiles, ...newStaged];
        setStagedFiles(updated);
        onFilesSelected?.(updated);
      }
    },
    [maxFileSizeBytes, maxFileSizeMb, onFilesSelected, stagedFiles]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
      e.target.value = "";
    }
  };

  const removeFile = (id: string) => {
    const updated = stagedFiles.filter((f) => f.id !== id);
    setStagedFiles(updated);
    onFilesSelected?.(updated);
    if (updated.length === 0) {
      setErrorMessage(null);
    }
  };

  const clearAll = () => {
    setStagedFiles([]);
    setErrorMessage(null);
    onFilesSelected?.([]);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Industrial Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed p-6 sm:p-8 text-center cursor-pointer transition-all bg-raw-paper-light ${
          isDragging
            ? "border-signal-orange bg-signal-orange/10 shadow-brutal"
            : "border-carbon hover:border-signal-orange hover:bg-concrete/30"
        }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            fileInputRef.current?.click();
          }
        }}
        aria-label="Upload document area"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt"
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 bg-carbon text-raw-paper flex items-center justify-center border border-carbon shadow-brutal">
            <IconUpload size={22} />
          </div>
          <div>
            <div className="font-display font-bold text-sm text-carbon uppercase tracking-wider">
              Deposit Institutional Records
            </div>
            <p className="font-mono text-xs text-carbon/70 mt-1">
              Select or drag PDF, DOCX, TXT archives • Max {maxFileSizeMb}MB per file
            </p>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="flex items-start gap-2.5 p-3.5 bg-signal-orange text-raw-paper border-2 border-carbon text-xs font-mono">
          <IconAlert size={16} className="shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed font-bold">{errorMessage}</div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-raw-paper hover:text-carbon"
          >
            <IconClose size={14} />
          </button>
        </div>
      )}

      {/* Staged files */}
      {stagedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-carbon uppercase">
              // STAGED INTAKE BUFFER ({stagedFiles.length})
            </span>
            <button
              onClick={clearAll}
              className="text-signal-orange hover:underline text-xs font-bold uppercase"
            >
              Flush All
            </button>
          </div>

          <div className="divide-y divide-carbon/30 border-2 border-carbon bg-raw-paper-light">
            {stagedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 text-xs hover:bg-concrete/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 bg-carbon text-raw-paper flex items-center justify-center shrink-0">
                    <IconDocument size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-carbon truncate max-w-sm sm:max-w-md">
                      {file.name}
                    </p>
                    <div className="flex items-center gap-2 text-carbon/70 font-mono text-[11px] mt-0.5">
                      <span>{formatBytes(file.size)}</span>
                      <span>•</span>
                      <span className="uppercase text-[10px] text-raw-paper bg-carbon px-1.5 py-0.5 font-bold">
                        {file.type}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] font-mono text-carbon/60 uppercase hidden sm:inline">
                    Local Session
                  </span>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-1 text-carbon hover:text-signal-orange"
                    aria-label={`Remove ${file.name}`}
                  >
                    <IconClose size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2 p-3 bg-concrete/40 border border-carbon text-xs text-carbon font-mono">
            <IconInfo size={16} className="text-carbon shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-carbon font-bold">BUFFER STATUS:</strong> Ingested files are validated client-side and staged in memory for milestone extraction into persistent SQLite storage.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
