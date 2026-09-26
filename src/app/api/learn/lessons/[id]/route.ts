import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { userLessonCompletions } from "@/db/schema";
import { bindSessionUser } from "@/lib/api-auth";
import { gateLesson } from "@/lib/learn/course-access.server";
import { sanitizeLessonContent } from "@/lib/learn/sanitize-lesson";
import { logger } from "@/lib/log";

const log = logger("learn.lesson");

/** One lesson, only from a course the account may see; HTML is cleaned on the way out. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await bindSessionUser(request, request.nextUrl.searchParams.get("userId"));
    if (!auth.ok) return auth.response;

    const gate = await gateLesson(Number(id), auth.userId);
    if (!gate.ok || !gate.lesson) return gate.ok ? NextResponse.json({ error: "Lesson not found" }, { status: 404 }) : gate.response;
    const lesson = gate.lesson;

    let content: unknown = null;
    if (lesson.contentJson) {
      try {
        content = sanitizeLessonContent(JSON.parse(lesson.contentJson));
      } catch {
        content = null;
      }
    }

    const [done] = await db
      .select()
      .from(userLessonCompletions)
      .where(and(eq(userLessonCompletions.lessonId, lesson.id), eq(userLessonCompletions.userId, auth.userId)))
      .limit(1);

    return NextResponse.json({
      id: lesson.id,
      moduleId: lesson.moduleId,
      order: lesson.order,
      title: lesson.title,
      contentType: lesson.contentType,
      contentJson: content,
      videoUrl: lesson.videoUrl,
      isRequired: lesson.isRequired,
      estimatedMinutes: lesson.estimatedMinutes,
      createdAt: lesson.createdAt,
      completion: done ? { completedAt: done.completedAt, timeSpent: done.timeSpent, score: done.score } : null,
    });
  } catch (error) {
    const ref = log.error("read failed", error);
    return NextResponse.json({ error: "Something went wrong. Try again.", ref }, { status: 500 });
  }
}
