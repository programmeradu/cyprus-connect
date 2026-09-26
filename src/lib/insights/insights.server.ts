/**
 * Everything the Insights page shows, read on the server from real records.
 * Nothing here is estimated or filled in: a part that has no data is null.
 */

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { complianceRegulations, emissions } from "@/db/schema";
import { logger } from "@/lib/log";
import { parseGrid, type GridToday } from "./grid";

const log = logger("insights");

/** Countries Energy-Charts publishes hourly CO2 intensity for (EU scope). */
const GRID_COUNTRIES = new Set([
  "CY", "GR", "DE", "FR", "ES", "IT", "PT", "NL", "BE", "AT", "PL", "CZ", "DK", "SE", "FI", "IE", "HU", "RO", "BG", "SK", "SI", "HR", "EE", "LV", "LT", "LU",
]);

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000), headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`answer ${res.status}`);
  return res.json();
}

export async function gridToday(country: string): Promise<{ grid: GridToday | null; reason: "unsupported" | "unavailable" | null }> {
  const cc = country.toUpperCase();
  if (!GRID_COUNTRIES.has(cc)) return { grid: null, reason: "unsupported" };
  const base = "https://api.energy-charts.info";
  const q = `country=${cc.toLowerCase()}`;
  try {
    const [co2, power] = await Promise.all([
      getJson(`${base}/co2eq?${q}`),
      getJson(`${base}/public_power?${q}`).catch(() => null),
    ]);
    const grid = parseGrid(cc, co2 as object, power as object | null);
    return { grid, reason: grid ? null : "unavailable" };
  } catch (err) {
    log.warn("grid data unavailable", { country: cc, errorMessage: err instanceof Error ? err.message : String(err) });
    return { grid: null, reason: "unavailable" };
  }
}

export interface FootprintMonth {
  year: number;
  month: number;
  totalTonnes: number;
  electricityKwh: number;
}

export async function footprintMonths(userId: string): Promise<FootprintMonth[]> {
  const rows = await db
    .select()
    .from(emissions)
    .where(eq(emissions.userId, userId))
    .orderBy(desc(emissions.periodYear), desc(emissions.periodMonth), desc(emissions.id))
    .limit(60);
  const seen = new Set<string>();
  const out: FootprintMonth[] = [];
  for (const r of rows) {
    const k = `${r.periodYear}-${r.periodMonth}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ year: r.periodYear, month: r.periodMonth, totalTonnes: r.totalCo2e, electricityKwh: r.electricity });
    if (out.length === 12) break;
  }
  return out.reverse();
}

export interface ComplianceSummary {
  tracked: number;
  compliant: number;
  actionRequired: number;
  dueWithin30Days: number;
  next: { name: string; deadline: string; daysLeft: number } | null;
}

export async function complianceSummary(userId: string, now = new Date()): Promise<ComplianceSummary> {
  const regs = await db
    .select({ name: complianceRegulations.name, status: complianceRegulations.status, nextDeadline: complianceRegulations.nextDeadline })
    .from(complianceRegulations)
    .where(and(eq(complianceRegulations.userId, userId)));
  const day = 86_400_000;
  const upcoming = regs
    .map((r) => ({ name: r.name, deadline: r.nextDeadline, t: Date.parse(r.nextDeadline) }))
    .filter((r) => Number.isFinite(r.t) && r.t >= now.getTime())
    .sort((a, b) => a.t - b.t);
  return {
    tracked: regs.length,
    compliant: regs.filter((r) => r.status === "compliant").length,
    actionRequired: regs.filter((r) => r.status === "action_required").length,
    dueWithin30Days: upcoming.filter((r) => r.t - now.getTime() <= 30 * day).length,
    next: upcoming[0] ? { name: upcoming[0].name, deadline: upcoming[0].deadline, daysLeft: Math.ceil((upcoming[0].t - now.getTime()) / day) } : null,
  };
}
