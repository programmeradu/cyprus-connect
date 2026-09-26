import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { user, mediaGenerations } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { bindSessionUser } from "@/lib/api-auth";
import { readJson, parseValue } from '@/lib/validate';
import { logger } from '@/lib/log';

const log = logger("api.studio.generations");

// Helper function to extract Bearer token
function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

function validateBearerToken(token: string): boolean {
  return token.length > 10;
}

const postSchema = z.object({
  userId: z.string().trim().min(1).max(200).optional(),
  type: z.enum(['image', 'video']),
  url: z.string().trim().min(1).max(4000),
  prompt: z.string().trim().min(1).max(10000),
  enhancedPrompt: z.string().trim().max(10000).nullable().optional(),
  model: z.string().trim().max(200).nullable().optional(),
  modelReason: z.string().trim().max(2000).nullable().optional(),
  contextType: z.string().trim().max(200).nullable().optional(),
  aspectRatio: z.string().trim().max(32).nullable().optional(),
  saved: z.boolean().optional(),
});

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  type: z.enum(['image', 'video']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    if (!validateBearerToken(token)) {
      return NextResponse.json(
        { error: 'Invalid authentication token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    const parsed = await readJson(request, postSchema);
    if (!parsed.ok) return parsed.response;
    const { userId: __claimedUserId, type, url, prompt, enhancedPrompt, model, modelReason, contextType, aspectRatio, saved } = parsed.data;
    const __auth = await bindSessionUser(request, __claimedUserId);
    if (!__auth.ok) return __auth.response;
    const userId = __auth.userId;

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

    const timestamp = new Date().toISOString();
    const newGeneration = await db.insert(mediaGenerations)
      .values({
        userId,
        type,
        url,
        prompt,
        enhancedPrompt: enhancedPrompt ?? null,
        model: model ?? null,
        modelReason: modelReason ?? null,
        contextType: contextType ?? null,
        aspectRatio: aspectRatio ?? null,
        edited: false,
        editParameters: null,
        saved: saved ?? false,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .returning();

    return NextResponse.json(newGeneration[0], { status: 201 });
  } catch (error) {
    const ref = log.error('POST /api/studio/generations failed', error);
    return NextResponse.json({ error: 'Internal server error', ref }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    if (!validateBearerToken(token)) {
      return NextResponse.json(
        { error: 'Invalid authentication token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const __auth = await bindSessionUser(request, searchParams.get('userId'));
    if (!__auth.ok) return __auth.response;
    const userId = __auth.userId;

    const parsedQuery = parseValue(
      { limit: searchParams.get('limit') ?? undefined, type: searchParams.get('type') ?? undefined },
      listQuerySchema
    );
    if (!parsedQuery.ok) return parsedQuery.response;
    const { limit, type } = parsedQuery.data;

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

    const whereConditions = type
      ? and(eq(mediaGenerations.userId, userId), eq(mediaGenerations.type, type))
      : eq(mediaGenerations.userId, userId);

    const generations = await db.select()
      .from(mediaGenerations)
      .where(whereConditions)
      .orderBy(desc(mediaGenerations.createdAt))
      .limit(limit);

    return NextResponse.json(generations, { status: 200 });
  } catch (error) {
    const ref = log.error('GET /api/studio/generations failed', error);
    return NextResponse.json({ error: 'Internal server error', ref }, { status: 500 });
  }
}
