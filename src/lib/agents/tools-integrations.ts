/**
 * Read tools over every connected source. Any agent may combine them; a
 * planning agent picks which ones a goal needs. All are risk 0 (read only),
 * all run through the same runtime, so every call is in the step ledger.
 *
 * Each tool answers with real figures plus where they came from, or with a
 * plain reason it could not (not configured, not found, unavailable).
 */

import { z } from "zod";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { metricReadings, workspaceFacts, workspaces } from "@/db/schema";
import { loadCompanyWorkspace } from "@/lib/company.server";
import { lookupRegistry, searchRegistry } from "@/lib/integrations/registry.server";
import { comparePeers, findWikiRateCompany, wikiRateFigures, WIKIRATE_SOURCE } from "@/lib/integrations/wikirate.server";
import { climateTraceSummary, cyStatSummary } from "@/lib/integrations/reference.server";
import { eacSummary } from "@/lib/integrations/eac.server";
import { waterSummary } from "@/lib/integrations/water.server";
import { bankSummary } from "@/lib/bank/bank.server";
import type { ToolDef } from "./tools";

function tool<I extends z.ZodType, O>(def: ToolDef<I, O>): ToolDef<I, O> {
  return def;
}

async function workspaceRow(workspaceId: string) {
  const [w] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);
  if (!w) throw new Error("Workspace not found.");
  return w;
}

/** The company as every page sees it: profile facts overlaid on the workspace. */
async function company(workspaceId: string) {
  const w = await workspaceRow(workspaceId);
  return w.ownerUserId ? loadCompanyWorkspace(w.ownerUserId, w) : w;
}

export const readCompanyProfile = tool({
  name: "read_company_profile",
  risk: 0,
  description:
    "The company record every page shares: name, sector, employees, country, sites, revenue, framework, and the Registrar of Companies link if the owner made one.",
  input: z.object({}),
  run: async (ctx) => {
    const c = await company(ctx.workspaceId);
    return {
      name: c.name,
      sector: c.sector,
      employees: c.employees || null,
      country: c.country,
      sites: c.sites,
      revenueEur: c.revenueEur,
      baselineYear: c.baselineYear,
      framework: c.framework,
      registry: c.registrationNo
        ? {
            registrationNo: c.registrationNo,
            type: c.registryType,
            legalName: c.registryName,
            status: c.registryStatus,
            registeredOn: c.registryRegisteredOn,
            address: c.registryAddress,
            checkedAt: c.registryCheckedAt?.toISOString() ?? null,
          }
        : null,
    };
  },
});

export const searchCompanyRegistry = tool({
  name: "search_company_registry",
  risk: 0,
  description:
    "Search the Cyprus Registrar of Companies by name or by number (HE 12345). Returns up to 10 entries with status and registration date.",
  input: z.object({ query: z.string().min(1).max(120) }),
  run: async (_ctx, input) => searchRegistry(input.query),
});

export const lookupCompanyRegistry = tool({
  name: "lookup_company_registry",
  risk: 0,
  description:
    "Full Cyprus register entry for one registration number: legal name, status, registration date, registered office and officials (directors, secretary).",
  input: z.object({ registrationNo: z.string().min(1).max(20) }),
  run: async (_ctx, input) => lookupRegistry(input.registrationNo),
});

export const findWikiRateCompanyTool = tool({
  name: "find_wikirate_company",
  risk: 0,
  description:
    "Find a company on WikiRate (company-published sustainability figures, mostly large firms). Returns the exact match if any and close candidates.",
  input: z.object({ name: z.string().min(2).max(160) }),
  run: async (_ctx, input) => findWikiRateCompany(input.name),
});

export const readWikiRateFigures = tool({
  name: "read_wikirate_figures",
  risk: 0,
  description:
    "Published Scope 1, 2 and 3 emissions, staff, energy use and science-based target of one company on WikiRate (use the exact WikiRate name). Each figure has year, unit and source link.",
  input: z.object({ company: z.string().min(2).max(160) }),
  run: async (_ctx, input) => {
    const r = await wikiRateFigures(input.company);
    return r.ok ? { ...r, source: WIKIRATE_SOURCE } : r;
  },
});

