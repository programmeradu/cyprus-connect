import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/log";
import { refreshSanctionsList } from "@/lib/integrations/sanctions.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Called on the hourly Cloudflare tick with x-cron-secret; downloads at most once every 20 hours.
function authorized(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET?.trim();
  const provided = (req.nextUrl.searchParams.get("secret") || req.headers.get("x-cron-secret") || "").trim();
  return !!expected && provided === expected;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ ok: true, ...(await refreshSanctionsList()) });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Refresh failed.", ref: logger("cron.sanctions-list").error("refresh failed", e) }, { status: 500 });
  }
}

export const POST = GET;
