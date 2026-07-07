import { NextRequest, NextResponse } from "next/server";
import { SME_EMISSION_FACTORS, convertGasM3ToKWh, convertLitersToUSD } from "@/lib/emissionFactors";

interface EmissionInput {
  electricity_kwh?: number;
  gas_m3?: number;
  water_liters?: number;
  waste_kg?: number;
  transport_km?: number;
  region?: string;
}

interface EmissionResult {
  category: string;
  input_value: number;
  input_unit: string;
  co2e_kg: number;
  co2e_tonnes: number;
  activity_id: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: EmissionInput = await request.json();
    const {
      electricity_kwh = 0,
      gas_m3 = 0,
      water_liters = 0,
      waste_kg = 0,
      transport_km = 0,
      region = "US",
    } = body;

    const results: EmissionResult[] = [];
    const errors: string[] = [];

    // Helper function to call estimate endpoint
    const estimateEmissions = async (
      activity_id: string,
      value: number,
      unit: string,
      category: string,
      displayValue?: number,
      displayUnit?: string
    ) => {
      if (value <= 0) return null;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/emissions/estimate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              activity_id,
              value,
              unit,
              region,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to estimate ${category}`);
        }

        const { data } = await response.json();
        return {
          category,
          input_value: displayValue || value,
          input_unit: displayUnit || unit,
          co2e_kg: data.co2e_kg,
          co2e_tonnes: data.co2e_tonnes,
          activity_id,
        };
      } catch (error) {
        errors.push(`${category}: ${error instanceof Error ? error.message : "Unknown error"}`);
        return null;
      }
    };

    // Calculate emissions for each category
    const calculations = await Promise.all([
      estimateEmissions(
        SME_EMISSION_FACTORS.ELECTRICITY_GRID.id,
        electricity_kwh,
        "kWh",
        "Electricity"
      ),
      estimateEmissions(
        SME_EMISSION_FACTORS.NATURAL_GAS.id,
        convertGasM3ToKWh(gas_m3),
        "kWh",
        "Natural Gas",
        gas_m3,
        "m³"
      ),
      estimateEmissions(
        SME_EMISSION_FACTORS.WATER_SUPPLY.id,
        convertLitersToUSD(water_liters),
        "usd",
        "Water",
        water_liters,
        "liters"
      ),
      estimateEmissions(
        SME_EMISSION_FACTORS.WASTE_LANDFILL.id,
        waste_kg,
        "kg",
        "Waste"
      ),
      estimateEmissions(
        SME_EMISSION_FACTORS.TRAVEL_CAR.id,
        transport_km,
        "km",
        "Transportation"
      ),
    ]);

    // Filter out null results
    const validResults = calculations.filter((r) => r !== null) as EmissionResult[];
    results.push(...validResults);

    // Calculate total emissions
    const totalCo2eKg = results.reduce((sum, r) => sum + r.co2e_kg, 0);
    const totalCo2eTonnes = totalCo2eKg / 1000;

    return NextResponse.json({
      success: true,
      data: {
        total_co2e_kg: totalCo2eKg,
        total_co2e_tonnes: totalCo2eTonnes,
        total_co2e_tonnes_rounded: Math.round(totalCo2eTonnes * 100) / 100,
        breakdown: results,
        timestamp: new Date().toISOString(),
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Batch emission calculation error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}