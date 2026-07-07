import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lessons, userLessonCompletions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Validate ID is a valid integer
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

    // Return 404 if lesson not found
    if (lesson.length === 0) {
      return NextResponse.json(
        { 
          error: "Lesson not found",
          code: "LESSON_NOT_FOUND" 
        },
        { status: 404 }
      );
    }

    const lessonData = lesson[0];

    // Parse contentJson if it exists and is a string
    let parsedContentJson = null;
    if (lessonData.contentJson) {
      try {
        parsedContentJson = typeof lessonData.contentJson === 'string'
          ? JSON.parse(lessonData.contentJson)
          : lessonData.contentJson;
      } catch (parseError) {
        console.error('Error parsing contentJson:', parseError);
        // Keep as string if parsing fails
        parsedContentJson = lessonData.contentJson;
      }
    }

    // Check completion status if userId provided
    let completion = null;
    if (userId) {
      const completionRecords = await db.select()
        .from(userLessonCompletions)
        .where(
          and(
            eq(userLessonCompletions.lessonId, parseInt(id)),
            eq(userLessonCompletions.userId, userId)
          )
        )
        .limit(1);
      
      if (completionRecords.length > 0) {
        completion = {
          completedAt: completionRecords[0].completedAt,
          timeSpent: completionRecords[0].timeSpent,
          score: completionRecords[0].score
        };
      }
    }

    // Return lesson with parsed contentJson
    const response = {
      id: lessonData.id,
      moduleId: lessonData.moduleId,
      order: lessonData.order,
      title: lessonData.title,
      contentType: lessonData.contentType,
      contentJson: parsedContentJson,
      videoUrl: lessonData.videoUrl,
      isRequired: lessonData.isRequired,
      estimatedMinutes: lessonData.estimatedMinutes,
      createdAt: lessonData.createdAt,
      completion
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('GET lesson error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error as Error).message 
      },
      { status: 500 }
    );
  }
}