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
  difficulty?: "low" | "medium" | "high";
  points?: number;
  className?: string;
}

/**
 * Workspace action plate. Bordered rectangular tag for impact level,
 * no pill chips, no decorative icon, full label text (never truncated).
 */
export const ActionCard = ({
  title,
  description,
  impact,
  completed = false,
  onComplete,
  difficulty = "medium",
  className = ""
}: ActionCardProps) => {
  const t = useTranslations("dashboard.actions.card");

  const impactTone: Record<string, string> = {
    low: "positive",
    medium: "caution",
    high: "critical"
  };
  const impactLabels = {
    low: t("impactLow"),
    medium: t("impactMedium"),
    high: t("impactHigh")
  };

  return (
    <motion.div
      className={`app-card flex h-full flex-col p-4 ${className}`}
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

      {impact && (
        <p className="app-meta mt-3">
          <span className="font-semibold text-foreground app-num">{impact}</span>
        </p>
      )}

      <div className="mt-3">
        <span className="app-tag" data-tone={impactTone[difficulty]}>
          {impactLabels[difficulty]}
        </span>
      </div>

      <div className="flex-1" />

      {onComplete && (
        <button
          onClick={onComplete}
          disabled={completed}
          className={`app-btn mt-4 w-full ${completed ? "app-btn-ghost" : ""}`}
        >
          <span className="break-words text-center">
            {completed ? t("completed") : t("markComplete")}
          </span>
        </button>
      )}
    </motion.div>
  );
};
