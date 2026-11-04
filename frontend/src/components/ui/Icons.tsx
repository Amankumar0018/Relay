import React from "react";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

export const IconDocument: React.FC<IconProps> = ({ size = 16, className = "", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" strokeLinejoin="miter" className={className} {...props}>
    <path d="M4 2h8l4 4v12H4V2z" />
    <path d="M12 2v4h4" />
    <path d="M7 10h6" />
    <path d="M7 13h4" />
  </svg>
);

export const IconFileText: React.FC<IconProps> = ({ size = 16, className = "", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" strokeLinejoin="miter" className={className} {...props}>
    <path d="M4 2h8l4 4v12H4V2z" />
    <path d="M12 2v4h4" />
    <path d="M7 9h6" />
    <path d="M7 12h6" />
    <path d="M7 15h3" />
  </svg>
);

export const IconArchive: React.FC<IconProps> = ({ size = 16, className = "", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" strokeLinejoin="miter" className={className} {...props}>
    <path d="M2 3h16v4H2V3z" />
    <path d="M3 7v10h14V7" />
    <path d="M8 11h4" />
  </svg>
);

export const IconNetwork: React.FC<IconProps> = ({ size = 16, className = "", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" strokeLinejoin="miter" className={className} {...props}>
    <rect x="8" y="2" width="4" height="4" />
    <rect x="2" y="14" width="4" height="4" />
    <rect x="14" y="14" width="4" height="4" />
    <path d="M10 6v4m-6 4v-2l6-2 6 2v2" />
  </svg>
);

export const IconInvestigation: React.FC<IconProps> = ({ size = 16, className = "", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" strokeLinejoin="miter" className={className} {...props}>
    <circle cx="9" cy="9" r="6" />
    <path d="M13.5 13.5L18 18" />
    <path d="M9 6v3" />
    <rect x="8.5" y="11" width="1" height="1" fill="currentColor" />
  </svg>
);

export const IconTask: React.FC<IconProps> = ({ size = 16, className = "", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" strokeLinejoin="miter" className={className} {...props}>
    <rect x="3" y="3" width="14" height="14" />
    <path d="M6 10l3 3 5-6" />
  </svg>
);

export const IconAgent: React.FC<IconProps> = ({ size = 16, className = "", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" strokeLinejoin="miter" className={className} {...props}>
    <rect x="4" y="5" width="12" height="11" />
    <path d="M10 2v3m-3 0h6" />
    <rect x="7" y="9" width="2" height="2" fill="currentColor" />
    <rect x="11" y="9" width="2" height="2" fill="currentColor" />
    <path d="M7 13h6" />
  </svg>
);

export const IconBrain: React.FC<IconProps> = ({ size = 16, className = "", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" strokeLinejoin="miter" className={className} {...props}>
    <path d="M6 4a3 3 0 00-3 3c0 1.3.8 2.4 2 2.8-.2.4-.3.8-.3 1.2 0 1.7 1.3 3 3 3h.3" />
    <path d="M14 4a3 3 0 013 3c0 1.3-.8 2.4-2 2.8.2.4.3.8.3 1.2 0 1.7-1.3 3-3 3h-.3" />
    <path d="M8 4v12m4-12v12" />
  </svg>
);

export const IconDossier: React.FC<IconProps> = ({ size = 16, className = "", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" strokeLinejoin="miter" className={className} {...props}>
    <path d="M3 3h10l4 4v10H3V3z" />
    <path d="M13 3v4h4" />
    <path d="M7 8h3m-3 3h6m-6 3h4" />
  </svg>
);

export const IconSettings: React.FC<IconProps> = ({ size = 16, className = "", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" strokeLinejoin="miter" className={className} {...props}>
    <rect x="7" y="7" width="6" height="6" />
    <path d="M10 2v3m0 10v3m8-8h-3M5 10H2m12.5-5.5l-2.1 2.1M7.6 12.4l-2.1 2.1m10.6 0l-2.1-2.1M7.6 7.6L5.5 5.5" />
  </svg>
);

export const IconUpload: React.FC<IconProps> = ({ size = 16, className = "", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" strokeLinejoin="miter" className={className} {...props}>
    <path d="M10 13V3m0 0L6 7m4-4l4 4" />
    <path d="M3 13v4h14v-4" />
  </svg>
);

export const IconCheck: React.FC<IconProps> = ({ size = 16, className = "", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className={className} {...props}>
    <path d="M4 10l4 4 8-9" />
  </svg>
);

export const IconAlert: React.FC<IconProps> = ({ size = 16, className = "", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" strokeLinejoin="miter" className={className} {...props}>
    <path d="M10 2l8 15H2L10 2z" />
    <path d="M10 8v4" />
    <rect x="9.5" y="14" width="1" height="1" fill="currentColor" />
  </svg>
);

export const IconInfo: React.FC<IconProps> = ({ size = 16, className = "", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" strokeLinejoin="miter" className={className} {...props}>
    <rect x="3" y="3" width="14" height="14" />
    <path d="M10 9v5m0-8h.01" />
  </svg>
);

export const IconClose: React.FC<IconProps> = ({ size = 16, className = "", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className={className} {...props}>
    <path d="M5 5l10 10m0-10L5 15" />
  </svg>
);

export const IconChevronRight: React.FC<IconProps> = ({ size = 16, className = "", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className={className} {...props}>
    <path d="M8 5l5 5-5 5" />
  </svg>
);

export const IconChevronDown: React.FC<IconProps> = ({ size = 16, className = "", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className={className} {...props}>
    <path d="M5 8l5 5 5-5" />
  </svg>
);

export const IconArrowRight: React.FC<IconProps> = ({ size = 16, className = "", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className={className} {...props}>
    <path d="M3 10h14m-5-5l5 5-5 5" />
  </svg>
);

export const IconShield: React.FC<IconProps> = ({ size = 16, className = "", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" strokeLinejoin="miter" className={className} {...props}>
    <path d="M10 2L3 5v5c0 4.5 3 7 7 8 4-1 7-3.5 7-8V5l-7-3z" />
  </svg>
);

export const IconDatabase: React.FC<IconProps> = ({ size = 16, className = "", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" strokeLinejoin="miter" className={className} {...props}>
    <rect x="3" y="3" width="14" height="4" />
    <rect x="3" y="8" width="14" height="4" />
    <rect x="3" y="13" width="14" height="4" />
    <circle cx="6" cy="5" r="0.75" fill="currentColor" />
    <circle cx="6" cy="10" r="0.75" fill="currentColor" />
    <circle cx="6" cy="15" r="0.75" fill="currentColor" />
  </svg>
);

export const IconTerminal: React.FC<IconProps> = ({ size = 16, className = "", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" strokeLinejoin="miter" className={className} {...props}>
    <rect x="2" y="3" width="16" height="14" />
    <path d="M6 8l3 2-3 2" />
    <path d="M11 12h3" />
  </svg>
);

export const IconUser: React.FC<IconProps> = ({ size = 16, className = "", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" strokeLinejoin="miter" className={className} {...props}>
    <rect x="7" y="3" width="6" height="6" />
    <path d="M3 17v-3h14v3" />
  </svg>
);

export const IconBuilding: React.FC<IconProps> = ({ size = 16, className = "", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" strokeLinejoin="miter" className={className} {...props}>
    <rect x="4" y="3" width="12" height="15" />
    <rect x="7" y="6" width="2" height="2" />
    <rect x="11" y="6" width="2" height="2" />
    <rect x="7" y="10" width="2" height="2" />
    <rect x="11" y="10" width="2" height="2" />
    <path d="M9 18v-3h2v3" />
  </svg>
);

export const IconSearch: React.FC<IconProps> = ({ size = 16, className = "", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className={className} {...props}>
    <circle cx="8.5" cy="8.5" r="5.5" />
    <path d="M13 13l4.5 4.5" />
  </svg>
);

export const IconExternal: React.FC<IconProps> = ({ size = 16, className = "", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" strokeLinejoin="miter" className={className} {...props}>
    <path d="M9 4H4v12h12v-5" />
    <path d="M11 4h5v5" />
    <path d="M16 4l-8 8" />
  </svg>
);

export const IconMenu: React.FC<IconProps> = ({ size = 16, className = "", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className={className} {...props}>
    <path d="M3 5h14M3 10h14M3 15h14" />
  </svg>
);

export const IconFilter: React.FC<IconProps> = ({ size = 16, className = "", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" strokeLinejoin="miter" className={className} {...props}>
    <path d="M3 4h14l-5.5 6.5v5l-3 1.5v-6.5L3 4z" />
  </svg>
);

export const IconCommand: React.FC<IconProps> = ({ size = 16, className = "", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" strokeLinejoin="miter" className={className} {...props}>
    <rect x="4" y="4" width="12" height="12" />
    <path d="M4 10h12M10 4v12" />
  </svg>
);
