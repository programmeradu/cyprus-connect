/**
 * Pure supplier logic: bank payee names, spend matching and the suggested
 * next steps on the Suppliers page. No I/O, so it is tested directly.
 * Every suggestion names the record it came from; nothing is estimated.
 */

const NOISE = /\b(POS|CARD|PURCHASE|PAYMENT|PMT|SEPA|TRANSFER|TRF|DD|DIRECT DEBIT|STANDING ORDER|S\/O|ONLINE|E-?BANKING|1BANK|VISA|MASTERCARD|DEBIT|CREDIT|REF|NO|CY|EUR)\b/g;

/** A stable key for a bank payment description, or null when nothing useful is left. */
export function payeeKey(description: string | null | undefined): string | null {
  if (!description) return null;
  const k = description
    .toUpperCase()
    .replace(/\d{2}[./-]\d{2}([./-]\d{2,4})?/g, " ")
    .replace(/[A-Z]*\d[A-Z\d]{3,}/g, " ")
    .replace(/\d+/g, " ")
    .replace(/[^A-Z\u0370-\u03FF&' ]+/g, " ")
    .replace(NOISE, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 48)
    .trim();
  return k.length >= 3 ? k : null;
}

/** "ALPHAMEGA HYPERMARKETS" -> "Alphamega Hypermarkets". */
export function payeeLabel(key: string): string {
  return key.toLowerCase().replace(/(^|[\s&'])(\p{L})/gu, (_m, p: string, c: string) => p + c.toUpperCase());
}

function norm(s: string): string {
  return s
    .toUpperCase()
    .replace(/\b(LTD|LIMITED|PLC|LLC|SA|AE|GMBH|CO|COMPANY|HOLDINGS)\b\.?/g, " ")
    .replace(/[^A-Z\u0370-\u03FF\d]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** True when a payee key belongs to this supplier (saved payee, or the name appears in it). */
export function payeeMatches(key: string, supplier: { supplierName: string; bankPayee: string | null }): boolean {
  if (supplier.bankPayee) return supplier.bankPayee === key;
  const n = norm(supplier.supplierName);
  if (n.length < 3) return false;
  const k = norm(key);
  return k === n || k.startsWith(n + " ") || k.includes(" " + n + " ") || k.endsWith(" " + n);
}

export interface Payment { key: string; amount: number; bookedOn: string }
export interface PayeeTotal { key: string; label: string; total: number; count: number; lastPaid: string }

/** Sum debits by payee key, largest first. */
export function totalsByPayee(payments: Payment[]): PayeeTotal[] {
  const m = new Map<string, PayeeTotal>();
  for (const p of payments) {
    const t = m.get(p.key) ?? { key: p.key, label: payeeLabel(p.key), total: 0, count: 0, lastPaid: p.bookedOn };
    t.total += Math.abs(p.amount);
    t.count += 1;
    if (p.bookedOn > t.lastPaid) t.lastPaid = p.bookedOn;
    m.set(p.key, t);
  }
  return [...m.values()]
    .map((t) => ({ ...t, total: Math.round(t.total * 100) / 100 }))
    .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
}

export interface SupplierView {
  name: string;
  email: string | null;
  registrationNo: string | null;
  registryCheckedAt: string | null;
  wikirateCheckedAt: string | null;
  spend12m: number;
  cbamNeedsData: boolean;
  pendingTaskId: number | null;
}

export type Suggestion =
  | { kind: "review_email"; supplier: string; taskId: number }
  | { kind: "add_email_cbam"; supplier: string }
  | { kind: "add_payee"; payee: string; label: string; total: number; count: number }
  | { kind: "check_registry"; supplier: string; spend12m: number };

/**
 * Next steps, most urgent first: emails waiting for approval, CBAM suppliers
 * that owe data but have no email, large untracked payees, then unchecked
 * suppliers. Capped so the list stays short.
 */
export function suggestNextSteps(suppliers: SupplierView[], untracked: PayeeTotal[], max = 8): Suggestion[] {
  const out: Suggestion[] = [];
  for (const s of suppliers) if (s.pendingTaskId !== null) out.push({ kind: "review_email", supplier: s.name, taskId: s.pendingTaskId });
  for (const s of suppliers) if (s.cbamNeedsData && !s.email && s.pendingTaskId === null) out.push({ kind: "add_email_cbam", supplier: s.name });
  for (const p of untracked.slice(0, 3)) out.push({ kind: "add_payee", payee: p.key, label: p.label, total: p.total, count: p.count });
  const unchecked = suppliers
    .filter((s) => !s.registryCheckedAt)
    .sort((a, b) => b.spend12m - a.spend12m || a.name.localeCompare(b.name));
  for (const s of unchecked.slice(0, 3)) out.push({ kind: "check_registry", supplier: s.name, spend12m: s.spend12m });
  return out.slice(0, max);
}

// ── Payees read from an uploaded bank statement ──────────────────────────

/** Why a payee is probably not a supplier. Shown to the person, never decided for them. */
export type NotSupplier = "payroll" | "tax" | "cash" | "bank" | "transfer" | "loan" | "card";

// Tested on the raw description (upper-case, Greek accents stripped), because
// payeeKey removes words such as TRANSFER that matter here.
const NOT_SUPPLIER: [NotSupplier, RegExp][] = [
  ["payroll", /\b(SALARY|SALARIES|PAYROLL|WAGES?)\b|ΜΙΣΘΟΔΟΣ|ΜΙΣΘΟΙ|ΜΙΣΘΟΣ/],
  ["tax", /\b(TAX|VAT|SOCIAL INSURANCE|INLAND REVENUE|GESY)\b|ΦΟΡΟΣ|ΦΟΡΟΥ|ΦΟΡΟΛΟΓ|ΦΠΑ|Φ\.Π\.Α|ΚΟΙΝΩΝΙΚΕΣ ΑΣΦΑΛΙΣΕΙΣ|ΓΕΣΥ/],
  ["cash", /\b(ATM|CASH WITHDRAWAL)\b|ΑΝΑΛΗΨΗ/],
  ["bank", /\b(BANK CHARGES?|CHARGES|FEES?|COMMISSION|INTEREST)\b|ΠΡΟΜΗΘΕΙΑ|ΤΡΑΠΕΖΙΚΑ ΕΞΟΔΑ|ΤΟΚΟΙ|ΤΟΚΟΣ/],
  ["transfer", /\bOWN ACCOUNTS?\b|\bBETWEEN (MY )?ACCOUNTS\b|\bINTERNAL TRANSFER\b|ΙΔΙΟΥ ΛΟΓΑΡΙΑΣΜΟΥ|ΜΕΤΑΞΥ ΛΟΓΑΡΙΑΣΜΩΝ/],
  ["loan", /\b(LOAN|MORTGAGE|INSTAL+MENT)\b|ΔΑΝΕΙ/],
  ["card", /\b(CARD REPAYMENT|CREDIT CARD PAYMENT)\b|ΠΙΣΤΩΤΙΚΗΣ ΚΑΡΤΑΣ/],
];

function upperPlain(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/\s+/g, " ").trim();
}

/** The reason a payment is probably not to a supplier, or null. */
export function notSupplierReason(description: string | null | undefined): NotSupplier | null {
  if (!description) return null;
  const t = upperPlain(description);
  for (const [reason, re] of NOT_SUPPLIER) if (re.test(t)) return reason;
  return null;
}

/** One money-out line from a statement, exactly as printed. */
export interface StatementDebit { date: string; description: string; amount: number }
export interface PayeeCandidate extends PayeeTotal { reason: NotSupplier | null }

/** Payees on a statement, largest spend first, each with a reason if it is probably not a supplier. */
export function payeeCandidates(debits: StatementDebit[], max = 60): PayeeCandidate[] {
  const reasons = new Map<string, NotSupplier>();
  const payments: Payment[] = [];
  for (const d of debits) {
    const key = payeeKey(d.description);
    if (!key) continue;
    const r = notSupplierReason(d.description);
    if (r && !reasons.has(key)) reasons.set(key, r);
    payments.push({ key, amount: d.amount, bookedOn: d.date });
  }
  return totalsByPayee(payments).slice(0, max).map((p) => ({ ...p, reason: reasons.get(p.key) ?? null }));
}

/** Same day, same amount, same payee: one payment, whichever door it came through. */
export function paymentFingerprint(bookedOn: string, amount: number, key: string): string {
  return `${bookedOn}|${Math.abs(amount).toFixed(2)}|${key}`;
}

/**
 * The supplier on the list this payee already belongs to, or null. Matches a
 * saved payee, the supplier name inside the payee, or the same name once
 * "Ltd", punctuation and case are ignored.
 */
export function existingSupplierFor(
  payee: { key: string; label: string },
  suppliers: { supplierName: string; bankPayee: string | null }[],
): string | null {
  const label = norm(payee.label);
  for (const s of suppliers) {
    if (payeeMatches(payee.key, s) || payeeMatches(payee.key, { supplierName: s.supplierName, bankPayee: null })) return s.supplierName;
    if (label.length >= 3 && norm(s.supplierName) === label) return s.supplierName;
  }
  return null;
}
