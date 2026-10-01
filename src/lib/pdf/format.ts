/** Number and date formats printed in PDFs (en-GB, UTC, so every copy matches). */

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

export const shortDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "—";

/** Typst prints `₂` correctly with our fonts; keep units readable. */
export const unitText = (u: string | null | undefined) => (u ?? "").replace(/CO2e/g, "CO₂e");

/** Document number: type prefix + date + first 6 hex of the fingerprint. */
export const docId = (prefix: string, hash: string, at: Date) =>
  `VNL-${prefix}-${at.toISOString().slice(0, 10).replace(/-/g, "")}-${hash.slice(0, 6).toUpperCase()}`;
