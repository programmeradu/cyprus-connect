/**
 * Pure helpers for the bill inbox (forwarded utility e-bills). Exported for tests.
 */

/** 20 characters of base32 (a–z, 2–7): 100 bits, unguessable, safe in an email address. */
export const INBOX_TOKEN = /^[a-z2-7]{20}$/;

export function newInboxToken(random: Uint8Array = crypto.getRandomValues(new Uint8Array(20))): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz234567";
  return Array.from(random.subarray(0, 20), (b) => alphabet[b & 31]).join("");
}

/** Returns the token from an envelope address on the inbox domain, or null. */
export function tokenFromAddress(address: string | null | undefined, domain: string): string | null {
  const m = /^\s*<?([^@\s<>]+)@([^@\s<>]+?)>?\s*$/.exec((address ?? "").toLowerCase());
  if (!m || m[2] !== domain.toLowerCase()) return null;
  // Allow plus-addressing on the token: abc…+anything@domain.
  const local = m[1].split("+")[0];
  return INBOX_TOKEN.test(local) ? local : null;
}

/**
 * Gmail sends a confirmation to a new forwarding address before it forwards
 * anything. Pull out the code and link so the owner can finish the step from
 * the app; nothing else in the message is kept.
 */
export function gmailConfirmation(from: string | null | undefined, subject: string | null | undefined, text: string | null | undefined): { code: string | null; link: string | null } | null {
  const sender = (from ?? "").toLowerCase();
  if (!sender.includes("forwarding-noreply@google.com")) return null;
  const body = `${subject ?? ""}\n${text ?? ""}`;
  const code = /(?:confirmation code|κωδικός επιβεβαίωσης)\s*[:：]?\s*(\d{6,12})/i.exec(body)?.[1] ?? /#(\d{6,12})\b/.exec(body)?.[1] ?? null;
  const link = /(https:\/\/mail(?:-settings)?\.google\.com\/mail\/[^\s<>"')]+)/i.exec(body)?.[1] ?? null;
  return code || link ? { code, link } : null;
}

/** Which reader to try first, from who sent the bill and what it is called. */
export function billHint(from: string | null | undefined, subject: string | null | undefined, fileName: string | null | undefined): "electricity" | "water" | null {
  const s = `${from ?? ""} ${subject ?? ""} ${fileName ?? ""}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  if (/EAC\.COM\.CY|\bEAC\b|ΑΗΚ|ELECTRICITY|ΗΛΕΚΤΡ/.test(s)) return "electricity";
  if (/WBN|WBL|WBLARNACA|WATER|ΥΔΑΤ|ΝΕΡΟ/.test(s)) return "water";
  return null;
}
