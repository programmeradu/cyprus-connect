/**
 * Document intake: the pure parts, shared by the server reader and tests.
 *
 * One place reads every document a person drops on "Add data". Code decides
 * as much as it can (file type, known bill layouts, spreadsheet columns, bank
 * statement columns); AI is only asked when code cannot tell, and every figure
 * it returns must quote the line it came from. Nothing here writes data: the
 * result is a proposal a person confirms.
 */

import type { FootprintKey } from "@/lib/emissions/footprint";
import { categorise, type SpendCategory } from "@/lib/bank/categorize";
import { parseAmount } from "@/lib/ocr/amounts";

export type IntakeKind =
  | "eac_bill"
  | "water_bill"
  | "bank_statement"
  | "utility_invoice"
  | "fuel_receipt"
  | "waste_invoice"
  | "consumption_sheet";

/** Why a document was refused. The page turns each code into a sentence. */
export type RejectCode =
  | "unsupported"
  | "scanned_pdf"
  | "not_relevant"
  | "no_figures"
  | "unreadable"
  | "sheet_no_dates"
  | "bank_image"
  | "reader_off";

/** Notes a person should see before confirming. */
export type WarningCode =
  | "already_uploaded"
  | "period_not_ended"
  | "unverified_quote"
  | "unit_dropped"
  | "fuel_litres"
  | "spend_not_usage";

export interface ProposedFigure {
  key: FootprintKey;
  /** In the footprint's own unit (kWh, m³, litres, kg, km). */
  value: number;
  periodStart: string;
  periodEnd: string;
  /** The exact text the figure was read from, when there is one. */
  quote: string | null;
  /** True when the quote was found word for word in the document text, or code read the figure. */
  verified: boolean;
}

/** One figure's part of one calendar month. */
export interface MonthShare {
  key: FootprintKey;
  year: number;
  month: number;
  value: number;
  /** Days of the month the figure covers, and days in the month. */
  days: number;
  monthDays: number;
  figureIndex: number;
}

export interface BankLine {
  date: string;
  description: string;
  amount: number;
  category: Exclude<SpendCategory, "other">;
  rule: string;
}

export interface BankSummary {
  periodStart: string | null;
  periodEnd: string | null;
  debitCount: number;
  lines: BankLine[];
  totals: Partial<Record<Exclude<SpendCategory, "other">, number>>;
  payees: { name: string; category: Exclude<SpendCategory, "other">; amount: number; count: number }[];
}

export interface IntakeProposal {
  kind: IntakeKind;
  /** How sure the reader is about the kind: "code" means a fixed rule recognised it. */
  recognisedBy: "code" | "ai";
  figures: ProposedFigure[];
  shares: MonthShare[];
  bank: BankSummary | null;
  warnings: WarningCode[];
  /** Short description from the reader, e.g. "Petrolina fuel receipt". */
  description: string | null;
}

export type IntakeResult =
  | { ok: true; proposal: IntakeProposal; bill?: unknown }
  | { ok: false; code: RejectCode; detail?: string | null };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY = 86_400_000;

export function isIsoDate(v: unknown): v is string {
  return typeof v === "string" && ISO_DATE.test(v) && !Number.isNaN(Date.parse(v));
}

/**
 * Spreads a figure over the calendar months it covers, by days (both ends
 * included). A bill for 15 Jan to 14 Mar puts 17/59 in January, 28/59 in
 * February and 14/59 in March. Months that have not ended are left out and
 * reported, so a figure is never recorded for a month still running.
 */
