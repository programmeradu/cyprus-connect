import { eq, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { cbamDeclarants, cbamDeclarations, documentFingerprints } from "@/db/schema";

export type VerifiedDocument = {
  hash: string;
  kind: "board-summary" | "report" | "cbam";
  docId: string;
  title: string;
  company: string;
  issuedAt: Date;
  status?: "signed" | "draft" | "issued";
  isDraft?: boolean;
};

/**
 * Looks up an issued document by its QR link code, a prefix (12+ hex characters),
 * the full 64-character SHA-256 fingerprint, or a document ID (e.g. VNL-BS-20261004-928789).
 *
 * Checks both the document fingerprints register and registered CBAM declarations.
 * Returns only what is printed on the document itself — never who downloaded it or internal secrets.
 */
export async function findIssuedDocument(input: string): Promise<VerifiedDocument | null> {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Check if input is a document ID (e.g. VNL-..., CBAM-...)
  const isDocId = /^[A-Z0-9_-]{5,50}$/i.test(trimmed) && (trimmed.toUpperCase().startsWith("VNL-") || trimmed.toUpperCase().startsWith("CBAM-"));
  if (isDocId) {
    const cleanDocId = trimmed.toUpperCase();
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
      .where(sql`${documentFingerprints.docId} ILIKE ${cleanDocId}`)
      .limit(2);

    if (rows.length === 1) return rows[0] as VerifiedDocument;

    // Check CBAM declarations by docId e.g. CBAM-2026
    const decls = await db
      .select({
        draftHash: cbamDeclarations.draftHash,
        signedHash: cbamDeclarations.signedHash,
        year: cbamDeclarations.year,
        status: cbamDeclarations.status,
        signedAt: cbamDeclarations.signedAt,
        updatedAt: cbamDeclarations.updatedAt,
        workspaceId: cbamDeclarations.workspaceId,
      })
      .from(cbamDeclarations)
      .where(sql`CONCAT('CBAM-', ${cbamDeclarations.year}) ILIKE ${cleanDocId}`)
      .limit(2);

    if (decls.length === 1) {
      const d = decls[0];
      const [declarant] = await db
        .select({ legalName: cbamDeclarants.legalName })
        .from(cbamDeclarants)
        .where(eq(cbamDeclarants.workspaceId, d.workspaceId))
        .limit(1);

      const isDraft = d.status !== "signed" || !d.signedHash;
      const activeHash = d.signedHash || d.draftHash;
      return {
        hash: activeHash,
        kind: "cbam",
        docId: `CBAM-${d.year}`,
        title: `CBAM Declaration ${d.year}`,
        company: declarant?.legalName || "Registered CBAM Declarant",
        issuedAt: d.signedAt || d.updatedAt,
        status: isDraft ? "draft" : "signed",
        isDraft,
      };
    }
  }

  // Otherwise, treat as hex fingerprint / prefix
  const c = trimmed.toLowerCase().replace(/[^0-9a-f]/g, "");
  if (c.length < 12 || c.length > 64) return null;

  // 1. Check document_fingerprints
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
    .where(
      c.length === 64
        ? eq(documentFingerprints.hash, c)
        : sql`${documentFingerprints.hash} ILIKE ${c + "%"}`
    )
    .limit(2);

  if (rows.length === 1) return rows[0] as VerifiedDocument;

  // 2. Fallback check: registered CBAM declarations (F114, F80)
  const decls = await db
    .select({
      draftHash: cbamDeclarations.draftHash,
      signedHash: cbamDeclarations.signedHash,
      year: cbamDeclarations.year,
      status: cbamDeclarations.status,
      signedAt: cbamDeclarations.signedAt,
      updatedAt: cbamDeclarations.updatedAt,
      workspaceId: cbamDeclarations.workspaceId,
    })
    .from(cbamDeclarations)
    .where(
      c.length === 64
        ? or(eq(cbamDeclarations.draftHash, c), eq(cbamDeclarations.signedHash, c))
        : or(
            sql`${cbamDeclarations.draftHash} ILIKE ${c + "%"}`,
            sql`${cbamDeclarations.signedHash} ILIKE ${c + "%"}`
          )
    )
    .limit(2);

  if (decls.length === 1) {
    const d = decls[0];
    const [declarant] = await db
      .select({ legalName: cbamDeclarants.legalName })
      .from(cbamDeclarants)
      .where(eq(cbamDeclarants.workspaceId, d.workspaceId))
      .limit(1);

    const isDraft = d.status !== "signed" || !d.signedHash;
    const activeHash = d.signedHash || d.draftHash;
    return {
      hash: activeHash,
      kind: "cbam",
      docId: `CBAM-${d.year}`,
      title: `CBAM Declaration ${d.year}`,
      company: declarant?.legalName || "Registered CBAM Declarant",
      issuedAt: d.signedAt || d.updatedAt,
      status: isDraft ? "draft" : "signed",
      isDraft,
    };
  }

  return null;
}

/** Normalises what a person types or pastes: trims spaces, supports document IDs and hex fingerprints. */
export const normaliseCode = (raw: string) => {
  const trimmed = raw.trim();
  if (/^[a-z0-9_-]{5,50}$/i.test(trimmed) && (trimmed.toUpperCase().startsWith("VNL-") || trimmed.toUpperCase().startsWith("CBAM-"))) {
    return trimmed.toUpperCase();
  }
  return trimmed.toLowerCase().replace(/[^0-9a-f]/g, "");
};
