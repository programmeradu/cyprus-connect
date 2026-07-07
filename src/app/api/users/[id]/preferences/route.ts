import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || typeof id !== 'string' || id.trim() === '') {
      return NextResponse.json(
        { error: 'Valid user ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const userRecord = await db
      .select({
        preferredCurrency: user.preferredCurrency,
        countryCode: user.countryCode,
        timezone: user.timezone,
        energyZone: user.energyZone,
      })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(userRecord[0], { status: 200 });
  } catch (error) {
    console.error('GET preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || typeof id !== 'string' || id.trim() === '') {
      return NextResponse.json(
        { error: 'Valid user ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { preferredCurrency, countryCode, timezone, energyZone } = body;

    if (
      !preferredCurrency &&
      !countryCode &&
      !timezone &&
      !energyZone
    ) {
      return NextResponse.json(
        {
          error: 'At least one field must be provided for update',
          code: 'NO_FIELDS_PROVIDED',
        },
        { status: 400 }
      );
    }

    if (preferredCurrency !== undefined) {
      if (
        typeof preferredCurrency !== 'string' ||
        preferredCurrency.trim() === ''
      ) {
        return NextResponse.json(
          {
            error: 'Preferred currency must be a non-empty string',
            code: 'INVALID_CURRENCY',
          },
          { status: 400 }
        );
      }

      if (preferredCurrency.length !== 3 || !/^[A-Z]{3}$/.test(preferredCurrency)) {
        return NextResponse.json(
          {
            error: 'Preferred currency must be a valid 3-letter uppercase currency code',
            code: 'INVALID_CURRENCY_FORMAT',
          },
          { status: 400 }
        );
      }
    }

    if (countryCode !== undefined) {
      if (typeof countryCode !== 'string' || countryCode.trim() === '') {
        return NextResponse.json(
          {
            error: 'Country code must be a non-empty string',
            code: 'INVALID_COUNTRY_CODE',
          },
          { status: 400 }
        );
      }

      if (countryCode.length !== 2 || !/^[A-Z]{2}$/.test(countryCode)) {
        return NextResponse.json(
          {
            error: 'Country code must be a valid 2-letter uppercase ISO country code',
            code: 'INVALID_COUNTRY_CODE_FORMAT',
          },
          { status: 400 }
        );
      }
    }

    if (timezone !== undefined) {
      if (typeof timezone !== 'string' || timezone.trim() === '') {
        return NextResponse.json(
          {
            error: 'Timezone must be a non-empty string',
            code: 'INVALID_TIMEZONE',
          },
          { status: 400 }
        );
      }

      if (!/^[A-Za-z_]+\/[A-Za-z_]+$/.test(timezone)) {
        return NextResponse.json(
          {
            error: 'Timezone must be a valid IANA timezone format (e.g., America/New_York)',
            code: 'INVALID_TIMEZONE_FORMAT',
          },
          { status: 400 }
        );
      }
    }

    if (energyZone !== undefined) {
      if (typeof energyZone !== 'string' || energyZone.trim() === '') {
        return NextResponse.json(
          {
            error: 'Energy zone must be a non-empty string',
            code: 'INVALID_ENERGY_ZONE',
          },
          { status: 400 }
        );
      }
    }

    const existingUser = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const updates: {
      preferredCurrency?: string | null;
      countryCode?: string | null;
      timezone?: string | null;
      energyZone?: string | null;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (preferredCurrency !== undefined) {
      updates.preferredCurrency = preferredCurrency;
    }
    if (countryCode !== undefined) {
      updates.countryCode = countryCode;
    }
    if (timezone !== undefined) {
      updates.timezone = timezone;
    }
    if (energyZone !== undefined) {
      updates.energyZone = energyZone;
    }

    const updated = await db
      .update(user)
      .set(updates)
      .where(eq(user.id, id))
      .returning({
        preferredCurrency: user.preferredCurrency,
        countryCode: user.countryCode,
        timezone: user.timezone,
        energyZone: user.energyZone,
      });

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update user preferences', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        preferences: updated[0],
        message: 'Preferences updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('PUT preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}