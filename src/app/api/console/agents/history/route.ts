/**
 * Agent roster, runs and the step-by-step ledger for one run.
 * GET ?agent=<key>        runs for one agent (or all when omitted)
 * GET ?run=<id>           every step of one run, in order
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { resolveConsoleSession } from "@/lib/console-session";
import { getRunSteps, listRoster, listRuns } from "@/lib/agents/history";
import { getControls } from "@/lib/agents/orchestrator";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const resolved = await resolveConsoleSession(await headers());
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error, message: resolved.message }, { status: resolved.status });
  }
  const workspaceId = resolved.session.workspace.id;
  const url = new URL(req.url);

  const runParam = url.searchParams.get("run");
  if (runParam !== null) {
    const runId = Number(runParam);
    if (!Number.isInteger(runId) || runId <= 0) {
      return NextResponse.json({ error: "bad_request", message: "Run id must be a positive whole number." }, { status: 400 });
    }
    const detail = await getRunSteps(workspaceId, runId);
    if (!detail) return NextResponse.json({ error: "not_found", message: "That run is not in this workspace." }, { status: 404 });
    return NextResponse.json(detail);
  }

  const agentParam = url.searchParams.get("agent");
  const agentKey = agentParam && /^[a-z0-9_-]{1,40}$/.test(agentParam) ? agentParam : undefined;
  const [roster, runs, controls] = await Promise.all([
    listRoster(),
    listRuns(workspaceId, { agentKey, limit: 40 }),
    getControls(workspaceId),
  ]);
  return NextResponse.json({
    roster: roster.map((a) => ({ key: a.key, name: a.name, role: a.role, mission: a.mission, cadence: a.cadence, glyph: a.glyph })),
    runs,
    controls: {
      paused: controls.paused,
      pauseReason: controls.pauseReason,
      agentPaused: controls.agentPaused,
      runnable: controls.runnable,
      maxStepsPerRun: controls.maxStepsPerRun,
    },
  });
}
