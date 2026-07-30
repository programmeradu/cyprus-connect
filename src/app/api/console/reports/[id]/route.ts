/**
 * One deliverable: read it, or move it along the review path.
 *
 * PATCH accepts a status change (draft, in_review, final) and a section edit.
 * A person always owns the final word on a drafted document.
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { activityEvents, reports } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { resolveConsoleSession } from "@/lib/console-session";

export const dynamic = "force-dynamic";

const STATUSES = new Set(["draft", "in_review", "final"]);

async function load(id: string, workspaceId: string) {
  const [row] = await db
    .select()
    .from(reports)
    .where(and(eq(reports.id, id), eq(reports.workspaceId, workspaceId)))
    .limit(1);
  return row ?? null;
}

function shape(row: typeof reports.$inferSelect) {
  let sections: unknown = [];
  try {
    sections = JSON.parse(row.sections);
  } catch {
    sections = [];
  }
  return {
    id: row.id,
    framework: row.framework,
    title: row.title,
    periodLabel: row.periodLabel,
    status: row.status,
    agentKey: row.agentKey,
    agentName: row.agentName,
    summary: row.summary,
    sections: Array.isArray(sections) ? sections : [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const resolved = await resolveConsoleSession(await headers());
  if (!resolved.ok) {
    return NextResponse.json(
      { error: resolved.error, message: resolved.message },
      { status: resolved.status },
    );
  }
  const { id } = await ctx.params;
  const row = await load(id, resolved.session.workspace.id);
  if (!row) {
    return NextResponse.json(
      { error: "not_found", message: "This report is not in your workspace." },
      { status: 404 },
    );
  }
  return NextResponse.json({
    report: shape(row),
    workspace: { name: resolved.session.workspace.name },
  });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const resolved = await resolveConsoleSession(await headers());
  if (!resolved.ok) {
    return NextResponse.json(
      { error: resolved.error, message: resolved.message },
      { status: resolved.status },
    );
  }
  const { workspace, account } = resolved.session;
  const { id } = await ctx.params;
  const row = await load(id, workspace.id);
  if (!row) {
    return NextResponse.json(
      { error: "not_found", message: "This report is not in your workspace." },
      { status: 404 },
    );
  }

  let status = "";
  try {
    const body = (await req.json()) as { status?: unknown };
    status = typeof body.status === "string" ? body.status : "";
  } catch {
    /* handled below */
  }
  if (!STATUSES.has(status)) {
    return NextResponse.json(
      { error: "bad_request", message: "Send a status of draft, in_review or final." },
      { status: 400 },
    );
  }

  const [updated] = await db
    .update(reports)
    .set({ status, updatedAt: new Date() })
    .where(eq(reports.id, row.id))
    .returning();

  await db.insert(activityEvents).values({
    workspaceId: workspace.id,
    actorType: "human",
    actorName: account?.name ?? account?.email ?? "A person",
    verb: "updated",
    object: row.title,
    detail: `Report status set to ${status.replace("_", " ")}.`,
  });

  return NextResponse.json({ report: shape(updated) });
}
