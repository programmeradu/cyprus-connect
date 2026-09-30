/**
 * Starts a read-only Bank of Cyprus link: creates the bank subscription,
 * remembers it as pending, and returns the bank sign-in address.
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { resolveConsoleSession } from "@/lib/console-session";
import { db } from "@/db";
import { bankLinks } from "@/db/schema";
import { bocConfig, createSubscription, authorizeUrl } from "@/lib/bank/boc.server";
import { bankRedirectUri, BANK_STATE_COOKIE } from "@/lib/bank/redirect";
import { logger } from "@/lib/log";

export const dynamic = "force-dynamic";
const log = logger("api.console.bank.connect");

export async function POST(request: NextRequest) {
  const resolved = await resolveConsoleSession(await headers());
  if (!resolved.ok) return NextResponse.json({ error: resolved.error, message: resolved.message }, { status: resolved.status });
  const cfg = bocConfig();
  if (!cfg) {
    return NextResponse.json({ error: "not_configured", message: "Bank of Cyprus linking is not set up yet." }, { status: 503 });
  }
  const { account, workspace } = resolved.session;
  try {
    const { subscriptionId, endDate } = await createSubscription(cfg);
    const id = `bank_${crypto.randomUUID()}`;
    await db.insert(bankLinks).values({
      id,
      workspaceId: workspace.id,
      provider: "boc",
      environment: cfg.environment,
      subscriptionId,
      status: "pending",
      consentExpiresOn: endDate,
      createdBy: account.id,
    });
    const state = crypto.randomUUID();
    const res = NextResponse.json({ authUrl: authorizeUrl(cfg, subscriptionId, bankRedirectUri(request)) });
    res.cookies.set(BANK_STATE_COOKIE, `${state}.${id}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/console/bank",
      maxAge: 15 * 60,
    });
    return res;
  } catch (error) {
    const ref = log.error("connect failed", error);
    return NextResponse.json({ message: "The bank did not accept the link request. Please try again.", ref }, { status: 502 });
  }
}
