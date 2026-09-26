/**
 * Agent heartbeat. Called by the Cloudflare cron every 15 minutes.
 * Enqueues today's scheduled work (idempotent) and runs a bounded batch.
 */

import { NextRequest, NextResponse } from "next/server";
import { scheduleDue, tick } from "@/lib/agents/orchestrator";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const provided = req.nextUrl.searchParams.get("secret") || req.headers.get("x-cron-secret") || "";
  return provided === expected;
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const enqueued = await scheduleDue();
    const reports = await tick({ maxJobs: 10 });
    return NextResponse.json({ ok: true, enqueued, ran: reports.length, reports });
  } catch (e) {
    console.error("agent heartbeat failed", e);
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

export const GET = POST;
