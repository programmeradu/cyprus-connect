import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userImpactTracking, offsetPurchases, offsetProjects } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's impact tracking
    const impact = await db
      .select()
      .from(userImpactTracking)
      .where(eq(userImpactTracking.userId, session.user.id))
      .limit(1);

    if (impact.length === 0) {
      // Return empty impact data
      return NextResponse.json({
        impact: {
          totalTonsOffset: 0,
          totalSpent: 0,
          projectsSupported: 0,
          firstPurchaseAt: null,
          lastPurchaseAt: null,
        },
        breakdown: []
      });
    }

    // Get breakdown by category
    const breakdown = await db
      .select({
        category: offsetProjects.category,
        totalTons: sql<number>`SUM(${offsetPurchases.tonsPurchased})`,
        totalSpent: sql<number>`SUM(${offsetPurchases.pricePaid})`,
        purchaseCount: sql<number>`COUNT(${offsetPurchases.id})`,
      })
      .from(offsetPurchases)
      .leftJoin(offsetProjects, eq(offsetPurchases.projectId, offsetProjects.id))
      .where(eq(offsetPurchases.userId, session.user.id))
      .groupBy(offsetProjects.category);

    return NextResponse.json({
      impact: impact[0],
      breakdown
    });
  } catch (error: any) {
    console.error("Error fetching impact:", error);
    return NextResponse.json(
      { error: "Failed to fetch impact", details: error.message },
      { status: 500 }
    );
  }
}
