import type { RawOpportunity } from "../types";

// EU Funding & Tenders Portal (SEDIA) public search API. The filter only takes
// effect when query/languages/sort are sent as multipart JSON parts; sent as
// plain form fields the API ignores them and returns closed calls from 2016.
// We run a few topic searches that matter to Cypriot SMEs, keep open or
// forthcoming calls, and keep the next deadline that has not passed.
const ENDPOINT = "https://api.tech.ec.europa.eu/search-api/prod/rest/search";

const SEARCHES = [
  "energy efficiency SME",
  "decarbonisation",
  "circular economy SME",
  "renewable energy",
  "climate",
  "sustainability reporting",
];

interface SediaHit {
  reference?: string;
  metadata?: Record<string, string[] | string | undefined>;
  content?: string;
  summary?: string;
}

function pick(md: Record<string, unknown> | undefined, key: string): string | undefined {
  const v = md?.[key];
  if (Array.isArray(v)) return typeof v[0] === "string" ? v[0] : undefined;
  return typeof v === "string" ? v : undefined;
}

function all(md: Record<string, unknown> | undefined, key: string): string[] {
  const v = md?.[key];
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : typeof v === "string" ? [v] : [];
}

function json(value: unknown): Blob {
  return new Blob([JSON.stringify(value)], { type: "application/json" });
}

async function search(text: string): Promise<SediaHit[]> {
  const form = new FormData();
  form.append("query", json({
    bool: {
      must: [
        { terms: { type: ["1", "2", "8"] } }, // calls, topics, cascade funding
        { terms: { status: ["31094501", "31094502"] } }, // forthcoming, open
      ],
    },
  }));
  form.append("languages", json(["en"]));
  form.append("sort", json({ field: "sortStatus", order: "ASC" }));
  const url = `${ENDPOINT}?apiKey=SEDIA&text=${encodeURIComponent(text)}&pageSize=30&pageNumber=1`;
  const res = await fetch(url, { method: "POST", body: form, cache: "no-store" });
  if (!res.ok) throw new Error(`EU F&T search failed: ${res.status}`);
  const body = (await res.json().catch(() => ({}))) as { results?: SediaHit[] };
  return body.results ?? [];
}

export async function fetchEuFundingOpportunities(): Promise<RawOpportunity[]> {
  const today = new Date().toISOString().slice(0, 10);
  const results = await Promise.allSettled(SEARCHES.map(search));
  if (results.every((r) => r.status === "rejected")) {
    throw (results[0] as PromiseRejectedResult).reason;
  }
  const out = new Map<string, RawOpportunity>();
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const h of r.value) {
      const md = h.metadata ?? {};
      const identifier = pick(md, "identifier");
      const callTitle = pick(md, "callTitle");
      const title = pick(md, "title") || callTitle || "";
      const id = h.reference || identifier;
      if (!id || !title || out.has(id)) continue;
      const deadlines = all(md, "deadlineDate").map((d) => d.slice(0, 10)).filter((d) => d >= today).sort();
      if (all(md, "deadlineDate").length > 0 && deadlines.length === 0) continue; // closed
      // Cascade calls (one consortium re-granting to SMEs) share the topic id;
      // their own call title is the useful name.
      const isCascade = pick(md, "type") === "8";
      const name = isCascade && callTitle ? callTitle : title;
      const url = identifier
        ? `https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/${identifier}`
        : "https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/calls-for-proposals";
      out.set(id, {
        source: "eu-funding-tenders",
        externalId: String(id),
        title: name.trim(),
        summary: `${isCascade ? `${title}. ` : ""}${(pick(md, "descriptionByte") || h.summary || h.content || "").replace(/<[^>]+>/g, " ")}`.slice(0, 1200),
        url,
        deadline: deadlines[0] ?? null,
        program: identifier ?? null,
        publishedAt: pick(md, "startDate") || null,
        tags: ["eu27"],
      });
    }
  }
  return [...out.values()];
}
