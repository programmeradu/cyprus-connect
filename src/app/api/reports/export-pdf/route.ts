import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateSustainabilityReport, ReportData } from '@/lib/pdf/export-report';
import { db } from '@/db';
import { user, historicalEmissions, emissions, industryComparisons } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { checkAndDeductAiCredits } from '@/lib/ai-credits';
import { bindSessionUser } from "@/lib/api-auth";
import { readJson } from '@/lib/validate';
import { logger } from '@/lib/log';

const log = logger('reports.export-pdf');

const bodySchema = z.object({
  userId: z.string().trim().min(1).max(128),
});

export async function POST(request: NextRequest) {
  try {
    const bodyResult = await readJson(request, bodySchema);
    if (!bodyResult.ok) return bodyResult.response;
    const __auth = await bindSessionUser(request, bodyResult.data.userId);
    if (!__auth.ok) return __auth.response;
    const userId = __auth.userId;

    // Get authorization token for feature tracking
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Check + deduct AI credits (sustainability report costs 1 credit)
    const creditGate = await checkAndDeductAiCredits(request, 1, 'report-pdf');
    if (!creditGate.ok) {
      return NextResponse.json({ error: creditGate.error }, { status: creditGate.status });
    }

    // Validate user exists
    const userData = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userData.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userInfo = userData[0];

    // Fetch emissions data directly from database
    let emissionsList = await db
      .select()
      .from(historicalEmissions)
      .where(eq(historicalEmissions.userId, userId))
      .orderBy(desc(historicalEmissions.year), desc(historicalEmissions.month))
      .limit(12);

    if (emissionsList.length === 0) {
      // Check standard emissions table as fallback
      const standardEmissions = await db
        .select()
        .from(emissions)
        .where(eq(emissions.userId, userId))
        .orderBy(desc(emissions.periodYear), desc(emissions.periodMonth))
        .limit(12);

      if (standardEmissions.length > 0) {
        emissionsList = standardEmissions.map((e) => ({
          id: e.id,
          userId: e.userId,
          year: e.periodYear,
          month: e.periodMonth,
          electricityKwh: e.electricity ? e.electricity / 0.5 : 0,
          gasM3: e.gas ? e.gas / 2.0 : 0,
          waterLiters: e.water ? e.water / 0.0003 : 0,
          wasteKg: e.waste ? e.waste / 0.5 : 0,
          transportKm: e.transport ? e.transport / 0.2 : 0,
          totalCo2e: e.totalCo2e,
          renewablePercentage: 0,
          efficiencyScore: 75,
          wasteDiversionRate: 50,
          createdAt: e.createdAt,
        }));
      }
    }

    if (emissionsList.length === 0) {
      return NextResponse.json(
        { error: 'No emissions data available for this user' },
        { status: 404 }
      );
    }

    // Get current period (most recent)
    const currentPeriod = emissionsList[0];
    const currentYear = currentPeriod.year;
    const currentMonth = currentPeriod.month;

    // Get previous year same month for YoY comparison
    const previousYearData = emissionsList.find(
      e => e.year === currentYear - 1 && e.month === currentMonth
    );

    // Calculate metrics
    const totalEmissions = currentPeriod.totalCo2e || 0;
    const previousYearEmissions = previousYearData?.totalCo2e || totalEmissions;
    const yoyChange = previousYearEmissions !== 0
      ? ((totalEmissions - previousYearEmissions) / previousYearEmissions) * 100
      : 0;

    // Calculate category breakdown from kWh/m3/kg/km to CO2e
    // Using approximate conversion factors
    const electricity = (currentPeriod.electricityKwh || 0) * 0.5; // ~0.5 kg CO2e per kWh
    const gas = (currentPeriod.gasM3 || 0) * 2.0; // ~2.0 kg CO2e per m3
    const water = (currentPeriod.waterLiters || 0) * 0.0003; // ~0.0003 kg CO2e per liter
    const waste = (currentPeriod.wasteKg || 0) * 0.5; // ~0.5 kg CO2e per kg
    const transportation = (currentPeriod.transportKm || 0) * 0.2; // ~0.2 kg CO2e per km

    const total = electricity + gas + water + waste + transportation || 1;

    const emissionsBreakdown = {
      electricity: { value: electricity, percentage: (electricity / total) * 100 },
      gas: { value: gas, percentage: (gas / total) * 100 },
      transportation: { value: transportation, percentage: (transportation / total) * 100 },
      other: { value: water + waste, percentage: ((water + waste) / total) * 100 }
    };

    // Get monthly trend (last 6 months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrend = emissionsList.slice(0, 6).map((emission, index) => {
      const prevEmission = emissionsList[index + 1];
      const change = prevEmission
        ? ((emission.totalCo2e - prevEmission.totalCo2e) / prevEmission.totalCo2e) * 100
        : 0;

      return {
        month: monthNames[emission.month - 1],
        value: emission.totalCo2e,
        change
      };
    }).reverse();

    // Get industry benchmarks
    const industryData = await db
      .select()
      .from(industryComparisons)
      .where(
        and(
          eq(industryComparisons.industry, userInfo.companyIndustry || 'technology'),
          eq(industryComparisons.metricType, 'total_emissions')
        )
      )
      .limit(1);

    const industryComparison = industryData.length > 0 ? {
      yourPerformance: totalEmissions / 12, // Monthly average
      industryAverage: industryData[0].averageValue,
      betterBy: industryData[0].averageValue !== 0
        ? ((industryData[0].averageValue - (totalEmissions / 12)) / industryData[0].averageValue) * 100
        : 0
    } : null;

    // Generate AI insights
    const insights = {
      observations: [
        `Total emissions for ${monthNames[currentMonth - 1]} ${currentYear}: ${totalEmissions.toFixed(1)} tons CO2e`,
        yoyChange < 0
          ? `Emissions decreased by ${Math.abs(yoyChange).toFixed(1)}% compared to last year`
          : `Emissions increased by ${yoyChange.toFixed(1)}% compared to last year`,
        `Electricity accounts for ${emissionsBreakdown.electricity.percentage.toFixed(0)}% of total emissions`
      ],
      recommendations: [
        'Continue monitoring your emissions regularly',
        electricity > gas + transportation
          ? 'Focus on renewable energy adoption to reduce electricity emissions'
          : 'Optimize transportation and fleet management',
        'Set specific reduction targets for each category',
        industryComparison && industryComparison.betterBy > 0
          ? 'You are performing better than industry average - maintain this momentum'
          : 'Review industry best practices to improve performance'
      ],
      highlights: [
        `Operating in ${userInfo.companyIndustry || 'technology'} sector`,
        emissionsList.length >= 6
          ? 'Consistent data tracking over multiple months'
          : 'Building emissions tracking history',
        totalEmissions < 1000
          ? 'Low emissions profile - maintain sustainable practices'
          : 'Significant emissions - high impact potential for reductions'
      ],
      risks: [
        yoyChange > 10 ? 'Rising emissions trend - immediate action recommended' : 'Maintain consistent data collection',
        !previousYearData ? 'Limited historical data for accurate trend analysis' : 'Regular monitoring essential'
      ]
    };

    // Prepare report data
    const reportData: ReportData = {
      companyName: userInfo.companyName || userInfo.name || 'Your Company',
      reportDate: new Date().toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      periodYear: currentYear,
      periodMonth: currentMonth,
      totalEmissions,
      yoyChange,
      emissionsBreakdown,
      monthlyTrend,
      industryComparison,
      insights
    };

    // Generate PDF
    const pdf = generateSustainabilityReport(reportData);
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="vuneli-analytics-report-${Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    const ref = log.error('PDF export error', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF report.', ref },
      { status: 500 }
    );
  }
}
