/**
 * Bill inbox: each account gets one private address, <token>@BILL_INBOX_DOMAIN.
 * The customer sets their email to auto-forward EAC and water board e-bills
 * there. Cloudflare Email Routing hands each message to the worker, which
 * posts the raw message to /api/public/inbound/bill-email.
 *
 * Each PDF or photo attachment goes through the same readers and checks as an
 * upload, so a forwarded bill is held to the same standard: unreadable m³,
 * kWh or period is refused, never guessed. Only the outcome is recorded on
 * the inbox; the message body is not kept.
 */

import { eq } from "drizzle-orm";
import PostalMime from "postal-mime";
import { db } from "@/db";
import { activityEvents, billInboxes, documents } from "@/db/schema";
import { hasDocumentAi } from "@/lib/lovable-ai";
import { checkUpload } from "@/lib/validate";
import { readDocument, mimeFor } from "@/lib/documents/intake.server";
import { gmailConfirmation, newInboxToken, tokenFromAddress } from "./bill-inbox";

const PENDING_SOURCE = "intake_pending";
const MAX_ATTACHMENTS = 5;
/** Logos and signature images are small; a photographed bill is not. */
const MIN_IMAGE_BYTES = 30 * 1024;

export type InboxResult = (typeof billInboxes.$inferSelect)["lastResult"][number];

export interface BillInboxSummary {
  /** The domain is set and inbound mail is wired on the server. */
  ready: boolean;
  address: string | null;
  lastMessageAt: string | null;
  lastMessageFrom: string | null;
  lastMessageSubject: string | null;
  lastResult: InboxResult[];
  confirmation: { code: string | null; link: string | null; at: string } | null;
}

export function inboxDomain(): string | null {
  const d = process.env.BILL_INBOX_DOMAIN?.trim().toLowerCase();
  return d && /^[a-z0-9.-]+\.[a-z]{2,}$/.test(d) ? d : null;
}

function ready() {
  return !!inboxDomain() && !!process.env.INBOUND_EMAIL_SECRET?.trim();
}

export async function billInboxSummary(userId: string): Promise<BillInboxSummary> {
  const domain = inboxDomain();
  const [row] = await db.select().from(billInboxes).where(eq(billInboxes.userId, userId)).limit(1);
  return {
    ready: ready(),
    address: row && domain ? `${row.token}@${domain}` : null,
    lastMessageAt: row?.lastMessageAt ? new Date(row.lastMessageAt).toISOString() : null,
    lastMessageFrom: row?.lastMessageFrom ?? null,
    lastMessageSubject: row?.lastMessageSubject ?? null,
    lastResult: row?.lastResult ?? [],
    confirmation: row?.confirmation ? { code: row.confirmation.code, link: row.confirmation.link, at: row.confirmation.at } : null,
  };
}

/** Creates the address, or replaces it with a new one when `rotate` is set. */
export async function openBillInbox(userId: string, workspaceId: string, rotate: boolean): Promise<{ address: string } | null> {
  const domain = inboxDomain();
  if (!domain || !ready()) return null;
  const [existing] = await db.select().from(billInboxes).where(eq(billInboxes.userId, userId)).limit(1);
  if (existing && !rotate) return { address: `${existing.token}@${domain}` };
  const token = newInboxToken();
  if (existing) {
    await db
      .update(billInboxes)
      .set({ token, workspaceId, confirmation: null, lastResult: [], lastMessageAt: null, lastMessageFrom: null, lastMessageSubject: null })
      .where(eq(billInboxes.userId, userId));
  } else {
    await db.insert(billInboxes).values({ userId, workspaceId, token });
  }
  await db.insert(activityEvents).values({
    workspaceId,
    actorType: "human",
    actorName: "You",
    verb: existing ? "replaced" : "opened",
    object: "Bill inbox",
    detail: existing ? "The old forwarding address no longer receives bills." : "Forwarded EAC and water bills are read from this address.",
  });
  return { address: `${token}@${domain}` };
}

export async function closeBillInbox(userId: string): Promise<boolean> {
  const r = await db.delete(billInboxes).where(eq(billInboxes.userId, userId)).returning({ ws: billInboxes.workspaceId });
  if (r[0]) {
    await db.insert(activityEvents).values({ workspaceId: r[0].ws, actorType: "human", actorName: "You", verb: "closed", object: "Bill inbox", detail: "The forwarding address no longer receives bills." });
  }
  return r.length > 0;
}

