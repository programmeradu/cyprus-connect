import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { greenActions } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { readJson, parseValue } from '@/lib/validate';
import { logger } from '@/lib/log';

const log = logger("api.green-actions");

const idSchema = z.coerce.number().int().positive();

const postSchema = z.object({
  title: z.string().trim().min(1).max(200),
  impact: z.string().trim().min(1).max(500),
  credits: z.coerce.number().int().positive().max(1_000_000),
  orderIndex: z.coerce.number().int(),
});

const putSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  impact: z.string().trim().min(1).max(500).optional(),
  credits: z.coerce.number().int().positive().max(1_000_000).optional(),
  orderIndex: z.coerce.number().int().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const parsedId = parseValue(id, idSchema);
      if (!parsedId.ok) return parsedId.response;

      const action = await db
        .select()
        .from(greenActions)
        .where(eq(greenActions.id, parsedId.data))
        .limit(1);

      if (action.length === 0) {
        return NextResponse.json({ error: 'Green action not found', code: 'NOT_FOUND' }, { status: 404 });
      }

      return NextResponse.json(action[0], { status: 200 });
    }

    const actionsList = await db
      .select()
      .from(greenActions)
      .orderBy(asc(greenActions.orderIndex));

    return NextResponse.json(actionsList, { status: 200 });
  } catch (error) {
    const ref = log.error('GET /api/green-actions failed', error);
    return NextResponse.json({ error: 'Internal server error', ref }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = await readJson(request, postSchema);
    if (!parsed.ok) return parsed.response;
    const { title, impact, credits, orderIndex } = parsed.data;

    const newAction = await db
      .insert(greenActions)
      .values({
        title: title.trim(),
        impact: impact.trim(),
        credits,
        orderIndex,
      })
      .returning();

    return NextResponse.json(newAction[0], { status: 201 });
  } catch (error) {
    const ref = log.error('POST /api/green-actions failed', error);
    return NextResponse.json({ error: 'Internal server error', ref }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsedId = parseValue(searchParams.get('id'), idSchema);
    if (!parsedId.ok) return parsedId.response;
    const id = parsedId.data;

    const parsed = await readJson(request, putSchema);
    if (!parsed.ok) return parsed.response;
    const { title, impact, credits, orderIndex } = parsed.data;

    const existingAction = await db
      .select()
      .from(greenActions)
      .where(eq(greenActions.id, id))
      .limit(1);

    if (existingAction.length === 0) {
      return NextResponse.json({ error: 'Green action not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const updates: any = {};

    if (title !== undefined) updates.title = title.trim();
    if (impact !== undefined) updates.impact = impact.trim();
    if (credits !== undefined) updates.credits = credits;
    if (orderIndex !== undefined) updates.orderIndex = orderIndex;

    const updatedAction = await db
      .update(greenActions)
      .set(updates)
      .where(eq(greenActions.id, id))
      .returning();

    return NextResponse.json(updatedAction[0], { status: 200 });
  } catch (error) {
    const ref = log.error('PUT /api/green-actions failed', error);
    return NextResponse.json({ error: 'Internal server error', ref }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsedId = parseValue(searchParams.get('id'), idSchema);
    if (!parsedId.ok) return parsedId.response;
    const id = parsedId.data;

    const existingAction = await db
      .select()
      .from(greenActions)
      .where(eq(greenActions.id, id))
      .limit(1);

    if (existingAction.length === 0) {
      return NextResponse.json({ error: 'Green action not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const deleted = await db
      .delete(greenActions)
      .where(eq(greenActions.id, id))
      .returning();

    return NextResponse.json(
      { message: 'Green action deleted successfully', deletedAction: deleted[0] },
      { status: 200 }
    );
  } catch (error) {
    const ref = log.error('DELETE /api/green-actions failed', error);
    return NextResponse.json({ error: 'Internal server error', ref }, { status: 500 });
  }
}
