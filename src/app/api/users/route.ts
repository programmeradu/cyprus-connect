import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { bindSessionUser } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // Only the signed-in account may be read. Listing/searching all accounts is not exposed.
    const auth = await bindSessionUser(request, searchParams.get('id'));
    if (!auth.ok) return auth.response;

    const userRecord = await db.select().from(user).where(eq(user.id, auth.userId)).limit(1);
    if (userRecord.length === 0) {
      return NextResponse.json({ error: 'User not found', code: 'USER_NOT_FOUND' }, { status: 404 });
    }
    return NextResponse.json(userRecord[0], { status: 200 });
  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST() {
  // Accounts are created by the sign-in flow, never by an open endpoint.
  return NextResponse.json(
    { error: 'Accounts are created through sign-in', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  );
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const auth = await bindSessionUser(request, searchParams.get('id'));
    if (!auth.ok) return auth.response;
    const id = auth.userId;

    const body = await request.json();
    const { name, companyName, companyIndustry, teamSize, sustainabilityGoals, onboardingCompleted, countryCode } = body;

    // Check if user exists
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Validate that email and totalCredits are not being updated
    if ('email' in body) {
      return NextResponse.json(
        { error: 'Email cannot be updated through this endpoint', code: 'EMAIL_UPDATE_NOT_ALLOWED' },
        { status: 400 }
      );
    }

    if ('totalCredits' in body || 'total_credits' in body) {
      return NextResponse.json(
        { error: 'Total credits cannot be updated through this endpoint', code: 'CREDITS_UPDATE_NOT_ALLOWED' },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    const updates: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) {
      if (!name || name.trim() === '') {
        return NextResponse.json(
          { error: 'Name cannot be empty', code: 'INVALID_NAME' },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }

    if (companyName !== undefined) {
      updates.companyName = companyName ? companyName.trim() : null;
    }

    if (companyIndustry !== undefined) {
      updates.companyIndustry = companyIndustry ? companyIndustry.trim() : null;
    }

    if (teamSize !== undefined) {
      updates.teamSize = teamSize ? teamSize.trim() : null;
    }

    if (countryCode !== undefined) {
      updates.countryCode = countryCode ? countryCode.trim().toUpperCase() : null;
    }

    if (sustainabilityGoals !== undefined) {
      if (sustainabilityGoals === null) {
        updates.sustainabilityGoals = null;
      } else {
        try {
          if (Array.isArray(sustainabilityGoals)) {
            updates.sustainabilityGoals = JSON.stringify(sustainabilityGoals);
          } else if (typeof sustainabilityGoals === 'string') {
            JSON.parse(sustainabilityGoals);
            updates.sustainabilityGoals = sustainabilityGoals;
          } else {
            return NextResponse.json(
              { error: 'Sustainability goals must be an array or JSON string', code: 'INVALID_GOALS_FORMAT' },
              { status: 400 }
            );
          }
        } catch (e) {
          return NextResponse.json(
            { error: 'Invalid sustainability goals format', code: 'INVALID_GOALS_JSON' },
            { status: 400 }
          );
        }
      }
    }

    if (onboardingCompleted !== undefined) {
      if (typeof onboardingCompleted !== 'boolean') {
        return NextResponse.json(
          { error: 'onboardingCompleted must be a boolean', code: 'INVALID_ONBOARDING_COMPLETED' },
          { status: 400 }
        );
      }
      updates.onboardingCompleted = onboardingCompleted;
    }

    // Update user
    const updatedUser = await db
      .update(user)
      .set(updates)
      .where(eq(user.id, id))
      .returning();

    return NextResponse.json(updatedUser[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const auth = await bindSessionUser(request, searchParams.get('id'));
    if (!auth.ok) return auth.response;
    const id = auth.userId;

    // Check if user exists
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete user (cascade will handle related records)
    const deleted = await db
      .delete(user)
      .where(eq(user.id, id))
      .returning();

    return NextResponse.json(
      {
        message: 'User deleted successfully',
        user: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}