import type { RawOpportunity } from "../types";

// EU Funding & Tenders Portal (SEDIA) public search API.
// Docs: https://webgate.ec.europa.eu/funding-tenders-opportunities/  (search-api)
// Returns forthcoming/open topics across Horizon Europe, LIFE, Innovation Fund, EIC, etc.
const ENDPOINT =
  "https://api.tech.ec.europa.eu/search-api/prod/rest/search?apiKey=SEDIA&text=***&pageSize=50&pageNumber=1";

interface SediaHit {
  reference?: string;
  metadata?: Record<string, string[] | string | undefined>;
  content?: string;
  language?: string[];
  url?: string;
}

function pick(md: Record<string, any> | undefined, key: string): string | undefined {
  const v = md?.[key];
  if (Array.isArray(v)) return v[0];
  return typeof v === "string" ? v : undefined;
}

export async function fetchEuFundingOpportunities(): Promise<RawOpportunity[]> {
  const body = new URLSearchParams();
  body.set(
    "query",
    JSON.stringify({
      bool: {
        must: [
          { terms: { type: ["1", "2", "8"] } }, // calls / topics
          { terms: { status: ["31094501", "31094502"] } }, // Forthcoming, Open
        ],
      },
    }),
  );
  body.set("languages", JSON.stringify(["en"]));

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    // Short cache — the cron drives freshness.
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`EU F&T search failed: ${res.status}`);
  }
  const json = (await res.json().catch(() => ({}))) as { results?: SediaHit[] };
  const hits = json.results ?? [];

  return hits
    .map<RawOpportunity | null>((h) => {
      const md = h.metadata ?? {};
      const id =
        (Array.isArray(md.identifier) ? md.identifier[0] : (md.identifier as string)) ||
        h.reference;
      const title =
        pick(md, "title") ||
        pick(md, "callTitle") ||
        pick(md, "topicTitle") ||
        "";
      if (!id || !title) return null;
      const deadline = pick(md, "deadlineDate") || pick(md, "deadlineDatesLong");
      const program = pick(md, "frameworkProgramme") || pick(md, "programmePeriod");
      const url =
        h.url ||
        `https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/${id}`;
      return {
        source: "eu-funding-tenders",
        externalId: String(id),
        title: String(title),
        summary: (h.content || pick(md, "descriptionByte") || "").slice(0, 1200),
        url,
        deadline: deadline ? String(deadline) : null,
        program: program ? String(program) : null,
        publishedAt: pick(md, "startDate") || null,
        tags: [],
      };
    })
    .filter(Boolean) as RawOpportunity[];
}
