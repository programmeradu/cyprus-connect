import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { dashboardMetrics, historicalEmissions, sustainabilityGoalsProgress, emissions, user } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    // Validate userId parameter
    if (!userId || userId.trim() === '') {
      return NextResponse.json({ 
        error: 'userId is required and must be a non-empty string',
        code: 'MISSING_USER_ID' 
      }, { status: 400 });
    }

    // Validate user exists
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

    // Fetch LATEST dashboard metrics for each metric type (ordered by updatedAt DESC)
    const metricsData = await db.select()
      .from(dashboardMetrics)
      .where(eq(dashboardMetrics.userId, userId))
      .orderBy(desc(dashboardMetrics.updatedAt));

    // Get the latest metric for each type
    const latestMetricsByType = new Map();
    for (const metric of metricsData) {
      if (!latestMetricsByType.has(metric.metricType)) {
        latestMetricsByType.set(metric.metricType, metric);
      }
    }
    const latestMetrics = Array.from(latestMetricsByType.values());

    // Fetch latest emissions
    const latestEmissionsData = await db.select()
      .from(emissions)
      .where(eq(emissions.userId, userId))
      .orderBy(desc(emissions.createdAt))
      .limit(1);

    const latestEmission = latestEmissionsData.length > 0 ? latestEmissionsData[0] : null;

    // Fetch last 6 months of historical emissions
    const historicalData = await db.select()
      .from(historicalEmissions)
      .where(eq(historicalEmissions.userId, userId))
      .orderBy(desc(historicalEmissions.year), desc(historicalEmissions.month))
      .limit(6);

    // Fetch all sustainability goals progress
    const goalsData = await db.select()
      .from(sustainabilityGoalsProgress)
      .where(eq(sustainabilityGoalsProgress.userId, userId));

    // Calculate additional metrics if no dashboard metrics exist
    let calculatedMetrics = [];
    
    if (latestMetrics.length === 0 && latestEmission) {
      // Carbon footprint from latest emission
      calculatedMetrics.push({
        metricType: 'carbon_footprint',
        currentValue: parseFloat(latestEmission.totalCo2e.toFixed(2)),
        previousValue: 0,
        trendPercentage: 0,
        periodStart: latestEmission.createdAt,
        periodEnd: latestEmission.createdAt,
        updatedAt: new Date().toISOString()
      });

      // Resource efficiency calculation
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

      // Calculate renewable share from last 3 months
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

        // Calculate waste diversion from last 3 months
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

    // Format metrics data
    const formattedMetrics = latestMetrics.map(metric => ({
      metricType: metric.metricType,
      currentValue: parseFloat(metric.currentValue.toFixed(2)),
      previousValue: parseFloat(metric.previousValue.toFixed(2)),
      trendPercentage: parseFloat(metric.trendPercentage.toFixed(2)),
      periodStart: metric.periodStart,
      periodEnd: metric.periodEnd,
      updatedAt: metric.updatedAt
    }));

    // Format historical trends
    const formattedHistorical = historicalData.map(record => ({
      year: record.year,
      month: record.month,
      totalCo2e: parseFloat(record.totalCo2e.toFixed(2)),
      electricityKwh: parseFloat(record.electricityKwh.toFixed(2)),
      renewablePercentage: parseFloat(record.renewablePercentage.toFixed(2)),
      efficiencyScore: parseFloat(record.efficiencyScore.toFixed(2))
    }));

    // Format goals progress
    const formattedGoals = goalsData.map(goal => ({
      goalType: goal.goalType,
      targetValue: parseFloat(goal.targetValue.toFixed(2)),
      currentValue: parseFloat(goal.currentValue.toFixed(2)),
      targetYear: goal.targetYear,
      progressPercentage: parseFloat(goal.progressPercentage.toFixed(2))
    }));

    // Format latest emissions
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
    console.error('GET dashboard metrics error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, metricType, currentValue, previousValue, periodStart, periodEnd } = body;

    // Validate required fields
    if (!userId || userId.trim() === '') {
      return NextResponse.json({ 
        error: 'userId is required and must be a non-empty string',
        code: 'MISSING_USER_ID' 
      }, { status: 400 });
    }

    if (!metricType || metricType.trim() === '') {
      return NextResponse.json({ 
        error: 'metricType is required',
        code: 'MISSING_METRIC_TYPE' 
      }, { status: 400 });
    }

    if (currentValue === undefined || currentValue === null) {
      return NextResponse.json({ 
        error: 'currentValue is required',
        code: 'MISSING_CURRENT_VALUE' 
      }, { status: 400 });
    }

    if (previousValue === undefined || previousValue === null) {
      return NextResponse.json({ 
        error: 'previousValue is required',
        code: 'MISSING_PREVIOUS_VALUE' 
      }, { status: 400 });
    }

    if (!periodStart || periodStart.trim() === '') {
      return NextResponse.json({ 
        error: 'periodStart is required',
        code: 'MISSING_PERIOD_START' 
      }, { status: 400 });
    }

    if (!periodEnd || periodEnd.trim() === '') {
      return NextResponse.json({ 
        error: 'periodEnd is required',
        code: 'MISSING_PERIOD_END' 
      }, { status: 400 });
    }

    // Validate metricType
    const validMetricTypes = ['carbon_footprint', 'resource_efficiency', 'renewable_share', 'waste_diversion'];
    if (!validMetricTypes.includes(metricType)) {
      return NextResponse.json({ 
        error: `metricType must be one of: ${validMetricTypes.join(', ')}`,
        code: 'INVALID_METRIC_TYPE' 
      }, { status: 400 });
    }

    // Validate data types
    if (typeof currentValue !== 'number' || isNaN(currentValue)) {
      return NextResponse.json({ 
        error: 'currentValue must be a valid number',
        code: 'INVALID_CURRENT_VALUE' 
      }, { status: 400 });
    }

    if (typeof previousValue !== 'number' || isNaN(previousValue)) {
      return NextResponse.json({ 
        error: 'previousValue must be a valid number',
        code: 'INVALID_PREVIOUS_VALUE' 
      }, { status: 400 });
    }

    // Validate user exists
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

    // Calculate trend percentage
    const trendPercentage = previousValue !== 0 
      ? parseFloat((((currentValue - previousValue) / previousValue) * 100).toFixed(2))
      : 0;

    const now = new Date().toISOString();

    // Check if metric already exists for userId + metricType + periodEnd
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
      // Update existing metric
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
      // Insert new metric
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
    console.error('POST dashboard metrics error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}