/**
 * Starts a Nango connection for one system in ERP_SYSTEMS.
 * QuickBooks is linked directly, not through Nango.
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { resolveConsoleSession } from "@/lib/console-session";
import { readJson } from "@/lib/validate";
import { db } from "@/db";
import { integrations } from "@/db/schema";
import { createNangoConnectSession, nangoConfig } from "@/lib/integrations/nango.server";
import { ERP_SYSTEM_IDS } from "@/lib/integrations/erp-catalog";
import { logger } from "@/lib/log";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";
const log = logger("api.console.integrations.nango.connect");

const ConnectBodySchema = z.object({
  integrationId: z.string().max(80).optional(),
});

export async function POST(request: NextRequest) {
  const resolved = await resolveConsoleSession(await headers());
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error, message: resolved.message }, { status: resolved.status });
  }

  const parsed = await readJson(request, ConnectBodySchema);
  if (!parsed.ok) return parsed.response;

  const { account } = resolved.session;
  if (!nangoConfig()) {
    return NextResponse.json(
      { error: "not_configured", message: "Accounting links are not set up yet." },
      { status: 503 },
    );
  }
  const integrationId = parsed.data.integrationId;
  if (!integrationId || !(ERP_SYSTEM_IDS as readonly string[]).includes(integrationId)) {
    return NextResponse.json({ error: "system_required", message: "Choose a supported system first." }, { status: 400 });
  }

  try {
    const session = await createNangoConnectSession(account.id, integrationId);

    // Record or update integration intent
    const existing = await db
      .select({ id: integrations.id })
      .from(integrations)
      .where(and(eq(integrations.userId, account.id), eq(integrations.providerName, integrationId)))
      .limit(1);

    if (existing.length === 0) {
      // Nango holds the provider credentials; Vuneli stores no tokens for it.
      const now = new Date().toISOString();
      await db.insert(integrations).values({
        userId: account.id,
        integrationType: "nango",
        providerName: integrationId,
        accessToken: "",
        refreshToken: "",
        tokenExpiresAt: "",
        isActive: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    return NextResponse.json({ connectUrl: session.connectUrl, integrationId });
  } catch (error) {
    const ref = log.error("Nango connect initiation failed", error);
    return NextResponse.json(
      { message: "Unable to start unified ERP session. Please try again.", ref },
      { status: 502 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const resolved = await resolveConsoleSession(await headers());
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error, message: resolved.message }, { status: resolved.status });
  }

  const parsed = await readJson(request, ConnectBodySchema);
  if (!parsed.ok) return parsed.response;

  const { account } = resolved.session;
  const integrationId = parsed.data.integrationId;

  try {
    if (integrationId) {
      await db
        .update(integrations)
        .set({ isActive: false })
        .where(and(eq(integrations.userId, account.id), eq(integrations.providerName, integrationId)));
    } else {
      await db
        .update(integrations)
        .set({ isActive: false })
        .where(and(eq(integrations.userId, account.id), eq(integrations.integrationType, "nango")));
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const ref = log.error("Nango disconnect failed", error);
    return NextResponse.json(
      { message: "Could not revoke Nango integration.", ref },
      { status: 500 },
    );
  }
}
