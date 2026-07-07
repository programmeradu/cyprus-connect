import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { historicalEmissions, user } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const monthsParam = searchParams.get('months') ?? '6';

    // Validate userId
    if (!userId || userId.trim() === '') {
      return NextResponse.json({ 
        error: "userId is required and cannot be empty",
        code: "MISSING_USER_ID" 
      }, { status: 400 });
    }

    // Validate months parameter
    const months = parseInt(monthsParam);
    if (isNaN(months) || months < 1 || months > 24) {
      return NextResponse.json({ 
        error: "months must be an integer between 1 and 24",
        code: "INVALID_MONTHS" 
      }, { status: 400 });
    }

    // Check if user exists
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

    // Fetch historical emissions for user, ordered by year DESC, month DESC
    const records = await db.select()
      .from(historicalEmissions)
      .where(eq(historicalEmissions.userId, userId))
      .orderBy(desc(historicalEmissions.year), desc(historicalEmissions.month))
      .limit(months);

    // If no data exists, return empty array with summary
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

    // Calculate month-over-month changes
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

    // Calculate summary statistics
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
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
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
      wasteDiversionRate
    } = body;

    // Validate required fields
    if (!userId || userId.trim() === '') {
      return NextResponse.json({ 
        error: "userId is required and cannot be empty",
        code: "MISSING_USER_ID" 
      }, { status: 400 });
    }

    if (typeof year !== 'number' || year < 2020 || year > 2050) {
      return NextResponse.json({ 
        error: "year must be a number between 2020 and 2050",
        code: "INVALID_YEAR" 
      }, { status: 400 });
    }

    if (typeof month !== 'number' || month < 1 || month > 12) {
      return NextResponse.json({ 
        error: "month must be a number between 1 and 12",
        code: "INVALID_MONTH" 
      }, { status: 400 });
    }

    if (typeof electricityKwh !== 'number' || electricityKwh < 0) {
      return NextResponse.json({ 
        error: "electricityKwh must be a non-negative number",
        code: "INVALID_ELECTRICITY" 
      }, { status: 400 });
    }

    if (typeof gasM3 !== 'number' || gasM3 < 0) {
      return NextResponse.json({ 
        error: "gasM3 must be a non-negative number",
        code: "INVALID_GAS" 
      }, { status: 400 });
    }

    if (typeof waterLiters !== 'number' || waterLiters < 0) {
      return NextResponse.json({ 
        error: "waterLiters must be a non-negative number",
        code: "INVALID_WATER" 
      }, { status: 400 });
    }

    if (typeof wasteKg !== 'number' || wasteKg < 0) {
      return NextResponse.json({ 
        error: "wasteKg must be a non-negative number",
        code: "INVALID_WASTE" 
      }, { status: 400 });
    }

    if (typeof transportKm !== 'number' || transportKm < 0) {
      return NextResponse.json({ 
        error: "transportKm must be a non-negative number",
        code: "INVALID_TRANSPORT" 
      }, { status: 400 });
    }

    if (typeof totalCo2e !== 'number' || totalCo2e < 0) {
      return NextResponse.json({ 
        error: "totalCo2e must be a non-negative number",
        code: "INVALID_TOTAL_CO2E" 
      }, { status: 400 });
    }

    if (typeof renewablePercentage !== 'number' || renewablePercentage < 0 || renewablePercentage > 100) {
      return NextResponse.json({ 
        error: "renewablePercentage must be a number between 0 and 100",
        code: "INVALID_RENEWABLE_PERCENTAGE" 
      }, { status: 400 });
    }

    if (typeof efficiencyScore !== 'number' || efficiencyScore < 0 || efficiencyScore > 100) {
      return NextResponse.json({ 
        error: "efficiencyScore must be a number between 0 and 100",
        code: "INVALID_EFFICIENCY_SCORE" 
      }, { status: 400 });
    }

    if (typeof wasteDiversionRate !== 'number' || wasteDiversionRate < 0 || wasteDiversionRate > 100) {
      return NextResponse.json({ 
        error: "wasteDiversionRate must be a number between 0 and 100",
        code: "INVALID_WASTE_DIVERSION_RATE" 
      }, { status: 400 });
    }

    // Check if user exists
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

    // Check if record already exists for this userId + year + month
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

    // Update if exists, insert if not
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
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}