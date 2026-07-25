import { NextRequest, NextResponse } from "next/server";
import { runGrantAlerts } from "@/lib/grant-alerts/runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Shared secret gate. The GitHub Actions cron passes ?secret=... or the
// x-cron-secret header. Defaults to the same VerdeIQ admin secret used by
// the migration route for parity.
const DEFAULT_SECRET = "verdeiq-cron-grant-alerts-2026-cy";

function authorized(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET || DEFAULT_SECRET;
  const provided =
    req.nextUrl.searchParams.get("secret") ||
    req.headers.get("x-cron-secret") ||
    "";
  return provided === expected;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const summary = await runGrantAlerts();
    return NextResponse.json({ ok: true, ...summary });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 },
    );
  }
}

export const POST = GET;
