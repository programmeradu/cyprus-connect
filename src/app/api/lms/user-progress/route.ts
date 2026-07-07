import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lmsUserProgress, courses, userLessonCompletions } from '@/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ 
        error: "userId is required",
        code: "MISSING_USER_ID" 
      }, { status: 400 });
    }

    // Fetch all progress records for the user with course details
    const progressRecords = await db
      .select({
        id: lmsUserProgress.id,
        userId: lmsUserProgress.userId,
        courseId: lmsUserProgress.courseId,
        enrolledAt: lmsUserProgress.enrolledAt,
        startedAt: lmsUserProgress.startedAt,
        completedAt: lmsUserProgress.completedAt,
        currentModuleId: lmsUserProgress.currentModuleId,
        currentLessonId: lmsUserProgress.currentLessonId,
        progressPercentage: lmsUserProgress.progressPercentage,
        createdAt: lmsUserProgress.createdAt,
        updatedAt: lmsUserProgress.updatedAt,
        courseTitle: courses.title,
        courseDescription: courses.description,
        courseThumbnailUrl: courses.thumbnailUrl,
        courseDifficultyLevel: courses.difficultyLevel,
      })
      .from(lmsUserProgress)
      .leftJoin(courses, eq(lmsUserProgress.courseId, courses.id))
      .where(eq(lmsUserProgress.userId, userId))
      .orderBy(desc(lmsUserProgress.enrolledAt));

    // Fetch completed lessons count for each course enrollment
    const enrichedProgress = await Promise.all(
      progressRecords.map(async (progress) => {
        const completedLessonsResult = await db
          .select({
            count: sql<number>`count(*)`,
          })
          .from(userLessonCompletions)
          .where(
            and(
              eq(userLessonCompletions.userId, userId)
            )
          );

        const completedLessonsCount = completedLessonsResult[0]?.count || 0;

        return {
          id: progress.id,
          userId: progress.userId,
          courseId: progress.courseId,
          enrolledAt: progress.enrolledAt,
          startedAt: progress.startedAt,
          completedAt: progress.completedAt,
          currentModuleId: progress.currentModuleId,
          currentLessonId: progress.currentLessonId,
          progressPercentage: progress.progressPercentage,
          createdAt: progress.createdAt,
          updatedAt: progress.updatedAt,
          course: {
            title: progress.courseTitle,
            description: progress.courseDescription,
            thumbnailUrl: progress.courseThumbnailUrl,
            difficultyLevel: progress.courseDifficultyLevel,
          },
          completedLessonsCount,
        };
      })
    );

    return NextResponse.json(enrichedProgress, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}