import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { offsetProjects } from "@/db/schema";
import { isNull, eq } from "drizzle-orm";
import { generateImage } from "@/lib/generators";

// Background image generation - runs asynchronously without blocking
export async function POST(request: NextRequest) {
  try {
    // Fetch only first 3 projects without banners to avoid rate limits
    const projectsWithoutBanners = await db
      .select()
      .from(offsetProjects)
      .where(isNull(offsetProjects.bannerImage))
      .limit(3);

    if (projectsWithoutBanners.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All projects have banner images",
        generated: 0
      });
    }

    // Start generation in background (don't await)
    generateBannersInBackground(projectsWithoutBanners);

    return NextResponse.json({
      success: true,
      message: `Generating banners for ${projectsWithoutBanners.length} projects in background`,
      pending: projectsWithoutBanners.length
    });
  } catch (error: any) {
    console.error("Error in auto-generate banners:", error);
    return NextResponse.json(
      { error: "Failed to start auto-generation", details: error.message },
      { status: 500 }
    );
  }
}

async function generateBannersInBackground(projects: any[]) {
  const categoryDescriptions: Record<string, string> = {
    forestry: "lush green forest with diverse trees, wildlife, sunlight filtering through canopy, natural carbon sequestration",
    renewable_energy: "modern clean energy installation, solar panels or wind turbines, blue sky, sustainable technology",
    carbon_capture: "advanced carbon capture facility, modern industrial architecture, green technology, futuristic environmental infrastructure",
    ocean_conservation: "pristine ocean waters, coral reefs or marine ecosystem, vibrant underwater life, coastal conservation"
  };

  for (const project of projects) {
    try {
      const categoryDesc = categoryDescriptions[project.category] || "sustainability project landscape";
      
      const prompt = `Professional wide banner image for ${project.name} carbon offset project in ${project.location}. ${categoryDesc}. Photorealistic, high quality, cinematic lighting, 16:9 aspect ratio, environmental conservation theme, no text or labels.`;

      console.log(`[Background] Generating banner for project ${project.id}: ${project.name}`);

      const result = await generateImage(prompt, "16:9");

      await db
        .update(offsetProjects)
        .set({
          bannerImage: result.url,
          updatedAt: new Date().toISOString()
        })
        .where(eq(offsetProjects.id, project.id));

      console.log(`[Background] Successfully generated banner for project ${project.id}`);

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error: any) {
      console.error(`[Background] Failed to generate banner for project ${project.id}:`, error);
    }
  }
}
