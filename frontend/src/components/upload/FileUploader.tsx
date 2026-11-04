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
      {/* Archival Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border border-dashed rounded p-6 sm:p-8 text-center cursor-pointer transition-colors bg-paper-surface ${
          isDragging
            ? "border-olive bg-olive-light/50"
            : "border-rule hover:border-ink-secondary hover:bg-paper-secondary/40"
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

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-10 h-10 rounded bg-paper-secondary border border-rule flex items-center justify-center text-ink-secondary">
            <IconUpload size={20} />
          </div>
          <div>
            <div className="text-sm font-sans font-semibold text-ink">
              Select or drop organizational records here
            </div>
            <p className="text-xs text-ink-secondary mt-0.5">
              Accepted formats: PDF, DOCX, TXT up to {maxFileSizeMb}MB per file.
            </p>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="flex items-start gap-2.5 p-3 rounded bg-copper-light border border-copper-border text-xs text-copper-dark">
          <IconAlert size={16} className="shrink-0 mt-0.5 text-copper" />
          <div className="flex-1 leading-relaxed">{errorMessage}</div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-copper hover:text-copper-dark"
          >
            <IconClose size={14} />
          </button>
        </div>
      )}

      {/* Staged files */}
      {stagedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-sans">
            <span className="font-semibold text-ink">
              Staged Records ({stagedFiles.length})
            </span>
            <button
              onClick={clearAll}
              className="text-copper hover:underline text-xs"
            >
              Clear all
            </button>
          </div>

          <div className="divide-y divide-rule/80 border border-rule rounded bg-paper-surface overflow-hidden">
            {stagedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 text-xs hover:bg-paper-secondary/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded bg-paper-secondary border border-rule flex items-center justify-center text-ink-secondary shrink-0">
                    <IconDocument size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-ink truncate max-w-sm sm:max-w-md">
                      {file.name}
                    </p>
                    <div className="flex items-center gap-2 text-ink-secondary text-[11px] mt-0.5">
                      <span>{formatBytes(file.size)}</span>
                      <span>•</span>
                      <span className="uppercase text-[10px] text-ink-secondary bg-paper-secondary px-1 py-0.2 rounded border border-rule">
                        {file.type}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] text-ink-secondary italic hidden sm:inline">
                    Staged in memory
                  </span>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-1 text-ink-secondary hover:text-copper rounded"
                    aria-label={`Remove ${file.name}`}
                  >
                    <IconClose size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2 p-3 rounded bg-paper-secondary border border-rule text-xs text-ink-secondary">
            <IconInfo size={16} className="text-olive shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-ink">Operational note:</strong> Files selected here are staged in local browser memory for this session. Direct ingestion into the persistent FastAPI backend will connect once the upload API endpoint is finalized.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
