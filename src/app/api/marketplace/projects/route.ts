import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { offsetProjects } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const certification = searchParams.get("certification");
    const featured = searchParams.get("featured");

    const conditions = [];

    if (category) {
      conditions.push(sql`${offsetProjects.category} = ${category}`);
    }

    if (minPrice) {
      conditions.push(sql`${offsetProjects.pricePerTon} >= ${parseFloat(minPrice)}`);
    }

    if (maxPrice) {
      conditions.push(sql`${offsetProjects.pricePerTon} <= ${parseFloat(maxPrice)}`);
    }

    if (certification) {
      conditions.push(sql`${offsetProjects.certification} = ${certification}`);
    }

    if (featured === "true") {
      conditions.push(sql`${offsetProjects.isFeatured} = true`);
    }

    const baseQuery = db.select().from(offsetProjects);
    const projects = conditions.length > 0
      ? await baseQuery.where(sql.join(conditions, sql` AND `))
      : await baseQuery;

    return NextResponse.json({ 
      projects: projects.map(p => ({
        ...p,
        impactMetrics: JSON.parse(p.impactMetrics),
        sdgGoals: p.sdgGoals ? JSON.parse(p.sdgGoals) : []
      }))
    });
  } catch (error: any) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects", details: error.message },
      { status: 500 }
    );
  }
}
