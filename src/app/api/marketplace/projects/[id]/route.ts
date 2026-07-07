import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { offsetProjects } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
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

    return NextResponse.json({
      project: {
        ...project[0],
        impactMetrics: JSON.parse(project[0].impactMetrics),
        sdgGoals: project[0].sdgGoals ? JSON.parse(project[0].sdgGoals) : []
      }
    });
  } catch (error: any) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project", details: error.message },
      { status: 500 }
    );
  }
}
