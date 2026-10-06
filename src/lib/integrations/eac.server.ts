/**
 * Electricity Authority of Cyprus bills.
 *
 * EAC has no public API, so the link is the bill itself: the operator uploads
 * a bill (PDF or photo), the AI reader returns the account, period, kWh and
 * amount, and each field is checked before anything is stored. A bill whose
 * kWh cannot be read is refused, never guessed. Scope 2 is kWh × the published
 * Cyprus grid factor in REFERENCE_FACTORS.
 */

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { aiChatRaw, hasDocumentAi, parseJsonAnswer } from "@/lib/vuneli-ai";
import { REFERENCE_FACTORS } from "@/lib/emissions/reference-factors";

export const EAC_SOURCE = "eac_bill";

export interface EacBill {
  accountNumber: string | null;
  periodStart: string;
  periodEnd: string;
  kwh: number;
  amountEur: number | null;
}

export interface EacBillRow extends EacBill {
  id: number;
  fileName: string;
  uploadedAt: string;
  kgCo2e: number;
}

export interface EacSummary {
  readerReady: boolean;
  factor: { kgPerKwh: number; source: string; vintage: string };
  bills: EacBillRow[];
  totalKwh: number;
  totalKgCo2e: number;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function toIsoDate(d: string): string {
  d = d.trim();
  if (ISO_DATE.test(d)) return d;
  const m = d.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})$/);
  if (m) {
    const day = m[1].padStart(2, "0");
    const month = m[2].padStart(2, "0");
    const year = m[3];
    return `${year}-${month}-${day}`;
  }
  return d;
}

/** Pure check of the reader's answer, exported for tests. */
export function checkEacAnswer(raw: unknown): { ok: true; bill: EacBill } | { ok: false; reason: string } {
  if (!raw || typeof raw !== "object") return { ok: false, reason: "The bill could not be read." };
  const r = raw as Record<string, unknown>;
  if (r.is_eac_bill === false) return { ok: false, reason: "This does not look like an EAC electricity bill." };
  const kwh = Number(r.kwh);
  if (!Number.isFinite(kwh) || kwh <= 0 || kwh > 10_000_000) {
    return { ok: false, reason: "The kWh used could not be read from the bill." };
  }
  const start = toIsoDate(String(r.period_start ?? ""));
  const end = toIsoDate(String(r.period_end ?? ""));
  if (!ISO_DATE.test(start) || !ISO_DATE.test(end) || Number.isNaN(Date.parse(start)) || Date.parse(end) < Date.parse(start)) {
    return { ok: false, reason: "The billing period could not be read from the bill." };
  }
  const days = (Date.parse(end) - Date.parse(start)) / 86_400_000;
  if (days > 400) return { ok: false, reason: "The billing period on the bill is longer than a year." };
  const amount = r.amount_eur === null || r.amount_eur === undefined ? null : Number(r.amount_eur);
  const cleanedAccount = typeof r.account_number === "string" ? r.account_number.replace(/[^\w-]/g, "").slice(0, 32) : "";
  // A masked or blacked-out number ("XXXXXXXX") is not an account number: it must contain a digit.
  const account = /\d/.test(cleanedAccount) ? cleanedAccount : "";
  return {
    ok: true,
    bill: {
      accountNumber: account || null,
      periodStart: start,
      periodEnd: end,
      kwh: Math.round(kwh * 100) / 100,
      amountEur: amount !== null && Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) / 100 : null,
    },
  };
}

const PROMPT = `You read electricity bills from the Electricity Authority of Cyprus (EAC / ΑΗΚ). The bill may be in Greek or English.
Return ONLY a JSON object:
{"is_eac_bill": true|false, "account_number": string|null, "period_start": "YYYY-MM-DD", "period_end": "YYYY-MM-DD", "kwh": number, "amount_eur": number|null}
- kwh: total electricity consumed in the billing period (Κατανάλωση kWh). Not the meter reading.
- amount_eur: total amount payable including VAT.
- period_start and period_end: convert any DD/MM/YYYY or Cyprus date format to ISO YYYY-MM-DD.
- Use null for anything not printed on the bill. Never estimate.`;

export async function readEacBill(bytes: Uint8Array, mime: string): Promise<{ ok: true; bill: EacBill } | { ok: false; reason: string }> {
  const dataUrl = `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
  const attachment = mime.startsWith("image/")
    ? { type: "image_url", image_url: { url: dataUrl } }
    : { type: "file", file: { filename: "eac-bill.pdf", file_data: dataUrl } };
  const text = await aiChatRaw([{ role: "user", content: [{ type: "text", text: PROMPT }, attachment] }], 0);
  return checkEacAnswer(parseJsonAnswer<unknown>(text));
}

export async function saveEacBill(userId: string, fileName: string, mime: string, bytes: Uint8Array, bill: EacBill) {
  const existing = await eacBills(userId);
  const dup = existing.find(
    (b) => b.periodStart === bill.periodStart && b.periodEnd === bill.periodEnd && (b.accountNumber ?? "") === (bill.accountNumber ?? ""),
  );
  if (dup) return { duplicate: true as const, id: dup.id };
  const now = new Date().toISOString();
  const [row] = await db
    .insert(documents)
    .values({
      userId,
      fileName: fileName.slice(0, 200),
      fileType: mime === "application/pdf" ? "pdf" : "image",
      fileSize: bytes.length,
      fileUrl: `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`,
      uploadSource: EAC_SOURCE,
      processingStatus: "completed",
      parsedData: JSON.stringify(bill),
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: documents.id });
  return { duplicate: false as const, id: row.id };
}

export async function eacBills(userId: string): Promise<EacBillRow[]> {
  const f = REFERENCE_FACTORS.electricity;
  const rows = await db
    .select({ id: documents.id, fileName: documents.fileName, parsedData: documents.parsedData, createdAt: documents.createdAt })
    .from(documents)
    .where(and(eq(documents.userId, userId), eq(documents.uploadSource, EAC_SOURCE)))
    .orderBy(desc(documents.createdAt))
    .limit(100);
  const out: EacBillRow[] = [];
  for (const r of rows) {
    try {
      const b = JSON.parse(r.parsedData ?? "") as EacBill;
      if (typeof b.kwh !== "number") continue;
      out.push({ ...b, id: r.id, fileName: r.fileName, uploadedAt: r.createdAt, kgCo2e: b.kwh * f.kgCo2ePerUnit });
    } catch {
      /* unreadable row: left out */
    }
  }
  return out.sort((a, b) => b.periodEnd.localeCompare(a.periodEnd));
}

export async function eacSummary(userId: string): Promise<EacSummary> {
  const f = REFERENCE_FACTORS.electricity;
  const bills = await eacBills(userId);
  return {
    readerReady: hasDocumentAi(),
    factor: { kgPerKwh: f.kgCo2ePerUnit, source: f.source, vintage: f.vintage },
    bills: bills.slice(0, 6),
    totalKwh: bills.reduce((s, b) => s + b.kwh, 0),
    totalKgCo2e: bills.reduce((s, b) => s + b.kgCo2e, 0),
  };
}

export async function deleteEacBill(userId: string, id: number) {
  const r = await db
    .delete(documents)
    .where(and(eq(documents.id, id), eq(documents.userId, userId), eq(documents.uploadSource, EAC_SOURCE)))
    .returning({ id: documents.id });
  return r.length > 0;
}
