import { bindSessionUser } from "@/lib/api-auth";
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { readJson } from '@/lib/validate';
import { logger } from '@/lib/log';

const log = logger('users.[id].preferences');

const updateSchema = z.object({
  preferredCurrency: z.string().trim().regex(/^[A-Z]{3}$/, 'Preferred currency must be a valid 3-letter uppercase currency code').optional(),
  countryCode: z.string().trim().regex(/^[A-Z]{2}$/, 'Country code must be a valid 2-letter uppercase ISO country code').optional(),
  timezone: z.string().trim().regex(/^[A-Za-z_]+\/[A-Za-z_]+$/, 'Timezone must be a valid IANA timezone format (e.g., America/New_York)').optional(),
  energyZone: z.string().trim().min(1).max(100).optional(),
}).refine(
  (v) => v.preferredCurrency || v.countryCode || v.timezone || v.energyZone,
  { message: 'At least one field must be provided for update' }
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: claimedId } = await params;
    const __auth = await bindSessionUser(request, claimedId);
    if (!__auth.ok) return __auth.response;
    const id = __auth.userId;

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
    const ref = log.error('GET preferences error', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.', ref },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: claimedId } = await params;
    const __auth = await bindSessionUser(request, claimedId);
    if (!__auth.ok) return __auth.response;
    const id = __auth.userId;

    const bodyResult = await readJson(request, updateSchema);
    if (!bodyResult.ok) return bodyResult.response;
    const { preferredCurrency, countryCode, timezone, energyZone } = bodyResult.data;

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

    if (preferredCurrency !== undefined) updates.preferredCurrency = preferredCurrency;
    if (countryCode !== undefined) updates.countryCode = countryCode;
    if (timezone !== undefined) updates.timezone = timezone;
    if (energyZone !== undefined) updates.energyZone = energyZone;

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
      const ref = log.error('Failed to update user preferences');
      return NextResponse.json(
        { error: 'Failed to update user preferences.', ref },
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
    const ref = log.error('PUT preferences error', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.', ref },
      { status: 500 }
    );
  }
}
