import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/db";
import { hospitalityProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { resolveConsoleSession } from "@/lib/console-session";
import { readJson } from "@/lib/validate";
import { logger } from "@/lib/log";
import { loadHospitalityPack } from "@/lib/reports/hospitality.server";

const UpdateProfileSchema = z.object({
  propertyName: z.string().min(1).max(200).optional(),
  hotelCategory: z.string().max(50).optional(),
  totalRooms: z.number().int().positive().optional(),
  annualOccupiedRooms: z.number().int().positive().optional(),
  annualGuestNights: z.number().int().positive().optional(),
  hasPool: z.boolean().optional(),
  hasRestaurant: z.boolean().optional(),
  hasSpa: z.boolean().optional(),
  hasLaundryOnSite: z.boolean().optional(),
  ecoLabel: z.string().max(50).optional(),
  tourOperatorPartners: z.string().max(200).optional(),
});

export async function GET() {
  const s = await resolveConsoleSession(await headers());
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
  const s = await resolveConsoleSession(await headers());
  if (!s.ok) return NextResponse.json({ error: s.error, message: s.message }, { status: s.status });

  const parsed = await readJson(request, UpdateProfileSchema);
  if (!parsed.ok) return parsed.response;
  const input = parsed.data;

  try {
    const [existing] = await db
      .select()
      .from(hospitalityProfiles)
      .where(eq(hospitalityProfiles.workspaceId, s.session.workspace.id))
      .limit(1);

    if (existing) {
      await db
        .update(hospitalityProfiles)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(hospitalityProfiles.id, existing.id));
    } else {
      await db.insert(hospitalityProfiles).values({
        workspaceId: s.session.workspace.id,
        propertyName: input.propertyName || s.session.workspace.name,
        hotelCategory: input.hotelCategory || "4-star",
        totalRooms: input.totalRooms || 50,
        annualOccupiedRooms: input.annualOccupiedRooms || 12000,
        annualGuestNights: input.annualGuestNights || 24000,
        hasPool: input.hasPool !== undefined ? input.hasPool : true,
        hasRestaurant: input.hasRestaurant !== undefined ? input.hasRestaurant : true,
        hasSpa: input.hasSpa !== undefined ? input.hasSpa : false,
        hasLaundryOnSite: input.hasLaundryOnSite !== undefined ? input.hasLaundryOnSite : true,
        ecoLabel: input.ecoLabel || "None",
        tourOperatorPartners: input.tourOperatorPartners || "TUI, Jet2",
      });
    }

    const { activityEvents } = await import("@/db/schema");
    await db.insert(activityEvents).values({
      workspaceId: s.session.workspace.id,
      actorType: "human",
      actorName: s.session.account.name || "You",
      verb: "updated",
      object: "Hospitality ESG profile",
      detail: "Updated hotel operating capacity and tour operator credentials.",
    });

    const updatedData = await loadHospitalityPack(s.session.workspace.id, s.session.account.id);
    return NextResponse.json(updatedData);
  } catch (error) {
    const ref = logger("hospitality-patch").error("Failed to update hospitality profile", { error });
    return NextResponse.json({ error: "Failed to update hospitality profile", ref }, { status: 500 });
  }
}