export function splitByMonth(
  figure: Pick<ProposedFigure, "key" | "value" | "periodStart" | "periodEnd">,
  figureIndex: number,
  now = new Date(),
): { shares: MonthShare[]; skippedOpenMonth: boolean } {
  const start = Date.parse(`${figure.periodStart}T00:00:00Z`);
  const end = Date.parse(`${figure.periodEnd}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return { shares: [], skippedOpenMonth: false };
  const totalDays = Math.round((end - start) / DAY) + 1;
  const shares: MonthShare[] = [];
  let skippedOpenMonth = false;
  const openYear = now.getUTCFullYear();
  const openMonth = now.getUTCMonth() + 1;
  let cursor = start;
  while (cursor <= end) {
    const d = new Date(cursor);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    const monthEnd = Date.UTC(year, month, 0);
    const sliceEnd = Math.min(end, monthEnd);
    const days = Math.round((sliceEnd - cursor) / DAY) + 1;
    const monthDays = new Date(Date.UTC(year, month, 0)).getUTCDate();
    if (year > openYear || (year === openYear && month >= openMonth)) {
      skippedOpenMonth = true;
    } else {
      shares.push({
        key: figure.key,
        year,
        month,
        value: Math.round(((figure.value * days) / totalDays) * 100) / 100,
        days,
        monthDays,
        figureIndex,
      });
    }
    cursor = monthEnd + DAY;
  }
  return { shares, skippedOpenMonth };
}

/** Lower-case, no accents, single spaces, so a quote matches despite layout. */
export function normaliseForMatch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s\u00a0]+/g, " ")
    .trim();
}

/** The quote is in the text word for word, and the figure's digits are in the quote. */
export function quoteSupports(text: string, quote: string | null | undefined, value: number): boolean {
  if (!quote || quote.trim().length < 3) return false;
  const q = normaliseForMatch(quote);
  if (!normaliseForMatch(text).includes(q)) return false;
  const digits = q.replace(/[^\d]/g, "");
  const whole = String(Math.trunc(value));
  return digits.includes(whole) || whole.length > 6;
}

// ── Units ────────────────────────────────────────────────────────────────

/** Converts a reader's unit into the footprint's unit, or null when it does not fit. */
export function toFootprintUnit(key: FootprintKey, value: number, unit: string): number | null {
  const u = unit.trim().toLowerCase().replace("³", "3").replace(/\s+/g, "");
  if (!Number.isFinite(value) || value <= 0) return null;
  switch (key) {
    case "electricity":
      if (u === "kwh") return value;
      if (u === "mwh") return value * 1000;
      return null;
    case "gas":
      return u === "m3" || u === "cubicmetres" || u === "cubicmeters" ? value : null;
    case "water":
      if (u === "m3" || u === "cubicmetres" || u === "cubicmeters") return value * 1000;
      if (u === "l" || u === "litres" || u === "liters" || u === "litre" || u === "liter") return value;
      return null;
    case "waste":
      if (u === "kg") return value;
      if (u === "t" || u === "tonnes" || u === "tons" || u === "tonne") return value * 1000;
      return null;
    case "transport":
      return u === "km" ? value : null;
  }
}

const MAX_VALUE: Record<FootprintKey, number> = {
  electricity: 10_000_000,
  gas: 10_000_000,
  water: 1_000_000_000,
  waste: 100_000_000,
  transport: 100_000_000,
};

export function plausible(key: FootprintKey, value: number): boolean {
  return Number.isFinite(value) && value > 0 && value <= MAX_VALUE[key];
}

export function periodOk(start: string, end: string): boolean {
  return isIsoDate(start) && isIsoDate(end) && Date.parse(end) >= Date.parse(start) && (Date.parse(end) - Date.parse(start)) / DAY <= 400;
}

// ── Recognising text ─────────────────────────────────────────────────────

const EAC_TEXT = /electricity authority of cyprus|αρχη ηλεκτρισμου|\beac\b|\bαηκ\b|\ba\.h\.k\b/;
const WATER_TEXT = /water board|συμβουλιο υδατοπρομηθειας|υδατοπρομηθει|water supply/;
const BANK_TEXT = /\biban\b|account statement|statement of account|καταστασ[ηε]\s+λογαριασμου|opening balance|closing balance|υπολοιπο/;

/** Recognises a document from its text with fixed rules. Null means "ask the reader". */
export function recogniseText(text: string): "eac_bill" | "water_bill" | "bank_statement" | null {
  const t = normaliseForMatch(text);
  const bank = BANK_TEXT.test(t);
  const eac = EAC_TEXT.test(t) && /kwh/.test(t);
  const water = WATER_TEXT.test(t) && /m3|m³|κυβικ/.test(t);
  // A statement lists EAC and water board payments, so the statement wording wins.
  if (bank && /\biban\b/.test(t) && (/balance|υπολοιπο/.test(t))) return "bank_statement";
  if (eac) return "eac_bill";
  if (water) return "water_bill";
  if (bank) return "bank_statement";
  return null;
}

// ── Spreadsheets ─────────────────────────────────────────────────────────

/** Splits CSV text into rows, honouring quotes. Picks ";" or "," or tab from the header. */
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, "");
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? "";
  const count = (c: string) => firstLine.split(c).length - 1;
  const sep = [";", "\t", ","].reduce((best, c) => (count(c) > count(best) ? c : best), ",");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (quoted) {
      if (ch === '"' && clean[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) {
      row.push(cell.trim());
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && clean[i + 1] === "\n") i++;
      row.push(cell.trim());
      if (row.some((c) => c !== "")) rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  row.push(cell.trim());
  if (row.some((c) => c !== "")) rows.push(row);
  return rows;
}

/** Reads 31/01/2026, 31-01-2026, 31.01.2026, 2026-01-31 or 2026-01 into an ISO date. */
export function parseSheetDate(raw: string): string | null {
  const s = raw.trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (m) return iso(m[3].length === 2 ? 2000 + +m[3] : +m[3], +m[2], +m[1]);
  m = s.match(/^(\d{4})[-/](\d{1,2})$/);
  if (m) return iso(+m[1], +m[2], 1);
  m = s.match(/^(\d{1,2})[-/](\d{4})$/);
  if (m) return iso(+m[2], +m[1], 1);
  return null;
}

function iso(y: number, mo: number, d: number): string | null {
  if (y < 2000 || y > 2100 || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCMonth() !== mo - 1) return null;
  return date.toISOString().slice(0, 10);
}

function num(raw: string | undefined): number | null {
  if (!raw) return null;
  const negative = /^\s*-|\(.*\)|\bdr\b/i.test(raw);
  const n = parseAmount(raw.replace(/[^\d.,\s-]/g, ""));
  if (n === null || !Number.isFinite(n)) return null;
  return negative ? -Math.abs(n) : n;
}

const H = (h: string) => normaliseForMatch(h);

function findCol(headers: string[], tests: RegExp[], skip: number[] = []): number {
  for (const re of tests) {
    const i = headers.findIndex((h, idx) => !skip.includes(idx) && re.test(h));
    if (i >= 0) return i;
  }
  return -1;
}

/** A bank statement export: date, description and money columns. Returns null if it is not one. */
export function readBankRows(rows: string[][]): BankSummary | null {
  if (rows.length < 2) return null;
  // Exports often start with a few lines of account details before the header row.
  const headerAt = rows.slice(0, 15).findIndex((r) => {
    const hs = r.map(H);
    return hs.some((h) => /date|ημερομηνια/.test(h)) && hs.some((h) => /descr|detail|narrat|payee|beneficiar|περιγραφ|αιτιολογ/.test(h));
  });
  if (headerAt < 0) return null;
  const headers = rows[headerAt].map(H);
  const date = findCol(headers, [/^(booking|transaction|posting)? ?date|ημερομηνια/, /date/]);
  const desc = findCol(headers, [/descr|περιγραφ/, /detail|narrat|αιτιολογ/, /payee|beneficiar/]);
  const debit = findCol(headers, [/debit|χρεωση|withdraw|money out|paid out/]);
  const credit = findCol(headers, [/credit|πιστωση|deposit|money in|paid in/]);
  const amount = debit < 0 ? findCol(headers, [/^amount|ποσο/, /amount/]) : -1;
  if (date < 0 || desc < 0 || (debit < 0 && amount < 0)) return null;

  const lines: BankLine[] = [];
  let debitCount = 0;
  let first: string | null = null;
  let last: string | null = null;
  for (const r of rows.slice(headerAt + 1)) {
    const d = parseSheetDate(r[date] ?? "");
    if (!d) continue;
    let out: number | null = null;
    if (debit >= 0) {
      const v = num(r[debit]);
      out = v !== null && v !== 0 ? Math.abs(v) : null;
    } else {
      const v = num(r[amount]);
      out = v !== null && v < 0 ? Math.abs(v) : null;
    }
    if (credit >= 0 && out === null) continue;
    if (!out) continue;
    first = !first || d < first ? d : first;
    last = !last || d > last ? d : last;
    debitCount++;
    const description = (r[desc] ?? "").slice(0, 200);
    const c = categorise(description, "debit");
    if (c.category !== "other" && c.rule) {
      lines.push({ date: d, description, amount: Math.round(out * 100) / 100, category: c.category, rule: c.rule });
    }
  }
  if (debitCount === 0) return null;
  return summariseBank(lines, debitCount, first, last);
}

export function summariseBank(lines: BankLine[], debitCount: number, first: string | null, last: string | null): BankSummary {
  const totals: BankSummary["totals"] = {};
  const payeeMap = new Map<string, BankSummary["payees"][number]>();
  for (const l of lines) {
    totals[l.category] = Math.round(((totals[l.category] ?? 0) + l.amount) * 100) / 100;
    const name = l.description.replace(/\s+/g, " ").replace(/\d{4,}.*$/, "").trim().slice(0, 60) || l.rule;
    const key = `${l.category}:${name.toLowerCase()}`;
    const p = payeeMap.get(key) ?? { name, category: l.category, amount: 0, count: 0 };
    p.amount = Math.round((p.amount + l.amount) * 100) / 100;
    p.count++;
    payeeMap.set(key, p);
  }
  return {
    periodStart: first,
    periodEnd: last,
    debitCount,
    lines: lines.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 200),
    totals,
    payees: [...payeeMap.values()].sort((a, b) => b.amount - a.amount).slice(0, 20),
  };
}

const SHEET_COLS: { key: FootprintKey; test: RegExp }[] = [
  { key: "electricity", test: /electric|kwh|ηλεκτρ/ },
  { key: "gas", test: /\bgas\b|αεριο/ },
  { key: "water", test: /water|νερο|υδρ/ },
  { key: "waste", test: /waste|αποβλητ|σκουπιδ/ },
  { key: "transport", test: /transport|travel|\bkm\b|kilomet|χιλιομετρ/ },
];

/**
 * A spreadsheet of usage: a date or month column plus measure columns.
 * Returns one figure per measure per month. "no_dates" when the measures are
 * there but no column says which month they belong to.
 */
export function readConsumptionRows(rows: string[][]): { figures: ProposedFigure[] } | "no_dates" | null {
  if (rows.length < 2) return null;
  const headers = rows[0].map(H);
  const dateCol = findCol(headers, [/date|ημερομηνια/, /month|period|μηνας|περιοδ/]);
  const measures = SHEET_COLS.map((c) => ({ ...c, col: headers.findIndex((h) => c.test.test(h)) })).filter((c) => c.col >= 0 && c.col !== dateCol);
  if (measures.length === 0) return null;
  if (dateCol < 0) return "no_dates";
  const byMonth = new Map<string, Partial<Record<FootprintKey, number>>>();
  for (const r of rows.slice(1)) {
    const d = parseSheetDate(r[dateCol] ?? "");
    if (!d) continue;
    const ym = d.slice(0, 7);
    const acc = byMonth.get(ym) ?? {};
    for (const m of measures) {
      const v = num(r[m.col]);
      if (v === null || v <= 0) continue;
      const header = headers[m.col];
      const unit = m.key === "water" ? (/m3|m³|κυβ/.test(header) ? "m3" : "litres")
        : m.key === "waste" ? (/\bt\b|tonne|τον/.test(header) ? "t" : "kg")
        : m.key === "electricity" ? (/mwh/.test(header) ? "mwh" : "kwh")
        : m.key === "gas" ? "m3" : "km";
      const converted = toFootprintUnit(m.key, v, unit);
      if (converted === null) continue;
      acc[m.key] = (acc[m.key] ?? 0) + converted;
    }
    byMonth.set(ym, acc);
  }
  const figures: ProposedFigure[] = [];
  for (const [ym, acc] of [...byMonth.entries()].sort()) {
    const [y, mo] = ym.split("-").map(Number);
    const end = new Date(Date.UTC(y, mo, 0)).toISOString().slice(0, 10);
    for (const [key, value] of Object.entries(acc) as [FootprintKey, number][]) {
      if (!plausible(key, value)) continue;
      figures.push({ key, value: Math.round(value * 100) / 100, periodStart: `${ym}-01`, periodEnd: end, quote: null, verified: true });
    }
  }
  return figures.length ? { figures } : "no_dates";
}

/** Builds the month shares and the open-month warning for a list of figures. */
export function sharesFor(figures: ProposedFigure[], now = new Date()): { shares: MonthShare[]; openMonth: boolean } {
  const shares: MonthShare[] = [];
  let openMonth = false;
  figures.forEach((f, i) => {
    const r = splitByMonth(f, i, now);
    shares.push(...r.shares);
    if (r.skippedOpenMonth) openMonth = true;
  });
  return { shares, openMonth };
}
