/**
 * What the Integrations page shows, read on the server from real sources:
 * whether each account link is set up and made, and the latest measured
 * reading from each live feed. Nothing is estimated; a feed with no answer
 * says so.
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { integrations } from "@/db/schema";
import { resolveConsoleSession } from "@/lib/console-session";
import { logger } from "@/lib/log";
import { gridToday } from "@/lib/insights/insights.server";

export const dynamic = "force-dynamic";
const log = logger("api.console.integrations");

export interface IntegrationsData {
  country: string;
  quickbooks: {
    /** The operator has set up the QuickBooks app keys. Without them no link can be made. */
    configured: boolean;
    connected: boolean;
    environment: string | null;
    lastSyncedAt: string | null;
    expired: boolean;
  };
  grid: {
    latestAt: string;
    latestGrams: number;
    renewableShare: number | null;
    hours: number;
    source: string;
  } | null;
  gridReason: "unsupported" | "unavailable" | null;
  fetchedAt: string;
}

export async function GET() {
  const resolved = await resolveConsoleSession(await headers());
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error, message: resolved.message }, { status: resolved.status });
  }
  const { account, workspace } = resolved.session;
  const country = (workspace.country || "CY").toUpperCase();
  try {
    const [grid, qbRows] = await Promise.all([
      gridToday(country),
      db
        .select({ isActive: integrations.isActive, tokenExpiresAt: integrations.tokenExpiresAt, lastSyncAt: integrations.lastSyncAt })
        .from(integrations)
        .where(and(eq(integrations.userId, account.id), eq(integrations.providerName, "quickbooks")))
        .limit(1),
    ]);
    const qb = qbRows[0];
    const connected = !!qb?.isActive;
    const body: IntegrationsData = {
      country,
      quickbooks: {
        configured: !!process.env.QB_CLIENT_ID,
        connected,
        environment: connected ? process.env.QB_ENVIRONMENT || "sandbox" : null,
        lastSyncedAt: connected ? (qb.lastSyncAt ?? null) : null,
        expired: connected && !!qb.tokenExpiresAt && new Date(qb.tokenExpiresAt) <= new Date(),
      },
      grid: grid.grid
        ? {
            latestAt: grid.grid.latest.at,
            latestGrams: grid.grid.latest.grams,
            renewableShare: grid.grid.renewableShare,
            hours: grid.grid.hours.length,
            source: grid.grid.source,
          }
        : null,
      gridReason: grid.reason,
      fetchedAt: new Date().toISOString(),
    };
    return NextResponse.json(body);
  } catch (error) {
    const ref = log.error("GET failed", error);
    return NextResponse.json({ message: "Your connections could not be read.", ref }, { status: 500 });
  }
}
