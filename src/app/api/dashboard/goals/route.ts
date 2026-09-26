import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { sustainabilityGoalsProgress, user } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { bindSessionUser } from "@/lib/api-auth";
import { readJson, parseValue } from '@/lib/validate';
import { logger } from '@/lib/log';

const log = logger("api.dashboard.goals");

const VALID_GOAL_TYPES = ['carbon-neutral', 'reduce-energy', 'zero-waste', 'renewable-100'] as const;
type GoalType = typeof VALID_GOAL_TYPES[number];

const GOAL_UNITS: Record<GoalType, string> = {
  'carbon-neutral': 'tons CO2e',
  'reduce-energy': 'kWh',
  'zero-waste': '% diverted',
  'renewable-100': '% renewable'
};

const REDUCTION_GOALS: GoalType[] = ['carbon-neutral', 'reduce-energy'];
const INCREASE_GOALS: GoalType[] = ['zero-waste', 'renewable-100'];

const currentYear = new Date().getFullYear();

const postSchema = z.object({
  userId: z.string().trim().min(1).max(200).optional(),
  goalType: z.enum(VALID_GOAL_TYPES),
  targetValue: z.number().finite().gt(0).max(1_000_000_000),
  currentValue: z.number().finite().min(0).max(1_000_000_000),
  targetYear: z.number().int().min(currentYear).max(currentYear + 30),
});

const idSchema = z.coerce.number().int().positive();

function calculateProgressPercentage(
  goalType: GoalType,
  currentValue: number,
  targetValue: number,
  startValue?: number
): number {
  let progress = 0;

  if (INCREASE_GOALS.includes(goalType)) {
    progress = (currentValue / targetValue) * 100;
  } else {
    const start = startValue ?? currentValue;
    if (start === targetValue) {
      progress = 100;
    } else {
      progress = ((start - currentValue) / (start - targetValue)) * 100;
    }
  }

  return Math.max(0, Math.min(100, progress));
}

