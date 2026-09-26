/**
 * Monthly footprint: shared shapes and pure rules.
 *
 * The server resolves each line (live Climatiq factor or published reference
 * factor) and this module turns the lines into totals and scopes. Kept pure so
 * the arithmetic is tested without a network.
 */

import { REFERENCE_FACTORS, type ReferenceFactor } from "./reference-factors";

export type FootprintKey = ReferenceFactor["key"];
export const FOOTPRINT_KEYS: FootprintKey[] = ["electricity", "gas", "water", "waste", "transport"];

export type FootprintInput = Record<FootprintKey, number>;

export interface FootprintLine {
  key: FootprintKey;
  value: number;
  unit: string;
  /** Tonnes CO2e. */
  tonnes: number;
  scope: 1 | 2 | 3;
  basis: "climatiq" | "reference";
  /** Human-readable source of the factor used. */
  source: string;
}

export interface Footprint {
  totalTonnes: number;
  scopes: { scope1: number; scope2: number; scope3: number };
  lines: FootprintLine[];
  /** "climatiq" when every line used a live factor, "reference" when none did. */
  basis: "climatiq" | "reference" | "mixed";
}

/** A line from the published reference factor for this activity. */
export function referenceLine(key: FootprintKey, value: number): FootprintLine {
  const f = REFERENCE_FACTORS[key];
  return {
    key,
    value,
    unit: f.unit,
    tonnes: (value * f.kgCo2ePerUnit) / 1000,
    scope: f.scope,
    basis: "reference",
    source: `${f.source} (${f.vintage})`,
  };
}

/** Totals, scope split and overall basis. Lines with no activity are dropped. */
export function summarise(lines: FootprintLine[]): Footprint {
  const used = lines.filter((l) => l.value > 0);
  const scopes = { scope1: 0, scope2: 0, scope3: 0 };
  for (const l of used) scopes[`scope${l.scope}` as keyof typeof scopes] += l.tonnes;
  const bases = new Set(used.map((l) => l.basis));
  return {
    totalTonnes: used.reduce((s, l) => s + l.tonnes, 0),
    scopes,
    lines: used,
    basis: bases.size === 1 ? [...bases][0] : bases.size === 0 ? "reference" : "mixed",
  };
}

/** Change against the earlier month in percent; null when there is no earlier figure. */
export function trendPercent(current: number, previous: number | null): number | null {
  if (previous === null || previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

/** The calendar month before (year, month). */
export function previousMonth(year: number, month: number): { year: number; month: number } {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}

/** True when (year, month) is later than the month of `now`. */
export function isFutureMonth(year: number, month: number, now = new Date()): boolean {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;
  return year > y || (year === y && month > m);
}
