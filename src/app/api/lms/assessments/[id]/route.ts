import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assessments } from '@/db/schema';
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

    // Fetch assessment
    const assessment = await db.select()
      .from(assessments)
      .where(eq(assessments.id, parseInt(id)))
      .limit(1);

    if (assessment.length === 0) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    const assessmentData = assessment[0];

    // Parse questionsJson
    let questions;
    try {
      questions = JSON.parse(assessmentData.questionsJson);
    } catch (parseError) {
      console.error('Failed to parse questionsJson:', parseError);
      return NextResponse.json(
        { 
          error: 'Invalid questions format',
          code: "INVALID_JSON_FORMAT" 
        },
        { status: 500 }
      );
    }

    // Security: Remove correctAnswer field from all questions
    const sanitizedQuestions = questions.map((question: any) => {
      const { correctAnswer, ...questionWithoutAnswer } = question;
      return questionWithoutAnswer;
    });

    // Return assessment with sanitized questions
    return NextResponse.json({
      id: assessmentData.id,
      lessonId: assessmentData.lessonId,
      questions: sanitizedQuestions,
      passingScore: assessmentData.passingScore,
      maxAttempts: assessmentData.maxAttempts,
      createdAt: assessmentData.createdAt,
    });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}