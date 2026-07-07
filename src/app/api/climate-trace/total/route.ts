import { NextRequest, NextResponse } from "next/server";
import { climateTraceClient } from "@/lib/climate-trace";

/**
 * GET /api/climate-trace/total
 * Get total emissions for a country with sector breakdown
 * 
 * Query params:
 * - countryIso: 3-letter ISO code (required)
 * - since: Start year (default: 2015)
 * - to: End year (default: 2022)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const countryIso = searchParams.get("countryIso");

    if (!countryIso) {
      return NextResponse.json(
        { error: "Missing required parameter: countryIso" },
        { status: 400 }
      );
    }

    const since = searchParams.get("since");
    const to = searchParams.get("to");
    const sinceInt = since ? parseInt(since) : 2015;
    const toInt = to ? parseInt(to) : 2022;

    const result = await climateTraceClient.getCountryTotal(
      countryIso,
      sinceInt,
      toInt
    );

    if (result.error) {
      return NextResponse.json(
        { error: result.error, total: 0, breakdown: {} },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      countryIso,
      since: sinceInt,
      to: toInt,
      total: result.total,
      totalTonnes: result.total,
      totalMegaTonnes: result.total / 1_000_000,
      breakdown: result.breakdown,
      sectors: Object.keys(result.breakdown).map((sector) => ({
        name: sector,
        emissions: result.breakdown[sector],
        percentage: ((result.breakdown[sector] / result.total) * 100).toFixed(2),
      })),
    });
  } catch (error) {
    console.error("Climate TRACE total API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch country total emissions" },
      { status: 500 }
    );
  }
}