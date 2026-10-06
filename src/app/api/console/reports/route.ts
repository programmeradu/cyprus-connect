/**
 * Workspace deliverables: the list.
 *
 * Read only. A report is written by the approval gate, never by the browser.
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { complianceDocuments, documentFingerprints, reports } from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { resolveConsoleSession } from "@/lib/console-session";
import { markdownToSections } from "@/lib/pdf/markdown-sections";
import { logger } from "@/lib/log";

export const dynamic = "force-dynamic";
const log = logger("api.console.reports");

export async function GET() {
  const resolved = await resolveConsoleSession(await headers());
  if (!resolved.ok) {
    return NextResponse.json(
      { error: resolved.error, message: resolved.message },
      { status: resolved.status },
    );
  }
  const { account, workspace } = resolved.session;

  try {
    const userIds = Array.from(new Set([account.id, workspace.ownerUserId].filter(Boolean) as string[]));

    const [reportRows, compRows, fingerprintRows] = await Promise.all([
      db
        .select({
          id: reports.id,
          framework: reports.framework,
          title: reports.title,
          periodLabel: reports.periodLabel,
          status: reports.status,
          agentKey: reports.agentKey,
          agentName: reports.agentName,
          summary: reports.summary,
          createdAt: reports.createdAt,
          updatedAt: reports.updatedAt,
        })
        .from(reports)
        .where(eq(reports.workspaceId, workspace.id))
        .orderBy(desc(reports.createdAt))
        .catch((err) => {
          log.warn("failed to query reports table", { err: err instanceof Error ? err.message : String(err) });
          return [];
        }),
      (userIds.length > 0
        ? db
            .select()
            .from(complianceDocuments)
            .where(userIds.length === 1 ? eq(complianceDocuments.userId, userIds[0]) : inArray(complianceDocuments.userId, userIds))
            .orderBy(desc(complianceDocuments.createdAt))
        : Promise.resolve([])
      ).catch((err) => {
        log.warn("failed to query complianceDocuments", { err: err instanceof Error ? err.message : String(err) });
        return [];
      }),
      db
        .select({
          hash: documentFingerprints.hash,
          kind: documentFingerprints.kind,
          docId: documentFingerprints.docId,
          title: documentFingerprints.title,
          issuedAt: documentFingerprints.issuedAt,
          createdAt: documentFingerprints.createdAt,
        })
        .from(documentFingerprints)
        .where(eq(documentFingerprints.workspaceId, workspace.id))
        .orderBy(desc(documentFingerprints.createdAt))
        .catch((err) => {
          log.warn("failed to query documentFingerprints", { err: err instanceof Error ? err.message : String(err) });
          return [];
        }),
    ]);

    const existingTitles = new Set(reportRows.map((r) => r.title.toLowerCase()));

    const mappedCompRows = compRows
      .filter((c) => !existingTitles.has(c.title.toLowerCase()))
      .map((c) => {
        let summary: string | null = null;
        try {
          const s = markdownToSections(c.content || "");
          summary = s.summary || null;
        } catch {
          summary = null;
        }
        const date = new Date(c.generatedAt || c.createdAt);
        const year = Number.isNaN(date.getFullYear()) ? new Date().getFullYear() : date.getFullYear();
        existingTitles.add(c.title.toLowerCase());
        return {
          id: `doc-${c.id}`,
          framework: c.framework,
          title: c.title,
          periodLabel: String(year),
          status: c.status === "ready" ? "in_review" : c.status === "submitted" ? "final" : "draft",
          agentKey: "compliance",
          agentName: "Verde Compliance Agent",
          summary,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        };
      });

    const mappedFingerprints = fingerprintRows
      .filter((f) => !existingTitles.has(f.title.toLowerCase()))
      .map((f) => {
        const year = new Date(f.issuedAt).getFullYear();
        existingTitles.add(f.title.toLowerCase());
        return {
          id: f.docId,
          framework: f.kind === "board-summary" ? "Board" : f.kind === "cbam" ? "CBAM" : "Report",
          title: f.title,
          periodLabel: String(Number.isNaN(year) ? new Date().getFullYear() : year),
          status: "final",
          agentKey: "export",
          agentName: "Verified Export",
          summary: `Fingerprint ${f.hash.slice(0, 16)}…`,
          createdAt: new Date(f.createdAt),
          updatedAt: new Date(f.issuedAt),
        };
      });

    const allRows = [...reportRows, ...mappedCompRows, ...mappedFingerprints].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return NextResponse.json({ reports: allRows, workspace: { name: workspace.name } });
  } catch (error) {
    const ref = log.error("failed to load reports", error);
    return NextResponse.json(
      { error: "server_error", message: "Reports could not be loaded.", ref, reports: [] },
      { status: 500 },
    );
  }
}

