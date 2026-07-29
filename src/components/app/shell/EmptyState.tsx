"use client";

import { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: { label: string; onClick?: () => void; href?: string };
  secondary?: ReactNode;
  tone?: "neutral" | "critical";
  className?: string;
}

/**
 * Designed empty / error state. Headline, one sentence of guidance, and at
 * most one primary action. Never a bare "No data".
 */
export const EmptyState = ({
  title,
  description,
  action,
  secondary,
  tone = "neutral",
  className = ""
}: EmptyStateProps) => {
  return (
    <div
      className={`app-card flex flex-col items-start gap-3 px-5 py-8 ${className}`}
    >
      <h3
        className={`text-[1.0625rem] font-semibold leading-snug ${
          tone === "critical" ? "text-destructive" : "text-foreground"
        }`}
      >
        {title}
      </h3>

      {description && (
        <p className="max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}

      {action && (
        action.href ? (
          <a href={action.href} className="app-btn mt-1">
            {action.label}
          </a>
        ) : (
          <button type="button" onClick={action.onClick} className="app-btn mt-1">
            {action.label}
          </button>
        )
      )}

      {secondary}
    </div>
  );
};
