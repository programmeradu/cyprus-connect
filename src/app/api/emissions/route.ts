import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { emissions, user } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { createNotification, NotificationTemplates } from '@/lib/notifications';
import { bindSessionUser } from "@/lib/api-auth";
import { readJson, parseValue } from "@/lib/validate";
import { logger } from "@/lib/log";

const log = logger("emissions");

const querySchema = z.object({
  userId: z.string().trim().min(1).max(100).optional(),
  latest: z.enum(['true', 'false']).optional(),
  year: z.string().regex(/^\d{4}$/).optional(),
  month: z.string().regex(/^\d{1,2}$/).optional(),
});

const postSchema = z.object({
  userId: z.string().trim().min(1).max(100).optional(),
  electricity: z.number().finite().min(0).max(1_000_000_000),
  gas: z.number().finite().min(0).max(1_000_000_000),
  water: z.number().finite().min(0).max(1_000_000_000),
  waste: z.number().finite().min(0).max(1_000_000_000),
  transport: z.number().finite().min(0).max(1_000_000_000),
  totalCo2e: z.number().finite().min(0).max(1_000_000_000),
  periodMonth: z.union([z.number().int(), z.string().trim().min(1).max(2)]),
  periodYear: z.union([z.number().int(), z.string().trim().min(1).max(4)]),
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = parseValue(
    {
      userId: searchParams.get('userId') ?? undefined,
      latest: searchParams.get('latest') ?? undefined,
      year: searchParams.get('year') ?? undefined,
      month: searchParams.get('month') ?? undefined,
    },
    querySchema,
  );
  if (!q.ok) return q.response;
  const { latest, year, month } = q.data;

  const __auth = await bindSessionUser(request, q.data.userId);
  if (!__auth.ok) return __auth.response;
  const userId = __auth.userId;

  try {
    const userExists = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (latest === 'true') {
      const latestRecord = await db.select()
        .from(emissions)
        .where(eq(emissions.userId, userId))
        .orderBy(desc(emissions.periodYear), desc(emissions.periodMonth))
        .limit(1);

      if (latestRecord.length === 0) {
        return NextResponse.json(
          { error: 'No emission records found for this user', code: 'NO_RECORDS_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(latestRecord[0]);
    }

    if (year && month) {
      const yearNum = parseInt(year, 10);
      const monthNum = parseInt(month, 10);

      if (yearNum < 2020 || yearNum > 2050) {
        return NextResponse.json(
          { error: 'Year must be a valid 4-digit number between 2020 and 2050', code: 'INVALID_YEAR' },
          { status: 400 }
        );
      }

      if (monthNum < 1 || monthNum > 12) {
        return NextResponse.json(
          { error: 'Month must be between 1 and 12', code: 'INVALID_MONTH' },
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
          { error: 'No emission record found for this period', code: 'RECORD_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(specificRecord[0]);
    }

    const allEmissions = await db.select()
      .from(emissions)
      .where(eq(emissions.userId, userId))
      .orderBy(desc(emissions.periodYear), desc(emissions.periodMonth));

    return NextResponse.json(allEmissions);

  } catch (error) {
    const ref = log.error('GET error', error);
    return NextResponse.json({ error: 'Internal server error', ref }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const parsed = await readJson(request, postSchema);
  if (!parsed.ok) return parsed.response;
  const {
    userId: __claimedUserId,
    electricity,
    gas,
    water,
    waste,
    transport,
    totalCo2e,
    periodMonth,
    periodYear
  } = parsed.data;

  const __auth = await bindSessionUser(request, __claimedUserId);
  if (!__auth.ok) return __auth.response;
  const userId = __auth.userId;

  const monthNum = typeof periodMonth === "number" ? periodMonth : parseInt(periodMonth, 10);
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return NextResponse.json(
      { error: 'periodMonth must be between 1 and 12', code: 'INVALID_PERIOD_MONTH' },
      { status: 400 }
    );
  }

  const yearNum = typeof periodYear === "number" ? periodYear : parseInt(periodYear, 10);
  if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2050) {
    return NextResponse.json(
      { error: 'periodYear must be between 2020 and 2050', code: 'INVALID_PERIOD_YEAR' },
      { status: 400 }
    );
  }

  try {
    const userExists = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

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
    const ref = log.error('POST error', error);
    return NextResponse.json({ error: 'Internal server error', ref }, { status: 500 });
  }
}
