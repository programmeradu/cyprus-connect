"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * The console button. One primary per page; everything else is quiet.
 * Height 38px, radius 10px, no gradient, no icon-only labels.
 */
export function Btn({
  variant = "quiet",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "quiet" | "text" }) {
  return (
    <button type="button" className={`vck-btn vck-btn-${variant}`} {...rest}>
      {children}
    </button>
  );
}

/** A state word with a dot. The dot is never the only signal. */
export function State({
  tone = "idle",
  children,
}: {
  tone?: "live" | "good" | "warn" | "bad" | "idle";
  children: ReactNode;
}) {
  return (
    <span className="vck-state" data-tone={tone}>
      <i aria-hidden="true" />
      {children}
    </span>
  );
}

/** A labelled slot for a chart or any drawn instrument. */
export function ChartFrame({
  label,
  meta,
  height = 220,
  children,
}: {
  label?: string;
  meta?: ReactNode;
  height?: number;
  children: ReactNode;
}) {
  return (
    <div className="vck-chart">
      {(label || meta) && (
        <div className="vck-chart-head">
          <span>{label}</span>
          {meta}
        </div>
      )}
      <div className="vck-chart-body" style={{ minHeight: height }}>
        {children}
      </div>
    </div>
  );
}

/** A horizontal share bar. Used for coverage, progress and completeness. */
export function Bar({ pct, tone = "lime" }: { pct: number; tone?: "lime" | "warn" | "bad" }) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <span
      className="vck-bar"
      data-tone={tone}
      role="img"
      aria-label={`${clamped} percent`}
    >
      <i style={{ width: `${clamped}%` }} />
    </span>
  );
}
