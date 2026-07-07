import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assessments, userLessonCompletions, lmsUserProgress, lessons, courseModules } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const assessmentId = parseInt(id);

    if (!assessmentId || isNaN(assessmentId)) {
      return NextResponse.json({
        error: 'Valid assessment ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const body = await request.json();
    const { userId, answers, timeSpent } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json({
        error: 'userId is required',
        code: 'MISSING_USER_ID'
      }, { status: 400 });
    }

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({
        error: 'answers object is required',
        code: 'MISSING_ANSWERS'
      }, { status: 400 });
    }

    // Fetch assessment with lesson details
    const assessment = await db.select({
      id: assessments.id,
      lessonId: assessments.lessonId,
      questionsJson: assessments.questionsJson,
      passingScore: assessments.passingScore,
      maxAttempts: assessments.maxAttempts,
      moduleId: lessons.moduleId
    })
      .from(assessments)
      .leftJoin(lessons, eq(assessments.lessonId, lessons.id))
      .where(eq(assessments.id, assessmentId))
      .limit(1);

    if (assessment.length === 0) {
      return NextResponse.json({
        error: 'Assessment not found',
        code: 'ASSESSMENT_NOT_FOUND'
      }, { status: 404 });
    }

    const assessmentData = assessment[0];

    // Check user's previous attempts
    const previousAttempts = await db.select()
      .from(userLessonCompletions)
      .where(and(
        eq(userLessonCompletions.userId, userId),
        eq(userLessonCompletions.lessonId, assessmentData.lessonId)
      ));

    const attemptsUsed = previousAttempts.length;

    if (attemptsUsed >= assessmentData.maxAttempts) {
      return NextResponse.json({
        error: 'Maximum attempts exceeded',
        code: 'MAX_ATTEMPTS_EXCEEDED',
        attemptsUsed,
        maxAttempts: assessmentData.maxAttempts
      }, { status: 403 });
    }

    // Parse questions from JSON
    let questions;
    try {
      questions = JSON.parse(assessmentData.questionsJson);
    } catch (error) {
      console.error('Failed to parse questionsJson:', error);
      return NextResponse.json({
        error: 'Invalid assessment questions format',
        code: 'INVALID_QUESTIONS_FORMAT'
      }, { status: 500 });
    }

    // Grade the assessment
    let correctCount = 0;
    const totalQuestions = questions.length;

    for (const question of questions) {
      const userAnswer = answers[question.id];
      if (userAnswer !== undefined && userAnswer === question.correctAnswer) {
        correctCount++;
      }
    }

    // Calculate score percentage
    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= assessmentData.passingScore;

    // Create completion record
    const completion = await db.insert(userLessonCompletions)
      .values({
        userId,
        lessonId: assessmentData.lessonId,
        completedAt: new Date().toISOString(),
        timeSpent: timeSpent || null,
        score,
        passed
      })
      .returning();

    // If passed, update user's course progress
    if (passed && assessmentData.moduleId) {
      // Get the course ID from the module
      const moduleRows = await db.select({
        courseId: courseModules.courseId
      })
        .from(courseModules)
        .where(eq(courseModules.id, assessmentData.moduleId))
        .limit(1);

      if (moduleRows.length > 0) {
        const courseId = moduleRows[0].courseId;

        // Get all lessons in the course
        const courseLessons = await db.select({
          lessonId: lessons.id
        })
          .from(lessons)
          .leftJoin(courseModules, eq(lessons.moduleId, courseModules.id))
          .where(eq(courseModules.courseId, courseId));

        const totalLessons = courseLessons.length;

        // Get user's completed lessons count
        const completedLessons = await db.select({
          count: sql<number>`count(distinct ${userLessonCompletions.lessonId})`
        })
          .from(userLessonCompletions)
          .where(and(
            eq(userLessonCompletions.userId, userId),
            eq(userLessonCompletions.passed, true)
          ));

        const completedCount = completedLessons[0]?.count || 0;
        const progressPercentage = totalLessons > 0 
          ? Math.round((completedCount / totalLessons) * 100) 
          : 0;

        // Update or create progress record
        const existingProgress = await db.select()
          .from(lmsUserProgress)
          .where(and(
            eq(lmsUserProgress.userId, userId),
            eq(lmsUserProgress.courseId, courseId)
          ))
          .limit(1);

        if (existingProgress.length > 0) {
          await db.update(lmsUserProgress)
            .set({
              progressPercentage,
              updatedAt: new Date().toISOString(),
              completedAt: progressPercentage === 100 ? new Date().toISOString() : null
            })
            .where(and(
              eq(lmsUserProgress.userId, userId),
              eq(lmsUserProgress.courseId, courseId)
            ));
        }
      }
    }

    const attemptsRemaining = assessmentData.maxAttempts - (attemptsUsed + 1);

    return NextResponse.json({
      score,
      passed,
      correctAnswers: correctCount,
      totalQuestions,
      passingScore: assessmentData.passingScore,
      attemptsUsed: attemptsUsed + 1,
      attemptsRemaining
    }, { status: 201 });

  } catch (error) {
    console.error('POST assessment submission error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message,
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}