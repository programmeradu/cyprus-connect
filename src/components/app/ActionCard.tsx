"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { useTranslations } from "next-intl";

interface ActionCardProps {
  title: string;
  description: string;
  impact?: string;
  icon?: ReactNode;
  completed?: boolean;
  onComplete?: () => void;
  difficulty?: "low" | "medium" | "high" | "easy" | "hard" | string;
  points?: number;
  costEur?: number | null;
  savedEurYr?: number | null;
  co2KgYr?: number | null;
  paybackYrs?: number | null;
  className?: string;
}

/**
 * Workspace action plate. Bordered rectangular tag for impact level,
 * no pill chips, full label text (never truncated or empty),
 * backed by verified savings/cost figures when available.
 */
export const ActionCard = ({
  title,
  description,
  impact,
  completed = false,
  onComplete,
  difficulty = "medium",
  costEur,
  savedEurYr,
  co2KgYr,
  paybackYrs,
  className = ""
}: ActionCardProps) => {
  const t = useTranslations("dashboard.actions.card");

  // Normalize difficulty / impact keywords
  const diffStr = (difficulty || "medium").toLowerCase();
  const impStr = (impact || "").toLowerCase();

  const isLow = diffStr === "low" || diffStr === "easy" || impStr === "low";
  const isHigh = diffStr === "high" || diffStr === "hard" || impStr === "high";

  const tone = isLow ? "positive" : isHigh ? "critical" : "caution";
  const tagLabel = isLow ? t("impactLow") : isHigh ? t("impactHigh") : t("impactMedium");

  // Only display impact as separate text if it's descriptive (e.g. "-15% Scope 2"), not a generic keyword
  const hasDescriptiveImpact = impact && !["high", "medium", "low", "easy", "hard"].includes(impStr);

  return (
    <motion.div
      className={`vck-card flex h-full flex-col p-4 ${className}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <h4 className="text-[0.9375rem] font-semibold leading-snug break-words">
        {title}
      </h4>

      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground break-words">
        {description}
      </p>

      {hasDescriptiveImpact && (
        <p className="vck-meta mt-3">
          <span className="font-semibold text-foreground vck-num">{impact}</span>
        </p>
      )}

      <div className="mt-3">
        <span className="vck-tag" data-tone={tone}>
          {tagLabel}
        </span>
      </div>

      {(savedEurYr || co2KgYr || paybackYrs || costEur) && (
        <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs border-t border-border/40 pt-2.5">
          {savedEurYr !== undefined && savedEurYr !== null && (
            <div>
              <span className="text-muted-foreground block text-[0.7rem] uppercase tracking-wider">Est. Savings</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 vck-num">€{Math.round(savedEurYr).toLocaleString()}/yr</span>
            </div>
          )}
          {co2KgYr !== undefined && co2KgYr !== null && (
            <div>
              <span className="text-muted-foreground block text-[0.7rem] uppercase tracking-wider">Carbon Cut</span>
              <span className="font-semibold text-foreground vck-num">-{Math.round(co2KgYr).toLocaleString()} kg CO2e</span>
            </div>
          )}
          {paybackYrs !== undefined && paybackYrs !== null && (
            <div>
              <span className="text-muted-foreground block text-[0.7rem] uppercase tracking-wider">Payback</span>
              <span className="font-semibold text-foreground vck-num">{paybackYrs.toFixed(1)} yrs</span>
            </div>
          )}
          {costEur !== undefined && costEur !== null && (
            <div>
              <span className="text-muted-foreground block text-[0.7rem] uppercase tracking-wider">Est. Cost</span>
              <span className="font-semibold text-foreground vck-num">€{Math.round(costEur).toLocaleString()}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex-1" />

      {onComplete && (
        <button
          onClick={onComplete}
          disabled={completed}
          className={`vck-btn mt-4 w-full ${completed ? "" : "vck-btn-primary"}`}
        >
          <span className="break-words text-center">
            {completed ? t("completed") : t("markComplete")}
          </span>
        </button>
      )}
    </motion.div>
  );
};
