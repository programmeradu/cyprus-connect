/**
 * Funding calls Vuneli has found, and the signed-in account's alert setting.
 * GET is public (the calls are public information); the subscription part is
 * only returned to a signed-in account. A signed-in POST always uses the
 * account's own email; the public site footer may POST an email to sign up.
 * DELETE only ever turns off the signed-in account's own alerts, so nobody can
 * unsubscribe someone else.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  deactivateSubscription,
  isSubscribed,
  recentMatches,
  upsertSubscription,
} from "@/lib/grant-alerts/store";
import { resolveConsoleSession } from "@/lib/console-session";
import { readJson } from "@/lib/validate";
import { logger } from "@/lib/log";

export const dynamic = "force-dynamic";
const log = logger("api.grant-alerts");

const SOURCES = ["eu-funding-tenders", "research-gov-cy", "invest-cyprus", "kebe-oeb", "accelerators"] as const;
const Body = z.object({ email: z.string().trim().toLowerCase().email().max(254).optional(), sources: z.array(z.enum(SOURCES)).max(SOURCES.length).optional() }).strict();

async function accountEmail(req: NextRequest): Promise<{ email: string } | { response: NextResponse }> {
  const s = await resolveConsoleSession(req.headers);
  if (!s.ok) return { response: NextResponse.json({ error: s.error, message: s.message }, { status: s.status }) };
  const email = s.session.account.email?.trim().toLowerCase();
  if (!email) {
    return { response: NextResponse.json({ error: "no_email", message: "Your account has no email address." }, { status: 400 }) };
  }
  return { email };
}

export async function POST(req: NextRequest) {
  const parsed = await readJson(req, Body);
  if (!parsed.ok) return parsed.response;
  const who = await accountEmail(req);
  const email = "email" in who ? who.email : parsed.data.email;
  if (!email) return "response" in who ? who.response : NextResponse.json({ error: "no_email" }, { status: 400 });
  try {
    await upsertSubscription(email, parsed.data.sources);
    return NextResponse.json({ ok: true, subscribed: email });
  } catch (e) {
    return NextResponse.json({ error: "Could not save your alert setting.", ref: log.error("subscribe failed", e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const who = await accountEmail(req);
  if ("response" in who) return who.response;
  try {
    await deactivateSubscription(who.email);
    return NextResponse.json({ ok: true, unsubscribed: who.email });
  } catch (e) {
    return NextResponse.json({ error: "Could not save your alert setting.", ref: log.error("unsubscribe failed", e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const matches = await recentMatches(30);
    const s = await resolveConsoleSession(req.headers).catch(() => null);
    const email = s?.ok ? s.session.account.email?.trim().toLowerCase() ?? null : null;
    const subscription = email ? { email, active: await isSubscribed(email) } : null;
    return NextResponse.json({ ok: true, matches, subscription });
  } catch (e) {
    return NextResponse.json({ error: "Funding calls are unavailable right now.", ref: log.error("list failed", e) }, { status: 500 });
  }
}
