import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "cyan" | "amber" | "emerald" | "rose";
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "default",
  children,
  ...props
}) => {
  const variantStyles = {
    default: "bg-slate-800 text-slate-200 border-slate-700",
    secondary: "bg-obsidian-850 text-slate-400 border-slate-800",
    outline: "border-slate-700 text-slate-300 bg-transparent",
    cyan: "bg-cyan-950/80 text-cyan-300 border-cyan-800/80",
    amber: "bg-amber-950/80 text-amber-300 border-amber-800/80",
    emerald: "bg-emerald-950/80 text-emerald-300 border-emerald-800/80",
    rose: "bg-rose-950/80 text-rose-300 border-rose-800/80",
  }[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium border uppercase tracking-wider",
        variantStyles,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
