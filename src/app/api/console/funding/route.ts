/**
 * Funding calls for this company: only strong fits and calls one answer away,
 * worked out by Grant scout's fixed fit check. Every other public call stays
 * hidden; the full lists already exist on the official portals.
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { resolveConsoleSession } from "@/lib/console-session";
import { logger } from "@/lib/log";
import { shownCalls } from "@/lib/funding/funding.server";
import { cachedTranslations, localeOf } from "@/lib/translate.server";

export const dynamic = "force-dynamic";
const log = logger("api.console.funding");

export async function GET() {
  const h = await headers();
  const s = await resolveConsoleSession(h);
  if (!s.ok) return NextResponse.json({ error: s.error, message: s.message }, { status: s.status });
  try {
    const locale = localeOf(h);
    const { calls, checkedAt, reviewed } = await shownCalls(s.session.workspace.id);
    const tr = await cachedTranslations(calls.map((c) => c.title), locale);
    return NextResponse.json({
      checkedAt,
      reviewed,
      calls: calls.map((c) => ({ ...c, titleTranslated: tr.get(c.title) ?? null })),
    });
  } catch (error) {
    const ref = log.error("GET failed", error);
    return NextResponse.json({ message: `Funding matches could not be read. Reference ${ref}.`, ref }, { status: 500 });
  }
}
