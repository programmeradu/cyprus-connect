import { NextRequest, NextResponse } from "next/server";
import { climateTraceClient } from "@/lib/climate-trace";

/**
 * GET /api/climate-trace/assets
 * Search emissions sources (v6)
 * Returns asset-level emissions with geographic data
 * 
 * Query params:
 * - countries: Comma-separated 3-letter ISO codes (e.g., NGA,ZAF,EGY)
 * - sectors: Optional comma-separated sectors
 * - subsectors: Optional comma-separated subsectors
 * - continents: Optional comma-separated continents (e.g., Africa)
 * - groups: Optional comma-separated groups
 * - adminId: Optional administrative area ID
 * - year: Year for data (default: 2022)
 * - limit: Number of results (default: 100)
 * - offset: Pagination offset (default: 0)
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
    const year = searchParams.get("year");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    const result = await climateTraceClient.searchAssets({
      countries,
      sectors,
      subsectors,
      continents,
      groups,
      adminId: adminId ? parseInt(adminId) : undefined,
      year: year ? parseInt(year) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
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
    console.error("Climate TRACE assets API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch asset-level emissions data" },
      { status: 500 }
    );
  }
}