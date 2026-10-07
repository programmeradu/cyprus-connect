import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { resolveConsoleSession } from "@/lib/console-session";
import { readJson } from "@/lib/validate";
import { logger } from "@/lib/log";
import { loadVsmePassport } from "@/lib/reports/passport.server";
import { db } from "@/db";
import { vsmePassports } from "@/db/schema";
import { eq } from "drizzle-orm";
import { recordActivity } from "@/lib/activity.server";

export const dynamic = "force-dynamic";
const log = logger("api.console.passport");

const PatchBody = z.object({
  isPublic: z.boolean().optional(),
  headline: z.string().max(200).nullable().optional(),
  customNotes: z.string().max(1000).nullable().optional(),
});

export async function GET() {
  const s = await resolveConsoleSession(await headers());
  if (!s.ok) return NextResponse.json({ error: s.error, message: s.message }, { status: s.status });

  try {
    const data = await loadVsmePassport(s.session.workspace.id, false);
    if (!data) {
      return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    const ref = log.error("load passport failed", error);
    return NextResponse.json({ message: "Could not load VSME Passport.", ref }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const s = await resolveConsoleSession(await headers());
  if (!s.ok) return NextResponse.json({ error: s.error, message: s.message }, { status: s.status });

  const parsed = await readJson(req, PatchBody);
  if (!parsed.ok) return parsed.response;

  try {
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (parsed.data.isPublic !== undefined) updates.isPublic = parsed.data.isPublic;
    if (parsed.data.headline !== undefined) updates.headline = parsed.data.headline;
    if (parsed.data.customNotes !== undefined) updates.customNotes = parsed.data.customNotes;

    await db
      .update(vsmePassports)
      .set(updates)
      .where(eq(vsmePassports.workspaceId, s.session.workspace.id));

    await recordActivity(
      s.session,
      "updated VSME passport",
      "Passport Settings",
      parsed.data.isPublic !== undefined ? `Public visibility set to ${parsed.data.isPublic}` : "Updated passport details",
    );

    const refreshed = await loadVsmePassport(s.session.workspace.id, false);
    return NextResponse.json(refreshed);
  } catch (error) {
    const ref = log.error("update passport failed", error);
    return NextResponse.json({ message: "Could not update VSME Passport.", ref }, { status: 500 });
  }
}
