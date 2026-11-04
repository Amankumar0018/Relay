import React from "react";
import Link from "next/link";

export const PublicFooter: React.FC = () => {
  return (
    <footer className="border-t-2 border-carbon bg-carbon text-raw-paper py-12 text-xs font-mono">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-raw-paper/20">
          {/* Col 1 */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 bg-signal-orange" />
              <span className="font-display font-black text-xl tracking-tight uppercase text-raw-paper">
                RELAY
              </span>
            </div>
            <p className="text-xs text-raw-paper/70 font-sans leading-relaxed max-w-sm">
              Industrial agentic organizational continuity platform. Preserving institutional decisions, tracking operational obligations, and engineering verifiable handovers.
            </p>
            <div className="pt-2 text-[10px] text-signal-orange uppercase tracking-wider">
              // NO CLOUD LEAKAGE • DOCKER + SQLITE PERSISTENCE
            </div>
          </div>

          {/* Col 2 */}
          <div className="md:col-span-3 space-y-2">
            <span className="text-[10px] uppercase font-bold text-raw-paper/40 tracking-widest block">
              [PLATFORM NAVIGATION]
            </span>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/platform" className="hover:text-signal-orange transition-colors">
                  Platform Architecture
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-signal-orange transition-colors">
                  The Continuity Methodology
                </Link>
              </li>
              <li>
                <Link href="/app" className="text-signal-orange font-bold hover:underline">
                  Enter Organizational Workspace →
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="md:col-span-4 space-y-2">
            <span className="text-[10px] uppercase font-bold text-raw-paper/40 tracking-widest block">
              [LEGAL & GOVERNANCE]
            </span>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/privacy" className="hover:text-signal-orange transition-colors">
                  Data Sovereignty & Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-signal-orange transition-colors">
                  Terms & Conditions of Service
                </Link>
              </li>
              <li className="text-raw-paper/40 text-[11px] pt-1">
                Local-first deployment • Zero document telemetry
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-raw-paper/50">
          <p>© {new Date().getFullYear()} RELAY SYSTEMS. ALL RIGHTS RESERVED.</p>
          <p className="uppercase">
            SYSTEM ENGINE: PYTHON 3.12 SLIM • SQLITE WAL MODE • AIR-GAPPED READY
          </p>
        </div>
      </div>
    </footer>
  );
};
