/**
 * Insights for the workspace, from real sources only:
 * today's measured grid for the company's country, the company's own recorded
 * months, and its tracked obligations. A part with no data is null, never filled.
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { resolveConsoleSession } from "@/lib/console-session";
import { logger } from "@/lib/log";
import { complianceSummary, footprintMonths, gridToday } from "@/lib/insights/insights.server";

export const dynamic = "force-dynamic";
const log = logger("api.console.insights");

export async function GET() {
  const resolved = await resolveConsoleSession(await headers());
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error, message: resolved.message }, { status: resolved.status });
  }
  const { account, workspace } = resolved.session;
  const country = (workspace.country || "CY").toUpperCase();
  try {
    const [grid, months, compliance] = await Promise.all([
      gridToday(country),
      footprintMonths(account.id),
      complianceSummary(account.id),
    ]);
    return NextResponse.json({
      country,
      grid: grid.grid,
      gridReason: grid.reason,
      months,
      compliance,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    const ref = log.error("GET failed", error);
    return NextResponse.json({ message: "Insights could not be read.", ref }, { status: 500 });
  }
}
