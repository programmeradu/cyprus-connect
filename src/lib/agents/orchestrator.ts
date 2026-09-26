/**
 * The orchestrator. A durable job queue in Postgres, driven by the Cloudflare
 * cron and by manual starts from the console.
 *
 * Guarantees:
 * - Idempotent enqueue (unique idempotency key per job).
 * - Single-flight claim: FOR UPDATE SKIP LOCKED plus a lease, so two ticks
 *   never run the same job. A crashed run's lease expires and it is retried.
 * - Bounded work: a tick runs at most `maxJobs` jobs; a run at most N steps.
 * - Kill switch and daily budget per workspace, checked before every job.
 * - Retries with backoff, then "dead" with the error kept for a person.
 */

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  activityEvents,
  agentControls,
  agentJobs,
  agentRuns,
  agents,
  autonomyPolicies,
  workspaces,
} from "@/db/schema";
import { isPolicyMode, retryDelayMs, type PolicyMode, type RiskLevel } from "./policy";
import { AgentRuntime } from "./runtime";
import { runEvidenceSweep } from "./evidence-sweep";

const LEASE_MS = 5 * 60_000;

export interface AgentOutcome {
  summary: string;
  itemsProcessed: number;
  confidence: number;
}
type AgentHandler = (rt: AgentRuntime) => Promise<AgentOutcome>;

/** Agents with real work behind them. Others in the registry are not runnable yet. */
export const RUNNABLE_AGENTS: Record<string, { handler: AgentHandler; cadence: "daily" }> = {
  ingest: { handler: (rt) => runEvidenceSweep(rt), cadence: "daily" },
};

export function isRunnable(agentKey: string): boolean {
  return agentKey in RUNNABLE_AGENTS;
}

export async function enqueue(input: {
  workspaceId: string;
  agentKey: string;
  trigger: "cron" | "manual" | "event";
  idempotencyKey: string;
  requestedBy?: string | null;
}): Promise<{ jobId: number | null; created: boolean }> {
  const rows = await db
    .insert(agentJobs)
    .values({
      workspaceId: input.workspaceId,
      agentKey: input.agentKey,
      trigger: input.trigger,
      idempotencyKey: input.idempotencyKey,
      requestedBy: input.requestedBy ?? null,
    })
    .onConflictDoNothing({ target: agentJobs.idempotencyKey })
    .returning({ id: agentJobs.id });
  if (rows[0]) return { jobId: rows[0].id, created: true };
  const [existing] = await db
    .select({ id: agentJobs.id })
    .from(agentJobs)
    .where(eq(agentJobs.idempotencyKey, input.idempotencyKey))
    .limit(1);
  return { jobId: existing?.id ?? null, created: false };
}

/** Enqueue today's scheduled work for every workspace. Safe to call many times a day. */
export async function scheduleDue(now = new Date()): Promise<number> {
  const day = now.toISOString().slice(0, 10);
  const all = await db.select({ id: workspaces.id }).from(workspaces);
  let created = 0;
  for (const ws of all) {
    for (const agentKey of Object.keys(RUNNABLE_AGENTS)) {
      const r = await enqueue({
        workspaceId: ws.id,
        agentKey,
        trigger: "cron",
        idempotencyKey: `${agentKey}:${ws.id}:${day}`,
      });
      if (r.created) created += 1;
    }
  }
  return created;
}

async function claim(limit: number, onlyJobId?: number) {
  const leaseUntil = new Date(Date.now() + LEASE_MS);
  const filter = onlyJobId ? sql`and id = ${onlyJobId}` : sql``;
  const rows = await db.execute(sql`
    update agent_jobs set status = 'running', attempts = attempts + 1, lease_until = ${leaseUntil}
    where id in (
      select id from agent_jobs
      where ((status = 'queued' and run_after <= now())
          or (status = 'running' and lease_until < now()))
        ${filter}
      order by run_after
      limit ${limit}
      for update skip locked
    )
    returning id, workspace_id, agent_key, trigger, attempts, max_attempts
  `);
  return (rows as unknown as Array<{
    id: number;
    workspace_id: string;
    agent_key: string;
    trigger: string;
    attempts: number;
    max_attempts: number;
  }>);
}

async function loadControls(workspaceId: string) {
  const [row] = await db
    .select()
    .from(agentControls)
    .where(eq(agentControls.workspaceId, workspaceId))
    .limit(1);
  return row ?? { paused: false, pauseReason: null, maxStepsPerRun: 25 };
}

async function loadPolicies(workspaceId: string) {
  const rows = await db
    .select()
    .from(autonomyPolicies)
    .where(eq(autonomyPolicies.workspaceId, workspaceId));
  const map: Partial<Record<RiskLevel, PolicyMode>> = {};
  for (const r of rows) {
    if ([0, 1, 2, 3].includes(r.riskLevel) && isPolicyMode(r.mode)) {
      map[r.riskLevel as RiskLevel] = r.mode;
    }
  }
  return map;
}

