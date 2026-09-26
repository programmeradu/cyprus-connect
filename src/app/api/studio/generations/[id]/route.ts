import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { mediaGenerations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { readJson, parseValue } from '@/lib/validate';
import { logger } from '@/lib/log';

const log = logger("api.studio.generations.id");

const idSchema = z.coerce.number().int().positive();

function validateBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

const editParametersSchema = z.string().max(20000).refine((s) => {
  try {
    JSON.parse(s);
    return true;
  } catch {
    return false;
  }
}, { message: 'editParameters must be valid JSON' });

const patchSchema = z.object({
  edited: z.boolean().optional(),
  editParameters: editParametersSchema.nullable().optional(),
  saved: z.boolean().optional(),
});

// GET - Get single generation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = validateBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const parsedId = parseValue(id, idSchema);
    if (!parsedId.ok) return parsedId.response;
    const generationId = parsedId.data;

    const generation = await db.select()
      .from(mediaGenerations)
      .where(eq(mediaGenerations.id, generationId))
      .limit(1);

    if (generation.length === 0) {
      return NextResponse.json(
        { error: 'Generation not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(generation[0], { status: 200 });

  } catch (error) {
    const ref = log.error('GET /api/studio/generations/[id] failed', error);
    return NextResponse.json({ error: 'Internal server error', ref }, { status: 500 });
  }
}

// PATCH - Update generation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = validateBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const parsedId = parseValue(id, idSchema);
    if (!parsedId.ok) return parsedId.response;
    const generationId = parsedId.data;

    const parsed = await readJson(request, patchSchema);
    if (!parsed.ok) return parsed.response;
    const { edited, editParameters, saved } = parsed.data;

    const existing = await db.select()
      .from(mediaGenerations)
      .where(eq(mediaGenerations.id, generationId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Generation not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString()
    };

    if (edited !== undefined) updates.edited = edited;
    if (editParameters !== undefined) updates.editParameters = editParameters;
    if (saved !== undefined) updates.saved = saved;

    const updated = await db.update(mediaGenerations)
      .set(updates)
      .where(eq(mediaGenerations.id, generationId))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });

  } catch (error) {
    const ref = log.error('PATCH /api/studio/generations/[id] failed', error);
    return NextResponse.json({ error: 'Internal server error', ref }, { status: 500 });
  }
}

// DELETE - Delete generation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = validateBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const parsedId = parseValue(id, idSchema);
    if (!parsedId.ok) return parsedId.response;
    const generationId = parsedId.data;

    const existing = await db.select()
      .from(mediaGenerations)
      .where(eq(mediaGenerations.id, generationId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Generation not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db.delete(mediaGenerations)
      .where(eq(mediaGenerations.id, generationId))
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: 'Generation deleted successfully',
        generation: deleted[0]
      },
      { status: 200 }
    );

  } catch (error) {
    const ref = log.error('DELETE /api/studio/generations/[id] failed', error);
    return NextResponse.json({ error: 'Internal server error', ref }, { status: 500 });
  }
}
