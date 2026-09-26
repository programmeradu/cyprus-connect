/**
 * The dashboard's connection list, worked out from what is really linked
 * or imported for this workspace. Nothing is read from stored sample rows,
 * and no coverage percentage is claimed: we cannot measure what share of a
 * company's records a source holds, so `coveragePct` is always null.
 */

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { cbamImportLines, integrations } from "@/db/schema";
import type { ConsoleConnection } from "@/components/app/console/types";

export async function liveConnections(accountId: string, workspaceId: string): Promise<ConsoleConnection[]> {
  const [qbRows, customs] = await Promise.all([
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
  ]);

  const qb = qbRows[0];
  const qbExpired = !!qb?.isActive && !!qb.tokenExpiresAt && new Date(qb.tokenExpiresAt) <= new Date();
  const qbConfigured = !!process.env.QB_CLIENT_ID;
  const lines = customs[0]?.count ?? 0;
  const toIso = (v: unknown) => (v ? new Date(v as string).toISOString() : null);

  return [
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
    {
      id: "cbam-customs",
      provider: "Customs import lines",
      category: "customs",
      status: lines > 0 ? "live" : "available",
      coveragePct: null,
      lastSyncAt: lines > 0 ? toIso(customs[0]?.last) : null,
      note: lines > 0 ? `${lines} line${lines === 1 ? "" : "s"} imported for CBAM.` : "No customs file imported yet.",
    },
  ];
}
