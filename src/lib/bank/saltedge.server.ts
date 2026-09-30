/**
 * Salt Edge AISP Open Banking integration (saltedge.com).
 * Read-only PSD2 account information for the banks in CYPRUS_BANKS
 * (see src/lib/bank/saltedge.ts for the coverage source and merger notes).
 * Follows src/lib/bank/AGENTS.md strictly: zero payment rights, read-only statements.
 */

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { bankLinks, bankTransactions } from "@/db/schema";
import { logger } from "@/lib/log";
import { categorise } from "./categorize";

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

export interface SaltEdgeSyncResult {
  status: "none" | "pending" | "active" | "expired";
  accounts: number;
  banks: string[];
  transactionsAdded: number;
  lastSyncAt: string | null;
}

/**
 * Polls or syncs live connections, accounts, and recent transactions from Salt Edge API v6.
 */
export async function syncSaltEdgeConnection(workspaceId: string): Promise<SaltEdgeSyncResult> {
  const cfg = saltEdgeConfig();
  if (!cfg) {
    return { status: "none", accounts: 0, banks: [], transactionsAdded: 0, lastSyncAt: null };
  }

  try {
    // 1. Fetch customer
    const custRes = await fetch(`https://www.saltedge.com/api/v6/customers/${encodeURIComponent(workspaceId)}`, {
      headers: {
        "App-id": cfg.appId,
        Secret: cfg.secret,
        Accept: "application/json",
      },
    });

    if (!custRes.ok) {
      return { status: "none", accounts: 0, banks: [], transactionsAdded: 0, lastSyncAt: null };
    }

    const custData = (await custRes.json()) as { data?: { customer_id?: string; id?: string } };
    const customerId = custData.data?.customer_id || custData.data?.id;
    if (!customerId) {
      return { status: "none", accounts: 0, banks: [], transactionsAdded: 0, lastSyncAt: null };
    }

    // 2. Fetch connections for this customer
    const connRes = await fetch(`https://www.saltedge.com/api/v6/connections?customer_id=${customerId}`, {
      headers: {
        "App-id": cfg.appId,
        Secret: cfg.secret,
        Accept: "application/json",
      },
    });

    if (!connRes.ok) {
      return { status: "none", accounts: 0, banks: [], transactionsAdded: 0, lastSyncAt: null };
    }

    const connData = (await connRes.json()) as {
      data?: Array<{
        id: string;
        provider_name: string;
        status: string;
      }>;
    };

    const connections = connData.data ?? [];
    const activeConns = connections.filter((c) => c.status === "active");

    if (activeConns.length === 0) {
      const pending = connections.find((c) => c.status === "pending");
      return {
        status: pending ? "pending" : "none",
        accounts: 0,
        banks: [],
        transactionsAdded: 0,
        lastSyncAt: null,
      };
    }

    // 3. For active connections, fetch accounts & transactions
    const allAccountIds: string[] = [];
    const bankNames: string[] = [];
    let transactionsAdded = 0;

    const [existingLink] = await db
      .select()
      .from(bankLinks)
      .where(and(eq(bankLinks.workspaceId, workspaceId), eq(bankLinks.provider, "saltedge")))
      .orderBy(desc(bankLinks.createdAt))
      .limit(1);

    const linkId = existingLink?.id || `bank_${crypto.randomUUID()}`;

    for (const conn of activeConns) {
      bankNames.push(conn.provider_name);

      const accRes = await fetch(`https://www.saltedge.com/api/v6/accounts?connection_id=${conn.id}`, {
        headers: {
          "App-id": cfg.appId,
          Secret: cfg.secret,
          Accept: "application/json",
        },
      });

      if (!accRes.ok) continue;

      const accData = (await accRes.json()) as {
        data?: Array<{
          id: string;
          name: string;
          currency_code: string;
        }>;
      };

      const accounts = accData.data ?? [];
      for (const acc of accounts) {
        allAccountIds.push(acc.id);

        const txRes = await fetch(
          `https://www.saltedge.com/api/v6/transactions?connection_id=${conn.id}&account_id=${acc.id}`,
          {
            headers: {
              "App-id": cfg.appId,
              Secret: cfg.secret,
              Accept: "application/json",
            },
          },
        );

        if (!txRes.ok) continue;

        const txData = (await txRes.json()) as {
          data?: Array<{
            id: string;
            made_on: string;
            amount: number;
            currency_code: string;
            description: string;
            mode: string;
          }>;
        };

        const txList = txData.data ?? [];
        if (txList.length > 0) {
          const rows = txList.flatMap((tx) => {
            const bookedOn = tx.made_on;
            const amount = Number(tx.amount);
            if (!tx.id || !bookedOn || !Number.isFinite(amount)) return [];
            const direction: "debit" | "credit" = amount < 0 || tx.mode === "fee" ? "debit" : "credit";
            const { category, rule } = categorise(tx.description, direction);
            return [
              {
                linkId,
                workspaceId,
                accountId: acc.id,
                providerTxId: String(tx.id).slice(0, 120),
                bookedOn,
                amount: Math.abs(amount),
                currency: (tx.currency_code || "EUR").slice(0, 3).toUpperCase(),
                direction,
                description: tx.description ? tx.description.slice(0, 300) : null,
                category,
                matchedRule: rule,
              },
            ];
          });

          if (rows.length > 0) {
            const inserted = await db
              .insert(bankTransactions)
              .values(rows)
              .onConflictDoNothing({
                target: [bankTransactions.linkId, bankTransactions.accountId, bankTransactions.providerTxId],
              })
              .returning({ id: bankTransactions.id });
            transactionsAdded += inserted.length;
          }
        }
      }
    }

    const now = new Date();
    if (existingLink) {
      await db
        .update(bankLinks)
        .set({
          status: "active",
          accountIds: allAccountIds,
          subscriptionId: activeConns[0].id,
          lastSyncAt: now,
          lastError: null,
        })
        .where(eq(bankLinks.id, existingLink.id));
    } else {
      await db.insert(bankLinks).values({
        id: linkId,
        workspaceId,
        provider: "saltedge",
        environment: cfg.environment,
        subscriptionId: activeConns[0].id,
        status: "active",
        accountIds: allAccountIds,
        lastSyncAt: now,
      });
    }

    return {
      status: "active",
      accounts: allAccountIds.length,
      banks: Array.from(new Set(bankNames)),
      transactionsAdded,
      lastSyncAt: now.toISOString(),
    };
  } catch (err) {
    log.error("Failed to sync Salt Edge connection", err);
    return { status: "none", accounts: 0, banks: [], transactionsAdded: 0, lastSyncAt: null };
  }
}

