import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { offsetPurchases, offsetProjects } from "@/db/schema";
import { eq } from "drizzle-orm";
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

    // Get user's purchases with project details
    const purchases = await db
      .select({
        id: offsetPurchases.id,
        tonsPurchased: offsetPurchases.tonsPurchased,
        pricePaid: offsetPurchases.pricePaid,
        certificateUrl: offsetPurchases.certificateUrl,
        certificateNumber: offsetPurchases.certificateNumber,
        status: offsetPurchases.status,
        purchasedAt: offsetPurchases.purchasedAt,
        projectName: offsetProjects.name,
        projectCategory: offsetProjects.category,
        projectLocation: offsetProjects.location,
        projectCertification: offsetProjects.certification,
      })
      .from(offsetPurchases)
      .leftJoin(offsetProjects, eq(offsetPurchases.projectId, offsetProjects.id))
      .where(eq(offsetPurchases.userId, session.user.id));

    return NextResponse.json({ purchases });
  } catch (error: any) {
    console.error("Error fetching purchases:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchases", details: error.message },
      { status: 500 }
    );
  }
}
