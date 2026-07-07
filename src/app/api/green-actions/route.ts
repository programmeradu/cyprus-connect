import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { greenActions } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Validate ID is a valid integer
      if (isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      // Get single action by ID
      const action = await db
        .select()
        .from(greenActions)
        .where(eq(greenActions.id, parseInt(id)))
        .limit(1);

      if (action.length === 0) {
        return NextResponse.json(
          { error: 'Green action not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(action[0], { status: 200 });
    }

    // Get all actions ordered by orderIndex
    const actions = await db
      .select()
      .from(greenActions)
      .orderBy(asc(greenActions.orderIndex));

    return NextResponse.json(actions, { status: 200 });
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
    const { title, impact, credits, orderIndex } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required', code: 'MISSING_TITLE' },
        { status: 400 }
      );
    }

    if (!impact) {
      return NextResponse.json(
        { error: 'Impact is required', code: 'MISSING_IMPACT' },
        { status: 400 }
      );
    }

    if (credits === undefined || credits === null) {
      return NextResponse.json(
        { error: 'Credits is required', code: 'MISSING_CREDITS' },
        { status: 400 }
      );
    }

    if (orderIndex === undefined || orderIndex === null) {
      return NextResponse.json(
        { error: 'Order index is required', code: 'MISSING_ORDER_INDEX' },
        { status: 400 }
      );
    }

    // Validate credits is a positive integer
    const creditsNum = parseInt(credits);
    if (isNaN(creditsNum) || creditsNum <= 0) {
      return NextResponse.json(
        { error: 'Credits must be a positive integer', code: 'INVALID_CREDITS' },
        { status: 400 }
      );
    }

    // Validate orderIndex is an integer
    const orderIndexNum = parseInt(orderIndex);
    if (isNaN(orderIndexNum)) {
      return NextResponse.json(
        { error: 'Order index must be an integer', code: 'INVALID_ORDER_INDEX' },
        { status: 400 }
      );
    }

    // Sanitize string inputs
    const sanitizedTitle = title.trim();
    const sanitizedImpact = impact.trim();

    // Create new green action
    const newAction = await db
      .insert(greenActions)
      .values({
        title: sanitizedTitle,
        impact: sanitizedImpact,
        credits: creditsNum,
        orderIndex: orderIndexNum,
      })
      .returning();

    return NextResponse.json(newAction[0], { status: 201 });
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

    // Validate ID parameter is provided and valid
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, impact, credits, orderIndex } = body;

    // Check if action exists
    const existingAction = await db
      .select()
      .from(greenActions)
      .where(eq(greenActions.id, parseInt(id)))
      .limit(1);

    if (existingAction.length === 0) {
      return NextResponse.json(
        { error: 'Green action not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Build update object with only provided fields
    const updates: any = {};

    if (title !== undefined) {
      updates.title = title.trim();
    }

    if (impact !== undefined) {
      updates.impact = impact.trim();
    }

    if (credits !== undefined) {
      const creditsNum = parseInt(credits);
      if (isNaN(creditsNum) || creditsNum <= 0) {
        return NextResponse.json(
          { error: 'Credits must be a positive integer', code: 'INVALID_CREDITS' },
          { status: 400 }
        );
      }
      updates.credits = creditsNum;
    }

    if (orderIndex !== undefined) {
      const orderIndexNum = parseInt(orderIndex);
      if (isNaN(orderIndexNum)) {
        return NextResponse.json(
          { error: 'Order index must be an integer', code: 'INVALID_ORDER_INDEX' },
          { status: 400 }
        );
      }
      updates.orderIndex = orderIndexNum;
    }

    // Update action
    const updatedAction = await db
      .update(greenActions)
      .set(updates)
      .where(eq(greenActions.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedAction[0], { status: 200 });
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

    // Validate ID parameter is provided and valid
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if action exists before deleting
    const existingAction = await db
      .select()
      .from(greenActions)
      .where(eq(greenActions.id, parseInt(id)))
      .limit(1);

    if (existingAction.length === 0) {
      return NextResponse.json(
        { error: 'Green action not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete action
    const deleted = await db
      .delete(greenActions)
      .where(eq(greenActions.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Green action deleted successfully',
        deletedAction: deleted[0],
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