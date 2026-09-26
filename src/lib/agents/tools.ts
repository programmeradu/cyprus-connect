/**
 * The tool contract. An agent can only act through these tools. Each tool has
 * a typed input and a fixed risk level; the runtime checks both before it runs.
 * Agents never touch the database or outside systems directly.
 */

import { z } from "zod";
import { and, asc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import {
  agentTasks,
  metricDefinitions,
  metricReadings,
  obligations,
  workspaceFacts,
} from "@/db/schema";
import type { RiskLevel } from "./policy";

export interface ToolContext {
  workspaceId: string;
  agentKey: string;
  runId: number;
}

export interface ToolDef<I extends z.ZodType = z.ZodType, O = unknown> {
  name: string;
  risk: RiskLevel;
  description: string;
  input: I;
  run: (ctx: ToolContext, input: z.infer<I>) => Promise<O>;
}

function tool<I extends z.ZodType, O>(def: ToolDef<I, O>): ToolDef<I, O> {
  return def;
}

export const readMetrics = tool({
  name: "read_metrics",
  risk: 0,
  description: "Latest reading date and value for every metric in the workspace.",
  input: z.object({}),
  run: async (ctx) => {
    const [defs, readings] = await Promise.all([
      db.select().from(metricDefinitions).orderBy(asc(metricDefinitions.sortOrder)),
      db
        .select()
        .from(metricReadings)
        .where(eq(metricReadings.workspaceId, ctx.workspaceId))
        .orderBy(asc(metricReadings.periodStart)),
    ]);
    const latest = new Map<string, { periodStart: string; value: number; count: number }>();
    for (const r of readings) {
      const prev = latest.get(r.metricKey);
      latest.set(r.metricKey, {
        periodStart: r.periodStart,
        value: r.value,
        count: (prev?.count ?? 0) + 1,
      });
    }
    return defs.map((d) => ({
      key: d.key,
      label: d.label,
      unit: d.unit,
      latestPeriod: latest.get(d.key)?.periodStart ?? null,
      readings: latest.get(d.key)?.count ?? 0,
    }));
  },
});

export const readObligations = tool({
  name: "read_obligations",
  risk: 0,
  description: "Open obligations with due date, status and progress.",
  input: z.object({}),
  run: async (ctx) => {
    const rows = await db
      .select()
      .from(obligations)
      .where(eq(obligations.workspaceId, ctx.workspaceId))
      .orderBy(asc(obligations.dueDate));
    return rows
      .filter((o) => o.status !== "complete")
      .map((o) => ({
        id: o.id,
        title: o.title,
        framework: o.framework,
        dueDate: o.dueDate,
        status: o.status,
        progressPct: o.progressPct,
      }));
  },
});

export const createTask = tool({
  name: "create_task",
  risk: 1,
  description:
    "Put a task in the review queue. Skips it when an open task with the same title exists.",
  input: z.object({
    title: z.string().min(3).max(200),
    detail: z.string().max(2000).nullable(),
    severity: z.enum(["high", "normal", "low"]),
    kind: z.enum(["evidence", "approval", "review"]),
    dueAt: z.string().nullable(),
  }),
  run: async (ctx, input) => {
    const [existing] = await db
      .select({ id: agentTasks.id })
      .from(agentTasks)
      .where(
        and(
          eq(agentTasks.workspaceId, ctx.workspaceId),
          eq(agentTasks.status, "open"),
          eq(agentTasks.title, input.title),
        ),
      )
      .limit(1);
    if (existing) return { taskId: existing.id, created: false };
    const [row] = await db
      .insert(agentTasks)
      .values({
        workspaceId: ctx.workspaceId,
        agentKey: ctx.agentKey,
        kind: input.kind,
        title: input.title,
        detail: input.detail,
        severity: input.severity,
        status: "open",
        dueAt: input.dueAt,
      })
      .returning({ id: agentTasks.id });
    return { taskId: row.id, created: true };
  },
});

export const recordFact = tool({
  name: "record_fact",
  risk: 1,
  description:
    "Store a fact other agents can use. Closes the previous value of the same key.",
  input: z.object({
    key: z.string().min(1).max(120),
    value: z.string().max(2000),
    unit: z.string().max(40).nullable(),
    sourceKind: z.enum(["derived", "document", "connector", "human"]),
    sourceHash: z.string().min(8).max(128),
  }),
  run: async (ctx, input) => {
    const now = new Date();
    await db
      .update(workspaceFacts)
      .set({ validTo: now })
      .where(
        and(
          eq(workspaceFacts.workspaceId, ctx.workspaceId),
          eq(workspaceFacts.key, input.key),
          gte(workspaceFacts.validFrom, new Date(0)),
        ),
      );
    const [row] = await db
      .insert(workspaceFacts)
      .values({
        workspaceId: ctx.workspaceId,
        key: input.key,
        value: input.value,
        unit: input.unit,
        sourceKind: input.sourceKind,
        sourceHash: input.sourceHash,
        agentKey: ctx.agentKey,
        runId: ctx.runId,
        validFrom: now,
      })
      .returning({ id: workspaceFacts.id });
    return { factId: row.id };
  },
});

export const TOOLS = {
  read_metrics: readMetrics,
  read_obligations: readObligations,
  create_task: createTask,
  record_fact: recordFact,
} as const;

export type ToolName = keyof typeof TOOLS;
