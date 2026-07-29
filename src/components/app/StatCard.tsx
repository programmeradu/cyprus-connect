"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: ReactNode;
  subtitle?: string;
  className?: string;
}

/**
 * Workspace metric plate. Flat surface, hairline rule, tabular figures.
 * Hierarchy comes from type size and weight, never from a wash or a shadow.
 */
export const StatCard = ({
  title,
  value,
  change,
  changeType = "neutral",
  subtitle,
  className = ""
}: StatCardProps) => {
  return (
    <motion.div
      className={`app-card p-4 ${className}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <p className="app-label mb-2">{title}</p>

      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="app-metric text-[1.75rem] break-words">{value}</span>
        {change && (
          <span
            className={`app-num text-sm font-medium ${
              changeType === "positive"
                ? "text-primary"
                : changeType === "negative"
                ? "text-destructive"
                : "text-muted-foreground"
            }`}
          >
            {change}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="app-meta mt-2 text-[0.8125rem]">{subtitle}</p>
      )}
    </motion.div>
  );
};
