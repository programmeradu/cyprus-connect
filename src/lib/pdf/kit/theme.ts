/**
 * Vuneli PDF design system: one palette, one type scale, one set of fonts.
 *
 * Fonts are the brand pair (Fraunces display, Instrument Sans text). Neither
 * has Greek glyphs, so every family falls back to Noto, which covers Greek,
 * subscripts and the euro sign. Nothing is stripped to Latin-1 any more.
 */

import { Font } from "@react-pdf/renderer";

export const C = {
  ink: "#1A1F1B",
  body: "#3A433C",
  quiet: "#6B756D",
  faint: "#9AA39B",
  rule: "#D9DED6",
  hair: "#E8EBE5",
  paper: "#FFFFFF",
  band: "#F4F6F1",
  stone: "#EDE8DE",
  accent: "#4A6A3D",
  accentSoft: "#DCE6D3",
  warn: "#9A5B1E",
  warnSoft: "#F4E6D4",
  bad: "#9B2C2C",
  night: "#18211B",
} as const;

export const SANS = ["Instrument Sans", "Noto Sans"];
export const DISPLAY = ["Fraunces", "Noto Serif"];
export const MONO = ["JetBrains Mono", "Noto Sans"];

let registeredFor: string | null = null;

/** Register fonts once per origin. `base` is a URL or file path prefix ending without slash. */
export function registerPdfFonts(base: string) {
  if (registeredFor === base) return;
  const f = (name: string) => `${base}/fonts/pdf/${name}.ttf`;
  Font.register({
    family: "Instrument Sans",
    fonts: [
      { src: f("InstrumentSans-400"), fontWeight: 400 },
      { src: f("InstrumentSans-500"), fontWeight: 500 },
      { src: f("InstrumentSans-600"), fontWeight: 600 },
      { src: f("InstrumentSans-700"), fontWeight: 700 },
    ],
  });
  Font.register({
    family: "Noto Sans",
    fonts: [
      { src: f("NotoSans-400"), fontWeight: 400 },
      { src: f("NotoSans-600"), fontWeight: 500 },
      { src: f("NotoSans-600"), fontWeight: 600 },
      { src: f("NotoSans-700"), fontWeight: 700 },
    ],
  });
  Font.register({
    family: "Fraunces",
    fonts: [
      { src: f("Fraunces-500"), fontWeight: 500 },
      { src: f("Fraunces-600"), fontWeight: 600 },
    ],
  });
  Font.register({
    family: "Noto Serif",
    fonts: [
      { src: f("NotoSerif-500"), fontWeight: 500 },
      { src: f("NotoSerif-600"), fontWeight: 600 },
    ],
  });
  Font.register({ family: "JetBrains Mono", src: f("JetBrainsMono-400") });
  // Words are never split with a hyphen: figures and codes must stay whole.
  Font.registerHyphenationCallback((word) => [word]);
  registeredFor = base;
}

export const fmt = (v: number | null | undefined, digits = 0) =>
  v === null || v === undefined || !Number.isFinite(v)
    ? "—"
    : v.toLocaleString("en-GB", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const fmtSmart = (v: number | null | undefined) => {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  const a = Math.abs(v);
  return fmt(v, a >= 100 ? 0 : a >= 10 ? 1 : a >= 1 ? 2 : 3);
};

export const eur = (v: number | null | undefined) =>
  v === null || v === undefined || !Number.isFinite(v) ? "—" : `€${fmt(v, 0)}`;

export const longDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
