import { NextRequest, NextResponse } from "next/server";
import { climateTraceClient } from "@/lib/climate-trace";

/**
 * GET /api/climate-trace/emissions
 * Filter and summarize source emissions (v6)
 * Groups emissions by country or continent
 * 
 * Query params:
 * - countries: Comma-separated 3-letter ISO codes
 * - sectors: Optional comma-separated sectors
 * - subsectors: Optional comma-separated subsectors
 * - continents: Optional comma-separated continents
 * - groups: Optional comma-separated groups
 * - adminId: Optional administrative area ID
 * - years: Comma-separated years (e.g., 2020,2021,2022)
 * - gas: Optional gas type (co2, ch4, n2o, co2e, co2e_20yr, co2e_100yr)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const countries = searchParams.get("countries")?.split(",").filter(Boolean);
    const sectors = searchParams.get("sectors")?.split(",").filter(Boolean);
    const subsectors = searchParams.get("subsectors")?.split(",").filter(Boolean);
    const continents = searchParams.get("continents")?.split(",").filter(Boolean);
    const groups = searchParams.get("groups")?.split(",").filter(Boolean);
    const adminId = searchParams.get("adminId");
    const years = searchParams.get("years")?.split(",").map(y => parseInt(y)).filter(Boolean);
    const gas = searchParams.get("gas");

    const result = await climateTraceClient.getAssetEmissions({
      countries,
      sectors,
      subsectors,
      continents,
      groups,
      adminId: adminId ? parseInt(adminId) : undefined,
      years,
      gas: gas || undefined,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error, data: [] },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      count: result.data.length,
    });
  } catch (error) {
    console.error("Climate TRACE emissions API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch emissions summary" },
      { status: 500 }
    );
  }
}
