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
            <div
              className={`absolute inset-x-0 bottom-0 transition-colors group-hover:bg-primary ${
                i === points.length - 1 ? "bg-primary" : "bg-[var(--app-rule-strong)]"
              }`}
              style={{ height: `${Math.max(2, (p.value / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <span className="app-meta text-[0.6875rem]">{points[0].label}</span>
        {points.length > 2 && (
          <span className="app-meta text-[0.6875rem]">
            {points[Math.floor((points.length - 1) / 2)].label}
          </span>
        )}
        <span className="app-meta text-[0.6875rem]">{points[points.length - 1].label}</span>
      </div>
    </div>
  );
};
