"use client";

/**
 * The console's hero instrument.
 *
 * Geometry is taken from the Rinesk study in /lab: a soft signal curve over a
 * ruled field, a comb of period ticks below it, a right-hand value scale and a
 * cursor read-out that follows the pointer. Every number comes from the metric
 * series that is passed in. Nothing here is written by hand.
 */

import { useMemo, useRef, useState } from "react";
import { fmtNumber, fmtSigned, type ConsoleMetric } from "./types";

const W = 720;
const H = 236;

const WAVE_TOP = 20;
const WAVE_BOTTOM = 132;
const COMB_TOP = 156;
const COMB_BASE = 200;

/** Catmull-Rom to cubic bezier. Gives the concept's soft signal line. */
function smoothPath(pts: [number, number][]) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
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

/** A readable scale: four steps between the padded floor and ceiling. */
function scaleTicks(min: number, max: number, precision: number) {
  const steps = 4;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    return { t, value: max - t * (max - min), text: fmtNumber(max - t * (max - min), precision) };
  });
}

export function SignalChart({ metric }: { metric: ConsoleMetric }) {
  const host = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const points = metric.points;

  const geom = useMemo(() => {
    const values = points.map((p) => p.value);
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const pad = (hi - lo) * 0.34 || Math.abs(hi) * 0.2 || 1;
    const min = lo - pad;
    const max = hi + pad;
    const step = points.length > 1 ? W / (points.length - 1) : W;
    const xs = points.map((_, i) => i * step);
    const ys = points.map(
      (p) => WAVE_BOTTOM - ((p.value - min) / (max - min || 1)) * (WAVE_BOTTOM - WAVE_TOP),
    );
    const pairs: [number, number][] = xs.map((x, i) => [x, ys[i]]);
    const combStep = points.length ? W / points.length : W;
    const comb = points.map((p, i) => ({
      x: combStep * (i + 0.5),
      top: COMB_BASE - 6 - ((p.value - min) / (max - min || 1)) * (COMB_BASE - COMB_TOP - 6),
    }));
    return {
      min,
      max,
      xs,
      ys,
      comb,
      line: smoothPath(pairs),
      area: `${smoothPath(pairs)} L ${W} ${WAVE_BOTTOM} L 0 ${WAVE_BOTTOM} Z`,
    };
  }, [points]);

  if (points.length < 2) {
    return (
      <div className="vc-signal vc-signal-empty">
        <p>This metric has no series yet. It appears when the first period closes.</p>
      </div>
    );
  }

  const active = hover ?? points.length - 1;
  const point = points[active];
  const ticks = scaleTicks(geom.min, geom.max, metric.precision);
  const cursorPct = (active / (points.length - 1)) * 100;

  const onMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const box = host.current?.getBoundingClientRect();
    if (!box) return;
    const ratio = (event.clientX - box.left) / box.width;
    const index = Math.round(ratio * (points.length - 1));
    setHover(Math.max(0, Math.min(points.length - 1, index)));
  };

  /** Confidence and source are recorded per reading, so we can show them. */
  const confidence = Math.round((point.confidence ?? 0) * 100);

  return (
    <div
      className="vc-signal"
      ref={host}
      onPointerMove={onMove}
      onPointerLeave={() => setHover(null)}
      role="img"
      aria-label={`${metric.label} from ${points[0].label} to ${points[points.length - 1].label}`}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="vc-signal-svg" preserveAspectRatio="none" fill="none" aria-hidden>
        <defs>
          <linearGradient id={`vcFill-${metric.key}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.26" />
            <stop offset="72%" stopColor="currentColor" stopOpacity="0.04" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
          <filter id={`vcGlow-${metric.key}`} x="-10%" y="-40%" width="120%" height="200%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>

        {/* value rules */}
        {ticks.map((tick) => (
          <line
            key={tick.t}
            x1="0"
            x2={W}
            y1={WAVE_TOP + tick.t * (WAVE_BOTTOM - WAVE_TOP)}
            y2={WAVE_TOP + tick.t * (WAVE_BOTTOM - WAVE_TOP)}
            stroke="currentColor"
            strokeOpacity={tick.t === 1 ? 0.26 : 0.09}
            strokeDasharray={tick.t === 1 ? undefined : "2 7"}
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {/* period separators */}
        {geom.xs.map((x, i) => (
          <line
            key={`sep-${i}`}
            x1={x}
            x2={x}
            y1={WAVE_TOP}
            y2={WAVE_BOTTOM}
            stroke="currentColor"
            strokeOpacity={i === active ? 0.22 : 0.06}
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        <path d={geom.area} fill={`url(#vcFill-${metric.key})`} filter={`url(#vcGlow-${metric.key})`} />
        <path
          d={geom.line}
          stroke="currentColor"
          strokeOpacity="0.9"
          strokeWidth="2.1"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* comb of periods at instrument scale */}
        {geom.comb.map((tick, i) => (
          <line
            key={`comb-${i}`}
            x1={tick.x}
            x2={tick.x}
            y1={tick.top}
            y2={COMB_BASE}
            stroke={i === active ? "var(--vc-lime)" : "currentColor"}
            strokeOpacity={i === active ? 1 : 0.3}
            strokeWidth="2.4"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <line
          x1="0"
          x2={W}
          y1={COMB_BASE}
          y2={COMB_BASE}
          stroke="currentColor"
          strokeOpacity="0.16"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />

        {/* cursor */}
        <line
          x1={geom.xs[active]}
          x2={geom.xs[active]}
          y1={geom.ys[active]}
          y2={COMB_BASE}
          stroke="var(--vc-lime)"
          strokeOpacity="0.55"
          strokeWidth="1.4"
          strokeDasharray="3 4"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Text lives in HTML so nothing stretches with the viewBox. */}
      <div className="vc-signal-scale" aria-hidden>
        {ticks.map((tick) => (
          <span key={tick.t} style={{ top: `${((WAVE_TOP + tick.t * (WAVE_BOTTOM - WAVE_TOP)) / H) * 100}%` }}>
            {tick.text}
          </span>
        ))}
      </div>

      <span
        className="vc-signal-node"
        style={{ left: `${cursorPct}%`, top: `${(geom.ys[active] / H) * 100}%` }}
        aria-hidden
      />

      <div
        className="vc-tooltip"
        style={{
          left: `${cursorPct}%`,
          top: `${(Math.max(WAVE_TOP - 4, geom.ys[active] - 74) / H) * 100}%`,
          transform: `translateX(${cursorPct > 78 ? "-88%" : cursorPct < 22 ? "-12%" : "-50%"})`,
        }}
      >
        <span>{point.label}</span>
        <strong>
          {fmtNumber(point.value, metric.precision)} <small>{metric.unit}</small>
        </strong>
        <em>
          {point.source} · {confidence}% confidence
        </em>
      </div>

      <div className="vc-signal-axis" aria-hidden>
        {points.map((p, i) => (
          <span key={`${p.label}-${i}`} data-active={i === active}>
            {p.label}
          </span>
        ))}
      </div>

      <p className="vc-signal-foot">
        {points[0].label} to {points[points.length - 1].label} · {fmtSigned(metric.sinceStart)} since the first period
      </p>
    </div>
  );
}
