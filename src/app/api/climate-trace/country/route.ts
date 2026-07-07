import { NextRequest, NextResponse } from "next/server";
import { climateTraceClient } from "@/lib/climate-trace";

/**
 * GET /api/climate-trace/country
 * Get country-level emissions aggregated by sector/subsector (v6)
 * 
 * Query params:
 * - countries: Comma-separated 3-letter ISO codes (e.g., NGA,ZAF,EGY)
 * - continents: Optional comma-separated continents (e.g., Africa)
 * - groups: Optional comma-separated groups (e.g., G77)
 * - sector: Optional comma-separated sectors
 * - subsectors: Optional comma-separated subsectors
 * - since: Start year (default: 2015)
 * - to: End year (default: 2022)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const countries = searchParams.get("countries")?.split(",").filter(Boolean);
    const continents = searchParams.get("continents")?.split(",").filter(Boolean);
    const groups = searchParams.get("groups")?.split(",").filter(Boolean);
    const sector = searchParams.get("sector")?.split(",").filter(Boolean);
    const subsectors = searchParams.get("subsectors")?.split(",").filter(Boolean);
    const since = searchParams.get("since");
    const to = searchParams.get("to");

    const result = await climateTraceClient.getCountryEmissions({
      countries,
      continents,
      groups,
      sector,
      subsectors,
      since: since ? parseInt(since) : undefined,
      to: to ? parseInt(to) : undefined,
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
    console.error("Climate TRACE country API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch country emissions data" },
      { status: 500 }
    );
  }
}