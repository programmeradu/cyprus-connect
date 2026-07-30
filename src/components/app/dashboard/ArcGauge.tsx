"use client";

interface ArcGaugeProps {
  /** 0-100. Values outside the range are clamped. */
  value: number;
  /** Short caption under the arc. */
  caption?: string;
  height?: number;
  className?: string;
}

/**
 * A half-circle progress arc drawn in hairlines. The track is a rule, the
 * fill is the accent stroke. No glow, no gradient sweep.
 */
export const ArcGauge = ({ value, caption, height = 92, className = "" }: ArcGaugeProps) => {
  const pct = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
  const w = 180;
  const r = 74;
  const cx = w / 2;
  const cy = 84;
  const arc = `M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const length = Math.PI * r;

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${w} 96`}
        className="w-full"
        style={{ maxHeight: height }}
        role="img"
        aria-label={`${pct.toFixed(0)} percent${caption ? `, ${caption}` : ""}`}
      >
        <path
          d={arc}
          fill="none"
          stroke="var(--app-rule-strong)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={arc}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="3"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          style={{
            strokeDasharray: length,
            strokeDashoffset: length - (length * pct) / 100,
            transition: "stroke-dashoffset 700ms cubic-bezier(0.22, 1, 0.36, 1)"
          }}
        />
      </svg>
      {caption && <p className="app-meta mt-1 text-center break-words">{caption}</p>}
    </div>
  );
};
