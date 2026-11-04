import React from "react";
import { IconCheck, IconAlert, IconInfo } from "@/components/ui/Icons";

export type EvidenceStatus =
  | "evidence-backed"
  | "human-verified"
  | "inferred"
  | "missing"
  | "conflicting"
  | "pending-review";

interface EvidenceBadgeProps {
  status: EvidenceStatus;
  size?: "sm" | "md";
  className?: string;
  showIcon?: boolean;
}

const statusConfig: Record<
  EvidenceStatus,
  {
    label: string;
    code: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    styles: string;
  }
> = {
  "evidence-backed": {
    label: "Evidence-Backed",
    code: "EV-01",
    icon: IconCheck,
    styles: "bg-industrial-green text-raw-paper border-carbon",
  },
  "human-verified": {
    label: "Human-Verified",
    code: "HV-02",
    icon: IconCheck,
    styles: "bg-raw-paper-light text-industrial-green border-industrial-green font-semibold",
  },
  inferred: {
    label: "Inferred Context",
    code: "INF-03",
    icon: IconInfo,
    styles: "bg-concrete text-carbon border-carbon",
  },
  missing: {
    label: "Missing Record",
    code: "GAP-04",
    icon: IconAlert,
    styles: "bg-signal-orange text-raw-paper border-carbon font-semibold",
  },
  conflicting: {
    label: "Conflicting Evidence",
    code: "CFT-05",
    icon: IconAlert,
    styles: "bg-signal-orange text-raw-paper border-carbon font-semibold",
  },
  "pending-review": {
    label: "Pending Switch",
    code: "REV-06",
    icon: IconInfo,
    styles: "bg-signal-yellow text-carbon border-carbon font-semibold",
  },
};

export const EvidenceBadge: React.FC<EvidenceBadgeProps> = ({
  status,
  size = "md",
  className = "",
  showIcon = true,
}) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeStyles =
    size === "sm"
      ? "text-[10px] px-1.5 py-0.5 gap-1 font-mono tracking-tight"
      : "text-xs px-2 py-0.5 gap-1.5 font-mono tracking-tight";

  return (
    <span
      className={`inline-flex items-center border industrial-border select-none uppercase ${sizeStyles} ${config.styles} ${className}`}
    >
      {showIcon && <Icon size={size === "sm" ? 10 : 12} className="shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
};
