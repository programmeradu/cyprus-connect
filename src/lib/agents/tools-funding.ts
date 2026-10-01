/**
 * Funding tools. check_funding_fit runs the fixed fit check and stores the
 * verdicts (risk 1, internal). read_funding_matches is read only. ask_company_fact
 * puts one grouped question in the review queue (risk 1, nothing leaves the app).
 */

import { z } from "zod";
import { and, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { agentTasks } from "@/db/schema";
import { refreshFundingMatches, shownCalls, factQuestion } from "@/lib/funding/funding.server";
import type { FactKey } from "@/lib/funding/rules";
import type { ToolDef } from "./tools";

function tool<I extends z.ZodType, O>(def: ToolDef<I, O>): ToolDef<I, O> {
  return def;
}

const FACTS = ["country", "employees", "revenue", "company_age", "sector"] as const;

export const checkFundingFit = tool({
  name: "check_funding_fit",
  risk: 1,
  description:
    "Check every open funding call (rules already read) against this company with fixed rules and store the verdicts. Returns counts and the missing company facts that would confirm calls.",
  input: z.object({}),
  run: async (ctx) => refreshFundingMatches(ctx.workspaceId),
});

export const readFundingMatches = tool({
  name: "read_funding_matches",
  risk: 0,
  description: "Funding calls this company strongly fits, and those one answer away, with the reasons and official links.",
  input: z.object({}),
  run: async (ctx) => {
    const { calls, checkedAt } = await shownCalls(ctx.workspaceId);
    return {
      checkedAt,
      calls: calls.slice(0, 20).map((c) => ({
        title: c.title,
        url: c.url,
        deadline: c.deadline,
        verdict: c.verdict,
        why: c.met.map((m) => m.text),
        missing: c.missing.map((m) => m.text),
      })),
    };
  },
});

export const askCompanyFact = tool({
  name: "ask_company_fact",
  risk: 1,
  description:
    "Ask the company for one missing fact that would confirm funding calls. One open question per fact; never asked again while open or once the fact is on file.",
  input: z.object({
    fact: z.enum(FACTS),
    opportunityIds: z.array(z.number().int()).min(1).max(50),
    titles: z.array(z.string().max(500)).max(50),
  }),
  run: async (ctx, input) => {
    const [open] = await db
      .select({ id: agentTasks.id })
      .from(agentTasks)
      .where(and(eq(agentTasks.workspaceId, ctx.workspaceId), eq(agentTasks.status, "open"), eq(agentTasks.pendingTool, `answer_fact:${input.fact}`)))
      .limit(1);
    // Respect a dismissal for 30 days.
    const [dismissed] = await db
      .select({ id: agentTasks.id })
      .from(agentTasks)
      .where(and(eq(agentTasks.workspaceId, ctx.workspaceId), eq(agentTasks.status, "rejected"), eq(agentTasks.pendingTool, `answer_fact:${input.fact}`), gte(agentTasks.createdAt, new Date(Date.now() - 30 * 86_400_000))))
      .limit(1);
    if (!open && dismissed) return { taskId: dismissed.id, created: false };
    const q = factQuestion(input.fact as FactKey, input.opportunityIds.length);
    const detail = `Calls: ${input.titles.slice(0, 5).join(" · ")}${input.titles.length > 5 ? ` and ${input.titles.length - 5} more` : ""}.`;
    const payload = JSON.stringify({ fact: input.fact, opportunityIds: input.opportunityIds });
    if (open) {
      await db.update(agentTasks).set({ title: q.en, detail, pendingInput: payload }).where(eq(agentTasks.id, open.id));
      return { taskId: open.id, created: false };
    }
    const [row] = await db
      .insert(agentTasks)
      .values({
        workspaceId: ctx.workspaceId,
        agentKey: ctx.agentKey,
        runId: ctx.runId,
        kind: "question",
        title: q.en,
        detail,
        severity: "normal",
        status: "open",
        pendingTool: `answer_fact:${input.fact}`,
        pendingInput: payload,
      })
      .returning({ id: agentTasks.id });
    return { taskId: row.id, created: true };
  },
});

export const FUNDING_TOOLS = {
  check_funding_fit: checkFundingFit,
  read_funding_matches: readFundingMatches,
  ask_company_fact: askCompanyFact,
} as const;
