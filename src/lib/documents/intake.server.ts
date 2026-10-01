/**
 * Document intake: reads one dropped file and returns a proposal or a refusal.
 *
 * Order of work: the file type comes from its bytes; spreadsheets and CSV are
 * read by code only; PDFs give up their text layer and fixed rules recognise
 * EAC bills, water bills and bank statements; only then is the AI reader
 * asked, and its figures must quote the document. EAC and water bills reuse
 * the same readers as the Integrations page, so both doors give one answer.
 */

import * as XLSX from "xlsx";
import { aiChatRaw, hasDocumentAi, hasImageAi, parseJsonAnswer } from "@/lib/lovable-ai";
import { readEacBill, eacBills, type EacBill } from "@/lib/integrations/eac.server";
import { readWaterBill, waterBills, type WaterBill } from "@/lib/integrations/water.server";
import type { UploadKind } from "@/lib/validate";
import type { FootprintKey } from "@/lib/emissions/footprint";
import { categorise } from "@/lib/bank/categorize";
import {
  parseCsv,
  periodOk,
  plausible,
  quoteSupports,
  readBankRows,
  readConsumptionRows,
  recogniseText,
  refuseText,
  sharesFor,
  summariseBank,
  toFootprintUnit,
  isIsoDate,
  normaliseForMatch,
  type BankLine,
  type IntakeKind,
  type IntakeProposal,
  type IntakeResult,
  type ProposedFigure,
  type WarningCode,
} from "./intake";

const MIME: Record<UploadKind, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
  csv: "text/csv",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export function mimeFor(kind: UploadKind) {
  return MIME[kind];
}

const TEXT_BUDGET = 60_000;

async function pdfText(bytes: Uint8Array): Promise<string> {
  try {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    const { text } = await extractText(pdf, { mergePages: true });
    return (text ?? "").trim();
  } catch {
    return "";
  }
}

function finish(
  kind: IntakeKind,
  recognisedBy: "code" | "ai",
  figures: ProposedFigure[],
  extra: { warnings?: WarningCode[]; bank?: IntakeProposal["bank"]; description?: string | null } = {},
): IntakeProposal {
  const { shares, openMonth } = sharesFor(figures);
  const warnings = new Set<WarningCode>(extra.warnings ?? []);
  if (openMonth) warnings.add("period_not_ended");
  if (figures.some((f) => !f.verified)) warnings.add("unverified_quote");
  return { kind, recognisedBy, figures, shares, bank: extra.bank ?? null, warnings: [...warnings], description: extra.description ?? null };
}

// ── Known bills ─────────────────────────────────────────────────────────

async function eac(userId: string, bytes: Uint8Array, mime: string, by: "code" | "ai"): Promise<IntakeResult> {
  const read = await readEacBill(bytes, mime);
  if (!read.ok) return { ok: false, code: "unreadable", detail: read.reason };
  const bill: EacBill = read.bill;
  const existing = await eacBills(userId);
  const dup = existing.some(
    (b) => b.periodStart === bill.periodStart && b.periodEnd === bill.periodEnd && (b.accountNumber ?? "") === (bill.accountNumber ?? ""),
  );
  const figure: ProposedFigure = { key: "electricity", value: bill.kwh, periodStart: bill.periodStart, periodEnd: bill.periodEnd, quote: null, verified: true };
  return { ok: true, proposal: finish("eac_bill", by, [figure], { warnings: dup ? ["already_uploaded"] : [] }), bill };
}

async function water(userId: string, bytes: Uint8Array, mime: string, by: "code" | "ai"): Promise<IntakeResult> {
  const read = await readWaterBill(bytes, mime);
  if (!read.ok) return { ok: false, code: "unreadable", detail: read.reason };
  const bill: WaterBill = read.bill;
  const existing = await waterBills(userId);
  const dup = existing.some(
    (b) => b.board === bill.board && b.periodStart === bill.periodStart && b.periodEnd === bill.periodEnd && (b.accountNumber ?? "") === (bill.accountNumber ?? ""),
  );
  const figure: ProposedFigure = { key: "water", value: bill.m3 * 1000, periodStart: bill.periodStart, periodEnd: bill.periodEnd, quote: null, verified: true };
  return { ok: true, proposal: finish("water_bill", by, [figure], { warnings: dup ? ["already_uploaded"] : [] }), bill };
}

