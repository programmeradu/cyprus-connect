import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { offsetProjects } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = parseInt(id);
    const body = await request.json();
    const { isFeatured, verificationStatus } = body;

    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (typeof isFeatured === "boolean") {
      updateData.isFeatured = isFeatured;
    }

    if (verificationStatus) {
      updateData.verificationStatus = verificationStatus;
    }

    await db
      .update(offsetProjects)
      .set(updateData)
      .where(eq(offsetProjects.id, projectId));

    return NextResponse.json({
      success: true,
      message: "Project status updated successfully"
    });
  } catch (error: any) {
    console.error("Error updating project status:", error);
    return NextResponse.json(
      { error: "Failed to update project status", details: error.message },
      { status: 500 }
    );
  }
}
