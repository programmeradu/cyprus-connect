import { eq } from "drizzle-orm";
import { db } from "@/db";
import { documentFingerprints } from "@/db/schema";

export type VerifiedDocument = {
  hash: string;
  kind: "board-summary" | "report" | "cbam";
  docId: string;
  title: string;
  company: string;
  issuedAt: Date;
};

/**
 * Looks up an issued document by the 16-character code in its QR link or by
 * the full 64-character fingerprint. Returns only what is printed on the
 * document itself — never who downloaded it or which workspace it came from.
 */
export async function findIssuedDocument(code: string): Promise<VerifiedDocument | null> {
  const c = code.toLowerCase().replace(/[^0-9a-f]/g, "");
  if (c.length !== 16 && c.length !== 64) return null;
  const rows = await db
    .select({
      hash: documentFingerprints.hash,
      kind: documentFingerprints.kind,
      docId: documentFingerprints.docId,
      title: documentFingerprints.title,
      company: documentFingerprints.company,
      issuedAt: documentFingerprints.issuedAt,
    })
    .from(documentFingerprints)
    .where(c.length === 64 ? eq(documentFingerprints.hash, c) : eq(documentFingerprints.prefix, c))
    .limit(2);
  // Two documents sharing a 16-hex prefix is astronomically unlikely; refuse rather than guess.
  if (rows.length !== 1) return null;
  return rows[0] as VerifiedDocument;
}

/** Normalises what a person types or pastes: spaces, "…" and case are ignored. */
export const normaliseCode = (raw: string) => raw.toLowerCase().replace(/[^0-9a-f]/g, "");
