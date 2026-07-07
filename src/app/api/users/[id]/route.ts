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
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(userRecord[0], { status: 200 });
  } catch (error) {
    console.error('GET user error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const {
      companyName,
      companyIndustry,
      teamSize,
      sustainabilityGoals,
      preferredCurrency,
      countryCode,
      energyZone,
      onboardingCompleted,
    } = body;

    // Check if user exists
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
      return NextResponse.json(
        { error: 'Failed to update user', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: updated[0],
        message: 'User updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('PATCH user error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
