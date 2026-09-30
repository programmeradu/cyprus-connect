import React from "react";
import { motion } from "framer-motion";
import { 
  BuildingOfficeIcon, 
  BoltIcon, 
  TruckIcon, 
  ArrowTrendingDownIcon,
  ShieldCheckIcon,
  SparklesIcon
} from "@heroicons/react/24/outline";

export interface BentoCardProps {
  title: string;
  description: string;
  metric?: string;
  subMetric?: string;
  icon: React.ElementType;
  className?: string;
  badge?: string;
}

export function LuxuryBentoGrid() {
  const cards: BentoCardProps[] = [
    {
      title: "Real-Time EAC Grid Telemetry",
      description: "Direct connection to the Cyprus Transmission System Operator & bimonthly EAC bills.",
      metric: "610 gCO₂e/kWh",
      subMetric: "Heavy Fuel Oil Baseload Adjusted",
      icon: BoltIcon,
      badge: "Isolated Island Grid",
      className: "md:col-span-2 md:row-span-1 bg-gradient-to-br from-emerald-950/40 via-background to-background border-emerald-500/20"
    },
    {
      title: "Limassol Port CBAM Autopilot",
      description: "Automated customs XML generation for steel, cement, and aluminum maritime imports.",
      metric: "100% Audit-Ready",
      subMetric: "EU DG TAXUD Standard",
      icon: TruckIcon,
      badge: "Definitive 2026",
      className: "md:col-span-1 md:row-span-2 bg-gradient-to-br from-blue-950/30 via-background to-background border-blue-500/20"
    },
    {
      title: "Bank of Cyprus PSD2 Ingestion",
      description: "Automated transaction parsing for fuel, logistics, and merchant fleet accounts.",
      metric: "€0 Manual Labor",
      subMetric: "Direct Read-Only Rails",
      icon: BuildingOfficeIcon,
      badge: "Zero Friction",
      className: "md:col-span-1 md:row-span-1 bg-gradient-to-br from-purple-950/30 via-background to-background border-purple-500/20"
    },
    {
      title: "Calibrated Bayesian Credibility",
      description: "Mathematically proven confidence intervals for messy and ambiguous SME receipts.",
      metric: "90% Exact Bound",
      subMetric: "PCAF Category 15 Compliant",
      icon: ShieldCheckIcon,
      badge: "Proprietary Moat",
      className: "md:col-span-1 md:row-span-1 bg-gradient-to-br from-amber-950/30 via-background to-background border-amber-500/20"
    },
    {
      title: "Autonomous RIF & EIC Grant Assembler",
      description: "Matches open Cyprus Research & Innovation calls and pre-fills applications automatically.",
      metric: "Up to €2.5M",
      subMetric: "Non-Dilutive Capital Pipeline",
      icon: SparklesIcon,
      badge: "Active Grants",
      className: "md:col-span-2 md:row-span-1 bg-gradient-to-br from-teal-950/30 via-background to-background border-teal-500/20"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 w-full max-w-7xl mx-auto">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className={`relative overflow-hidden rounded-2xl border p-6 backdrop-blur-xl shadow-2xl transition-all hover:scale-[1.01] hover:border-foreground/30 ${card.className}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-foreground/5 border border-foreground/10 text-emerald-400">
                <Icon className="w-6 h-6" />
              </div>
              {card.badge && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-foreground/10 border border-foreground/15 text-foreground/80">
                  {card.badge}
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold tracking-tight text-foreground mb-1">{card.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">{card.description}</p>

            {card.metric && (
              <div className="mt-auto border-t border-foreground/10 pt-4 flex items-baseline justify-between">
                <div>
                  <div className="text-2xl font-black tracking-tight text-foreground">{card.metric}</div>
                  {card.subMetric && (
                    <div className="text-xs text-muted-foreground font-medium mt-0.5">{card.subMetric}</div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
