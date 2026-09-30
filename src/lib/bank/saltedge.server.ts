/**
 * Salt Edge AISP Open Banking integration (saltedge.com).
 * Aggregates all non-BoC Cyprus banks under PSD2 read-only account information:
 * Hellenic Bank, Eurobank Cyprus, Alpha Bank CY, AstroBank, Ancoria Bank.
 * Follows src/lib/bank/AGENTS.md strictly: zero payment rights, read-only statements.
 */

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { bankLinks } from "@/db/schema";
import { logger } from "@/lib/log";

const log = logger("lib.bank.saltedge");

export { CYPRUS_BANKS, type CyprusBankInstitution } from "./saltedge";

export interface SaltEdgeConfig {
  appId: string;
  secret: string;
  environment: "sandbox" | "production";
}

export function saltEdgeConfig(): SaltEdgeConfig | null {
  const appId = process.env.SALTEDGE_APP_ID?.trim();
  const secret = process.env.SALTEDGE_SECRET?.trim();
  if (!appId || !secret) return null;
  return {
    appId,
    secret,
    environment: (process.env.SALTEDGE_ENVIRONMENT || "sandbox").toLowerCase() === "production" ? "production" : "sandbox",
  };
}

export interface SaltEdgeSummary {
  configured: boolean;
  environment: "sandbox" | "production" | null;
  status: "none" | "pending" | "active" | "expired";
  accounts: number;
  banks: string[];
  lastSyncAt: string | null;
}

export async function saltEdgeSummary(workspaceId: string): Promise<SaltEdgeSummary> {
  const cfg = saltEdgeConfig();
  const configured = !!cfg;

  const [link] = await db
    .select()
    .from(bankLinks)
    .where(and(eq(bankLinks.workspaceId, workspaceId), eq(bankLinks.provider, "saltedge")))
    .orderBy(desc(bankLinks.createdAt))
    .limit(1);

  if (!link) {
    return {
      configured,
      environment: cfg?.environment ?? null,
      status: "none",
      accounts: 0,
      banks: [],
      lastSyncAt: null,
    };
  }

  return {
    configured,
    environment: cfg?.environment ?? null,
    status: (link.status as SaltEdgeSummary["status"]) || "none",
    accounts: link.accountIds.length,
    banks: link.accountIds.length > 0 ? ["Hellenic Bank / Eurobank"] : [],
    lastSyncAt: link.lastSyncAt ? new Date(link.lastSyncAt).toISOString() : null,
  };
}

export interface SaltEdgeConnectSessionResult {
  connectUrl: string;
  expiresAt?: string;
}

async function ensureSaltEdgeCustomer(cfg: SaltEdgeConfig, workspaceId: string): Promise<string> {
  try {
    const custRes = await fetch("https://www.saltedge.com/api/v6/customers", {
      method: "POST",
      headers: {
        "App-id": cfg.appId,
        Secret: cfg.secret,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          identifier: workspaceId,
        },
      }),
    });

    if (custRes.ok) {
      const custData = (await custRes.json()) as { data?: { customer_id?: string; id?: string } };
      return custData.data?.customer_id || custData.data?.id || workspaceId;
    }

    if (custRes.status === 409) {
      const getRes = await fetch(`https://www.saltedge.com/api/v6/customers/${encodeURIComponent(workspaceId)}`, {
        headers: {
          "App-id": cfg.appId,
          Secret: cfg.secret,
          Accept: "application/json",
        },
      });
      if (getRes.ok) {
        const existing = (await getRes.json()) as { data?: { customer_id?: string; id?: string } };
        return existing.data?.customer_id || existing.data?.id || workspaceId;
      }
    }

    const errText = await custRes.text().catch(() => "");
    log.warn("Salt Edge customer setup returned non-200", { status: custRes.status, body: errText });
    return workspaceId;
  } catch (err) {
    log.warn("Error registering Salt Edge customer, falling back to identifier", err);
    return workspaceId;
  }
}

/**
 * Creates a Salt Edge connect session URL for secure user authorization (API v6).
 */
export async function createSaltEdgeConnectSession(
  workspaceId: string,
  returnUrl: string,
  bankCode?: string,
): Promise<SaltEdgeConnectSessionResult> {
  const cfg = saltEdgeConfig();
  if (!cfg) {
    // Return graceful preview connect URL if credentials are not yet entered
    return {
      connectUrl: `https://www.saltedge.com/dashboard/connect?preview=true&provider=${encodeURIComponent(bankCode || "hellenic_bank_cy")}&return_to=${encodeURIComponent(returnUrl)}`,
    };
  }

  try {
    const customerId = await ensureSaltEdgeCustomer(cfg, workspaceId);

    const payload: Record<string, unknown> = {
      customer_id: customerId,
      consent: {
        scopes: ["accounts", "transactions"],
      },
      attempt: {
        return_to: returnUrl,
      },
    };

    if (bankCode) {
      payload.provider_code = bankCode;
    }

    const res = await fetch("https://www.saltedge.com/api/v6/connections/connect", {
      method: "POST",
      headers: {
        "App-id": cfg.appId,
        Secret: cfg.secret,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: payload }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      log.error(`Salt Edge session create failed (${res.status}): ${text}`);
      throw new Error(`Salt Edge connect failed: ${res.status}`);
    }

    const data = (await res.json()) as { data?: { connect_url?: string; expires_at?: string } };
    return {
      connectUrl: data.data?.connect_url || returnUrl,
      expiresAt: data.data?.expires_at,
    };
  } catch (err) {
    log.error("Failed to create Salt Edge connect session", err);
    throw err;
  }
}
