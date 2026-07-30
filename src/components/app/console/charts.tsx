"use client";

/**
 * Console instruments. Every chart is fed from the database series and
 * scales fluidly: the SVG stretches, the strokes do not.
 */

import { useMemo, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/* geometry                                                            */
/* ------------------------------------------------------------------ */

/** Catmull-Rom to cubic bezier. Gives the concept's soft signal line. */
function smoothPath(pts: [number, number][]) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    d += ` C ${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(2)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(2)}, ${(
      p2[0] -
      (p3[0] - p1[0]) / 6
    ).toFixed(2)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(2)}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

export interface SeriesPoint {
  label: string;
  value: number;
}

/* ------------------------------------------------------------------ */
/* the hero signal chart                                               */
/* ------------------------------------------------------------------ */

interface WaveChartProps {
  points: SeriesPoint[];
  unit: string;
  precision: number;
  /** Secondary comb underneath, drawn from the same series by default. */
  comb?: SeriesPoint[];
  height?: number;
}

const W = 720;

export const WaveChart = ({ points, unit, precision, comb, height = 250 }: WaveChartProps) => {
  const host = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const H = height;
  const waveTop = 18;
  const waveBottom = H - 78;
  const combTop = H - 62;
  const combBase = H - 18;

  const { line, area, xs, ys, min, max } = useMemo(() => {
    const values = points.map((p) => p.value);
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const pad = (hi - lo) * 0.35 || Math.abs(hi) * 0.2 || 1;
    const min = lo - pad;
    const max = hi + pad;
    const step = points.length > 1 ? W / (points.length - 1) : W;
    const xs = points.map((_, i) => i * step);
    const ys = points.map(
      (p) => waveBottom - ((p.value - min) / (max - min || 1)) * (waveBottom - waveTop),
    );
    const pts: [number, number][] = xs.map((x, i) => [x, ys[i]]);
    return {
      line: smoothPath(pts),
      area: `${smoothPath(pts)} L ${W} ${waveBottom} L 0 ${waveBottom} Z`,
      xs,
      ys,
      min,
      max,
    };
  }, [points, waveBottom, waveTop]);

  const combData = comb ?? points;
  const combGeom = useMemo(() => {
    const values = combData.map((p) => p.value);
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const step = combData.length ? W / combData.length : W;
    return combData.map((p, i) => {
      const t = (p.value - lo) / (hi - lo || 1);
      return {
        x: step * (i + 0.5),
        top: combBase - 8 - t * (combBase - combTop - 8),
      };
    });
  }, [combData, combBase, combTop]);

  const active = hover ?? points.length - 1;
  const activePoint = points[active];

  const onMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const box = host.current?.getBoundingClientRect();
    if (!box) return;
    const ratio = (event.clientX - box.left) / box.width;
    const index = Math.round(ratio * (points.length - 1));
    setHover(Math.max(0, Math.min(points.length - 1, index)));
  };

  const cursorPct = points.length > 1 ? (active / (points.length - 1)) * 100 : 50;

  return (
    <div
      ref={host}
      className="relative w-full select-none"
      style={{ height }}
      onMouseMove={onMove}
      onMouseLeave={() => setHover(null)}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id="vcWaveFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* horizontal guides */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1="0"
            x2={W}
            y1={waveTop + t * (waveBottom - waveTop)}
            y2={waveTop + t * (waveBottom - waveTop)}
            stroke="currentColor"
            strokeOpacity={t === 1 ? 0.22 : 0.1}
            strokeDasharray={t === 1 ? undefined : "2 6"}
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        <path d={area} fill="url(#vcWaveFill)" />
        <path
          d={line}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.85"
          strokeWidth="1.8"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
        />

        {/* comb: the same period at instrument scale */}
        {combGeom.map((t, i) => (
          <line
            key={i}
            x1={t.x}
            x2={t.x}
            y1={t.top}
            y2={combBase}
            stroke="currentColor"
            strokeOpacity={i === active ? 0.85 : 0.28}
            strokeWidth="2"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {/* cursor */}
        <line
          x1={xs[active]}
          x2={xs[active]}
          y1={waveTop - 6}
          y2={combBase}
          stroke="currentColor"
          strokeOpacity="0.35"
          strokeWidth="1"
          strokeDasharray="3 4"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* the marker and readout live in HTML so type never stretches */}
      <div
        className="pointer-events-none absolute"
        style={{ left: `${cursorPct}%`, top: ys[active], transform: "translate(-50%, -50%)" }}
      >
        <span className="block h-[9px] w-[9px] rounded-full border-2 border-current bg-[var(--vc-pill-bg)]" />
      </div>

      <div
        className="pointer-events-none absolute z-10"
        style={{
          left: `${cursorPct}%`,
          top: Math.max(0, ys[active] - 54),
          transform: `translateX(${cursorPct > 82 ? "-92%" : cursorPct < 18 ? "-8%" : "-50%"})`,
        }}
      >
        <div className="vc-pill whitespace-nowrap px-2.5 py-1.5">
          <div className="text-[9.5px] font-bold uppercase tracking-[0.3px] opacity-55">
            {activePoint?.label}
          </div>
          <div className="vc-num text-[13.5px] leading-tight">
            {activePoint?.value.toLocaleString("en-GB", {
              minimumFractionDigits: precision,
              maximumFractionDigits: precision,
            })}
            <span className="ml-1 text-[9.5px] font-semibold opacity-60">{unit}</span>
          </div>
        </div>
      </div>

      {/* axis labels */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[-2px] flex justify-between text-[9.5px] font-semibold opacity-45">
        {points.map((p, i) => (
          <span key={`${p.label}-${i}`} className={i === active ? "opacity-100" : undefined}>
            {p.label}
          </span>
        ))}
      </div>

      <div className="pointer-events-none absolute right-0 top-0 text-[9.5px] font-semibold opacity-40">
        {max.toFixed(precision)} {unit}
      </div>
      <div
        className="pointer-events-none absolute right-0 text-[9.5px] font-semibold opacity-40"
        style={{ top: waveBottom - 12 }}
      >
        {min.toFixed(precision)}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* arc gauge                                                           */
/* ------------------------------------------------------------------ */

export const ArcGauge = ({
  value,
  caption,
  suffix = "%",
  gradientId,
}: {
  value: number;
  caption: string;
  suffix?: string;
  gradientId: string;
}) => {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="relative w-full" style={{ maxWidth: 168 }}>
      <svg viewBox="0 0 128 68" className="w-full" fill="none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
            <stop offset="42%" stopColor="var(--vc-lime)" stopOpacity="0.75" />
            <stop offset="100%" stopColor="var(--vc-lime)" />
          </linearGradient>
        </defs>
        <path
          d="M6 58 A 62 42 0 0 1 122 58"
          stroke="currentColor"
          strokeOpacity="0.18"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M6 58 A 62 42 0 0 1 122 58"
          stroke={`url(#${gradientId})`}
          strokeWidth="2.6"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${pct} 100`}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <div className="vc-num text-[26px] leading-none">
          {Math.round(pct)}
          <span className="ml-0.5 text-[12px] font-bold opacity-55">{suffix}</span>
        </div>
        <div className="mt-1 text-[10px] font-semibold opacity-55">{caption}</div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* bar row                                                             */
/* ------------------------------------------------------------------ */

export const BarRow = ({
  points,
  highlightFrom = 0.72,
  height = 62,
}: {
  points: SeriesPoint[];
  /** Values above this share of the peak take the accent colour. */
  highlightFrom?: number;
  height?: number;
}) => {
  const [hover, setHover] = useState<number | null>(null);
  const peak = Math.max(...points.map((p) => p.value), 1);
  return (
    <div className="w-full">
      <div className="flex items-end gap-[3px]" style={{ height }}>
        {points.map((p, i) => {
          const t = p.value / peak;
          const hot = t >= highlightFrom;
          return (
            <div
              key={`${p.label}-${i}`}
              className="group relative flex-1 rounded-[2px] transition-opacity"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{
                height: `${Math.max(6, t * 100)}%`,
                background: hot ? "var(--vc-lime)" : "currentColor",
                opacity: hot ? 1 : hover === i ? 0.7 : 0.32,
              }}
            />
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[9.5px] font-semibold opacity-45">
        <span>{points[0]?.label}</span>
        <span className={hover != null ? "opacity-100" : undefined}>
          {hover != null ? `${points[hover].label} · ${points[hover].value.toLocaleString("en-GB")}` : ""}
        </span>
        <span>{points.at(-1)?.label}</span>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* sparkline for stat cells                                            */
/* ------------------------------------------------------------------ */

export const Spark = ({ points, height = 26 }: { points: SeriesPoint[]; height?: number }) => {
  const w = 120;
  const values = points.map((p) => p.value);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const step = points.length > 1 ? w / (points.length - 1) : w;
  const pts: [number, number][] = points.map((p, i) => [
    i * step,
    height - 3 - ((p.value - lo) / (hi - lo || 1)) * (height - 6),
  ]);
  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      preserveAspectRatio="none"
      className="h-full w-full"
      fill="none"
    >
      <path
        d={smoothPath(pts)}
        stroke="currentColor"
        strokeOpacity="0.6"
        strokeWidth="1.4"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
      />
      <circle cx={pts.at(-1)?.[0]} cy={pts.at(-1)?.[1]} r="2.2" fill="var(--vc-lime)" />
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/* thin progress rule                                                  */
/* ------------------------------------------------------------------ */

export const Rule = ({ pct, tone = "accent" }: { pct: number; tone?: "accent" | "warn" | "muted" }) => (
  <div className="h-[3px] w-full rounded-full" style={{ background: "currentColor", opacity: 0.14 }}>
    <div
      className="h-full rounded-full"
      style={{
        width: `${Math.max(2, Math.min(100, pct))}%`,
        background:
          tone === "accent" ? "var(--vc-lime)" : tone === "warn" ? "var(--vc-warn)" : "currentColor",
      }}
    />
  </div>
);
