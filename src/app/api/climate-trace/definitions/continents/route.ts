import { NextResponse } from "next/server";
import { climateTraceClient } from "@/lib/climate-trace";

/**
 * GET /api/climate-trace/definitions/continents
 * Get all continent names from Climate TRACE v6
 */
export async function GET() {
  try {
    const result = await climateTraceClient.getContinents();

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
    console.error("Climate TRACE continents API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch continents data" },
      { status: 500 }
    );
  }
}
