"use client";

import { ReactNode } from "react";

interface MetricProps {
  label: string;
  value: ReactNode;
  unit?: string;
  /** Signed delta, e.g. "-8.4%". Tone is derived, not decorative. */
  delta?: string;
  deltaTone?: "positive" | "negative" | "neutral";
  note?: string;
  action?: ReactNode;
}

/**
 * The only way a headline number is rendered inside /app. Tabular figures,
 * editorial display face, label above, note below. No icon, no wash.
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
    <div className="app-card flex h-full flex-col p-4">
      <p className="app-label mb-2 break-words">{label}</p>

      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="app-metric text-[1.75rem] break-words">{value}</span>
        {unit && (
          <span className="text-sm font-medium text-muted-foreground break-words">
            {unit}
          </span>
        )}
        {delta && (
          <span
            className={`app-num text-sm font-medium ${
              deltaTone === "positive"
                ? "text-primary"
                : deltaTone === "negative"
                  ? "text-destructive"
                  : "text-muted-foreground"
            }`}
          >
            {delta}
          </span>
        )}
      </div>

      {note && <p className="app-meta mt-2 break-words">{note}</p>}

      {action && <div className="mt-3">{action}</div>}
    </div>
  );
};

interface MetricRowProps {
  children: ReactNode;
  /** Column count at lg. Defaults to 4. */
  columns?: 2 | 3 | 4;
}

export const MetricRow = ({ children, columns = 4 }: MetricRowProps) => {
  const grid = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4"
  }[columns];

  return <div className={`grid grid-cols-1 gap-4 ${grid}`}>{children}</div>;
};
