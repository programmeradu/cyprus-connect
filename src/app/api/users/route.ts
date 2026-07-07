import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq, like, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single user fetch by ID
    if (id) {
      if (!id || id.trim() === '') {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const userRecord = await db
        .select()
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
    }

    // List users with pagination and search
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');

    let query = db.select().from(user);

    if (search) {
      query = query.where(
        or(
          like(user.name, `%${search}%`),
          like(user.email, `%${search}%`),
          like(user.companyName, `%${search}%`)
        )
      ) as any;
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
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
    const { email, name, companyName, companyIndustry, teamSize, sustainabilityGoals } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required', code: 'MISSING_EMAIL' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required', code: 'MISSING_NAME' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format', code: 'INVALID_EMAIL' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedName = name.trim();

    // Check if email already exists
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, sanitizedEmail))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Email already exists', code: 'EMAIL_EXISTS' },
        { status: 409 }
      );
    }

    // Validate and stringify sustainabilityGoals if provided
    let sustainabilityGoalsString = null;
    if (sustainabilityGoals) {
      try {
        if (Array.isArray(sustainabilityGoals)) {
          sustainabilityGoalsString = JSON.stringify(sustainabilityGoals);
        } else if (typeof sustainabilityGoals === 'string') {
          JSON.parse(sustainabilityGoals);
          sustainabilityGoalsString = sustainabilityGoals;
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

    // Generate a unique ID (better-auth uses text IDs)
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create new user with auto-generated fields
    const newUser = await db
      .insert(user)
      .values({
        id: userId,
        email: sanitizedEmail,
        name: sanitizedName,
        emailVerified: false,
        image: null,
        companyName: companyName ? companyName.trim() : null,
        companyIndustry: companyIndustry ? companyIndustry.trim() : null,
        teamSize: teamSize ? teamSize.trim() : null,
        sustainabilityGoals: sustainabilityGoalsString,
        totalCredits: 0,
        onboardingCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(newUser[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || id.trim() === '') {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

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
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || id.trim() === '') {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

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
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}