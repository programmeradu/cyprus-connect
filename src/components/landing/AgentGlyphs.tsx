/**
 * AgentGlyphs - bespoke hand-drawn line-art marks for the roadmap ledger.
 *
 * These are not icon-font decorations. Each glyph draws one specific piece of
 * agent work described in the row it sits beside, in a single hairline stroke
 * with one lime accent detail, so the three read as a set but never as clip art.
 */

type GlyphProps = { className?: string };

const base = "block h-full w-full";
const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.25,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};
const accent = "var(--accent-lime)";

/** 2026 - Cyprus data spine: bills and connectors feeding one vertical spine. */
export function GlyphDataSpine({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={className ?? base} role="presentation">
      <g {...stroke}>
        {/* source documents on the left */}
        <path d="M6 13h15v14H6z" />
        <path d="M6 37h15v14H6z" />
        <path d="M9 18h9M9 21.5h6M9 42h9M9 45.5h6" opacity={0.55} />
        {/* connectors into the spine */}
        <path d="M21 20h9c3 0 4 2 4 5v5" />
        <path d="M21 44h9c3 0 4-2 4-5v-5" />
        {/* the spine */}
        <path d="M34 8v48" strokeWidth={1.6} />
        <path d="M34 16h8M34 32h14M34 48h8" opacity={0.7} />
        {/* verified endpoint */}
        <circle cx={54} cy={32} r={5.5} stroke={accent} strokeWidth={1.6} />
        <path d="M51.6 32.2l1.8 1.9 3.2-3.9" stroke={accent} strokeWidth={1.6} />
      </g>
    </svg>
  );
}

/** 2027 - Digital colleagues: three agents drafting one shared disclosure. */
export function GlyphColleagues({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={className ?? base} role="presentation">
      <g {...stroke}>
        {/* the shared draft */}
        <path d="M22 20h20v30H22z" />
        <path d="M26 27h12M26 32h12M26 37h8" opacity={0.55} />
        {/* three agent heads around it */}
        <circle cx={11} cy={22} r={5} />
        <path d="M4.5 34c1.2-3.6 3.6-5.4 6.5-5.4s5.3 1.8 6.5 5.4" opacity={0.7} />
        <circle cx={53} cy={22} r={5} />
        <path d="M46.5 34c1.2-3.6 3.6-5.4 6.5-5.4s5.3 1.8 6.5 5.4" opacity={0.7} />
        <circle cx={32} cy={9} r={4.5} stroke={accent} strokeWidth={1.6} />
        {/* hand-off lines */}
        <path d="M17 26.5l5 2M47 26.5l-5 2" opacity={0.6} />
        <path d="M32 13.5V20" stroke={accent} strokeWidth={1.6} />
        {/* audit trail tick under the draft */}
        <path d="M26 44.5l3 3.2 6-7" stroke={accent} strokeWidth={1.6} />
      </g>
    </svg>
  );
}

/** 2028 - Continuous assurance: a closed monitoring loop that never stops. */
export function GlyphAssurance({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={className ?? base} role="presentation">
      <g {...stroke}>
        {/* the loop */}
        <path d="M32 9a23 23 0 1 1-16.3 6.8" strokeWidth={1.5} />
        <path d="M9 10.5v8.5h8.5" strokeWidth={1.5} />
        {/* live signal inside */}
        <path d="M17 34h7l4-9 5 17 4-8h10" stroke={accent} strokeWidth={1.6} />
        {/* orbiting checkpoints */}
        <circle cx={32} cy={9} r={2.2} fill="currentColor" stroke="none" opacity={0.8} />
        <circle cx={55} cy={32} r={2.2} fill="currentColor" stroke="none" opacity={0.5} />
        <circle cx={32} cy={55} r={2.2} fill="currentColor" stroke="none" opacity={0.35} />
      </g>
    </svg>
  );
}

export const agentGlyphs = {
  "2026": GlyphDataSpine,
  "2027": GlyphColleagues,
  "2028": GlyphAssurance,
} as const;
