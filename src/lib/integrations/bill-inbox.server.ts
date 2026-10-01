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
import { activityEvents, billInboxes } from "@/db/schema";
import { hasLovableAi } from "@/lib/lovable-ai";
import { checkUpload } from "@/lib/validate";
import { readEacBill, saveEacBill } from "./eac.server";
import { readWaterBill, saveWaterBill } from "./water.server";
import { billHint, gmailConfirmation, newInboxToken, tokenFromAddress } from "./bill-inbox";

const MIME = { pdf: "application/pdf", png: "image/png", jpeg: "image/jpeg", webp: "image/webp" } as const;
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

async function readOne(
  userId: string,
  fileName: string,
  bytes: Uint8Array,
  mime: string,
  first: "electricity" | "water",
): Promise<InboxResult> {
  const order: ("electricity" | "water")[] = first === "electricity" ? ["electricity", "water"] : ["water", "electricity"];
  const reasons: string[] = [];
  for (const kind of order) {
    if (kind === "water") {
      const r = await readWaterBill(bytes, mime);
      if (r.ok) {
        const s = await saveWaterBill(userId, fileName, mime, bytes, r.bill);
        return { file: fileName, kind, ok: true, duplicate: s.duplicate, reason: null };
      }
      reasons.push(r.reason);
    } else {
      const r = await readEacBill(bytes, mime);
      if (r.ok) {
        const s = await saveEacBill(userId, fileName, mime, bytes, r.bill);
        return { file: fileName, kind, ok: true, duplicate: s.duplicate, reason: null };
      }
      reasons.push(r.reason);
    }
  }
  return { file: fileName, kind: null, ok: false, duplicate: false, reason: "Not read as an EAC or water bill. " + reasons[0] };
}

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

  const mail = await PostalMime.parse(raw);
  const from = mail.from?.address?.slice(0, 200) ?? null;
  const subject = mail.subject?.slice(0, 200) ?? null;
  const now = new Date();

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
    if (!hasLovableAi()) {
      results.push({ file: name, kind: null, ok: false, duplicate: false, reason: "The bill reader is not set up yet." });
      continue;
    }
    try {
      results.push(await readOne(inbox.userId, name, bytes, MIME[verdict.kind as keyof typeof MIME], billHint(from, subject, name) ?? "water"));
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
      actorType: "system",
      actorName: "Bill inbox",
      verb: "added",
      object: added === 1 ? "1 forwarded bill" : `${added} forwarded bills`,
      detail: results.filter((r) => r.ok && !r.duplicate).map((r) => `${r.kind}: ${r.file}`).join(", ").slice(0, 400),
    });
  }
  return { status: 200, results };
}
