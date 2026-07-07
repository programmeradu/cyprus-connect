import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { courses, courseModules, lessons } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const industry = searchParams.get('industry');
    const difficultyLevel = searchParams.get('difficultyLevel');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Build base query for published courses only
    let whereConditions = [eq(courses.isPublished, true)];

    if (industry) {
      whereConditions.push(eq(courses.industry, industry));
    }

    if (difficultyLevel) {
      whereConditions.push(eq(courses.difficultyLevel, difficultyLevel));
    }

    // Get courses with filters
    const coursesResults = await db
      .select()
      .from(courses)
      .where(and(...whereConditions))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(courses)
      .where(and(...whereConditions));

    const total = totalResult[0]?.count || 0;

    // Enrich each course with module count and lesson count
    const enrichedCourses = await Promise.all(
      coursesResults.map(async (course) => {
        // Get module count
        const moduleCountResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(courseModules)
          .where(eq(courseModules.courseId, course.id));

        const moduleCount = moduleCountResult[0]?.count || 0;

        // Get total lesson count across all modules
        const lessonCountResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(lessons)
          .innerJoin(courseModules, eq(lessons.moduleId, courseModules.id))
          .where(eq(courseModules.courseId, course.id));

        const lessonCount = lessonCountResult[0]?.count || 0;

        // Parse JSON fields
        let prerequisites = [];
        let learningObjectives = [];
        let tags = [];

        try {
          if (course.prerequisites) {
            prerequisites = JSON.parse(course.prerequisites);
          }
        } catch (e) {
          console.error('Failed to parse prerequisites:', e);
        }

        try {
          if (course.learningObjectives) {
            learningObjectives = JSON.parse(course.learningObjectives);
          }
        } catch (e) {
          console.error('Failed to parse learningObjectives:', e);
        }

        try {
          if (course.tags) {
            tags = JSON.parse(course.tags);
          }
        } catch (e) {
          console.error('Failed to parse tags:', e);
        }

        return {
          ...course,
          prerequisites,
          learningObjectives,
          tags,
          moduleCount,
          lessonCount,
        };
      })
    );

    return NextResponse.json({
      courses: enrichedCourses,
      total,
    });
  } catch (error) {
    console.error('GET courses error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
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
      prerequisites,
      learningObjectives,
      createdBy,
      isPublished,
      tags,
      thumbnailUrl,
    } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required', code: 'MISSING_TITLE' },
        { status: 400 }
      );
    }

    if (!difficultyLevel) {
      return NextResponse.json(
        { error: 'Difficulty level is required', code: 'MISSING_DIFFICULTY_LEVEL' },
        { status: 400 }
      );
    }

    if (!createdBy) {
      return NextResponse.json(
        { error: 'Created by is required', code: 'MISSING_CREATED_BY' },
        { status: 400 }
      );
    }

    // Validate difficultyLevel enum
    const validDifficultyLevels = ['beginner', 'intermediate', 'advanced'];
    if (!validDifficultyLevels.includes(difficultyLevel)) {
      return NextResponse.json(
        {
          error: `Difficulty level must be one of: ${validDifficultyLevels.join(', ')}`,
          code: 'INVALID_DIFFICULTY_LEVEL',
        },
        { status: 400 }
      );
    }

    // Validate createdBy enum
    const validCreatedBy = ['ai', 'admin'];
    if (!validCreatedBy.includes(createdBy)) {
      return NextResponse.json(
        {
          error: `Created by must be one of: ${validCreatedBy.join(', ')}`,
          code: 'INVALID_CREATED_BY',
        },
        { status: 400 }
      );
    }

    // Validate and stringify JSON fields
    let prerequisitesJson = null;
    if (prerequisites !== undefined && prerequisites !== null) {
      if (!Array.isArray(prerequisites)) {
        return NextResponse.json(
          { error: 'Prerequisites must be a valid JSON array', code: 'INVALID_PREREQUISITES' },
          { status: 400 }
        );
      }
      prerequisitesJson = JSON.stringify(prerequisites);
    }

    let learningObjectivesJson = null;
    if (learningObjectives !== undefined && learningObjectives !== null) {
      if (!Array.isArray(learningObjectives)) {
        return NextResponse.json(
          { error: 'Learning objectives must be a valid JSON array', code: 'INVALID_LEARNING_OBJECTIVES' },
          { status: 400 }
        );
      }
      learningObjectivesJson = JSON.stringify(learningObjectives);
    }

    let tagsJson = null;
    if (tags !== undefined && tags !== null) {
      if (!Array.isArray(tags)) {
        return NextResponse.json(
          { error: 'Tags must be a valid JSON array', code: 'INVALID_TAGS' },
          { status: 400 }
        );
      }
      tagsJson = JSON.stringify(tags);
    }

    // Prepare insert data with defaults and timestamps
    const timestamp = new Date().toISOString();
    const insertData = {
      title: title.trim(),
      description: description ? description.trim() : null,
      industry: industry ? industry.trim() : null,
      difficultyLevel,
      estimatedHours: estimatedHours !== undefined ? estimatedHours : null,
      prerequisites: prerequisitesJson,
      learningObjectives: learningObjectivesJson,
      createdBy,
      isPublished: isPublished !== undefined ? isPublished : false,
      tags: tagsJson,
      thumbnailUrl: thumbnailUrl ? thumbnailUrl.trim() : null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // Insert the course
    const newCourse = await db.insert(courses).values(insertData).returning();

    // Parse JSON fields for response
    const responseData = {
      ...newCourse[0],
      prerequisites: prerequisitesJson ? JSON.parse(prerequisitesJson) : [],
      learningObjectives: learningObjectivesJson ? JSON.parse(learningObjectivesJson) : [],
      tags: tagsJson ? JSON.parse(tagsJson) : [],
    };

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error('POST courses error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}