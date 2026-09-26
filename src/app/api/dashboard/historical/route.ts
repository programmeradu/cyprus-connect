import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { historicalEmissions, user } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { bindSessionUser } from "@/lib/api-auth";
import { readJson, parseValue } from '@/lib/validate';
import { logger } from '@/lib/log';

const log = logger('dashboard.historical');

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatMonthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

function calculateTrend(current: number, previous: number | null): "up" | "down" | "stable" | null {
  if (previous === null || previous === 0) return null;
  const changePercentage = ((current - previous) / previous) * 100;
  if (changePercentage > 2) return "up";
  if (changePercentage < -2) return "down";
  return "stable";
}

function calculateChangePercentage(current: number, previous: number | null): number | null {
  if (previous === null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

const monthsSchema = z.coerce.number().int().min(1).max(24);

const postSchema = z.object({
  userId: z.string().trim().min(1).max(128).optional(),
  year: z.number().int().min(2020).max(2050),
  month: z.number().int().min(1).max(12),
  electricityKwh: z.number().finite().min(0).max(10_000_000),
  gasM3: z.number().finite().min(0).max(10_000_000),
  waterLiters: z.number().finite().min(0).max(1_000_000_000),
  wasteKg: z.number().finite().min(0).max(10_000_000),
  transportKm: z.number().finite().min(0).max(10_000_000),
  totalCo2e: z.number().finite().min(0).max(10_000_000),
  renewablePercentage: z.number().finite().min(0).max(100),
  efficiencyScore: z.number().finite().min(0).max(100),
  wasteDiversionRate: z.number().finite().min(0).max(100),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const __auth = await bindSessionUser(request, searchParams.get('userId'));
    if (!__auth.ok) return __auth.response;
    const userId = __auth.userId;

    const monthsResult = parseValue(searchParams.get('months') ?? '6', monthsSchema);
    if (!monthsResult.ok) return monthsResult.response;
    const months = monthsResult.data;

    const userRecord = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({
        error: 'User not found',
        code: "USER_NOT_FOUND"
      }, { status: 404 });
    }

    const records = await db.select()
      .from(historicalEmissions)
      .where(eq(historicalEmissions.userId, userId))
      .orderBy(desc(historicalEmissions.year), desc(historicalEmissions.month))
      .limit(months);

    if (records.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        summary: {
          totalMonths: 0,
          averageCo2e: 0,
          totalCo2e: 0,
          averageRenewablePercentage: 0,
          averageEfficiencyScore: 0
        }
      }, { status: 200 });
    }

    const dataWithTrends = records.map((record, index) => {
      const previousRecord = index < records.length - 1 ? records[index + 1] : null;
      const previousMonthCo2e = previousRecord ? previousRecord.totalCo2e : null;
      const changePercentage = calculateChangePercentage(record.totalCo2e, previousMonthCo2e);
      const trend = calculateTrend(record.totalCo2e, previousMonthCo2e);

      return {
        id: record.id,
        year: record.year,
        month: record.month,
        electricityKwh: record.electricityKwh,
        gasM3: record.gasM3,
        waterLiters: record.waterLiters,
        wasteKg: record.wasteKg,
        transportKm: record.transportKm,
        totalCo2e: record.totalCo2e,
        renewablePercentage: record.renewablePercentage,
        efficiencyScore: record.efficiencyScore,
        wasteDiversionRate: record.wasteDiversionRate,
        monthLabel: formatMonthLabel(record.year, record.month),
        previousMonthCo2e,
        changePercentage,
        trend
      };
    });

    const totalCo2e = records.reduce((sum, r) => sum + r.totalCo2e, 0);
    const averageCo2e = totalCo2e / records.length;
    const averageRenewablePercentage = records.reduce((sum, r) => sum + r.renewablePercentage, 0) / records.length;
    const averageEfficiencyScore = records.reduce((sum, r) => sum + r.efficiencyScore, 0) / records.length;

    return NextResponse.json({
      success: true,
      data: dataWithTrends,
      summary: {
        totalMonths: records.length,
        averageCo2e,
        totalCo2e,
        averageRenewablePercentage,
        averageEfficiencyScore
      }
    }, { status: 200 });

  } catch (error) {
    const ref = log.error('GET dashboard historical error', error);
    return NextResponse.json({
      error: 'Something went wrong. Please try again.',
      ref
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const bodyResult = await readJson(request, postSchema);
    if (!bodyResult.ok) return bodyResult.response;
    const {
      userId: __claimedUserId,
      year,
      month,
      electricityKwh,
      gasM3,
      waterLiters,
      wasteKg,
      transportKm,
      totalCo2e,
      renewablePercentage,
      efficiencyScore,
      wasteDiversionRate
    } = bodyResult.data;
    const __auth = await bindSessionUser(request, __claimedUserId);
    if (!__auth.ok) return __auth.response;
    const userId = __auth.userId;

    const userRecord = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({
        error: 'User not found',
        code: "USER_NOT_FOUND"
      }, { status: 404 });
    }

    const existingRecord = await db.select()
      .from(historicalEmissions)
      .where(
        and(
          eq(historicalEmissions.userId, userId),
          eq(historicalEmissions.year, year),
          eq(historicalEmissions.month, month)
        )
      )
      .limit(1);

    const timestamp = new Date().toISOString();

    if (existingRecord.length > 0) {
      const updated = await db.update(historicalEmissions)
        .set({
          electricityKwh,
          gasM3,
          waterLiters,
          wasteKg,
          transportKm,
          totalCo2e,
          renewablePercentage,
          efficiencyScore,
          wasteDiversionRate,
          createdAt: timestamp
        })
        .where(eq(historicalEmissions.id, existingRecord[0].id))
        .returning();

      return NextResponse.json(updated[0], { status: 200 });
    } else {
      const newRecord = await db.insert(historicalEmissions)
        .values({
          userId,
          year,
          month,
          electricityKwh,
          gasM3,
          waterLiters,
          wasteKg,
          transportKm,
          totalCo2e,
          renewablePercentage,
          efficiencyScore,
          wasteDiversionRate,
          createdAt: timestamp
        })
        .returning();

      return NextResponse.json(newRecord[0], { status: 201 });
    }

  } catch (error) {
    const ref = log.error('POST dashboard historical error', error);
    return NextResponse.json({
      error: 'Something went wrong. Please try again.',
      ref
    }, { status: 500 });
  }
}
