/**
 * Builds the Action plan for one workspace from shared records: bills, bank
 * lines, Grant scout matches and the projects the company started. Checks run
 * on every read, so a newly saved bill or payment moves a project at once.
 */
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/db";
import { actionEvidence, actionProjects, bankLinks, bankTransactions, cbamImportLines, cbamSupplierRequests, cbamSuppliers, fundingMatches, grantOpportunities } from "@/db/schema";
import { eacBills } from "@/lib/integrations/eac.server";
import { waterBills } from "@/lib/integrations/water.server";
import { recordActivity, type ActivitySession } from "@/lib/activity.server";
import { CATALOG, PROJECT_TYPES, type ProjectInputs, type ProjectType, type Stage } from "./catalog";
import { baselineFrom, computeFigures, type Figures, type MeterBill, type UsageBaseline } from "./roi";
import { allPassed, billDrop, paymentCandidates, purchaseCheck, supplierCheck, type BankLine, type CheckResult } from "./verify";

export interface FundingLink { id: number; title: string; url: string; verdict: string; deadline: string | null }

export interface PlanProject {
  id: number | null;
  type: ProjectType;
  stage: Stage;
  /** Records that made Vuneli suggest it. */
  trigger: { key: string; values: Record<string, number> };
  inputs: ProjectInputs;
  startedOn: string | null;
  installedOn: string | null;
  confirmedAt: string | null;
  figures: Figures;
  checks: CheckResult[];
  evidence: { id: number; kind: string; fileName: string | null; quotes: Record<string, string>; createdAt: string }[];
  payments: { id: number; bookedOn: string; amount: number; description: string | null }[];
  funding: FundingLink[];
}

export interface ActionPlan {
  projects: PlanProject[];
  data: { electricityBills: number; waterBills: number; fuelPayments: number; bankLinked: boolean };
  totals: { costEur: number | null; netCostEur: number | null; savedEurYr: number | null; co2KgYr: number | null; paybackYrs: number | null; counted: number; confirmedCo2KgYr: number | null };
}

const ENERGY = /energ|solar|photovolta|renewab|efficien|heat pump|ενεργ|φωτοβολτα|εξοικονόμ|ανανεώσιμ/i;
const WATER = /water|irrigat|νερ|ύδατ|άρδευ/i;
const MOBILITY = /electric vehicle|e-?mobility|charging|ηλεκτροκίνη|φόρτισ/i;
const SUPPLY = /supplier|supply chain|scope.?3|esg|value chain|προμηθευτ|εφοδιαστικ/i;

