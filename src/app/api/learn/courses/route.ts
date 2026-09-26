import { NextRequest, NextResponse } from "next/server";
import { and, count, desc, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { courseModules, courses, lessons, lmsUserProgress } from "@/db/schema";
import { bindSessionUser } from "@/lib/api-auth";
import { isAdmin } from "@/lib/admin-auth";
import { logger } from "@/lib/log";

const log = logger("learn.courses");

/**
 * The course library for the signed-in account: every published course plus
 * the account's own private (generated) courses. Admins also see other
 * accounts' unpublished courses with `?admin=true`.
 *
 * Single-course reads, edits and deletes live in /api/learn/courses/[id];
 * course creation is /api/learn/generate-course.
 */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const auth = await bindSessionUser(request, params.get("userId"));
    if (!auth.ok) return auth.response;
    const userId = auth.userId;

    const limit = Math.min(Math.max(parseInt(params.get("limit") ?? "50") || 50, 1), 100);
    const offset = Math.max(parseInt(params.get("offset") ?? "0") || 0, 0);
    const adminAll = params.get("admin") === "true" && (await isAdmin(userId));

    const rows = await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        industry: courses.industry,
        difficultyLevel: courses.difficultyLevel,
        estimatedHours: courses.estimatedHours,
        isPublished: courses.isPublished,
        thumbnailUrl: courses.thumbnailUrl,
        createdBy: courses.createdBy,
        createdAt: courses.createdAt,
        updatedAt: courses.updatedAt,
      })
      .from(courses)
      .where(adminAll ? undefined : or(eq(courses.isPublished, true), eq(courses.createdBy, userId)))
      .orderBy(desc(courses.createdAt))
      .limit(limit)
      .offset(offset);

    if (rows.length === 0) return NextResponse.json([]);
    const ids = rows.map((c) => c.id);

    // Counts and enrolments in three grouped queries instead of two per course.
    const [moduleCounts, lessonCounts, enrollments] = await Promise.all([
      db
        .select({ courseId: courseModules.courseId, n: count() })
        .from(courseModules)
        .where(inArray(courseModules.courseId, ids))
        .groupBy(courseModules.courseId),
      db
        .select({ courseId: courseModules.courseId, n: count() })
        .from(lessons)
        .innerJoin(courseModules, eq(lessons.moduleId, courseModules.id))
        .where(inArray(courseModules.courseId, ids))
        .groupBy(courseModules.courseId),
      db
        .select({ courseId: lmsUserProgress.courseId, progress: lmsUserProgress.progressPercentage })
        .from(lmsUserProgress)
        .where(and(eq(lmsUserProgress.userId, userId), inArray(lmsUserProgress.courseId, ids))),
    ]);
    const modulesBy = new Map(moduleCounts.map((r) => [r.courseId, Number(r.n)]));
    const lessonsBy = new Map(lessonCounts.map((r) => [r.courseId, Number(r.n)]));
    const enrolledBy = new Map(enrollments.map((r) => [r.courseId, r.progress ?? 0]));

    return NextResponse.json(
      rows.map(({ createdBy, ...course }) => ({
        ...course,
        isMine: createdBy === userId,
        moduleCount: modulesBy.get(course.id) ?? 0,
        lessonCount: lessonsBy.get(course.id) ?? 0,
        isEnrolled: enrolledBy.has(course.id),
        progress: enrolledBy.get(course.id) ?? 0,
      })),
    );
  } catch (error) {
    const ref = log.error("list failed", error);
    return NextResponse.json({ error: "Something went wrong. Try again.", code: "INTERNAL_ERROR", ref }, { status: 500 });
  }
}
