/**
 * Forwarded utility e-bills. Called only by the worker's email handler
 * (Cloudflare Email Routing), which sends the raw message with the shared
 * INBOUND_EMAIL_SECRET and the envelope recipient. Answers with counts only,
 * never with bill contents.
 */

import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { readRawBody } from "@/lib/validate";
import { receiveBillEmail } from "@/lib/integrations/bill-inbox.server";
import { logger } from "@/lib/log";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
const log = logger("api.public.inbound.bill-email");
const MAX_EMAIL_BYTES = 15 * 1024 * 1024;

function authorized(req: NextRequest): boolean {
  const expected = process.env.INBOUND_EMAIL_SECRET?.trim();
  const given = (req.headers.get("x-inbound-secret") ?? "").trim();
  if (!expected || given.length !== expected.length) {
    // Lengths only — never the values — so a mismatch can be diagnosed.
    console.log(`[bill-email] auth mismatch: expected=${expected ? expected.length : "unset"} given=${given.length}`);
    return false;
  }
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const to = request.headers.get("x-envelope-to") ?? "";
  const body = await readRawBody(request, MAX_EMAIL_BYTES);
  if (!body.ok) return body.response;
  try {
    const r = await receiveBillEmail(body.bytes, to);
    if (r.status === 404) return NextResponse.json({ error: "unknown_address" }, { status: 404 });
    return NextResponse.json({
      read: r.results.length,
      added: r.results.filter((x) => x.ok && !x.duplicate).length,
      duplicates: r.results.filter((x) => x.duplicate).length,
      refused: r.results.filter((x) => !x.ok).length,
    });
  } catch (error) {
    const ref = log.error("Forwarded bill failed", error);
    return NextResponse.json({ message: "The message could not be processed.", ref }, { status: 500 });
  }
}
