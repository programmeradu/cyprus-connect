import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { user, actions, userActions, creditsHistory } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createNotification, NotificationTemplates } from '@/lib/notifications';
import { bindSessionUser } from "@/lib/api-auth";
import { readJson } from "@/lib/validate";
import { logger } from "@/lib/log";

const log = logger("actions.complete");

const bodySchema = z.object({
  userId: z.string().trim().min(1).max(100).optional(),
  actionId: z.union([z.number().int(), z.string().trim().min(1).max(20)]),
  notes: z.string().max(2000).optional().nullable(),
});

export async function POST(request: NextRequest) {
  const parsed = await readJson(request, bodySchema);
  if (!parsed.ok) return parsed.response;
  const { userId: __claimedUserId, actionId, notes } = parsed.data;

  const __auth = await bindSessionUser(request, __claimedUserId);
  if (!__auth.ok) return __auth.response;
  const userId = __auth.userId;

  const actionIdInt = typeof actionId === "number" ? actionId : parseInt(actionId, 10);
  if (isNaN(actionIdInt)) {
    return NextResponse.json(
      { error: 'actionId must be a valid integer', code: 'INVALID_ACTION_ID' },
      { status: 400 }
    );
  }

  try {
    const existingUser = await db.select()
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

    const existingAction = await db.select()
      .from(actions)
      .where(eq(actions.id, actionIdInt))
      .limit(1);

    if (existingAction.length === 0) {
      return NextResponse.json(
        { error: 'Action not found', code: 'ACTION_NOT_FOUND' },
        { status: 404 }
      );
    }

    const action = existingAction[0];

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
        { error: 'Action already completed by this user', code: 'ACTION_ALREADY_COMPLETED' },
        { status: 409 }
      );
    }

    const completedAt = new Date().toISOString();
    const pointsAwarded = action.points;

    try {
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
        await db.delete(userActions)
          .where(eq(userActions.id, newUserAction[0].id));
        throw new Error('Failed to create credits history record');
      }

      const newTotalCredits = userRecord.totalCredits + pointsAwarded;
      const updatedUser = await db.update(user)
        .set({
          totalCredits: newTotalCredits,
          updatedAt: new Date()
        })
        .where(eq(user.id, userId))
        .returning();

      if (updatedUser.length === 0) {
        await db.delete(creditsHistory)
          .where(eq(creditsHistory.id, newCreditsHistory[0].id));
        await db.delete(userActions)
          .where(eq(userActions.id, newUserAction[0].id));
        throw new Error('Failed to update user credits');
      }

      await createNotification({
        userId,
        ...NotificationTemplates.actionCompleted({
          actionTitle: action.title,
          points: pointsAwarded,
          link: '/app/actions'
        })
      });

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
        log.error('Rollback error', rollbackError);
      }

      const ref = log.error('Transaction failed', transactionError);
      return NextResponse.json(
        { error: 'The action could not be completed.', ref, code: 'TRANSACTION_FAILED' },
        { status: 500 }
      );
    }

  } catch (error) {
    const ref = log.error('POST error', error);
    return NextResponse.json({ error: 'Internal server error', ref }, { status: 500 });
  }
}
