/**
 * Pure checks that decide whether a project really happened.
 * Nothing here trusts a click: each check reads bills, bank lines or document text.
 */
import type { CheckKind, ProjectDef } from "./catalog";
import type { MeterBill } from "./roi";

export type CheckStatus = "passed" | "waiting" | "failed" | "needed" | "confirm";

export interface CheckResult {
  kind: CheckKind;
  status: CheckStatus;
  /** Plain-language detail key + values for the UI. */
  reason: string;
  numbers?: Record<string, number | string>;
}

const DAY = 86_400_000;
const span = (a: string, b: string) => Math.max(1, Math.round((Date.parse(b) - Date.parse(a)) / DAY) + 1);

/** Minimum fall in daily use, against the same months a year before, to count as a drop. */
export const DROP_THRESHOLD = 0.05;
export const BILLS_NEEDED = 2;

/**
 * Compares bills that start on or after the install date with the bill for
 * the same period one year earlier (start within 25 days). Daily use is
 * compared so bills of different length are fair.
 */
export function billDrop(bills: MeterBill[], installedOn: string | null): CheckResult {
  if (!installedOn) return { kind: "bill_drop", status: "waiting", reason: "not_installed" };
  const after = bills.filter((b) => b.start >= installedOn && b.qty > 0);
  const pairs: { after: MeterBill; before: MeterBill }[] = [];
  for (const a of after) {
    const target = Date.parse(a.start) - 365 * DAY;
    const before = bills
      .filter((b) => b.qty > 0 && Math.abs(Date.parse(b.start) - target) <= 25 * DAY)
      .sort((x, y) => Math.abs(Date.parse(x.start) - target) - Math.abs(Date.parse(y.start) - target))[0];
    if (before) pairs.push({ after: a, before });
  }
  if (pairs.length < BILLS_NEEDED) {
    return {
      kind: "bill_drop",
      status: "waiting",
      reason: after.length < BILLS_NEEDED ? "need_bills_after" : "need_bills_before",
      numbers: { after: after.length, matched: pairs.length, needed: BILLS_NEEDED },
    };
  }
  const daily = (b: MeterBill) => b.qty / span(b.start, b.end);
  const before = pairs.reduce((n, p) => n + daily(p.before), 0);
  const now = pairs.reduce((n, p) => n + daily(p.after), 0);
  const drop = before > 0 ? 1 - now / before : 0;
  const numbers = { pairs: pairs.length, dropPct: Math.round(drop * 1000) / 10, beforeDaily: Math.round(before / pairs.length * 10) / 10, afterDaily: Math.round(now / pairs.length * 10) / 10 };
  return drop >= DROP_THRESHOLD
    ? { kind: "bill_drop", status: "passed", reason: "drop_seen", numbers }
    : { kind: "bill_drop", status: "failed", reason: "no_drop_yet", numbers };
}

export interface BankLine {
  id: number;
  bookedOn: string;
  amount: number;
  description: string | null;
  direction: string;
}

