"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useSpring } from "framer-motion";

interface MagneticProps {
  children: React.ReactNode;
  strength?: number; // Maximum offset in px (default 5px)
  className?: string;
  disabled?: boolean;
}

/**
 * Restrained mechanical magnetic attraction for primary CTAs and key actions.
 * Limits displacement to a tight threshold (default 5px) to maintain Relay's rigid brutalist feel.
 */
export const Magnetic: React.FC<MagneticProps> = ({
  children,
  strength = 5,
  className = "",
  disabled = false,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  const x = useSpring(0, { damping: 20, stiffness: 250, mass: 0.2 });
  const y = useSpring(0, { damping: 20, stiffness: 250, mass: 0.2 });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || reducedMotion || !ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    const deltaX = (clientX - centerX) / (width / 2);
    const deltaY = (clientY - centerY) / (height / 2);

    // Clamp within strength bounds
    x.set(Math.max(-strength, Math.min(strength, deltaX * strength)));
    y.set(Math.max(-strength, Math.min(strength, deltaY * strength)));
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  if (disabled || reducedMotion) {
    return <div className={`inline-block ${className}`}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x, y }}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.div>
  );
};

