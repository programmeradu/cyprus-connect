import { bindSessionUser } from "@/lib/api-auth";
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { readJson } from "@/lib/validate";
import { logger } from "@/lib/log";

const log = logger("api.users.id");

const patchSchema = z.object({
  companyName: z.string().trim().max(200).nullable().optional(),
  companyIndustry: z.string().trim().max(200).nullable().optional(),
  teamSize: z.string().trim().max(64).nullable().optional(),
  sustainabilityGoals: z.string().max(5000).nullable().optional(),
  preferredCurrency: z.string().trim().length(3).nullable().optional(),
  countryCode: z.string().trim().length(2).nullable().optional(),
  energyZone: z.string().trim().max(64).nullable().optional(),
  onboardingCompleted: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: claimedId } = await params;
    const __auth = await bindSessionUser(request, claimedId);
    if (!__auth.ok) return __auth.response;
    const id = __auth.userId;

    if (!id || typeof id !== 'string' || id.trim() === '') {
      return NextResponse.json({ error: 'Valid user ID is required', code: 'INVALID_ID' }, { status: 400 });
    }

    const userRecord = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        companyName: user.companyName,
        companyIndustry: user.companyIndustry,
        teamSize: user.teamSize,
        totalCredits: user.totalCredits,
        preferredCurrency: user.preferredCurrency,
        countryCode: user.countryCode,
        energyZone: user.energyZone,
        onboardingCompleted: user.onboardingCompleted,
      })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({ error: 'User not found', code: 'USER_NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json(userRecord[0], { status: 200 });
  } catch (error) {
    const ref = log.error('GET /api/users/[id] failed', error);
    return NextResponse.json({ error: 'Internal server error', ref }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: claimedId } = await params;
    const __auth = await bindSessionUser(request, claimedId);
    if (!__auth.ok) return __auth.response;
    const id = __auth.userId;

    if (!id || typeof id !== 'string' || id.trim() === '') {
      return NextResponse.json({ error: 'Valid user ID is required', code: 'INVALID_ID' }, { status: 400 });
    }

    const parsed = await readJson(request, patchSchema);
    if (!parsed.ok) return parsed.response;
    const {
      companyName,
      companyIndustry,
      teamSize,
      sustainabilityGoals,
      preferredCurrency,
      countryCode,
      energyZone,
      onboardingCompleted,
    } = parsed.data;

    const existingUser = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ error: 'User not found', code: 'USER_NOT_FOUND' }, { status: 404 });
    }

    const updates: any = {
      updatedAt: new Date(),
    };

    if (companyName !== undefined) updates.companyName = companyName;
    if (companyIndustry !== undefined) updates.companyIndustry = companyIndustry;
    if (teamSize !== undefined) updates.teamSize = teamSize;
    if (sustainabilityGoals !== undefined) updates.sustainabilityGoals = sustainabilityGoals;
    if (preferredCurrency !== undefined) updates.preferredCurrency = preferredCurrency;
    if (countryCode !== undefined) updates.countryCode = countryCode;
    if (energyZone !== undefined) updates.energyZone = energyZone;
    if (onboardingCompleted !== undefined) updates.onboardingCompleted = onboardingCompleted;

    const updated = await db
      .update(user)
      .set(updates)
      .where(eq(user.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Failed to update user', code: 'UPDATE_FAILED' }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, user: updated[0], message: 'User updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    const ref = log.error('PATCH /api/users/[id] failed', error);
    return NextResponse.json({ error: 'Internal server error', ref }, { status: 500 });
  }
}
