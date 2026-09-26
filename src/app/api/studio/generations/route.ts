import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { mediaGenerations } from '@/db/schema';
import { bindSessionUser } from '@/lib/api-auth';
import { parseValue } from '@/lib/validate';
import { logger } from '@/lib/log';

const log = logger("api.studio.generations");

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(60),
});

/**
 * The caller's own images, newest first. New images are made through
 * POST /api/studio/create, which also stores them.
 */
export async function GET(request: NextRequest) {
  const auth = await bindSessionUser(request, request.nextUrl.searchParams.get('userId') ?? undefined);
  if (!auth.ok) return auth.response;

  const q = parseValue({ limit: request.nextUrl.searchParams.get('limit') ?? undefined }, listQuerySchema);
  if (!q.ok) return q.response;

  try {
    const rows = await db
      .select()
      .from(mediaGenerations)
      .where(eq(mediaGenerations.userId, auth.userId))
      .orderBy(desc(mediaGenerations.createdAt))
      .limit(q.data.limit);
    return NextResponse.json(rows);
  } catch (error) {
    const ref = log.error('GET /api/studio/generations failed', error);
    return NextResponse.json({ message: 'Your images could not be read.', ref }, { status: 500 });
  }
}
