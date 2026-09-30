/**
 * The dashboard's connection list, worked out from what is really linked
 * or imported for this workspace. Nothing is read from stored sample rows,
 * and no coverage percentage is claimed: we cannot measure what share of a
 * company's records a source holds, so `coveragePct` is always null.
 */

import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { cbamImportLines } from "@/db/schema";
import { nangoSummary } from "@/lib/integrations/nango.server";
import { ERP_SYSTEMS } from "@/lib/integrations/erp-catalog";
import type { ConsoleConnection } from "@/components/app/console/types";

export async function liveConnections(accountId: string, workspaceId: string): Promise<ConsoleConnection[]> {
  const [accounting, customs] = await Promise.all([
    nangoSummary(accountId),
    db
      .select({
        count: sql<number>`count(*)::int`,
        last: sql<string | null>`max(${cbamImportLines.createdAt})`,
      })
      .from(cbamImportLines)
      .where(eq(cbamImportLines.workspaceId, workspaceId)),
  ]);

  const lines = customs[0]?.count ?? 0;
  const toIso = (v: unknown) => (v ? new Date(v as string).toISOString() : null);

  return [
    {
      id: "accounting",
      provider: accounting.providers.length
        ? accounting.providers.map((id) => ERP_SYSTEMS.find((e) => e.id === id)?.name ?? id).join(", ")
        : "Accounting system",
      category: "accounting",
      status: accounting.connected ? "live" : "available",
      coveragePct: null,
      lastSyncAt: accounting.connected ? toIso(accounting.lastSyncAt) : null,
      note: accounting.connected
        ? "Linked through the Integrations page."
        : accounting.configured
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
