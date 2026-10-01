/**
 * Start a real agent run now, from the console. Runs synchronously and returns the result.
 * Planning agents (Weaver, Compass) also take an optional goal in plain words;
 * they then pick which sources to combine for it.
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { resolveConsoleSession } from "@/lib/console-session";
import { recordActivity } from "@/lib/activity.server";
import { enqueue, isPlanner, isRunnable, tick } from "@/lib/agents/orchestrator";
import { sha256Hex } from "@/lib/agents/hash";
import { hasLovableAi } from "@/lib/lovable-ai";
import { readJson } from "@/lib/validate";
import { logger } from "@/lib/log";

export const dynamic = "force-dynamic";
export const maxDuration = 120;
const log = logger("api.console.agents.run");

const Body = z
  .object({
    agentKey: z.string().min(1).max(40),
    goal: z.string().trim().min(8, "Describe the goal in a sentence.").max(1000).nullable().optional(),
  })
  .strict();

export async function POST(req: Request) {
  const resolved = await resolveConsoleSession(await headers());
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error, message: resolved.message }, { status: resolved.status });
  }
  const { workspace, account } = resolved.session;
  const parsed = await readJson(req, Body);
  if (!parsed.ok) return parsed.response;
  const { agentKey } = parsed.data;
  const goal = parsed.data.goal || null;

  if (!isRunnable(agentKey)) {
    return NextResponse.json({ error: "not_runnable", message: "This agent has no real work behind it yet." }, { status: 400 });
  }
  if (goal && !isPlanner(agentKey)) {
    return NextResponse.json({ error: "no_goals", message: "This agent follows a fixed routine and does not take goals." }, { status: 400 });
  }
  if (isPlanner(agentKey) && !hasLovableAi()) {
    return NextResponse.json({ error: "ai_off", message: "This agent needs AI, which is not configured on this deployment." }, { status: 503 });
  }

  // One manual start per agent (and goal) per minute; a double click reuses the same job.
  const minute = new Date().toISOString().slice(0, 16);
  const goalKey = goal ? `:${(await sha256Hex(goal)).slice(0, 16)}` : "";
  const { jobId } = await enqueue({
    workspaceId: workspace.id,
    agentKey,
    trigger: "manual",
    idempotencyKey: `manual:${agentKey}:${workspace.id}:${minute}${goalKey}`,
    requestedBy: account.name || account.email || account.id,
    goal,
  });
  await recordActivity(resolved.session, "started agent run", agentKey, goal ? `Goal: ${goal}` : null);
  if (!jobId) return NextResponse.json({ error: "enqueue_failed", message: "Could not queue the run." }, { status: 500 });

  let report;
  try {
    [report] = await tick({ maxJobs: 1, onlyJobId: jobId });
  } catch (error) {
    const ref = log.error("manual agent run failed", error);
    return NextResponse.json({ error: "run_failed", message: "The run could not start. It stays queued and the heartbeat will retry it.", ref }, { status: 500 });
  }
  if (!report) {
    return NextResponse.json({ status: "already_handled", message: "This agent already ran in the last minute. Your review queue is up to date." });
  }
  const code = report.status === "succeeded" || report.status === "skipped" ? 200 : 500;
  return NextResponse.json(report, { status: code });
}
