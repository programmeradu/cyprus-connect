import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { offsetProjects } from "@/db/schema";
import { isNull, eq } from "drizzle-orm";
import { generateImage } from "@/lib/generators";

export async function POST(request: NextRequest) {
  try {
    // Fetch all projects without banner images
    const projectsWithoutBanners = await db
      .select()
      .from(offsetProjects)
      .where(isNull(offsetProjects.bannerImage));

    console.log(`Found ${projectsWithoutBanners.length} projects without banners`);

    if (projectsWithoutBanners.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All projects already have banner images",
        generated: 0
      });
    }

    const categoryDescriptions: Record<string, string> = {
      forestry: "lush green forest with diverse trees, wildlife, sunlight filtering through canopy, natural carbon sequestration",
      renewable_energy: "modern clean energy installation, solar panels or wind turbines, blue sky, sustainable technology",
      carbon_capture: "advanced carbon capture facility, modern industrial architecture, green technology, futuristic environmental infrastructure",
      ocean_conservation: "pristine ocean waters, coral reefs or marine ecosystem, vibrant underwater life, coastal conservation"
    };

    const results = [];
    let successCount = 0;
    let failCount = 0;

    // Generate images for each project
    for (const project of projectsWithoutBanners) {
      try {
        const categoryDesc = categoryDescriptions[project.category] || "sustainability project landscape";
        
        const prompt = `Professional wide banner image for ${project.name} carbon offset project in ${project.location}. ${categoryDesc}. Photorealistic, high quality, cinematic lighting, 16:9 aspect ratio, environmental conservation theme, no text or labels.`;

        console.log(`Generating banner for project ${project.id}: ${project.name}`);

        // Generate image
        const result = await generateImage(prompt, "16:9");

        // Update project with banner image URL
        await db
          .update(offsetProjects)
          .set({
            bannerImage: result.url,
            updatedAt: new Date().toISOString()
          })
          .where(eq(offsetProjects.id, project.id));

        results.push({
          projectId: project.id,
          projectName: project.name,
          success: true,
          bannerUrl: result.url,
          model: result.model
        });

        successCount++;

        // Add small delay between generations to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error: any) {
        console.error(`Failed to generate banner for project ${project.id}:`, error);
        results.push({
          projectId: project.id,
          projectName: project.name,
          success: false,
          error: error.message
        });
        failCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${successCount} banner images, ${failCount} failed`,
      generated: successCount,
      failed: failCount,
      results
    });
  } catch (error: any) {
    console.error("Error in bulk banner generation:", error);
    return NextResponse.json(
      { error: "Failed to bulk generate banners", details: error.message },
      { status: 500 }
    );
  }
}