/** Own Scope 1 + 2 for the latest calendar year that has readings for both. */
export async function ownScope12(workspaceId: string): Promise<{ year: number | null; tonnes: number | null; months: number }> {
  const rows = await db
    .select()
    .from(metricReadings)
    .where(eq(metricReadings.workspaceId, workspaceId))
    .orderBy(asc(metricReadings.periodStart));
  const byYear = new Map<number, { s1: number; s2: number; months: Set<string>; has1: boolean; has2: boolean }>();
  for (const r of rows) {
    if (r.metricKey !== "scope1" && r.metricKey !== "scope2") continue;
    const year = Number(r.periodStart.slice(0, 4));
    const y = byYear.get(year) ?? { s1: 0, s2: 0, months: new Set<string>(), has1: false, has2: false };
    if (r.metricKey === "scope1") { y.s1 += r.value; y.has1 = true; } else { y.s2 += r.value; y.has2 = true; }
    y.months.add(r.periodStart.slice(0, 7));
    byYear.set(year, y);
  }
  const years = [...byYear.entries()].filter(([, y]) => y.has1 && y.has2).sort((a, b) => b[0] - a[0]);
  if (!years.length) return { year: null, tonnes: null, months: 0 };
  const [year, y] = years[0];
  return { year, tonnes: y.s1 + y.s2, months: y.months.size };
}

export const compareWithPeers = tool({
  name: "compare_with_peers",
  risk: 0,
  description:
    "Emissions per employee (Scope 1+2) of up to 8 named companies on WikiRate, against this company's own recorded figure. Peers are usually much larger; treat as direction only.",
  input: z.object({ peers: z.array(z.string().min(2).max(160)).min(1).max(8) }),
  run: async (ctx, input) => {
    const [c, own] = await Promise.all([company(ctx.workspaceId), ownScope12(ctx.workspaceId)]);
    const r = await comparePeers({ peers: input.peers, ownScope12Tonnes: own.tonnes, ownEmployees: c.employees || null });
    if (!r.ok) return r;
    return {
      ...r,
      ownBasis: own.tonnes === null
        ? "No recorded Scope 1 and 2 readings yet, so there is no own figure to compare."
        : `Own figure: ${own.tonnes.toFixed(2)} tCO2e over ${own.months} recorded month(s) of ${own.year}, ${c.employees} employees (lower bound of the team-size band).`,
      source: WIKIRATE_SOURCE,
    };
  },
});

export const readCyprusContext = tool({
  name: "read_cyprus_context",
  risk: 0,
  description:
    "National context for the company's country and sector: Climate TRACE country emissions by sector, and CyStat establishments in the sector. Context only, never the company's own figures.",
  input: z.object({}),
  run: async (ctx) => {
    const c = await company(ctx.workspaceId);
    const [ct, cy] = await Promise.all([climateTraceSummary(c.country), cyStatSummary(c.sector)]);
    return { country: c.country, sector: c.sector, climateTrace: ct, cyStat: cy };
  },
});

export const readUtilityBills = tool({
  name: "read_utility_bills",
  risk: 0,
  description:
    "Electricity (EAC) and water bills read so far: periods, kWh or m³, amounts and the emissions worked out from them, with the factor used.",
  input: z.object({}),
  run: async (ctx) => {
    const w = await workspaceRow(ctx.workspaceId);
    if (!w.ownerUserId) return { electricity: null, water: null, reason: "This workspace has no owner account, so no bills." };
    const [electricity, water] = await Promise.all([eacSummary(w.ownerUserId), waterSummary(w.ownerUserId)]);
    return { electricity, water };
  },
});

export const readBankSpend = tool({
  name: "read_bank_spend",
  risk: 0,
  description:
    "The linked bank account's last 90 days, sorted into electricity, fuel, water and freight spend, with recent payments. Says when no bank is linked.",
  input: z.object({}),
  run: async (ctx) => bankSummary(ctx.workspaceId),
});

export const readWorkspaceFacts = tool({
  name: "read_workspace_facts",
  risk: 0,
  description: "Facts agents have recorded for this workspace (current values only), each with its source kind and which agent recorded it.",
  input: z.object({}),
  run: async (ctx) => {
    const rows = await db
      .select()
      .from(workspaceFacts)
      .where(and(eq(workspaceFacts.workspaceId, ctx.workspaceId), isNull(workspaceFacts.validTo)))
      .orderBy(asc(workspaceFacts.key));
    return rows.slice(0, 200).map((f) => ({
      key: f.key,
      value: f.value,
      unit: f.unit,
      sourceKind: f.sourceKind,
      agent: f.agentKey,
      since: f.validFrom.toISOString(),
    }));
  },
});

export const INTEGRATION_TOOLS = {
  read_company_profile: readCompanyProfile,
  search_company_registry: searchCompanyRegistry,
  lookup_company_registry: lookupCompanyRegistry,
  find_wikirate_company: findWikiRateCompanyTool,
  read_wikirate_figures: readWikiRateFigures,
  compare_with_peers: compareWithPeers,
  read_cyprus_context: readCyprusContext,
  read_utility_bills: readUtilityBills,
  read_bank_spend: readBankSpend,
  read_workspace_facts: readWorkspaceFacts,
} as const;
