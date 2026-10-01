/**
 * WikiRate: figures companies have published themselves (emissions, energy,
 * staff, climate targets), each linked to the answer page that cites the
 * company's own report. CC BY 4.0. Needs WIKIRATE_API_KEY.
 *
 * What it is good for:
 *   - Supplier check: has a (usually large) supplier already published its
 *     emissions? Then nobody needs to email them for it.
 *   - Peer comparison: emissions per employee of named companies, set
 *     against the workspace's own measured figure.
 *
 * What it is not: SME data. Almost no small Cypriot firm is in it, and its
 * country filter finds only a handful of Cyprus disclosers. Every answer
 * carries the company, year, unit and source link; nothing is estimated.
 */

import { logger } from "@/lib/log";

const log = logger("lib.integrations.wikirate");
const BASE = "https://wikirate.org";
const TIMEOUT_MS = 12_000;
const TTL_MS = 12 * 60 * 60 * 1000;
const MAX_PAGES = 5;
export const WIKIRATE_SOURCE = "WikiRate.org (CC BY 4.0), company-published figures";

export type FigureKey = "scope1" | "scope2" | "scope3" | "employees" | "energy" | "sbtiTarget";

/** Which WikiRate metrics answer each figure, best first. Sourced GRI answers before community ones. */
const METRICS: Record<FigureKey, RegExp[]> = {
  scope1: [/^Global Reporting Initiative\+Direct greenhouse gas \(GHG\) emissions \(Scope 1\)/i, /^Commons\+Greenhouse Gas Emissions Scope 1$/i],
  scope2: [/^Global Reporting Initiative\+Indirect greenhouse gas \(GHG\) emissions \(Scope 2\)/i, /^Commons\+Greenhouse Gas Emissions Scope 2$/i],
  scope3: [/^Global Reporting Initiative\+Indirect greenhouse gas \(GHG\) emissions \(Scope 3\)/i, /^Commons\+Greenhouse Gas Emissions Scope 3$/i],
  employees: [/^Commons\+Employee$/i],
  energy: [/^Commons\+Energy Consumption$/i],
  sbtiTarget: [/^Science Based Targets Initiative \(SBTi\)\+Near term target classification - Scope 1\+2$/i],
};
const NUMERIC: Record<FigureKey, boolean> = {
  scope1: true, scope2: true, scope3: true, employees: true, energy: true, sbtiTarget: false,
};

export interface Figure {
  key: FigureKey;
  value: number | string;
  unit: string | null;
  year: number;
  metric: string;
  sourceUrl: string;
}

export interface WikiRateCompany {
  name: string;
  url: string;
  headquarters: string | null;
  website: string | null;
}

export type WikiRateFailure = "not_configured" | "not_found" | "unavailable";

const cache = new Map<string, { at: number; value: unknown }>();

function apiKey(): string | null {
  return process.env.WIKIRATE_API_KEY?.trim() || null;
}

export function wikiRateConfigured(): boolean {
  return apiKey() !== null;
}

