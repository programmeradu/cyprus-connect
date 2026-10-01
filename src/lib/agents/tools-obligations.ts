/**
 * Deadline tools. check_deadlines runs the fixed rulebook against the company
 * (risk 1, internal). read_deadlines is read only. ask_deadline_fact puts one
 * yes/no question in the review queue (risk 1, nothing leaves the app).
 */

import { z } from "zod";
import { and, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { agentTasks } from "@/db/schema";
import { DEADLINE_FACT_QUESTION, DEADLINE_QUESTION_FACTS, listObligations, refreshObligations } from "@/lib/obligations/obligations.server";
import type { ToolDef } from "./tools";

function tool<I extends z.ZodType, O>(def: ToolDef<I, O>): ToolDef<I, O> {
  return def;
}

export const checkDeadlines = tool({
  name: "check_deadlines",
  risk: 1,
  description: "Check which EU and Cyprus legal deadlines apply to this company with the fixed rulebook and store the results with reasons and official sources.",
  input: z.object({}),
  run: async (ctx) => refreshObligations(ctx.workspaceId),
});

export const readDeadlines = tool({
  name: "read_deadlines",
  risk: 0,
  description: "Legal deadlines for this company: which apply, which might, and which don't, each with the reason, date and official source.",
  input: z.object({}),
  run: async (ctx) => {
    const rows = await listObligations(ctx.workspaceId);
    return {
      deadlines: rows.map((o) => ({
        title: o.title,
        due: o.dueDate || null,
        match: o.match ?? "added_by_person",
        why: o.reason,
        source: o.sourceUrl,
        underReview: o.underReview.length > 0,
      })),
    };
  },
});

export const askDeadlineFact = tool({
  name: "ask_deadline_fact",
  risk: 1,
  description: "Ask the company one yes/no fact that decides whether legal deadlines apply. One open question per fact; dismissals are respected for 30 days.",
  input: z.object({
    fact: z.enum(DEADLINE_QUESTION_FACTS),
    ruleIds: z.array(z.string().max(60)).min(1).max(20),
    titles: z.array(z.string().max(200)).max(20),
  }),
  run: async (ctx, input) => {
    const key = `answer_fact:${input.fact}`;
    const [open] = await db
      .select({ id: agentTasks.id })
      .from(agentTasks)
      .where(and(eq(agentTasks.workspaceId, ctx.workspaceId), eq(agentTasks.status, "open"), eq(agentTasks.pendingTool, key)))
      .limit(1);
    if (open) return { taskId: open.id, created: false };
    const [dismissed] = await db
      .select({ id: agentTasks.id })
      .from(agentTasks)
      .where(and(eq(agentTasks.workspaceId, ctx.workspaceId), eq(agentTasks.status, "rejected"), eq(agentTasks.pendingTool, key), gte(agentTasks.createdAt, new Date(Date.now() - 30 * 86_400_000))))
      .limit(1);
    if (dismissed) return { taskId: dismissed.id, created: false };
    const [row] = await db
      .insert(agentTasks)
      .values({
        workspaceId: ctx.workspaceId,
        agentKey: ctx.agentKey,
        runId: ctx.runId,
        kind: "question",
        title: DEADLINE_FACT_QUESTION[input.fact],
        detail: `Decides: ${input.titles.join(" · ")}.`,
        severity: "normal",
        status: "open",
        pendingTool: key,
        pendingInput: JSON.stringify({ fact: input.fact, ruleIds: input.ruleIds }),
      })
      .returning({ id: agentTasks.id });
    return { taskId: row.id, created: true };
  },
});

export const OBLIGATION_TOOLS = {
  check_deadlines: checkDeadlines,
  read_deadlines: readDeadlines,
  ask_deadline_fact: askDeadlineFact,
} as const;
