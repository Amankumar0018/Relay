/**
 * Relay Industrial Motion Tokens & Easing Constants
 *
 * Implements mechanical, deliberate, and high-precision animation curves
 * tailored to Relay's industrial editorial brutalist design language.
 */

import { Variants, Transition } from "framer-motion";

// High-precision easing curves
export const INDUSTRIAL_EASING: [number, number, number, number] = [0.2, 0, 0, 1];
export const EDITORIAL_EASING: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const MECHANICAL_SPRING = {
  type: "spring" as const,
  stiffness: 420,
  damping: 32,
  mass: 0.6,
};

// Standardized duration tokens (seconds)
export const MOTION_DURATIONS = {
  instant: 0.1,
  fast: 0.18,
  normal: 0.28,
  reveal: 0.42,
  slow: 0.6,
};

// Standardized transitions
export const TRANSITIONS = {
  snappy: {
    duration: MOTION_DURATIONS.fast,
    ease: INDUSTRIAL_EASING,
  } as Transition,
  editorial: {
    duration: MOTION_DURATIONS.normal,
    ease: EDITORIAL_EASING,
  } as Transition,
  reveal: {
    duration: MOTION_DURATIONS.reveal,
    ease: EDITORIAL_EASING,
  } as Transition,
  springBrisk: {
    type: "spring",
    stiffness: 420,
    damping: 32,
    mass: 0.6,
  } as Transition,
  springSmooth: {
    type: "spring",
    stiffness: 300,
    damping: 28,
  } as Transition,
};

// Route & Page Transition Variants (Zero blank screen delay)
export const pageTransitionVariants: Variants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.normal,
      ease: EDITORIAL_EASING,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: MOTION_DURATIONS.fast,
      ease: INDUSTRIAL_EASING,
    },
  },
};

// Staggered Container Variants
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

// Staggered Item Variants
export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.normal,
      ease: EDITORIAL_EASING,
    },
  },
};

// Section Reveal Variants
export const sectionRevealVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.reveal,
      ease: EDITORIAL_EASING,
    },
  },
};

// Modal & Overlay Variants
export const modalBackdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: MOTION_DURATIONS.fast },
  },
  exit: {
    opacity: 0,
    transition: { duration: MOTION_DURATIONS.fast },
  },
};

export const modalDialogVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.96,
    y: 14,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.normal,
      ease: EDITORIAL_EASING,
    },
  },
  hidden: {
    opacity: 0,
    scale: 0.96,
    y: 14,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.normal,
      ease: EDITORIAL_EASING,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 10,
    transition: {
      duration: MOTION_DURATIONS.fast,
      ease: INDUSTRIAL_EASING,
    },
  },
};
