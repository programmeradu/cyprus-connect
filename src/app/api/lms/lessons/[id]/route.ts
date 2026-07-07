import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lessons } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        },
        { status: 400 }
      );
    }

    // Fetch lesson by ID
    const lesson = await db.select()
      .from(lessons)
      .where(eq(lessons.id, parseInt(id)))
      .limit(1);

    if (lesson.length === 0) {
      return NextResponse.json(
        { 
          error: 'Lesson not found',
          code: 'LESSON_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    // Parse contentJson field if it exists
    const lessonData = lesson[0];
    const parsedLesson = {
      ...lessonData,
      contentJson: lessonData.contentJson 
        ? JSON.parse(lessonData.contentJson) 
        : null
    };

    return NextResponse.json(parsedLesson, { status: 200 });

  } catch (error) {
    console.error('GET lesson error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}