import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/log";
import { refreshEuFeeds } from "@/lib/integrations/eu-feeds.server";
import { checkLawChanges } from "@/lib/obligations/law-watch.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Hourly from the Cloudflare cron with x-cron-secret. Without CRON_SECRET every caller is refused.
function authorized(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  return !!expected && (req.headers.get("x-cron-secret") || "") === expected;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ ok: true, ...(await refreshEuFeeds()), lawWatch: await checkLawChanges() });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Refresh failed.", ref: logger("cron.eu-feeds").error("refresh failed", e) }, { status: 500 });
  }
}

export const POST = GET;
