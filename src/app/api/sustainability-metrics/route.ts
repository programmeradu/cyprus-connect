import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sustainabilityMetrics } from '@/db/schema';
import { eq } from 'drizzle-orm';

const VALID_METRIC_TYPES = ['carbon', 'energy', 'waste', 'water'] as const;
const VALID_TRENDS = ['up', 'down'] as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { 
            error: 'Valid ID is required',
            code: 'INVALID_ID' 
          },
          { status: 400 }
        );
      }

      const metric = await db.select()
        .from(sustainabilityMetrics)
        .where(eq(sustainabilityMetrics.id, parseInt(id)))
        .limit(1);

      if (metric.length === 0) {
        return NextResponse.json(
          { 
            error: 'Metric not found',
            code: 'METRIC_NOT_FOUND' 
          },
          { status: 404 }
        );
      }

      return NextResponse.json(metric[0], { status: 200 });
    }

    const metrics = await db.select().from(sustainabilityMetrics);
    return NextResponse.json(metrics, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metricType, value, unit, trend, trendValue, color } = body;

    if (!metricType) {
      return NextResponse.json(
        { 
          error: 'metricType is required',
          code: 'MISSING_METRIC_TYPE' 
        },
        { status: 400 }
      );
    }

    if (!VALID_METRIC_TYPES.includes(metricType)) {
      return NextResponse.json(
        { 
          error: `metricType must be one of: ${VALID_METRIC_TYPES.join(', ')}`,
          code: 'INVALID_METRIC_TYPE' 
        },
        { status: 400 }
      );
    }

    if (value === undefined || value === null) {
      return NextResponse.json(
        { 
          error: 'value is required',
          code: 'MISSING_VALUE' 
        },
        { status: 400 }
      );
    }

    if (typeof value !== 'number') {
      return NextResponse.json(
        { 
          error: 'value must be a number',
          code: 'INVALID_VALUE_TYPE' 
        },
        { status: 400 }
      );
    }

    if (!unit) {
      return NextResponse.json(
        { 
          error: 'unit is required',
          code: 'MISSING_UNIT' 
        },
        { status: 400 }
      );
    }

    if (!trend) {
      return NextResponse.json(
        { 
          error: 'trend is required',
          code: 'MISSING_TREND' 
        },
        { status: 400 }
      );
    }

    if (!VALID_TRENDS.includes(trend)) {
      return NextResponse.json(
        { 
          error: `trend must be one of: ${VALID_TRENDS.join(', ')}`,
          code: 'INVALID_TREND' 
        },
        { status: 400 }
      );
    }

    if (trendValue === undefined || trendValue === null) {
      return NextResponse.json(
        { 
          error: 'trendValue is required',
          code: 'MISSING_TREND_VALUE' 
        },
        { status: 400 }
      );
    }

    if (typeof trendValue !== 'number') {
      return NextResponse.json(
        { 
          error: 'trendValue must be a number',
          code: 'INVALID_TREND_VALUE_TYPE' 
        },
        { status: 400 }
      );
    }

    if (!color) {
      return NextResponse.json(
        { 
          error: 'color is required',
          code: 'MISSING_COLOR' 
        },
        { status: 400 }
      );
    }

    const newMetric = await db.insert(sustainabilityMetrics)
      .values({
        metricType: metricType.trim(),
        value,
        unit: unit.trim(),
        trend: trend.trim(),
        trendValue,
        color: color.trim(),
        updatedAt: new Date()
      })
      .returning();

    return NextResponse.json(newMetric[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        },
        { status: 400 }
      );
    }

    const existing = await db.select()
      .from(sustainabilityMetrics)
      .where(eq(sustainabilityMetrics.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { 
          error: 'Metric not found',
          code: 'METRIC_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { metricType, value, unit, trend, trendValue, color } = body;

    if (metricType !== undefined && !VALID_METRIC_TYPES.includes(metricType)) {
      return NextResponse.json(
        { 
          error: `metricType must be one of: ${VALID_METRIC_TYPES.join(', ')}`,
          code: 'INVALID_METRIC_TYPE' 
        },
        { status: 400 }
      );
    }

    if (value !== undefined && typeof value !== 'number') {
      return NextResponse.json(
        { 
          error: 'value must be a number',
          code: 'INVALID_VALUE_TYPE' 
        },
        { status: 400 }
      );
    }

    if (trend !== undefined && !VALID_TRENDS.includes(trend)) {
      return NextResponse.json(
        { 
          error: `trend must be one of: ${VALID_TRENDS.join(', ')}`,
          code: 'INVALID_TREND' 
        },
        { status: 400 }
      );
    }

    if (trendValue !== undefined && typeof trendValue !== 'number') {
      return NextResponse.json(
        { 
          error: 'trendValue must be a number',
          code: 'INVALID_TREND_VALUE_TYPE' 
        },
        { status: 400 }
      );
    }

    const updates: any = {
      updatedAt: new Date()
    };

    if (metricType !== undefined) updates.metricType = metricType.trim();
    if (value !== undefined) updates.value = value;
    if (unit !== undefined) updates.unit = unit.trim();
    if (trend !== undefined) updates.trend = trend.trim();
    if (trendValue !== undefined) updates.trendValue = trendValue;
    if (color !== undefined) updates.color = color.trim();

    const updated = await db.update(sustainabilityMetrics)
      .set(updates)
      .where(eq(sustainabilityMetrics.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        },
        { status: 400 }
      );
    }

    const existing = await db.select()
      .from(sustainabilityMetrics)
      .where(eq(sustainabilityMetrics.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { 
          error: 'Metric not found',
          code: 'METRIC_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    const deleted = await db.delete(sustainabilityMetrics)
      .where(eq(sustainabilityMetrics.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      { 
        message: 'Metric deleted successfully',
        metric: deleted[0]
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}