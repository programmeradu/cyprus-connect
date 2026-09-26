/** Start a real agent run now, from the console. Runs synchronously and returns the result. */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { resolveConsoleSession } from "@/lib/console-session";
import { enqueue, isRunnable, tick } from "@/lib/agents/orchestrator";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const resolved = await resolveConsoleSession(await headers());
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error, message: resolved.message }, { status: resolved.status });
  }
  const { workspace, account } = resolved.session;

  let agentKey = "";
  try {
    const body = (await req.json()) as { agentKey?: unknown };
    agentKey = typeof body.agentKey === "string" ? body.agentKey : "";
  } catch {
    /* handled below */
  }
  if (!isRunnable(agentKey)) {
    return NextResponse.json(
      { error: "not_runnable", message: "This agent has no real work behind it yet." },
      { status: 400 },
    );
  }

  // One manual start per agent per minute; a double click reuses the same job.
  const minute = new Date().toISOString().slice(0, 16);
  const { jobId } = await enqueue({
    workspaceId: workspace.id,
    agentKey,
    trigger: "manual",
    idempotencyKey: `manual:${agentKey}:${workspace.id}:${minute}`,
    requestedBy: account.name || account.email || account.id,
  });
  if (!jobId) return NextResponse.json({ error: "enqueue_failed", message: "Could not queue the run." }, { status: 500 });

  let report;
  try {
    [report] = await tick({ maxJobs: 1, onlyJobId: jobId });
  } catch (error) {
    console.error("manual agent run failed", error);
    return NextResponse.json({ error: "run_failed", message: "The run could not start. It stays queued and the heartbeat will retry it." }, { status: 500 });
  }
  if (!report) {
    return NextResponse.json({ status: "already_handled", message: "This agent already ran in the last minute. Your review queue is up to date." });
  }
  const code = report.status === "succeeded" || report.status === "skipped" ? 200 : 500;
  return NextResponse.json(report, { status: code });
}
