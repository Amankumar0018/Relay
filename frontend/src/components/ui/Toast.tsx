"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { IconCheck, IconAlert, IconInfo, IconClose } from "@/components/ui/Icons";
import { AnimatePresence, motion } from "framer-motion";

export type ToastType = "success" | "error" | "info" | "amber";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type?: ToastType;
}

interface ToastContextType {
  addToast: (toast: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);

      setTimeout(() => {
        removeToast(id);
      }, 4500);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 15, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="pointer-events-auto flex items-start gap-3 p-3.5 bg-raw-paper-light border-2 border-carbon shadow-brutal text-xs font-mono"
            >
              <div className="shrink-0 mt-0.5">
                {toast.type === "success" && (
                  <span className="w-5 h-5 bg-industrial-green text-raw-paper flex items-center justify-center border border-carbon">
                    <IconCheck size={12} />
                  </span>
                )}
                {toast.type === "error" && (
                  <span className="w-5 h-5 bg-signal-orange text-raw-paper flex items-center justify-center border border-carbon">
                    <IconAlert size={12} />
                  </span>
                )}
                {toast.type === "amber" && (
                  <span className="w-5 h-5 bg-signal-yellow text-carbon flex items-center justify-center border border-carbon">
                    <IconAlert size={12} />
                  </span>
                )}
                {(!toast.type || toast.type === "info") && (
                  <span className="w-5 h-5 bg-carbon text-raw-paper flex items-center justify-center border border-carbon">
                    <IconInfo size={12} />
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-carbon uppercase tracking-wider">{toast.title}</p>
                {toast.description && (
                  <p className="text-carbon/80 mt-1 leading-relaxed font-sans text-xs">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-carbon hover:text-signal-orange p-0.5 shrink-0 transition-colors"
                aria-label="Dismiss toast"
              >
                <IconClose size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
