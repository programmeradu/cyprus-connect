/**
 * Read-only views over the run and step ledgers for the console. Always
 * scoped to one workspace. Sample runs are included but flagged, never mixed
 * up with real work.
 */

import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { agentRuns, agentSteps, agents } from "@/db/schema";

export async function listRuns(workspaceId: string, opts: { agentKey?: string; limit?: number } = {}) {
  const limit = Math.max(1, Math.min(opts.limit ?? 30, 100));
  const where = opts.agentKey
    ? and(eq(agentRuns.workspaceId, workspaceId), eq(agentRuns.agentKey, opts.agentKey))
    : eq(agentRuns.workspaceId, workspaceId);
  const runs = await db.select().from(agentRuns).where(where).orderBy(desc(agentRuns.startedAt)).limit(limit);
  const ids = runs.map((r) => r.id);
  const counts = ids.length
    ? await db
        .select({
          runId: agentSteps.runId,
          total: sql<number>`count(*)::int`,
          waiting: sql<number>`count(*) filter (where ${agentSteps.decision} = 'queued_for_approval')::int`,
          blocked: sql<number>`count(*) filter (where ${agentSteps.decision} = 'blocked')::int`,
          failed: sql<number>`count(*) filter (where ${agentSteps.decision} = 'failed')::int`,
        })
        .from(agentSteps)
        .where(and(eq(agentSteps.workspaceId, workspaceId), inArray(agentSteps.runId, ids)))
        .groupBy(agentSteps.runId)
    : [];
  const byRun = new Map(counts.map((c) => [c.runId, c]));
  return runs.map((r) => ({
    id: r.id,
    agentKey: r.agentKey,
    status: r.status,
    trigger: r.trigger,
    summary: r.summary,
    startedAt: r.startedAt.toISOString(),
    finishedAt: r.finishedAt ? r.finishedAt.toISOString() : null,
    durationMs: r.durationMs,
    itemsProcessed: r.itemsProcessed,
    sample: r.trigger === "sample",
    steps: byRun.get(r.id) ?? { runId: r.id, total: 0, waiting: 0, blocked: 0, failed: 0 },
  }));
}

export async function getRunSteps(workspaceId: string, runId: number) {
  const [run] = await db
    .select()
    .from(agentRuns)
    .where(and(eq(agentRuns.workspaceId, workspaceId), eq(agentRuns.id, runId)))
    .limit(1);
  if (!run) return null;
  const steps = await db
    .select()
    .from(agentSteps)
    .where(and(eq(agentSteps.workspaceId, workspaceId), eq(agentSteps.runId, runId)))
    .orderBy(asc(agentSteps.seq), asc(agentSteps.id));
  return {
    runId,
    agentKey: run.agentKey,
    steps: steps.map((s) => ({
      id: s.id,
      seq: s.seq,
      tool: s.tool,
      riskLevel: s.riskLevel,
      decision: s.decision,
      inputHash: s.inputHash,
      input: s.input,
      output: s.output,
      createdAt: s.createdAt.toISOString(),
    })),
  };
}

export async function listRoster() {
  return db.select().from(agents).orderBy(asc(agents.sortOrder));
}
