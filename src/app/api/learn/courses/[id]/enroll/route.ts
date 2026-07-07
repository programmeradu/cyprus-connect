import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lmsUserProgress, courses } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const courseId = parseInt(id);

    // Validate courseId
    if (!courseId || isNaN(courseId)) {
      return NextResponse.json(
        {
          error: 'Valid course ID is required',
          code: 'INVALID_COURSE_ID',
        },
        { status: 400 }
      );
    }

    // Check if course exists and is published
    const course = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (course.length === 0) {
      return NextResponse.json(
        {
          error: 'Course not found',
          code: 'COURSE_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    if (!course[0].isPublished) {
      return NextResponse.json(
        {
          error: 'Course is not published',
          code: 'COURSE_NOT_PUBLISHED',
        },
        { status: 400 }
      );
    }

    // Check if user is already enrolled
    const existingEnrollment = await db
      .select()
      .from(lmsUserProgress)
      .where(
        and(
          eq(lmsUserProgress.userId, user.id),
          eq(lmsUserProgress.courseId, courseId)
        )
      )
      .limit(1);

    if (existingEnrollment.length > 0) {
      return NextResponse.json(
        {
          error: 'User is already enrolled in this course',
          code: 'ALREADY_ENROLLED',
          enrollment: existingEnrollment[0],
        },
        { status: 409 }
      );
    }

    // Create new enrollment
    const now = new Date().toISOString();
    const newEnrollment = await db
      .insert(lmsUserProgress)
      .values({
        userId: user.id,
        courseId: courseId,
        enrolledAt: now,
        completedAt: null,
        progressPercentage: 0,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(newEnrollment[0], { status: 201 });
  } catch (error) {
    console.error('POST enrollment error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}