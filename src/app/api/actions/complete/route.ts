import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, actions, userActions, creditsHistory } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createNotification, NotificationTemplates } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, actionId, notes } = body;

    // Validate required fields
    if (!userId || !actionId) {
      return NextResponse.json(
        { 
          error: 'Missing required fields: userId and actionId are required',
          code: 'MISSING_REQUIRED_FIELDS'
        },
        { status: 400 }
      );
    }

    // Validate userId is a non-empty string
    if (typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json(
        { 
          error: 'userId must be a valid non-empty string',
          code: 'INVALID_USER_ID'
        },
        { status: 400 }
      );
    }

    // Validate actionId is valid integer
    const actionIdInt = parseInt(actionId);
    if (isNaN(actionIdInt)) {
      return NextResponse.json(
        { 
          error: 'actionId must be a valid integer',
          code: 'INVALID_ACTION_ID'
        },
        { status: 400 }
      );
    }

    // Step 1: Validate user exists
    const existingUser = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { 
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    const userRecord = existingUser[0];

    // Step 2: Validate action exists and get points value
    const existingAction = await db.select()
      .from(actions)
      .where(eq(actions.id, actionIdInt))
      .limit(1);

    if (existingAction.length === 0) {
      return NextResponse.json(
        { 
          error: 'Action not found',
          code: 'ACTION_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    const action = existingAction[0];

    // Step 3: Check if user already completed this action
    const existingUserAction = await db.select()
      .from(userActions)
      .where(
        and(
          eq(userActions.userId, userId),
          eq(userActions.actionId, actionIdInt)
        )
      )
      .limit(1);

    if (existingUserAction.length > 0) {
      return NextResponse.json(
        { 
          error: 'Action already completed by this user',
          code: 'ACTION_ALREADY_COMPLETED'
        },
        { status: 409 }
      );
    }

    const completedAt = new Date().toISOString();
    const pointsAwarded = action.points;

    try {
      // Step 4: Insert into user_actions table
      const newUserAction = await db.insert(userActions)
        .values({
          userId: userId,
          actionId: actionIdInt,
          completedAt,
          notes: notes || null
        })
        .returning();

      if (newUserAction.length === 0) {
        throw new Error('Failed to create user action record');
      }

      // Step 5: Insert into credits_history table
      const newCreditsHistory = await db.insert(creditsHistory)
        .values({
          userId: userId,
          amount: pointsAwarded,
          source: 'action_completed',
          actionId: actionIdInt,
          description: `Completed: ${action.title}`,
          createdAt: completedAt
        })
        .returning();

      if (newCreditsHistory.length === 0) {
        // Rollback: Delete the user action
        await db.delete(userActions)
          .where(eq(userActions.id, newUserAction[0].id));
        throw new Error('Failed to create credits history record');
      }

      // Step 6: Update user table - increment totalCredits
      const newTotalCredits = userRecord.totalCredits + pointsAwarded;
      const updatedUser = await db.update(user)
        .set({
          totalCredits: newTotalCredits,
          updatedAt: new Date()
        })
        .where(eq(user.id, userId))
        .returning();

      if (updatedUser.length === 0) {
        // Rollback: Delete credits history and user action
        await db.delete(creditsHistory)
          .where(eq(creditsHistory.id, newCreditsHistory[0].id));
        await db.delete(userActions)
          .where(eq(userActions.id, newUserAction[0].id));
        throw new Error('Failed to update user credits');
      }

      // Send notification for action completion
      await createNotification({
        userId,
        ...NotificationTemplates.actionCompleted({
          actionTitle: action.title,
          points: pointsAwarded,
          link: '/app/actions'
        })
      });

      // Return success response
      return NextResponse.json(
        {
          success: true,
          userAction: newUserAction[0],
          creditsAwarded: pointsAwarded,
          newTotalCredits
        },
        { status: 201 }
      );

    } catch (transactionError) {
      console.error('Transaction error:', transactionError);
      
      // Attempt to rollback any partial changes
      try {
        await db.delete(creditsHistory)
          .where(
            and(
              eq(creditsHistory.userId, userId),
              eq(creditsHistory.actionId, actionIdInt),
              eq(creditsHistory.createdAt, completedAt)
            )
          );
        
        await db.delete(userActions)
          .where(
            and(
              eq(userActions.userId, userId),
              eq(userActions.actionId, actionIdInt),
              eq(userActions.completedAt, completedAt)
            )
          );
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError);
      }

      return NextResponse.json(
        { 
          error: 'Transaction failed: ' + (transactionError as Error).message,
          code: 'TRANSACTION_FAILED'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error as Error).message 
      },
      { status: 500 }
    );
  }
}