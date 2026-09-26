/**
 * Period and site filters for the console.
 *
 * Pure: takes the overview payload and returns a filtered copy, so the
 * screen, the CSV and the PDF always show the same rows. Headline figures
 * (current, previous, change) are recomputed from the rows left in view.
 *
 * - Period applies to readings, agent runs and the audit log. Obligations
 *   are deadlines, so they always show in full.
 * - Site applies to readings only. "All sites" reads the whole-workspace
 *   rows; if a metric has only per-site rows, additive units are summed per
 *   period and ratios (%, intensity) are left out rather than averaged
 *   wrongly.
 */

import type { ConsoleMetric, ConsoleOverviewData, MetricPoint } from "./types";

export type PeriodKey = "all" | "ytd" | "12m" | "6m" | "3m" | `y${number}`;
export const ALL_SITES = "__all__";

export interface ConsoleFilter {
  period: PeriodKey;
  site: string;
}

export const DEFAULT_FILTER: ConsoleFilter = { period: "all", site: ALL_SITES };

const ADDITIVE_UNIT = /^(t|kg|g)?co.?e$|^tco|kwh|mwh|eur|€|m³|m3|litres?|l$|tons?/i;

export function isAdditiveUnit(unit: string): boolean {
  const u = unit.replace(/\s+/g, "").replace(/[₂2]/g, "2");
  if (/%|\//.test(u)) return false;
  return ADDITIVE_UNIT.test(u);
}

/** Inclusive start / exclusive end as YYYY-MM-DD, or null for no bound. */
export function periodRange(period: PeriodKey, now = new Date()): { from: string | null; to: string | null } {
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  switch (period) {
    case "all":
      return { from: null, to: null };
    case "ytd":
      return { from: `${y}-01-01`, to: null };
    case "12m":
    case "6m":
    case "3m": {
      const months = Number.parseInt(period, 10);
      return { from: iso(new Date(Date.UTC(y, m - months + 1, 1))), to: null };
    }
    default: {
      const year = Number(period.slice(1));
      if (!Number.isInteger(year)) return { from: null, to: null };
      return { from: `${year}-01-01`, to: `${year + 1}-01-01` };
    }
  }
}

function inRange(value: string | null | undefined, range: { from: string | null; to: string | null }): boolean {
  if (!range.from && !range.to) return true;
  if (!value) return false;
  const day = value.slice(0, 10);
  if (range.from && day < range.from) return false;
  if (range.to && day >= range.to) return false;
  return true;
}

export function periodLabel(period: PeriodKey): string {
  switch (period) {
    case "all": return "All time";
    case "ytd": return "Year to date";
    case "12m": return "Last 12 months";
    case "6m": return "Last 6 months";
    case "3m": return "Last 3 months";
    default: return period.slice(1);
  }
}

/** Calendar years that have at least one reading, newest first. */
export function yearsInData(data: ConsoleOverviewData): number[] {
  const years = new Set<number>();
  for (const m of data.metrics) for (const p of m.points) {
    const y = Number(p.periodStart.slice(0, 4));
    if (Number.isInteger(y)) years.add(y);
  }
  return [...years].sort((a, b) => b - a);
}

function pointsForSite(metric: ConsoleMetric, site: string): MetricPoint[] {
  if (site !== ALL_SITES) return metric.points.filter((p) => p.site === site);
  const whole = metric.points.filter((p) => !p.site);
  if (whole.length > 0 || metric.points.length === 0) return whole;
  if (!isAdditiveUnit(metric.unit)) return [];
  const byPeriod = new Map<string, MetricPoint>();
  for (const p of metric.points) {
    const prev = byPeriod.get(p.periodStart);
    byPeriod.set(
      p.periodStart,
      prev
        ? { ...prev, value: prev.value + p.value, confidence: Math.min(prev.confidence, p.confidence), source: prev.source === p.source ? prev.source : "mixed" }
        : { ...p, site: null },
    );
  }
  return [...byPeriod.values()].sort((a, b) => a.periodStart.localeCompare(b.periodStart));
}

function withHeadline(metric: ConsoleMetric, points: MetricPoint[]): ConsoleMetric {
  const current = points.at(-1)?.value ?? 0;
  const previous = points.at(-2)?.value ?? current;
  const first = points[0]?.value ?? current;
  return {
    ...metric,
    points,
    current,
    previous,
    delta: previous === 0 ? 0 : ((current - previous) / previous) * 100,
    sinceStart: first === 0 ? 0 : ((current - first) / first) * 100,
  };
}

export function isDefaultFilter(filter: ConsoleFilter): boolean {
  return filter.period === "all" && filter.site === ALL_SITES;
}

export function applyFilter(data: ConsoleOverviewData, filter: ConsoleFilter, now = new Date()): ConsoleOverviewData {
  if (isDefaultFilter(filter)) return data;
  const range = periodRange(filter.period, now);
  return {
    ...data,
    metrics: data.metrics.map((m) =>
      withHeadline(m, pointsForSite(m, filter.site).filter((p) => inRange(p.periodStart, range))),
    ),
    runs: data.runs.filter((r) => inRange(r.startedAt, range)),
    events: data.events.filter((e) => inRange(e.createdAt, range)),
  };
}

/** One line naming what is in view, for file names and the PDF cover. */
export function describeFilter(filter: ConsoleFilter): string {
  const site = filter.site === ALL_SITES ? "All sites" : filter.site;
  return `${periodLabel(filter.period)} · ${site}`;
}

export function filterSlug(filter: ConsoleFilter): string {
  if (isDefaultFilter(filter)) return "";
  const site = filter.site === ALL_SITES ? "" : `-${filter.site}`;
  return `-${filter.period}${site}`.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/-$/, "");
}
