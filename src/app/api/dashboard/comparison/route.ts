import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, dashboardMetrics, industryComparisons } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

interface MetricComparison {
  value: number;
  unit: string;
  percentile: number;
  grade: string;
}

interface IndustryBenchmark {
  average: number;
  topQuartile: number;
  bottomQuartile: number;
  unit: string;
}

interface ComparisonResponse {
  success: boolean;
  userId: string;
  industry: string;
  user_metrics: {
    carbon_footprint?: MetricComparison;
    resource_efficiency?: MetricComparison;
    renewable_share?: MetricComparison;
    waste_diversion?: MetricComparison;
  };
  industry_benchmarks: {
    carbon_footprint?: IndustryBenchmark;
    resource_efficiency?: IndustryBenchmark;
    renewable_share?: IndustryBenchmark;
    waste_diversion?: IndustryBenchmark;
  };
  overall_grade: string;
  overall_percentile: number;
  insights: string[];
  timestamp: string;
}

function calculatePercentile(
  currentValue: number,
  average: number,
  topQuartile: number,
  bottomQuartile: number,
  metricType: string
): number {
  const isLowerBetter = metricType === 'carbon_footprint';

  if (isLowerBetter) {
    if (currentValue <= bottomQuartile) {
      const range = bottomQuartile - (bottomQuartile * 0.5);
      const position = bottomQuartile - currentValue;
      return 75 + (position / range) * 25;
    } else if (currentValue <= average) {
      const range = average - bottomQuartile;
      const position = currentValue - bottomQuartile;
      return 50 + ((range - position) / range) * 25;
    } else if (currentValue <= topQuartile) {
      const range = topQuartile - average;
      const position = currentValue - average;
      return 25 + ((range - position) / range) * 25;
    } else {
      const range = topQuartile * 0.5;
      const position = currentValue - topQuartile;
      return Math.max(0, 25 - (position / range) * 25);
    }
  } else {
    if (currentValue >= topQuartile) {
      const range = topQuartile * 0.5;
      const position = currentValue - topQuartile;
      return 75 + Math.min(25, (position / range) * 25);
    } else if (currentValue >= average) {
      const range = topQuartile - average;
      const position = currentValue - average;
      return 50 + (position / range) * 25;
    } else if (currentValue >= bottomQuartile) {
      const range = average - bottomQuartile;
      const position = currentValue - bottomQuartile;
      return 25 + (position / range) * 25;
    } else {
      const range = bottomQuartile * 0.5;
      const position = bottomQuartile - currentValue;
      return Math.max(0, 25 - (position / range) * 25);
    }
  }
}

function getGradeFromPercentile(percentile: number): string {
  if (percentile >= 95) return 'A+ - Exceptional - Top 5%';
  if (percentile >= 85) return 'A - Excellent - Top 15%';
  if (percentile >= 70) return 'B - Above Average';
  if (percentile >= 50) return 'C - Average';
  if (percentile >= 25) return 'D - Below Average';
  return 'F - Needs Improvement';
}

