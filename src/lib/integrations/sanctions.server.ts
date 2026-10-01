/**
 * Supplier sanctions screening against the EU Consolidated Financial
 * Sanctions List (European Commission, FISMA). This is the list that legally
 * binds a Cyprus business. It is free to download and reuse, so no paid key.
 *
 * The full list (~36k names) is stored once in `eu_sanctions_names`, refreshed
 * at most daily from the hourly cron, and matched locally. A result is a
 * POSSIBLE match for a person to review, never a finding that a supplier is
 * sanctioned. If the list has never loaded, we say so instead of "clear".
 */

import { sql } from "drizzle-orm";
import { db } from "@/db";
import { euSanctionsNames } from "@/db/schema";
import { logger } from "@/lib/log";

const log = logger("sanctions");

export const SANCTIONS_SOURCE = {
  name: "EU Consolidated Financial Sanctions List (European Commission)",
  url: "https://data.europa.eu/data/datasets/consolidated-list-of-persons-groups-and-entities-subject-to-eu-financial-sanctions",
  licence: "Free reuse (Commission Decision 2011/833/EU)",
} as const;

const CSV_URL = "https://webgate.ec.europa.eu/fsd/fsf/public/files/csvFullSanctionsList_1_1/content?token=dG9rZW4tMjAxNw";
const REFRESH_MS = 20 * 60 * 60 * 1000;
const MATCH_THRESHOLD = 0.8;

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
  | { ok: true; status: "clear" | "possible_match"; hits: SanctionsHit[]; checkedAt: string; listDate: string; source: typeof SANCTIONS_SOURCE }
  | { ok: false; reason: "not_loaded" | "unavailable" };

// Legal forms and filler words that say nothing about who the entity is.
const STOP = new Set([
  "ltd", "limited", "llc", "llp", "lp", "plc", "inc", "incorporated", "corp", "corporation", "co", "company", "the", "and", "of",
  "gmbh", "ag", "kg", "sa", "sas", "sarl", "srl", "spa", "bv", "nv", "oy", "ab", "as", "aps", "sro", "kft", "doo", "ad", "ood", "eood",
  "public", "joint", "stock", "open", "closed", "joint-stock", "society", "ooo", "oao", "zao", "pao", "ao", "jsc", "ojsc", "cjsc", "pjsc", "fze", "fzco", "dmcc", "ltda", "cv", "de", "llc.", "ε", "επε", "αε", "ike", "οε", "εε", "ооо", "оао", "зао", "пао", "ао", "тоо", "ип",
]);

/** Pure: lowercase, strip accents and punctuation, drop legal forms. */
export function nameTokens(name: string): string[] {
  const clean = name
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
  return [...new Set(clean.split(/\s+/).filter((t) => t.length > 1 && !STOP.has(t)))];
}

/** Pure: share of tokens in common, against the longer name. 1 = same name. */
export function nameScore(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const sb = new Set(b);
  const common = a.filter((t) => sb.has(t)).length;
  const overlap = common / Math.max(a.length, b.length);
  // One name fully inside the other ("Rosneft Aero" in "JSC Rosneft Aero Fuel") is worth a review
  // when the shorter name has at least two distinctive words.
  const contained = common === Math.min(a.length, b.length) && common >= 2;
  return Math.round(Math.max(overlap, contained ? 0.85 : 0) * 100) / 100;
}

export type ListRow = { entityId: string; name: string; tokens: string[]; subjectType: string; programme: string | null; country: string | null; designated: string | null; url: string | null };

/** Minimal `;`-separated CSV line splitter with quote support. */
function splitLine(line: string): string[] {
  const out: string[] = [];
  let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c;
    } else if (c === '"' && cur === "") q = true;
    else if (c === ";") { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

/** Pure: EU FSF CSV text → one row per distinct (entity, name). Throws on an unexpected file. */
export function parseEuCsv(text: string): { generated: string | null; rows: ListRow[] } {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  const head = splitLine(lines[0] ?? "");
  const col = (n: string) => head.indexOf(n);
  const ix = {
    gen: col("fileGenerationDate"), id: col("Entity_LogicalId"), type: col("Entity_SubjectType_ClassificationCode"),
    prog: col("Entity_Regulation_Programme"), date: col("Entity_DesignationDate"), url: col("Entity_Regulation_PublicationUrl"),
    name: col("NameAlias_WholeName"), cc: col("Address_CountryIso2Code"),
  };
  if (ix.id < 0 || ix.name < 0) throw new Error("Unexpected EU sanctions file layout");
  const seen = new Map<string, ListRow>();
  let generated: string | null = null;
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    const f = splitLine(lines[i]);
    const id = f[ix.id]?.trim(), name = f[ix.name]?.trim();
    if (!generated && ix.gen >= 0) generated = f[ix.gen]?.trim() || null;
    if (!id || !name) continue;
    const key = `${id}|${name.toLowerCase()}`;
    const cc = (f[ix.cc] || "").trim().toUpperCase();
    const existing = seen.get(key);
    if (existing) { if (!existing.country && /^[A-Z]{2}$/.test(cc)) existing.country = cc; continue; }
    const tokens = nameTokens(name);
    if (!tokens.length) continue;
    seen.set(key, {
      entityId: id, name: name.slice(0, 400), tokens,
      subjectType: (f[ix.type] || "").trim() || "unknown",
      programme: (f[ix.prog] || "").trim() || null,
      country: /^[A-Z]{2}$/.test(cc) ? cc : null,
      designated: /^\d{4}-\d{2}-\d{2}$/.test((f[ix.date] || "").trim()) ? f[ix.date].trim() : null,
      url: /^https:\/\//.test((f[ix.url] || "").trim()) ? f[ix.url].trim() : null,
    });
  }
  return { generated, rows: [...seen.values()] };
}

