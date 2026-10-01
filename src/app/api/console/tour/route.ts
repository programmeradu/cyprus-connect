/**
 * Whether the signed-in account has finished the Home guided tour.
 * GET reads it; POST records "done" (finished or skipped) or "reset" (replay).
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { resolveConsoleSession } from "@/lib/console-session";
import { readJson } from "@/lib/validate";
import { logger } from "@/lib/log";
import { db } from "@/db";
import { user } from "@/db/schema";

export const dynamic = "force-dynamic";
const log = logger("api.console.tour");

const Body = z.object({ action: z.enum(["done", "reset"]) });

export async function GET() {
  const s = await resolveConsoleSession(await headers());
  if (!s.ok) return NextResponse.json({ error: s.error, message: s.message }, { status: s.status });
  try {
    const [row] = await db.select({ at: user.homeTourDoneAt }).from(user).where(eq(user.id, s.session.account.id)).limit(1);
    return NextResponse.json({ done: !!row?.at, doneAt: row?.at?.toISOString() ?? null });
  } catch (error) {
    const ref = log.error("GET failed", error);
    return NextResponse.json({ message: "Tour status could not be read.", ref }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const s = await resolveConsoleSession(await headers());
  if (!s.ok) return NextResponse.json({ error: s.error, message: s.message }, { status: s.status });
  const parsed = await readJson(req, Body);
  if (!parsed.ok) return parsed.response;
  try {
    const at = parsed.data.action === "done" ? new Date() : null;
    await db.update(user).set({ homeTourDoneAt: at }).where(eq(user.id, s.session.account.id));
    return NextResponse.json({ done: !!at, doneAt: at?.toISOString() ?? null });
  } catch (error) {
    const ref = log.error("POST failed", error);
    return NextResponse.json({ message: "Tour status could not be saved.", ref }, { status: 500 });
  }
}
