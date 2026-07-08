import { NextRequest, NextResponse } from 'next/server';
import { generateSustainabilityReport, ReportData } from '@/lib/pdf/export-report';
import { db } from '@/db';
import { user, emissions, userProgress, emissionsHistory } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Fetch user data
    const [userData] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch latest emissions data
    const [latestEmissions] = await db
      .select()
      .from(emissions)
      .where(eq(emissions.userId, userId))
      .orderBy(desc(emissions.createdAt))
      .limit(1);

    // Fetch user progress
    const [progress] = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId))
      .limit(1);

    // Fetch emissions history
    const history = await db
      .select()
      .from(emissionsHistory)
      .orderBy(desc(emissionsHistory.createdAt))
      .limit(12);

    const now = new Date();
    const periodYear = latestEmissions?.periodYear ?? now.getFullYear();
    const periodMonth = latestEmissions?.periodMonth ?? now.getMonth() + 1;

    const electricity = latestEmissions?.electricity ?? 0;
    const gasValue = latestEmissions?.gas ?? 0;
    const transport = latestEmissions?.transport ?? 0;
    const otherValue = (latestEmissions?.water ?? 0) + (latestEmissions?.waste ?? 0);

    const totalEmissions = latestEmissions?.totalCo2e ?? electricity + gasValue + transport + otherValue;
    const breakdownTotal = totalEmissions > 0 ? totalEmissions : electricity + gasValue + transport + otherValue;

    const toBreakdown = (value: number) => ({
      value,
      percentage: breakdownTotal > 0 ? (value / breakdownTotal) * 100 : 0,
    });

    const sortedHistory = [...history].sort((a, b) => {
      const aDate = new Date(a.createdAt).getTime();
      const bDate = new Date(b.createdAt).getTime();
      return aDate - bDate;
    });

    const monthlyTrend = sortedHistory.map((entry, index) => {
      const previous = sortedHistory[index - 1];
      const value = entry.emissions ?? entry.value ?? 0;
      const previousValue = previous ? previous.emissions ?? previous.value ?? 0 : 0;
      const change = previousValue > 0 ? ((value - previousValue) / previousValue) * 100 : 0;

      return {
        month: entry.month,
        value,
        change: Number.isFinite(change) ? change : 0,
      };
    });

    const latestTrend = monthlyTrend[monthlyTrend.length - 1];
    const previousTrend = monthlyTrend[monthlyTrend.length - 2];
    const yoyChange = monthlyTrend.length > 1 && previousTrend && previousTrend.value > 0
      ? (((latestTrend?.value ?? 0) - previousTrend.value) / previousTrend.value) * 100
      : 0;

    const breakdownPercentages = {
      electricity: toBreakdown(electricity).percentage,
      gas: toBreakdown(gasValue).percentage,
      transportation: toBreakdown(transport).percentage,
      other: toBreakdown(otherValue).percentage,
    };

    const insights = {
      observations: [
        `Electricity contributes ${breakdownPercentages.electricity.toFixed(1)}% of reported emissions.`,
        `Transportation accounts for ${breakdownPercentages.transportation.toFixed(1)}% of reported emissions.`,
      ],
      recommendations: [
        'Prioritize efficiency projects to reduce electricity intensity.',
        'Promote low-carbon transport options to curb mobility emissions.',
      ],
      highlights: [
        `Latest period: ${latestTrend?.month ?? 'N/A'} at ${(latestTrend?.value ?? 0).toFixed(2)} tons CO2e.`,
      ],
      risks: latestTrend && latestTrend.change > 5
        ? ['Emissions increased materially in the most recent period—investigate drivers.']
        : [],
    };

    const reportData: ReportData = {
      companyName: userData.companyName || userData.name,
      reportDate: new Date().toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      periodYear,
      periodMonth,
      totalEmissions,
      yoyChange,
      emissionsBreakdown: {
        electricity: toBreakdown(electricity),
        gas: toBreakdown(gasValue),
        transportation: toBreakdown(transport),
        other: toBreakdown(otherValue),
      },
      monthlyTrend,
      industryComparison: null,
      insights,
    };

    // Generate PDF
    const pdf = generateSustainabilityReport(reportData);
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="sustainability-report-${Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Report export error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}