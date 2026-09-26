/** Kill switch for all agents in a workspace, plus the last jobs for oversight. */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { resolveConsoleSession } from "@/lib/console-session";
import { getControls, setPaused } from "@/lib/agents/orchestrator";

export const dynamic = "force-dynamic";

export async function GET() {
  const resolved = await resolveConsoleSession(await headers());
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error, message: resolved.message }, { status: resolved.status });
  }
  return NextResponse.json(await getControls(resolved.session.workspace.id));
}

export async function POST(req: Request) {
  const resolved = await resolveConsoleSession(await headers());
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error, message: resolved.message }, { status: resolved.status });
  }
  const { workspace, account } = resolved.session;
  let paused: unknown;
  let reason: unknown;
  try {
    ({ paused, reason } = (await req.json()) as { paused?: unknown; reason?: unknown });
  } catch {
    /* handled below */
  }
  if (typeof paused !== "boolean") {
    return NextResponse.json({ error: "bad_request", message: "Send paused: true or false." }, { status: 400 });
  }
  const note = typeof reason === "string" && reason.trim() ? reason.trim().slice(0, 300) : null;
  await setPaused(workspace.id, paused, note, account.name || account.email || account.id);
  return NextResponse.json(await getControls(workspace.id));
}
