/**
 * CBAM workspace data: import lines and the agent's declaration draft.
 * GET ?year=2026 reads, POST { csv } imports lines, DELETE ?id=1 removes one.
 * Lines are deduplicated by a SHA-256 of their content, so re-uploading the
 * same file adds nothing.
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  activityEvents,
  cbamDeclarants,
  cbamDeclarations,
  cbamImportLines,
  cbamSupplierRequests,
  cbamSuppliers,
} from "@/db/schema";
import { resolveConsoleSession } from "@/lib/console-session";
import { parseImportCsv, type CbamDraft } from "@/lib/agents/cbam-calc";
import { exportGaps } from "@/lib/agents/cbam-registry-xml";
import { sha256Hex, stableStringify } from "@/lib/agents/hash";

export const dynamic = "force-dynamic";

const MAX_BYTES = 1_000_000;
const MAX_ROWS = 5_000;

async function session() {
  return resolveConsoleSession(await headers());
}

export async function GET(req: Request) {
  const s = await session();
  if (!s.ok) return NextResponse.json({ error: s.error, message: s.message }, { status: s.status });
  const ws = s.session.workspace.id;

  const yearRows = (await db.execute(
    sql`select distinct year from cbam_import_lines where workspace_id = ${ws}
        union select year from cbam_declarations where workspace_id = ${ws} order by 1 desc`,
  )) as unknown as Array<{ year: number }>;
  const years = yearRows.map((r) => Number(r.year));
  const asked = Number(new URL(req.url).searchParams.get("year"));
  const year = years.includes(asked) ? asked : years[0] ?? new Date().getUTCFullYear();

  const [lines, [decl], suppliers, [declarant], requests] = await Promise.all([
    db
      .select()
      .from(cbamImportLines)
      .where(and(eq(cbamImportLines.workspaceId, ws), eq(cbamImportLines.year, year)))
      .orderBy(asc(cbamImportLines.id)),
    db
      .select()
      .from(cbamDeclarations)
      .where(and(eq(cbamDeclarations.workspaceId, ws), eq(cbamDeclarations.year, year)))
      .limit(1),
    db.select().from(cbamSuppliers).where(eq(cbamSuppliers.workspaceId, ws)).orderBy(asc(cbamSuppliers.supplierName)),
    db.select().from(cbamDeclarants).where(eq(cbamDeclarants.workspaceId, ws)).limit(1),
    db
      .select({ supplierName: cbamSupplierRequests.supplierName, email: cbamSupplierRequests.email, sentAt: cbamSupplierRequests.sentAt, approvedBy: cbamSupplierRequests.approvedBy })
      .from(cbamSupplierRequests)
      .where(and(eq(cbamSupplierRequests.workspaceId, ws), eq(cbamSupplierRequests.year, year)))
      .orderBy(desc(cbamSupplierRequests.sentAt))
      .limit(200),
  ]);

  const draftObj = decl ? (JSON.parse(decl.draft) as CbamDraft) : null;
  const who = { legalName: declarant?.legalName ?? null, eori: declarant?.eori ?? null, accountNumber: declarant?.accountNumber ?? null };

  return NextResponse.json({
    year,
    years,
    lines,
    suppliers: suppliers.map((c) => ({ supplierName: c.supplierName, email: c.email, contactName: c.contactName })),
    declarant: { ...who, replyToEmail: declarant?.replyToEmail ?? null },
    requests,
    exportGaps:
      decl && draftObj
        ? exportGaps(draftObj, who, { status: decl.status, draftHash: decl.draftHash, signedBy: decl.signedBy, signedAt: null, signedHash: decl.signedHash })
        : null,
    declaration: decl
      ? {
          status: decl.status,
          draftHash: decl.draftHash,
          draft: JSON.parse(decl.draft),
          signedBy: decl.signedBy,
          signedAt: decl.signedAt,
          signedHash: decl.signedHash,
          updatedAt: decl.updatedAt,
          runId: decl.runId,
        }
      : null,
  });
}

export async function POST(req: Request) {
  const s = await session();
  if (!s.ok) return NextResponse.json({ error: s.error, message: s.message }, { status: s.status });
  const ws = s.session.workspace.id;
  const who = s.session.account.name || s.session.account.email || s.session.account.id;

  const body = z.object({ csv: z.string().min(1).max(MAX_BYTES) }).safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ message: "Send a CSV file under 1 MB." }, { status: 400 });
  }
  const { rows, errors } = parseImportCsv(body.data.csv);
  if (rows.length > MAX_ROWS) {
    return NextResponse.json({ message: `Up to ${MAX_ROWS} lines per file.` }, { status: 400 });
  }
  if (rows.length === 0) {
    return NextResponse.json({ inserted: 0, duplicates: 0, errors }, { status: errors.length ? 422 : 200 });
  }

  const values = await Promise.all(
    rows.map(async ({ row: _row, ...r }) => ({
      workspaceId: ws,
      year: Number(r.importDate.slice(0, 4)),
      ...r,
      sourceKind: "csv",
      sourceHash: await sha256Hex(stableStringify(r)),
      createdBy: who,
    })),
  );
  const inserted = await db
    .insert(cbamImportLines)
    .values(values)
    .onConflictDoNothing()
    .returning({ id: cbamImportLines.id });

  if (inserted.length) {
    await db.insert(activityEvents).values({
      workspaceId: ws,
      actorType: "human",
      actorName: who,
      verb: "imported",
      object: `${inserted.length} CBAM import line(s)`,
      detail: errors.length ? `${errors.length} row(s) skipped with errors.` : null,
    });
  }
  return NextResponse.json({ inserted: inserted.length, duplicates: rows.length - inserted.length, errors });
}

export async function DELETE(req: Request) {
  const s = await session();
  if (!s.ok) return NextResponse.json({ error: s.error, message: s.message }, { status: s.status });
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ message: "Unknown line." }, { status: 400 });
  const gone = await db
    .delete(cbamImportLines)
    .where(and(eq(cbamImportLines.id, id), eq(cbamImportLines.workspaceId, s.session.workspace.id)))
    .returning({ id: cbamImportLines.id });
  if (!gone.length) return NextResponse.json({ message: "That line is not in your workspace." }, { status: 404 });
  return NextResponse.json({ deleted: id });
}
