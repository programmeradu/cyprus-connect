import { NextRequest, NextResponse } from 'next/server';
import { generateSustainabilityReport, ReportData } from '@/lib/pdf/export-report';
import { db } from '@/db';
import { user, historicalEmissions, industryComparisons } from '@/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId || userId.trim() === '') {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get authorization token for feature tracking
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];

    // Check sustainability reports allowance before processing
    const checkResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/autumn/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        feature_id: 'sustainability_reports',
        required_balance: 1
      })
    });

    if (!checkResponse.ok) {
      return NextResponse.json(
        { error: "Report generation limit reached. Please upgrade your plan for unlimited reports." },
        { status: 403 }
      );
    }

    const { allowed } = await checkResponse.json();
    if (!allowed) {
      return NextResponse.json(
        { error: "Report generation limit reached. Please upgrade your plan for unlimited reports." },
        { status: 403 }
      );
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
    const emissions = await db
      .select()
      .from(historicalEmissions)
      .where(eq(historicalEmissions.userId, userId))
      .orderBy(desc(historicalEmissions.year), desc(historicalEmissions.month))
      .limit(12);

    if (emissions.length === 0) {
      return NextResponse.json(
        { error: 'No emissions data available for this user' },
        { status: 404 }
      );
    }

    // Get current period (most recent)
    const currentPeriod = emissions[0];
    const currentYear = currentPeriod.year;
    const currentMonth = currentPeriod.month;

    // Get previous year same month for YoY comparison
    const previousYearData = emissions.find(
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
    const monthlyTrend = emissions.slice(0, 6).map((emission, index) => {
      const prevEmission = emissions[index + 1];
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
        emissions.length >= 6 
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
      reportDate: new Date().toLocaleDateString('en-US', {
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

    // Track sustainability report usage after successful generation
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/autumn/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        feature_id: 'sustainability_reports',
        value: 1,
        idempotency_key: `pdf-report-${Date.now()}-${Math.random()}`
      })
    });

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="verdeiq-analytics-report-${Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF export error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}