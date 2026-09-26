import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  callClimatiaqAPI,
  ClimatiaqEstimateRequest,
  ClimatiaqEstimateResponse,
} from "@/lib/climatiq";
import { readJson } from "@/lib/validate";
import { logger } from "@/lib/log";

const log = logger("emissions.estimate");

const UNITS = [
  "kWh", "kwh", "MJ", "GJ", "MMBTU", "m3", "kg", "tonne",
  "short ton", "km", "liter", "usd", "USD", "dollar",
] as const;

const bodySchema = z.object({
  activity_id: z.string().trim().min(1).max(200),
  value: z.number().finite(),
  unit: z.enum(UNITS),
  region: z.string().trim().min(1).max(20).optional().default("US"),
  year: z.number().int().min(1900).max(2100).optional(),
  data_version: z.string().trim().min(1).max(20).optional().default("^3"),
});

export async function POST(request: NextRequest) {
  const parsed = await readJson(request, bodySchema);
  if (!parsed.ok) return parsed.response;
  const { activity_id, value, unit, region, year, data_version } = parsed.data;

  try {
    const emissionFactor: any = {
      activity_id,
      region,
    };
    if (year) emissionFactor.year = year;
    if (data_version) emissionFactor.data_version = data_version;

    const parameters: any = {};
    const unitMap: Record<string, { type: string; unit: string }> = {
      kWh: { type: "energy", unit: "kWh" },
      kwh: { type: "energy", unit: "kWh" },
      MJ: { type: "energy", unit: "MJ" },
      GJ: { type: "energy", unit: "GJ" },
      MMBTU: { type: "energy", unit: "MMBTU" },
      m3: { type: "volume", unit: "m3" },
      kg: { type: "weight", unit: "kg" },
      tonne: { type: "weight", unit: "tonne" },
      "short ton": { type: "weight", unit: "short ton" },
      km: { type: "distance", unit: "km" },
      liter: { type: "volume", unit: "liter" },
      usd: { type: "money", unit: "usd" },
      USD: { type: "money", unit: "usd" },
      dollar: { type: "money", unit: "usd" },
    };

    const mapping = unitMap[unit];
    parameters[mapping.type] = value;
    parameters[`${mapping.type}_unit`] = mapping.unit;

    const estimateRequest: ClimatiaqEstimateRequest = {
      emission_factor: emissionFactor,
      parameters,
    };

    const result = await callClimatiaqAPI<ClimatiaqEstimateResponse>(
      "/estimate",
      "POST",
      estimateRequest
    );

    return NextResponse.json({
      success: true,
      data: {
        activity_id,
        input_value: value,
        input_unit: unit,
        co2e_kg: result.co2e,
        co2e_tonnes: result.co2e / 1000,
        co2e_kg_rounded: Math.round(result.co2e * 1000) / 1000,
        calculation_method: result.co2e_calculation_method,
        calculation_origin: result.co2e_calculation_origin,
        emission_factor: result.emission_factor,
        constituent_gases: result.constituent_gases,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const ref = log.error("Climatiq API error", error);
    return NextResponse.json(
      { error: "The emission estimate could not be calculated.", ref, fallback: true },
      { status: 500 }
    );
  }
}
