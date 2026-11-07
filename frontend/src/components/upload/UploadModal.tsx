"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconClose, IconUpload, IconCheck } from "@/components/ui/Icons";
import { FileUploader, StagedFile } from "./FileUploader";
import { Button } from "@/components/ui/Button";
import { modalDialogVariants } from "@/lib/motion";

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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-carbon/75 backdrop-blur-xs"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal Dialog */}
          <motion.div
            variants={modalDialogVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative w-full max-w-2xl bg-raw-paper-light border-2 border-carbon shadow-brutal-lg overflow-hidden z-10"
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-modal-title"
          >
            <div className="flex items-center justify-between p-4 px-6 border-b-2 border-carbon bg-carbon text-raw-paper">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-signal-orange text-raw-paper flex items-center justify-center border border-carbon font-mono font-bold text-xs">
                  REC
                </div>
                <div>
                  <h2
                    id="upload-modal-title"
                    className="font-display font-bold text-sm sm:text-base uppercase tracking-wider"
                  >
                    Deposit Institutional Records
                  </h2>
                  <p className="font-mono text-xs text-raw-paper/70">
                    Stage archival files for multi-agent evidence cross-examination.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 text-raw-paper hover:text-signal-orange transition-colors"
                aria-label="Close dialog"
              >
                <IconClose size={18} />
              </button>
            </div>

            <div className="p-6 bg-raw-paper">
              <FileUploader onFilesSelected={setCurrentFiles} />
            </div>

            <div className="flex items-center justify-between p-4 px-6 border-t-2 border-carbon bg-concrete/60">
              <span className="font-mono text-xs text-carbon">
                {currentFiles.length === 0
                  ? "// NO RECORDS STAGED"
                  : `// ${currentFiles.length} RECORD${currentFiles.length === 1 ? "" : "S"} QUEUED`}
              </span>
              <div className="flex items-center gap-3">
                <Button variant="secondary" size="sm" onClick={onClose}>
                  Abort
                </Button>
                <Button
                  variant="signal"
                  size="sm"
                  disabled={currentFiles.length === 0}
                  magnetic={true}
                  onClick={() => {
                    onFilesStaged?.(currentFiles);
                    onClose();
                  }}
                >
                  <IconCheck size={14} className="mr-1.5" />
                  Commit {currentFiles.length > 0 ? `(${currentFiles.length})` : ""} to Archive
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
