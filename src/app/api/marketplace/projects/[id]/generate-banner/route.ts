import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { offsetProjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateImage } from "@/lib/generators";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    // Fetch project details
    const project = await db
      .select()
      .from(offsetProjects)
      .where(eq(offsetProjects.id, projectId))
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const projectData = project[0];

    // Generate AI prompt based on project details
    const categoryDescriptions: Record<string, string> = {
      forestry: "lush green forest with diverse trees, wildlife, sunlight filtering through canopy, natural carbon sequestration",
      renewable_energy: "modern clean energy installation, solar panels or wind turbines, blue sky, sustainable technology",
      carbon_capture: "advanced carbon capture facility, modern industrial architecture, green technology, futuristic environmental infrastructure",
      ocean_conservation: "pristine ocean waters, coral reefs or marine ecosystem, vibrant underwater life, coastal conservation"
    };

    const categoryDesc = categoryDescriptions[projectData.category] || "sustainability project landscape";
    
    const prompt = `Professional wide banner image for ${projectData.name} carbon offset project in ${projectData.location}. ${categoryDesc}. Photorealistic, high quality, cinematic lighting, 16:9 aspect ratio, environmental conservation theme, no text or labels.`;

    console.log("Generating banner for project:", projectData.name);
    console.log("Prompt:", prompt);

    // Generate image with 16:9 aspect ratio (perfect for banner)
    const result = await generateImage(prompt, "16:9");

    // Update project with banner image URL
    await db
      .update(offsetProjects)
      .set({
        bannerImage: result.url,
        updatedAt: new Date().toISOString()
      })
      .where(eq(offsetProjects.id, projectId));

    return NextResponse.json({
      success: true,
      bannerImage: result.url,
      model: result.model,
      projectId: projectId
    });
  } catch (error: any) {
    console.error("Error generating banner:", error);
    return NextResponse.json(
      { error: "Failed to generate banner", details: error.message },
      { status: 500 }
    );
  }
}
