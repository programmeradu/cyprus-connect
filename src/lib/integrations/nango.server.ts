/**
 * Nango Unified Integration Platform connector (nango.dev).
 * Provides two-way sync for 150+ ERPs, accounting suites and CRMs:
 * Sage, SAP Business One, NetSuite, Xero, QuickBooks, Zoho, FreshBooks.
 */

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { integrations } from "@/db/schema";
import { logger } from "@/lib/log";

const log = logger("lib.integrations.nango");

export interface NangoConfig {
  secretKey: string;
  publicKey?: string;
  host: string;
}

export function nangoConfig(): NangoConfig | null {
  const secretKey = process.env.NANGO_SECRET_KEY?.trim();
  if (!secretKey) return null;
  return {
    secretKey,
    publicKey: process.env.NANGO_PUBLIC_KEY?.trim() || undefined,
    host: process.env.NANGO_HOST?.trim() || "https://api.nango.dev",
  };
}

export interface NangoSummary {
  configured: boolean;
  connected: boolean;
  connectionsCount: number;
  providers: string[];
  lastSyncAt: string | null;
}

/** Check if Nango is configured and active for an account */
export async function nangoSummary(userId: string): Promise<NangoSummary> {
  const cfg = nangoConfig();
  const configured = !!cfg;

  const activeLinks = await db
    .select({
      providerName: integrations.providerName,
      lastSyncAt: integrations.lastSyncAt,
    })
    .from(integrations)
    .where(and(eq(integrations.userId, userId), eq(integrations.integrationType, "nango"), eq(integrations.isActive, true)))
    .orderBy(desc(integrations.createdAt));

  const providers = Array.from(new Set(activeLinks.map((l) => l.providerName)));
  const latestSync = activeLinks.find((l) => !!l.lastSyncAt)?.lastSyncAt ?? null;

  return {
    configured,
    connected: providers.length > 0,
    connectionsCount: providers.length,
    providers,
    lastSyncAt: latestSync,
  };
}

export interface NangoConnectSessionResult {
  connectUrl: string;
  token?: string;
}

/**
 * Creates a Nango Connect Session token / URL for embedded UI or hosted redirect.
 */
export async function createNangoConnectSession(
  userId: string,
  integrationId?: string,
): Promise<NangoConnectSessionResult> {
  const cfg = nangoConfig();
  if (!cfg) {
    // Never hand out a made-up URL; the route answers 503 before this point.
    throw new Error("Nango is not configured");
  }

  try {
    const res = await fetch(`${cfg.host}/connect/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        end_user: {
          id: userId,
        },
        allowed_integrations: integrationId ? [integrationId] : undefined,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      log.error(`Nango connect session failed (${res.status}): ${text}`);
      throw new Error(`Nango session failed: ${res.status}`);
    }

    const data = (await res.json()) as { data?: { token?: string; connect_url?: string } };
    return {
      connectUrl: data.data?.connect_url || `https://connect.nango.dev/?token=${data.data?.token || ""}`,
      token: data.data?.token,
    };
  } catch (err) {
    log.error("Failed to create Nango connect session", err);
    throw err;
  }
}
