import { NextRequest, NextResponse } from "next/server";
import { climateTraceClient } from "@/lib/climate-trace";

/**
 * GET /api/climate-trace/admin/search
 * Search for administrative areas (provinces, counties, etc.)
 * 
 * Query params:
 * - name: Name fragment to search (optional)
 * - level: GADM level (0=country, 1=province, 2=county) (optional)
 * - point: WGS84 Point as "longitude,latitude" (optional)
 * - bbox: Bounding box as "minLon,minLat,maxLon,maxLat" (optional)
 * - limit: Number of results (default: 100)
 * - offset: Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const name = searchParams.get("name");
    const level = searchParams.get("level");
    const point = searchParams.get("point")?.split(",").map(n => parseFloat(n));
    const bbox = searchParams.get("bbox")?.split(",").map(n => parseFloat(n));
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    const result = await climateTraceClient.searchAdminAreas({
      name: name || undefined,
      level: level ? parseInt(level) : undefined,
      point: point?.length === 2 ? point : undefined,
      bbox: bbox?.length === 4 ? bbox : undefined,
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
    console.error("Climate TRACE admin search API error:", error);
    return NextResponse.json(
      { error: "Failed to search administrative areas" },
      { status: 500 }
    );
  }
}
