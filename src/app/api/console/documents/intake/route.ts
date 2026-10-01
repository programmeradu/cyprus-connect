/**
 * "Add data" intake: POST one file (multipart field "file").
 *
 * The file is read and either refused with a reason, or held as a pending
 * document with a proposal. Nothing reaches company data until a person
 * confirms it (see ./[id]/route.ts). Refused files are not stored.
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { resolveConsoleSession } from "@/lib/console-session";
import { readUpload, type UploadKind } from "@/lib/validate";
import { readDocument, mimeFor } from "@/lib/documents/intake.server";
import { logger } from "@/lib/log";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
const log = logger("api.console.documents.intake");

const PENDING_SOURCE = "intake_pending";
const KINDS: readonly UploadKind[] = ["pdf", "png", "jpeg", "webp", "csv", "xlsx"];

export async function POST(request: NextRequest) {
  const resolved = await resolveConsoleSession(await headers());
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error, message: resolved.message }, { status: resolved.status });
  }
  const up = await readUpload(request, "file", KINDS);
  if (!up.ok) return up.response;
  const userId = resolved.session.account.id;
  const fileName = (up.file.name || `document.${up.kind}`).replace(/[\\/\x00-\x1f]+/g, "_").slice(0, 200);
  try {
    const result = await readDocument(userId, up.bytes, up.kind);
    if (!result.ok) return NextResponse.json({ rejected: { code: result.code, detail: result.detail ?? null }, fileName });
    const mime = mimeFor(up.kind);
    const now = new Date().toISOString();
    const [row] = await db
      .insert(documents)
      .values({
        userId,
        fileName,
        fileType: up.kind,
        fileSize: up.bytes.length,
        fileUrl: `data:${mime};base64,${Buffer.from(up.bytes).toString("base64")}`,
        uploadSource: PENDING_SOURCE,
        processingStatus: "proposed",
        parsedData: JSON.stringify({ proposal: result.proposal, bill: result.bill ?? null }),
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: documents.id });
    // The raw statement lines stay on the server; the page only needs the payees.
    const proposal = result.proposal.bank ? { ...result.proposal, bank: { ...result.proposal.bank, debits: undefined } } : result.proposal;
    return NextResponse.json({ id: row.id, fileName, proposal });
  } catch (error) {
    const ref = log.error("intake read failed", error);
    return NextResponse.json({ message: "The document could not be read just now. Try again.", ref }, { status: 502 });
  }
}
