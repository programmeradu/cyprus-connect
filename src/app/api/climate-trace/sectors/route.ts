import { NextResponse } from "next/server";
import { climateTraceClient } from "@/lib/climate-trace";

/**
 * GET /api/climate-trace/sectors
 * Get available sectors and subsectors from Climate TRACE
 */
export async function GET() {
  try {
    const result = await climateTraceClient.getSectors();

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
    console.error("Climate TRACE sectors API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sectors data" },
      { status: 500 }
    );
  }
}
