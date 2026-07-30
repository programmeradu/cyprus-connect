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
 * Designed empty and error state: what is missing, why, and one thing to
 * do about it. A bare "No data" is not allowed in the console.
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
      className={`vck-empty ${className}`}
      data-tone={tone === "critical" ? "bad" : "quiet"}
      role={tone === "critical" ? "alert" : undefined}
    >
      <strong>{title}</strong>
      {description && <p>{description}</p>}

      {action &&
        (action.href ? (
          <a href={action.href} className="vck-btn">
            {action.label}
          </a>
        ) : (
          <button type="button" onClick={action.onClick} className="vck-btn">
            {action.label}
          </button>
        ))}

      {secondary}
    </div>
  );
};
