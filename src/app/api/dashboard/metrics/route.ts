import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { dashboardMetrics, historicalEmissions, sustainabilityGoalsProgress, emissions, user } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { bindSessionUser } from "@/lib/api-auth";
import { readJson } from '@/lib/validate';
import { logger } from '@/lib/log';

const log = logger('dashboard.metrics');

const METRIC_TYPES = ['carbon_footprint', 'resource_efficiency', 'renewable_share', 'waste_diversion'] as const;

const postSchema = z.object({
  userId: z.string().trim().min(1).max(128).optional(),
  metricType: z.enum(METRIC_TYPES),
  currentValue: z.number().finite().min(-1_000_000).max(1_000_000),
  previousValue: z.number().finite().min(-1_000_000).max(1_000_000),
  periodStart: z.string().trim().min(1).max(64),
  periodEnd: z.string().trim().min(1).max(64),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const __auth = await bindSessionUser(request, searchParams.get('userId'));
    if (!__auth.ok) return __auth.response;
    const userId = __auth.userId;

    const userExists = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      }, { status: 404 });
    }

    const metricsData = await db.select()
      .from(dashboardMetrics)
      .where(eq(dashboardMetrics.userId, userId))
      .orderBy(desc(dashboardMetrics.updatedAt));

    const latestMetricsByType = new Map();
    for (const metric of metricsData) {
      if (!latestMetricsByType.has(metric.metricType)) {
        latestMetricsByType.set(metric.metricType, metric);
      }
    }
    const latestMetrics = Array.from(latestMetricsByType.values());

    const latestEmissionsData = await db.select()
      .from(emissions)
      .where(eq(emissions.userId, userId))
      .orderBy(desc(emissions.createdAt))
      .limit(1);

    const latestEmission = latestEmissionsData.length > 0 ? latestEmissionsData[0] : null;

    const historicalData = await db.select()
      .from(historicalEmissions)
      .where(eq(historicalEmissions.userId, userId))
      .orderBy(desc(historicalEmissions.year), desc(historicalEmissions.month))
      .limit(6);

    const goalsData = await db.select()
      .from(sustainabilityGoalsProgress)
      .where(eq(sustainabilityGoalsProgress.userId, userId));

    let calculatedMetrics: any[] = [];

    if (latestMetrics.length === 0 && latestEmission) {
      calculatedMetrics.push({
        metricType: 'carbon_footprint',
        currentValue: parseFloat(latestEmission.totalCo2e.toFixed(2)),
        previousValue: 0,
        trendPercentage: 0,
        periodStart: latestEmission.createdAt,
        periodEnd: latestEmission.createdAt,
        updatedAt: new Date().toISOString()
      });

      const totalResources = latestEmission.electricity + latestEmission.gas +
                            latestEmission.water + latestEmission.waste +
                            latestEmission.transport;
      const resourceEfficiency = parseFloat((100 - (totalResources / 100)).toFixed(2));

      calculatedMetrics.push({
        metricType: 'resource_efficiency',
        currentValue: resourceEfficiency,
        previousValue: 0,
        trendPercentage: 0,
        periodStart: latestEmission.createdAt,
        periodEnd: latestEmission.createdAt,
        updatedAt: new Date().toISOString()
      });

      if (historicalData.length > 0) {
        const last3Months = historicalData.slice(0, 3);
        const avgRenewable = last3Months.reduce((sum, record) =>
          sum + record.renewablePercentage, 0) / last3Months.length;

        calculatedMetrics.push({
          metricType: 'renewable_share',
          currentValue: parseFloat(avgRenewable.toFixed(2)),
          previousValue: 0,
          trendPercentage: 0,
          periodStart: historicalData[historicalData.length - 1]?.createdAt || latestEmission.createdAt,
          periodEnd: historicalData[0]?.createdAt || latestEmission.createdAt,
          updatedAt: new Date().toISOString()
        });

        const avgWasteDiversion = last3Months.reduce((sum, record) =>
          sum + record.wasteDiversionRate, 0) / last3Months.length;

        calculatedMetrics.push({
          metricType: 'waste_diversion',
          currentValue: parseFloat(avgWasteDiversion.toFixed(2)),
          previousValue: 0,
          trendPercentage: 0,
          periodStart: historicalData[historicalData.length - 1]?.createdAt || latestEmission.createdAt,
          periodEnd: historicalData[0]?.createdAt || latestEmission.createdAt,
          updatedAt: new Date().toISOString()
        });
      }
    }

    const formattedMetrics = latestMetrics.map(metric => ({
      metricType: metric.metricType,
      currentValue: parseFloat(metric.currentValue.toFixed(2)),
      previousValue: parseFloat(metric.previousValue.toFixed(2)),
      trendPercentage: parseFloat(metric.trendPercentage.toFixed(2)),
      periodStart: metric.periodStart,
      periodEnd: metric.periodEnd,
      updatedAt: metric.updatedAt
    }));

    const formattedHistorical = historicalData.map(record => ({
      year: record.year,
      month: record.month,
      totalCo2e: parseFloat(record.totalCo2e.toFixed(2)),
      electricityKwh: parseFloat(record.electricityKwh.toFixed(2)),
      renewablePercentage: parseFloat(record.renewablePercentage.toFixed(2)),
      efficiencyScore: parseFloat(record.efficiencyScore.toFixed(2))
    }));

    const formattedGoals = goalsData.map(goal => ({
      goalType: goal.goalType,
      targetValue: parseFloat(goal.targetValue.toFixed(2)),
      currentValue: parseFloat(goal.currentValue.toFixed(2)),
      targetYear: goal.targetYear,
      progressPercentage: parseFloat(goal.progressPercentage.toFixed(2))
    }));

    const formattedLatestEmissions = latestEmission ? {
      electricity: parseFloat(latestEmission.electricity.toFixed(2)),
      gas: parseFloat(latestEmission.gas.toFixed(2)),
      water: parseFloat(latestEmission.water.toFixed(2)),
      waste: parseFloat(latestEmission.waste.toFixed(2)),
      transport: parseFloat(latestEmission.transport.toFixed(2)),
      totalCo2e: parseFloat(latestEmission.totalCo2e.toFixed(2)),
      periodMonth: latestEmission.periodMonth,
      periodYear: latestEmission.periodYear
    } : null;

    return NextResponse.json({
      success: true,
      metrics: formattedMetrics.length > 0 ? formattedMetrics : calculatedMetrics,
      historical_trends: formattedHistorical,
      goals_progress: formattedGoals,
      latest_emissions: formattedLatestEmissions
    }, { status: 200 });

  } catch (error) {
    const ref = log.error('GET dashboard metrics error', error);
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
    const { userId: __claimedUserId, metricType, currentValue, previousValue, periodStart, periodEnd } = bodyResult.data;
    const __auth = await bindSessionUser(request, __claimedUserId);
    if (!__auth.ok) return __auth.response;
    const userId = __auth.userId;

    const userExists = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      }, { status: 404 });
    }

    const trendPercentage = previousValue !== 0
      ? parseFloat((((currentValue - previousValue) / previousValue) * 100).toFixed(2))
      : 0;

    const now = new Date().toISOString();

    const existingMetric = await db.select()
      .from(dashboardMetrics)
      .where(
        and(
          eq(dashboardMetrics.userId, userId),
          eq(dashboardMetrics.metricType, metricType),
          eq(dashboardMetrics.periodEnd, periodEnd)
        )
      )
      .limit(1);

    let result;

    if (existingMetric.length > 0) {
      const updated = await db.update(dashboardMetrics)
        .set({
          currentValue: parseFloat(currentValue.toFixed(2)),
          previousValue: parseFloat(previousValue.toFixed(2)),
          trendPercentage: trendPercentage,
          periodStart: periodStart,
          updatedAt: now
        })
        .where(eq(dashboardMetrics.id, existingMetric[0].id))
        .returning();

      result = updated[0];
    } else {
      const inserted = await db.insert(dashboardMetrics)
        .values({
          userId: userId,
          metricType: metricType,
          currentValue: parseFloat(currentValue.toFixed(2)),
          previousValue: parseFloat(previousValue.toFixed(2)),
          trendPercentage: trendPercentage,
          periodStart: periodStart,
          periodEnd: periodEnd,
          createdAt: now,
          updatedAt: now
        })
        .returning();

      result = inserted[0];
    }

    return NextResponse.json({
      success: true,
      metric: {
        id: result.id,
        userId: result.userId,
        metricType: result.metricType,
        currentValue: parseFloat(result.currentValue.toFixed(2)),
        previousValue: parseFloat(result.previousValue.toFixed(2)),
        trendPercentage: parseFloat(result.trendPercentage.toFixed(2)),
        periodStart: result.periodStart,
        periodEnd: result.periodEnd,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      }
    }, { status: 201 });

  } catch (error) {
    const ref = log.error('POST dashboard metrics error', error);
    return NextResponse.json({
      error: 'Something went wrong. Please try again.',
      ref
    }, { status: 500 });
  }
}
