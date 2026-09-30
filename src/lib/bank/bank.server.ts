/**
 * Workspace side of the bank link: store, read statements, summarise spend.
 * Routes stay thin and call these.
 */

import { and, desc, eq, gte, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { activityEvents, bankLinks, bankTransactions } from "@/db/schema";
import { bocConfig, statement, BocError } from "./boc.server";
import { syncSaltEdgeConnection } from "./saltedge.server";
import { SPEND_CATEGORIES, categorise, consentExpired, directionOf, parseBocDate, type SpendCategory } from "./categorize";

export const SYNC_DAYS = 90;

export async function currentLink(workspaceId: string) {
  const [row] = await db
    .select()
    .from(bankLinks)
    .where(and(eq(bankLinks.workspaceId, workspaceId), ne(bankLinks.status, "revoked")))
    .orderBy(desc(bankLinks.createdAt))
    .limit(1);
  return row ?? null;
}

export async function logBankEvent(workspaceId: string, actorName: string, verb: string, detail: string) {
  await db.insert(activityEvents).values({
    workspaceId,
    actorType: "human",
    actorName,
    verb,
    object: "Bank link",
    detail,
  });
}

export interface SyncResult {
  accounts: number;
  read: number;
  added: number;
}

/** Reads the last 90 days for every approved account. Re-running adds only new lines. */
export async function syncLink(link: typeof bankLinks.$inferSelect): Promise<SyncResult> {
  if (link.provider === "saltedge") {
    const res = await syncSaltEdgeConnection(link.workspaceId);
    return { accounts: res.accounts, read: res.transactionsAdded, added: res.transactionsAdded };
  }

  const cfg = bocConfig();
  if (!cfg) throw new BocError("bank keys not set", 503, "config");
  if (link.status !== "active") throw new BocError("link not active", 409, "status");
  if (consentExpired(link.consentExpiresOn)) {
    await db.update(bankLinks).set({ status: "expired" }).where(eq(bankLinks.id, link.id));
    throw new BocError("consent expired", 409, "consent");
  }

  const to = new Date();
  const from = new Date(to.getTime() - SYNC_DAYS * 86_400_000);
  let read = 0;
  let added = 0;
  try {
    for (const accountId of link.accountIds) {
      const lines = await statement(cfg, link.subscriptionId, accountId, from, to);
      read += lines.length;
      const rows = lines.flatMap((tx) => {
        const bookedOn = parseBocDate(tx.postingDate) ?? parseBocDate(tx.valueDate);
        const amount = Number(tx.transactionAmount?.amount);
        if (!tx.id || !bookedOn || !Number.isFinite(amount)) return [];
        const direction = directionOf(tx.dcInd);
        const { category, rule } = categorise(tx.description, direction);
        return [{
          linkId: link.id,
          workspaceId: link.workspaceId,
          accountId,
          providerTxId: String(tx.id).slice(0, 120),
          bookedOn,
          amount: Math.abs(amount),
          currency: (tx.transactionAmount?.currency || "EUR").slice(0, 3).toUpperCase(),
          direction,
          description: tx.description ? tx.description.slice(0, 300) : null,
          category,
          matchedRule: rule,
        }];
      });
      if (rows.length) {
        const inserted = await db
          .insert(bankTransactions)
          .values(rows)
          .onConflictDoNothing({ target: [bankTransactions.linkId, bankTransactions.accountId, bankTransactions.providerTxId] })
          .returning({ id: bankTransactions.id });
        added += inserted.length;
      }
    }
  } catch (e) {
    const expired = e instanceof BocError && (e.status === 401 || e.status === 403);
    await db
      .update(bankLinks)
      .set({ lastError: e instanceof BocError ? e.step : "sync", ...(expired ? { status: "expired" } : {}) })
      .where(eq(bankLinks.id, link.id));
    throw e;
  }
  await db.update(bankLinks).set({ lastSyncAt: new Date(), lastError: null }).where(eq(bankLinks.id, link.id));
  return { accounts: link.accountIds.length, read, added };
}

export interface BankSummary {
  configured: boolean;
  environment: "sandbox" | "production" | null;
  status: "none" | "pending" | "active" | "expired" | "revoked";
  accounts: number;
  lastSyncAt: string | null;
  consentEndsOn: string | null;
  failed: boolean;
  windowDays: number;
  paymentsRead: number;
  /** Lines the bank did not mark as money in or out; never counted as spend. */
  unmarked: number;
  categories: { category: Exclude<SpendCategory, "other">; count: number; total: number }[];
  otherDebits: { count: number; total: number };
  recent: { bookedOn: string; amount: number; currency: string; category: SpendCategory; rule: string | null; description: string | null }[];
}

export async function bankSummary(workspaceId: string): Promise<BankSummary> {
  const cfg = bocConfig();
  const link = await currentLink(workspaceId);
  const base: BankSummary = {
    configured: !!cfg || link?.provider === "saltedge",
    environment: (link?.environment as BankSummary["environment"]) ?? cfg?.environment ?? null,
    status: (link?.status as BankSummary["status"]) ?? "none",
    accounts: link?.accountIds.length ?? 0,
    lastSyncAt: link?.lastSyncAt ? new Date(link.lastSyncAt).toISOString() : null,
    consentEndsOn: parseBocDate(link?.consentExpiresOn),
    failed: !!link?.lastError,
    windowDays: SYNC_DAYS,
    paymentsRead: 0,
    unmarked: 0,
    categories: SPEND_CATEGORIES.map((category) => ({ category, count: 0, total: 0 })),
    otherDebits: { count: 0, total: 0 },
    recent: [],
  };
  if (!link || link.status === "pending") return base;

  const since = new Date(Date.now() - SYNC_DAYS * 86_400_000).toISOString().slice(0, 10);
  const scope = and(eq(bankTransactions.linkId, link.id), gte(bankTransactions.bookedOn, since));
  const [groups, recent] = await Promise.all([
    db
      .select({
        direction: bankTransactions.direction,
        category: bankTransactions.category,
        count: sql<number>`count(*)::int`,
        total: sql<number>`coalesce(sum(${bankTransactions.amount}), 0)::float`,
      })
      .from(bankTransactions)
      .where(scope)
      .groupBy(bankTransactions.direction, bankTransactions.category),
    db
      .select()
      .from(bankTransactions)
      .where(and(scope, sql`${bankTransactions.category} <> 'other'`))
      .orderBy(desc(bankTransactions.bookedOn), desc(bankTransactions.id))
      .limit(6),
  ]);

  for (const g of groups) {
    base.paymentsRead += g.count;
    if (g.direction === "unknown") base.unmarked += g.count;
    if (g.direction !== "debit") continue;
    const hit = base.categories.find((c) => c.category === g.category);
    if (hit) {
      hit.count += g.count;
      hit.total += g.total;
    } else {
      base.otherDebits.count += g.count;
      base.otherDebits.total += g.total;
    }
  }
  base.recent = recent.map((r) => ({
    bookedOn: r.bookedOn,
    amount: r.amount,
    currency: r.currency,
    category: r.category as SpendCategory,
    rule: r.matchedRule,
    description: r.description,
  }));
  return base;
}
