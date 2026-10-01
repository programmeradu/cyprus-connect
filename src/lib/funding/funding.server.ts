/**
 * Funding matching for one workspace: builds the business picture from the
 * shared company record, runs the fixed fit check against every open call
 * whose rules have been read, and stores one verdict per call.
 */

import { and, eq, inArray, isNotNull, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { fundingMatches, grantOpportunities, user, workspaces } from "@/db/schema";
import { checkFit, yearsSince } from "./match";
import { FACT_LABEL, sectorOf, type BusinessPicture, type FactKey, type RuleCheck, type Verdict } from "./rules";

export async function businessPicture(workspaceId: string): Promise<BusinessPicture | null> {
  const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);
  if (!ws) return null;
  const [p] = ws.ownerUserId
    ? await db
        .select({ industry: user.companyIndustry, teamSize: user.teamSize, country: user.countryCode })
        .from(user)
        .where(eq(user.id, ws.ownerUserId))
        .limit(1)
    : [];
  const band = staffBand(p?.teamSize);
  const fallback = ws.employees > 0 ? ws.employees : null;
  return {
    country: (p?.country || ws.country || "").toUpperCase() || null,
    employees: band ? band.lo : fallback,
    employeesMax: band ? band.hi : fallback,
    revenueEur: ws.revenueEur ?? null,
    companyAgeYears: yearsSince(ws.registryRegisteredOn),
    sector: sectorOf(p?.industry || ws.sector),
  };
}

/** "11-50" -> 11..50, "250+" -> 250..open, "37" -> exact. */
export function staffBand(teamSize: string | null | undefined): { lo: number; hi: number | null } | null {
  const t = (teamSize ?? "").replace(/\s/g, "");
  let m = t.match(/^(\d+)-(\d+)$/);
  if (m) return { lo: Number(m[1]), hi: Number(m[2]) };
  m = t.match(/^(\d+)\+$/);
  if (m) return { lo: Number(m[1]), hi: null };
  m = t.match(/^(\d+)$/);
  if (m) return { lo: Number(m[1]), hi: Number(m[1]) };
  return null;
}

function openCallsFilter() {
  const today = new Date().toISOString().slice(0, 10);
  return and(
    isNotNull(grantOpportunities.rules),
    or(isNull(grantOpportunities.deadline), sql`left(${grantOpportunities.deadline}, 10) >= ${today}`),
  );
}

export interface RefreshResult {
  checked: number;
  strong: number;
  needsInfo: number;
  /** Missing facts on shown calls, with the calls each would settle. */
  facts: { fact: FactKey; opportunityIds: number[]; titles: string[] }[];
}

export async function refreshFundingMatches(workspaceId: string): Promise<RefreshResult> {
  const biz = await businessPicture(workspaceId);
  if (!biz) return { checked: 0, strong: 0, needsInfo: 0, facts: [] };
  const calls = await db.select().from(grantOpportunities).where(openCallsFilter());
  const facts = new Map<FactKey, { ids: number[]; titles: string[] }>();
  let strong = 0;
  let needsInfo = 0;
  const now = new Date();
  for (const c of calls) {
    if (!c.rules) continue;
    const fit = checkFit(c.rules, biz);
    if (fit.verdict === "strong") strong += 1;
    if (fit.verdict === "needs_info") {
      needsInfo += 1;
      for (const m of fit.missing) {
        if (!m.fact) continue;
        const f = facts.get(m.fact) ?? { ids: [], titles: [] };
        f.ids.push(c.id);
        f.titles.push(c.title);
        facts.set(m.fact, f);
      }
    }
    await db
      .insert(fundingMatches)
      .values({ workspaceId, opportunityId: c.id, verdict: fit.verdict, met: fit.met, missing: fit.missing, failed: fit.failed, rulesHash: c.rulesHash, checkedAt: now })
      .onConflictDoUpdate({
        target: [fundingMatches.workspaceId, fundingMatches.opportunityId],
        set: { verdict: fit.verdict, met: fit.met, missing: fit.missing, failed: fit.failed, rulesHash: c.rulesHash, checkedAt: now },
      });
  }
  return {
    checked: calls.length,
    strong,
    needsInfo,
    facts: [...facts.entries()].map(([fact, v]) => ({ fact, opportunityIds: v.ids, titles: v.titles })),
  };
}

export interface ShownCall {
  id: number;
  source: string;
  title: string;
  url: string;
  program: string | null;
  deadline: string | null;
  verdict: Exclude<Verdict, "hidden">;
  met: RuleCheck[];
  missing: RuleCheck[];
  requiredDocuments: string[];
}

/** Only strong fits and calls one answer away; never the rest. */
export async function shownCalls(workspaceId: string): Promise<{ calls: ShownCall[]; checkedAt: string | null; reviewed: number }> {
  const today = new Date().toISOString().slice(0, 10);
  const rows = await db
    .select({
      id: grantOpportunities.id,
      source: grantOpportunities.source,
      title: grantOpportunities.title,
      url: grantOpportunities.url,
      program: grantOpportunities.program,
      deadline: grantOpportunities.deadline,
      rules: grantOpportunities.rules,
      verdict: fundingMatches.verdict,
      met: fundingMatches.met,
      missing: fundingMatches.missing,
      checkedAt: fundingMatches.checkedAt,
    })
    .from(fundingMatches)
    .innerJoin(grantOpportunities, eq(grantOpportunities.id, fundingMatches.opportunityId))
    .where(eq(fundingMatches.workspaceId, workspaceId));
  let checkedAt: Date | null = null;
  for (const r of rows) if (!checkedAt || r.checkedAt > checkedAt) checkedAt = r.checkedAt;
  const calls = rows
    .filter((r) => (r.verdict === "strong" || r.verdict === "needs_info") && (!r.deadline || r.deadline.slice(0, 10) >= today))
    .map((r) => ({
      id: r.id,
      source: r.source,
      title: r.title,
      url: r.url,
      program: r.program,
      deadline: r.deadline,
      verdict: r.verdict as ShownCall["verdict"],
      met: r.met,
      missing: r.missing,
      requiredDocuments: r.rules?.requiredDocuments ?? [],
    }))
    .sort((a, b) =>
      a.verdict === b.verdict ? (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999") : a.verdict === "strong" ? -1 : 1,
    );
  return { calls, checkedAt: checkedAt ? checkedAt.toISOString() : null, reviewed: rows.length };
}

export function factQuestion(fact: FactKey, count: number) {
  const l = FACT_LABEL[fact];
  return {
    en: `${l.en}: confirms ${count} funding ${count === 1 ? "call" : "calls"}`,
    el: `${l.el}: επιβεβαιώνει ${count} ${count === 1 ? "πρόσκληση" : "προσκλήσεις"} χρηματοδότησης`,
  };
}

export async function opportunityTitles(ids: number[]) {
  if (!ids.length) return [];
  return db.select({ id: grantOpportunities.id, title: grantOpportunities.title }).from(grantOpportunities).where(inArray(grantOpportunities.id, ids));
}
