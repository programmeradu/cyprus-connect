/**
 * Workspace deliverables: the list.
 *
 * Read only. A report is written by the approval gate, never by the browser.
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { resolveConsoleSession } from "@/lib/console-session";

export const dynamic = "force-dynamic";

export async function GET() {
  const resolved = await resolveConsoleSession(await headers());
  if (!resolved.ok) {
    return NextResponse.json(
      { error: resolved.error, message: resolved.message },
      { status: resolved.status },
    );
  }
  const { workspace } = resolved.session;

  const rows = await db
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
    .orderBy(desc(reports.createdAt));

  return NextResponse.json({ reports: rows, workspace: { name: workspace.name } });
}