// ── Bank statement as PDF text ──────────────────────────────────────────

const BANK_PROMPT = `This is the text of a bank account statement. List every payment going OUT of the account.
Return ONLY JSON: {"transactions":[{"date":"YYYY-MM-DD","description":"exact text as printed","amount":number}]}
- description must be copied exactly from the statement text.
- amount is the positive money-out value in euros.
- Leave out money coming in. Never invent rows.`;

async function bankFromText(text: string): Promise<IntakeResult> {
  const answer = await aiChatRaw([{ role: "user", content: `${BANK_PROMPT}\n\n---\n${text.slice(0, TEXT_BUDGET)}` }], 0);
  const parsed = parseJsonAnswer<{ transactions?: Array<{ date?: unknown; description?: unknown; amount?: unknown }> }>(answer);
  const rows = Array.isArray(parsed?.transactions) ? parsed!.transactions : [];
  const haystack = normaliseForMatch(text);
  const lines: BankLine[] = [];
  let count = 0;
  let first: string | null = null;
  let last: string | null = null;
  for (const r of rows.slice(0, 2000)) {
    const date = typeof r.date === "string" && isIsoDate(r.date) ? r.date : null;
    const description = typeof r.description === "string" ? r.description.trim().slice(0, 200) : "";
    const amount = Number(r.amount);
    // Rows whose text is not in the statement are dropped: the reader may not invent payments.
    if (!date || description.length < 3 || !Number.isFinite(amount) || amount <= 0 || amount > 10_000_000) continue;
    if (!haystack.includes(normaliseForMatch(description))) continue;
    count++;
    if (first === null || date < (first as string)) first = date;
    if (last === null || date > (last as string)) last = date;
    const c = categorise(description, "debit");
    if (c.category !== "other" && c.rule) lines.push({ date, description, amount: Math.round(amount * 100) / 100, category: c.category, rule: c.rule });
  }
  if (count === 0) return { ok: false, code: "unreadable" };
  return { ok: true, proposal: finish("bank_statement", "code", [], { bank: summariseBank(lines, count, first, last), warnings: ["spend_not_usage"] }) };
}

// ── Anything else: the general reader ──────────────────────────────────

const GENERAL_PROMPT = `You check documents a small business uploads to work out its carbon footprint. The document may be in Greek or English.
Return ONLY JSON:
{"document_type":"eac_bill"|"water_bill"|"bank_statement"|"utility_invoice"|"fuel_receipt"|"waste_invoice"|"other",
 "description":"what the document is, under 12 words",
 "figures":[{"activity":"electricity"|"gas"|"water"|"waste"|"transport","value":number,"unit":"kWh"|"MWh"|"m3"|"litres"|"kg"|"tonnes"|"km","fuel_litres":number|null,"period_start":"YYYY-MM-DD","period_end":"YYYY-MM-DD","quote":"the exact line the value is printed on"}]}
Rules:
- Only quantities actually used (kWh, m³, litres, kg, km). Never money amounts, never meter readings.
- quote must be copied character for character from the document.
- transport is distance driven in km. A fuel receipt shows litres: put them in fuel_litres and leave value 0.
- A sewerage bill (Συμβούλιο Αποχετεύσεων), a municipal tax or licence bill, or a telephone / internet / TV bill (Cablenet, Cyta, Epic, Primetel) is "other" with no figures, even if it is a utility bill.
- If the document is not about energy, water, waste, fuel or travel (an ID card, a contract, a menu, a CV), use "other" and no figures.
- If a date is not printed, leave the figure out. Never estimate.`;

