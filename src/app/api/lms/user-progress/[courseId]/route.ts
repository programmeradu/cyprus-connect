import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lmsUserProgress, courses, courseModules, lessons, userLessonCompletions } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    // Validate required parameters
    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    if (!courseId || isNaN(parseInt(courseId))) {
      return NextResponse.json(
        { error: 'Valid courseId is required', code: 'INVALID_COURSE_ID' },
        { status: 400 }
      );
    }

    const courseIdInt = parseInt(courseId);

    // Fetch user progress for this course
    const progressRecords = await db
      .select()
      .from(lmsUserProgress)
      .where(
        and(
          eq(lmsUserProgress.userId, userId),
          eq(lmsUserProgress.courseId, courseIdInt)
        )
      )
      .limit(1);

    if (progressRecords.length === 0) {
      return NextResponse.json(
        { error: 'User not enrolled in this course', code: 'NOT_ENROLLED' },
        { status: 404 }
      );
    }

    const progressRecord = progressRecords[0];

    // Fetch course details
    const courseRecords = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseIdInt))
      .limit(1);

    if (courseRecords.length === 0) {
      return NextResponse.json(
        { error: 'Course not found', code: 'COURSE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const courseData = courseRecords[0];

    // Fetch all modules for this course
    const modulesData = await db
      .select()
      .from(courseModules)
      .where(eq(courseModules.courseId, courseIdInt))
      .orderBy(asc(courseModules.order));

    // Fetch all lessons for these modules
    const moduleIds = modulesData.map(m => m.id);
    let lessonsData: any[] = [];
    
    if (moduleIds.length > 0) {
      lessonsData = await db
        .select()
        .from(lessons)
        .where(
          and(
            ...moduleIds.map(id => eq(lessons.moduleId, id))
          )
        )
        .orderBy(asc(lessons.order));
    }

    // Fetch all lesson completions for this user
    const lessonIds = lessonsData.map(l => l.id);
    let completionsData: any[] = [];

    if (lessonIds.length > 0) {
      completionsData = await db
        .select()
        .from(userLessonCompletions)
        .where(
          and(
            eq(userLessonCompletions.userId, userId),
            ...lessonIds.map(id => eq(userLessonCompletions.lessonId, id))
          )
        );
    }

    // Create a map of lesson completions for quick lookup
    const completionsMap = new Map(
      completionsData.map(c => [c.lessonId, c])
    );

    // Build the response structure with modules and lessons
    const modulesWithLessons = modulesData.map(module => {
      const moduleLessons = lessonsData
        .filter(lesson => lesson.moduleId === module.id)
        .map(lesson => {
          const completion = completionsMap.get(lesson.id);
          return {
            ...lesson,
            isCompleted: !!completion,
            completedAt: completion?.completedAt || null,
            score: completion?.score || null,
          };
        });

      return {
        ...module,
        lessons: moduleLessons,
      };
    });

    // Return complete progress data
    return NextResponse.json({
      progress: {
        ...progressRecord,
        course: courseData,
      },
      modules: modulesWithLessons,
    });

  } catch (error) {
    console.error('GET course progress error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}