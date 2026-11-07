"use client";

import React, { useEffect, useState } from "react";
import { motion, useSpring, useMotionValue, AnimatePresence } from "framer-motion";

/**
 * Precision-Engineered Industrial Reticle Cursor for Relay.
 *
 * Design Specifications:
 * - Ultra-crisp primary point indicator (zero latency)
 * - Restrained, snappy secondary reticle follower (stiff spring, zero float)
 * - Subtle geometric expansion on interactive elements (no spin or excessive scale)
 * - Contextual monospace badge only when data-cursor is present
 * - Automatically conceals over text inputs and content-editable areas to preserve native cursor usability
 * - Disabled on touch devices and when prefers-reduced-motion is requested
 */
export const IndustrialCursor: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [cursorLabel, setCursorLabel] = useState<string | null>(null);
  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false);
  const [isTextInput, setIsTextInput] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  // Exact mouse coordinates (zero lag)
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Snappy, high-stiffness secondary follower
  const springX = useSpring(mouseX, { stiffness: 550, damping: 38, mass: 0.35 });
  const springY = useSpring(mouseY, { stiffness: 550, damping: 38, mass: 0.35 });

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!finePointer || reducedMotion) {
      setIsEnabled(false);
      return;
    }

    setIsEnabled(true);

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);

      const target = e.target as HTMLElement | null;
      if (target) {
        // Check for text inputs
        const isText = Boolean(
          target.closest('input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]')
        );
        setIsTextInput(isText);

        // Check for custom label
        const cursorEl = target.closest("[data-cursor]") as HTMLElement | null;
        if (cursorEl) {
          const label = cursorEl.getAttribute("data-cursor");
          setCursorLabel(label || null);
          setIsHoveringInteractive(true);
        } else {
          setCursorLabel(null);
          const interactiveEl = target.closest(
            'button, a, select, [role="button"], [role="tab"], [tabindex]:not([tabindex="-1"])'
          );
          setIsHoveringInteractive(Boolean(interactiveEl));
        }
      }
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [isVisible, mouseX, mouseY]);

  if (!isEnabled) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden select-none"
      style={{
        opacity: isVisible && !isTextInput ? 1 : 0,
        transition: "opacity 0.15s ease",
      }}
    >
      {/* 1. Primary Precision Dot (Immediate Position) */}
      <motion.div
        className="fixed top-0 left-0 w-1.5 h-1.5 bg-signal-orange rounded-none -translate-x-1/2 -translate-y-1/2 pointer-events-none border border-carbon shadow-[0_0_2px_rgba(241,90,36,0.8)]"
        style={{
          x: mouseX,
          y: mouseY,
        }}
      />

      {/* 2. Secondary Mechanical Reticle Follower */}
      <motion.div
        className="fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
        style={{
          x: springX,
          y: springY,
        }}
        animate={{
          scale: isClicking ? 0.85 : isHoveringInteractive ? 1.25 : 1,
        }}
        transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          className={`relative border transition-all duration-150 ${
            isHoveringInteractive
              ? "w-6 h-6 border-signal-orange bg-signal-orange/10"
              : "w-4.5 h-4.5 border-carbon/50 bg-transparent"
          }`}
        >
          {/* Subtle corner ticks */}
          <div className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-carbon" />
          <div className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-carbon" />
          <div className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-carbon" />
          <div className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-carbon" />
        </div>

        {/* 3. Contextual Telemetry Badge */}
        <AnimatePresence>
          {cursorLabel && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 2 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.12 }}
              className="absolute left-4 top-4 bg-carbon text-raw-paper font-mono text-[8px] font-bold tracking-widest px-1.5 py-0.5 whitespace-nowrap border border-raw-paper/40 shadow-brutal uppercase"
            >
              {cursorLabel}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
