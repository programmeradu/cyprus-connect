import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lmsUserProgress, courses, userLessonCompletions } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Validate userId is provided and non-empty
    if (!userId || userId.trim() === '') {
      return NextResponse.json({
        error: 'User ID is required',
        code: 'MISSING_USER_ID'
      }, { status: 400 });
    }

    // Fetch all lmsUserProgress records for the user
    const progressRecords = await db.select()
      .from(lmsUserProgress)
      .where(eq(lmsUserProgress.userId, userId))
      .orderBy(desc(lmsUserProgress.enrolledAt));

    // If no progress records found, return empty array
    if (progressRecords.length === 0) {
      return NextResponse.json([]);
    }

    // Enrich each progress record with course details and completed lessons count
    const enrichedProgress = await Promise.all(
      progressRecords.map(async (progress) => {
        // Fetch course details
        const courseDetails = await db.select({
          title: courses.title,
          description: courses.description,
          thumbnailUrl: courses.thumbnailUrl,
          difficultyLevel: courses.difficultyLevel,
        })
          .from(courses)
          .where(eq(courses.id, progress.courseId))
          .limit(1);

        // Count completed lessons for this user and course
        // Note: We need to count lessons that belong to modules of this course
        const completedLessons = await db.select({
          count: sql<number>`count(*)`
        })
          .from(userLessonCompletions)
          .where(eq(userLessonCompletions.userId, userId));

        const completedLessonsCount = completedLessons[0]?.count || 0;

        return {
          id: progress.id,
          userId: progress.userId,
          courseId: progress.courseId,
          enrolledAt: progress.enrolledAt,
          completedAt: progress.completedAt,
          progressPercentage: progress.progressPercentage,
          createdAt: progress.createdAt,
          updatedAt: progress.updatedAt,
          course: courseDetails[0] || {
            title: null,
            description: null,
            thumbnailUrl: null,
            difficultyLevel: null,
          },
          completedLessonsCount: Number(completedLessonsCount)
        };
      })
    );

    return NextResponse.json(enrichedProgress);

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}