async function inputsFor(ws: { id: string }, userId: string) {
  const since = new Date(Date.now() - 400 * 86_400_000).toISOString().slice(0, 10);
  const [eac, water, links, lines, matches, suppliers, cbamLines, requests] = await Promise.all([
    eacBills(userId).catch(() => []),
    waterBills(userId).catch(() => []),
    db.select({ id: bankLinks.id, status: bankLinks.status }).from(bankLinks).where(eq(bankLinks.workspaceId, ws.id)),
    db
      .select({ id: bankTransactions.id, bookedOn: bankTransactions.bookedOn, amount: bankTransactions.amount, description: bankTransactions.description, direction: bankTransactions.direction, category: bankTransactions.category })
      .from(bankTransactions)
      .where(and(eq(bankTransactions.workspaceId, ws.id), gte(bankTransactions.bookedOn, since)))
      .orderBy(desc(bankTransactions.bookedOn))
      .limit(2000),
    db
      .select({ id: grantOpportunities.id, title: grantOpportunities.title, summary: grantOpportunities.summary, program: grantOpportunities.program, url: grantOpportunities.url, deadline: grantOpportunities.deadline, verdict: fundingMatches.verdict })
      .from(fundingMatches)
      .innerJoin(grantOpportunities, eq(grantOpportunities.id, fundingMatches.opportunityId))
      .where(and(eq(fundingMatches.workspaceId, ws.id), inArray(fundingMatches.verdict, ["strong", "needs_info"]))),
    db.select({ id: cbamSuppliers.id, supplierName: cbamSuppliers.supplierName }).from(cbamSuppliers).where(eq(cbamSuppliers.workspaceId, ws.id)),
    db.select({ id: cbamImportLines.id, supplierName: cbamImportLines.supplierName, directSee: cbamImportLines.directSee, indirectSee: cbamImportLines.indirectSee }).from(cbamImportLines).where(eq(cbamImportLines.workspaceId, ws.id)),
    db.select({ id: cbamSupplierRequests.id, supplierName: cbamSupplierRequests.supplierName }).from(cbamSupplierRequests).where(eq(cbamSupplierRequests.workspaceId, ws.id)),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const open = matches.filter((m) => !m.deadline || m.deadline.slice(0, 10) >= today);
  return {
    elec: eac.map((b) => ({ start: b.periodStart, end: b.periodEnd, qty: b.kwh, amountEur: b.amountEur })) as MeterBill[],
    water: water.map((b) => ({ start: b.periodStart, end: b.periodEnd, qty: b.m3, amountEur: b.amountEur })) as MeterBill[],
    bankLinked: links.some((l) => l.status === "active"),
    lines: lines as (BankLine & { category: string })[],
    funding: open,
    suppliers,
    cbamLines,
    supplierRequests: requests,
  };
}

function fundingFor(type: ProjectType, calls: Awaited<ReturnType<typeof inputsFor>>["funding"]): FundingLink[] {
  const re = type === "water" ? WATER : type === "fleet" ? MOBILITY : type === "supplier_data" ? SUPPLY : ENERGY;
  return calls
    .filter((c) => re.test(`${c.title} ${c.summary} ${c.program ?? ""}`))
    .sort((a, b) => (a.verdict === b.verdict ? 0 : a.verdict === "strong" ? -1 : 1))
    .slice(0, 3)
    .map((c) => ({ id: c.id, title: c.title, url: c.url, verdict: c.verdict, deadline: c.deadline }));
}

export async function buildActionPlan(session: ActivitySession & { workspace: { id: string; ownerUserId?: string | null } }): Promise<ActionPlan> {
  const ws = session.workspace;
  const userId = ws.ownerUserId ?? session.account.id;
  const src = await inputsFor(ws, userId);
  const rows = await db.select().from(actionProjects).where(eq(actionProjects.workspaceId, ws.id));
  const ev = rows.length
    ? await db.select().from(actionEvidence).where(inArray(actionEvidence.projectId, rows.map((r) => r.id))).orderBy(desc(actionEvidence.createdAt))
    : [];
  const fuel = src.lines.filter((l) => l.category === "fuel" && l.direction !== "credit");
  const base: Record<"electricity" | "water", UsageBaseline> = { electricity: baselineFrom(src.elec), water: baselineFrom(src.water) };

  const triggers: Partial<Record<ProjectType, PlanProject["trigger"]>> = {};
  if (src.elec.length) {
    triggers.solar = { key: "electricity_bills", values: { bills: src.elec.length, kwh: Math.round(base.electricity.annual ?? 0) } };
    triggers.efficiency = triggers.solar;
  }
  if (src.water.length) triggers.water = { key: "water_bills", values: { bills: src.water.length, m3: Math.round(base.water.annual ?? 0) } };
  if (fuel.length) triggers.fleet = { key: "fuel_payments", values: { payments: fuel.length, eur: Math.round(fuel.reduce((n, l) => n + Math.abs(l.amount), 0)) } };
  if (src.suppliers.length) {
    triggers.supplier_data = { key: "suppliers_tracked", values: { suppliers: src.suppliers.length } };
  } else if (src.cbamLines.length) {
    triggers.supplier_data = { key: "cbam_imports", values: { imports: src.cbamLines.length } };
  }

  const projects: PlanProject[] = [];
  for (const type of PROJECT_TYPES) {
    const def = CATALOG[type];
    const row = rows.find((r) => r.type === type);
    if (!row && !triggers[type]) continue;
    const meterBills = def.meter === "electricity" ? src.elec : def.meter === "water" ? src.water : [];
    const meterBase = def.meter ? base[def.meter] : null;
    const inputs = (row?.inputs ?? {}) as ProjectInputs;
    const figures = computeFigures(type, inputs, meterBase);
    const myEv = ev.filter((e) => e.projectId === row?.id);
    const usedTx = new Set(ev.map((e) => e.bankTransactionId).filter(Boolean));
    const cands = row ? paymentCandidates(src.lines, inputs.supplierName, inputs.quoteEur, row.startedOn).filter((l) => !usedTx.has(l.id)) : [];
    const sName = (inputs.supplierName ?? "").trim().toLowerCase();
    const hasDeclared = Boolean(
      sName &&
        src.cbamLines.some(
          (l) => l.supplierName.trim().toLowerCase() === sName && (l.directSee !== null || l.indirectSee !== null),
        ),
    );
    const hasActiveReq = Boolean(
      sName &&
        src.supplierRequests.some(
          (r) => r.supplierName.trim().toLowerCase() === sName,
        ),
    );
    const checks: CheckResult[] = row
      ? def.checks.map((k) =>
          k === "purchase"
            ? purchaseCheck(myEv, cands.length, src.bankLinked)
            : k === "supplier_data"
              ? supplierCheck(myEv, hasDeclared, hasActiveReq)
              : billDrop(meterBills, row.installedOn),
        )
      : [];

    let stage: Stage = row ? (row.stage as Stage) : "idea";
    if (row && stage === "being_checked" && allPassed(def, checks)) {
      stage = "confirmed";
      const snapshot = { figures, checks, at: new Date().toISOString() };
      await db.update(actionProjects).set({ stage, confirmedAt: new Date(), confirmedFigures: snapshot, updatedAt: new Date() }).where(eq(actionProjects.id, row.id));
      await recordActivity(session, "confirmed", `Action plan: ${type} project`, "Every required check passed (purchase proof and, where it applies, lower bills).", "agent");
      row.confirmedAt = new Date();
    }

    projects.push({
      id: row?.id ?? null,
      type,
      stage,
      trigger: triggers[type] ?? { key: "started", values: {} },
      inputs,
      startedOn: row?.startedOn ?? null,
      installedOn: row?.installedOn ?? null,
      confirmedAt: row?.confirmedAt ? new Date(row.confirmedAt).toISOString() : null,
      figures,
      checks,
      evidence: myEv.map((e) => ({ id: e.id, kind: e.kind, fileName: e.fileName, quotes: e.quotes as Record<string, string>, createdAt: new Date(e.createdAt).toISOString() })),
      payments: stage === "confirmed" ? [] : cands.slice(0, 5).map((l) => ({ id: l.id, bookedOn: l.bookedOn, amount: Math.abs(l.amount), description: l.description })),
      funding: fundingFor(type, src.funding),
    });
  }

  const started = projects.filter((p) => p.id !== null);
  const sum = (f: (p: PlanProject) => number | null) => {
    const vals = started.map(f).filter((v): v is number => v !== null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) : null;
  };
  const netCostEur = sum((p) => p.figures.netCostEur);
  const savedEurYr = sum((p) => (p.figures.netCostEur !== null ? p.figures.savedEurYr : null));
  const confirmed = projects.filter((p) => p.stage === "confirmed");
  return {
    projects,
    data: { electricityBills: src.elec.length, waterBills: src.water.length, fuelPayments: fuel.length, bankLinked: src.bankLinked },
    totals: {
      costEur: sum((p) => p.figures.costEur),
      netCostEur,
      savedEurYr: sum((p) => p.figures.savedEurYr),
      co2KgYr: sum((p) => p.figures.co2KgYr),
      paybackYrs: netCostEur !== null && savedEurYr ? netCostEur / savedEurYr : null,
      counted: started.length,
      confirmedCo2KgYr: confirmed.length ? confirmed.reduce((n, p) => n + (p.figures.co2KgYr ?? 0), 0) : null,
    },
  };
}

/** Re-evaluates action projects for a workspace, moving any with passed checks to confirmed. */
export async function recheckActionPlan(session: ActivitySession & { workspace: { id: string; ownerUserId?: string | null } }): Promise<ActionPlan> {
  return buildActionPlan(session);
}
