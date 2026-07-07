import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, mediaGenerations } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

// Helper function to extract Bearer token
function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

// Helper function to validate Bearer token (basic validation)
async function validateBearerToken(token: string): Promise<boolean> {
  // In a real application, validate against session or JWT
  // For this implementation, we just check if token exists and has reasonable length
  return token.length > 10;
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const token = extractBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const isValidToken = await validateBearerToken(token);
    if (!isValidToken) {
      return NextResponse.json(
        { error: 'Invalid authentication token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { userId, type, url, prompt, enhancedPrompt, model, modelReason, contextType, aspectRatio, saved } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: 'type is required', code: 'MISSING_TYPE' },
        { status: 400 }
      );
    }

    if (!url) {
      return NextResponse.json(
        { error: 'url is required', code: 'MISSING_URL' },
        { status: 400 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { error: 'prompt is required', code: 'MISSING_PROMPT' },
        { status: 400 }
      );
    }

    // Validate type is either "image" or "video"
    if (type !== 'image' && type !== 'video') {
      return NextResponse.json(
        { error: 'type must be either "image" or "video"', code: 'INVALID_TYPE' },
        { status: 400 }
      );
    }

    // Validate userId exists in user table
    const existingUser = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Create new media generation
    const timestamp = new Date().toISOString();
    const newGeneration = await db.insert(mediaGenerations)
      .values({
        userId: userId.trim(),
        type: type.trim(),
        url: url.trim(),
        prompt: prompt.trim(),
        enhancedPrompt: enhancedPrompt ? enhancedPrompt.trim() : null,
        model: model ? model.trim() : null,
        modelReason: modelReason ? modelReason.trim() : null,
        contextType: contextType ? contextType.trim() : null,
        aspectRatio: aspectRatio ? aspectRatio.trim() : null,
        edited: false,
        editParameters: null,
        saved: saved ?? false,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .returning();

    return NextResponse.json(newGeneration[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const token = extractBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const isValidToken = await validateBearerToken(token);
    if (!isValidToken) {
      return NextResponse.json(
        { error: 'Invalid authentication token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const type = searchParams.get('type');

    // Validate required userId parameter
    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    // Validate userId exists in user table
    const existingUser = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Validate type if provided
    if (type && type !== 'image' && type !== 'video') {
      return NextResponse.json(
        { error: 'type must be either "image" or "video"', code: 'INVALID_TYPE' },
        { status: 400 }
      );
    }

    // Build query
    let whereConditions = eq(mediaGenerations.userId, userId);
    
    if (type) {
      whereConditions = and(
        eq(mediaGenerations.userId, userId),
        eq(mediaGenerations.type, type)
      ) as any;
    }

    const generations = await db.select()
      .from(mediaGenerations)
      .where(whereConditions)
      .orderBy(desc(mediaGenerations.createdAt))
      .limit(limit);

    return NextResponse.json(generations, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}