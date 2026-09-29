/**
 * The Vuneli AI mark. Drawn from the logo: the stem of the final "i" with the
 * veined leaf that dots it. Replaces generic sparkle/star glyphs everywhere
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
      {/* stem of the "i" */}
      <path d="M8.5 11.5v9" />
      {/* the leaf that dots it */}
      <path
        d="M10.6 10.4c-.3-4.6 2.6-7.4 9.4-7.9.3 6.6-2.7 9.6-7.3 9.4a2.2 2.2 0 0 1-2.1-1.5Z"
        fill={filled ? "currentColor" : "none"}
      />
      {/* vein */}
      <path d="M11.4 11.2 17.4 5.3" stroke={filled ? "var(--vuneli-ai-vein, #fff)" : "currentColor"} />
    </svg>
  );
}

/** Class-name API for call sites that size icons with Tailwind (w-4 h-4). */
export function VuneliAiGlyph({ className = "w-4 h-4", filled }: { className?: string; filled?: boolean }) {
  return <VuneliAiIcon className={className} filled={filled} size={24} />;
}
