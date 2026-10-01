/**
 * The account's bill forwarding address: open it (POST), get a new one
 * (POST {"rotate": true}) or close it (DELETE).
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { resolveConsoleSession } from "@/lib/console-session";
import { readJson } from "@/lib/validate";
import { closeBillInbox, openBillInbox } from "@/lib/integrations/bill-inbox.server";
import { logger } from "@/lib/log";

export const dynamic = "force-dynamic";
const log = logger("api.console.integrations.bill-inbox");

export async function POST(request: NextRequest) {
  const resolved = await resolveConsoleSession(await headers());
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error, message: resolved.message }, { status: resolved.status });
  }
  const body = await readJson(request, z.object({ rotate: z.boolean().default(false) }));
  if (!body.ok) return body.response;
  try {
    const r = await openBillInbox(resolved.session.account.id, resolved.session.workspace.id, body.data.rotate);
    if (!r) return NextResponse.json({ error: "not_configured", message: "Bill forwarding is not set up yet." }, { status: 503 });
    return NextResponse.json(r);
  } catch (error) {
    const ref = log.error("Open bill inbox failed", error);
    return NextResponse.json({ message: "The forwarding address could not be made.", ref }, { status: 500 });
  }
}

export async function DELETE() {
  const resolved = await resolveConsoleSession(await headers());
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error, message: resolved.message }, { status: resolved.status });
  }
  try {
    await closeBillInbox(resolved.session.account.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const ref = log.error("Close bill inbox failed", error);
    return NextResponse.json({ message: "The forwarding address could not be closed.", ref }, { status: 500 });
  }
}
