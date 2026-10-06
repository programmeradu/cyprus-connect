/**
 * Deadline matching for one workspace. Reads the company facts from the shared
 * record, runs the fixed rulebook and writes one `obligations` row per rule
 * (applies / might / not, with the reason and the official source). Rows a
 * person edited, and rows added by a person, are never touched.
 */

import { and, eq, gte, inArray, isNotNull, isNull, like } from "drizzle-orm";
import { db } from "@/db";
import { agentTasks, cbamImportLines, lawWatch, metricReadings, obligations, workspaces } from "@/db/schema";
import { businessPicture } from "@/lib/funding/funding.server";
import { RULES, evaluateAll, type Match, type ObligationFactKey, type ObligationFacts } from "./rulebook";

/** Facts the deadline matcher asks about itself; employees/revenue are asked by Grant scout and Settings. */
export const DEADLINE_QUESTION_FACTS = ["cbam_goods", "eudr_goods", "consumer_claims"] as const;
export type DeadlineQuestionFact = (typeof DEADLINE_QUESTION_FACTS)[number];

const isNoThresholdCn = (cn: string) => {
  const c = cn.replace(/\D/g, "");
  return c.startsWith("2716") || c.startsWith("28041000");
};

import { eacBills } from "@/lib/integrations/eac.server";

/** Annualise electricity kWh from EAC bills when metric readings are not recorded. */
export function annualiseEacKwh(bills: { kwh: number; periodStart?: string; periodEnd?: string }[]): number {
  if (!bills.length) return 0;
  let totalKwh = 0;
  let totalDays = 0;
  for (const b of bills) {
    if (typeof b.kwh !== "number" || b.kwh <= 0) continue;
    totalKwh += b.kwh;
    if (b.periodStart && b.periodEnd) {
      const start = new Date(b.periodStart).getTime();
      const end = new Date(b.periodEnd).getTime();
      const days = Math.round((end - start) / 86_400_000);
      totalDays += isNaN(days) || days <= 0 ? 61 : days;
    } else {
      totalDays += 61;
    }
  }
  if (totalKwh === 0) return 0;
  if (totalDays >= 365) {
    return Math.round((totalKwh / totalDays) * 365);
  }
  const effectiveDays = Math.max(30, totalDays);
  return Math.round((totalKwh / effectiveDays) * 365);
}

export async function obligationFacts(workspaceId: string): Promise<ObligationFacts | null> {
  const [ws] = await db
    .select({
      importsCbamGoods: workspaces.importsCbamGoods,
      eudrCommodities: workspaces.eudrCommodities,
      consumerClaims: workspaces.consumerClaims,
      ownerUserId: workspaces.ownerUserId,
    })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);
  if (!ws) return null;
  const biz = await businessPicture(workspaceId);
  const lines = await db
    .select({ year: cbamImportLines.year, cn: cbamImportLines.cnCode, mass: cbamImportLines.netMass })
    .from(cbamImportLines)
    .where(eq(cbamImportLines.workspaceId, workspaceId));
  const cbamTonnesByYear: Record<number, number> = {};
  let noThreshold = false;
  for (const l of lines) {
    if (isNoThresholdCn(l.cn)) {
      noThreshold = true;
      continue;
    }
    cbamTonnesByYear[l.year] = (cbamTonnesByYear[l.year] ?? 0) + l.mass;
  }
  const since = new Date(Date.now() - 365 * 86_400_000).toISOString().slice(0, 10);
  const kwh = await db
    .select({ value: metricReadings.value })
    .from(metricReadings)
    .where(and(eq(metricReadings.workspaceId, workspaceId), eq(metricReadings.metricKey, "electricity_kwh"), gte(metricReadings.periodStart, since)));

  let electricityKwh12m: number | null = kwh.length ? kwh.reduce((s, r) => s + r.value, 0) : null;
  if (electricityKwh12m === null && ws.ownerUserId) {
    const bills = await eacBills(ws.ownerUserId);
    if (bills.length > 0) {
      electricityKwh12m = annualiseEacKwh(bills);
    }
  }

  return {
    employees: biz?.employees ?? null,
    employeesMax: biz?.employeesMax ?? null,
    revenueEur: biz?.revenueEur ?? null,
    cbamTonnesByYear,
    cbamNoThresholdGoods: noThreshold,
    importsCbamGoods: lines.length ? true : ws.importsCbamGoods,
    eudrCommodities: ws.eudrCommodities,
    consumerClaims: ws.consumerClaims,
    electricityKwh12m,
  };
}

/** Base laws with an amendment nobody has reviewed yet. */
export async function lawsUnderReview(): Promise<Map<string, string[]>> {
  const rows = await db
    .select({ base: lawWatch.baseCelex, amending: lawWatch.amendingCelex })
    .from(lawWatch)
    .where(isNull(lawWatch.reviewedAt));
  const m = new Map<string, string[]>();
  for (const r of rows) m.set(r.base, [...(m.get(r.base) ?? []), r.amending]);
  return m;
}

