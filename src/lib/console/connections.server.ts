/**
 * The dashboard's connection list, worked out from what is really linked
 * or imported for this workspace. Nothing is read from stored sample rows,
 * and no coverage percentage is claimed: we cannot measure what share of a
 * company's records a source holds, so `coveragePct` is always null.
 */

import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { bankLinks, cbamImportLines, integrations } from "@/db/schema";
import type { ConsoleConnection } from "@/components/app/console/types";

export async function liveConnections(accountId: string, workspaceId: string): Promise<ConsoleConnection[]> {
  const [qbRows, customs, seLink, bocLink] = await Promise.all([
    db
      .select({
        isActive: integrations.isActive,
        tokenExpiresAt: integrations.tokenExpiresAt,
        lastSyncAt: integrations.lastSyncAt,
      })
      .from(integrations)
      .where(and(eq(integrations.userId, accountId), eq(integrations.providerName, "quickbooks")))
      .limit(1),
    db
      .select({
        count: sql<number>`count(*)::int`,
        last: sql<string | null>`max(${cbamImportLines.createdAt})`,
      })
      .from(cbamImportLines)
      .where(eq(cbamImportLines.workspaceId, workspaceId)),
    db
      .select()
      .from(bankLinks)
      .where(and(eq(bankLinks.workspaceId, workspaceId), eq(bankLinks.provider, "saltedge")))
      .orderBy(desc(bankLinks.createdAt))
      .limit(1),
    db
      .select()
      .from(bankLinks)
      .where(and(eq(bankLinks.workspaceId, workspaceId), eq(bankLinks.provider, "boc")))
      .orderBy(desc(bankLinks.createdAt))
      .limit(1),
  ]);

  const qb = qbRows[0];
  const qbExpired = !!qb?.isActive && !!qb.tokenExpiresAt && new Date(qb.tokenExpiresAt) <= new Date();
  const qbConfigured = !!process.env.QB_CLIENT_ID;
  const lines = customs[0]?.count ?? 0;
  const toIso = (v: unknown) => (v ? new Date(v as string).toISOString() : null);

  const se = seLink[0];
  const boc = bocLink[0];

  const results: ConsoleConnection[] = [
    {
      id: "quickbooks",
      provider: "QuickBooks",
      category: "accounting",
      status: qbExpired ? "error" : qb?.isActive ? "live" : "available",
      coveragePct: null,
      lastSyncAt: qb?.isActive ? toIso(qb.lastSyncAt) : null,
      note: qbExpired
        ? "The link has expired. Reconnect it on the Integrations page."
        : qb?.isActive
          ? "Linked to your QuickBooks company."
          : qbConfigured
            ? "Not linked yet."
            : "Not available yet on this workspace.",
    },
  ];

  if (se && (se.status === "active" || se.status === "pending")) {
    results.push({
      id: "saltedge",
      provider: "Salt Edge Open Banking",
      category: "banking",
      status: se.status === "active" ? "live" : "syncing",
      coveragePct: null,
      lastSyncAt: se.lastSyncAt ? toIso(se.lastSyncAt) : null,
      note:
        se.status === "active"
          ? `${se.accountIds.length} account${se.accountIds.length === 1 ? "" : "s"} linked via Salt Edge AISP.`
          : "Bank link authorization in progress.",
    });
  }

  if (boc && (boc.status === "active" || boc.status === "pending")) {
    results.push({
      id: "bank-of-cyprus",
      provider: "Bank of Cyprus",
      category: "banking",
      status: boc.status === "active" ? "live" : "syncing",
      coveragePct: null,
      lastSyncAt: boc.lastSyncAt ? toIso(boc.lastSyncAt) : null,
      note:
        boc.status === "active"
          ? `${boc.accountIds.length} account${boc.accountIds.length === 1 ? "" : "s"} linked (read-only AISP).`
          : "Bank link authorization in progress.",
    });
  }

  results.push({
    id: "cbam-customs",
    provider: "Customs import lines",
    category: "customs",
    status: lines > 0 ? "live" : "available",
    coveragePct: null,
    lastSyncAt: lines > 0 ? toIso(customs[0]?.last) : null,
    note: lines > 0 ? `${lines} line${lines === 1 ? "" : "s"} imported for CBAM.` : "No customs file imported yet.",
  });

  return results;
}
