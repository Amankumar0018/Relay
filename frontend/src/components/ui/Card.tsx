import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "surface" | "plate" | "concrete" | "carbon";
  shadow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className = "",
  variant = "surface",
  shadow = false,
  children,
  ...props
}) => {
  const variants = {
    surface: "bg-raw-paper-light border-2 border-carbon",
    plate: "bg-raw-paper border border-carbon",
    concrete: "bg-concrete border border-carbon",
    carbon: "bg-carbon text-raw-paper border-2 border-carbon",
  }[variant];

  const shadowClass = shadow ? "shadow-brutal" : "";

  return (
    <div className={`rounded-none ${variants} ${shadowClass} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  children,
  ...props
}) => (
  <div className={`p-4 sm:p-5 border-b border-carbon/20 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className = "",
  children,
  ...props
}) => (
  <h3 className={`font-display font-bold text-base text-carbon tracking-tight uppercase ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className = "",
  children,
  ...props
}) => (
  <p className={`font-sans text-xs text-carbon/70 mt-1 leading-relaxed ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  children,
  ...props
}) => (
  <div className={`p-4 sm:p-5 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  children,
  ...props
}) => (
  <div className={`p-4 sm:p-5 border-t border-carbon/20 bg-concrete/30 flex items-center justify-between ${className}`} {...props}>
    {children}
  </div>
);
