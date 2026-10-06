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
import { waterSummary, waterBills, type WaterSummary } from "@/lib/integrations/water.server";
import { eacBills } from "@/lib/integrations/eac.server";
import { billInboxSummary, type BillInboxSummary } from "@/lib/integrations/bill-inbox.server";
import { billPaymentCheck } from "@/lib/integrations/bill-payments.server";
import type { BillPaymentCheck } from "@/lib/integrations/bill-match";
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
  /** Bank payments to the water board / EAC matched against the bills. */
  waterPayments: BillPaymentCheck;
  eacPayments: BillPaymentCheck;
  billInbox: BillInboxSummary;
  climateTrace: ClimateTraceSummary | null;
  climateTraceReason: "unsupported" | "unavailable" | null;
  cystat: CyStatSummary | null;
  /** Onboarding sector, so the page can say when it has no NACE match. */
  industry: string | null;
  wikirate: WikiRateSummary;
  /** Registrar of Companies link, read from the workspace (set in Settings). */
  registry: { registrationNo: string; legalName: string | null; status: string | null; checkedAt: string | null } | null;
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
    const [allWater, allEac] = await Promise.all([
      waterBills(account.id).catch((err) => { log.warn("waterBills failed", err); return []; }),
      eacBills(account.id).catch((err) => { log.warn("eacBills failed", err); return []; }),
    ]);
    const [grid, bank, saltedge, nango, eac, water, ct, cystat, wikirate, waterPayments, eacPayments, billInbox] = await Promise.all([
      gridToday(country).catch((err) => { log.warn("gridToday failed", err); return { grid: null, reason: "unavailable" as const }; }),
      bankSummary(workspace.id).catch((err): BankSummary => {
        log.warn("bankSummary failed", err);
        return {
          configured: false,
          environment: null,
          status: "none",
          accounts: 0,
          lastSyncAt: null,
          consentEndsOn: null,
          failed: false,
          windowDays: 90,
          paymentsRead: 0,
          unmarked: 0,
          categories: [],
          otherDebits: { count: 0, total: 0 },
          recent: [],
        };
      }),
      saltEdgeSummary(workspace.id).catch((err): SaltEdgeSummary => {
        log.warn("saltEdgeSummary failed", err);
        return { configured: false, environment: null, status: "none", accounts: 0, banks: [], lastSyncAt: null };
      }),
      nangoSummary(account.id).catch((err): NangoSummary => {
        log.warn("nangoSummary failed", err);
        return { configured: false, connected: false, connectionsCount: 0, providers: [], lastSyncAt: null };
      }),
      eacSummary(account.id).catch((err): EacSummary => {
        log.warn("eacSummary failed", err);
        return {
          readerReady: false,
          factor: { kgPerKwh: 0.622, source: "UNFCCC NIR", vintage: "2024" },
          bills: [],
          totalKwh: 0,
          totalKgCo2e: 0,
        };
      }),
      waterSummary(account.id).catch((err): WaterSummary => {
        log.warn("waterSummary failed", err);
        return {
          readerReady: false,
          factor: { kgPerM3: 0.616, source: "WDD Cyprus", vintage: "2024" },
          bills: [],
          totalM3: 0,
          totalKgCo2e: 0,
        };
      }),
      climateTraceSummary(country).catch((err) => { log.warn("climateTraceSummary failed", err); return { data: null, reason: "unavailable" as const }; }),
      cyStatSummary(industry).catch((err) => { log.warn("cyStatSummary failed", err); return { data: null, reason: "unavailable" as const }; }),
      wikiRateSummary().catch((err): WikiRateSummary => {
        log.warn("wikiRateSummary failed", err);
        return { configured: false, cyprusCompanies: null, sample: [], reason: "unavailable" };
      }),
      billPaymentCheck(workspace.id, "water", allWater).catch((err): BillPaymentCheck => {
        log.warn("billPaymentCheck water failed", err);
        return { bankLinked: false, coveredFrom: null, matched: [], paymentsWithoutBill: [], billsWithoutPayment: [] };
      }),
      billPaymentCheck(workspace.id, "electricity", allEac).catch((err): BillPaymentCheck => {
        log.warn("billPaymentCheck electricity failed", err);
        return { bankLinked: false, coveredFrom: null, matched: [], paymentsWithoutBill: [], billsWithoutPayment: [] };
      }),
      billInboxSummary(account.id).catch((err): BillInboxSummary => {
        log.warn("billInboxSummary failed", err);
        return {
          ready: false,
          address: null,
          lastMessageAt: null,
          lastMessageFrom: null,
          lastMessageSubject: null,
          lastResult: [],
          confirmation: null,
        };
      }),
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
      waterPayments,
      eacPayments,
      billInbox,
      climateTrace: ct.data,
      climateTraceReason: ct.reason,
      cystat: cystat.data,
      industry,
      wikirate,
      registry: workspace.registrationNo
        ? {
            registrationNo: workspace.registrationNo,
            legalName: workspace.registryName ?? null,
            status: workspace.registryStatus ?? null,
            checkedAt: workspace.registryCheckedAt ? new Date(workspace.registryCheckedAt).toISOString() : null,
          }
        : null,
      fetchedAt: new Date().toISOString(),
    };
    return NextResponse.json(body);
  } catch (error) {
    const ref = log.error("GET failed", error);
    return NextResponse.json({ message: "Your connections could not be read.", ref }, { status: 500 });
  }
}
