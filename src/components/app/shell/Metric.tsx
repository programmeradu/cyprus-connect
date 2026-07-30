"use client";

import { ReactNode } from "react";

interface MetricProps {
  label: string;
  value: ReactNode;
  unit?: string;
  /** Signed change, e.g. "-8.4%". The tone is derived, not decorative. */
  delta?: string;
  deltaTone?: "positive" | "negative" | "neutral";
  note?: string;
  action?: ReactNode;
}

const TONE = {
  positive: "good",
  negative: "bad",
  neutral: "flat"
} as const;

/**
 * The only way a headline number is rendered inside /app. It draws the
 * console reading, so a figure looks the same on every page.
 */
export const Metric = ({
  label,
  value,
  unit,
  delta,
  deltaTone = "neutral",
  note,
  action
}: MetricProps) => {
  return (
    <div className="vck-reading">
      <small>{label}</small>
      <strong>
        {value}
        {unit && <em>{unit}</em>}
      </strong>
      {(delta || note) && (
        <span className="vck-reading-foot">
          {delta && <b data-tone={TONE[deltaTone]}>{delta}</b>}
          {note}
        </span>
      )}
      {action && <div className="vck-reading-action">{action}</div>}
    </div>
  );
};

interface MetricRowProps {
  children: ReactNode;
  /** Kept for the earlier call sites. The rail fits its own columns. */
  columns?: 2 | 3 | 4;
}

export const MetricRow = ({ children }: MetricRowProps) => (
  <div className="vck-reading-rail">{children}</div>
);
