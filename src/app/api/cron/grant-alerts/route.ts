import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/log";
import { runGrantAlerts } from "@/lib/grant-alerts/runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Called by the Cloudflare cron with the x-cron-secret header. With no
// CRON_SECRET configured the route refuses every caller.
function authorized(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  return (req.headers.get("x-cron-secret") || "") === expected;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const summary = await runGrantAlerts();
    // Grant scout's daily run checks companies against whatever rules are read here.
    const { extractPendingRules } = await import("@/lib/funding/extract.server");
    const rules = await extractPendingRules().catch((e) => ({ read: 0, failed: 0, stoppedBy: `error ${logger("cron.grant-alerts").error("rule reading failed", e)}` }));
    return NextResponse.json({ ok: true, ...summary, rules });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Scan failed.", ref: logger("cron.grant-alerts").error("scan failed", e) }, { status: 500 });
  }
}

export const POST = GET;
