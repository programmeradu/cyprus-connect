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
