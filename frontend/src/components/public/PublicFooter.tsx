import React from "react";
import Link from "next/link";

export const PublicFooter: React.FC = () => {
  return (
    <footer className="border-t border-rule bg-paper-secondary py-10 text-xs text-ink-secondary">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-rule/80">
          <div className="space-y-1">
            <span className="font-serif italic text-lg font-bold text-ink">
              Relay
            </span>
            <p className="text-xs text-ink-secondary max-w-sm leading-relaxed">
              Preserving organizational memory, tracking responsibilities, and engineering verifiable leadership transitions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-sans">
            <Link href="/platform" className="hover:text-ink transition-colors">
              Platform
            </Link>
            <Link href="/how-it-works" className="hover:text-ink transition-colors">
              How It Works
            </Link>
            <Link href="/app" className="hover:text-ink transition-colors font-medium text-ink">
              Workspace Console
            </Link>
            <Link href="/privacy" className="hover:text-ink transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-ink transition-colors">
              Terms & Conditions
            </Link>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-ink-disabled font-sans">
          <p>© {new Date().getFullYear()} Relay Systems. All rights reserved.</p>
          <p>Local-first organizational data architecture • Python 3.12 + SQLite persistent engine</p>
        </div>
      </div>
    </footer>
  );
};

