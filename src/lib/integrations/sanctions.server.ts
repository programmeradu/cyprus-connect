/**
 * Supplier sanctions screening through OpenSanctions (https://www.opensanctions.org),
 * which merges EU, UN, UK, US and other official sanctions lists.
 *
 * We screen against the "sanctions" collection only (not politically exposed
 * persons or crime lists), because a supplier check asks one question: is
 * this company on a sanctions list? A result above the matcher's threshold is
 * a POSSIBLE match for a person to review, never a finding that a supplier is
 * sanctioned. No key means "not configured", never a guessed answer.
 */

export const SANCTIONS_SOURCE = {
  name: "OpenSanctions (sanctions collection: EU, UN, UK, US and other official lists)",
  url: "https://www.opensanctions.org/datasets/sanctions/",
  licence: "CC BY-NC 4.0; commercial use needs an OpenSanctions licence",
} as const;

const MATCH_URL = "https://api.opensanctions.org/match/sanctions?algorithm=logic-v1";

export interface SanctionsHit {
  id: string;
  name: string;
  score: number;
  schema: string;
  countries: string[];
  programs: string[];
  datasets: string[];
  lastChange: string | null;
  url: string;
}

export type SanctionsResult =
  | { ok: true; status: "clear" | "possible_match"; hits: SanctionsHit[]; checkedAt: string; source: typeof SANCTIONS_SOURCE }
  | { ok: false; reason: "not_configured" | "unavailable" | "rejected" };

const strs = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

/** Pure: turns an OpenSanctions /match response into our shape. */
export function parseMatchResponse(json: unknown, queryKey = "q"): SanctionsHit[] {
  const results = (json as { responses?: Record<string, { results?: unknown[] }> })?.responses?.[queryKey]?.results;
  if (!Array.isArray(results)) throw new Error("Unexpected OpenSanctions answer");
  return results
    .map((r) => r as Record<string, unknown>)
    .filter((r) => r.match === true && typeof r.id === "string")
    .map((r) => {
      const p = (r.properties ?? {}) as Record<string, unknown>;
      const id = r.id as string;
      return {
        id,
        name: typeof r.caption === "string" ? r.caption : strs(p.name)[0] ?? id,
        score: Math.round(Number(r.score ?? 0) * 100) / 100,
        schema: typeof r.schema === "string" ? r.schema : "Thing",
        countries: [...new Set([...strs(p.country), ...strs(p.jurisdiction)])],
        programs: strs(p.programId).concat(strs(p.program)).slice(0, 5),
        datasets: strs(r.datasets).slice(0, 8),
        lastChange: typeof r.last_change === "string" ? r.last_change : null,
        url: `https://www.opensanctions.org/entities/${encodeURIComponent(id)}/`,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

/** ISO 3166 alpha-2, lowercase, as OpenSanctions expects; anything else is dropped. */
const countryCode = (c?: string | null) => (c && /^[a-z]{2}$/i.test(c.trim()) ? c.trim().toLowerCase() : null);

export async function screenCompany(input: { name: string; country?: string | null; registrationNo?: string | null }): Promise<SanctionsResult> {
  const key = process.env.OPENSANCTIONS_API_KEY;
  if (!key) return { ok: false, reason: "not_configured" };
  const properties: Record<string, string[]> = { name: [input.name.trim().slice(0, 200)] };
  const cc = countryCode(input.country);
  if (cc) properties.jurisdiction = [cc];
  if (input.registrationNo) properties.registrationNumber = [input.registrationNo.replace(/\s+/g, "")];
  try {
    const res = await fetch(MATCH_URL, {
      method: "POST",
      headers: { Authorization: `ApiKey ${key}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ queries: { q: { schema: "Company", properties } } }),
      signal: AbortSignal.timeout(12_000),
    });
    if (res.status === 401 || res.status === 403) return { ok: false, reason: "rejected" };
    if (!res.ok) return { ok: false, reason: "unavailable" };
    const hits = parseMatchResponse(await res.json());
    return { ok: true, status: hits.length ? "possible_match" : "clear", hits, checkedAt: new Date().toISOString(), source: SANCTIONS_SOURCE };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