function generateInsights(
  userMetrics: Record<string, MetricComparison>,
  industryBenchmarks: Record<string, IndustryBenchmark>,
  industry: string
): string[] {
  const insights: string[] = [];

  if (userMetrics.carbon_footprint && industryBenchmarks.carbon_footprint) {
    const cf = userMetrics.carbon_footprint;
    const cfBench = industryBenchmarks.carbon_footprint;
    const percentDiff = ((cfBench.average - cf.value) / cfBench.average) * 100;

    if (cf.value < cfBench.average) {
      insights.push(
        `Your carbon footprint is ${Math.abs(percentDiff).toFixed(1)}% below the ${industry} industry average - excellent performance`
      );
    } else {
      insights.push(
        `Your carbon footprint is ${Math.abs(percentDiff).toFixed(1)}% above the ${industry} industry average - consider reduction strategies`
      );
    }

    if (cf.percentile >= 75) {
      insights.push(`You rank in the top 25% for carbon emissions reduction with a percentile of ${cf.percentile.toFixed(0)}`);
    }
  }

  if (userMetrics.renewable_share && industryBenchmarks.renewable_share) {
    const rs = userMetrics.renewable_share;
    const rsBench = industryBenchmarks.renewable_share;

    if (rs.value < rsBench.average) {
      const gap = rsBench.average - rs.value;
      insights.push(
        `Renewable energy adoption at ${rs.value.toFixed(1)}% is ${gap.toFixed(1)}% below the ${rsBench.average.toFixed(1)}% industry average`
      );
    } else {
      insights.push(
        `Your renewable energy share of ${rs.value.toFixed(1)}% exceeds the industry average of ${rsBench.average.toFixed(1)}%`
      );
    }
  }

  if (userMetrics.waste_diversion && industryBenchmarks.waste_diversion) {
    const wd = userMetrics.waste_diversion;
    const wdBench = industryBenchmarks.waste_diversion;

    if (wd.percentile >= 85) {
      insights.push(
        `You rank in the top 15% for waste diversion at ${wd.value.toFixed(1)}%`
      );
    } else if (wd.value < wdBench.topQuartile) {
      const gap = wdBench.topQuartile - wd.value;
      insights.push(
        `Increase waste diversion by ${gap.toFixed(1)}% to reach top quartile performance of ${wdBench.topQuartile.toFixed(1)}%`
      );
    }
  }

  if (userMetrics.resource_efficiency && industryBenchmarks.resource_efficiency) {
    const re = userMetrics.resource_efficiency;
    const reBench = industryBenchmarks.resource_efficiency;

    if (re.value < reBench.average) {
      insights.push(
        `Consider increasing resource efficiency to reach the industry average of ${reBench.average.toFixed(1)} ${reBench.unit}`
      );
    } else if (re.value >= reBench.topQuartile) {
      insights.push(
        `Your resource efficiency of ${re.value.toFixed(1)} ${re.unit} places you in the top performing quartile`
      );
    }
  }

  const percentiles = Object.values(userMetrics).map(m => m.percentile);
  const avgPercentile = percentiles.reduce((a, b) => a + b, 0) / percentiles.length;

  if (avgPercentile >= 75) {
    insights.push(
      `Overall, you're performing in the top quartile across sustainability metrics - maintain this leadership position`
    );
  } else if (avgPercentile < 50) {
    insights.push(
      `Your overall performance is below industry median - focus on improving metrics with lowest percentiles first`
    );
  }

  return insights.slice(0, 5);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId || userId.trim() === '') {
      return NextResponse.json(
        {
          error: 'userId query parameter is required',
          code: 'MISSING_USER_ID',
        },
        { status: 400 }
      );
    }

    const userRecord = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json(
        {
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    const userData = userRecord[0];

    if (!userData.companyIndustry || userData.companyIndustry.trim() === '') {
      return NextResponse.json(
        {
          error: 'User has no industry set',
          code: 'NO_INDUSTRY_SET',
        },
        { status: 400 }
      );
    }

    const industryBenchmarksData = await db
      .select()
      .from(industryComparisons)
      .where(eq(industryComparisons.industry, userData.companyIndustry));

    if (industryBenchmarksData.length === 0) {
      return NextResponse.json(
        {
          error: `No industry benchmarks found for industry: ${userData.companyIndustry}`,
          code: 'NO_BENCHMARKS_FOUND',
        },
        { status: 404 }
      );
    }

    const userMetricsData = await db
      .select()
      .from(dashboardMetrics)
      .where(eq(dashboardMetrics.userId, userId))
      .orderBy(desc(dashboardMetrics.updatedAt));

    const benchmarkMap: Record<string, IndustryBenchmark> = {};
    industryBenchmarksData.forEach((benchmark) => {
      benchmarkMap[benchmark.metricType] = {
        average: benchmark.averageValue,
        topQuartile: benchmark.topQuartileValue,
        bottomQuartile: benchmark.bottomQuartileValue,
        unit: benchmark.unit,
      };
    });

    const metricsMap: Record<string, number> = {};
    userMetricsData.forEach((metric) => {
      if (!metricsMap[metric.metricType]) {
        metricsMap[metric.metricType] = metric.currentValue;
      }
    });

    const userMetricsResult: Record<string, MetricComparison> = {};
    const metricTypes = ['carbon_footprint', 'resource_efficiency', 'renewable_share', 'waste_diversion'];

    metricTypes.forEach((metricType) => {
      const currentValue = metricsMap[metricType];
      const benchmark = benchmarkMap[metricType];

      if (currentValue !== undefined && benchmark) {
        const percentile = calculatePercentile(
          currentValue,
          benchmark.average,
          benchmark.topQuartile,
          benchmark.bottomQuartile,
          metricType
        );
        const grade = getGradeFromPercentile(percentile);

        userMetricsResult[metricType] = {
          value: currentValue,
          unit: benchmark.unit,
          percentile: Math.round(percentile * 10) / 10,
          grade,
        };
      }
    });

    const percentiles = Object.values(userMetricsResult).map((m) => m.percentile);
    const overallPercentile =
      percentiles.length > 0
        ? Math.round((percentiles.reduce((a, b) => a + b, 0) / percentiles.length) * 10) / 10
        : 0;
    const overallGrade = getGradeFromPercentile(overallPercentile);

    const insights = generateInsights(userMetricsResult, benchmarkMap, userData.companyIndustry);

    const response: ComparisonResponse = {
      success: true,
      userId: userId,
      industry: userData.companyIndustry,
      user_metrics: {
        ...(userMetricsResult.carbon_footprint && { carbon_footprint: userMetricsResult.carbon_footprint }),
        ...(userMetricsResult.resource_efficiency && { resource_efficiency: userMetricsResult.resource_efficiency }),
        ...(userMetricsResult.renewable_share && { renewable_share: userMetricsResult.renewable_share }),
        ...(userMetricsResult.waste_diversion && { waste_diversion: userMetricsResult.waste_diversion }),
      },
      industry_benchmarks: {
        ...(benchmarkMap.carbon_footprint && { carbon_footprint: benchmarkMap.carbon_footprint }),
        ...(benchmarkMap.resource_efficiency && { resource_efficiency: benchmarkMap.resource_efficiency }),
        ...(benchmarkMap.renewable_share && { renewable_share: benchmarkMap.renewable_share }),
        ...(benchmarkMap.waste_diversion && { waste_diversion: benchmarkMap.waste_diversion }),
      },
      overall_grade: overallGrade,
      overall_percentile: overallPercentile,
      insights: insights,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    );
  }
}