const norm = (s: string) =>
  s
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(LTD|LIMITED|LLC|ΛΤΔ|ΛΙΜΙΤΕΔ|CO|COMPANY|THE)\b/g, " ")
    .replace(/[^A-Z\u0370-\u03FF0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Bank debits that could be the payment: payee contains the supplier name, amount near the quote, after the start. */
export function paymentCandidates(lines: BankLine[], supplierName: string | null | undefined, quoteEur: number | null | undefined, startedOn: string): BankLine[] {
  const name = supplierName ? norm(supplierName) : "";
  if (name.length < 3) return [];
  const from = new Date(Date.parse(startedOn) - 120 * DAY).toISOString().slice(0, 10);
  return lines.filter((l) => {
    if (l.direction === "credit" || l.bookedOn < from) return false;
    const d = ` ${norm(l.description ?? "")} `;
    if (!d.includes(` ${name} `) && !d.includes(` ${name.split(" ")[0]} `)) return false;
    if (quoteEur && quoteEur > 0) {
      const amt = Math.abs(l.amount);
      // Instalments: any payment of at least 10% of the quote and not above it by more than 15%.
      return amt >= quoteEur * 0.1 && amt <= quoteEur * 1.15;
    }
    return true;
  });
}

export interface ProofQuotes {
  supplier?: string;
  date?: string;
  item?: string;
}

const DATE_RE = /\b(\d{4})-(\d{2})-(\d{2})\b|\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b/g;

/** Reads an invoice's text layer: it must name the supplier, show a date after the start, and name the item. */
export function readProofText(
  text: string,
  def: ProjectDef,
  supplierName: string | null | undefined,
  startedOn: string,
): { ok: true; quotes: ProofQuotes } | { ok: false; missing: ("supplier" | "date" | "item" | "text")[] } {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length < 40) return { ok: false, missing: ["text"] };
  const missing: ("supplier" | "date" | "item")[] = [];
  const quotes: ProofQuotes = {};

  const name = supplierName ? norm(supplierName) : "";
  const hay = ` ${norm(flat)} `;
  if (name.length >= 3 && (hay.includes(` ${name} `) || hay.includes(` ${name.split(" ")[0]} `))) quotes.supplier = supplierName!.trim();
  else missing.push("supplier");

  const earliest = new Date(Date.parse(startedOn) - 180 * DAY).toISOString().slice(0, 10);
  for (const m of flat.matchAll(DATE_RE)) {
    const iso = m[1] ? `${m[1]}-${m[2]}-${m[3]}` : `${m[6]}-${m[5].padStart(2, "0")}-${m[4].padStart(2, "0")}`;
    if (!Number.isNaN(Date.parse(iso)) && iso >= earliest && iso <= new Date(Date.now() + 30 * DAY).toISOString().slice(0, 10)) {
      quotes.date = m[0];
      break;
    }
  }
  if (!quotes.date) missing.push("date");

  const item = flat.match(def.proofWords);
  if (item) {
    const i = item.index ?? 0;
    quotes.item = flat.slice(Math.max(0, i - 30), Math.min(flat.length, i + item[0].length + 30)).trim();
  } else missing.push("item");

  return missing.length ? { ok: false, missing } : { ok: true, quotes };
}

/** Purchase is proven by a read invoice or a payment the person picked from the bank list. */
export function purchaseCheck(evidence: { kind: string }[], candidates: number, bankLinked: boolean): CheckResult {
  if (evidence.some((e) => e.kind === "invoice")) return { kind: "purchase", status: "passed", reason: "invoice_read" };
  if (evidence.some((e) => e.kind === "payment")) return { kind: "purchase", status: "passed", reason: "payment_confirmed" };
  if (candidates > 0) return { kind: "purchase", status: "confirm", reason: "payment_found", numbers: { candidates } };
  return { kind: "purchase", status: "needed", reason: bankLinked ? "upload_invoice" : "upload_invoice_no_bank" };
}

/** Supplier data is proven by an uploaded declaration/invoice or actual declared SEE figures in the registry. */
export function supplierCheck(
  evidence: { kind: string }[],
  hasDeclaredData: boolean,
  hasActiveRequest: boolean,
): CheckResult {
  if (evidence.some((e) => e.kind === "invoice" || e.kind === "supplier_declaration") || hasDeclaredData) {
    return { kind: "supplier_data", status: "passed", reason: "data_on_file" };
  }
  if (hasActiveRequest) {
    return { kind: "supplier_data", status: "waiting", reason: "request_sent_waiting" };
  }
  return { kind: "supplier_data", status: "needed", reason: "request_or_upload" };
}

export function allPassed(def: ProjectDef, checks: CheckResult[]): boolean {
  return def.checks.every((k) => checks.find((c) => c.kind === k)?.status === "passed");
}
