import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { sustainabilityMetrics } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { readJson, parseValue } from '@/lib/validate';
import { logger } from '@/lib/log';

const log = logger("api.sustainability-metrics");

const VALID_METRIC_TYPES = ['carbon', 'energy', 'waste', 'water'] as const;
const VALID_TRENDS = ['up', 'down'] as const;

const idSchema = z.coerce.number().int().positive();

const postSchema = z.object({
  metricType: z.enum(VALID_METRIC_TYPES),
  value: z.number().finite().min(-1_000_000_000).max(1_000_000_000),
  unit: z.string().trim().min(1).max(64),
  trend: z.enum(VALID_TRENDS),
  trendValue: z.number().finite().min(-1_000_000_000).max(1_000_000_000),
  color: z.string().trim().min(1).max(64),
});

const putSchema = z.object({
  metricType: z.enum(VALID_METRIC_TYPES).optional(),
  value: z.number().finite().min(-1_000_000_000).max(1_000_000_000).optional(),
  unit: z.string().trim().min(1).max(64).optional(),
  trend: z.enum(VALID_TRENDS).optional(),
  trendValue: z.number().finite().min(-1_000_000_000).max(1_000_000_000).optional(),
  color: z.string().trim().min(1).max(64).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const parsedId = parseValue(id, idSchema);
      if (!parsedId.ok) return parsedId.response;

      const metric = await db.select()
        .from(sustainabilityMetrics)
        .where(eq(sustainabilityMetrics.id, parsedId.data))
        .limit(1);

      if (metric.length === 0) {
        return NextResponse.json(
          { error: 'Metric not found', code: 'METRIC_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(metric[0], { status: 200 });
    }

    const metrics = await db.select().from(sustainabilityMetrics);
    return NextResponse.json(metrics, { status: 200 });

  } catch (error) {
    const ref = log.error('GET /api/sustainability-metrics failed', error);
    return NextResponse.json({ error: 'Internal server error', ref }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = await readJson(request, postSchema);
    if (!parsed.ok) return parsed.response;
    const { metricType, value, unit, trend, trendValue, color } = parsed.data;

    const newMetric = await db.insert(sustainabilityMetrics)
      .values({
        metricType,
        value,
        unit,
        trend,
        trendValue,
        color,
        updatedAt: new Date()
      })
      .returning();

    return NextResponse.json(newMetric[0], { status: 201 });

  } catch (error) {
    const ref = log.error('POST /api/sustainability-metrics failed', error);
    return NextResponse.json({ error: 'Internal server error', ref }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsedId = parseValue(searchParams.get('id'), idSchema);
    if (!parsedId.ok) return parsedId.response;
    const id = parsedId.data;

    const existing = await db.select()
      .from(sustainabilityMetrics)
      .where(eq(sustainabilityMetrics.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Metric not found', code: 'METRIC_NOT_FOUND' },
        { status: 404 }
      );
    }

    const parsed = await readJson(request, putSchema);
    if (!parsed.ok) return parsed.response;
    const { metricType, value, unit, trend, trendValue, color } = parsed.data;

    const updates: any = {
      updatedAt: new Date()
    };

    if (metricType !== undefined) updates.metricType = metricType;
    if (value !== undefined) updates.value = value;
    if (unit !== undefined) updates.unit = unit;
    if (trend !== undefined) updates.trend = trend;
    if (trendValue !== undefined) updates.trendValue = trendValue;
    if (color !== undefined) updates.color = color;

    const updated = await db.update(sustainabilityMetrics)
      .set(updates)
      .where(eq(sustainabilityMetrics.id, id))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });

  } catch (error) {
    const ref = log.error('PUT /api/sustainability-metrics failed', error);
    return NextResponse.json({ error: 'Internal server error', ref }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsedId = parseValue(searchParams.get('id'), idSchema);
    if (!parsedId.ok) return parsedId.response;
    const id = parsedId.data;

    const existing = await db.select()
      .from(sustainabilityMetrics)
      .where(eq(sustainabilityMetrics.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Metric not found', code: 'METRIC_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db.delete(sustainabilityMetrics)
      .where(eq(sustainabilityMetrics.id, id))
      .returning();

    return NextResponse.json(
      {
        message: 'Metric deleted successfully',
        metric: deleted[0]
      },
      { status: 200 }
    );

  } catch (error) {
    const ref = log.error('DELETE /api/sustainability-metrics failed', error);
    return NextResponse.json({ error: 'Internal server error', ref }, { status: 500 });
  }
}
