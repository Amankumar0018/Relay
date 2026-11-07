import React from "react";
import { Magnetic } from "./Magnetic";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "signal";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  magnetic?: boolean;
  "data-cursor"?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      magnetic = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center font-sans font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-orange disabled:opacity-40 disabled:cursor-not-allowed select-none cursor-pointer border";

    const variants = {
      primary:
        "bg-carbon text-raw-paper border-carbon hover:bg-carbon-surface hover:shadow-brutal hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
      signal:
        "bg-signal-orange text-raw-paper border-carbon shadow-brutal hover:bg-signal-orange-hover hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
      secondary:
        "bg-concrete text-carbon border-carbon hover:bg-raw-paper-light hover:border-carbon hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5",
      outline:
        "bg-raw-paper-light text-carbon border-carbon border-2 hover:bg-concrete hover:shadow-brutal hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
      ghost:
        "bg-transparent text-carbon border-transparent hover:bg-concrete/60 hover:text-carbon active:translate-x-0.5 active:translate-y-0.5",
    }[variant];

    const sizes = {
      sm: "h-8 px-3 text-xs gap-1.5 uppercase tracking-wider font-mono",
      md: "h-9 px-4 text-xs sm:text-sm gap-2 uppercase tracking-wider font-mono",
      lg: "h-11 px-6 text-sm gap-2.5 uppercase tracking-wider font-mono",
    }[size];

    const buttonElement = (
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

    if (magnetic && !disabled && !isLoading) {
      return <Magnetic strength={6}>{buttonElement}</Magnetic>;
    }

    return buttonElement;
  }
);

Button.displayName = "Button";
