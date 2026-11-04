import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "signal";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center font-sans font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-orange disabled:opacity-40 disabled:cursor-not-allowed select-none cursor-pointer border";

    const variants = {
      primary:
        "bg-carbon text-raw-paper border-carbon hover:bg-carbon-surface hover:shadow-brutal active:translate-x-[1px] active:translate-y-[1px]",
      signal:
        "bg-signal-orange text-raw-paper border-carbon shadow-brutal hover:bg-signal-orange-hover active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
      secondary:
        "bg-concrete text-carbon border-carbon hover:bg-raw-paper-light active:translate-x-[1px] active:translate-y-[1px]",
      outline:
        "bg-raw-paper-light text-carbon border-carbon border-2 hover:bg-concrete active:translate-x-[1px] active:translate-y-[1px]",
      ghost:
        "bg-transparent text-carbon border-transparent hover:bg-concrete/50",
    }[variant];

    const sizes = {
      sm: "h-8 px-3 text-xs gap-1.5 uppercase tracking-wider font-mono",
      md: "h-9 px-4 text-xs sm:text-sm gap-2 uppercase tracking-wider font-mono",
      lg: "h-11 px-6 text-sm gap-2.5 uppercase tracking-wider font-mono",
    }[size];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${base} ${variants} ${sizes} ${className}`}
        {...props}
      >
        {isLoading && (
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-none animate-spin" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
