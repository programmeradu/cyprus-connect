/**
 * The Vuneli AI mark. The leaf from the logo, centred and balanced, with a
 * "V" chevron on its midrib. Replaces generic sparkle/star glyphs everywhere
 * AI is signalled (copilot, agents, studio, AI credits).
 *
 * Single stroke, currentColor, 24 grid, so it sits beside the console icons.
 * `filled` gives a solid leaf for larger or emphasised placements.
 */

type Props = {
  size?: number;
  className?: string;
  sw?: number;
  filled?: boolean;
  title?: string;
};

export function VuneliAiIcon({ size = 16, className, sw = 1.7, filled = false, title }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      {/* the logo's leaf, centred on the diagonal */}
      <path
        d="M4.5 19.5C4.5 10.5 10.5 4.5 19.5 4.5 19.5 13.5 13.5 19.5 4.5 19.5Z"
        fill={filled ? "currentColor" : "none"}
      />
      {/* midrib with a "V" for Vuneli */}
      <g stroke={filled ? "var(--vuneli-ai-vein, #fff)" : "currentColor"}>
        <path d="M8 16 16 8" />
        <path d="M10 11.2v2.8h2.8" />
      </g>
    </svg>
  );
}

/** Class-name API for call sites that size icons with Tailwind (w-4 h-4). */
export function VuneliAiGlyph({ className = "w-4 h-4", filled }: { className?: string; filled?: boolean }) {
  return <VuneliAiIcon className={className} filled={filled} size={24} />;
}
