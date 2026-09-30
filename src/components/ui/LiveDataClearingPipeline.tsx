import React, { useRef } from "react";
import { motion } from "framer-motion";
import { BuildingLibraryIcon, CpuChipIcon, BoltIcon, DocumentTextIcon, TruckIcon } from "@heroicons/react/24/outline";

export function LiveDataClearingPipeline() {
  return (
    <div className="relative w-full max-w-5xl mx-auto p-8 rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-background via-emerald-950/10 to-background overflow-hidden backdrop-blur-2xl">
      <div className="text-center mb-10">
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          Autonomous Telemetry Pipeline
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-foreground mt-3">
          Live Carbon & Financial Clearing Rails
        </h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-lg mx-auto">
          Raw operational telemetry streams directly into the Vuneli verification core with zero manual entry.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-8 relative z-10">
        {/* Source Nodes */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-border/60 bg-muted/30 flex items-center space-x-3 shadow-md hover:border-emerald-500/40 transition-all">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><BoltIcon className="w-5 h-5" /></div>
            <div>
              <div className="text-sm font-semibold text-foreground">EAC Electricity Portal</div>
              <div className="text-xs text-muted-foreground">Autonomous Browser Ingestion</div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border/60 bg-muted/30 flex items-center space-x-3 shadow-md hover:border-blue-500/40 transition-all">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400"><BuildingLibraryIcon className="w-5 h-5" /></div>
            <div>
              <div className="text-sm font-semibold text-foreground">Bank of Cyprus B2B API</div>
              <div className="text-xs text-muted-foreground">Direct PSD2 Transaction Stream</div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border/60 bg-muted/30 flex items-center space-x-3 shadow-md hover:border-amber-500/40 transition-all">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400"><TruckIcon className="w-5 h-5" /></div>
            <div>
              <div className="text-sm font-semibold text-foreground">Limassol Port Customs</div>
              <div className="text-xs text-muted-foreground">CBAM Bill of Lading OCR</div>
            </div>
          </div>
        </div>

        {/* Central Core Engine */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative p-6 rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-950/60 to-background shadow-[0_0_50px_rgba(16,185,129,0.2)] text-center">
            <div className="w-14 h-14 mx-auto rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 animate-pulse">
              <CpuChipIcon className="w-8 h-8" />
            </div>
            <div className="text-base font-bold text-foreground">Vuneli State Observer</div>
            <div className="text-xs text-emerald-400 font-mono mt-1">Calibrated Bayesian Core</div>
          </div>
        </div>

        {/* Audit & Compliance Outputs */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-border/60 bg-muted/30 flex items-center space-x-3 shadow-md">
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400"><DocumentTextIcon className="w-5 h-5" /></div>
            <div>
              <div className="text-sm font-semibold text-foreground">Bank-Ready ESG Pack</div>
              <div className="text-xs text-muted-foreground">PCAF Cat 15 Calibrated</div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border/60 bg-muted/30 flex items-center space-x-3 shadow-md">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><DocumentTextIcon className="w-5 h-5" /></div>
            <div>
              <div className="text-sm font-semibold text-foreground">CBAM Declaration XML</div>
              <div className="text-xs text-muted-foreground">EU Customs Registry Ready</div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border/60 bg-muted/30 flex items-center space-x-3 shadow-md">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400"><DocumentTextIcon className="w-5 h-5" /></div>
            <div>
              <div className="text-sm font-semibold text-foreground">EFRAG VSME XBRL</div>
              <div className="text-xs text-muted-foreground">Digital Corporate Taxonomy</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
