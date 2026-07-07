import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { courses, courseModules, lessons, lmsUserProgress } from '@/db/schema';
import { eq, and, like, or, desc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    // Single course fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const course = await db.select()
        .from(courses)
        .where(eq(courses.id, parseInt(id)))
        .limit(1);

      if (course.length === 0) {
        return NextResponse.json({ 
          error: 'Course not found',
          code: 'COURSE_NOT_FOUND' 
        }, { status: 404 });
      }

      // Get module and lesson counts
      const modulesCount = await db.select({ count: sql<number>`count(*)` })
        .from(courseModules)
        .where(eq(courseModules.courseId, parseInt(id)));

      const lessonsCount = await db.select({ count: sql<number>`count(*)` })
        .from(lessons)
        .innerJoin(courseModules, eq(lessons.moduleId, courseModules.id))
        .where(eq(courseModules.courseId, parseInt(id)));

      // Check enrollment status if userId provided
      let isEnrolled = false;
      let progress = 0;
      
      if (userId) {
        const enrollment = await db.select()
          .from(lmsUserProgress)
          .where(
            and(
              eq(lmsUserProgress.userId, userId),
              eq(lmsUserProgress.courseId, parseInt(id))
            )
          )
          .limit(1);
        
        if (enrollment.length > 0) {
          isEnrolled = true;
          progress = enrollment[0].progressPercentage || 0;
        }
      }

      const enrichedCourse = {
        ...course[0],
        moduleCount: modulesCount[0]?.count || 0,
        lessonCount: lessonsCount[0]?.count || 0,
        isEnrolled,
        progress
      };

      return NextResponse.json(enrichedCourse, { status: 200 });
    }

    // List courses with filters
    const industry = searchParams.get('industry');
    const difficultyLevel = searchParams.get('difficultyLevel');
    const adminMode = searchParams.get('admin') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Fetch all courses with counts
    const results = await db.select({
      id: courses.id,
      title: courses.title,
      description: courses.description,
      industry: courses.industry,
      difficultyLevel: courses.difficultyLevel,
      estimatedHours: courses.estimatedHours,
      isPublished: courses.isPublished,
      thumbnailUrl: courses.thumbnailUrl,
      createdAt: courses.createdAt,
      updatedAt: courses.updatedAt,
    }).from(courses)
    .where(adminMode ? undefined : eq(courses.isPublished, true))
    .orderBy(desc(courses.createdAt))
    .limit(limit)
    .offset(offset);

    // Get enrollments for the user if userId provided
    let userEnrollments: Record<number, any> = {};
    
    if (userId && results.length > 0) {
      const courseIds = results.map(c => c.id);
      const enrollments = await db.select()
        .from(lmsUserProgress)
        .where(
          and(
            eq(lmsUserProgress.userId, userId),
            sql`${lmsUserProgress.courseId} IN ${courseIds}`
          )
        );
      
      enrollments.forEach(enrollment => {
        userEnrollments[enrollment.courseId] = enrollment;
      });
    }

    const enrichedResults = await Promise.all(results.map(async (course) => {
      const modulesCountResult = await db.select({ count: sql<number>`count(*)` })
        .from(courseModules)
        .where(eq(courseModules.courseId, course.id));

      const lessonsCountResult = await db.select({ count: sql<number>`count(*)` })
        .from(lessons)
        .innerJoin(courseModules, eq(lessons.moduleId, courseModules.id))
        .where(eq(courseModules.courseId, course.id));

      const enrollment = userEnrollments[course.id];

      return {
        ...course,
        moduleCount: Number(modulesCountResult[0]?.count) || 0,
        lessonCount: Number(lessonsCountResult[0]?.count) || 0,
        isEnrolled: !!enrollment,
        progress: enrollment?.progressPercentage || 0
      };
    }));

    return NextResponse.json(enrichedResults, { status: 200 });
  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message,
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      title, 
      description, 
      industry, 
      difficultyLevel, 
      estimatedHours, 
      isPublished, 
      thumbnailUrl
    } = body;

    // Validate required fields
    if (!title || title.trim() === '') {
      return NextResponse.json({ 
        error: "Title is required and cannot be empty",
        code: "MISSING_TITLE" 
      }, { status: 400 });
    }

    if (!difficultyLevel) {
      return NextResponse.json({ 
        error: "Difficulty level is required",
        code: "MISSING_DIFFICULTY_LEVEL" 
      }, { status: 400 });
    }

    // Validate difficulty level enum
    const validDifficultyLevels = ['beginner', 'intermediate', 'advanced'];
    if (!validDifficultyLevels.includes(difficultyLevel.toLowerCase())) {
      return NextResponse.json({ 
        error: "Difficulty level must be one of: beginner, intermediate, advanced",
        code: "INVALID_DIFFICULTY_LEVEL" 
      }, { status: 400 });
    }

    // Validate estimatedHours if provided
    if (estimatedHours !== undefined && estimatedHours !== null) {
      const hours = parseFloat(estimatedHours);
      if (isNaN(hours) || hours <= 0) {
        return NextResponse.json({ 
          error: "Estimated hours must be a positive number",
          code: "INVALID_ESTIMATED_HOURS" 
        }, { status: 400 });
      }
    }

    // Prepare insert data
    const now = new Date().toISOString();
    const insertData: any = {
      title: title.trim(),
      difficultyLevel: difficultyLevel.toLowerCase(),
      isPublished: isPublished ?? false,
      createdAt: now,
      updatedAt: now
    };

    // Add optional fields
    if (description) {
      insertData.description = description.trim();
    }

    if (industry) {
      insertData.industry = industry.trim();
    }

    if (estimatedHours !== undefined && estimatedHours !== null) {
      insertData.estimatedHours = parseFloat(estimatedHours);
    }

    if (thumbnailUrl) {
      insertData.thumbnailUrl = thumbnailUrl.trim();
    }

    // Insert course
    const newCourse = await db.insert(courses)
      .values(insertData)
      .returning();

    if (newCourse.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to create course',
        code: 'CREATION_FAILED'
      }, { status: 500 });
    }

    // Enrich response with counts (will be 0 for new course)
    const enrichedCourse = {
      ...newCourse[0],
      moduleCount: 0,
      lessonCount: 0
    };

    return NextResponse.json(enrichedCourse, { status: 201 });
  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message,
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if course exists
    const existingCourse = await db.select()
      .from(courses)
      .where(eq(courses.id, parseInt(id)))
      .limit(1);

    if (existingCourse.length === 0) {
      return NextResponse.json({ 
        error: 'Course not found',
        code: 'COURSE_NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const { 
      title, 
      description, 
      industry, 
      difficultyLevel, 
      estimatedHours, 
      isPublished, 
      thumbnailUrl,
      prerequisites,
      learningObjectives,
      tags
    } = body;

    const updates: any = {};

    // Validate and add fields to update
    if (title !== undefined) {
      if (title.trim() === '') {
        return NextResponse.json({ 
          error: "Title cannot be empty",
          code: "INVALID_TITLE" 
        }, { status: 400 });
      }
      updates.title = title.trim();
    }

    if (difficultyLevel !== undefined) {
      const validDifficultyLevels = ['beginner', 'intermediate', 'advanced'];
      if (!validDifficultyLevels.includes(difficultyLevel.toLowerCase())) {
        return NextResponse.json({ 
          error: "Difficulty level must be one of: beginner, intermediate, advanced",
          code: "INVALID_DIFFICULTY_LEVEL" 
        }, { status: 400 });
      }
      updates.difficultyLevel = difficultyLevel.toLowerCase();
    }

    if (estimatedHours !== undefined && estimatedHours !== null) {
      const hours = parseFloat(estimatedHours);
      if (isNaN(hours) || hours <= 0) {
        return NextResponse.json({ 
          error: "Estimated hours must be a positive number",
          code: "INVALID_ESTIMATED_HOURS" 
        }, { status: 400 });
      }
      updates.estimatedHours = hours;
    }

    if (description !== undefined) {
      updates.description = description ? description.trim() : null;
    }

    if (industry !== undefined) {
      updates.industry = industry ? industry.trim() : null;
    }

    if (isPublished !== undefined) {
      updates.isPublished = Boolean(isPublished);
    }

    if (thumbnailUrl !== undefined) {
      updates.thumbnailUrl = thumbnailUrl ? thumbnailUrl.trim() : null;
    }

    // Validate JSON array fields
    if (prerequisites !== undefined && !Array.isArray(prerequisites)) {
      return NextResponse.json({ 
        error: "Prerequisites must be an array",
        code: "INVALID_PREREQUISITES_FORMAT" 
      }, { status: 400 });
    }

    if (learningObjectives !== undefined && !Array.isArray(learningObjectives)) {
      return NextResponse.json({ 
        error: "Learning objectives must be an array",
        code: "INVALID_LEARNING_OBJECTIVES_FORMAT" 
      }, { status: 400 });
    }

    if (tags !== undefined && !Array.isArray(tags)) {
      return NextResponse.json({ 
        error: "Tags must be an array",
        code: "INVALID_TAGS_FORMAT" 
      }, { status: 400 });
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ 
        error: "No valid fields to update",
        code: "NO_UPDATES" 
      }, { status: 400 });
    }

    // Update course
    const updatedCourse = await db.update(courses)
      .set(updates)
      .where(eq(courses.id, parseInt(id)))
      .returning();

    if (updatedCourse.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to update course',
        code: 'UPDATE_FAILED'
      }, { status: 500 });
    }

    // Get module and lesson counts
    const modulesCount = await db.select({ count: sql<number>`count(*)` })
      .from(courseModules)
      .where(eq(courseModules.courseId, parseInt(id)));

    const lessonsCount = await db.select({ count: sql<number>`count(*)` })
      .from(lessons)
      .innerJoin(courseModules, eq(lessons.moduleId, courseModules.id))
      .where(eq(courseModules.courseId, parseInt(id)));

    // Enrich response
    const enrichedCourse = {
      ...updatedCourse[0],
      moduleCount: modulesCount[0]?.count || 0,
      lessonCount: lessonsCount[0]?.count || 0,
      prerequisites: prerequisites || (updatedCourse[0].prerequisites ? JSON.parse(updatedCourse[0].prerequisites) : null),
      learningObjectives: learningObjectives || (updatedCourse[0].learningObjectives ? JSON.parse(updatedCourse[0].learningObjectives) : null),
      tags: tags || (updatedCourse[0].tags ? JSON.parse(updatedCourse[0].tags) : null)
    };

    return NextResponse.json(enrichedCourse, { status: 200 });
  } catch (error: any) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message,
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if course exists
    const existingCourse = await db.select()
      .from(courses)
      .where(eq(courses.id, parseInt(id)))
      .limit(1);

    if (existingCourse.length === 0) {
      return NextResponse.json({ 
        error: 'Course not found',
        code: 'COURSE_NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete course (cascade will handle related records)
    const deleted = await db.delete(courses)
      .where(eq(courses.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to delete course',
        code: 'DELETION_FAILED'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Course deleted successfully',
      course: deleted[0]
    }, { status: 200 });
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message,
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}