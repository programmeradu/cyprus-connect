/**
 * Reference feeds read for the Integrations page: Climate TRACE (country and
 * sector totals), CyStat (Cyprus establishments by NACE section) and
 * WikiRate (company-reported ESG answers, needs WIKIRATE_API_KEY).
 *
 * Each feed answers with real figures or with a stated reason. Nothing is
 * filled in when a feed is silent. Answers are held in memory for a few hours
 * per worker so a page visit does not hit the public services every time.
 */

import { logger } from "@/lib/log";

const log = logger("lib.integrations.reference");
const TTL_MS = 6 * 60 * 60 * 1000;
const TIMEOUT_MS = 8000;

const cache = new Map<string, { at: number; value: unknown }>();

async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value as T;
  const value = await load();
  cache.set(key, { at: Date.now(), value });
  return value;
}

async function getJson(url: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${body.slice(0, 200)}`);
  }
  return res.json();
}

/* ------------------------------------------------------------ Climate TRACE */

const ISO3: Record<string, string> = { CY: "CYP", GR: "GRC", DE: "DEU", FR: "FRA", IT: "ITA", ES: "ESP", MT: "MLT" };
const CT_SECTORS = ["power", "transportation", "buildings", "manufacturing", "waste", "agriculture"] as const;
export type ClimateTraceSector = (typeof CT_SECTORS)[number];

export interface ClimateTraceSummary {
  country: string;
  year: number;
  totalTonnes: number;
  worldSharePct: number;
  rank: number;
  sectors: { sector: ClimateTraceSector; tonnes: number }[];
}

interface CtRow {
  rank?: number;
  emissions?: { co2e_100yr?: number };
  worldEmissions?: { co2e_100yr?: number };
}

/** The last full year Climate TRACE publishes: two years back. */
export function climateTraceYear(now = new Date()): number {
  return now.getUTCFullYear() - 2;
}

export async function climateTraceSummary(countryCode: string): Promise<
  { data: ClimateTraceSummary; reason: null } | { data: null; reason: "unsupported" | "unavailable" }
> {
  const iso3 = ISO3[countryCode.toUpperCase()];
  if (!iso3) return { data: null, reason: "unsupported" };
  const year = climateTraceYear();
  try {
    const data = await cached(`ct:${iso3}:${year}`, async () => {
      const base = `https://api.climatetrace.org/v6/country/emissions?countries=${iso3}&since=${year}&to=${year + 1}`;
      const [totalRows, ...sectorRows] = (await Promise.all([
        getJson(base),
        ...CT_SECTORS.map((s) => getJson(`${base}&sectors=${s}`)),
      ])) as CtRow[][];
      const total = totalRows?.[0];
      const tonnes = total?.emissions?.co2e_100yr;
      const world = total?.worldEmissions?.co2e_100yr;
      if (!total || typeof tonnes !== "number" || !tonnes || typeof world !== "number" || !world) {
        throw new Error("no country total in answer");
      }
      const sectors = CT_SECTORS.map((sector, i) => ({ sector, tonnes: sectorRows[i]?.[0]?.emissions?.co2e_100yr ?? 0 }))
        .filter((s) => s.tonnes > 0)
        .sort((a, b) => b.tonnes - a.tonnes);
      return {
        country: countryCode.toUpperCase(),
        year,
        totalTonnes: tonnes,
        worldSharePct: (tonnes / world) * 100,
        rank: total.rank ?? 0,
        sectors,
      } satisfies ClimateTraceSummary;
    });
    return { data, reason: null };
  } catch (error) {
    log.warn("Climate TRACE read failed", { errorMessage: error instanceof Error ? error.message : String(error) });
    return { data: null, reason: "unavailable" };
  }
}

/* ------------------------------------------------------------------- CyStat */

const CYSTAT_TABLE =
  "https://cystatdb.cystat.gov.cy/api/v1/en/8.CYSTAT-DB/Business%20Register/1600010E.px";

/** Onboarding sector → NACE Rev. 2 section. */
export const INDUSTRY_TO_NACE: Record<string, string> = {
  technology: "J",
  manufacturing: "C",
  retail: "G",
  hospitality: "I",
  healthcare: "Q",
  finance: "K",
};

export interface CyStatSummary {
  year: string;
  total: number;
  sections: { code: string; label: string; count: number }[];
  own: { code: string; label: string; count: number; sharePct: number } | null;
  updated: string | null;
}

