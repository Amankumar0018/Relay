"use client";

import React, { useState } from "react";
import { IconClose, IconUpload, IconCheck } from "@/components/ui/Icons";
import { FileUploader, StagedFile } from "./FileUploader";
import { Button } from "@/components/ui/Button";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFilesStaged?: (files: StagedFile[]) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onFilesStaged,
}) => {
  const [currentFiles, setCurrentFiles] = useState<StagedFile[]>([]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        className="relative w-full max-w-2xl bg-paper-surface rounded-sm shadow-xl border border-rule overflow-hidden z-10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-modal-title"
      >
        <div className="flex items-center justify-between p-4 px-6 border-b border-rule bg-paper">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-copper-light border border-copper-border flex items-center justify-center text-copper">
              <IconUpload size={16} />
            </div>
            <div>
              <h2
                id="upload-modal-title"
                className="text-sm sm:text-base font-serif font-bold text-ink"
              >
                Deposit Organizational Records
              </h2>
              <p className="text-xs text-ink-secondary">
                Stage PDF, DOCX, or TXT archives for extraction and cross-examination.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-sm text-ink-secondary hover:text-ink hover:bg-paper-secondary transition-colors"
            aria-label="Close dialog"
          >
            <IconClose size={16} />
          </button>
        </div>

        <div className="p-6">
          <FileUploader onFilesSelected={setCurrentFiles} />
        </div>

        <div className="flex items-center justify-between p-4 px-6 border-t border-rule bg-paper-secondary/60">
          <span className="text-xs text-ink-secondary font-mono">
            {currentFiles.length === 0
              ? "0 records staged"
              : `${currentFiles.length} record${currentFiles.length === 1 ? "" : "s"} ready`}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={currentFiles.length === 0}
              onClick={() => {
                onFilesStaged?.(currentFiles);
                onClose();
              }}
            >
              <IconCheck size={14} className="mr-1.5" />
              Stage {currentFiles.length > 0 ? `(${currentFiles.length})` : ""} Records
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
