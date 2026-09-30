/**
 * The customer returns from Bank of Cyprus. Checks the round trip belongs to
 * this signed-in workspace, activates the read-only subscription, reads the
 * first statements, and goes back to Integrations with the outcome.
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, eq, ne } from "drizzle-orm";
import { resolveConsoleSession } from "@/lib/console-session";
import { db } from "@/db";
import { bankLinks } from "@/db/schema";
import { bocConfig, activateSubscription } from "@/lib/bank/boc.server";
import { BANK_STATE_COOKIE } from "@/lib/bank/redirect";
import { logBankEvent, syncLink } from "@/lib/bank/bank.server";
import { logger } from "@/lib/log";

export const dynamic = "force-dynamic";
const log = logger("api.console.bank.callback");

function back(request: NextRequest, outcome: string) {
  const res = NextResponse.redirect(new URL(`/app/integrations?bank=${outcome}`, request.url));
  res.cookies.set(BANK_STATE_COOKIE, "", { path: "/api/console/bank", maxAge: 0 });
  return res;
}

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  if (p.get("error")) return back(request, "declined");
  const code = p.get("code");
  if (!code || code.length > 512) return back(request, "missing_code");

  // The bank does not echo a state value, so the link id and a one-time value
  // ride in a short-lived, http-only cookie set when this browser started.
  const cookie = request.cookies.get(BANK_STATE_COOKIE)?.value ?? "";
  const linkId = cookie.split(".")[1];
  if (!linkId) return back(request, "expired_request");

  const resolved = await resolveConsoleSession(await headers());
  if (!resolved.ok) return back(request, "signed_out");
  const { account, workspace } = resolved.session;
  const cfg = bocConfig();
  if (!cfg) return back(request, "not_configured");

  const [link] = await db
    .select()
    .from(bankLinks)
    .where(and(eq(bankLinks.id, linkId), eq(bankLinks.workspaceId, workspace.id), eq(bankLinks.status, "pending")))
    .limit(1);
  if (!link) return back(request, "expired_request");

  let activated;
  try {
    activated = await activateSubscription(cfg, link.subscriptionId, code);
  } catch (error) {
    log.error("activation failed", error);
    return back(request, "activation_failed");
  }
  if (activated.accountIds.length === 0) return back(request, "no_accounts");

  // One live link per workspace: the new one replaces any earlier link.
  const active = { ...link, status: "active", accountIds: activated.accountIds, consentExpiresOn: activated.endDate ?? link.consentExpiresOn };
  await db.transaction(async (tx) => {
    await tx
      .update(bankLinks)
      .set({ status: "revoked" })
      .where(and(eq(bankLinks.workspaceId, workspace.id), eq(bankLinks.provider, "boc"), ne(bankLinks.id, link.id), ne(bankLinks.status, "revoked")));
    await tx
      .update(bankLinks)
      .set({ status: "active", accountIds: active.accountIds, consentExpiresOn: active.consentExpiresOn })
      .where(eq(bankLinks.id, link.id));
  });
  const who = account.name || account.email || "Workspace member";
  await logBankEvent(workspace.id, who, "linked", `${activated.accountIds.length} account(s), read-only`);

  try {
    const r = await syncLink(active);
    await logBankEvent(workspace.id, who, "read", `${r.read} payment(s) from the last 90 days`);
    return back(request, "connected");
  } catch (error) {
    log.error("first read failed", error);
    return back(request, "connected_unread");
  }
}