interface JsonStat {
  id?: string[];
  size?: number[];
  value?: (number | null)[];
  updated?: string;
  dimension?: Record<string, { category?: { index?: Record<string, number>; label?: Record<string, string> } }>;
}

/** Pure parser, exported for tests. */
export function parseCyStat(ds: JsonStat, industry: string | null): CyStatSummary {
  const nace = ds.dimension?.["ECONOMIC ACTIVITY (NACE Rev"]?.category;
  const yearCat = ds.dimension?.YEAR?.category;
  const values = ds.value ?? [];
  if (!nace?.index || !nace.label || !yearCat?.label) throw new Error("unexpected CyStat shape");
  // The answer holds one cell per municipality × year × section. Sum every
  // cell that belongs to a section, so the figures cover all of Cyprus.
  const ids = ds.id ?? [];
  const size = ds.size ?? [];
  const naceAxis = ids.indexOf("ECONOMIC ACTIVITY (NACE Rev");
  const perSection = new Map<number, number>();
  if (naceAxis >= 0 && size.length === ids.length) {
    const stride = size.slice(naceAxis + 1).reduce((a, b) => a * b, 1);
    values.forEach((v, flat) => {
      const i = Math.floor(flat / stride) % size[naceAxis];
      perSection.set(i, (perSection.get(i) ?? 0) + Number(v ?? 0));
    });
  } else {
    values.forEach((v, i) => perSection.set(i, Number(v ?? 0)));
  }
  const year = Object.values(yearCat.label)[0] ?? "";
  const rows = Object.entries(nace.index)
    .map(([code, i]) => ({
      code,
      label: (nace.label?.[code] ?? code).replace(/^[A-Z](-[A-Z])?\s+/, ""),
      count: perSection.get(i) ?? 0,
    }));
  const totalRow = rows.find((r) => r.code === "A-T");
  const sections = rows.filter((r) => r.code !== "A-T");
  const total = totalRow?.count ?? sections.reduce((s, r) => s + r.count, 0);
  const ownCode = industry ? INDUSTRY_TO_NACE[industry.toLowerCase()] : undefined;
  const ownRow = ownCode ? sections.find((r) => r.code === ownCode) : undefined;
  return {
    year,
    total,
    sections: sections.sort((a, b) => b.count - a.count),
    own: ownRow && total ? { ...ownRow, sharePct: (ownRow.count / total) * 100 } : null,
    updated: ds.updated ?? null,
  };
}

export async function cyStatSummary(industry: string | null): Promise<
  { data: CyStatSummary; reason: null } | { data: null; reason: "unavailable" }
> {
  try {
    const ds = await cached("cystat:1600010", () =>
      getJson(CYSTAT_TABLE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Leaving the municipality out makes CyStat sum it: all of Cyprus.
        body: JSON.stringify({
          query: [{ code: "YEAR", selection: { filter: "top", values: ["1"] } }],
          response: { format: "json-stat2" },
        }),
      }),
    );
    return { data: parseCyStat(ds as JsonStat, industry), reason: null };
  } catch (error) {
    log.warn("CyStat read failed", { errorMessage: error instanceof Error ? error.message : String(error) });
    return { data: null, reason: "unavailable" };
  }
}

/* ----------------------------------------------------------------- WikiRate */

export interface WikiRateSummary {
  configured: boolean;
  /** Companies WikiRate lists with headquarters in Cyprus. */
  cyprusCompanies: number | null;
  sample: string[];
  reason: "not_configured" | "unavailable" | null;
}

export async function wikiRateSummary(): Promise<WikiRateSummary> {
  const key = process.env.WIKIRATE_API_KEY?.trim();
  if (!key) return { configured: false, cyprusCompanies: null, sample: [], reason: "not_configured" };
  try {
    const rows = await cached("wikirate:cy", async () => {
      const url = "https://wikirate.org/Company.json?limit=100&filter%5Bheadquarters%5D%5B%5D=Cyprus";
      const data = (await getJson(url, { headers: { "X-API-Key": key, Accept: "application/json" } })) as {
        items?: { name?: string }[];
      };
      return (data.items ?? []).map((i) => i.name ?? "").filter(Boolean);
    });
    return { configured: true, cyprusCompanies: rows.length, sample: rows.slice(0, 5), reason: null };
  } catch (error) {
    log.warn("WikiRate read failed", { errorMessage: error instanceof Error ? error.message : String(error) });
    return { configured: true, cyprusCompanies: null, sample: [], reason: "unavailable" };
  }
}
