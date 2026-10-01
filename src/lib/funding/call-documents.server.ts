/**
 * Finds and reads the official PDF documents linked from a funding call
 * (call fiche, work programme, guide for applicants) so Grant scout can read
 * eligibility rules that are not on the call page itself.
 *
 * Only PDFs on official EU / Cyprus government hosts are fetched. Text is
 * extracted deterministically (unpdf), never by AI, so every quote the AI later
 * cites can be checked word for word against this text. Scanned or protected
 * PDFs yield no text and the call stays hidden rather than guessed.
 */

import { extractText, getDocumentProxy } from "unpdf";
import { logger } from "@/lib/log";

const log = logger("funding.documents");

const OFFICIAL_HOSTS = [/(^|\.)europa\.eu$/, /(^|\.)gov\.cy$/, /(^|\.)research\.org\.cy$/, /(^|\.)rif\.org\.cy$/];
/** Generic programme-wide guidance and blank forms: no call-specific eligibility. */
const GENERIC_DOC = /\/common\/|\/temp-form\/|[/_-](om|aga|tc|af|mga|rules-lev-lear-fca)(_[a-z-]+)?_en\.pdf|annotated|model-grant|privacy|template/i;
const MAX_BYTES = 15 * 1024 * 1024;
const MAX_DOCS = 3;
/** Characters of PDF text handed to the AI per call, across all documents. */
const MAX_CHARS = 24_000;
const WINDOW = 7_000;

export interface CallDocument { url: string; text: string }

export function isOfficialPdfUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return false;
    if (!OFFICIAL_HOSTS.some((h) => h.test(u.hostname))) return false;
    return /\.pdf$/i.test(u.pathname) || /\.pdf$/i.test(u.searchParams.get("filename") ?? "");
  } catch {
    return false;
  }
}

/** Call-specific official PDFs first, generic guidance dropped, de-duplicated. */
export function pickCallPdfs(urls: string[], callId?: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of urls) {
    const clean = u.replace(/&amp;/g, "&").trim();
    if (seen.has(clean) || !isOfficialPdfUrl(clean) || GENERIC_DOC.test(clean)) continue;
    seen.add(clean);
    out.push(clean);
  }
  const id = callId?.toLowerCase();
  const rank = (u: string) => {
    const l = u.toLowerCase();
    if (id && l.includes(id)) return 0;
    if (/call-fiche|wp-call|guide|eligib|terms-of-reference|call-document|proskl/.test(l)) return 1;
    if (/work-?programme|wp_|\/wp-/.test(l)) return 2;
    return 3;
  };
  return out.sort((a, b) => rank(a) - rank(b)).slice(0, MAX_DOCS);
}

/** PDF links in an HTML page or JSON blob, resolved against the page URL. */
export function pdfLinksIn(content: string, base: string): string[] {
  const found = new Set<string>();
  for (const m of content.matchAll(/https?:\/\/[^"'\s<>\\]+?\.pdf(?:\?[^"'\s<>\\]*)?(?=["'\s<>\\]|$)/gi)) found.add(m[0]);
  for (const m of content.matchAll(/href=["']([^"']+)["']/gi)) {
    const href = m[1]!;
    if (!/\.pdf/i.test(href)) continue;
    try { found.add(new URL(href.replace(/&amp;/g, "&"), base).toString()); } catch { /* ignore bad href */ }
  }
  return [...found];
}

/**
 * The parts of a long document that concern this call: windows around each
 * mention of the call identifier (work programmes cover dozens of topics).
 * Short documents are kept whole up to the budget.
 */
export function relevantExcerpt(text: string, callId: string | undefined, budget: number): string {
  const flat = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (flat.length <= budget) return flat;
  if (!callId) return flat.slice(0, budget);
  const lower = flat.toLowerCase();
  const id = callId.toLowerCase();
  const hits: number[] = [];
  for (let i = lower.indexOf(id); i !== -1 && hits.length < 50; i = lower.indexOf(id, i + id.length)) hits.push(i);
  if (!hits.length) return flat.slice(0, budget);
  // Table-of-contents mentions are short; prefer mentions followed by eligibility wording.
  const score = (i: number) => (lower.slice(i, i + WINDOW).match(/eligib|applicant|admissib|sme|consorti|beneficiar/g) ?? []).length;
  const chosen = hits.map((i) => ({ i, s: score(i) })).sort((a, b) => b.s - a.s).slice(0, Math.max(1, Math.floor(budget / WINDOW)));
  return chosen
    .sort((a, b) => a.i - b.i)
    .map(({ i }) => flat.slice(Math.max(0, i - 500), i + WINDOW - 500))
    .join("\n…\n")
    .slice(0, budget);
}

async function fetchPdfText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(30_000) });
    if (!res.ok || !isOfficialPdfUrl(res.url || url) && !OFFICIAL_HOSTS.some((h) => h.test(new URL(res.url || url).hostname))) return null;
    const len = Number(res.headers.get("content-length") ?? 0);
    if (len > MAX_BYTES) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength > MAX_BYTES || buf.byteLength < 5) return null;
    // %PDF magic bytes: never parse an HTML error page as a document.
    if (!(buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46)) return null;
    const pdf = await getDocumentProxy(buf);
    const { text } = await extractText(pdf, { mergePages: true });
    const out = (Array.isArray(text) ? text.join("\n") : text).trim();
    // Under ~200 characters means a scanned or image-only PDF: no readable rules.
    return out.length >= 200 ? out : null;
  } catch (e) {
    log.error("could not read call document", e);
    return null;
  }
}

/** Reads up to three official PDFs for a call and returns their relevant text. */
export async function readCallDocuments(candidateUrls: string[], callId?: string): Promise<CallDocument[]> {
  const docs: CallDocument[] = [];
  let budget = MAX_CHARS;
  for (const url of pickCallPdfs(candidateUrls, callId)) {
    if (budget < 1_500) break;
    const text = await fetchPdfText(url);
    if (!text) continue;
    const excerpt = relevantExcerpt(text, callId, budget);
    docs.push({ url, text: excerpt });
    budget -= excerpt.length;
  }
  return docs;
}

/** PDF links on a call's own web page (non-EU-portal sources). */
export async function pdfLinksOnPage(pageUrl: string): Promise<string[]> {
  try {
    const host = new URL(pageUrl).hostname;
    if (!OFFICIAL_HOSTS.some((h) => h.test(host))) return [];
    const res = await fetch(pageUrl, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html")) return [];
    return pdfLinksIn((await res.text()).slice(0, 2_000_000), pageUrl);
  } catch {
    return [];
  }
}
