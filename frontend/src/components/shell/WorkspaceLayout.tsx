"use client";

import React, { useState, useEffect } from "react";
import { WorkspaceSidebar } from "./WorkspaceSidebar";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { CommandPalette } from "./CommandPalette";
import { PageTransition } from "./PageTransition";
import { IndustrialCursor } from "@/components/ui/IndustrialCursor";
import { UploadModal } from "@/components/upload/UploadModal";
import { ToastProvider, useToast } from "@/components/ui/Toast";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
}

const WorkspaceLayoutInner: React.FC<WorkspaceLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const { addToast } = useToast();

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-raw-paper text-carbon flex selection:bg-signal-orange selection:text-raw-paper relative">
      {/* Precision Industrial Reticle Cursor (Fine pointer only) */}
      <IndustrialCursor />

      {/* Industrial Sidebar */}
      <WorkspaceSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <WorkspaceHeader
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenUpload={() => setUploadModalOpen(true)}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenUpload={() => setUploadModalOpen(true)}
      />

      {/* Upload Dialog Modal */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onFilesStaged={(files) => {
          if (files.length > 0) {
            addToast({
              type: "success",
              title: `${files.length} RECORD${files.length > 1 ? "S" : ""} BUFFERED`,
              description: "Validated for multi-agent evidence cross-examination.",
            });
          }
        }}
      />
    </div>
  );
};

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({ children }) => {
  return (
    <ToastProvider>
      <WorkspaceLayoutInner>{children}</WorkspaceLayoutInner>
    </ToastProvider>
  );
};
