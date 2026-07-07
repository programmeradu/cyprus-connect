// Compliance Tracking API Route
import { NextRequest, NextResponse } from "next/server";
import { complianceTracker } from "@/lib/compliance-tracker";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const region = searchParams.get("region") as "EU" | "US" | "UK" | "Global" | null;
    const isSME = searchParams.get("isSME") === "true";
    const framework = searchParams.get("framework") || undefined;
    const daysAhead = Number(searchParams.get("daysAhead")) || 365;

    const response: any = {
      timestamp: new Date().toISOString(),
      filters: { region, isSME, framework },
      applicable: null,
      upcoming: null,
      score: null,
      highPriority: null,
    };

    // Get applicable requirements
    response.applicable = complianceTracker.getApplicableRequirements({
      region: region || undefined,
      isSME,
      framework,
    });

    // Add days until deadline for each requirement
    response.applicable = response.applicable.map((req: any) => ({
      ...req,
      daysUntilDeadline: complianceTracker.getDaysUntilDeadline(req.id),
      deadline: req.deadline.toISOString(),
    }));

    // Get upcoming deadlines - CRITICAL FIX: Filter by region
    const allUpcoming = complianceTracker.getUpcomingDeadlines(daysAhead);
    
    // Filter upcoming deadlines by region - exclude EU/US/UK specific for Global
    response.upcoming = allUpcoming
      .filter((req) => {
        // If requesting Global region, exclude EU/US/UK specific requirements
        if (region === "Global") {
          return req.region === "Global";
        }
        // For specific regions, include that region + Global requirements
        if (region && req.region !== region && req.region !== "Global") {
          return false;
        }
        // Filter by SME applicability
        if (isSME && !req.applicableToSME) {
          return false;
        }
        return true;
      })
      .map((req) => ({
        ...req,
        daysUntilDeadline: complianceTracker.getDaysUntilDeadline(req.id),
        deadline: req.deadline.toISOString(),
      }));

    // Calculate compliance score
    if (region) {
      response.score = complianceTracker.getComplianceScore(region, isSME);
    }

    // Get high priority items - CRITICAL FIX: Proper filtering
    response.highPriority = complianceTracker
      .getByPriority("high")
      .filter((req) => {
        // For Global region, only show Global requirements
        if (region === "Global" && req.region !== "Global") {
          return false;
        }
        // For specific regions, include that region + Global
        if (region && region !== "Global" && req.region !== region && req.region !== "Global") {
          return false;
        }
        if (isSME && !req.applicableToSME) {
          return false;
        }
        return true;
      })
      .map((req) => ({
        ...req,
        daysUntilDeadline: complianceTracker.getDaysUntilDeadline(req.id),
        deadline: req.deadline.toISOString(),
      }));

    // Add recommendations - region-aware
    response.recommendations = generateComplianceRecommendations(
      response.applicable,
      response.upcoming,
      region || "Global"
    );

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Compliance API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch compliance data",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

function generateComplianceRecommendations(
  applicable: any[],
  upcoming: any[],
  region: string
): string[] {
  const recommendations: string[] = [];

  // Region-specific recommendations
  if (region === "EU") {
    recommendations.push(
      "CSRD requires double materiality assessment. Consider engaging external consultants for first-time reporting."
    );
    recommendations.push(
      "EU companies should prepare for CBAM carbon accounting requirements."
    );
  } else if (region === "US") {
    recommendations.push(
      "SEC climate disclosure rules require Scope 1 & 2 emissions tracking. Start data collection now."
    );
  } else if (region === "UK") {
    recommendations.push(
      "UK SDR aligns with ISSB standards. Consider early adoption for competitive advantage."
    );
  } else if (region === "Global") {
    // For non-EU/US/UK regions (Africa, Asia, etc.)
    recommendations.push(
      "Focus on voluntary frameworks like GRI and TCFD to build sustainability credibility."
    );
    recommendations.push(
      "Establish baseline emissions tracking to prepare for future regional regulations."
    );
    recommendations.push(
      "Consider ISO 14001 environmental management certification for international market access."
    );
  }

  if (upcoming.length > 0) {
    const nextDeadline = upcoming[0];
    if (nextDeadline.daysUntilDeadline < 90) {
      recommendations.push(
        `Urgent: ${nextDeadline.name} deadline in ${nextDeadline.daysUntilDeadline} days. Start preparation immediately.`
      );
    }
  }

  const notStarted = applicable.filter(
    (req: any) => req.status === "not_started"
  );
  if (notStarted.length > 3) {
    recommendations.push(
      `You have ${notStarted.length} requirements not started. Prioritize based on deadlines and impact.`
    );
  }

  // Universal best practices
  recommendations.push(
    "Regular compliance audits reduce last-minute reporting stress by 60%."
  );
  recommendations.push(
    "Implement automated data collection to streamline reporting across all frameworks."
  );

  return recommendations.slice(0, 5); // Limit to 5 recommendations
}