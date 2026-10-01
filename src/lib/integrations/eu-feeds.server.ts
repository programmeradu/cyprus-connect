/**
 * Two official EU feeds, stored once and shared by every page and agent.
 *
 *  - TED (Tenders Electronic Daily): open contract notices from Cyprus
 *    buyers, via the public TED Search API v3 (no key). Notices whose CPV
 *    codes are energy, environmental or efficiency work are flagged `green`.
 *  - EUR-Lex: regulations, directives and decisions published in the last
 *    six months whose title touches climate, energy or reporting rules, via
 *    the Publications Office Cellar SPARQL endpoint (no key).
 *
 * Nothing here is estimated: every item is a record from the source with a
 * link back to it. When a source is down, the last stored copy is served and
 * the response says when it was fetched.
 */

import { and, desc, asc, eq, gte, lt, or, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { euFeedItems } from "@/db/schema";
import { logger } from "@/lib/log";

const log = logger("eu-feeds");
const TED_URL = "https://api.ted.europa.eu/v3/notices/search";
const SPARQL_URL = "https://publications.europa.eu/webapi/rdf/sparql";
const STALE_MS = 6 * 60 * 60 * 1000;
const TIMEOUT_MS = 25_000;

export type FeedItem = {
  id: string;
  source: "ted" | "eurlex";
  title: string;
  titleLang: string;
  /** Official Greek title (EUR-Lex), when published. */
  titleEl?: string | null;
  url: string;
  publishedAt: string;
  deadline: string | null;
  buyer: string | null;
  valueEur: number | null;
  actType: string | null;
  topics: string[];
  cpv: string[];
  green: boolean;
};

/* ------------------------------------------------------------------ topics */

/** Topic → title pattern. Order is display order. */
export const LAW_TOPICS: [string, RegExp][] = [
  ["CBAM", /\bCBAM\b|carbon border adjustment|Regulation \(EU\) 2023\/956/i],
  ["Sustainability reporting", /sustainability reporting|\bCSRD\b|\bESRS\b|\bVSME\b|Directive 2022\/2464|non-financial/i],
  ["EU Taxonomy", /taxonomy|Regulation \(EU\) 2020\/852/i],
  ["Due diligence", /due diligence|\bCSDDD\b|Directive \(EU\) 2024\/1760/i],
  ["Emissions trading", /emission allowance|emissions trading|\bETS\b|Directive 2003\/87/i],
  ["Greenhouse gases", /greenhouse|CO2|carbon dioxide|methane|fluorinated|F-gas|Regulation \(EU\) 2024\/573/i],
  ["Energy", /\benerg(y|ies)\b|electricity|renewable|efficiency|gas market|hydrogen/i],
  ["Batteries", /batter(y|ies)|primary cells|Regulation \(EU\) 2023\/1542/i],
  ["Ecodesign and products", /ecodesign|Directive 2009\/125|energy label|right to repair|Regulation \(EU\) 2024\/1781/i],
  ["Packaging and waste", /packaging|waste|circular/i],
  ["Deforestation", /deforestation|Regulation \(EU\) 2023\/1115/i],
  ["Climate", /climate/i],
];

/** Trade-defence and fisheries acts mention energy or batteries but set no rule a company must meet. */
const NOT_A_RULE = /anti-dumping|countervailing|surveillance of imports|subject to registration|fisheries|fishing/i;

export function topicsFor(title: string): string[] {
  if (NOT_A_RULE.test(title)) return [];
  // "European Atomic Energy Community" is an institution name, not an energy rule.
  const t = title.replace(/European Atomic Energy Community/gi, "");
  return LAW_TOPICS.filter(([, re]) => re.test(t)).map(([name]) => name);
}

/**
 * CPV divisions/groups that are sustainability work: energy and fuels (09),
 * electricity and meters (3155, 3855), solar and insulation works (45261215,
 * 4532), environmental and energy consultancy (71313, 71314), sewage, waste
 * and environmental services (904, 905, 907 — not 909 cleaning) and electric
 * vehicles (34144900). Documented so the flag is auditable.
 */
const GREEN_CPV = ["09", "3155", "3855", "45261215", "4532", "71313", "71314", "904", "905", "907", "34144900"];
export const isGreenCpv = (cpv: string[]) => cpv.some((c) => GREEN_CPV.some((p) => c.startsWith(p)));

/* ----------------------------------------------------------------- parsers */

const LANG_ORDER = ["eng", "ell"];
const ISO2: Record<string, string> = { eng: "en", ell: "el" };

/** TED returns `{ ell: "..." }` or `{ eng: ["..."] }`; prefer English, then Greek. */
function pickLang(v: unknown): { text: string; lang: string } | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, string | string[]>;
  const key = LANG_ORDER.find((k) => o[k]) ?? Object.keys(o)[0];
  if (!key) return null;
  const raw = o[key];
  const text = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  return text ? { text, lang: ISO2[key] ?? key.slice(0, 2) } : null;
}

const day = (s: unknown) => (typeof s === "string" && /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : null);

