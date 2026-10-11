/**
 * Hotel footprint per room-night and per guest-night.
 *
 * Follows the per-room-night and per-guest-night approach of the Hotel Carbon
 * and Water Measurement Initiatives (HCMI, HWMI). Energy and water come from
 * bills; rooms and nights come only from what the hotel saves itself. We never
 * create hotel facts for them, and we show no benchmark or score we cannot source.
 */

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { workspaces, hospitalityProfiles, metricReadings } from "@/db/schema";
import { readCompanyProfile, withCompanyFacts } from "@/lib/company.server";
import { eacBills } from "@/lib/integrations/eac.server";
import { waterBills } from "@/lib/integrations/water.server";
import { OFFICIAL_CYPRUS_GRID_FACTOR } from "@/lib/factors/registry";
import { fingerprint } from "@/lib/pdf/kit/fingerprint";
import { monthsCovered } from "./bank.server";
import type { HospitalityPackData, HotelFacts } from "./types";
export type { HospitalityPackData };

/** Divide only when both sides are real; otherwise the figure stays blank. */
export function perUnit(total: number, hasBills: boolean, divisor: number | null | undefined, digits = 2): number | null {
  if (!hasBills || !divisor || divisor <= 0) return null;
  return Number((total / divisor).toFixed(digits));
}

export async function loadHospitalityPack(workspaceId: string, accountId?: string | null): Promise<HospitalityPackData> {
  const [wsRow] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);
  if (!wsRow) throw new Error("Workspace not found");

  const userId = accountId || wsRow.ownerUserId || undefined;
  const profile = userId ? await readCompanyProfile(userId) : null;
  const company = withCompanyFacts(wsRow, profile);

  const [[hotel], eacRows, waterRows, readings] = await Promise.all([
    db.select().from(hospitalityProfiles).where(eq(hospitalityProfiles.workspaceId, workspaceId)).limit(1),
    userId ? eacBills(userId).catch(() => []) : [],
    userId ? waterBills(userId).catch(() => []) : [],
    db.select().from(metricReadings).where(eq(metricReadings.workspaceId, workspaceId)).catch(() => []),
  ]);

  const kwh = eacRows.reduce((s, b) => s + (b.kwh || 0), 0);
  const fuel = readings.find((r) => r.metricKey === "scope1_fuel" || r.metricKey === "fuel_diesel");
  const carbonKg = kwh * OFFICIAL_CYPRUS_GRID_FACTOR + (fuel ? fuel.value * 1000 : 0);
  const waterM3 = waterRows.reduce((s, b) => s + (b.m3 || 0), 0);

  const facts: HotelFacts | null = hotel
    ? {
        propertyName: hotel.propertyName,
        totalRooms: hotel.totalRooms,
        annualOccupiedRooms: hotel.annualOccupiedRooms,
        annualGuestNights: hotel.annualGuestNights,
        hasPool: hotel.hasPool,
        hasRestaurant: hotel.hasRestaurant,
        hasSpa: hotel.hasSpa,
        hasLaundryOnSite: hotel.hasLaundryOnSite,
        ecoLabel: hotel.ecoLabel && hotel.ecoLabel !== "None" ? hotel.ecoLabel : null,
      }
    : null;

  const hasPower = eacRows.length > 0;
  const metrics = {
    totalElectricityKwh: kwh,
    totalCarbonKg: carbonKg,
    totalWaterM3: Number(waterM3.toFixed(1)),
    energyPerOccupiedRoomKwh: perUnit(kwh, hasPower, facts?.annualOccupiedRooms),
    carbonPerOccupiedRoomKg: perUnit(carbonKg, hasPower, facts?.annualOccupiedRooms),
    carbonPerGuestNightKg: perUnit(carbonKg, hasPower, facts?.annualGuestNights),
    waterPerGuestNightLiters: perUnit(waterM3 * 1000, waterRows.length > 0, facts?.annualGuestNights, 1),
  };

  const hash = await fingerprint({ facts, metrics });

  return {
    profile: facts,
    company: { name: company.name, legalName: company.legalName },
    metrics,
    bills: {
      electricity: eacRows.length,
      water: waterRows.length,
      electricityMonths: monthsCovered(eacRows as never),
      waterMonths: monthsCovered(waterRows as never),
    },
    hash,
    generatedAt: new Date().toISOString(),
  };
}