async function general(userId: string, bytes: Uint8Array, mime: string, text: string | null): Promise<IntakeResult> {
  const content: unknown[] = [{ type: "text", text: GENERAL_PROMPT }];
  if (text) content.push({ type: "text", text: `---\n${text.slice(0, TEXT_BUDGET)}` });
  else {
    const url = `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
    content.push(mime.startsWith("image/") ? { type: "image_url", image_url: { url } } : { type: "file", file: { filename: "document.pdf", file_data: url } });
  }
  const answer = await aiChatRaw([{ role: "user", content }], 0);
  const parsed = parseJsonAnswer<{ document_type?: string; description?: string; figures?: unknown[] }>(answer);
  if (!parsed) return { ok: false, code: "unreadable" };
  const description = typeof parsed.description === "string" ? parsed.description.slice(0, 120) : null;
  const type = parsed.document_type;

  // A known bill seen by the reader goes to its own reader for checked fields.
  if (type === "eac_bill") return eac(userId, bytes, mime, "ai");
  if (type === "water_bill") return water(userId, bytes, mime, "ai");
  if (type === "bank_statement") {
    if (text) return bankFromText(text);
    return { ok: false, code: "bank_image", detail: description };
  }
  const kind: IntakeKind | null =
    type === "utility_invoice" || type === "fuel_receipt" || type === "waste_invoice" ? type : null;
  if (!kind) return { ok: false, code: "not_relevant", detail: description };

  const warnings: WarningCode[] = [];
  const figures: ProposedFigure[] = [];
  for (const raw of (Array.isArray(parsed.figures) ? parsed.figures : []).slice(0, 24)) {
    const f = raw as Record<string, unknown>;
    if (Number(f.fuel_litres) > 0) warnings.push("fuel_litres");
    const key = f.activity as FootprintKey;
    if (!["electricity", "gas", "water", "waste", "transport"].includes(key)) continue;
    const value = toFootprintUnit(key, Number(f.value), String(f.unit ?? ""));
    if (value === null) {
      if (Number(f.value) > 0) warnings.push("unit_dropped");
      continue;
    }
    const start = String(f.period_start ?? "");
    const end = String(f.period_end ?? "");
    if (!plausible(key, value) || !periodOk(start, end)) continue;
    const quote = typeof f.quote === "string" ? f.quote.slice(0, 240) : null;
    figures.push({
      key,
      value: Math.round(value * 100) / 100,
      periodStart: start,
      periodEnd: end,
      quote,
      // A photo has no text layer to check against, so its figures always need a person's eye.
      verified: text ? quoteSupports(text, quote, Number(f.value)) : false,
    });
  }
  if (figures.length === 0) return { ok: false, code: warnings.includes("fuel_litres") ? "fuel_only" : "no_figures", detail: description };
  return { ok: true, proposal: finish(kind, "ai", figures, { warnings, description }) };
}

// ── Entry point ─────────────────────────────────────────────────────────

export async function readDocument(userId: string, bytes: Uint8Array, kind: UploadKind): Promise<IntakeResult> {
  if (kind === "csv" || kind === "xlsx") {
    let rows: string[][];
    if (kind === "csv") rows = parseCsv(new TextDecoder("utf-8").decode(bytes));
    else {
      const book = XLSX.read(bytes, { type: "array" });
      const sheet = book.Sheets[book.SheetNames[0]];
      if (!sheet) return { ok: false, code: "unreadable" };
      rows = parseCsv(XLSX.utils.sheet_to_csv(sheet, { FS: ";" }));
    }
    const bank = readBankRows(rows);
    if (bank) return { ok: true, proposal: finish("bank_statement", "code", [], { bank, warnings: ["spend_not_usage"] }) };
    const usage = readConsumptionRows(rows);
    if (usage === "no_dates") return { ok: false, code: "sheet_no_dates" };
    if (usage) return { ok: true, proposal: finish("consumption_sheet", "code", usage.figures) };
    return { ok: false, code: "not_relevant" };
  }

  if (!hasDocumentAi()) return { ok: false, code: "reader_off" };
  const mime = MIME[kind];

  if (kind === "pdf") {
    const text = await pdfText(bytes);
    if (!text) {
      // Scanned PDF: only the image-capable reader can look at it.
      if (!hasImageAi()) return { ok: false, code: "scanned_pdf" };
      return general(userId, bytes, mime, null);
    }
    const seen = recogniseText(text);
    if (seen === "eac_bill") return eac(userId, bytes, mime, "code");
    if (seen === "water_bill") return water(userId, bytes, mime, "code");
    if (seen === "bank_statement") return bankFromText(text);
    const refused = refuseText(text);
    if (refused) return { ok: false, code: "not_relevant", detail: refused };
    return general(userId, bytes, mime, text);
  }

  return general(userId, bytes, mime, null);
}
