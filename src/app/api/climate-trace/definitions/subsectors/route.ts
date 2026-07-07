import { NextResponse } from "next/server";
import { climateTraceClient } from "@/lib/climate-trace";

/**
 * GET /api/climate-trace/definitions/subsectors
 * Get all subsector names from Climate TRACE v6
 */
export async function GET() {
  try {
    const result = await climateTraceClient.getSubsectors();

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
    console.error("Climate TRACE subsectors API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subsectors data" },
      { status: 500 }
    );
  }
}
