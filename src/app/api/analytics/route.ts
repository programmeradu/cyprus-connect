import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { 
  emissions, 
  historicalEmissions, 
  dashboardMetrics,
  industryComparisons,
  user 
} from '@/db/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId || userId.trim() === '') {
      return NextResponse.json({ 
        error: 'userId is required',
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

    const userData = userExists[0];

    // Fetch latest emissions (current period)
    const latestEmissionsData = await db.select()
      .from(emissions)
      .where(eq(emissions.userId, userId))
      .orderBy(desc(emissions.periodYear), desc(emissions.periodMonth))
      .limit(1);

    const currentEmissions = latestEmissionsData[0] || null;

    // Fetch previous period emissions for YoY comparison
    let previousYearEmissions = null;
    if (currentEmissions) {
      const previousYearData = await db.select()
        .from(emissions)
        .where(
          and(
            eq(emissions.userId, userId),
            eq(emissions.periodYear, currentEmissions.periodYear - 1),
            eq(emissions.periodMonth, currentEmissions.periodMonth)
          )
        )
        .limit(1);
      previousYearEmissions = previousYearData[0] || null;
    }

    // Fetch last 6 months of historical data for trends
    const historicalData = await db.select()
      .from(historicalEmissions)
      .where(eq(historicalEmissions.userId, userId))
      .orderBy(desc(historicalEmissions.year), desc(historicalEmissions.month))
      .limit(6);

    // Fetch all emissions for category breakdown calculation
    const allEmissions = await db.select()
      .from(emissions)
      .where(eq(emissions.userId, userId))
      .orderBy(desc(emissions.periodYear), desc(emissions.periodMonth))
      .limit(12);

    // Calculate total emissions and breakdown
    const totalEmissions = currentEmissions ? currentEmissions.totalCo2e : 0;
    
    // Calculate category breakdown percentages
    const emissionsBreakdown = currentEmissions ? {
      electricity: {
        value: currentEmissions.electricity,
        percentage: (currentEmissions.electricity / totalEmissions) * 100
      },
      gas: {
        value: currentEmissions.gas,
        percentage: (currentEmissions.gas / totalEmissions) * 100
      },
      transportation: {
        value: currentEmissions.transport,
        percentage: (currentEmissions.transport / totalEmissions) * 100
      },
      other: {
        value: currentEmissions.water + currentEmissions.waste,
        percentage: ((currentEmissions.water + currentEmissions.waste) / totalEmissions) * 100
      }
    } : null;

    // Calculate YoY changes
    const calculateYoYChange = (current: number, previous: number | null) => {
      if (!previous || previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };

    const metricsData = {
      totalEmissions: {
        value: totalEmissions,
        change: previousYearEmissions 
          ? calculateYoYChange(totalEmissions, previousYearEmissions.totalCo2e)
          : 0
      },
      energy: {
        value: currentEmissions ? currentEmissions.electricity + currentEmissions.gas : 0,
        change: previousYearEmissions 
          ? calculateYoYChange(
              currentEmissions.electricity + currentEmissions.gas,
              previousYearEmissions.electricity + previousYearEmissions.gas
            )
          : 0
      },
      water: {
        value: currentEmissions ? currentEmissions.water : 0,
        change: previousYearEmissions 
          ? calculateYoYChange(currentEmissions.water, previousYearEmissions.water)
          : 0
      },
      waste: {
        value: currentEmissions ? currentEmissions.waste : 0,
        change: previousYearEmissions 
          ? calculateYoYChange(currentEmissions.waste, previousYearEmissions.waste)
          : 0
      }
    };

    // Format monthly trend data
    const monthlyTrend = historicalData.reverse().map(record => ({
      month: new Date(record.year, record.month - 1).toLocaleString('en-US', { month: 'long' }),
      value: record.totalCo2e,
      change: 0 // Will be calculated based on previous month
    }));

    // Calculate month-over-month changes
    for (let i = 1; i < monthlyTrend.length; i++) {
      const current = monthlyTrend[i].value;
      const previous = monthlyTrend[i - 1].value;
      monthlyTrend[i].change = calculateYoYChange(current, previous);
    }

    // Fetch industry benchmarks for user's industry
    const industry = userData.companyIndustry || 'technology';
    const industryBenchmarks = await db.select()
      .from(industryComparisons)
      .where(eq(industryComparisons.industry, industry))
      .limit(1);

    const benchmarkData = industryBenchmarks[0] || null;

    // Calculate user's performance vs industry average
    const industryComparison = benchmarkData ? {
      yourPerformance: totalEmissions / 12, // Monthly average
      industryAverage: benchmarkData.averageValue,
      betterBy: benchmarkData.averageValue > 0 
        ? ((benchmarkData.averageValue - (totalEmissions / 12)) / benchmarkData.averageValue) * 100
        : 0
    } : null;

    return NextResponse.json({
      success: true,
      data: {
        metrics: metricsData,
        emissionsBreakdown,
        monthlyTrend,
        industryComparison,
        currentPeriod: currentEmissions ? {
          month: currentEmissions.periodMonth,
          year: currentEmissions.periodYear
        } : null
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}
