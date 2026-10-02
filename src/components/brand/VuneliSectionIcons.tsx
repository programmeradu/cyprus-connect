/**
 * Filled section marks for Measure and Act, built from the same leaf as the
 * Vuneli AI mark so the three read as one family. Monochrome (currentColor);
 * the secondary layer uses opacity so they theme in light and dark.
 */

const LEAF =
  "M11.9 21C11 17.5 9.2 15.2 6.6 14.3 3.2 13 1.4 10 1.5 3 6 3.6 10 5.2 11.2 9 11.7 10.8 11.7 12.9 11.5 14.8 10 11.5 7.5 8.8 4.2 7.4 8 10 10.8 14.5 11.9 21Z";

const GAUGE =
  "M2.00 18.60A10 10 0 0 1 6.41 10.31L8.03 12.71A7.1 7.1 0 0 0 4.90 18.60ZM7.62 9.61A10 10 0 0 1 16.38 9.61L15.11 12.22A7.1 7.1 0 0 0 8.89 12.22ZM17.59 10.31A10 10 0 0 1 22.00 18.60L19.10 18.60A7.1 7.1 0 0 0 15.97 12.71Z";

type Props = { size?: number; className?: string; sw?: number };

const Svg = ({ size = 16, className, children }: Props & { children: React.ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    {children}
  </svg>
);

/** Measure: a three-band gauge with the Vuneli leaf as its needle. */
export function VuneliMeasureIcon(p: Props) {
  return (
    <Svg {...p}>
      <path d={GAUGE} opacity={0.35} />
      <path d={LEAF} transform="translate(12 18.6) rotate(55) scale(.62) translate(-11.9 -21)" />
      <circle cx="12" cy="18.6" r="1.7" />
    </Svg>
  );
}

/** Act: a leaf shooting forward into an arrow, a fainter leaf behind it. */
export function VuneliActIcon(p: Props) {
  return (
    <Svg {...p}>
      <path d={LEAF} transform="translate(9 21.5) rotate(-8) scale(.78) translate(-11.9 -21)" opacity={0.35} />
      <path d={LEAF} transform="translate(9 21.5) rotate(58) scale(.9) translate(-11.9 -21)" />
      <path d="M15.2 2.2 22 2l-.2 6.8-2.4-2.4-3.6 3.6-1.8-1.8 3.6-3.6Z" />
    </Svg>
  );
}
