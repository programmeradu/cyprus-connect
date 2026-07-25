import type { RawOpportunity } from "../types";

// Curated climate/sustainability accelerator open-call feeds. Kept small and
// resilient — each entry pulls a listing page and extracts cohort/programme
// links. Add more over time.

const FEEDS: { url: string; program: string; linkPattern: RegExp; base: string }[] = [
  {
    url: "https://www.climate-kic.org/programmes/",
    program: "EIT Climate-KIC",
    linkPattern: /<a[^>]+href="(?<href>https:\/\/www\.climate-kic\.org\/programmes\/[^"']+)"[^>]*>(?<title>[^<]{6,200})<\/a>/gi,
    base: "https://www.climate-kic.org",
  },
  {
    url: "https://katapult.vc/programs/",
    program: "Katapult",
    linkPattern: /<a[^>]+href="(?<href>https:\/\/katapult\.vc\/[^"']+)"[^>]*>(?<title>[^<]{6,200})<\/a>/gi,
    base: "https://katapult.vc",
  },
  {
    url: "https://eic.ec.europa.eu/eic-funding-opportunities/eic-accelerator_en",
    program: "EIC Accelerator",
    linkPattern: /<a[^>]+href="(?<href>[^"']+eic[^"']+)"[^>]*>(?<title>[^<]{10,200})<\/a>/gi,
    base: "https://eic.ec.europa.eu",
  },
];

export async function fetchAcceleratorOpportunities(): Promise<RawOpportunity[]> {
  const out: RawOpportunity[] = [];
  for (const feed of FEEDS) {
    try {
      const res = await fetch(feed.url, {
        headers: { "User-Agent": "VerdeIQ-GrantAlerts/1.0" },
        cache: "no-store",
      });
      if (!res.ok) continue;
      const html = await res.text();
      const seen = new Set<string>();
      for (const m of html.matchAll(feed.linkPattern)) {
        const href = m.groups?.href?.trim();
        const title = m.groups?.title?.replace(/\s+/g, " ").trim();
        if (!href || !title) continue;
        const url = href.startsWith("http") ? href : `${feed.base}${href}`;
        const id = url.replace(/[?#].*$/, "");
        if (seen.has(id)) continue;
        seen.add(id);
        out.push({
          source: "accelerators",
          externalId: id,
          title,
          summary: `${title} - ${feed.program}`,
          url,
          program: feed.program,
          deadline: null,
          publishedAt: null,
          tags: [feed.program],
        });
      }
    } catch (e) {
      console.warn(`[grant-alerts] accelerator ${feed.program} failed:`, (e as Error).message);
    }
  }
  return out.slice(0, 60);
}
