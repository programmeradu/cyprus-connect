import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/db";
import { hospitalityProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { resolveConsoleSession } from "@/lib/console-session";
import { readJson } from "@/lib/validate";
import { recordActivity } from "@/lib/activity.server";
import { logger } from "@/lib/log";
import { loadHospitalityPack } from "@/lib/reports/hospitality.server";

// The hotel enters every figure itself. Nothing is defaulted on its behalf.
const HotelFactsSchema = z.object({
  propertyName: z.string().trim().min(1).max(200),
  totalRooms: z.number().int().positive().max(10_000),
  annualOccupiedRooms: z.number().int().positive().max(5_000_000),
  annualGuestNights: z.number().int().positive().max(20_000_000),
  hasPool: z.boolean(),
  hasRestaurant: z.boolean(),
  hasSpa: z.boolean(),
  hasLaundryOnSite: z.boolean(),
  ecoLabel: z.string().trim().max(50).nullable(),
});

export async function GET(request: Request) {
  const h = request ? new Headers(request.headers) : await headers();
  const s = await resolveConsoleSession(h);
  if (!s.ok) return NextResponse.json({ error: s.error, message: s.message }, { status: s.status });

  try {
    const data = await loadHospitalityPack(s.session.workspace.id, s.session.account.id);
    return NextResponse.json(data);
  } catch (error) {
    const ref = logger("hospitality-get").error("Failed to load hospitality pack", { error });
    return NextResponse.json({ error: "Could not load hospitality metrics", ref }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const h = request ? new Headers(request.headers) : await headers();
  const s = await resolveConsoleSession(h);
  if (!s.ok) return NextResponse.json({ error: s.error, message: s.message }, { status: s.status });

  const parsed = await readJson(request, HotelFactsSchema);
  if (!parsed.ok) return parsed.response;
  const input = parsed.data;
  if (input.annualOccupiedRooms > input.totalRooms * 366) {
    return NextResponse.json({ message: "Occupied room-nights can't be more than rooms × 366." }, { status: 400 });
  }

  try {
    const values = { ...input, ecoLabel: input.ecoLabel || null, tourOperatorPartners: null, updatedAt: new Date() };
    const [existing] = await db
      .select({ id: hospitalityProfiles.id })
      .from(hospitalityProfiles)
      .where(eq(hospitalityProfiles.workspaceId, s.session.workspace.id))
      .limit(1);
    if (existing) {
      await db.update(hospitalityProfiles).set(values).where(eq(hospitalityProfiles.id, existing.id));
    } else {
      await db.insert(hospitalityProfiles).values({ workspaceId: s.session.workspace.id, ...values });
    }

    await recordActivity(
      s.session,
      "updated hospitality profile",
      "Hospitality ESG profile",
      "Updated rooms, nights and facilities.",
    );

    const updatedData = await loadHospitalityPack(s.session.workspace.id, s.session.account.id);
    return NextResponse.json(updatedData);
  } catch (error) {
    const ref = logger("hospitality-patch").error("Failed to update hospitality profile", { error });
    return NextResponse.json({ error: "Failed to update hospitality profile", ref }, { status: 500 });
  }
}