export interface ObligationsRefresh {
  applies: number;
  might: number;
  not: number;
  /** Facts that would settle "might" rules, with the rules each settles. */
  facts: { fact: DeadlineQuestionFact; ruleIds: string[]; titles: string[] }[];
}

export async function refreshObligations(workspaceId: string): Promise<ObligationsRefresh> {
  const facts = await obligationFacts(workspaceId);
  if (!facts) return { applies: 0, might: 0, not: 0, facts: [] };
  const now = new Date();
  const existing = await db
    .select({ id: obligations.id, ruleId: obligations.ruleId, userEdited: obligations.userEdited })
    .from(obligations)
    .where(and(eq(obligations.workspaceId, workspaceId), isNotNull(obligations.ruleId)));
  const byRule = new Map(existing.map((e) => [e.ruleId, e]));
  const counts: Record<Match, number> = { applies: 0, might: 0, not: 0 };
  const asks = new Map<DeadlineQuestionFact, { ids: string[]; titles: string[] }>();

  for (const { rule, result } of evaluateAll(facts, now)) {
    counts[result.match] += 1;
    if (result.fact && (DEADLINE_QUESTION_FACTS as readonly string[]).includes(result.fact)) {
      const k = result.fact as DeadlineQuestionFact;
      const a = asks.get(k) ?? { ids: [], titles: [] };
      a.ids.push(rule.id);
      a.titles.push(rule.title.en);
      asks.set(k, a);
    }
    const prev = byRule.get(rule.id);
    if (prev?.userEdited) continue;
    const values = {
      framework: rule.framework,
      title: rule.title.en,
      titleEl: rule.title.el,
      detail: rule.detail.en,
      dueDate: result.dueDate,
      match: result.match,
      reason: result.reason.en,
      reasonEl: result.reason.el,
      sourceUrl: rule.source.url,
      agentKey: rule.agentKey,
      checkedAt: now,
    };
    if (prev) await db.update(obligations).set(values).where(eq(obligations.id, prev.id));
    else await db.insert(obligations).values({ id: `rule:${workspaceId}:${rule.id}`, workspaceId, ruleId: rule.id, status: "on_track", progressPct: 0, ...values });
  }

  // Close deadline questions whose fact is now settled.
  const still = new Set([...asks.keys()].map((f) => `answer_fact:${f}`));
  const open = await db
    .select({ id: agentTasks.id, pendingTool: agentTasks.pendingTool })
    .from(agentTasks)
    .where(and(eq(agentTasks.workspaceId, workspaceId), eq(agentTasks.status, "open"), like(agentTasks.pendingTool, "answer_fact:%")));
  const mine = new Set(DEADLINE_QUESTION_FACTS.map((f) => `answer_fact:${f}`));
  const done = open.filter((t) => mine.has(t.pendingTool ?? "") && !still.has(t.pendingTool ?? "")).map((t) => t.id);
  if (done.length) await db.update(agentTasks).set({ status: "resolved", result: "Answered" }).where(inArray(agentTasks.id, done));

  return { ...counts, facts: [...asks.entries()].map(([fact, v]) => ({ fact, ruleIds: v.ids, titles: v.titles })) };
}

export interface ObligationView {
  id: string;
  ruleId: string | null;
  framework: string;
  title: string;
  titleEl: string | null;
  detail: string | null;
  dueDate: string;
  status: string;
  match: Match | null;
  reason: string | null;
  reasonEl: string | null;
  sourceUrl: string | null;
  sourceLabel: string | null;
  checkedAt: string | null;
  /** CELEX numbers of unreviewed amending acts to this rule's law. */
  underReview: string[];
}

export async function listObligations(workspaceId: string): Promise<ObligationView[]> {
  const [rows, review] = await Promise.all([
    db.select().from(obligations).where(eq(obligations.workspaceId, workspaceId)),
    lawsUnderReview(),
  ]);
  const ruleById = new Map(RULES.map((r) => [r.id, r]));
  return rows.map((o) => {
    const rule = o.ruleId ? ruleById.get(o.ruleId) : undefined;
    return {
      id: o.id,
      ruleId: o.ruleId,
      framework: o.framework,
      title: o.title,
      titleEl: o.titleEl,
      detail: o.detail,
      dueDate: o.dueDate,
      status: o.status,
      match: (o.match as Match | null) ?? null,
      reason: o.reason,
      reasonEl: o.reasonEl,
      sourceUrl: o.sourceUrl,
      sourceLabel: rule?.source.label ?? null,
      checkedAt: o.checkedAt ? o.checkedAt.toISOString() : null,
      underReview: rule ? rule.baseCelex.flatMap((c) => review.get(c) ?? []) : [],
    };
  });
}

export const DEADLINE_FACT_QUESTION: Record<DeadlineQuestionFact, string> = {
  cbam_goods: "Do you import steel, aluminium, cement, fertilisers, hydrogen or electricity from outside the EU?",
  eudr_goods: "Do you sell or export products made from cattle, cocoa, coffee, palm oil, rubber, soya or wood?",
  consumer_claims: "Do you sell to consumers with environmental claims or labels (for example 'eco', 'green', 'carbon neutral')?",
};

export type { ObligationFactKey };
