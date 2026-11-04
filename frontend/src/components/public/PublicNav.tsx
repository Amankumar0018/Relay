"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { IconMenu, IconClose } from "@/components/ui/Icons";

export const PublicNav: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Platform", href: "/platform" },
    { label: "How It Works", href: "/how-it-works" },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-paper/95 backdrop-blur-xs border-b border-rule">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-serif italic text-xl font-bold tracking-tight text-ink">
            Relay
          </span>
          <span className="text-[10px] font-sans uppercase tracking-widest text-ink-secondary hidden sm:inline">
            Organizational Continuity
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6 text-xs font-sans">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors ${
                pathname === link.href
                  ? "text-ink font-semibold"
                  : "text-ink-secondary hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="h-4 w-px bg-rule" />
          <Link href="/app">
            <Button variant="primary" size="sm">
              Enter Workspace
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <Link href="/app">
            <Button variant="primary" size="sm">
              Workspace
            </Button>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded text-ink-secondary hover:text-ink"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <IconClose size={18} /> : <IconMenu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-rule bg-paper-surface p-4 space-y-3 text-xs font-sans">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1 text-ink-secondary hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-rule">
            <Link href="/app" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" size="sm" className="w-full">
                Enter Organizational Workspace
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

