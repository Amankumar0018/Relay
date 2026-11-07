"use client";

import React from "react";
import { motion, useScroll, useSpring } from "framer-motion";

interface ScrollProgressProps {
  containerRef?: React.RefObject<HTMLElement | null>;
  showPercentage?: boolean;
  className?: string;
}

/**
 * Precision industrial reading progress bar.
 * Tracks reading depth on long-form dossiers, reports, and archive ledgers.
 */
export const ScrollProgress: React.FC<ScrollProgressProps> = ({
  containerRef,
  className = "",
}) => {
  const { scrollYProgress } = useScroll(
    containerRef ? { container: containerRef } : {}
  );

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 500,
    damping: 38,
    mass: 0.2,
    restDelta: 0.001,
  });

  return (
    <div
      className={`relative w-full h-[3px] bg-carbon/25 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <motion.div
        className="h-full bg-signal-orange origin-left relative"
        style={{ scaleX }}
      >
        {/* Trailing precision edge highlight */}
        <div className="absolute right-0 top-0 bottom-0 w-2 bg-raw-paper/80 shadow-[0_0_4px_#f15a24]" />
      </motion.div>
    </div>
  );
};
