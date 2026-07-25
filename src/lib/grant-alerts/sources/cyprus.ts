import type { GrantSource, RawOpportunity } from "../types";

// Lightweight HTML scrapers for Cyprus national bodies. These sites are
// server-rendered listings, so a fetch + regex sweep is enough to surface
// new call titles/links between cron ticks. If the layout changes the
// fetcher returns [] and logs, without blocking the pipeline.

interface ScrapeConfig {
  source: GrantSource;
  url: string;
  linkPattern: RegExp; // must expose groups: href, title
  baseUrl: string;
}

const TARGETS: ScrapeConfig[] = [
  {
    source: "research-gov-cy",
    url: "https://www.research.gov.cy/en/calls-programmes/open-calls/",
    // <a href="/en/..." >Title</a>
    linkPattern: /<a[^>]+href="(?<href>\/en\/calls-programmes\/[^"']+)"[^>]*>(?<title>[^<]{6,180})<\/a>/gi,
    baseUrl: "https://www.research.gov.cy",
  },
  {
    source: "invest-cyprus",
    url: "https://www.investcyprus.org.cy/news-insights/",
    linkPattern: /<a[^>]+href="(?<href>https:\/\/www\.investcyprus\.org\.cy\/[^"']+)"[^>]*>(?<title>[^<]{10,200})<\/a>/gi,
    baseUrl: "https://www.investcyprus.org.cy",
  },
  {
    source: "kebe-oeb",
    url: "https://www.oeb.org.cy/en/news/",
    linkPattern: /<a[^>]+href="(?<href>https:\/\/www\.oeb\.org\.cy\/[^"']+)"[^>]*>(?<title>[^<]{10,200})<\/a>/gi,
    baseUrl: "https://www.oeb.org.cy",
  },
];

async function scrapeOne(cfg: ScrapeConfig): Promise<RawOpportunity[]> {
  try {
    const res = await fetch(cfg.url, {
      headers: { "User-Agent": "VerdeIQ-GrantAlerts/1.0 (+https://verdeiq.stauniverse.tech)" },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const html = await res.text();
    const out = new Map<string, RawOpportunity>();
    for (const m of html.matchAll(cfg.linkPattern)) {
      const href = m.groups?.href?.trim();
      const title = m.groups?.title?.replace(/\s+/g, " ").trim();
      if (!href || !title) continue;
      const url = href.startsWith("http") ? href : `${cfg.baseUrl}${href}`;
      const id = url.replace(/[?#].*$/, "");
      if (out.has(id)) continue;
      out.set(id, {
        source: cfg.source,
        externalId: id,
        title,
        summary: `${title} (source: ${cfg.source})`,
        url,
        deadline: null,
        program: null,
        publishedAt: null,
        tags: [],
      });
    }
    return [...out.values()].slice(0, 40);
  } catch (e) {
    console.warn(`[grant-alerts] scrape ${cfg.source} failed:`, (e as Error).message);
    return [];
  }
}

export async function fetchCyprusOpportunities(): Promise<RawOpportunity[]> {
  const results = await Promise.all(TARGETS.map(scrapeOne));
  return results.flat();
}
