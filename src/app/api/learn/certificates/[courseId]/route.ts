import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { certificates, courses, lmsUserProgress, user } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId: courseIdParam } = await params;
    const courseId = parseInt(courseIdParam);
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if course is completed
    const progress = await db
      .select()
      .from(lmsUserProgress)
      .where(
        and(
          eq(lmsUserProgress.userId, userId),
          eq(lmsUserProgress.courseId, courseId)
        )
      )
      .limit(1);

    if (!progress.length || !progress[0].completedAt) {
      return NextResponse.json(
        { error: "Course not completed yet" },
        { status: 400 }
      );
    }

    // Check if certificate already exists
    const existing = await db
      .select()
      .from(certificates)
      .where(
        and(
          eq(certificates.userId, userId),
          eq(certificates.courseId, courseId)
        )
      )
      .limit(1);

    if (existing.length) {
      return NextResponse.json(existing[0]);
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();

    // Get course and user details
    const course = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    const userData = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    // Create certificate
    const certificate = await db
      .insert(certificates)
      .values({
        userId,
        courseId,
        issuedAt: new Date().toISOString(),
        certificateUrl: null, // Will be generated later
        verificationCode
      })
      .returning();

    return NextResponse.json({
      ...certificate[0],
      course: course[0],
      user: userData[0]
    });
  } catch (error: any) {
    console.error("Failed to generate certificate:", error);
    return NextResponse.json(
      { error: "Failed to generate certificate" },
      { status: 500 }
    );
  }
}

function generateVerificationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
