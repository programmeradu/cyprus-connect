import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { resolveConsoleSession } from "@/lib/console-session";
import { syncSaltEdgeConnection } from "@/lib/bank/saltedge.server";
import { logger } from "@/lib/log";

export const dynamic = "force-dynamic";
const log = logger("api.console.integrations.saltedge.sync");

export async function POST() {
  const resolved = await resolveConsoleSession(await headers());
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error, message: resolved.message }, { status: resolved.status });
  }

  const { workspace } = resolved.session;

  try {
    const result = await syncSaltEdgeConnection(workspace.id);
    return NextResponse.json(result);
  } catch (error) {
    const ref = log.error("Salt Edge manual sync failed", error);
    return NextResponse.json(
      { message: "Unable to sync bank connections. Please try again later.", ref },
      { status: 502 },
    );
  }
}
