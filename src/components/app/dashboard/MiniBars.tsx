"use client";

export interface BarPoint {
  label: string;
  value: number;
}

interface MiniBarsProps {
  points: BarPoint[];
  label: string;
  unit?: string;
  precision?: number;
  height?: number;
  /** How many axis captions to print. The rest stay unlabelled. */
  maxLabels?: number;
  className?: string;
}

/**
 * A column series at panel scale. Bars are flat rectangles on the accent,
 * captions are hairline meta text, and long label sets thin out instead of
 * overlapping.
 */
export const MiniBars = ({
  points,
  label,
  unit,
  precision = 0,
  height = 88,
  maxLabels = 4,
  className = ""
}: MiniBarsProps) => {
  if (!points.length) {
    return (
      <div className={`flex items-end ${className}`} style={{ height }} role="img" aria-label={`${label}: no data yet`}>
        <span className="h-px w-full bg-[var(--app-rule)]" />
      </div>
    );
  }

  const max = Math.max(...points.map((p) => p.value)) || 1;
  const stride = Math.max(1, Math.ceil(points.length / maxLabels));

  return (
    <div className={className}>
      <div className="flex items-end gap-[3px]" style={{ height }} role="img" aria-label={label}>
        {points.map((p, i) => (
          <div
            key={`${p.label}-${i}`}
            className="group relative flex-1"
            style={{ height: "100%" }}
            title={`${p.label}: ${p.value.toFixed(precision)}${unit ? ` ${unit}` : ""}`}
          >
            <div className="absolute inset-x-0 bottom-0 bg-[var(--app-rule-strong)] transition-colors group-hover:bg-primary"
              style={{ height: `${Math.max(2, (p.value / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-[3px]">
        {points.map((p, i) => (
          <span
            key={`cap-${p.label}-${i}`}
            className="app-meta min-w-0 flex-1 truncate text-center text-[0.6875rem]"
            aria-hidden={i % stride !== 0}
          >
            {i % stride === 0 ? p.label : "\u00A0"}
          </span>
        ))}
      </div>
    </div>
  );
};
