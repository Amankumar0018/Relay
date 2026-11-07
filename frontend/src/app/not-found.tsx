import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-raw-paper text-carbon flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="max-w-md border-2 border-carbon bg-raw-paper-light p-8 space-y-5 shadow-brutal">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-signal-orange text-raw-paper font-mono text-[10px] uppercase font-bold border border-carbon">
          [ERROR 404] // UNINDEXED COORDINATE
        </div>
        <h1 className="font-display font-black text-3xl uppercase tracking-tight text-carbon">
          Record Not Found
        </h1>
        <p className="font-mono text-xs text-carbon/70 leading-relaxed">
          The requested coordinate or institutional record is not registered in the Relay persistence graph.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link href="/app">
            <Button variant="signal" size="sm">
              Return to Workspace
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" size="sm">
              Public Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

