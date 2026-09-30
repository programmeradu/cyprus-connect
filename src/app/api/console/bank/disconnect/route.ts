/**
 * Removes the bank link and every payment read through it. Consent can also be
 * withdrawn at the bank itself (1Bank); this deletes Vuneli's copy.
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { resolveConsoleSession } from "@/lib/console-session";
import { db } from "@/db";
import { bankLinks } from "@/db/schema";
import { logBankEvent } from "@/lib/bank/bank.server";
import { logger } from "@/lib/log";

export const dynamic = "force-dynamic";
const log = logger("api.console.bank.disconnect");

export async function POST() {
  const resolved = await resolveConsoleSession(await headers());
  if (!resolved.ok) return NextResponse.json({ error: resolved.error, message: resolved.message }, { status: resolved.status });
  const { account, workspace } = resolved.session;
  try {
    // Payments go with the link (ON DELETE CASCADE).
    const removed = await db
      .delete(bankLinks)
      .where(and(eq(bankLinks.workspaceId, workspace.id), eq(bankLinks.provider, "boc")))
      .returning({ id: bankLinks.id });
    if (removed.length) {
      await logBankEvent(workspace.id, account.name || account.email || "Workspace member", "unlinked", "Link and stored payments deleted");
    }
    return NextResponse.json({ removed: removed.length });
  } catch (error) {
    const ref = log.error("disconnect failed", error);
    return NextResponse.json({ message: "The bank link could not be removed. Please try again.", ref }, { status: 500 });
  }
}
