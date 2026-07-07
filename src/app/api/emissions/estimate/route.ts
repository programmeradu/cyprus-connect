import { NextRequest, NextResponse } from "next/server";
import {
  callClimatiaqAPI,
  ClimatiaqEstimateRequest,
  ClimatiaqEstimateResponse,
} from "@/lib/climatiq";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      activity_id,
      value,
      unit,
      region = "US",
      year,
      data_version = "^3",
    } = body;

    // Validate inputs
    if (!activity_id || value === undefined || !unit) {
      return NextResponse.json(
        {
          error: "Missing required fields: activity_id, value, unit",
        },
        { status: 400 }
      );
    }

    // Build emission factor selector
    const emissionFactor: any = {
      activity_id,
      region,
    };
    if (year) emissionFactor.year = year;
    if (data_version) emissionFactor.data_version = data_version;

    // Build parameters based on unit type
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
    if (!mapping) {
      return NextResponse.json(
        { error: `Unsupported unit: ${unit}` },
        { status: 400 }
      );
    }

    parameters[mapping.type] = value;
    parameters[`${mapping.type}_unit`] = mapping.unit;

    const estimateRequest: ClimatiaqEstimateRequest = {
      emission_factor: emissionFactor,
      parameters,
    };

    // Call Climatiq API
    const result = await callClimatiaqAPI<ClimatiaqEstimateResponse>(
      "/estimate",
      "POST",
      estimateRequest
    );

    // Return enhanced response
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
    console.error("Climatiq API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        fallback: true,
      },
      { status: 500 }
    );
  }
}