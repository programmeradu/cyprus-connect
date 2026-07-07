import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { offsetProjects, user, emissions } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user profile
    const userProfile = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    // Get user's latest emissions data
    const latestEmissions = await db
      .select()
      .from(emissions)
      .where(eq(emissions.userId, session.user.id))
      .orderBy(desc(emissions.createdAt))
      .limit(1);

    // Get all available projects
    const allProjects = await db
      .select()
      .from(offsetProjects)
      .where(sql`${offsetProjects.availableTons} > 0`);

    // AI matching logic
    const recommendations = allProjects.map(project => {
      let matchScore = 0;
      const reasons: string[] = [];

      // Parse impact metrics
      const impactMetrics = JSON.parse(project.impactMetrics);

      // Industry matching
      if (userProfile.length > 0 && userProfile[0].companyIndustry) {
        const industry = userProfile[0].companyIndustry.toLowerCase();
        
        if (industry.includes('tech') || industry.includes('software')) {
          if (project.category === 'renewable_energy') {
            matchScore += 25;
            reasons.push('Tech companies benefit from renewable energy offsets');
          }
        } else if (industry.includes('manufactur') || industry.includes('industrial')) {
          if (project.category === 'carbon_capture') {
            matchScore += 30;
            reasons.push('Industrial operations pair well with carbon capture');
          }
        } else if (industry.includes('transport') || industry.includes('logistics')) {
          if (project.category === 'forestry' || project.category === 'renewable_energy') {
            matchScore += 25;
            reasons.push('Transportation emissions offset by forestry/renewable projects');
          }
        }
      }

      // Emissions profile matching
      if (latestEmissions.length > 0) {
        const emissionData = latestEmissions[0];
        
        // High electricity usage -> renewable energy
        if (emissionData.electricity > 5000 && project.category === 'renewable_energy') {
          matchScore += 20;
          reasons.push('Your high electricity usage aligns with renewable energy projects');
        }
        
        // High transport -> forestry
        if (emissionData.transport > 3000 && project.category === 'forestry') {
          matchScore += 20;
          reasons.push('Transportation offsets best matched with forestry projects');
        }

        // High waste -> circular economy projects
        if (emissionData.waste > 500 && project.category === 'carbon_capture') {
          matchScore += 15;
          reasons.push('Waste reduction complements carbon capture initiatives');
        }
      }

      // Location preference (if user has location data)
      if (userProfile.length > 0 && userProfile[0].countryCode) {
        const userCountry = userProfile[0].countryCode;
        
        // Prefer projects in same region or developing countries
        if (project.location.toLowerCase().includes(userCountry.toLowerCase())) {
          matchScore += 15;
          reasons.push('Local project supporting your region');
        } else if (
          project.location.includes('Brazil') ||
          project.location.includes('Kenya') ||
          project.location.includes('India') ||
          project.location.includes('Indonesia') ||
          project.location.includes('Madagascar')
        ) {
          matchScore += 10;
          reasons.push('Supports developing communities with high impact');
        }
      }

      // Certification preference
      if (project.certification === 'Gold Standard' || project.certification === 'Verra VCS') {
        matchScore += 15;
        reasons.push('Premium certification ensures highest quality');
      }

      // Featured projects
      if (project.isFeatured) {
        matchScore += 10;
        reasons.push('Featured project with verified impact');
      }

      // Price value
      if (project.pricePerTon < 20) {
        matchScore += 10;
        reasons.push('Cost-effective offset option');
      } else if (project.pricePerTon > 35) {
        matchScore += 5;
        reasons.push('Premium project with advanced technology');
      }

      // Default base score for all projects
      matchScore += 20;

      return {
        ...project,
        impactMetrics,
        sdgGoals: project.sdgGoals ? JSON.parse(project.sdgGoals) : [],
        matchScore,
        matchReasons: reasons.slice(0, 3) // Top 3 reasons
      };
    });

    // Sort by match score and return top 6
    const topRecommendations = recommendations
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 6);

    return NextResponse.json({ recommendations: topRecommendations });
  } catch (error: any) {
    console.error("Error generating recommendations:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations", details: error.message },
      { status: 500 }
    );
  }
}
