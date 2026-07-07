import { NextResponse } from "next/server";
import { climateTraceClient } from "@/lib/climate-trace";

/**
 * GET /api/climate-trace/definitions/gases
 * Get all gas types from Climate TRACE v6
 */
export async function GET() {
  try {
    const result = await climateTraceClient.getGases();

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
    console.error("Climate TRACE gases API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch gases data" },
      { status: 500 }
    );
  }
}
