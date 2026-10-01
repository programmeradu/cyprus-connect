/**
 * Cyprus water board bill: upload (POST, multipart field "file") and remove
 * (DELETE ?id=). The bill is read, checked and stored as evidence; a bill
 * whose m³ or period cannot be read is refused.
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { resolveConsoleSession } from "@/lib/console-session";
import { recordActivity } from "@/lib/activity.server";
import { readUpload, parseValue, type UploadKind } from "@/lib/validate";
import { hasDocumentAi } from "@/lib/lovable-ai";
import { readWaterBill, saveWaterBill, deleteWaterBill } from "@/lib/integrations/water.server";
import { logger } from "@/lib/log";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
const log = logger("api.console.integrations.water.bill");

const KINDS: readonly UploadKind[] = ["pdf", "png", "jpeg", "webp"];
const MIME: Record<string, string> = { pdf: "application/pdf", png: "image/png", jpeg: "image/jpeg", webp: "image/webp" };

export async function POST(request: NextRequest) {
  const resolved = await resolveConsoleSession(await headers());
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error, message: resolved.message }, { status: resolved.status });
  }
  if (!hasDocumentAi()) {
    return NextResponse.json({ error: "not_configured", message: "The bill reader is not set up yet." }, { status: 503 });
  }
  const up = await readUpload(request, "file", KINDS);
  if (!up.ok) return up.response;
  const mime = MIME[up.kind];
  try {
    const read = await readWaterBill(up.bytes, mime);
    if (!read.ok) return NextResponse.json({ error: "unreadable", message: read.reason }, { status: 422 });
    const saved = await saveWaterBill(resolved.session.account.id, up.file.name || "water-bill", mime, up.bytes, read.bill);
    if (!saved.duplicate) await recordActivity(resolved.session, "uploaded water bill", up.file.name || "water bill");
    return NextResponse.json({ bill: read.bill, duplicate: saved.duplicate, id: saved.id });
  } catch (error) {
    const ref = log.error("Water bill read failed", error);
    return NextResponse.json({ message: "The bill could not be read just now. Try again.", ref }, { status: 502 });
  }
}

export async function DELETE(request: NextRequest) {
  const resolved = await resolveConsoleSession(await headers());
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error, message: resolved.message }, { status: resolved.status });
  }
  const parsed = parseValue(request.nextUrl.searchParams.get("id"), z.coerce.number().int().positive());
  if (!parsed.ok) return parsed.response;
  try {
    const ok = await deleteWaterBill(resolved.session.account.id, parsed.data);
    if (!ok) return NextResponse.json({ message: "That bill was not found." }, { status: 404 });
    await recordActivity(resolved.session, "removed water bill", `#${parsed.data}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const ref = log.error("Water bill delete failed", error);
    return NextResponse.json({ message: "The bill could not be removed.", ref }, { status: 500 });
  }
}
