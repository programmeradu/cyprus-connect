/**
 * What the Integrations page shows, read on the server from real sources:
 * whether each account link is set up and made, and the latest measured
 * reading from each live feed. Nothing is estimated; a feed with no answer
 * says so.
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { resolveConsoleSession } from "@/lib/console-session";
import { logger } from "@/lib/log";
import { gridToday } from "@/lib/insights/insights.server";
import { bankSummary, type BankSummary } from "@/lib/bank/bank.server";
import { saltEdgeSummary, type SaltEdgeSummary } from "@/lib/bank/saltedge.server";
import { nangoSummary, type NangoSummary } from "@/lib/integrations/nango.server";
import { eacSummary, type EacSummary } from "@/lib/integrations/eac.server";
import { waterSummary, type WaterSummary } from "@/lib/integrations/water.server";
import {
  climateTraceSummary,
  cyStatSummary,
  wikiRateSummary,
  type ClimateTraceSummary,
  type CyStatSummary,
  type WikiRateSummary,
} from "@/lib/integrations/reference.server";
import { readCompanyProfile } from "@/lib/company.server";

export const dynamic = "force-dynamic";
const log = logger("api.console.integrations");

export interface IntegrationsData {
  country: string;
  saltedge: SaltEdgeSummary;
  nango: NangoSummary;
  grid: {
    latestAt: string;
    latestGrams: number;
    renewableShare: number | null;
    hours: number;
    source: string;
  } | null;
  gridReason: "unsupported" | "unavailable" | null;
  bank: BankSummary;
  eac: EacSummary;
  water: WaterSummary;
  climateTrace: ClimateTraceSummary | null;
  climateTraceReason: "unsupported" | "unavailable" | null;
  cystat: CyStatSummary | null;
  /** Onboarding sector, so the page can say when it has no NACE match. */
  industry: string | null;
  wikirate: WikiRateSummary;
  fetchedAt: string;
}

export async function GET() {
  const resolved = await resolveConsoleSession(await headers());
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error, message: resolved.message }, { status: resolved.status });
  }
  const { account, workspace } = resolved.session;
  const country = (workspace.country || "CY").toUpperCase();
  try {
    const profile = await readCompanyProfile(account.id);
    const industry = profile?.companyIndustry?.trim() || null;
    const [grid, bank, saltedge, nango, eac, water, ct, cystat, wikirate] = await Promise.all([
      gridToday(country),
      bankSummary(workspace.id),
      saltEdgeSummary(workspace.id),
      nangoSummary(account.id),
      eacSummary(account.id),
      waterSummary(account.id),
      climateTraceSummary(country),
      cyStatSummary(industry),
      wikiRateSummary(),
    ]);
    const body: IntegrationsData = {
      country,
      saltedge,
      nango,
      grid: grid.grid
        ? {
            latestAt: grid.grid.latest.at,
            latestGrams: grid.grid.latest.grams,
            renewableShare: grid.grid.renewableShare,
            hours: grid.grid.hours.length,
            source: grid.grid.source,
          }
        : null,
      gridReason: grid.reason,
      bank,
      eac,
      water,
      climateTrace: ct.data,
      climateTraceReason: ct.reason,
      cystat: cystat.data,
      industry,
      wikirate,
      fetchedAt: new Date().toISOString(),
    };
    return NextResponse.json(body);
  } catch (error) {
    const ref = log.error("GET failed", error);
    return NextResponse.json({ message: "Your connections could not be read.", ref }, { status: 500 });
  }
}
