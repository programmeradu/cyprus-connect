import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lessons, userLessonCompletions, lmsUserProgress, courseModules } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lessonId = parseInt(id);

    if (!lessonId || isNaN(lessonId)) {
      return NextResponse.json({
        error: 'Valid lesson ID is required',
        code: 'INVALID_LESSON_ID'
      }, { status: 400 });
    }

    const body = await request.json();
    const { userId, timeSpent, score, passed } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({
        error: 'Valid userId is required',
        code: 'MISSING_USER_ID'
      }, { status: 400 });
    }

    if (timeSpent !== undefined && (typeof timeSpent !== 'number' || timeSpent < 0)) {
      return NextResponse.json({
        error: 'timeSpent must be a positive number',
        code: 'INVALID_TIME_SPENT'
      }, { status: 400 });
    }

    if (score !== undefined && (typeof score !== 'number' || score < 0 || score > 100)) {
      return NextResponse.json({
        error: 'score must be a number between 0 and 100',
        code: 'INVALID_SCORE'
      }, { status: 400 });
    }

    if (passed !== undefined && typeof passed !== 'boolean') {
      return NextResponse.json({
        error: 'passed must be a boolean',
        code: 'INVALID_PASSED'
      }, { status: 400 });
    }

    const lesson = await db.select()
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1);

    if (lesson.length === 0) {
      return NextResponse.json({
        error: 'Lesson not found',
        code: 'LESSON_NOT_FOUND'
      }, { status: 404 });
    }

    const courseModuleRows = await db.select()
      .from(courseModules)
      .where(eq(courseModules.id, lesson[0].moduleId))
      .limit(1);

    if (courseModuleRows.length === 0) {
      return NextResponse.json({
        error: 'Course module not found',
        code: 'MODULE_NOT_FOUND'
      }, { status: 404 });
    }

    const courseId = courseModuleRows[0].courseId;

    const userProgressRecord = await db.select()
      .from(lmsUserProgress)
      .where(and(
        eq(lmsUserProgress.userId, userId),
        eq(lmsUserProgress.courseId, courseId)
      ))
      .limit(1);

    if (userProgressRecord.length === 0) {
      return NextResponse.json({
        error: 'User not enrolled in this course',
        code: 'NOT_ENROLLED'
      }, { status: 404 });
    }

    const existingCompletion = await db.select()
      .from(userLessonCompletions)
      .where(and(
        eq(userLessonCompletions.userId, userId),
        eq(userLessonCompletions.lessonId, lessonId)
      ))
      .limit(1);

    if (existingCompletion.length > 0) {
      return NextResponse.json({
        error: 'Lesson already completed',
        code: 'ALREADY_COMPLETED',
        completion: existingCompletion[0]
      }, { status: 409 });
    }

    const completionData: any = {
      userId,
      lessonId,
      completedAt: new Date().toISOString(),
      timeSpent: timeSpent || null,
      score: score !== undefined ? score : null,
      passed: passed !== undefined ? passed : null,
    };

    const newCompletion = await db.insert(userLessonCompletions)
      .values(completionData)
      .returning();

    const totalLessonsResult = await db.select({
      count: sql<number>`count(*)`
    })
      .from(lessons)
      .innerJoin(courseModules, eq(lessons.moduleId, courseModules.id))
      .where(eq(courseModules.courseId, courseId));

    const totalLessons = totalLessonsResult[0]?.count || 0;

    const completedLessonsResult = await db.select({
      count: sql<number>`count(*)`
    })
      .from(userLessonCompletions)
      .innerJoin(lessons, eq(userLessonCompletions.lessonId, lessons.id))
      .innerJoin(courseModules, eq(lessons.moduleId, courseModules.id))
      .where(and(
        eq(userLessonCompletions.userId, userId),
        eq(courseModules.courseId, courseId)
      ));

    const completedLessons = completedLessonsResult[0]?.count || 0;

    const progressPercentage = totalLessons > 0 
      ? Math.round((completedLessons / totalLessons) * 100) 
      : 0;

    const progressUpdateData: any = {
      currentLessonId: lessonId,
      progressPercentage,
      updatedAt: new Date().toISOString(),
    };

    if (!userProgressRecord[0].startedAt) {
      progressUpdateData.startedAt = new Date().toISOString();
    }

    const updatedProgress = await db.update(lmsUserProgress)
      .set(progressUpdateData)
      .where(and(
        eq(lmsUserProgress.userId, userId),
        eq(lmsUserProgress.courseId, courseId)
      ))
      .returning();

    return NextResponse.json({
      completion: newCompletion[0],
      progress: {
        progressPercentage,
        completedLessons,
        totalLessons,
        currentLessonId: lessonId,
        updatedProgress: updatedProgress[0]
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('POST error:', error);
    
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({
        error: 'Lesson already completed',
        code: 'ALREADY_COMPLETED'
      }, { status: 409 });
    }

    return NextResponse.json({
      error: 'Internal server error: ' + error.message,
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}