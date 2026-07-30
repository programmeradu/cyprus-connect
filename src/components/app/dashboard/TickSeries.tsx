"use client";

import { useId, useState } from "react";

export interface TickPoint {
  label: string;
  value: number;
}

interface TickSeriesProps {
  /** Oldest to newest. */
  points: TickPoint[];
  /** Accessible summary of the series. */
  label: string;
  /** Appended to the tooltip value. */
  unit?: string;
  /** Decimal places in the tooltip. */
  precision?: number;
  height?: number;
  className?: string;
}

const VIEW_W = 720;

/** Catmull-Rom to cubic bezier, so the ridge reads as a curve, not a zigzag. */
const smoothPath = (coords: ReadonlyArray<readonly [number, number]>) => {
  if (coords.length < 2) return "";
  let d = `M${coords[0][0].toFixed(2)} ${coords[0][1].toFixed(2)}`;
  for (let i = 0; i < coords.length - 1; i += 1) {
    const p0 = coords[i - 1] ?? coords[i];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d;
};

/**
 * A ridge line above a comb of value ticks. One accent stroke, hairline
 * ticks, and a hover read-out. No axes, no grid, no fill beyond a faint
 * step under the ridge.
 */
export const TickSeries = ({
  points,
  label,
  unit,
  precision = 1,
  height = 168,
  className = ""
}: TickSeriesProps) => {
  const gradientId = useId();
  const [active, setActive] = useState<number | null>(null);

  if (points.length < 2) {
    return (
      <div
        className={`flex items-end ${className}`}
        style={{ height }}
        role="img"
        aria-label={`${label}: not enough data yet`}
      >
        <span className="h-px w-full bg-[var(--app-rule)]" />
      </div>
    );
  }

  const values = points.map((p) => p.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || Math.abs(max) || 1;

  const padTop = 18;
  const ridgeBand = height * 0.46;
  const combTop = height * 0.62;
  const combBottom = height - 14;
  const combSpan = combBottom - combTop;

  const step = VIEW_W / points.length;
  const x = (i: number) => step * i + step / 2;

  const ridge = points.map((p, i) => {
    const y = padTop + (1 - (p.value - min) / span) * (ridgeBand - padTop);
    return [x(i), y] as const;
  });

  const line = smoothPath(ridge);
  const area = `${line} L${ridge[ridge.length - 1][0].toFixed(2)} ${ridgeBand} L${ridge[0][0].toFixed(2)} ${ridgeBand} Z`;

  const activePoint = active != null ? points[active] : null;

  return (
    <div className={`relative w-full ${className}`} style={{ height }}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${height}`}
        preserveAspectRatio="none"
        className="h-full w-full overflow-visible"
        role="img"
        aria-label={label}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* Value comb */}
        {points.map((p, i) => {
          const h = Math.max(3, ((p.value - min) / span) * combSpan * 0.86 + combSpan * 0.14);
          const isActive = active === i;
          return (
            <line
              key={`${p.label}-${i}`}
              x1={x(i)}
              x2={x(i)}
              y1={combBottom}
              y2={combBottom - h}
              stroke={isActive ? "var(--primary)" : "var(--app-rule-strong)"}
              strokeWidth={isActive ? 2 : 1.25}
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
            />
          );
        })}

        {active != null && (
          <line
            x1={x(active)}
            x2={x(active)}
            y1={ridge[active][1]}
            y2={combBottom}
            stroke="var(--primary)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>

      {/* Hover read-out */}
      {activePoint && (
        <div
          className="pointer-events-none absolute top-0 z-10 min-w-[8.5rem] -translate-x-1/2 rounded-md border border-[var(--app-rule-strong)] bg-[var(--app-surface-1)] px-3 py-2 shadow-sm"
          style={{
            left: `clamp(4.75rem, ${((active! + 0.5) / points.length) * 100}%, calc(100% - 4.75rem))`
          }}
        >
          <p className="app-meta leading-tight break-words">{activePoint.label}</p>
          <p className="app-num mt-0.5 text-sm font-semibold leading-tight break-words">
            {activePoint.value.toFixed(precision)}
            {unit ? <span className="ml-1 text-xs font-medium text-muted-foreground">{unit}</span> : null}
          </p>
        </div>
      )}

      {/* Hit areas */}
      <div
        className="absolute inset-0 flex"
        onMouseLeave={() => setActive(null)}
      >
        {points.map((p, i) => (
          <button
            key={`hit-${p.label}-${i}`}
            type="button"
            aria-label={`${p.label}: ${p.value.toFixed(precision)}${unit ? ` ${unit}` : ""}`}
            className="h-full flex-1 cursor-default focus-visible:bg-[color-mix(in_oklab,var(--primary)_8%,transparent)]"
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
            onTouchStart={() => setActive(i)}
          />
        ))}
      </div>
    </div>
  );
};
