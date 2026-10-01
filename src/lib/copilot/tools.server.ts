/**
 * Verde's tools. Read tools return compact records with their source, and the
 * browser draws each result as a card. Write tools never change records: they
 * file a pending proposal (approved in /api/console/copilot/proposal) or ask
 * the person for facts through an inline form saved via /api/console/company.
 */

import { tool } from "ai";
import { z } from "zod";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { activityEvents, cbamSuppliers, copilotProposals, metricDefinitions, metricReadings } from "@/db/schema";
import { listObligations } from "@/lib/obligations/obligations.server";
import { shownCalls } from "@/lib/funding/funding.server";
import { eacSummary } from "@/lib/integrations/eac.server";
import { waterSummary } from "@/lib/integrations/water.server";
import { readCompany } from "@/lib/company-update.server";
import { parseAction } from "./prompt";

export interface ToolContext {
  workspaceId: string;
  accountId: string;
}

/** Facts Verde may ask for; each maps to a field of the company record. */
export const ASKABLE_FACTS = [
  "revenueEur",
  "employees",
  "sites",
  "industry",
  "website",
  "importsCbamGoods",
  "eudrCommodities",
  "consumerClaims",
] as const;

const PROPOSAL_KINDS = ["create_task", "update_obligation", "log_reading", "draft_report", "draft_document", "update_company"] as const;

const day = (d: Date | string | null | undefined) => (d ? new Date(d).toISOString().slice(0, 10) : null);

