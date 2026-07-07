import { NextResponse } from "next/server";
import { climateTraceClient } from "@/lib/climate-trace";

/**
 * GET /api/climate-trace/definitions/groups
 * Get country group definitions (EU, G77, etc.) from Climate TRACE v6
 */
export async function GET() {
  try {
    const result = await climateTraceClient.getGroups();

    if (result.error) {
      return NextResponse.json(
        { error: result.error, data: {} },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Climate TRACE groups API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch groups data" },
      { status: 500 }
    );
  }
}