function calculateStatus(
  progressPercentage: number,
  currentYear: number,
  targetYear: number,
  createdYear: number
): string {
  if (progressPercentage >= 100) {
    return 'completed';
  }

  const totalYears = targetYear - createdYear;
  const yearsElapsed = currentYear - createdYear;

  if (totalYears <= 0) {
    return 'at-risk';
  }

  const expectedProgress = (yearsElapsed / totalYears) * 100;

  if (progressPercentage >= expectedProgress) {
    return 'on-track';
  } else if (progressPercentage >= expectedProgress * 0.5) {
    return 'behind';
  } else {
    return 'at-risk';
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const __auth = await bindSessionUser(request, searchParams.get('userId'));
    if (!__auth.ok) return __auth.response;
    const userId = __auth.userId;

    const userRecord = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      }, { status: 404 });
    }

    const goals = await db.select()
      .from(sustainabilityGoalsProgress)
      .where(eq(sustainabilityGoalsProgress.userId, userId));

    const currentYear = new Date().getFullYear();

    const enrichedGoals = goals.map(goal => {
      const createdYear = new Date(goal.createdAt).getFullYear();
      const yearsRemaining = goal.targetYear - currentYear;
      const totalYears = goal.targetYear - createdYear;
      const yearsElapsed = currentYear - createdYear;

      const expectedProgress = totalYears > 0 ? (yearsElapsed / totalYears) * 100 : 0;
      const isOnTrack = goal.progressPercentage >= expectedProgress;

      const monthlyTargetRate = yearsRemaining > 0
        ? (goal.targetValue - goal.currentValue) / (yearsRemaining * 12)
        : 0;

      const status = calculateStatus(
        goal.progressPercentage,
        currentYear,
        goal.targetYear,
        createdYear
      );

      const unit = GOAL_UNITS[goal.goalType as GoalType] || '';

      return {
        id: goal.id,
        goalType: goal.goalType,
        targetValue: goal.targetValue,
        currentValue: goal.currentValue,
        targetYear: goal.targetYear,
        progressPercentage: goal.progressPercentage,
        yearsRemaining,
        isOnTrack,
        status,
        monthlyTargetRate,
        unit,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt
      };
    });

    const totalGoals = enrichedGoals.length;
    const completedGoals = enrichedGoals.filter(g => g.status === 'completed').length;
    const onTrackGoals = enrichedGoals.filter(g => g.status === 'on-track').length;
    const behindGoals = enrichedGoals.filter(g => g.status === 'behind' || g.status === 'at-risk').length;
    const averageProgress = totalGoals > 0
      ? enrichedGoals.reduce((sum, g) => sum + g.progressPercentage, 0) / totalGoals
      : 0;

    return NextResponse.json({
      success: true,
      goals: enrichedGoals,
      summary: {
        totalGoals,
        completedGoals,
        onTrackGoals,
        behindGoals,
        averageProgress: Math.round(averageProgress * 100) / 100
      }
    }, { status: 200 });

  } catch (error) {
    const ref = log.error('GET /api/dashboard/goals failed', error);
    return NextResponse.json({ error: 'Internal server error', ref }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = await readJson(request, postSchema);
    if (!parsed.ok) return parsed.response;
    const { userId: __claimedUserId, goalType, targetValue, currentValue, targetYear } = parsed.data;
    const __auth = await bindSessionUser(request, __claimedUserId);
    if (!__auth.ok) return __auth.response;
    const userId = __auth.userId;

    if (REDUCTION_GOALS.includes(goalType) && targetValue >= currentValue) {
      return NextResponse.json({
        error: `For ${goalType} goals, targetValue should be less than currentValue (reduction goal)`,
        code: 'INVALID_REDUCTION_GOAL'
      }, { status: 400 });
    }

    if (INCREASE_GOALS.includes(goalType) && targetValue < currentValue) {
      return NextResponse.json({
        error: `For ${goalType} goals, targetValue should be greater than or equal to currentValue (increase goal)`,
        code: 'INVALID_INCREASE_GOAL'
      }, { status: 400 });
    }

    const userRecord = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      }, { status: 404 });
    }

    const progressPercentage = calculateProgressPercentage(
      goalType,
      currentValue,
      targetValue,
      currentValue
    );

    const timestamp = new Date().toISOString();

    const existingGoal = await db.select()
      .from(sustainabilityGoalsProgress)
      .where(
        and(
          eq(sustainabilityGoalsProgress.userId, userId),
          eq(sustainabilityGoalsProgress.goalType, goalType)
        )
      )
      .limit(1);

    let result;

    if (existingGoal.length > 0) {
      const updated = await db.update(sustainabilityGoalsProgress)
        .set({
          targetValue,
          currentValue,
          targetYear,
          progressPercentage,
          updatedAt: timestamp
        })
        .where(eq(sustainabilityGoalsProgress.id, existingGoal[0].id))
        .returning();

      result = updated[0];
    } else {
      const inserted = await db.insert(sustainabilityGoalsProgress)
        .values({
          userId,
          goalType,
          targetValue,
          currentValue,
          targetYear,
          progressPercentage,
          createdAt: timestamp,
          updatedAt: timestamp
        })
        .returning();

      result = inserted[0];
    }

    const createdYear = new Date(result.createdAt).getFullYear();
    const yearsRemaining = result.targetYear - currentYear;
    const totalYears = result.targetYear - createdYear;
    const yearsElapsed = currentYear - createdYear;

    const expectedProgress = totalYears > 0 ? (yearsElapsed / totalYears) * 100 : 0;
    const isOnTrack = result.progressPercentage >= expectedProgress;

    const monthlyTargetRate = yearsRemaining > 0
      ? (result.targetValue - result.currentValue) / (yearsRemaining * 12)
      : 0;

    const status = calculateStatus(
      result.progressPercentage,
      currentYear,
      result.targetYear,
      createdYear
    );

    const unit = GOAL_UNITS[result.goalType as GoalType] || '';

    return NextResponse.json({
      id: result.id,
      goalType: result.goalType,
      targetValue: result.targetValue,
      currentValue: result.currentValue,
      targetYear: result.targetYear,
      progressPercentage: result.progressPercentage,
      yearsRemaining,
      isOnTrack,
      status,
      monthlyTargetRate,
      unit,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt
    }, { status: existingGoal.length > 0 ? 200 : 201 });

  } catch (error) {
    const ref = log.error('POST /api/dashboard/goals failed', error);
    return NextResponse.json({ error: 'Internal server error', ref }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsedId = parseValue(searchParams.get('id'), idSchema);
    if (!parsedId.ok) return parsedId.response;
    const goalId = parsedId.data;

    const existingGoal = await db.select()
      .from(sustainabilityGoalsProgress)
      .where(eq(sustainabilityGoalsProgress.id, goalId))
      .limit(1);

    if (existingGoal.length === 0) {
      return NextResponse.json({
        error: 'Goal not found',
        code: 'GOAL_NOT_FOUND'
      }, { status: 404 });
    }

    const deleted = await db.delete(sustainabilityGoalsProgress)
      .where(eq(sustainabilityGoalsProgress.id, goalId))
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Goal deleted successfully',
      deletedGoal: deleted[0]
    }, { status: 200 });

  } catch (error) {
    const ref = log.error('DELETE /api/dashboard/goals failed', error);
    return NextResponse.json({ error: 'Internal server error', ref }, { status: 500 });
  }
}
