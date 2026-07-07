import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { integrations } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid integration ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const integrationId = parseInt(id);

    const body = await request.json();

    const existing = await db
      .select()
      .from(integrations)
      .where(eq(integrations.id, integrationId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Integration not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (body.accessToken !== undefined) {
      if (typeof body.accessToken !== 'string' || body.accessToken.trim() === '') {
        return NextResponse.json(
          { error: 'accessToken must be a non-empty string', code: 'INVALID_ACCESS_TOKEN' },
          { status: 400 }
        );
      }
      updates.accessToken = body.accessToken.trim();
    }

    if (body.refreshToken !== undefined) {
      if (typeof body.refreshToken !== 'string' || body.refreshToken.trim() === '') {
        return NextResponse.json(
          { error: 'refreshToken must be a non-empty string', code: 'INVALID_REFRESH_TOKEN' },
          { status: 400 }
        );
      }
      updates.refreshToken = body.refreshToken.trim();
    }

    if (body.tokenExpiresAt !== undefined) {
      if (typeof body.tokenExpiresAt !== 'string') {
        return NextResponse.json(
          { error: 'tokenExpiresAt must be a valid ISO timestamp string', code: 'INVALID_TOKEN_EXPIRES_AT' },
          { status: 400 }
        );
      }
      const expiresDate = new Date(body.tokenExpiresAt);
      if (isNaN(expiresDate.getTime())) {
        return NextResponse.json(
          { error: 'tokenExpiresAt must be a valid ISO timestamp string', code: 'INVALID_TOKEN_EXPIRES_AT' },
          { status: 400 }
        );
      }
      updates.tokenExpiresAt = body.tokenExpiresAt;
    }

    if (body.lastSyncAt !== undefined) {
      if (body.lastSyncAt !== null && typeof body.lastSyncAt !== 'string') {
        return NextResponse.json(
          { error: 'lastSyncAt must be a valid ISO timestamp string or null', code: 'INVALID_LAST_SYNC_AT' },
          { status: 400 }
        );
      }
      if (body.lastSyncAt !== null) {
        const syncDate = new Date(body.lastSyncAt);
        if (isNaN(syncDate.getTime())) {
          return NextResponse.json(
            { error: 'lastSyncAt must be a valid ISO timestamp string', code: 'INVALID_LAST_SYNC_AT' },
            { status: 400 }
          );
        }
      }
      updates.lastSyncAt = body.lastSyncAt;
    }

    if (body.isActive !== undefined) {
      if (typeof body.isActive !== 'boolean') {
        return NextResponse.json(
          { error: 'isActive must be a boolean', code: 'INVALID_IS_ACTIVE' },
          { status: 400 }
        );
      }
      updates.isActive = body.isActive;
    }

    const updated = await db
      .update(integrations)
      .set(updates)
      .where(eq(integrations.id, integrationId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update integration', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        integration: updated[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('PUT /api/integrations/[id] error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid integration ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const integrationId = parseInt(id);

    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hardDelete') === 'true';

    const existing = await db
      .select()
      .from(integrations)
      .where(eq(integrations.id, integrationId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Integration not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (hardDelete) {
      const deleted = await db
        .delete(integrations)
        .where(eq(integrations.id, integrationId))
        .returning();

      if (deleted.length === 0) {
        return NextResponse.json(
          { error: 'Failed to delete integration', code: 'DELETE_FAILED' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Integration deleted successfully',
          integration: deleted[0],
        },
        { status: 200 }
      );
    } else {
      const softDeleted = await db
        .update(integrations)
        .set({
          isActive: false,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(integrations.id, integrationId))
        .returning();

      if (softDeleted.length === 0) {
        return NextResponse.json(
          { error: 'Failed to delete integration', code: 'DELETE_FAILED' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Integration deleted successfully',
          integration: softDeleted[0],
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('DELETE /api/integrations/[id] error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}