import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lessons, courseModules, lmsUserProgress, userLessonCompletions } from '@/db/schema';
import { eq, and, count, inArray, sql } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lessonId } = await params;

    // Validate lessonId
    if (!lessonId || isNaN(parseInt(lessonId))) {
      return NextResponse.json({
        error: 'Valid lesson ID is required',
        code: 'INVALID_LESSON_ID'
      }, { status: 400 });
    }

    const parsedLessonId = parseInt(lessonId);

    // Parse request body
    const body = await request.json();
    const { userId, timeSpent, score, passed } = body;

    // Validate userId
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json({
        error: 'User ID is required',
        code: 'MISSING_USER_ID'
      }, { status: 400 });
    }

    // Validate timeSpent if provided
    if (timeSpent !== undefined && timeSpent !== null) {
      if (!Number.isInteger(timeSpent) || timeSpent < 0) {
        return NextResponse.json({
          error: 'Time spent must be a positive integer',
          code: 'INVALID_TIME_SPENT'
        }, { status: 400 });
      }
    }

    // Validate score if provided
    if (score !== undefined && score !== null) {
      if (!Number.isInteger(score) || score < 0 || score > 100) {
        return NextResponse.json({
          error: 'Score must be an integer between 0 and 100',
          code: 'INVALID_SCORE'
        }, { status: 400 });
      }
    }

    // Validate passed if provided
    if (passed !== undefined && passed !== null) {
      if (typeof passed !== 'boolean') {
        return NextResponse.json({
          error: 'Passed must be a boolean value',
          code: 'INVALID_PASSED'
        }, { status: 400 });
      }
    }

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
    // Get all lesson IDs in the course
    const courseLessonsResult = await db.select({ lessonId: lessons.id })
      .from(lessons)
      .innerJoin(courseModules, eq(lessons.moduleId, courseModules.id))
      .where(eq(courseModules.courseId, courseId));

    const totalLessons = courseLessonsResult.length;
    const courseLessonIds = courseLessonsResult.map(l => l.lessonId);

    // Get completed lessons count for this user in this course
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

    // Update lmsUserProgress
    const updateData: any = {
      progressPercentage: Math.round(progressPercentage * 100) / 100,
      updatedAt: new Date().toISOString()
    };

    // Set startedAt if null
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
    console.error('POST lesson completion error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}