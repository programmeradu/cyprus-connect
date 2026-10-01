/**
 * Starts a read-only Salt Edge link for the Cyprus banks in CYPRUS_BANKS
 * (Eurobank's two online-banking systems and Alpha Bank Cyprus).
 * Bank of Cyprus is linked directly, not through Salt Edge.
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { resolveConsoleSession } from "@/lib/console-session";
import { recordActivity } from "@/lib/activity.server";
import { readJson } from "@/lib/validate";
import { db } from "@/db";
import { bankLinks } from "@/db/schema";
import { saltEdgeConfig, createSaltEdgeConnectSession } from "@/lib/bank/saltedge.server";
import { CYPRUS_BANK_CODES } from "@/lib/bank/saltedge";
import { logger } from "@/lib/log";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";
const log = logger("api.console.integrations.saltedge.connect");

const ConnectBodySchema = z.object({
  bankCode: z.enum(CYPRUS_BANK_CODES).optional(),
});

export async function POST(request: NextRequest) {
  const resolved = await resolveConsoleSession(await headers());
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error, message: resolved.message }, { status: resolved.status });
  }

  const parsed = await readJson(request, ConnectBodySchema);
  if (!parsed.ok) return parsed.response;

  const { account, workspace } = resolved.session;
  const cfg = saltEdgeConfig();
  if (!cfg) {
    return NextResponse.json(
      { error: "not_configured", message: "Bank linking is not set up yet." },
      { status: 503 },
    );
  }
  const bankCode = parsed.data.bankCode;
  if (!bankCode) {
    return NextResponse.json({ error: "bank_required", message: "Choose a bank first." }, { status: 400 });
  }

  try {
    const returnUrl = `${request.nextUrl.origin}/app/integrations?provider=saltedge&status=connected`;
    const session = await createSaltEdgeConnectSession(workspace.id, returnUrl, bankCode);

    const id = `bank_${crypto.randomUUID()}`;
    await db.insert(bankLinks).values({
      id,
      workspaceId: workspace.id,
      provider: "saltedge",
      environment: cfg.environment,
      subscriptionId: `se_${crypto.randomUUID().slice(0, 16)}`,
      status: "pending",
      createdBy: account.id,
    });

    return NextResponse.json({ connectUrl: session.connectUrl, bankCode });
  } catch (error) {
    const ref = log.error("Salt Edge connect initiation failed", error);
    return NextResponse.json(
      { message: "Unable to start Cyprus bank link session. Please try again.", ref },
      { status: 502 },
    );
  }
}

export async function DELETE() {
  const resolved = await resolveConsoleSession(await headers());
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error, message: resolved.message }, { status: resolved.status });
  }

  const { workspace } = resolved.session;
  try {
    await db
      .update(bankLinks)
      .set({ status: "revoked" })
      .where(and(eq(bankLinks.workspaceId, workspace.id), eq(bankLinks.provider, "saltedge")));
    await recordActivity(resolved.session, "unlinked bank", "Salt Edge");
    return NextResponse.json({ ok: true });
  } catch (error) {
    const ref = log.error("Salt Edge disconnect failed", error);
    return NextResponse.json(
      { message: "Could not revoke Salt Edge bank connection.", ref },
      { status: 500 },
    );
  }
}