/**
 * Reads one attachment with the same intake reader as an Add data upload and
 * holds it as a pending document. Like an upload, nothing reaches company
 * figures until the person checks it in Add data and presses add.
 */
async function readOne(userId: string, fileName: string, bytes: Uint8Array, kind: "pdf" | "png" | "jpeg" | "webp"): Promise<InboxResult> {
  const result = await readDocument(userId, bytes, kind);
  if (!result.ok) {
    return { file: fileName, kind: null, ok: false, duplicate: false, reason: result.detail ? `Not added: ${result.detail}` : REJECT_TEXT[result.code] ?? "Not read as a bill Vuneli can use." };
  }
  const p = result.proposal;
  const billKind = p.kind === "eac_bill" ? "electricity" : p.kind === "water_bill" ? "water" : null;
  if (p.warnings.includes("already_uploaded")) return { file: fileName, kind: billKind, ok: true, duplicate: true, reason: null };
  const now = new Date().toISOString();
  await db.insert(documents).values({
    userId,
    fileName: fileName.replace(/[\\/\x00-\x1f]+/g, "_").slice(0, 200),
    fileType: kind,
    fileSize: bytes.length,
    fileUrl: `data:${mimeFor(kind)};base64,${Buffer.from(bytes).toString("base64")}`,
    uploadSource: PENDING_SOURCE,
    processingStatus: "proposed",
    parsedData: JSON.stringify({ proposal: p, bill: result.bill ?? null, via: "email" }),
    createdAt: now,
    updatedAt: now,
  });
  return { file: fileName, kind: billKind, ok: true, duplicate: false, reason: null, pending: true };
}

const REJECT_TEXT: Partial<Record<string, string>> = {
  not_relevant: "This doesn't look like a bill Vuneli can use for your footprint.",
  unreadable: "The usage or billing period couldn't be read, so nothing was guessed.",
  scanned_pdf: "This PDF is a scan with no text. Please upload a clear photo in Add data.",
  no_figures: "No usage figures with dates were found.",
  reader_off: "The bill reader is not set up yet.",
};

/**
 * Handles one forwarded message. Returns 404 for an unknown address so the
 * worker can bounce it; everything else is recorded on the inbox.
 */
export async function receiveBillEmail(raw: Uint8Array, envelopeTo: string): Promise<{ status: number; results: InboxResult[] }> {
  const domain = inboxDomain();
  const token = domain ? tokenFromAddress(envelopeTo, domain) : null;
  if (!token) return { status: 404, results: [] };
  const [inbox] = await db.select().from(billInboxes).where(eq(billInboxes.token, token)).limit(1);
  if (!inbox) return { status: 404, results: [] };

  const now = new Date();
  let mail: Awaited<ReturnType<typeof PostalMime.parse>>;
  try {
    mail = await PostalMime.parse(raw);
  } catch {
    // Record the arrival anyway, so the person sees the email reached Vuneli.
    const failed: InboxResult[] = [{ file: "—", kind: null, ok: false, duplicate: false, reason: "The email arrived but could not be opened. Please upload the bill in Add data." }];
    await db.update(billInboxes).set({ lastMessageAt: now, lastMessageFrom: null, lastMessageSubject: null, lastResult: failed }).where(eq(billInboxes.userId, inbox.userId));
    return { status: 200, results: failed };
  }
  const from = mail.from?.address?.slice(0, 200) ?? null;
  const subject = mail.subject?.slice(0, 200) ?? null;

  const confirm = gmailConfirmation(from, subject, mail.text);
  if (confirm) {
    await db
      .update(billInboxes)
      .set({ confirmation: { provider: "gmail", ...confirm, at: now.toISOString() }, lastMessageAt: now, lastMessageFrom: from, lastMessageSubject: subject, lastResult: [] })
      .where(eq(billInboxes.userId, inbox.userId));
    return { status: 200, results: [] };
  }

  const results: InboxResult[] = [];
  const candidates = (mail.attachments ?? []).slice(0, 20);
  let read = 0;
  for (const a of candidates) {
    const bytes = a.content instanceof Uint8Array ? a.content : new Uint8Array(a.content as ArrayBuffer);
    const name = (a.filename || "bill").slice(0, 200);
    const verdict = checkUpload(bytes, ["pdf", "png", "jpeg", "webp"]);
    if (!verdict.ok) continue; // not a bill format: skipped quietly
    if (verdict.kind !== "pdf" && (bytes.length < MIN_IMAGE_BYTES || a.disposition === "inline" || a.contentId)) continue;
    if (read >= MAX_ATTACHMENTS) {
      results.push({ file: name, kind: null, ok: false, duplicate: false, reason: `Only the first ${MAX_ATTACHMENTS} attachments of a message are read.` });
      continue;
    }
    read++;
    if (!hasDocumentAi()) {
      results.push({ file: name, kind: null, ok: false, duplicate: false, reason: "The bill reader is not set up yet." });
      continue;
    }
    try {
      results.push(await readOne(inbox.userId, name, bytes, verdict.kind as "pdf" | "png" | "jpeg" | "webp"));
    } catch {
      results.push({ file: name, kind: null, ok: false, duplicate: false, reason: "The bill could not be read just now." });
    }
  }
  if (results.length === 0) {
    results.push({ file: "—", kind: null, ok: false, duplicate: false, reason: "The email had no PDF or photo attached. If the bill is behind a link, download it and forward or upload the file." });
  }

  await db
    .update(billInboxes)
    .set({ lastMessageAt: now, lastMessageFrom: from, lastMessageSubject: subject, lastResult: results })
    .where(eq(billInboxes.userId, inbox.userId));
  const added = results.filter((r) => r.ok && !r.duplicate).length;
  if (added > 0) {
    await db.insert(activityEvents).values({
      workspaceId: inbox.workspaceId,
      actorType: "agent",
      actorName: "Bill inbox",
      verb: "read",
      object: added === 1 ? "1 forwarded bill, waiting for your check in Add data" : `${added} forwarded bills, waiting for your check in Add data`,
      detail: results.filter((r) => r.ok && !r.duplicate).map((r) => `${r.kind}: ${r.file}`).join(", ").slice(0, 400),
    });
  }
  await sendReceipt(mail, from, subject, results);
  return { status: 200, results };
}

