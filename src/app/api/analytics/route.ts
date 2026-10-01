import { logger } from "@/lib/log";
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
import { bindSessionUser } from "@/lib/api-auth";
import { REFERENCE_FACTORS } from "@/lib/emissions/reference-factors";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const __auth = await bindSessionUser(request, searchParams.get('userId'));
    if (!__auth.ok) return __auth.response;
    const userId = __auth.userId;


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


    // The emissions row stores activity amounts (kWh, m3, litres, kg, km) per
    // category and the calculated total in tonnes. Convert each category to
    // tonnes with the published reference factors before showing shares, so a
    // kWh figure is never presented as tonnes.
    const tonnesOf = (row: typeof currentEmissions | null) => {
      if (!row) return null;
      const t = (key: keyof typeof REFERENCE_FACTORS, v: number) => ((Number(v) || 0) * REFERENCE_FACTORS[key].kgCo2ePerUnit) / 1000;
      return {
        electricity: t("electricity", row.electricity),
        gas: t("gas", row.gas),
        transport: t("transport", row.transport),
        water: t("water", row.water),
        waste: t("waste", row.waste),
      };
    };
    const cur = tonnesOf(currentEmissions);
    const prevT = tonnesOf(previousYearEmissions);
    const catSum = cur ? cur.electricity + cur.gas + cur.transport + cur.water + cur.waste : 0;
    // One set of factors for every figure on the page, so the parts always add
    // up to the total. The stored total is used only when no activity is split.
    const totalEmissions = catSum > 0 ? catSum : (currentEmissions?.totalCo2e ?? 0);
    const prevSum = prevT ? prevT.electricity + prevT.gas + prevT.transport + prevT.water + prevT.waste : 0;
    const prevTotal = previousYearEmissions ? (prevSum > 0 ? prevSum : previousYearEmissions.totalCo2e) : null;
    const share = (v: number) => (catSum > 0 ? (v / catSum) * 100 : 0);
    const emissionsBreakdown = cur && catSum > 0 ? {
      electricity: { value: cur.electricity, percentage: share(cur.electricity) },
      gas: { value: cur.gas, percentage: share(cur.gas) },
      transportation: { value: cur.transport, percentage: share(cur.transport) },
      other: { value: cur.water + cur.waste, percentage: share(cur.water + cur.waste) },
    } : null;

    // Calculate YoY changes
    // null = nothing to compare against (shown as no change line, not 0%).
    const calculateYoYChange = (current: number, previous: number | null): number | null => {
      if (!previous || previous === 0) return null;
      return ((current - previous) / previous) * 100;
    };

    const metricsData = {
      totalEmissions: {
        value: totalEmissions,
        change: calculateYoYChange(totalEmissions, prevTotal)
      },
      energy: {
        value: cur ? cur.electricity + cur.gas : 0,
        change: cur && prevT ? calculateYoYChange(cur.electricity + cur.gas, prevT.electricity + prevT.gas) : null
      },
      water: {
        value: cur ? cur.water : 0,
        change: cur && prevT ? calculateYoYChange(cur.water, prevT.water) : null
      },
      waste: {
        value: cur ? cur.waste : 0,
        change: cur && prevT ? calculateYoYChange(cur.waste, prevT.waste) : null
      }
    };

    // Format monthly trend data
    const monthlyTrend = historicalData.reverse().map(record => ({
      month: new Date(record.year, record.month - 1).toLocaleString('en-GB', { month: 'long' }),
      value: record.totalCo2e,
      change: null as number | null
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
      yourPerformance: totalEmissions, // latest month
      industryAverage: benchmarkData.averageValue,
      betterBy: benchmarkData.averageValue > 0 
        ? ((benchmarkData.averageValue - totalEmissions) / benchmarkData.averageValue) * 100
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
    return NextResponse.json({ 
      error: 'Internal server error', ref: logger("api.analytics").error('request failed', error),
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}
