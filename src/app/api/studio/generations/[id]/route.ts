import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { mediaGenerations } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Bearer token validation helper
function validateBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

// GET - Get single generation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate Bearer token
    const token = validateBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Validate ID
    const generationId = parseInt(id);
    if (!id || isNaN(generationId)) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Query the generation
    const generation = await db.select()
      .from(mediaGenerations)
      .where(eq(mediaGenerations.id, generationId))
      .limit(1);

    if (generation.length === 0) {
      return NextResponse.json(
        { error: 'Generation not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(generation[0], { status: 200 });

  } catch (error) {
    console.error('GET generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// PATCH - Update generation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate Bearer token
    const token = validateBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Validate ID
    const generationId = parseInt(id);
    if (!id || isNaN(generationId)) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { edited, editParameters, saved } = body;

    // Validate editParameters is valid JSON if provided
    if (editParameters !== undefined && editParameters !== null) {
      try {
        JSON.parse(editParameters);
      } catch {
        return NextResponse.json(
          { error: 'editParameters must be valid JSON', code: 'INVALID_JSON' },
          { status: 400 }
        );
      }
    }

    // Validate edited is boolean if provided
    if (edited !== undefined && typeof edited !== 'boolean') {
      return NextResponse.json(
        { error: 'edited must be a boolean', code: 'INVALID_TYPE' },
        { status: 400 }
      );
    }

    // Validate saved is boolean if provided
    if (saved !== undefined && typeof saved !== 'boolean') {
      return NextResponse.json(
        { error: 'saved must be a boolean', code: 'INVALID_TYPE' },
        { status: 400 }
      );
    }

    // Check if generation exists
    const existing = await db.select()
      .from(mediaGenerations)
      .where(eq(mediaGenerations.id, generationId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Generation not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Build update object
    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString()
    };

    if (edited !== undefined) {
      updates.edited = edited;
    }

    if (editParameters !== undefined) {
      updates.editParameters = editParameters;
    }

    if (saved !== undefined) {
      updates.saved = saved;
    }

    // Update the generation
    const updated = await db.update(mediaGenerations)
      .set(updates)
      .where(eq(mediaGenerations.id, generationId))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });

  } catch (error) {
    console.error('PATCH generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Delete generation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate Bearer token
    const token = validateBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Validate ID
    const generationId = parseInt(id);
    if (!id || isNaN(generationId)) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if generation exists
    const existing = await db.select()
      .from(mediaGenerations)
      .where(eq(mediaGenerations.id, generationId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Generation not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete the generation
    const deleted = await db.delete(mediaGenerations)
      .where(eq(mediaGenerations.id, generationId))
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: 'Generation deleted successfully',
        generation: deleted[0]
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('DELETE generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}