export function verdeTools(ctx: ToolContext) {
  return {
    read_footprint: tool({
      description:
        "Latest readings for every metric in the workspace (emissions, energy, water, intensity) with the previous period for comparison. Use for any question about figures or trends.",
      inputSchema: z.object({}),
      execute: async () => {
        const [defs, rows] = await Promise.all([
          db.select().from(metricDefinitions).orderBy(asc(metricDefinitions.sortOrder)),
          db
            .select()
            .from(metricReadings)
            .where(eq(metricReadings.workspaceId, ctx.workspaceId))
            .orderBy(asc(metricReadings.periodStart)),
        ]);
        const metrics = defs
          .map((d) => {
            const points = rows.filter((r) => r.metricKey === d.key && r.site === null);
            const cur = points.at(-1);
            const prev = points.at(-2);
            if (!cur) return null;
            return {
              key: d.key,
              label: d.label,
              unit: d.unit,
              value: Number(cur.value.toFixed(d.precision)),
              period: cur.periodLabel,
              previous: prev ? { value: Number(prev.value.toFixed(d.precision)), period: prev.periodLabel } : null,
              betterWhen: d.goodDirection,
              source: cur.source,
            };
          })
          .filter(Boolean);
        return { source: "metric_readings", metrics };
      },
    }),

    read_deadlines: tool({
      description:
        "Legal deadlines matched to this business (applies, might apply), soonest first, with the reason and official source.",
      inputSchema: z.object({}),
      execute: async () => {
        const all = await listObligations(ctx.workspaceId);
        const items = all
          .filter((o) => o.match !== "not" && o.status !== "complete")
          .slice(0, 8)
          .map((o) => ({
            id: o.id,
            framework: o.framework,
            title: o.title,
            dueDate: o.dueDate,
            status: o.status,
            match: o.match,
            reason: o.reason,
            sourceLabel: o.sourceLabel,
            sourceUrl: o.sourceUrl,
            underReview: o.underReview.length > 0,
          }));
        return { source: "obligations", items };
      },
    }),

    read_suppliers: tool({
      description:
        "The company's supplier list with contact, registry, sanctions and WikiRate check status. Use for supplier questions and outreach.",
      inputSchema: z.object({}),
      execute: async () => {
        const rows = await db
          .select()
          .from(cbamSuppliers)
          .where(eq(cbamSuppliers.workspaceId, ctx.workspaceId))
          .orderBy(asc(cbamSuppliers.supplierName))
          .limit(25);
        return {
          source: "suppliers",
          items: rows.map((s) => ({
            id: s.id,
            name: s.supplierName,
            hasEmail: Boolean(s.email),
            registryStatus: s.registryStatus,
            sanctionsStatus: s.sanctionsStatus,
            sanctionsCheckedOn: day(s.sanctionsCheckedAt),
            wikirate: Boolean(s.wikirateUrl),
          })),
        };
      },
    }),

    read_funding: tool({
      description:
        "Funding calls Grant scout rated a strong fit or one answer away for this business, with met and missing rules.",
      inputSchema: z.object({}),
      execute: async () => {
        const { calls, checkedAt } = await shownCalls(ctx.workspaceId);
        return {
          source: "grant_scout",
          checkedAt,
          items: calls.slice(0, 6).map((c) => ({
            id: c.id,
            title: c.title,
            url: c.url,
            program: c.program,
            deadline: c.deadline,
            verdict: c.verdict,
            missing: c.missing.map((m) => m.text).slice(0, 3),
          })),
        };
      },
    }),

    read_bills: tool({
      description: "Electricity (EAC) and water bills the company uploaded or forwarded, with totals and the emission factor used.",
      inputSchema: z.object({}),
      execute: async () => {
        const [eac, water] = await Promise.all([eacSummary(ctx.accountId), waterSummary(ctx.accountId)]);
        return {
          source: "utility_bills",
          electricity: {
            bills: eac.bills.map((b) => ({ periodStart: b.periodStart, periodEnd: b.periodEnd, kwh: b.kwh, kgCo2e: Math.round(b.kgCo2e) })),
            totalKwh: Math.round(eac.totalKwh),
            totalKgCo2e: Math.round(eac.totalKgCo2e),
            factor: eac.factor,
          },
          water: { bills: water.bills.length, totalM3: Math.round(water.totalM3), totalKgCo2e: Math.round(water.totalKgCo2e), factor: water.factor },
        };
      },
    }),

    read_activity: tool({
      description: "The latest changes in the workspace, by people and agents.",
      inputSchema: z.object({}),
      execute: async () => {
        const rows = await db
          .select()
          .from(activityEvents)
          .where(eq(activityEvents.workspaceId, ctx.workspaceId))
          .orderBy(desc(activityEvents.createdAt))
          .limit(10);
        return {
          source: "activity_events",
          items: rows.map((e) => ({ who: e.actorName, did: `${e.verb} ${e.object}`, on: day(e.createdAt) })),
        };
      },
    }),

    ask_for_facts: tool({
      description:
        "Ask the person for company facts that are missing and needed for the goal (for example revenue for a grant, imports for CBAM). Shows a small form; answers save to the company record. Use instead of guessing.",
      inputSchema: z.object({
        reason: z.string().describe("One sentence: why these facts are needed."),
        facts: z.array(z.enum(ASKABLE_FACTS)).describe("The facts to ask for, at most four."),
      }),
      execute: async ({ reason, facts }) => {
        const company = await readCompany(ctx.accountId, ctx.workspaceId).catch(() => null);
        const current = (company ?? {}) as Record<string, unknown>;
        const unique = [...new Set(facts)].slice(0, 4);
        return {
          reason: reason.slice(0, 240),
          facts: unique.map((f) => ({ key: f, current: current[f] ?? null })),
        };
      },
    }),

    propose_change: tool({
      description:
        "Propose one change for a person to approve. Never runs by itself. Kinds: create_task {agentKey|null,title,detail,severity high|normal|low,dueAt YYYY-MM-DD|null}; update_obligation {obligationId,status on_track|at_risk|late|complete,progressPct}; log_reading {metricKey,periodLabel,periodStart YYYY-MM-DD,value}; draft_report {agentKey|null,periodLabel,detail} (VSME report only); draft_document {documentType one of sustainability_policy|supplier_code|supplier_data_request|eudr_due_diligence|buyer_questionnaire|green_loan_memo|energy_plan|environmental_claims_review|other_sustainability, title, purpose, audience} for any other sustainability document (policy, letter, questionnaire answers, loan memo, plan); never for documents unrelated to sustainability, compliance or ESG; update_company {any of companyName,industry,teamSize 1-10|11-50|51-200|201-500|500+,website,country,sites,revenueEur}.",
      inputSchema: z.object({
        kind: z.enum(PROPOSAL_KINDS),
        title: z.string(),
        summary: z.string().describe("One sentence telling the approver exactly what will change."),
        payload: z.record(z.string(), z.unknown()),
      }),
      execute: async (input) => {
        const parsed = parseAction("```action\n" + JSON.stringify(input) + "\n```");
        if (!parsed) return { ok: false as const, message: "That change could not be read." };
        const [proposal] = await db
          .insert(copilotProposals)
          .values({
            workspaceId: ctx.workspaceId,
            messageId: null,
            kind: parsed.kind,
            title: parsed.title.slice(0, 200),
            summary: parsed.summary.slice(0, 500),
            payload: JSON.stringify(parsed.payload),
            status: "pending",
          })
          .returning();
        return { ok: true as const, proposalId: proposal.id, kind: parsed.kind, title: proposal.title, summary: proposal.summary };
      },
    }),

    prepare_document: tool({
      description:
        "Offer a finished document the person can download now. board_summary: one-page Board Summary PDF from the workspace records.",
      inputSchema: z.object({ kind: z.enum(["board_summary"]), note: z.string().describe("One sentence on what it contains.") }),
      execute: async ({ kind, note }) => ({ kind, note: note.slice(0, 240) }),
    }),
  };
}

export type VerdeTools = ReturnType<typeof verdeTools>;

/** Tool results go into the figure check, so quoted figures can come from them. */
export function toolOutputsText(parts: unknown[]): string {
  return parts
    .map((p) => {
      const part = p as { type?: string; output?: unknown };
      return part.type?.startsWith("tool-") && part.output ? JSON.stringify(part.output) : "";
    })
    .join("\n");
}

