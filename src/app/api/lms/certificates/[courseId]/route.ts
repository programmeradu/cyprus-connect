import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { certificates, lmsUserProgress, courses, user } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await context.params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    // Validate required parameters
    if (!userId) {
      return NextResponse.json(
        { 
          error: 'User ID is required',
          code: 'MISSING_USER_ID' 
        },
        { status: 400 }
      );
    }

    if (!courseId || isNaN(parseInt(courseId))) {
      return NextResponse.json(
        { 
          error: 'Valid course ID is required',
          code: 'INVALID_COURSE_ID' 
        },
        { status: 400 }
      );
    }

    const courseIdInt = parseInt(courseId);

    // Check if course exists
    const courseRecord = await db.select()
      .from(courses)
      .where(eq(courses.id, courseIdInt))
      .limit(1);

    if (courseRecord.length === 0) {
      return NextResponse.json(
        { 
          error: 'Course not found',
          code: 'COURSE_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    // Check if user exists
    const userRecord = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json(
        { 
          error: 'User not found',
          code: 'USER_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    // Check if user is enrolled and has completed the course
    const progressRecord = await db.select()
      .from(lmsUserProgress)
      .where(
        and(
          eq(lmsUserProgress.userId, userId),
          eq(lmsUserProgress.courseId, courseIdInt)
        )
      )
      .limit(1);

    if (progressRecord.length === 0) {
      return NextResponse.json(
        { 
          error: 'User is not enrolled in this course',
          code: 'NOT_ENROLLED' 
        },
        { status: 404 }
      );
    }

    // Check if course is completed
    if (!progressRecord[0].completedAt) {
      return NextResponse.json(
        { 
          error: 'Course must be completed before generating certificate',
          code: 'COURSE_NOT_COMPLETED' 
        },
        { status: 403 }
      );
    }

    // Check if certificate already exists
    const existingCertificate = await db.select()
      .from(certificates)
      .where(
        and(
          eq(certificates.userId, userId),
          eq(certificates.courseId, courseIdInt)
        )
      )
      .limit(1);

    if (existingCertificate.length > 0) {
      return NextResponse.json(existingCertificate[0], { status: 200 });
    }

    // Generate new certificate
    const timestamp = Date.now();
    const random4digits = Math.floor(1000 + Math.random() * 9000);
    const userIdPrefix = userId.substring(0, 8);
    const verificationCode = `CERT-${courseIdInt}-${userIdPrefix}-${timestamp}-${random4digits}`;
    const certificateUrl = `/certificates/${verificationCode}.pdf`;

    const newCertificate = await db.insert(certificates)
      .values({
        userId: userId,
        courseId: courseIdInt,
        issuedAt: new Date().toISOString(),
        certificateUrl: certificateUrl,
        verificationCode: verificationCode,
      })
      .returning();

    return NextResponse.json(newCertificate[0], { status: 201 });

  } catch (error) {
    console.error('GET certificate error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}