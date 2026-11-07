"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { IconMenu, IconClose } from "@/components/ui/Icons";

export const PublicNav: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Platform", href: "/platform", code: "01" },
    { label: "How It Works", href: "/how-it-works", code: "02" },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-raw-paper border-b-2 border-carbon">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group" data-cursor="HOME">
          <div className="w-5 h-5 bg-signal-orange border-2 border-carbon shadow-[2px_2px_0px_#171717] group-hover:translate-x-[1px] group-hover:translate-y-[1px] transition-transform" />
          <div className="flex items-baseline gap-2">
            <span className="font-display font-black text-2xl tracking-tighter text-carbon uppercase">
              Relay
            </span>
            <span className="font-mono text-[10px] text-carbon/60 uppercase tracking-widest hidden sm:inline">
              // CONTINUITY PLATFORM
            </span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6 text-xs font-mono">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                data-cursor="NAV"
                className={`relative uppercase tracking-wider py-1 transition-colors ${
                  isActive
                    ? "text-signal-orange font-bold"
                    : "text-carbon/80 hover:text-signal-orange"
                }`}
              >
                [{link.code} {link.label}]
                {isActive && (
                  <motion.div
                    layoutId="publicNavUnderline"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-signal-orange"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
          <div className="h-4 w-[2px] bg-carbon/20" />
          <Link href="/app">
            <Button variant="signal" size="sm" magnetic={true} data-cursor="WORKSPACE">
              Enter Workspace
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <Link href="/app">
            <Button variant="signal" size="sm">
              Workspace
            </Button>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 border-2 border-carbon bg-raw-paper-light text-carbon"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <IconClose size={18} /> : <IconMenu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-b-2 border-carbon bg-raw-paper-light p-4 space-y-3 text-xs font-mono overflow-hidden"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-carbon uppercase font-bold tracking-wider hover:text-signal-orange border-b border-carbon/20"
              >
                [{link.code}] {link.label}
              </Link>
            ))}
            <div className="pt-2">
              <Link href="/app" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="signal" size="sm" className="w-full">
                  Enter Organizational Workspace
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