export function parseTedNotices(json: unknown): FeedItem[] {
  const notices = (json as { notices?: Record<string, unknown>[] })?.notices ?? [];
  const out: FeedItem[] = [];
  for (const n of notices) {
    const pub = String(n["publication-number"] ?? "");
    const title = pickLang(n["title-proc"]);
    const published = day(n["publication-date"]);
    if (!pub || !title || !published) continue;
    const deadlines = ((n["deadline-receipt-tender-date-lot"] as string[] | undefined) ?? []).map(day).filter((d): d is string => !!d).sort();
    const cpv = [...new Set(((n["classification-cpv"] as string[] | undefined) ?? []).map(String))];
    const value = n["estimated-value-cur-proc"] === "EUR" ? Number(n["estimated-value-proc"]) : NaN;
    out.push({
      id: `ted:${pub}`,
      source: "ted",
      title: title.text.slice(0, 500),
      titleLang: title.lang,
      url: `https://ted.europa.eu/${title.lang === "el" ? "el" : "en"}/notice/-/detail/${pub}`,
      publishedAt: published,
      deadline: deadlines[0] ?? null,
      buyer: pickLang(n["buyer-name"])?.text.slice(0, 200) ?? null,
      valueEur: Number.isFinite(value) && value > 0 ? value : null,
      actType: null,
      topics: [],
      cpv,
      green: isGreenCpv(cpv),
    });
  }
  return out;
}

const ACT: Record<string, string> = { R: "Regulation", L: "Directive", D: "Decision" };

export function parseEurLex(json: unknown): FeedItem[] {
  const rows = (json as { results?: { bindings?: Record<string, { value: string }>[] } })?.results?.bindings ?? [];
  const seen = new Set<string>();
  const out: FeedItem[] = [];
  for (const b of rows) {
    const celex = b.celex?.value;
    const title = b.title?.value?.replace(/\s+/g, " ").trim();
    const published = day(b.date?.value);
    if (!celex || !title || !published || seen.has(celex)) continue;
    seen.add(celex);
    const corrigendum = /R\(\d+\)$/.test(celex);
    const titleEl = b.titleEl?.value?.replace(/\s+/g, " ").trim() || null;
    out.push({
      id: `eurlex:${celex}`,
      source: "eurlex",
      title: title.slice(0, 600),
      titleLang: "en",
      titleEl: titleEl ? titleEl.slice(0, 600) : null,
      url: `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${encodeURIComponent(celex)}`,
      publishedAt: published,
      deadline: null,
      buyer: null,
      valueEur: null,
      actType: corrigendum ? "Corrigendum" : (ACT[celex[5]] ?? null),
      topics: topicsFor(title),
      cpv: [],
      green: true,
    });
  }
  return out;
}

/* ---------------------------------------------------------------- fetchers */

const ymd = (d: Date) => d.toISOString().slice(0, 10);

async function timed(url: string, init: RequestInit) {
  const r = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!r.ok) throw new Error(`${new URL(url).host} answered ${r.status}`);
  return r.json();
}

export async function fetchCyprusTenders(today = new Date()): Promise<FeedItem[]> {
  const items: FeedItem[] = [];
  for (let page = 1; page <= 4; page++) {
    const json = await timed(TED_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        query: `buyer-country=CYP AND notice-type IN (cn-standard cn-social) AND deadline-receipt-tender-date-lot>=${ymd(today).replace(/-/g, "")}`,
        fields: ["publication-number", "title-proc", "buyer-name", "publication-date", "deadline-receipt-tender-date-lot", "classification-cpv", "estimated-value-proc", "estimated-value-cur-proc"],
        limit: 100,
        page,
        paginationMode: "PAGE_NUMBER",
      }),
    });
    const batch = parseTedNotices(json);
    items.push(...batch);
    if (batch.length < 100) break;
  }
  return items;
}

const LAW_REGEX = "emission|carbon|CBAM|sustainab|taxonomy|energy|electricity|renewable|climate|greenhouse|due diligence|ecodesign|packaging|batter|deforestation|methane|fluorinated|waste";

export async function fetchEuLaw(today = new Date()): Promise<FeedItem[]> {
  const since = ymd(new Date(today.getTime() - 183 * 86_400_000));
  const query = `PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
SELECT DISTINCT ?celex ?date ?title ?titleEl WHERE {
  ?w cdm:resource_legal_id_celex ?celex ; cdm:work_date_document ?date .
  FILTER(?date >= "${since}"^^xsd:date)
  FILTER(REGEX(STR(?celex), "^3[0-9]{4}[RLD]"))
  ?e cdm:expression_belongs_to_work ?w ; cdm:expression_title ?title ;
     cdm:expression_uses_language <http://publications.europa.eu/resource/authority/language/ENG> .
  FILTER(REGEX(?title, "${LAW_REGEX}", "i"))
  OPTIONAL {
    ?eel cdm:expression_belongs_to_work ?w ; cdm:expression_title ?titleEl ;
         cdm:expression_uses_language <http://publications.europa.eu/resource/authority/language/ELL> .
  }
} ORDER BY DESC(?date) LIMIT 300`;
  const json = await timed(SPARQL_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/sparql-results+json" },
    body: new URLSearchParams({ query }).toString(),
  });
  // Keep only acts that match a named topic, so "energy" in an unrelated title is not noise.
  return parseEurLex(json).filter((i) => i.topics.length > 0);
}

