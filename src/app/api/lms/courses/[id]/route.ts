import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { courses, courseModules, lessons } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid course ID is required', code: 'INVALID_ID' },
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

    // Parse JSON fields
    const parsedCourse = {
      ...course,
      prerequisites: course.prerequisites ? JSON.parse(course.prerequisites) : [],
      learningObjectives: course.learningObjectives ? JSON.parse(course.learningObjectives) : [],
      tags: course.tags ? JSON.parse(course.tags) : [],
    };

    // Fetch modules ordered by 'order' field
    const modulesResult = await db
      .select()
      .from(courseModules)
      .where(eq(courseModules.courseId, courseId))
      .orderBy(asc(courseModules.order));

    // Fetch lessons for all modules
    const modulesWithLessons = await Promise.all(
      modulesResult.map(async (module) => {
        const lessonsResult = await db
          .select()
          .from(lessons)
          .where(eq(lessons.moduleId, module.id))
          .orderBy(asc(lessons.order));

        // Parse contentJson for each lesson
        const parsedLessons = lessonsResult.map(lesson => ({
          ...lesson,
          contentJson: lesson.contentJson ? JSON.parse(lesson.contentJson) : null,
        }));

        return {
          ...module,
          lessons: parsedLessons,
        };
      })
    );

    return NextResponse.json({
      course: parsedCourse,
      modules: modulesWithLessons,
    });
  } catch (error) {
    console.error('GET course error:', error);
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
        { error: 'Valid course ID is required', code: 'INVALID_ID' },
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

    const updates = await request.json();

    // Validate difficultyLevel if provided
    if (updates.difficultyLevel) {
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];
      if (!validDifficulties.includes(updates.difficultyLevel.toLowerCase())) {
        return NextResponse.json(
          {
            error: 'Invalid difficulty level. Must be: beginner, intermediate, or advanced',
            code: 'INVALID_DIFFICULTY_LEVEL',
          },
          { status: 400 }
        );
      }
    }

    // Validate and stringify JSON fields if provided
    const updateData: Record<string, any> = {};

    if (updates.title !== undefined) {
      if (typeof updates.title !== 'string' || updates.title.trim().length === 0) {
        return NextResponse.json(
          { error: 'Title must be a non-empty string', code: 'INVALID_TITLE' },
          { status: 400 }
        );
      }
      updateData.title = updates.title.trim();
    }

    if (updates.description !== undefined) {
      updateData.description = updates.description;
    }

    if (updates.industry !== undefined) {
      updateData.industry = updates.industry;
    }

    if (updates.difficultyLevel !== undefined) {
      updateData.difficultyLevel = updates.difficultyLevel.toLowerCase();
    }

    if (updates.estimatedHours !== undefined) {
      if (typeof updates.estimatedHours !== 'number' || updates.estimatedHours < 0) {
        return NextResponse.json(
          { error: 'Estimated hours must be a positive number', code: 'INVALID_ESTIMATED_HOURS' },
          { status: 400 }
        );
      }
      updateData.estimatedHours = updates.estimatedHours;
    }

    if (updates.prerequisites !== undefined) {
      try {
        const prereqArray = Array.isArray(updates.prerequisites)
          ? updates.prerequisites
          : JSON.parse(updates.prerequisites);
        if (!Array.isArray(prereqArray)) {
          throw new Error('Prerequisites must be an array');
        }
        updateData.prerequisites = JSON.stringify(prereqArray);
      } catch (error) {
        return NextResponse.json(
          { error: 'Prerequisites must be a valid JSON array', code: 'INVALID_PREREQUISITES' },
          { status: 400 }
        );
      }
    }

    if (updates.learningObjectives !== undefined) {
      try {
        const objectivesArray = Array.isArray(updates.learningObjectives)
          ? updates.learningObjectives
          : JSON.parse(updates.learningObjectives);
        if (!Array.isArray(objectivesArray)) {
          throw new Error('Learning objectives must be an array');
        }
        updateData.learningObjectives = JSON.stringify(objectivesArray);
      } catch (error) {
        return NextResponse.json(
          {
            error: 'Learning objectives must be a valid JSON array',
            code: 'INVALID_LEARNING_OBJECTIVES',
          },
          { status: 400 }
        );
      }
    }

    if (updates.createdBy !== undefined) {
      updateData.createdBy = updates.createdBy;
    }

    if (updates.isPublished !== undefined) {
      updateData.isPublished = Boolean(updates.isPublished);
    }

    if (updates.tags !== undefined) {
      try {
        const tagsArray = Array.isArray(updates.tags) ? updates.tags : JSON.parse(updates.tags);
        if (!Array.isArray(tagsArray)) {
          throw new Error('Tags must be an array');
        }
        updateData.tags = JSON.stringify(tagsArray);
      } catch (error) {
        return NextResponse.json(
          { error: 'Tags must be a valid JSON array', code: 'INVALID_TAGS' },
          { status: 400 }
        );
      }
    }

    if (updates.thumbnailUrl !== undefined) {
      updateData.thumbnailUrl = updates.thumbnailUrl;
    }

    // Always update timestamp
    updateData.updatedAt = new Date().toISOString();

    // Update course
    const updatedCourse = await db
      .update(courses)
      .set(updateData)
      .where(eq(courses.id, courseId))
      .returning();

    // Parse JSON fields for response
    const parsedCourse = {
      ...updatedCourse[0],
      prerequisites: updatedCourse[0].prerequisites
        ? JSON.parse(updatedCourse[0].prerequisites)
        : [],
      learningObjectives: updatedCourse[0].learningObjectives
        ? JSON.parse(updatedCourse[0].learningObjectives)
        : [],
      tags: updatedCourse[0].tags ? JSON.parse(updatedCourse[0].tags) : [],
    };

    return NextResponse.json(parsedCourse);
  } catch (error) {
    console.error('PATCH course error:', error);
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
        { error: 'Valid course ID is required', code: 'INVALID_ID' },
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

    // Delete course (cascade will delete modules and lessons)
    const deletedCourse = await db
      .delete(courses)
      .where(eq(courses.id, courseId))
      .returning();

    return NextResponse.json({
      message: 'Course deleted successfully',
      course: {
        id: deletedCourse[0].id,
        title: deletedCourse[0].title,
      },
    });
  } catch (error) {
    console.error('DELETE course error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}