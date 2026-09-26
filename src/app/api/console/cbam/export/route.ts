/**
 * GET ?year=2026 downloads the Registry export XML for the stored draft.
 * A draft (unsigned or incomplete) file is still downloadable for checking,
 * but it is marked documentStatus="draft" and the filename says so.
 */

import { headers } from "next/headers";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { activityEvents, cbamDeclarants, cbamDeclarations, cbamImportLines } from "@/db/schema";
import { resolveConsoleSession } from "@/lib/console-session";
import { buildRegistryXml, exportGaps } from "@/lib/agents/cbam-registry-xml";
import type { CbamDraft } from "@/lib/agents/cbam-calc";

export const dynamic = "force-dynamic";

const json = (message: string, status: number) =>
  new Response(JSON.stringify({ message }), { status, headers: { "content-type": "application/json" } });

export async function GET(req: Request) {
  const s = await resolveConsoleSession(await headers());
  if (!s.ok) return json(s.message ?? "Sign in first.", s.status);
  const ws = s.session.workspace.id;
  const year = Number(new URL(req.url).searchParams.get("year"));
  if (!Number.isInteger(year) || year < 2026 || year > 2100) return json("Choose a year from 2026.", 400);

  const [[decl], [declarant]] = await Promise.all([
    db.select().from(cbamDeclarations).where(and(eq(cbamDeclarations.workspaceId, ws), eq(cbamDeclarations.year, year))).limit(1),
    db.select().from(cbamDeclarants).where(eq(cbamDeclarants.workspaceId, ws)).limit(1),
  ]);
  if (!decl) return json(`There is no ${year} draft yet. Run the CBAM agent first.`, 404);

  const draft = JSON.parse(decl.draft) as CbamDraft;
  const ids = draft.lines.map((l) => l.id);
  const extras = ids.length
    ? await db
        .select({ id: cbamImportLines.id, importDate: cbamImportLines.importDate, description: cbamImportLines.description, customsRef: cbamImportLines.customsRef })
        .from(cbamImportLines)
        .where(and(eq(cbamImportLines.workspaceId, ws), inArray(cbamImportLines.id, ids)))
    : [];
  const who = { legalName: declarant?.legalName ?? null, eori: declarant?.eori ?? null, accountNumber: declarant?.accountNumber ?? null };
  const meta = {
    status: decl.status,
    draftHash: decl.draftHash,
    signedBy: decl.signedBy,
    signedAt: decl.signedAt ? decl.signedAt.toISOString() : null,
    signedHash: decl.signedHash,
  };
  const final = exportGaps(draft, who, meta).length === 0;
  const xml = buildRegistryXml(draft, who, extras, meta);

  await db.insert(activityEvents).values({
    workspaceId: ws,
    actorType: "human",
    actorName: s.session.account.name || s.session.account.email || "Workspace owner",
    verb: "downloaded",
    object: `${year} CBAM Registry file (${final ? "final" : "draft"})`,
    detail: `Draft fingerprint ${decl.draftHash.slice(0, 12)}.`,
  });

  const name = `vuneli-cbam-${year}-${final ? "final" : "draft"}-${decl.draftHash.slice(0, 8)}.xml`;
  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "content-disposition": `attachment; filename="${name}"`,
      "cache-control": "no-store",
    },
  });
}
