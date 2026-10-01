/**
 * Records a PDF the signed-in workspace just downloaded, so the QR code and
 * fingerprint printed on it can be checked on the public /verify page.
 * Re-downloading identical content keeps the first record (same fingerprint).
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { resolveConsoleSession } from "@/lib/console-session";
import { readJson } from "@/lib/validate";
import { logger } from "@/lib/log";
import { db } from "@/db";
import { documentFingerprints } from "@/db/schema";

export const dynamic = "force-dynamic";
const log = logger("api.console.documents");

const Body = z.object({
  hash: z.string().regex(/^[0-9a-f]{64}$/),
  kind: z.enum(["board-summary", "report", "cbam"]),
  docId: z.string().min(3).max(64),
  title: z.string().min(1).max(200),
  company: z.string().min(1).max(200),
  issuedAt: z.string().datetime(),
});

export async function POST(req: Request) {
  const s = await resolveConsoleSession(await headers());
  if (!s.ok) return NextResponse.json({ error: s.error, message: s.message }, { status: s.status });
  const parsed = await readJson(req, Body);
  if (!parsed.ok) return parsed.response;
  const { account, workspace } = s.session;
  const b = parsed.data;
  try {
    await db
      .insert(documentFingerprints)
      .values({
        hash: b.hash,
        kind: b.kind,
        docId: b.docId,
        title: b.title,
        company: b.company,
        workspaceId: workspace.id,
        issuedBy: account.name || account.email || "Workspace member",
        issuedAt: new Date(b.issuedAt),
      })
      .onConflictDoNothing();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const ref = log.error("register failed", error);
    return NextResponse.json({ message: "The document could not be registered for checking.", ref }, { status: 500 });
  }
}
