import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { courses, lmsUserProgress } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const courseId = parseInt(id);

    // Validate courseId
    if (!courseId || isNaN(courseId)) {
      return NextResponse.json(
        { 
          error: 'Valid course ID is required',
          code: 'INVALID_COURSE_ID' 
        },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { userId } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { 
          error: 'User ID is required',
          code: 'MISSING_USER_ID' 
        },
        { status: 400 }
      );
    }

    // Validate userId is a string
    if (typeof userId !== 'string') {
      return NextResponse.json(
        { 
          error: 'User ID must be a text string',
          code: 'INVALID_USER_ID_TYPE' 
        },
        { status: 400 }
      );
    }

    // Check if course exists
    const course = await db.select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (course.length === 0) {
      return NextResponse.json(
        { 
          error: 'Course not found',
          code: 'COURSE_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    // Check if course is published
    if (!course[0].isPublished) {
      return NextResponse.json(
        { 
          error: 'Course is not available for enrollment',
          code: 'COURSE_NOT_PUBLISHED' 
        },
        { status: 403 }
      );
    }

    // Check if user is already enrolled
    const existingEnrollment = await db.select()
      .from(lmsUserProgress)
      .where(
        and(
          eq(lmsUserProgress.userId, userId),
          eq(lmsUserProgress.courseId, courseId)
        )
      )
      .limit(1);

    if (existingEnrollment.length > 0) {
      return NextResponse.json(
        { 
          error: 'User is already enrolled in this course',
          code: 'ALREADY_ENROLLED',
          enrollment: existingEnrollment[0]
        },
        { status: 409 }
      );
    }

    // Create enrollment
    const currentTimestamp = new Date().toISOString();
    
    const newEnrollment = await db.insert(lmsUserProgress)
      .values({
        userId,
        courseId,
        enrolledAt: currentTimestamp,
        startedAt: null,
        completedAt: null,
        currentModuleId: null,
        currentLessonId: null,
        progressPercentage: 0,
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
      })
      .returning();

    return NextResponse.json(newEnrollment[0], { status: 201 });

  } catch (error) {
    console.error('POST enrollment error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}