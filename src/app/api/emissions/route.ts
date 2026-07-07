import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { emissions, user } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { createNotification, NotificationTemplates } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const latest = searchParams.get('latest');
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    // Validate userId is provided
    if (!userId || userId.trim() === '') {
      return NextResponse.json(
        { 
          error: 'Valid userId is required',
          code: 'INVALID_USER_ID' 
        },
        { status: 400 }
      );
    }

    // Verify user exists
    const userExists = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json(
        { 
          error: 'User not found',
          code: 'USER_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    // Get latest emission record
    if (latest === 'true') {
      const latestRecord = await db.select()
        .from(emissions)
        .where(eq(emissions.userId, userId))
        .orderBy(desc(emissions.periodYear), desc(emissions.periodMonth))
        .limit(1);

      if (latestRecord.length === 0) {
        return NextResponse.json(
          { 
            error: 'No emission records found for this user',
            code: 'NO_RECORDS_FOUND' 
          },
          { status: 404 }
        );
      }

      return NextResponse.json(latestRecord[0]);
    }

    // Get specific month data
    if (year && month) {
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);

      if (isNaN(yearNum) || year.length !== 4 || yearNum < 2020 || yearNum > 2050) {
        return NextResponse.json(
          { 
            error: 'Year must be a valid 4-digit number between 2020 and 2050',
            code: 'INVALID_YEAR' 
          },
          { status: 400 }
        );
      }

      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return NextResponse.json(
          { 
            error: 'Month must be between 1 and 12',
            code: 'INVALID_MONTH' 
          },
          { status: 400 }
        );
      }

      const specificRecord = await db.select()
        .from(emissions)
        .where(
          and(
            eq(emissions.userId, userId),
            eq(emissions.periodYear, yearNum),
            eq(emissions.periodMonth, monthNum)
          )
        )
        .limit(1);

      if (specificRecord.length === 0) {
        return NextResponse.json(
          { 
            error: 'No emission record found for this period',
            code: 'RECORD_NOT_FOUND' 
          },
          { status: 404 }
        );
      }

      return NextResponse.json(specificRecord[0]);
    }

    // Get all emissions for user, sorted by most recent
    const allEmissions = await db.select()
      .from(emissions)
      .where(eq(emissions.userId, userId))
      .orderBy(desc(emissions.periodYear), desc(emissions.periodMonth));

    return NextResponse.json(allEmissions);

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      electricity,
      gas,
      water,
      waste,
      transport,
      totalCo2e,
      periodMonth,
      periodYear
    } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { 
          error: 'userId is required',
          code: 'MISSING_USER_ID' 
        },
        { status: 400 }
      );
    }

    if (electricity === undefined || electricity === null) {
      return NextResponse.json(
        { 
          error: 'electricity is required',
          code: 'MISSING_ELECTRICITY' 
        },
        { status: 400 }
      );
    }

    if (gas === undefined || gas === null) {
      return NextResponse.json(
        { 
          error: 'gas is required',
          code: 'MISSING_GAS' 
        },
        { status: 400 }
      );
    }

    if (water === undefined || water === null) {
      return NextResponse.json(
        { 
          error: 'water is required',
          code: 'MISSING_WATER' 
        },
        { status: 400 }
      );
    }

    if (waste === undefined || waste === null) {
      return NextResponse.json(
        { 
          error: 'waste is required',
          code: 'MISSING_WASTE' 
        },
        { status: 400 }
      );
    }

    if (transport === undefined || transport === null) {
      return NextResponse.json(
        { 
          error: 'transport is required',
          code: 'MISSING_TRANSPORT' 
        },
        { status: 400 }
      );
    }

    if (totalCo2e === undefined || totalCo2e === null) {
      return NextResponse.json(
        { 
          error: 'totalCo2e is required',
          code: 'MISSING_TOTAL_CO2E' 
        },
        { status: 400 }
      );
    }

    if (!periodMonth) {
      return NextResponse.json(
        { 
          error: 'periodMonth is required',
          code: 'MISSING_PERIOD_MONTH' 
        },
        { status: 400 }
      );
    }

    if (!periodYear) {
      return NextResponse.json(
        { 
          error: 'periodYear is required',
          code: 'MISSING_PERIOD_YEAR' 
        },
        { status: 400 }
      );
    }

    // Validate userId
    if (typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json(
        { 
          error: 'userId must be a valid string',
          code: 'INVALID_USER_ID' 
        },
        { status: 400 }
      );
    }

    // Verify user exists
    const userExists = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json(
        { 
          error: 'User not found',
          code: 'USER_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    // Validate numeric fields are positive
    if (electricity < 0) {
      return NextResponse.json(
        { 
          error: 'electricity must be a positive number',
          code: 'INVALID_ELECTRICITY' 
        },
        { status: 400 }
      );
    }

    if (gas < 0) {
      return NextResponse.json(
        { 
          error: 'gas must be a positive number',
          code: 'INVALID_GAS' 
        },
        { status: 400 }
      );
    }

    if (water < 0) {
      return NextResponse.json(
        { 
          error: 'water must be a positive number',
          code: 'INVALID_WATER' 
        },
        { status: 400 }
      );
    }

    if (waste < 0) {
      return NextResponse.json(
        { 
          error: 'waste must be a positive number',
          code: 'INVALID_WASTE' 
        },
        { status: 400 }
      );
    }

    if (transport < 0) {
      return NextResponse.json(
        { 
          error: 'transport must be a positive number',
          code: 'INVALID_TRANSPORT' 
        },
        { status: 400 }
      );
    }

    if (totalCo2e < 0) {
      return NextResponse.json(
        { 
          error: 'totalCo2e must be a positive number',
          code: 'INVALID_TOTAL_CO2E' 
        },
        { status: 400 }
      );
    }

    // Validate periodMonth
    const monthNum = parseInt(periodMonth);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return NextResponse.json(
        { 
          error: 'periodMonth must be between 1 and 12',
          code: 'INVALID_PERIOD_MONTH' 
        },
        { status: 400 }
      );
    }

    // Validate periodYear
    const yearNum = parseInt(periodYear);
    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2050) {
      return NextResponse.json(
        { 
          error: 'periodYear must be between 2020 and 2050',
          code: 'INVALID_PERIOD_YEAR' 
        },
        { status: 400 }
      );
    }

    // Create new emission record
    const newEmission = await db.insert(emissions)
      .values({
        userId: userId,
        electricity,
        gas,
        water,
        waste,
        transport,
        totalCo2e,
        periodMonth: monthNum,
        periodYear: yearNum,
        createdAt: new Date().toISOString()
      })
      .returning();

    // Send notification for emission entry
    const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    await createNotification({
      userId,
      ...NotificationTemplates.emissionEntry({
        month: monthNames[monthNum],
        year: yearNum,
        totalCo2e,
        link: '/app/analytics'
      })
    });

    return NextResponse.json(newEmission[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}