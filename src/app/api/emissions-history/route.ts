import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { emissionsHistory } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { readJson, parseValue } from "@/lib/validate";
import { logger } from "@/lib/log";

const log = logger("emissions-history");

const VALID_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

const getQuerySchema = z.object({
  id: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});

const idQuerySchema = z.object({
  id: z.string().regex(/^\d+$/),
});

const postSchema = z.object({
  month: z.enum(VALID_MONTHS),
  value: z.number().finite().gt(0).max(1_000_000_000),
  emissions: z.number().finite().gt(0).max(1_000_000_000),
});

const putSchema = z.object({
  month: z.enum(VALID_MONTHS).optional(),
  value: z.number().finite().gt(0).max(1_000_000_000).optional(),
  emissions: z.number().finite().gt(0).max(1_000_000_000).optional(),
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = parseValue(
    { id: searchParams.get('id') ?? undefined, limit: searchParams.get('limit') ?? undefined },
    getQuerySchema,
  );
  if (!q.ok) return q.response;
  const { id, limit } = q.data;

  try {
    if (id) {
      const record = await db.select()
        .from(emissionsHistory)
        .where(eq(emissionsHistory.id, parseInt(id, 10)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json({ error: 'Record not found', code: "NOT_FOUND" }, { status: 404 });
      }

      return NextResponse.json(record[0], { status: 200 });
    }

    let query = db.select()
      .from(emissionsHistory)
      .orderBy(desc(emissionsHistory.createdAt));

    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (limitNum > 0) {
        query = query.limit(limitNum) as any;
      }
    }

    const results = await query;
    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    const ref = log.error('GET error', error);
    return NextResponse.json({ error: 'Internal server error', ref }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const parsed = await readJson(request, postSchema);
  if (!parsed.ok) return parsed.response;
  const { month, value, emissions } = parsed.data;

  try {
    const newRecord = await db.insert(emissionsHistory)
      .values({
        month,
        value,
        emissions,
        createdAt: new Date()
      })
      .returning();

    return NextResponse.json(newRecord[0], { status: 201 });

  } catch (error) {
    const ref = log.error('POST error', error);
    return NextResponse.json({ error: 'Internal server error', ref }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = parseValue({ id: searchParams.get('id') ?? undefined }, idQuerySchema);
  if (!q.ok) return q.response;
  const id = q.data.id;

  try {
    const existing = await db.select()
      .from(emissionsHistory)
      .where(eq(emissionsHistory.id, parseInt(id, 10)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Record not found', code: "NOT_FOUND" }, { status: 404 });
    }

    const parsed = await readJson(request, putSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    const updates: Record<string, unknown> = {};

    if (body.month !== undefined) updates.month = body.month;
    if (body.value !== undefined) updates.value = body.value;
    if (body.emissions !== undefined) updates.emissions = body.emissions;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update", code: "NO_UPDATES" }, { status: 400 });
    }

    const updated = await db.update(emissionsHistory)
      .set(updates)
      .where(eq(emissionsHistory.id, parseInt(id, 10)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });

  } catch (error) {
    const ref = log.error('PUT error', error);
    return NextResponse.json({ error: 'Internal server error', ref }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = parseValue({ id: searchParams.get('id') ?? undefined }, idQuerySchema);
  if (!q.ok) return q.response;
  const id = q.data.id;

  try {
    const existing = await db.select()
      .from(emissionsHistory)
      .where(eq(emissionsHistory.id, parseInt(id, 10)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Record not found', code: "NOT_FOUND" }, { status: 404 });
    }

    const deleted = await db.delete(emissionsHistory)
      .where(eq(emissionsHistory.id, parseInt(id, 10)))
      .returning();

    return NextResponse.json({
      message: 'Record deleted successfully',
      record: deleted[0]
    }, { status: 200 });

  } catch (error) {
    const ref = log.error('DELETE error', error);
    return NextResponse.json({ error: 'Internal server error', ref }, { status: 500 });
  }
}
