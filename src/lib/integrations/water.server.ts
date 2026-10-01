/**
 * Cyprus water board bills.
 *
 * Like EAC, the water boards have no public API, so the bill is the link.
 * The operator uploads a bill (PDF or photo), the AI reader returns the
 * board, account, period, m³ and amount, and each field is checked before
 * anything is stored. A bill whose m³ or period cannot be read is refused,
 * never guessed; a blank sample form is refused the same way.
 *
 * Water supply and treatment are Scope 3 (category 1, purchased goods and
 * services): m³ × the published factor in REFERENCE_FACTORS (per litre).
 */

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { aiChatRaw, hasDocumentAi, parseJsonAnswer } from "@/lib/lovable-ai";
import { REFERENCE_FACTORS } from "@/lib/emissions/reference-factors";

export const WATER_SOURCE = "water_bill";

/** Boards the reader knows by name. Anything else is kept as "other". */
export const WATER_BOARDS = {
  nicosia: { en: "Water Board of Nicosia", el: "Συμβούλιο Υδατοπρομήθειας Λευκωσίας" },
  limassol: { en: "Water Board of Limassol", el: "Συμβούλιο Υδατοπρομήθειας Λεμεσού" },
  larnaca: { en: "Water Board of Larnaca", el: "Συμβούλιο Υδατοπρομήθειας Λάρνακας" },
  paphos: { en: "Paphos water supply", el: "Υδατοπρομήθεια Πάφου" },
  other: { en: "Other water supplier", el: "Άλλος πάροχος νερού" },
} as const;
export type WaterBoard = keyof typeof WATER_BOARDS;

export interface WaterBill {
  board: WaterBoard;
  accountNumber: string | null;
  periodStart: string;
  periodEnd: string;
  m3: number;
  amountEur: number | null;
}

export interface WaterBillRow extends WaterBill {
  id: number;
  fileName: string;
  uploadedAt: string;
  kgCo2e: number;
}