async function getJson<T>(path: string): Promise<T | null> {
  const key = apiKey();
  if (!key) throw new Error("not_configured");
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value as T;
  const res = await fetch(url, {
    headers: { "X-API-Key": key, Accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`WikiRate ${res.status}`);
  const value = (await res.json()) as T;
  cache.set(url, { at: Date.now(), value });
  return value;
}

/** WikiRate card names use underscores for spaces. */
export function cardName(name: string): string {
  return encodeURIComponent(name.trim().replace(/\s+/g, "_")).replace(/%2B/gi, "+");
}

interface CompanyCard {
  name?: string;
  url?: string;
  type?: { codename?: string; name?: string } | string;
  headquarters?: string | null;
  website?: string | null;
}

const isCompany = (c: CompanyCard | null): c is CompanyCard =>
  Boolean(c?.name) && (typeof c?.type === "string" ? c.type === "Company" : c?.type?.codename === "company" || c?.type?.name === "Company");

function toCompany(c: CompanyCard): WikiRateCompany {
  const hq = typeof c.headquarters === "string" ? c.headquarters : null;
  const site = typeof c.website === "string" ? c.website : null;
  return { name: c.name ?? "", url: (c.url ?? `${BASE}/${cardName(c.name ?? "")}`).replace(/\.json$/, ""), headquarters: hq, website: site };
}

/** Find a company: the exact card first, then WikiRate's name search. Returns up to 5 candidates. */
export async function findWikiRateCompany(
  name: string,
): Promise<{ ok: true; exact: WikiRateCompany | null; candidates: WikiRateCompany[] } | { ok: false; reason: WikiRateFailure }> {
  if (!apiKey()) return { ok: false, reason: "not_configured" };
  const q = name.trim().slice(0, 160);
  if (q.length < 2) return { ok: false, reason: "not_found" };
  try {
    const [card, search] = await Promise.all([
      getJson<CompanyCard>(`/${cardName(q)}.json`).catch(() => null),
      getJson<{ items?: CompanyCard[] }>(`/Company.json?limit=5&filter%5Bname%5D=${encodeURIComponent(q)}`),
    ]);
    const exact = isCompany(card) ? toCompany(card) : null;
    const candidates = (search?.items ?? []).filter((c) => c.name).map(toCompany);
    const lower = q.toLowerCase();
    const byName = exact ?? candidates.find((c) => c.name.toLowerCase() === lower) ?? null;
    if (!byName && candidates.length === 0) return { ok: false, reason: "not_found" };
    return { ok: true, exact: byName, candidates: candidates.filter((c) => c.name !== byName?.name).slice(0, 5) };
  } catch (error) {
    log.warn("WikiRate company search failed", { errorMessage: error instanceof Error ? error.message : String(error) });
    return { ok: false, reason: "unavailable" };
  }
}

interface AnswerRow {
  metric?: string;
  year?: number;
  value?: string | number | null;
  unit?: string | null;
  answer_url?: string;
  url?: string;
}

function numberOf(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string") return null;
  const n = Number(v.replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
}

/** Pick the best answer per figure: preferred metric first, then latest year with a usable value. */
export function pickFigures(rows: AnswerRow[]): Partial<Record<FigureKey, Figure>> {
  const out: Partial<Record<FigureKey, Figure>> = {};
  for (const key of Object.keys(METRICS) as FigureKey[]) {
    for (const re of METRICS[key]) {
      const usable = rows
        .filter((r) => r.metric && re.test(r.metric) && typeof r.year === "number")
        .map((r) => {
          const n = numberOf(r.value);
          // A zero total for a reporting multinational is a placeholder, not a figure.
          const value = NUMERIC[key] ? (n !== null && n > 0 ? n : null) : typeof r.value === "string" && r.value.trim() && !/^(NA|Unknown|Not disclosed)$/i.test(r.value.trim()) ? r.value.trim() : null;
          return value === null ? null : { r, value };
        })
        .filter((x): x is { r: AnswerRow; value: number | string } => x !== null)
        .sort((a, b) => (b.r.year ?? 0) - (a.r.year ?? 0));
      const best = usable[0];
      if (best) {
        out[key] = {
          key,
          value: best.value,
          unit: best.r.unit?.trim() || null,
          year: best.r.year as number,
          metric: best.r.metric as string,
          sourceUrl: (best.r.answer_url ?? best.r.url ?? "").replace(/\.json$/, ""),
        };
        break;
      }
    }
  }
  return out;
}

/** Published figures for one company (exact WikiRate name). */
export async function wikiRateFigures(
  companyName: string,
): Promise<{ ok: true; company: string; figures: Partial<Record<FigureKey, Figure>>; answersRead: number } | { ok: false; reason: WikiRateFailure }> {
  if (!apiKey()) return { ok: false, reason: "not_configured" };
  const card = cardName(companyName);
  try {
    const rows: AnswerRow[] = [];
    for (let page = 0; page < MAX_PAGES; page++) {
      const body = await getJson<{ items?: AnswerRow[] }>(`/${card}+Answer.json?limit=200&offset=${page * 200}`);
      if (body === null) return { ok: false, reason: "not_found" };
      const items = body.items ?? [];
      rows.push(...items);
      if (items.length < 200) break;
    }
    if (rows.length === 0) return { ok: false, reason: "not_found" };
    return { ok: true, company: companyName.trim(), figures: pickFigures(rows), answersRead: rows.length };
  } catch (error) {
    log.warn("WikiRate figures failed", { errorMessage: error instanceof Error ? error.message : String(error) });
    return { ok: false, reason: "unavailable" };
  }
}

export interface PeerRow {
  company: string;
  status: "compared" | "not_found" | "no_figures" | "unavailable";
  /** Scope 1 + 2 in tonnes CO2e, same year as employees when possible. */
  scope12Tonnes: number | null;
  employees: number | null;
  year: number | null;
  tonnesPerEmployee: number | null;
  sources: string[];
}

/** Median of a non-empty list. */
export function median(values: number[]): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Tonnes CO2e multiplier for a reported unit, or null when the unit is not a mass of CO2e we can trust. */
export function tonnesFactor(unit: string | null): number | null {
  const u = (unit ?? "").toLowerCase();
  if (!u) return 1; // GRI metrics are defined in tonnes CO2e
  if (/\b(kt|kilo ?tonnes?|thousand tonnes)\b/.test(u)) return 1000;
  if (/\b(mt|million tonnes|megatonnes?)\b/.test(u)) return 1_000_000;
  if (/\b(kg|kilograms?)\b/.test(u)) return 0.001;
  if (/(tonne|ton|\bt\b|tco2)/.test(u)) return 1;
  return null;
}

export function peerFromFigures(company: string, f: Partial<Record<FigureKey, Figure>>): PeerRow {
  const raw1 = typeof f.scope1?.value === "number" ? f.scope1 : null;
  const raw2 = typeof f.scope2?.value === "number" ? f.scope2 : null;
  const k1 = raw1 ? tonnesFactor(raw1.unit) : null;
  const k2 = raw2 ? tonnesFactor(raw2.unit) : null;
  const s1 = raw1 && k1 !== null ? { ...raw1, value: (raw1.value as number) * k1 } : null;
  const s2 = raw2 && k2 !== null ? { ...raw2, value: (raw2.value as number) * k2 } : null;
  const empRaw = typeof f.employees?.value === "number" ? f.employees : null;
  // Head count must be within a year of the emissions figure, or the ratio means nothing.
  const emp = empRaw && s1 && Math.abs(empRaw.year - s1.year) <= 1 ? empRaw : null;
  if (!s1 || !emp) {
    return { company, status: "no_figures", scope12Tonnes: null, employees: null, year: null, tonnesPerEmployee: null, sources: [] };
  }
  // Scope 2 counts only when it is from the same year as Scope 1.
  const scope12 = (s1.value as number) + (s2 && s2.year === s1.year ? (s2.value as number) : 0);
  return {
    company,
    status: "compared",
    scope12Tonnes: scope12,
    employees: emp.value as number,
    year: s1.year,
    tonnesPerEmployee: scope12 / (emp.value as number),
    sources: [s1.sourceUrl, s2 && s2.year === s1.year ? s2.sourceUrl : null, emp.sourceUrl].filter((u): u is string => Boolean(u)),
  };
}

/** Emissions per employee for named peers, against the workspace's own figure when it has one. */
export async function comparePeers(input: {
  peers: string[];
  ownScope12Tonnes: number | null;
  ownEmployees: number | null;
  /** Months of own readings behind ownScope12Tonnes. Peers report full years, so fewer than 12 is not compared. */
  ownMonths: number;
}): Promise<
  | {
      ok: true;
      peers: PeerRow[];
      peerMedian: number | null;
      own: number | null;
      ownVsMedianPct: number | null;
      caveat: string;
    }
  | { ok: false; reason: "not_configured" }
> {
  if (!apiKey()) return { ok: false, reason: "not_configured" };
  const names = [...new Set(input.peers.map((p) => p.trim()).filter(Boolean))].slice(0, 8);
  const peers = await Promise.all(
    names.map(async (name): Promise<PeerRow> => {
      const r = await wikiRateFigures(name);
      if (!r.ok) {
        return { company: name, status: r.reason === "not_found" ? "not_found" : "unavailable", scope12Tonnes: null, employees: null, year: null, tonnesPerEmployee: null, sources: [] };
      }
      return peerFromFigures(name, r.figures);
    }),
  );
  const compared = peers.filter((p) => p.tonnesPerEmployee !== null).map((p) => p.tonnesPerEmployee as number);
  const peerMedian = median(compared);
  const own =
    input.ownScope12Tonnes !== null && input.ownMonths >= 12 && input.ownEmployees && input.ownEmployees > 0
      ? input.ownScope12Tonnes / input.ownEmployees
      : null;
  return {
    ok: true,
    peers,
    peerMedian,
    own,
    ownVsMedianPct: own !== null && peerMedian ? ((own - peerMedian) / peerMedian) * 100 : null,
    caveat:
      (input.ownScope12Tonnes !== null && input.ownMonths < 12 ? "Your own figure covers fewer than 12 months, so it is not compared with peers' full-year totals. " : "") + "Peers are companies that publish reports, usually far larger than an SME. Use the comparison as direction, not as a target, and say so wherever it is shown.",
  };
}