async function listState(): Promise<{ count: number; fetchedAt: Date | null; listDate: string | null }> {
  const [r] = (await db.execute(
    sql`SELECT count(*)::int AS count, max(fetched_at) AS fetched_at, max(list_date) AS list_date FROM eu_sanctions_names`,
  )) as unknown as { count: number; fetched_at: Date | null; list_date: string | null }[];
  return { count: r?.count ?? 0, fetchedAt: r?.fetched_at ? new Date(r.fetched_at) : null, listDate: r?.list_date ?? null };
}

/** Downloads the EU list and replaces the stored copy in one transaction. Skips if fresh unless forced. */
export async function refreshSanctionsList(force = false): Promise<{ skipped: boolean; names?: number; listDate?: string | null }> {
  const state = await listState();
  if (!force && state.count > 0 && state.fetchedAt && Date.now() - state.fetchedAt.getTime() < REFRESH_MS) return { skipped: true };
  const res = await fetch(CSV_URL, { signal: AbortSignal.timeout(45_000) });
  if (!res.ok) throw new Error(`EU sanctions list HTTP ${res.status}`);
  const { generated, rows } = parseEuCsv(await res.text());
  if (rows.length < 1000) throw new Error(`EU sanctions list looked truncated (${rows.length} names)`);
  const fetchedAt = new Date();
  await db.transaction(async (tx) => {
    await tx.delete(euSanctionsNames);
    for (let i = 0; i < rows.length; i += 1000) {
      await tx.insert(euSanctionsNames).values(rows.slice(i, i + 1000).map((r) => ({ ...r, listDate: generated, fetchedAt })));
    }
  });
  log.info("EU sanctions list refreshed", { names: rows.length, generated });
  return { skipped: false, names: rows.length, listDate: generated };
}

export async function screenCompany(input: { name: string; country?: string | null; registrationNo?: string | null }): Promise<SanctionsResult> {
  const query = nameTokens(input.name.slice(0, 200));
  if (!query.length) return { ok: true, status: "clear", hits: [], checkedAt: new Date().toISOString(), listDate: "", source: SANCTIONS_SOURCE };
  try {
    let state = await listState();
    if (state.count === 0) {
      // First use on a fresh database: load the list now rather than answer "clear" from nothing.
      await refreshSanctionsList(true).catch((e) => log.error("first load failed", e));
      state = await listState();
      if (state.count === 0) return { ok: false, reason: "not_loaded" };
    }
    const tokens = query.filter((t) => t.length >= 3);
    if (!tokens.length) tokens.push(...query);
    const rows = await db.select().from(euSanctionsNames)
      .where(sql`${euSanctionsNames.tokens} && ${sql.raw(`ARRAY[${tokens.map((t) => `'${t.replace(/'/g, "''")}'`).join(",")}]::text[]`)}`)
      .limit(2000);
    const best = new Map<string, SanctionsHit>();
    for (const r of rows) {
      const score = nameScore(query, r.tokens);
      if (score < MATCH_THRESHOLD) continue;
      const prev = best.get(r.entityId);
      if (prev && prev.score >= score) continue;
      best.set(r.entityId, {
        id: `eu-fsf:${r.entityId}`, name: r.name, score,
        schema: r.subjectType === "enterprise" ? "Company" : r.subjectType === "person" ? "Person" : "Thing",
        countries: r.country ? [r.country.toLowerCase()] : [],
        programs: r.programme ? [r.programme] : [],
        datasets: ["eu_fsf"],
        lastChange: r.designated,
        url: r.url ?? SANCTIONS_SOURCE.url,
      });
    }
    const hits = [...best.values()].sort((a, b) => b.score - a.score).slice(0, 5);
    return { ok: true, status: hits.length ? "possible_match" : "clear", hits, checkedAt: new Date().toISOString(), listDate: state.listDate ?? "", source: SANCTIONS_SOURCE };
  } catch (e) {
    log.error("screen failed", e);
    return { ok: false, reason: "unavailable" };
  }
}