export interface WaterSummary {
  readerReady: boolean;
  factor: { kgPerM3: number; source: string; vintage: string };
  bills: WaterBillRow[];
  totalM3: number;
  totalKgCo2e: number;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
/** kg CO2e per m³ (the reference factor is per litre). */
const kgPerM3 = () => REFERENCE_FACTORS.water.kgCo2ePerUnit * 1000;

/** Pure check of the reader's answer, exported for tests. */
export function checkWaterAnswer(raw: unknown): { ok: true; bill: WaterBill } | { ok: false; reason: string } {
  if (!raw || typeof raw !== "object") return { ok: false, reason: "The bill could not be read." };
  const r = raw as Record<string, unknown>;
  if (r.is_water_bill === false) return { ok: false, reason: "This does not look like a water bill." };
  const m3 = Number(r.m3);
  // A household uses ~10–20 m³ a month; a large site far more. Above 1,000,000 m³ is a misread.
  if (r.m3 === null || r.m3 === undefined || r.m3 === "" || !Number.isFinite(m3) || m3 <= 0 || m3 > 1_000_000) {
    return { ok: false, reason: "The water used (m³) could not be read from the bill." };
  }
  const start = String(r.period_start ?? "");
  const end = String(r.period_end ?? "");
  if (!ISO_DATE.test(start) || !ISO_DATE.test(end) || Number.isNaN(Date.parse(start)) || Number.isNaN(Date.parse(end)) || Date.parse(end) < Date.parse(start)) {
    return { ok: false, reason: "The billing period could not be read from the bill." };
  }
  // Water boards bill every 1–4 months; allow a full year for annual statements.
  if ((Date.parse(end) - Date.parse(start)) / 86_400_000 > 400) {
    return { ok: false, reason: "The billing period on the bill is longer than a year." };
  }
  const boardRaw = typeof r.board === "string" ? r.board.toLowerCase() : "";
  const board: WaterBoard = boardRaw in WATER_BOARDS ? (boardRaw as WaterBoard) : "other";
  const amount = r.amount_eur === null || r.amount_eur === undefined || r.amount_eur === "" ? null : Number(r.amount_eur);
  const cleanedAccount = typeof r.account_number === "string" ? r.account_number.replace(/[^\w-]/g, "").slice(0, 32) : "";
  // A masked or blacked-out number ("XXXXXXXX") is not an account number: it must contain a digit.
  const account = /\d/.test(cleanedAccount) ? cleanedAccount : "";
  return {
    ok: true,
    bill: {
      board,
      accountNumber: account || null,
      periodStart: start,
      periodEnd: end,
      m3: Math.round(m3 * 1000) / 1000,
      amountEur: amount !== null && Number.isFinite(amount) && amount >= 0 && amount < 1_000_000 ? Math.round(amount * 100) / 100 : null,
    },
  };
}

const PROMPT = `You read water bills from Cyprus water suppliers: Water Board of Nicosia (Συμβούλιο Υδατοπρομήθειας Λευκωσίας), Water Board of Limassol / Lemesos (Λεμεσού), Water Board of Larnaca (Λάρνακας), Paphos Municipality water supply (Δήμος Πάφου Υδατοπρομήθεια), or any other municipal or community water supplier (e.g. Paralimni, Ayia Napa, village water committees: use "other"). The bill may be in Greek or English.
Return ONLY a JSON object:
{"is_water_bill": true|false, "board": "nicosia"|"limassol"|"larnaca"|"paphos"|"other", "account_number": string|null, "period_start": "YYYY-MM-DD", "period_end": "YYYY-MM-DD", "m3": number|null, "amount_eur": number|null}
- m3: total water consumed in the billing period, in cubic metres (κυβικά μέτρα, κμ, m³, Κατανάλωση). This is NOT a meter reading (Ένδειξη Μετρητή) and NOT a price per m³.
- If the bill states consumption in litres, convert to m³ (divide by 1000).
- period_start / period_end: the consumption period (Περίοδος Κατανάλωσης / Περίοδος Λογαριασμού). A period written with month names only (e.g. "27 ΝΟΕΜ - 1 ΦΕΒΡ 2010") crosses a year end when the end month is before the start month.
- amount_eur: total amount due (Οφειλόμενο ποσό / Amount due), including VAT.
- A blank form, a template, or a bill whose values are crossed out or masked: use null for those values. Never estimate. Never copy an example value.
- A sewerage, electricity, telephone or tax bill is not a water bill: set is_water_bill to false.`;

export async function readWaterBill(bytes: Uint8Array, mime: string): Promise<{ ok: true; bill: WaterBill } | { ok: false; reason: string }> {
  const dataUrl = `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
  const attachment = mime.startsWith("image/")
    ? { type: "image_url", image_url: { url: dataUrl } }
    : { type: "file", file: { filename: "water-bill.pdf", file_data: dataUrl } };
  const text = await aiChatRaw([{ role: "user", content: [{ type: "text", text: PROMPT }, attachment] }], 0);
  return checkWaterAnswer(parseJsonAnswer<unknown>(text));
}

export async function saveWaterBill(userId: string, fileName: string, mime: string, bytes: Uint8Array, bill: WaterBill) {
  const existing = await waterBills(userId);
  const dup = existing.find(
    (b) =>
      b.board === bill.board &&
      b.periodStart === bill.periodStart &&
      b.periodEnd === bill.periodEnd &&
      (b.accountNumber ?? "") === (bill.accountNumber ?? ""),
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
      uploadSource: WATER_SOURCE,
      processingStatus: "completed",
      parsedData: JSON.stringify(bill),
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: documents.id });
  return { duplicate: false as const, id: row.id };
}

export async function waterBills(userId: string): Promise<WaterBillRow[]> {
  const f = kgPerM3();
  const rows = await db
    .select({ id: documents.id, fileName: documents.fileName, parsedData: documents.parsedData, createdAt: documents.createdAt })
    .from(documents)
    .where(and(eq(documents.userId, userId), eq(documents.uploadSource, WATER_SOURCE)))
    .orderBy(desc(documents.createdAt))
    .limit(100);
  const out: WaterBillRow[] = [];
  for (const r of rows) {
    try {
      const b = JSON.parse(r.parsedData ?? "") as WaterBill;
      if (typeof b.m3 !== "number") continue;
      out.push({ ...b, board: b.board in WATER_BOARDS ? b.board : "other", id: r.id, fileName: r.fileName, uploadedAt: r.createdAt, kgCo2e: b.m3 * f });
    } catch {
      /* unreadable row: left out */
    }
  }
  return out.sort((a, b) => b.periodEnd.localeCompare(a.periodEnd));
}

export async function waterSummary(userId: string): Promise<WaterSummary> {
  const w = REFERENCE_FACTORS.water;
  const bills = await waterBills(userId);
  return {
    readerReady: hasDocumentAi(),
    factor: { kgPerM3: Math.round(kgPerM3() * 1000) / 1000, source: w.source, vintage: w.vintage },
    bills: bills.slice(0, 6),
    totalM3: bills.reduce((s, b) => s + b.m3, 0),
    totalKgCo2e: bills.reduce((s, b) => s + b.kgCo2e, 0),
  };
}

export async function deleteWaterBill(userId: string, id: number) {
  const r = await db
    .delete(documents)
    .where(and(eq(documents.id, id), eq(documents.userId, userId), eq(documents.uploadSource, WATER_SOURCE)))
    .returning({ id: documents.id });
  return r.length > 0;
}
