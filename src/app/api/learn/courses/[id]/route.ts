import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { courses, courseModules, lessons, lmsUserProgress, userLessonCompletions } from '@/db/schema';
import { eq, asc, inArray, and, sql } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const courseId = parseInt(id);

    // Fetch course
    const courseResult = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (courseResult.length === 0) {
      return NextResponse.json(
        { error: 'Course not found', code: 'COURSE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const course = courseResult[0];

    // Check enrollment and progress if userId provided
    let isEnrolled = false;
    let progress = 0;
    let enrolledAt = null;
    
    if (userId) {
      const enrollment = await db
        .select()
        .from(lmsUserProgress)
        .where(
          and(
            eq(lmsUserProgress.userId, userId),
            eq(lmsUserProgress.courseId, courseId)
          )
        )
        .limit(1);
      
      if (enrollment.length > 0) {
        isEnrolled = true;
        progress = enrollment[0].progressPercentage || 0;
        enrolledAt = enrollment[0].enrolledAt;
      }
    }

    // Fetch modules ordered by 'order' field
    const modulesResult = await db
      .select()
      .from(courseModules)
      .where(eq(courseModules.courseId, courseId))
      .orderBy(asc(courseModules.order));

    // Fetch only essential lesson fields to avoid memory issues
    let parsedLessonsByModule: Record<number, any[]> = {};
    let completedLessonIds = new Set<number>();
    
    if (modulesResult.length > 0) {
      const moduleIds = modulesResult.map(m => m.id);
      
      // Select only essential fields, exclude large content_json
      const allLessons = await db
        .select({
          id: lessons.id,
          moduleId: lessons.moduleId,
          order: lessons.order,
          title: lessons.title,
          contentType: lessons.contentType,
          videoUrl: lessons.videoUrl,
          isRequired: lessons.isRequired,
          estimatedMinutes: lessons.estimatedMinutes,
          createdAt: lessons.createdAt,
        })
        .from(lessons)
        .where(inArray(lessons.moduleId, moduleIds))
        .orderBy(asc(lessons.order));

      // Get completed lessons for this user if userId provided
      if (userId && allLessons.length > 0) {
        const lessonIds = allLessons.map(l => l.id);
        const completions = await db
          .select()
          .from(userLessonCompletions)
          .where(
            and(
              eq(userLessonCompletions.userId, userId),
              inArray(userLessonCompletions.lessonId, lessonIds)
            )
          );
        
        completions.forEach(c => completedLessonIds.add(c.lessonId));
      }

      // Group lessons by module ID
      for (const lesson of allLessons) {
        if (!parsedLessonsByModule[lesson.moduleId]) {
          parsedLessonsByModule[lesson.moduleId] = [];
        }
        
        parsedLessonsByModule[lesson.moduleId].push({
          id: lesson.id,
          moduleId: lesson.moduleId,
          order: lesson.order,
          title: lesson.title,
          contentType: lesson.contentType,
          videoUrl: lesson.videoUrl,
          isRequired: lesson.isRequired,
          estimatedMinutes: lesson.estimatedMinutes,
          createdAt: lesson.createdAt,
          isCompleted: completedLessonIds.has(lesson.id)
        });
      }
    }

    // Assemble the response
    const modulesWithLessons = modulesResult.map((module) => ({
      ...module,
      lessons: parsedLessonsByModule[module.id] || [],
    }));

    return NextResponse.json(
      {
        ...course,
        isEnrolled,
        progress,
        enrolledAt,
        modules: modulesWithLessons,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const courseId = parseInt(id);

    // Check if course exists
    const existingCourse = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (existingCourse.length === 0) {
      return NextResponse.json(
        { error: 'Course not found', code: 'COURSE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validate difficultyLevel if provided
    if (body.difficultyLevel) {
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];
      if (!validDifficulties.includes(body.difficultyLevel)) {
        return NextResponse.json(
          {
            error: 'Difficulty level must be: beginner, intermediate, or advanced',
            code: 'INVALID_DIFFICULTY_LEVEL',
          },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updates: Record<string, any> = {};

    // Handle updatable fields
    const updatableFields = [
      'title',
      'description',
      'industry',
      'difficultyLevel',
      'estimatedHours',
      'isPublished',
      'thumbnailUrl',
    ];

    for (const field of updatableFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // Handle JSON fields: prerequisites, learningObjectives, tags
    const jsonFields = ['prerequisites', 'learningObjectives', 'tags'];

    for (const field of jsonFields) {
      if (body[field] !== undefined) {
        // If it's an array, stringify it
        if (Array.isArray(body[field])) {
          updates[field] = JSON.stringify(body[field]);
        }
        // If it's a string, validate it's valid JSON array
        else if (typeof body[field] === 'string') {
          try {
            const parsed = JSON.parse(body[field]);
            if (!Array.isArray(parsed)) {
              return NextResponse.json(
                {
                  error: `${field} must be a valid JSON array`,
                  code: `INVALID_${field.toUpperCase()}`,
                },
                { status: 400 }
              );
            }
            updates[field] = body[field];
          } catch (error) {
            return NextResponse.json(
              {
                error: `${field} must be a valid JSON array`,
                code: `INVALID_${field.toUpperCase()}`,
              },
              { status: 400 }
            );
          }
        }
      }
    }

    // Add updatedAt timestamp
    updates.updatedAt = new Date().toISOString();

    // Update course
    const updated = await db
      .update(courses)
      .set(updates)
      .where(eq(courses.id, courseId))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const courseId = parseInt(id);

    // Check if course exists
    const existingCourse = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (existingCourse.length === 0) {
      return NextResponse.json(
        { error: 'Course not found', code: 'COURSE_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete course (cascade will handle related records)
    const deleted = await db
      .delete(courses)
      .where(eq(courses.id, courseId))
      .returning();

    return NextResponse.json(
      {
        message: 'Course deleted successfully',
        course: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}