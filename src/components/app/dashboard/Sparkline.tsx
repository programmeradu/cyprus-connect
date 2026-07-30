"use client";

import { useEffect, useId, useRef, useState } from "react";

interface SparklineProps {
  /** Oldest to newest. Fewer than 2 points renders a flat rule. */
  points: number[];
  /** Accessible summary of the series. */
  label: string;
  height?: number;
  className?: string;
}

/**
 * A hairline series plot. No axes, no grid, no fill wash beyond a faint
 * value step. The stroke draws once on mount, then holds still.
 */
export const Sparkline = ({
  points,
  label,
  height = 56,
  className = ""
}: SparklineProps) => {
  const gradientId = useId();
  const pathRef = useRef<SVGPathElement | null>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setDrawn(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  const width = 240;
  const pad = 3;

  if (!points.length) {
    return (
      <div
        className={`flex items-center ${className}`}
        style={{ height }}
        role="img"
        aria-label={`${label}: no data yet`}
      >
        <span className="h-px w-full bg-[var(--app-rule)]" />
      </div>
    );
  }

  const series = points.length === 1 ? [points[0], points[0]] : points;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;

  const coords = series.map((value, index) => {
    const x = pad + (index * (width - pad * 2)) / (series.length - 1);
    const y = pad + (1 - (value - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });

  const line = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");

  const area = `${line} L${coords[coords.length - 1][0].toFixed(2)} ${height - pad} L${coords[0][0].toFixed(2)} ${height - pad} Z`;

  const last = coords[coords.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={`w-full ${className}`}
      style={{ height }}
      role="img"
      aria-label={label}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.14" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        ref={pathRef}
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        style={{
          strokeDasharray: 1000,
          strokeDashoffset: drawn ? 0 : 1000,
          transition: "stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)"
        }}
      />
      <circle cx={last[0]} cy={last[1]} r="2.25" fill="currentColor" />
    </svg>
  );
};
