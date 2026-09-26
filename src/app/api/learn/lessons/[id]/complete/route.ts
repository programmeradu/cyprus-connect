import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { lessons, courseModules, lmsUserProgress, userLessonCompletions } from '@/db/schema';
import { eq, and, count, inArray } from 'drizzle-orm';
import { bindSessionUser } from "@/lib/api-auth";
import { readJson, parseValue } from '@/lib/validate';
import { logger } from '@/lib/log';

const log = logger("api.learn.lessons.complete");

const idSchema = z.coerce.number().int().positive();

const postSchema = z.object({
  userId: z.string().trim().min(1).max(200).optional(),
  timeSpent: z.number().int().min(0).max(1_000_000).nullable().optional(),
  score: z.number().int().min(0).max(100).nullable().optional(),
  passed: z.boolean().nullable().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lessonId } = await params;
    const parsedLessonIdResult = parseValue(lessonId, idSchema);
    if (!parsedLessonIdResult.ok) return parsedLessonIdResult.response;
    const parsedLessonId = parsedLessonIdResult.data;

    const parsed = await readJson(request, postSchema);
    if (!parsed.ok) return parsed.response;
    const { userId: __claimedUserId, timeSpent, score, passed } = parsed.data;
    const __auth = await bindSessionUser(request, __claimedUserId);
    if (!__auth.ok) return __auth.response;
    const userId = __auth.userId;

    // Check if lesson exists and get moduleId
    const lessonResult = await db.select({
      id: lessons.id,
      moduleId: lessons.moduleId,
      title: lessons.title
    })
      .from(lessons)
      .where(eq(lessons.id, parsedLessonId))
      .limit(1);

    if (lessonResult.length === 0) {
      return NextResponse.json({
        error: 'Lesson not found',
        code: 'LESSON_NOT_FOUND'
      }, { status: 404 });
    }

    const lesson = lessonResult[0];

    // Get courseId from moduleId
    const moduleResult = await db.select({
      id: courseModules.id,
      courseId: courseModules.courseId
    })
      .from(courseModules)
      .where(eq(courseModules.id, lesson.moduleId))
      .limit(1);

    if (moduleResult.length === 0) {
      return NextResponse.json({
        error: 'Module not found',
        code: 'MODULE_NOT_FOUND'
      }, { status: 404 });
    }

    const courseModule = moduleResult[0];
    const courseId = courseModule.courseId;

    // Verify user is enrolled in the course
    const enrollmentResult = await db.select()
      .from(lmsUserProgress)
      .where(
        and(
          eq(lmsUserProgress.userId, userId),
          eq(lmsUserProgress.courseId, courseId)
        )
      )
      .limit(1);

    if (enrollmentResult.length === 0) {
      return NextResponse.json({
        error: 'User is not enrolled in this course',
        code: 'NOT_ENROLLED'
      }, { status: 403 });
    }

    const userProgress = enrollmentResult[0];

    // Check if lesson is already completed
    const existingCompletion = await db.select()
      .from(userLessonCompletions)
      .where(
        and(
          eq(userLessonCompletions.userId, userId),
          eq(userLessonCompletions.lessonId, parsedLessonId)
        )
      )
      .limit(1);

    if (existingCompletion.length > 0) {
      return NextResponse.json({
        error: 'Lesson already completed',
        code: 'ALREADY_COMPLETED'
      }, { status: 409 });
    }

    // Insert completion record
    const completionData = {
      userId,
      lessonId: parsedLessonId,
      completedAt: new Date().toISOString(),
      timeSpent: timeSpent ?? null,
      score: score ?? null,
      passed: passed ?? null
    };

    const newCompletion = await db.insert(userLessonCompletions)
      .values(completionData)
      .returning();

    // Calculate progress
    const courseLessonsResult = await db.select({ lessonId: lessons.id })
      .from(lessons)
      .innerJoin(courseModules, eq(lessons.moduleId, courseModules.id))
      .where(eq(courseModules.courseId, courseId));

    const totalLessons = courseLessonsResult.length;
    const courseLessonIds = courseLessonsResult.map(l => l.lessonId);

    const completedLessonsResult = await db.select({ count: count() })
      .from(userLessonCompletions)
      .where(
        and(
          eq(userLessonCompletions.userId, userId),
          inArray(userLessonCompletions.lessonId, courseLessonIds)
        )
      );

    const completedLessons = completedLessonsResult[0]?.count ?? 0;
    const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    const updateData: any = {
      progressPercentage: Math.round(progressPercentage * 100) / 100,
      updatedAt: new Date().toISOString()
    };

    if (!userProgress.startedAt) {
      updateData.startedAt = new Date().toISOString();
    }

    const updatedProgress = await db.update(lmsUserProgress)
      .set(updateData)
      .where(
        and(
          eq(lmsUserProgress.userId, userId),
          eq(lmsUserProgress.courseId, courseId)
        )
      )
      .returning();

    return NextResponse.json({
      completion: newCompletion[0],
      progress: {
        progressPercentage: updateData.progressPercentage,
        completedLessons,
        totalLessons,
        currentLessonId: parsedLessonId,
        updatedProgress: updatedProgress[0]
      }
    }, { status: 201 });

  } catch (error) {
    const ref = log.error('POST /api/learn/lessons/[id]/complete failed', error);
    return NextResponse.json({ error: 'Internal server error', ref }, { status: 500 });
  }
}
