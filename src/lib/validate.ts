/**
 * One way for an API route to read its input.
 *
 * Every route that accepts a body reads it through `readJson` (JSON) or
 * `readUpload` (files). Both cap the size before parsing, turn malformed input
 * into a 400 with a plain message, and never let an unchecked value reach the
 * database. Routes stay small: parse, then act on typed data.
 */

import { NextResponse } from "next/server";
import type { ZodType } from "zod";

export const MAX_JSON_BYTES = 256 * 1024;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export type Parsed<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

function bad(status: number, error: string, code: string, issues?: unknown): NextResponse {
  return NextResponse.json({ error, code, ...(issues ? { issues } : {}) }, { status });
}

/** Short, user-readable list of what was wrong. No stack, no values echoed. */
export function describeIssues(issues: { path: PropertyKey[]; message: string }[]) {
  return issues.slice(0, 10).map((i) => ({
    field: i.path.map(String).join(".") || "(body)",
    message: i.message,
  }));
}

/** Pure core, exported for tests: raw text -> typed value or a refusal. */
export function parseJsonText<T>(text: string, schema: ZodType<T>, maxBytes = MAX_JSON_BYTES): Parsed<T> {
  if (new TextEncoder().encode(text).length > maxBytes) {
    return { ok: false, response: bad(413, "The request is too large.", "BODY_TOO_LARGE") };
  }
  let raw: unknown;
  try {
    raw = text.trim().length === 0 ? {} : JSON.parse(text);
  } catch {
    return { ok: false, response: bad(400, "The request is not valid JSON.", "INVALID_JSON") };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      response: bad(400, "Some fields are missing or not valid.", "INVALID_INPUT", describeIssues(parsed.error.issues)),
    };
  }
  return { ok: true, data: parsed.data };
}

export async function readJson<T>(
  request: Request,
  schema: ZodType<T>,
  maxBytes = MAX_JSON_BYTES,
): Promise<Parsed<T>> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > maxBytes) {
    return { ok: false, response: bad(413, "The request is too large.", "BODY_TOO_LARGE") };
  }
  let text: string;
  try {
    text = await request.text();
  } catch {
    return { ok: false, response: bad(400, "The request body could not be read.", "UNREADABLE_BODY") };
  }
  return parseJsonText(text, schema, maxBytes);
}

/** Validates route/query values the same way as bodies. */
export function parseValue<T>(value: unknown, schema: ZodType<T>): Parsed<T> {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      response: bad(400, "Some fields are missing or not valid.", "INVALID_INPUT", describeIssues(parsed.error.issues)),
    };
  }
  return { ok: true, data: parsed.data };
}

/* ------------------------------------------------------------------ uploads */

export type UploadKind = "pdf" | "png" | "jpeg" | "webp" | "csv" | "xlsx";

/**
 * Identifies a file from its first bytes, not from the name or the browser's
 * type, which the sender controls. CSV has no signature, so it must be valid
 * UTF-8 text without NUL bytes.
 */
export function sniffKind(bytes: Uint8Array): UploadKind | null {
  const b = bytes;
  if (b.length >= 5 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d) return "pdf";
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) return "webp";
  if (b.length >= 4 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04) return "xlsx";
  const head = b.subarray(0, Math.min(b.length, 4096));
  if (head.length === 0 || head.includes(0)) return null;
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(head.length < b.length ? trimToCharBoundary(head) : head);
    return "csv";
  } catch {
    return null;
  }
}

function trimToCharBoundary(b: Uint8Array): Uint8Array {
  let end = b.length;
  // Step back over a partial multi-byte sequence at the cut.
  while (end > 0 && (b[end - 1] & 0xc0) === 0x80) end--;
  if (end > 0 && b[end - 1] >= 0xc0) end--;
  return b.subarray(0, end);
}

/** Pure check, exported for tests. */
export function checkUpload(
  bytes: Uint8Array,
  allowed: readonly UploadKind[],
  maxBytes = MAX_UPLOAD_BYTES,
): { ok: true; kind: UploadKind } | { ok: false; status: number; error: string; code: string } {
  if (bytes.length === 0) return { ok: false, status: 400, error: "The file is empty.", code: "EMPTY_FILE" };
  if (bytes.length > maxBytes) {
    return { ok: false, status: 413, error: `The file is larger than ${Math.round(maxBytes / 1048576)} MB.`, code: "FILE_TOO_LARGE" };
  }
  const kind = sniffKind(bytes);
  if (!kind || !allowed.includes(kind)) {
    return { ok: false, status: 415, error: `This file type is not accepted. Use ${allowed.join(", ").toUpperCase()}.`, code: "INVALID_FILE_TYPE" };
  }
  return { ok: true, kind };
}

/** Reads one file field from multipart form data and checks it. */
export async function readUpload(
  request: Request,
  field: string,
  allowed: readonly UploadKind[],
  maxBytes = MAX_UPLOAD_BYTES,
): Promise<
  | { ok: true; file: File; bytes: Uint8Array; kind: UploadKind; form: FormData }
  | { ok: false; response: NextResponse }
> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > maxBytes + 64 * 1024) {
    return { ok: false, response: bad(413, `The file is larger than ${Math.round(maxBytes / 1048576)} MB.`, "FILE_TOO_LARGE") };
  }
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return { ok: false, response: bad(400, "Send the file as form data.", "INVALID_FORM") };
  }
  const file = form.get(field);
  if (!(file instanceof File)) {
    return { ok: false, response: bad(400, "No file was attached.", "NO_FILE") };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const verdict = checkUpload(bytes, allowed, maxBytes);
  if (!verdict.ok) return { ok: false, response: bad(verdict.status, verdict.error, verdict.code) };
  return { ok: true, file, bytes, kind: verdict.kind, form };
}
