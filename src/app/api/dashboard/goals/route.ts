import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sustainabilityGoalsProgress, user } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

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

function calculateProgressPercentage(
  goalType: GoalType,
  currentValue: number,
  targetValue: number,
  startValue?: number
): number {
  let progress = 0;

  if (INCREASE_GOALS.includes(goalType)) {
    // For increase goals: (current / target) * 100
    progress = (currentValue / targetValue) * 100;
  } else {
    // For reduction goals: ((start - current) / (start - target)) * 100
    // If no start value, assume current is the start
    const start = startValue ?? currentValue;
    if (start === targetValue) {
      progress = 100;
    } else {
      progress = ((start - currentValue) / (start - targetValue)) * 100;
    }
  }

  // Clamp between 0 and 100
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
    const userId = searchParams.get('userId');

    if (!userId || userId.trim() === '') {
      return NextResponse.json({ 
        error: 'userId is required',
        code: 'MISSING_USER_ID' 
      }, { status: 400 });
    }

    // Validate user exists
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

    // Fetch all goals for user
    const goals = await db.select()
      .from(sustainabilityGoalsProgress)
      .where(eq(sustainabilityGoalsProgress.userId, userId));

    const currentYear = new Date().getFullYear();

    // Calculate additional metrics for each goal
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

    // Calculate summary statistics
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
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, goalType, targetValue, currentValue, targetYear } = body;

    // Validate required fields
    if (!userId || userId.trim() === '') {
      return NextResponse.json({ 
        error: 'userId is required',
        code: 'MISSING_USER_ID' 
      }, { status: 400 });
    }

    if (!goalType) {
      return NextResponse.json({ 
        error: 'goalType is required',
        code: 'MISSING_GOAL_TYPE' 
      }, { status: 400 });
    }

    if (!VALID_GOAL_TYPES.includes(goalType as GoalType)) {
      return NextResponse.json({ 
        error: `goalType must be one of: ${VALID_GOAL_TYPES.join(', ')}`,
        code: 'INVALID_GOAL_TYPE' 
      }, { status: 400 });
    }

    if (targetValue === undefined || targetValue === null) {
      return NextResponse.json({ 
        error: 'targetValue is required',
        code: 'MISSING_TARGET_VALUE' 
      }, { status: 400 });
    }

    if (targetValue <= 0) {
      return NextResponse.json({ 
        error: 'targetValue must be greater than 0',
        code: 'INVALID_TARGET_VALUE' 
      }, { status: 400 });
    }

    if (currentValue === undefined || currentValue === null) {
      return NextResponse.json({ 
        error: 'currentValue is required',
        code: 'MISSING_CURRENT_VALUE' 
      }, { status: 400 });
    }

    if (currentValue < 0) {
      return NextResponse.json({ 
        error: 'currentValue must be greater than or equal to 0',
        code: 'INVALID_CURRENT_VALUE' 
      }, { status: 400 });
    }

    if (!targetYear) {
      return NextResponse.json({ 
        error: 'targetYear is required',
        code: 'MISSING_TARGET_YEAR' 
      }, { status: 400 });
    }

    const currentYear = new Date().getFullYear();

    if (targetYear < currentYear) {
      return NextResponse.json({ 
        error: 'targetYear must be greater than or equal to current year',
        code: 'INVALID_TARGET_YEAR' 
      }, { status: 400 });
    }

    if (targetYear > currentYear + 30) {
      return NextResponse.json({ 
        error: 'targetYear must be within 30 years from now',
        code: 'TARGET_YEAR_TOO_FAR' 
      }, { status: 400 });
    }

    // Validate goal type logic
    if (REDUCTION_GOALS.includes(goalType as GoalType) && targetValue >= currentValue) {
      return NextResponse.json({ 
        error: `For ${goalType} goals, targetValue should be less than currentValue (reduction goal)`,
        code: 'INVALID_REDUCTION_GOAL' 
      }, { status: 400 });
    }

    if (INCREASE_GOALS.includes(goalType as GoalType) && targetValue < currentValue) {
      return NextResponse.json({ 
        error: `For ${goalType} goals, targetValue should be greater than or equal to currentValue (increase goal)`,
        code: 'INVALID_INCREASE_GOAL' 
      }, { status: 400 });
    }

    // Validate user exists
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

    // Calculate progress percentage
    const progressPercentage = calculateProgressPercentage(
      goalType as GoalType,
      currentValue,
      targetValue,
      currentValue // Using currentValue as start for new goals
    );

    const timestamp = new Date().toISOString();

    // Check if goal already exists for this user and goal type
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
      // Update existing goal
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
      // Insert new goal
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

    // Enrich with calculated fields
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
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        error: 'id is required',
        code: 'MISSING_ID' 
      }, { status: 400 });
    }

    const goalId = parseInt(id);
    if (isNaN(goalId)) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    // Check if goal exists
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

    // Delete the goal
    const deleted = await db.delete(sustainabilityGoalsProgress)
      .where(eq(sustainabilityGoalsProgress.id, goalId))
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Goal deleted successfully',
      deletedGoal: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}