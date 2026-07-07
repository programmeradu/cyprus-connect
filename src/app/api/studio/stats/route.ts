import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, mediaGenerations } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

interface StatsResponse {
  totalGenerations: number;
  imagesCount: number;
  videosCount: number;
  savedCount: number;
  modelsUsed: {
    imagen4: number;
    geminiFlash: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Check for Bearer token in Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          code: 'MISSING_AUTH_TOKEN'
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    if (!token) {
      return NextResponse.json(
        { 
          error: 'Invalid authentication token',
          code: 'INVALID_AUTH_TOKEN'
        },
        { status: 401 }
      );
    }

    // Get userId from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { 
          error: 'userId query parameter is required',
          code: 'MISSING_USER_ID'
        },
        { status: 400 }
      );
    }

    // Validate userId exists in user table
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

    // Calculate statistics using SQL aggregation
    const totalGenerationsResult = await db.select({
      count: sql<number>`count(*)`
    })
    .from(mediaGenerations)
    .where(eq(mediaGenerations.userId, userId));

    const imagesCountResult = await db.select({
      count: sql<number>`count(*)`
    })
    .from(mediaGenerations)
    .where(and(
      eq(mediaGenerations.userId, userId),
      eq(mediaGenerations.type, 'image')
    ));

    const videosCountResult = await db.select({
      count: sql<number>`count(*)`
    })
    .from(mediaGenerations)
    .where(and(
      eq(mediaGenerations.userId, userId),
      eq(mediaGenerations.type, 'video')
    ));

    const savedCountResult = await db.select({
      count: sql<number>`count(*)`
    })
    .from(mediaGenerations)
    .where(and(
      eq(mediaGenerations.userId, userId),
      eq(mediaGenerations.saved, true)
    ));

    const imagen4CountResult = await db.select({
      count: sql<number>`count(*)`
    })
    .from(mediaGenerations)
    .where(and(
      eq(mediaGenerations.userId, userId),
      eq(mediaGenerations.model, 'imagen-4.0-generate-001')
    ));

    const geminiFlashCountResult = await db.select({
      count: sql<number>`count(*)`
    })
    .from(mediaGenerations)
    .where(and(
      eq(mediaGenerations.userId, userId),
      eq(mediaGenerations.model, 'gemini-2.5-flash-image')
    ));

    const stats: StatsResponse = {
      totalGenerations: totalGenerationsResult[0]?.count ?? 0,
      imagesCount: imagesCountResult[0]?.count ?? 0,
      videosCount: videosCountResult[0]?.count ?? 0,
      savedCount: savedCountResult[0]?.count ?? 0,
      modelsUsed: {
        imagen4: imagen4CountResult[0]?.count ?? 0,
        geminiFlash: geminiFlashCountResult[0]?.count ?? 0
      }
    };

    return NextResponse.json(stats, { status: 200 });

  } catch (error) {
    console.error('GET /api/studio/stats error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}