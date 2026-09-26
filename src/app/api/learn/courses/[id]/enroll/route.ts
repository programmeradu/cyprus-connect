import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { lmsUserProgress } from "@/db/schema";
import { bindSessionUser } from "@/lib/api-auth";
import { gateCourse } from "@/lib/learn/course-access.server";
import { logger } from "@/lib/log";

const log = logger("api.learn.enroll");

/**
 * Enrols the signed-in account in a course it may see (a published course or
 * its own private one). Enrolling twice is not an error: the existing
 * enrolment is returned, so "Start" is always one click.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await bindSessionUser(request);
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const gate = await gateCourse(Number(id), auth.userId, "view");
    if (!gate.ok) return gate.response;
    const courseId = gate.course.id;

    const [existing] = await db
      .select()
      .from(lmsUserProgress)
      .where(and(eq(lmsUserProgress.userId, auth.userId), eq(lmsUserProgress.courseId, courseId)))
      .limit(1);
    if (existing) return NextResponse.json({ enrollment: existing, alreadyEnrolled: true });

    const now = new Date().toISOString();
    const [enrollment] = await db
      .insert(lmsUserProgress)
      .values({
        userId: auth.userId,
        courseId,
        enrolledAt: now,
        completedAt: null,
        progressPercentage: 0,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return NextResponse.json({ enrollment, alreadyEnrolled: false }, { status: 201 });
  } catch (error) {
    const ref = log.error("enrol failed", error);
    return NextResponse.json({ error: "enroll_failed", message: "Enrolment did not go through. Please try again.", ref }, { status: 500 });
  }
}
