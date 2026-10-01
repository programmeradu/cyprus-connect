/**
 * Checks a Verde answer against the records it was given. Pure and offline.
 *
 *  - unsupported: a figure in the answer that appears nowhere in the records
 *    (allowing for rounding), i.e. a made-up number.
 *  - unsourced: a sentence quoting a records figure without naming where it
 *    comes from (a metric key or label, period, obligation, task or record list).
 *
 * Not checked as figures: years, dates, regulation/article numbers, task ids,
 * and small whole numbers (counts such as "3 open tasks").
 */

export type Grounding = { ok: boolean; unsupported: string[]; unsourced: string[] };

const NUM = /(?<![\w#/.-])-?\d{1,3}(?:,\d{3})+(?:\.\d+)?%?|(?<![\w#/.-])-?\d+(?:\.\d+)?%?/g;
const REG_WORD = /(article|art\.|regulation|directive|annex|scope|iso|cn|esrs|step|level|tier|phase|section|paragraph|reg\.)\s*$/i;

const MONTHS = "(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?";
const MONTH_BEFORE = new RegExp(`\\b${MONTHS}\\s*$`, "i");
const MONTH_AFTER = new RegExp(`^\\s*${MONTHS}\\b`, "i");

const toNum = (s: string) => Number(s.replace(/[,%]/g, ""));
const decimals = (s: string) => (s.replace(/%$/, "").split(".")[1] ?? "").length;

function figures(text: string): { raw: string; value: number; index: number }[] {
  const out: { raw: string; value: number; index: number }[] = [];
  for (const m of text.matchAll(NUM)) {
    const raw = m[0];
    const i = m.index ?? 0;
    const after = text.slice(i + raw.length, i + raw.length + 3);
    const before = text.slice(Math.max(0, i - 14), i);
    if (/^[/-]\d/.test(after) || /\d[/-]$/.test(before)) continue; // dates, 2023/956
    if (REG_WORD.test(before)) continue;
    if (MONTH_BEFORE.test(before) || MONTH_AFTER.test(text.slice(i + raw.length, i + raw.length + 12))) continue; // "July 15", "15 July"
    const value = toNum(raw);
    if (!Number.isFinite(value)) continue;
    if (!raw.includes(".") && !raw.endsWith("%") && Number.isInteger(value)) {
      if (value >= 1990 && value <= 2100) continue; // years
      if (Math.abs(value) <= 12) continue; // counts
    }
    out.push({ raw, value, index: i });
  }
  return out;
}

/** True when `shown` could be a rounding of `truth` at the precision it was written with. */
function matches(shown: string, value: number, truth: number): boolean {
  const step = 10 ** -decimals(shown);
  if (Math.abs(value - truth) <= step / 2 + 1e-9) return true;
  return truth !== 0 && Math.abs(value - truth) / Math.abs(truth) <= 0.005;
}

function sourceLabels(briefing: string): string[] {
  const labels = new Set<string>(["metric", "reading", "record", "obligation", "task", "company details", "profile", "activity"]);
  for (const m of briefing.matchAll(/^- ([a-z0-9_]+) "([^"]+)"/gm)) { labels.add(m[1]); labels.add(m[2].toLowerCase()); }
  for (const m of briefing.matchAll(/([A-Za-z]{3,}\s?\d{0,4})=/g)) labels.add(m[1].trim().toLowerCase());
  for (const m of briefing.matchAll(/^- (\S+) ([A-Za-z][A-Za-z/ -]+):/gm)) { labels.add(m[1].toLowerCase()); labels.add(m[2].toLowerCase()); }
  for (const m of briefing.matchAll(/#(\d+)/g)) labels.add(`#${m[1]}`);
  return [...labels].filter((l) => l.length > 2);
}

export function checkGrounding(answer: string, briefing: string): Grounding {
  const truth = figures(briefing).map((f) => f.value);
  const labels = sourceLabels(briefing);
  const unsupported: string[] = [];
  const unsourced: string[] = [];
  const sentences = answer.split(/(?<=[.!?])\s+|\n+/);
  for (const sentence of sentences) {
    const figs = figures(sentence);
    if (!figs.length) continue;
    let grounded = false;
    for (const f of figs) {
      if (truth.some((t) => matches(f.raw, Math.abs(f.value), Math.abs(t)))) grounded = true;
      else unsupported.push(f.raw);
    }
    const lower = sentence.toLowerCase();
    if (grounded && !labels.some((l) => lower.includes(l))) unsourced.push(sentence.trim().slice(0, 160));
  }
  return { ok: !unsupported.length && !unsourced.length, unsupported: [...new Set(unsupported)], unsourced };
}