async function finishJob(id: number, patch: Partial<typeof agentJobs.$inferInsert>) {
  await db
    .update(agentJobs)
    .set({ leaseUntil: null, ...patch })
    .where(eq(agentJobs.id, id));
}

export interface JobReport {
  jobId: number;
  agentKey: string;
  workspaceId: string;
  status: string;
  runId: number | null;
  summary: string;
}

async function runJob(job: Awaited<ReturnType<typeof claim>>[number]): Promise<JobReport> {
  const base = { jobId: job.id, agentKey: job.agent_key, workspaceId: job.workspace_id };
  const spec = RUNNABLE_AGENTS[job.agent_key];
  if (!spec) {
    await finishJob(job.id, { status: "dead", error: "No handler for this agent.", finishedAt: new Date() });
    return { ...base, status: "dead", runId: null, summary: "No handler for this agent." };
  }

  const controls = await loadControls(job.workspace_id);
  if (controls.paused) {
    const reason = `Skipped: agents are paused${controls.pauseReason ? ` (${controls.pauseReason})` : ""}.`;
    await finishJob(job.id, { status: "skipped", error: reason, finishedAt: new Date() });
    return { ...base, status: "skipped", runId: null, summary: reason };
  }

  const policies = await loadPolicies(job.workspace_id);
  const started = Date.now();
  const [run] = await db
    .insert(agentRuns)
    .values({
      workspaceId: job.workspace_id,
      agentKey: job.agent_key,
      status: "running",
      summary: "Running.",
      trigger: job.trigger,
      jobId: job.id,
    })
    .returning({ id: agentRuns.id });

  const rt = new AgentRuntime(
    { workspaceId: job.workspace_id, agentKey: job.agent_key, runId: run.id },
    policies,
    controls.maxStepsPerRun,
  );
  const [agentRow] = await db.select().from(agents).where(eq(agents.key, job.agent_key)).limit(1);
  const actorName = agentRow?.name ?? job.agent_key;

  try {
    const outcome = await spec.handler(rt);
    await db
      .update(agentRuns)
      .set({
        status: "succeeded",
        summary: outcome.summary,
        itemsProcessed: outcome.itemsProcessed,
        confidence: outcome.confidence,
        finishedAt: new Date(),
        durationMs: Date.now() - started,
      })
      .where(eq(agentRuns.id, run.id));
    await finishJob(job.id, { status: "succeeded", runId: run.id, error: null, finishedAt: new Date() });
    await db.insert(activityEvents).values({
      workspaceId: job.workspace_id,
      actorType: "agent",
      actorName,
      verb: "completed a run",
      object: `Run #${run.id}`,
      detail: outcome.summary,
    });
    return { ...base, status: "succeeded", runId: run.id, summary: outcome.summary };
  } catch (error) {
    const message = error instanceof Error ? error.message : "The run failed.";
    const exhausted = job.attempts >= job.max_attempts;
    await db
      .update(agentRuns)
      .set({ status: "failed", summary: message, finishedAt: new Date(), durationMs: Date.now() - started })
      .where(eq(agentRuns.id, run.id));
    await finishJob(
      job.id,
      exhausted
        ? { status: "dead", runId: run.id, error: message, finishedAt: new Date() }
        : { status: "queued", runId: run.id, error: message, runAfter: new Date(Date.now() + retryDelayMs(job.attempts)) },
    );
    await db.insert(activityEvents).values({
      workspaceId: job.workspace_id,
      actorType: "agent",
      actorName,
      verb: exhausted ? "gave up on a run" : "failed a run, will retry",
      object: `Run #${run.id}`,
      detail: message,
    });
    return { ...base, status: exhausted ? "dead" : "retrying", runId: run.id, summary: message };
  }
}

/** Claim and run up to `maxJobs` due jobs, one after another. */
export async function tick(options: { maxJobs?: number; onlyJobId?: number } = {}): Promise<JobReport[]> {
  const jobs = await claim(Math.max(1, Math.min(options.maxJobs ?? 5, 20)), options.onlyJobId);
  const reports: JobReport[] = [];
  for (const job of jobs) reports.push(await runJob(job));
  return reports;
}

export async function setPaused(workspaceId: string, paused: boolean, reason: string | null, by: string) {
  await db
    .insert(agentControls)
    .values({ workspaceId, paused, pauseReason: reason, updatedBy: by, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: agentControls.workspaceId,
      set: { paused, pauseReason: reason, updatedBy: by, updatedAt: new Date() },
    });
  await db.insert(activityEvents).values({
    workspaceId,
    actorType: "human",
    actorName: by,
    verb: paused ? "paused all agents" : "resumed all agents",
    object: "Agent controls",
    detail: reason,
  });
}

export async function getControls(workspaceId: string) {
  const c = await loadControls(workspaceId);
  const recent = await db
    .select()
    .from(agentJobs)
    .where(and(eq(agentJobs.workspaceId, workspaceId)))
    .orderBy(sql`id desc`)
    .limit(10);
  return { paused: c.paused, pauseReason: c.pauseReason, maxStepsPerRun: c.maxStepsPerRun, recentJobs: recent };
}
