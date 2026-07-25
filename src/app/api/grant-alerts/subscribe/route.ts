import { NextRequest, NextResponse } from "next/server";
import {
  deactivateSubscription,
  ensureSchema,
  recentMatches,
  upsertSubscription,
} from "@/lib/grant-alerts/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? "").trim().toLowerCase();
    const sources: string[] | undefined = Array.isArray(body?.sources) ? body.sources : undefined;
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    await ensureSchema();
    await upsertSubscription(email, sources);
    return NextResponse.json({ ok: true, subscribed: email });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const email = (req.nextUrl.searchParams.get("email") || "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    await ensureSchema();
    await deactivateSubscription(email);
    return NextResponse.json({ ok: true, unsubscribed: email });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

export async function GET() {
  try {
    await ensureSchema();
    const matches = await recentMatches(30);
    return NextResponse.json({ ok: true, matches });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
