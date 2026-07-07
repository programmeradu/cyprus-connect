import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, creditsHistory, actions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount, source, description, actionId } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    if (!amount && amount !== 0) {
      return NextResponse.json(
        { error: 'amount is required', code: 'MISSING_AMOUNT' },
        { status: 400 }
      );
    }

    if (!source) {
      return NextResponse.json(
        { error: 'source is required', code: 'MISSING_SOURCE' },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json(
        { error: 'description is required', code: 'MISSING_DESCRIPTION' },
        { status: 400 }
      );
    }

    // Validate userId is valid string
    if (typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json(
        { error: 'userId must be a valid non-empty string', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    // Validate amount is valid non-zero integer
    const parsedAmount = parseInt(amount.toString());
    if (isNaN(parsedAmount)) {
      return NextResponse.json(
        { error: 'amount must be a valid integer', code: 'INVALID_AMOUNT' },
        { status: 400 }
      );
    }

    if (parsedAmount === 0) {
      return NextResponse.json(
        { error: 'amount cannot be zero', code: 'ZERO_AMOUNT' },
        { status: 400 }
      );
    }

    // Validate source is non-empty string
    const trimmedSource = source.toString().trim();
    if (!trimmedSource) {
      return NextResponse.json(
        { error: 'source cannot be empty', code: 'EMPTY_SOURCE' },
        { status: 400 }
      );
    }

    // Validate description is non-empty string
    const trimmedDescription = description.toString().trim();
    if (!trimmedDescription) {
      return NextResponse.json(
        { error: 'description cannot be empty', code: 'EMPTY_DESCRIPTION' },
        { status: 400 }
      );
    }

    // Step 1: Validate user exists
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const userRecord = existingUser[0];
    const previousCredits = userRecord.totalCredits;

    // Validate actionId if provided
    let parsedActionId: number | null = null;
    if (actionId !== undefined && actionId !== null) {
      parsedActionId = parseInt(actionId.toString());
      if (isNaN(parsedActionId)) {
        return NextResponse.json(
          { error: 'actionId must be a valid integer', code: 'INVALID_ACTION_ID' },
          { status: 400 }
        );
      }

      const existingAction = await db
        .select()
        .from(actions)
        .where(eq(actions.id, parsedActionId))
        .limit(1);

      if (existingAction.length === 0) {
        return NextResponse.json(
          { error: 'Action not found', code: 'ACTION_NOT_FOUND' },
          { status: 404 }
        );
      }
    }

    // Check that new totalCredits won't be negative
    const newTotalCredits = previousCredits + parsedAmount;
    if (newTotalCredits < 0) {
      return NextResponse.json(
        {
          error: 'Operation would result in negative credits',
          code: 'NEGATIVE_CREDITS_NOT_ALLOWED',
          currentCredits: previousCredits,
          attemptedAmount: parsedAmount,
          resultingCredits: newTotalCredits,
        },
        { status: 400 }
      );
    }

    // Step 3: Insert into credits_history table
    const creditsHistoryData = {
      userId: userId,
      amount: parsedAmount,
      source: trimmedSource,
      description: trimmedDescription,
      ...(parsedActionId !== null && { actionId: parsedActionId }),
      createdAt: new Date().toISOString(),
    };

    const newCreditsHistory = await db
      .insert(creditsHistory)
      .values(creditsHistoryData)
      .returning();

    if (newCreditsHistory.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create credits history record', code: 'HISTORY_INSERT_FAILED' },
        { status: 500 }
      );
    }

    // Step 4: Update user table
    const updatedUser = await db
      .update(user)
      .set({
        totalCredits: newTotalCredits,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))
      .returning();

    if (updatedUser.length === 0) {
      // Rollback: Delete the credits history record we just created
      await db
        .delete(creditsHistory)
        .where(eq(creditsHistory.id, newCreditsHistory[0].id));

      return NextResponse.json(
        { error: 'Failed to update user credits', code: 'USER_UPDATE_FAILED' },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        creditsHistory: newCreditsHistory[0],
        previousCredits,
        newTotalCredits,
        amountAwarded: parsedAmount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}