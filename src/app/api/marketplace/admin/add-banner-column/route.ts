import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    // Add bannerImage column if it doesn't exist
    await db.execute(sql`ALTER TABLE offset_projects ADD COLUMN banner_image TEXT`);
    
    return NextResponse.json({
      success: true,
      message: "Banner image column added successfully"
    });
  } catch (error: any) {
    // If column already exists, that's fine
    if (error.message?.includes("duplicate column") || error.message?.includes("already exists")) {
      return NextResponse.json({
        success: true,
        message: "Column already exists"
      });
    }
    
    console.error("Error adding column:", error);
    return NextResponse.json(
      { error: "Failed to add column", details: error.message },
      { status: 500 }
    );
  }
}