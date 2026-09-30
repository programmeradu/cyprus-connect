/** Reads the latest 90 days of payments again. Only new lines are added. */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { resolveConsoleSession } from "@/lib/console-session";
import { currentLink, logBankEvent, syncLink } from "@/lib/bank/bank.server";
import { BocError } from "@/lib/bank/boc.server";
import { logger } from "@/lib/log";

export const dynamic = "force-dynamic";
const log = logger("api.console.bank.sync");

export async function POST() {
  const resolved = await resolveConsoleSession(await headers());
  if (!resolved.ok) return NextResponse.json({ error: resolved.error, message: resolved.message }, { status: resolved.status });
  const { account, workspace } = resolved.session;
  const link = await currentLink(workspace.id);
  if (!link || link.status !== "active") {
    return NextResponse.json({ error: "not_linked", message: "No active bank link. Link your account first." }, { status: 409 });
  }
  try {
    const r = await syncLink(link);
    await logBankEvent(workspace.id, account.name || account.email || "Workspace member", "read", `${r.read} payment(s), ${r.added} new`);
    return NextResponse.json(r);
  } catch (error) {
    if (error instanceof BocError && (error.step === "consent" || error.status === 401 || error.status === 403)) {
      return NextResponse.json({ error: "expired", message: "The bank consent has ended. Link the account again." }, { status: 409 });
    }
    const ref = log.error("sync failed", error);
    return NextResponse.json({ message: "The bank did not answer. Please try again later.", ref }, { status: 502 });
  }
}
