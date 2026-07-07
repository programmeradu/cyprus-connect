import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { actions } from '@/db/schema';
import { eq, like, and, or, desc, asc, isNull } from 'drizzle-orm';

const VALID_CATEGORIES = ['energy', 'waste', 'water', 'operations'];
const VALID_IMPACTS = ['high', 'medium', 'low'];
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    // Single record by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const action = await db.select()
        .from(actions)
        .where(eq(actions.id, parseInt(id)))
        .limit(1);

      if (action.length === 0) {
        return NextResponse.json({ 
          error: 'Action not found',
          code: 'ACTION_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(action[0], { status: 200 });
    }

    // List with optional filters
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const search = searchParams.get('search');

    const conditions: ReturnType<typeof eq>[] = [];

    // Filter by userId: return global actions (userId IS NULL) AND user-specific actions
    if (userId && userId.trim() !== '') {
      conditions.push(
        or(
          isNull(actions.userId),
          eq(actions.userId, userId)
        )!
      );
    } else {
      // If no userId provided, only return global actions
      conditions.push(isNull(actions.userId));
    }

    // Apply category filter
    if (category) {
      if (!VALID_CATEGORIES.includes(category.toLowerCase())) {
        return NextResponse.json({ 
          error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
          code: 'INVALID_CATEGORY' 
        }, { status: 400 });
      }
      conditions.push(eq(actions.category, category.toLowerCase()));
    }

    // Apply difficulty filter
    if (difficulty) {
      if (!VALID_DIFFICULTIES.includes(difficulty.toLowerCase())) {
        return NextResponse.json({ 
          error: `Invalid difficulty. Must be one of: ${VALID_DIFFICULTIES.join(', ')}`,
          code: 'INVALID_DIFFICULTY' 
        }, { status: 400 });
      }
      conditions.push(eq(actions.difficulty, difficulty.toLowerCase()));
    }

    // Apply search filter
    if (search) {
      const searchCondition = or(
        like(actions.title, `%${search}%`),
        like(actions.description, `%${search}%`)
      );
      conditions.push(searchCondition!);
    }

    // Execute query with all conditions
    const results = await db
      .select()
      .from(actions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(actions.id));

    return NextResponse.json(results, { status: 200 });
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
    const { title, description, category, impact, difficulty, points, iconName, userId } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json({ 
        error: "Title is required",
        code: "MISSING_TITLE" 
      }, { status: 400 });
    }

    if (!description) {
      return NextResponse.json({ 
        error: "Description is required",
        code: "MISSING_DESCRIPTION" 
      }, { status: 400 });
    }

    if (!category) {
      return NextResponse.json({ 
        error: "Category is required",
        code: "MISSING_CATEGORY" 
      }, { status: 400 });
    }

    if (!impact) {
      return NextResponse.json({ 
        error: "Impact is required",
        code: "MISSING_IMPACT" 
      }, { status: 400 });
    }

    if (!difficulty) {
      return NextResponse.json({ 
        error: "Difficulty is required",
        code: "MISSING_DIFFICULTY" 
      }, { status: 400 });
    }

    if (points === undefined || points === null) {
      return NextResponse.json({ 
        error: "Points is required",
        code: "MISSING_POINTS" 
      }, { status: 400 });
    }

    if (!iconName) {
      return NextResponse.json({ 
        error: "Icon name is required",
        code: "MISSING_ICON_NAME" 
      }, { status: 400 });
    }

    // Validate category
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ 
        error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
        code: "INVALID_CATEGORY" 
      }, { status: 400 });
    }

    // Validate impact
    if (!VALID_IMPACTS.includes(impact)) {
      return NextResponse.json({ 
        error: `Invalid impact. Must be one of: ${VALID_IMPACTS.join(', ')}`,
        code: "INVALID_IMPACT" 
      }, { status: 400 });
    }

    // Validate difficulty
    if (!VALID_DIFFICULTIES.includes(difficulty)) {
      return NextResponse.json({ 
        error: `Invalid difficulty. Must be one of: ${VALID_DIFFICULTIES.join(', ')}`,
        code: "INVALID_DIFFICULTY" 
      }, { status: 400 });
    }

    // Validate points is positive integer
    const pointsValue = parseInt(points);
    if (isNaN(pointsValue) || pointsValue <= 0) {
      return NextResponse.json({ 
        error: "Points must be a positive integer",
        code: "INVALID_POINTS" 
      }, { status: 400 });
    }

    // Validate userId if provided (optional for global actions)
    if (userId !== undefined && userId !== null) {
      if (typeof userId !== 'string' || userId.trim() === '') {
        return NextResponse.json({ 
          error: "userId must be a valid non-empty string",
          code: "INVALID_USER_ID" 
        }, { status: 400 });
      }
    }

    // Create new action with sanitized data
    const newAction = await db.insert(actions)
      .values({
        title: title.trim(),
        description: description.trim(),
        category,
        impact,
        difficulty,
        points: pointsValue,
        iconName,
        isCustom: true,
        userId: userId && userId.trim() !== '' ? userId.trim() : null,
        createdAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newAction[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}