export async function saltEdgeSummary(workspaceId: string): Promise<SaltEdgeSummary> {
  const cfg = saltEdgeConfig();
  const configured = !!cfg;

  if (!configured) {
    return {
      configured: false,
      environment: null,
      status: "none",
      accounts: 0,
      banks: [],
      lastSyncAt: null,
    };
  }

  // 1. Check database link
  const [link] = await db
    .select()
    .from(bankLinks)
    .where(and(eq(bankLinks.workspaceId, workspaceId), eq(bankLinks.provider, "saltedge")))
    .orderBy(desc(bankLinks.createdAt))
    .limit(1);

  // If status is pending or accounts are 0, perform live sync from Salt Edge API
  if (!link || link.status === "pending" || link.accountIds.length === 0) {
    const syncRes = await syncSaltEdgeConnection(workspaceId);
    if (syncRes.status === "active") {
      return {
        configured: true,
        environment: cfg.environment,
        status: "active",
        accounts: syncRes.accounts,
        banks: syncRes.banks,
        lastSyncAt: syncRes.lastSyncAt,
      };
    }
  }

  if (!link) {
    return {
      configured: true,
      environment: cfg.environment,
      status: "none",
      accounts: 0,
      banks: [],
      lastSyncAt: null,
    };
  }

  return {
    configured: true,
    environment: cfg.environment,
    status: (link.status as SaltEdgeSummary["status"]) || "none",
    accounts: link.accountIds.length,
    // The bank name is only known after a sync reports it; never a stand-in label.
    banks: [],
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
    log.warn("Error registering Salt Edge customer, falling back to identifier", {
      errorMessage: err instanceof Error ? err.message : String(err),
    });
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
    // Never hand out a made-up URL; the route answers 503 before this point.
    throw new Error("Salt Edge is not configured");
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
