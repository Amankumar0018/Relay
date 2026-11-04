"use client";

import React, { useState } from "react";
import { WorkspaceSidebar } from "./WorkspaceSidebar";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { FileUploader, StagedFile } from "@/components/upload/FileUploader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { IconClose } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
}

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-paper flex">
      {/* Sidebar */}
      <WorkspaceSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <WorkspaceHeader
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenUpload={() => setUploadModalOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Upload Dialog Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-ink/40 backdrop-blur-xs"
            onClick={() => setUploadModalOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-xl bg-paper-surface border border-rule rounded shadow-md p-5 z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-rule">
              <div>
                <h2 className="text-sm font-semibold text-ink font-sans">
                  Stage Organizational Records
                </h2>
                <p className="text-xs text-ink-secondary">
                  Add charters, policies, or contracts to the workspace repository.
                </p>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="p-1 text-ink-secondary hover:text-ink rounded"
              >
                <IconClose size={16} />
              </button>
            </div>

            <FileUploader
              onFilesSelected={(files: StagedFile[]) => {
                if (files.length > 0) {
                  // Keep in staged state
                }
              }}
            />

            <div className="pt-3 border-t border-rule flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUploadModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

