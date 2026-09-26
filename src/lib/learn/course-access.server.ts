import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { courseModules, courses, lessons } from "@/db/schema";
import { isAdmin } from "@/lib/admin-auth";
import { canEditCourse, canViewCourse } from "./access";

type CourseRow = typeof courses.$inferSelect;
export type CourseGate =
  | { ok: true; course: CourseRow; admin: boolean }
  | { ok: false; response: NextResponse };

const notFound = () =>
  NextResponse.json({ error: "Course not found", code: "COURSE_NOT_FOUND" }, { status: 404 });

/**
 * Loads a course and checks the signed-in account may see it (or change it).
 * A private course of another account answers 404, so its existence is not revealed.
 */
export async function gateCourse(courseId: number, userId: string, mode: "view" | "edit"): Promise<CourseGate> {
  if (!Number.isInteger(courseId) || courseId <= 0) return { ok: false, response: notFound() };
  const [course] = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
  if (!course) return { ok: false, response: notFound() };
  const admin = await isAdmin(userId);
  if (!canViewCourse(course, userId, admin)) return { ok: false, response: notFound() };
  if (mode === "edit" && !canEditCourse(course, userId, admin)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Only the course creator or an admin can change this course.", code: "FORBIDDEN" }, { status: 403 }),
    };
  }
  return { ok: true, course, admin };
}

/** Same check, starting from a lesson id. */
export async function gateLesson(lessonId: number, userId: string): Promise<CourseGate & { lesson?: typeof lessons.$inferSelect }> {
  if (!Number.isInteger(lessonId) || lessonId <= 0) return { ok: false, response: NextResponse.json({ error: "Lesson not found", code: "LESSON_NOT_FOUND" }, { status: 404 }) };
  const [row] = await db
    .select({ lesson: lessons, courseId: courseModules.courseId })
    .from(lessons)
    .innerJoin(courseModules, eq(lessons.moduleId, courseModules.id))
    .where(eq(lessons.id, lessonId))
    .limit(1);
  if (!row) return { ok: false, response: NextResponse.json({ error: "Lesson not found", code: "LESSON_NOT_FOUND" }, { status: 404 }) };
  const gate = await gateCourse(row.courseId, userId, "view");
  if (!gate.ok) return { ok: false, response: NextResponse.json({ error: "Lesson not found", code: "LESSON_NOT_FOUND" }, { status: 404 }) };
  return { ...gate, lesson: row.lesson };
}
