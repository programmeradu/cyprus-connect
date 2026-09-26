import { describe, expect, it } from "vitest";
import {
  ALL_SITES,
  applyFilter,
  describeFilter,
  filterSlug,
  isAdditiveUnit,
  periodRange,
  yearsInData,
} from "@/components/app/console/filters";
import type { ConsoleMetric, ConsoleOverviewData, MetricPoint } from "@/components/app/console/types";

const pt = (periodStart: string, value: number, site: string | null = null): MetricPoint => ({
  label: periodStart.slice(0, 7),
  periodStart,
  value,
  source: "bill",
  confidence: 1,
  site,
});

const metric = (key: string, unit: string, points: MetricPoint[]): ConsoleMetric => ({
  key,
  label: key,
  shortLabel: null,
  unit,
  precision: 1,
  category: "energy",
  goodDirection: "down",
  description: null,
  sortOrder: 0,
  current: 0,
  previous: 0,
  delta: 0,
  sinceStart: 0,
  points,
});

function data(metrics: ConsoleMetric[]): ConsoleOverviewData {
  return {
    workspace: { name: "Acme" } as ConsoleOverviewData["workspace"],
    metrics,
    sites: [],
    agents: [],
    runs: [
      { startedAt: "2025-06-01T10:00:00Z" },
      { startedAt: "2026-08-01T10:00:00Z" },
    ] as ConsoleOverviewData["runs"],
    tasks: [],
    connections: [],
    obligations: [{ dueDate: "2020-01-01" }] as ConsoleOverviewData["obligations"],
    events: [{ createdAt: "2026-09-01T00:00:00Z" }] as ConsoleOverviewData["events"],
    generatedAt: "2026-09-26T00:00:00Z",
  };
}

const NOW = new Date("2026-09-26T12:00:00Z");

describe("periodRange", () => {
  it("anchors relative windows to the first day of the month", () => {
    expect(periodRange("3m", NOW)).toEqual({ from: "2026-07-01", to: null });
    expect(periodRange("12m", NOW)).toEqual({ from: "2025-10-01", to: null });
    expect(periodRange("ytd", NOW)).toEqual({ from: "2026-01-01", to: null });
  });
  it("bounds a calendar year on both sides", () => {
    expect(periodRange("y2025", NOW)).toEqual({ from: "2025-01-01", to: "2026-01-01" });
  });
});

describe("applyFilter", () => {
  const d = data([
    metric("kwh", "kWh", [pt("2025-11-01", 100), pt("2026-08-01", 80), pt("2026-09-01", 60)]),
  ]);

  it("returns the same object for the default filter", () => {
    expect(applyFilter(d, { period: "all", site: ALL_SITES }, NOW)).toBe(d);
  });

  it("recomputes headline figures from rows in view", () => {
    const f = applyFilter(d, { period: "3m", site: ALL_SITES }, NOW);
    const m = f.metrics[0];
    expect(m.points.map((p) => p.value)).toEqual([80, 60]);
    expect(m.current).toBe(60);
    expect(m.previous).toBe(80);
    expect(m.delta).toBeCloseTo(-25);
  });

  it("filters runs and events by period but keeps every obligation", () => {
    const f = applyFilter(d, { period: "y2025", site: ALL_SITES }, NOW);
    expect(f.runs).toHaveLength(1);
    expect(f.events).toHaveLength(0);
    expect(f.obligations).toHaveLength(1);
  });

  it("sums additive per-site rows when no workspace row exists", () => {
    const s = data([metric("kwh", "kWh", [pt("2026-09-01", 10, "Limassol"), pt("2026-09-01", 5, "Nicosia")])]);
    const all = applyFilter(s, { period: "ytd", site: ALL_SITES }, NOW);
    expect(all.metrics[0].points.map((p) => p.value)).toEqual([15]);
    const one = applyFilter(s, { period: "all", site: "Nicosia" }, NOW);
    expect(one.metrics[0].current).toBe(5);
  });

  it("never averages ratios across sites", () => {
    const s = data([metric("share", "%", [pt("2026-09-01", 40, "A"), pt("2026-09-01", 60, "B")])]);
    expect(applyFilter(s, { period: "ytd", site: ALL_SITES }, NOW).metrics[0].points).toEqual([]);
  });

  it("prefers whole-workspace rows over per-site rows for all sites", () => {
    const s = data([metric("kwh", "kWh", [pt("2026-09-01", 99), pt("2026-09-01", 10, "A")])]);
    expect(applyFilter(s, { period: "ytd", site: ALL_SITES }, NOW).metrics[0].current).toBe(99);
  });
});

describe("labels", () => {
  it("names the filter and builds a safe slug", () => {
    expect(describeFilter({ period: "6m", site: ALL_SITES })).toBe("Last 6 months · All sites");
    expect(filterSlug({ period: "all", site: ALL_SITES })).toBe("");
    expect(filterSlug({ period: "y2025", site: "Λεμεσός / HQ" })).toBe("-y2025-hq");
  });
  it("lists years newest first", () => {
    expect(yearsInData(data([metric("k", "kWh", [pt("2024-01-01", 1), pt("2026-01-01", 1)])]))).toEqual([2026, 2024]);
  });
  it("tells additive units from ratios", () => {
    expect(isAdditiveUnit("kWh")).toBe(true);
    expect(isAdditiveUnit("tCO₂e")).toBe(true);
    expect(isAdditiveUnit("EUR")).toBe(true);
    expect(isAdditiveUnit("%")).toBe(false);
    expect(isAdditiveUnit("gCO₂/kWh")).toBe(false);
  });
});
