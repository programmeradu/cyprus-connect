"use client";

import type { ReactNode } from "react";

/**
 * A designed empty state: what is missing, why, and one thing to do.
 * "No data" alone is not allowed anywhere in the console.
 */
export function Empty({
  title,
  body,
  action,
  tone = "quiet",
  children,
}: {
  title: string;
  body?: string;
  action?: { label: string; onClick?: () => void; href?: string };
  tone?: "quiet" | "bad" | "warn";
  children?: ReactNode;
}) {
  return (
    <div className="vck-empty" data-tone={tone} role={tone === "bad" ? "alert" : undefined}>
      <strong>{title}</strong>
      {body && <p>{body}</p>}
      {children}
      {action &&
        (action.href ? (
          <a className="vck-btn" href={action.href}>
            {action.label}
          </a>
        ) : (
          <button type="button" className="vck-btn" onClick={action.onClick}>
            {action.label}
          </button>
        ))}
    </div>
  );
}

interface AiUnavailableProps {
  /** What the user was trying to do, e.g. "generate this report". */
  feature: string;
  onRetry?: () => void;
}

/**
 * Honest state for model surfaces when the key is missing or refused.
 * Better than a silent failure or a spinner that never ends.
 */
export function AiUnavailable({ feature, onRetry }: AiUnavailableProps) {
  return (
    <div className="vck-empty" data-tone="warn">
      <strong>The model is not available</strong>
      <p>
        Vuneli cannot {feature} because the model key is missing or was refused.
        Everything else on this page keeps working. Add a valid key in workspace
        settings to turn this back on.
      </p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="vck-btn">
          Try again
        </button>
      )}
    </div>
  );
}
