import type { RawOpportunity } from "../types";

// European Innovation Council open calls, read from the EIC "funding
// opportunities" page. Only cards marked "Call status: Open" with a call link
// are kept: programme overviews, portfolio pages and news items are not calls
// a company can apply to. The next future deadline is taken from the card.

const PAGE = "https://eic.ec.europa.eu/eic-funding-opportunities_en";
const BASE = "https://eic.ec.europa.eu";

const CARD =
  /Call status:\s*(?<status>[^<]+)<\/span>[\s\S]*?<a\s+href="(?<href>[^"]*calls-proposals\/[^"]+)"[\s\S]*?>(?<title>[^<]{4,200})<\/a>[\s\S]*?ecl-content-block__description">(?<desc>[\s\S]*?)<\/div>/gi;

function text(html: string): string {
  return html.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

/** "7.01.2026 | 4.03.2026" -> first date on or after today, as YYYY-MM-DD. */
export function nextDeadline(desc: string, today = new Date()): string | null {
  const day = today.toISOString().slice(0, 10);
  const dates = [...desc.matchAll(/\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/g)]
    .map(([, d, m, y]) => `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`)
    .filter((iso) => iso >= day)
    .sort();
  return dates[0] ?? null;
}

export async function fetchAcceleratorOpportunities(): Promise<RawOpportunity[]> {
  const res = await fetch(PAGE, { headers: { "User-Agent": "Mozilla/5.0 (Vuneli funding scan)" }, cache: "no-store" });
  if (!res.ok) throw new Error(`EIC page returned ${res.status}`);
  const html = await res.text();
  const out: RawOpportunity[] = [];
  const seen = new Set<string>();
  for (const m of html.matchAll(CARD)) {
    const g = m.groups!;
    if (!/open|forthcoming/i.test(g.status)) continue;
    const url = g.href.startsWith("http") ? g.href : `${BASE}${g.href}`;
    if (seen.has(url)) continue;
    seen.add(url);
    const desc = text(g.desc);
    const deadline = nextDeadline(desc);
    if (/deadline/i.test(desc) && !deadline) continue; // every listed date has passed
    const title = text(g.title);
    out.push({
      source: "accelerators",
      externalId: url,
      title,
      summary: `${desc} (European Innovation Council, SME innovation funding)`,
      url,
      program: "European Innovation Council",
      deadline,
      publishedAt: null,
      tags: ["eic", "sme", "innovation"],
    });
  }
  return out;
}