const AUTOMATED_SENDER = /^(no-?reply|do-?not-?reply|mailer-daemon|postmaster|bounces?|notifications?|alerts?)([+._-]|@)/i;

/**
 * Tells the sender their email reached Vuneli and what came of each file.
 * Skipped for automated senders (auto-forwarded utility e-bills keep the
 * board's no-reply address) so we never answer machines or create mail loops.
 * A failed send is logged and never affects the bill result.
 */
async function sendReceipt(
  mail: Awaited<ReturnType<typeof PostalMime.parse>>,
  from: string | null,
  subject: string | null,
  results: InboxResult[],
): Promise<void> {
  if (!from || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(from)) return;
  const domain = inboxDomain();
  if (AUTOMATED_SENDER.test(from) || (domain && from.toLowerCase().endsWith("@" + domain))) return;
  const header = (k: string) => mail.headers?.find((h) => h.key.toLowerCase() === k)?.value?.toLowerCase() ?? "";
  const auto = header("auto-submitted");
  if ((auto && auto !== "no") || /bulk|list|junk/.test(header("precedence")) || header("list-id")) return;

  const lines = results.map((r) =>
    r.ok
      ? `- ${r.file}: ${r.duplicate ? "already in Vuneli, not added twice" : `read${r.kind ? ` as ${r.kind === "electricity" ? "an electricity" : "a water"} bill` : ""}, waiting for your check in Add data`}`
      : `- ${r.file === "—" ? "This email" : r.file}: not added. ${r.reason ?? ""}`.trim(),
  );
  const added = results.filter((r) => r.ok && !r.duplicate).length;
  const text = [
    "Hello,",
    "",
    `We received your email${subject ? ` "${subject}"` : ""} at Vuneli.`,
    "",
    ...lines,
    "",
    added > 0
      ? "Open Add data in Vuneli to check the figures and add them to your footprint."
      : "Nothing was added. You can upload the bill directly in Vuneli under Add data.",
    "",
    "This is an automatic message, there's no need to reply.",
    "",
    "Γεια σας, λάβαμε το email σας στη Vuneli. Δείτε τα αποτελέσματα στην ενότητα «Προσθήκη δεδομένων».",
  ].join("\n");

  try {
    const { sendEmail } = await import("@/lib/email/send");
    await sendEmail({ to: from, subject: subject ? `Received: ${subject}`.slice(0, 200) : "We received your bill", text });
  } catch (error) {
    console.log(`[bill-email] receipt not sent: ${error instanceof Error ? error.message : String(error)}`);
  }
}
