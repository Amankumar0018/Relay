"use client";

import React, { useEffect, useState } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { INDUSTRIAL_EASING, EDITORIAL_EASING } from "@/lib/motion";

interface ScrollRevealProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  variant?: "industrial" | "editorial" | "fade";
  yOffset?: number;
  className?: string;
}

/**
 * High-performance viewport reveal component.
 * Uses deliberate, rhythmic staggered entrance without blocking viewport margins.
 */
export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  delay = 0,
  duration = 0.38,
  variant = "industrial",
  yOffset = 14,
  className = "",
  ...props
}) => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const easing = variant === "editorial" ? EDITORIAL_EASING : INDUSTRIAL_EASING;

  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.05 }}
      transition={{
        duration,
        delay,
        ease: easing,
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};
