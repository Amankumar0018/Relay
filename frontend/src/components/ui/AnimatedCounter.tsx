"use client";

import React, { useEffect, useState, useRef } from "react";

interface AnimatedCounterProps {
  value: number;
  duration?: number; // seconds
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

/**
 * Precision industrial numerical counter.
 * Animates from 0 to target value on mount, and smoothly transitions on subsequent changes.
 * Uses mechanical exponential ease-out to mimic industrial telemetry meters.
 * Respects prefers-reduced-motion.
 */
export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 0.9,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
}) => {
  const [displayValue, setDisplayValue] = useState<number>(0);
  const startValRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    // On mount, start from 0; on subsequent value changes, start from current displayValue
    startValRef.current = isFirstRender.current ? 0 : displayValue;
    isFirstRender.current = false;
    startTimeRef.current = null;

    const targetVal = value;
    const startVal = startValRef.current;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = (timestamp - startTimeRef.current) / 1000;
      const progress = Math.min(elapsed / duration, 1);

      // Mechanical exponential ease-out: starts fast, lands precisely
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -8 * progress);
      const current = startVal + (targetVal - startVal) * easeOut;

      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(targetVal);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  const formatted =
    decimals > 0
      ? displayValue.toFixed(decimals)
      : Math.round(displayValue).toLocaleString();

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};