/* ----------------------------------------------------------------- storage */

async function store(items: FeedItem[]) {
  const now = new Date();
  for (let i = 0; i < items.length; i += 100) {
    const chunk = items.slice(i, i + 100).map((x) => ({
      id: x.id,
      source: x.source,
      title: x.title,
      titleLang: x.titleLang,
      titleEl: x.titleEl ?? null,
      url: x.url,
      publishedAt: x.publishedAt,
      deadline: x.deadline,
      buyer: x.buyer,
      valueEur: x.valueEur === null ? null : String(x.valueEur),
      actType: x.actType,
      topics: x.topics,
      cpv: x.cpv,
      green: x.green,
      fetchedAt: now,
    }));
    await db
      .insert(euFeedItems)
      .values(chunk)
      .onConflictDoUpdate({
        target: euFeedItems.id,
        set: {
          title: sql`excluded.title`, titleEl: sql`coalesce(excluded.title_el, ${euFeedItems.titleEl})`, url: sql`excluded.url`, deadline: sql`excluded.deadline`, buyer: sql`excluded.buyer`,
          valueEur: sql`excluded.value_eur`, actType: sql`excluded.act_type`, topics: sql`excluded.topics`, cpv: sql`excluded.cpv`,
          green: sql`excluded.green`, fetchedAt: sql`excluded.fetched_at`,
        },
      });
  }
}

export type RefreshResult = { tenders: number | string; law: number | string };

/** Fetches both feeds and stores them. One failing source never blocks the other. */
export async function refreshEuFeeds(today = new Date()): Promise<RefreshResult> {
  const [t, l] = await Promise.allSettled([fetchCyprusTenders(today), fetchEuLaw(today)]);
  const result: RefreshResult = { tenders: "unavailable", law: "unavailable" };
  if (t.status === "fulfilled") { await store(t.value); result.tenders = t.value.length; } else log.error("TED fetch failed", t.reason);
  if (l.status === "fulfilled") { await store(l.value); result.law = l.value.length; } else log.error("EUR-Lex fetch failed", l.reason);
  // Closed tenders and acts older than a year leave the shared copy.
  await db.delete(euFeedItems).where(
    or(
      and(eq(euFeedItems.source, "ted"), lt(euFeedItems.deadline, ymd(today))),
      and(eq(euFeedItems.source, "eurlex"), lt(euFeedItems.publishedAt, ymd(new Date(today.getTime() - 365 * 86_400_000)))),
    ),
  );
  return result;
}

let inflight: Promise<RefreshResult> | null = null;

export type FeedRead = { items: FeedItem[]; fetchedAt: string | null; total: number };

/**
 * Reads one feed. If the stored copy is older than six hours (or empty) it is
 * refreshed first; a failed refresh falls back to what is stored.
 */
export async function readEuFeed(source: "ted" | "eurlex", opts: { greenOnly?: boolean; topic?: string; limit?: number } = {}): Promise<FeedRead> {
  const [latest] = await db
    .select({ at: sql<Date | null>`max(${euFeedItems.fetchedAt})` })
    .from(euFeedItems)
    .where(eq(euFeedItems.source, source));
  const at = latest?.at ? new Date(latest.at) : null;
  if (!at || Date.now() - at.getTime() > STALE_MS) {
    inflight ??= refreshEuFeeds().finally(() => { inflight = null; });
    try { await inflight; } catch (e) { log.error("refresh on read failed", e); }
  }

  const today = ymd(new Date());
  const conds = [eq(euFeedItems.source, source)];
  if (source === "ted") conds.push(or(isNull(euFeedItems.deadline), gte(euFeedItems.deadline, today))!);
  if (opts.greenOnly) conds.push(eq(euFeedItems.green, true));
  if (opts.topic) conds.push(sql`${opts.topic} = ANY(${euFeedItems.topics})`);
  const rows = await db
    .select()
    .from(euFeedItems)
    .where(and(...conds))
    .orderBy(source === "ted" ? asc(euFeedItems.deadline) : desc(euFeedItems.publishedAt))
    .limit(Math.min(opts.limit ?? 100, 300));
  const [{ fetched }] = await db
    .select({ fetched: sql<Date | null>`max(${euFeedItems.fetchedAt})` })
    .from(euFeedItems)
    .where(eq(euFeedItems.source, source));
  return {
    total: rows.length,
    fetchedAt: fetched ? new Date(fetched).toISOString() : null,
    items: rows.map((r) => ({
      id: r.id,
      source: r.source as FeedItem["source"],
      title: r.title,
      titleLang: r.titleLang,
      titleEl: r.titleEl ?? null,
      url: r.url,
      publishedAt: String(r.publishedAt),
      deadline: r.deadline ? String(r.deadline) : null,
      buyer: r.buyer,
      valueEur: r.valueEur === null ? null : Number(r.valueEur),
      actType: r.actType,
      topics: r.topics ?? [],
      cpv: r.cpv ?? [],
      green: r.green,
    })),
  };
}
