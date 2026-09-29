/**
 * The Vuneli AI mark: the two-leaf "V" from the Vuneli logo icon, redrawn as
 * a vector on a 24 grid. Replaces generic sparkle/star glyphs everywhere AI is
 * signalled (copilot, agents, studio, AI credits).
 *
 * Monochrome (currentColor) by default so it sits beside the console icons.
 * `brand` shows the logo colours: ink left leaf, terracotta right leaf.
 */

const LEAF =
  "M11.9 21C11 17.5 9.2 15.2 6.6 14.3 3.2 13 1.4 10 1.5 3 6 3.6 10 5.2 11.2 9 11.7 10.8 11.7 12.9 11.5 14.8 10 11.5 7.5 8.8 4.2 7.4 8 10 10.8 14.5 11.9 21Z";

type Props = {
  size?: number;
  className?: string;
  /** Kept for API parity with stroke icons; the mark is filled. */
  sw?: number;
  /** Legacy prop; the mark is always solid. */
  filled?: boolean;
  brand?: boolean;
  title?: string;
};

export function VuneliAiIcon({ size = 16, className, brand = false, title }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <path d={LEAF} fill="currentColor" />
      <path d={LEAF} fill={brand ? "#B5482A" : "currentColor"} transform="matrix(-1 0 0 1 24 0)" />
    </svg>
  );
}

/** Class-name API for call sites that size icons with Tailwind (w-4 h-4). */
export function VuneliAiGlyph({ className = "w-4 h-4", brand }: { className?: string; filled?: boolean; brand?: boolean }) {
  return <VuneliAiIcon className={className} brand={brand} size={24} />;
}
