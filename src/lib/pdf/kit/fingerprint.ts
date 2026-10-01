/**
 * Document fingerprint: SHA-256 of the exact data printed in the PDF, keys
 * sorted. The same data always gives the same fingerprint, so a reader can
 * check a printed copy against Vuneli's records. It proves the figures were
 * not changed after export; it is not a qualified electronic signature.
 */

function stable(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  const o = value as Record<string, unknown>;
  return `{${Object.keys(o)
    .filter((k) => o[k] !== undefined)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stable(o[k])}`)
    .join(",")}}`;
}

export async function fingerprint(data: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(stable(data));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** "3f9a 1c02 … 77be" — first and last 8 hex, grouped, for running footers. */
export const shortPrint = (hash: string) => `${hash.slice(0, 4)} ${hash.slice(4, 8)} … ${hash.slice(-8, -4)} ${hash.slice(-4)}`;

export const groupedPrint = (hash: string) => hash.match(/.{1,4}/g)?.join(" ") ?? hash;
