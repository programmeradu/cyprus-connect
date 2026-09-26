import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { integrations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { readJson, parseValue } from '@/lib/validate';
import { logger } from '@/lib/log';

const log = logger('integrations.[id]');

const idSchema = z.string().regex(/^\d+$/, 'Valid integration ID is required');

const updateSchema = z.object({
  accessToken: z.string().trim().min(1).max(4096).optional(),
  refreshToken: z.string().trim().min(1).max(4096).optional(),
  tokenExpiresAt: z.string().datetime({ offset: true }).optional().or(z.string().refine((v) => !isNaN(new Date(v).getTime()), 'tokenExpiresAt must be a valid ISO timestamp string')),
  lastSyncAt: z.string().refine((v) => !isNaN(new Date(v).getTime()), 'lastSyncAt must be a valid ISO timestamp string').nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const idResult = parseValue(id, idSchema);
    if (!idResult.ok) return idResult.response;
    const integrationId = parseInt(idResult.data);

    const bodyResult = await readJson(request, updateSchema);
    if (!bodyResult.ok) return bodyResult.response;
    const body = bodyResult.data;

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

    if (body.accessToken !== undefined) updates.accessToken = body.accessToken;
    if (body.refreshToken !== undefined) updates.refreshToken = body.refreshToken;
    if (body.tokenExpiresAt !== undefined) updates.tokenExpiresAt = body.tokenExpiresAt;
    if (body.lastSyncAt !== undefined) updates.lastSyncAt = body.lastSyncAt;
    if (body.isActive !== undefined) updates.isActive = body.isActive;

    const updated = await db
      .update(integrations)
      .set(updates)
      .where(eq(integrations.id, integrationId))
      .returning();

    if (updated.length === 0) {
      const ref = log.error('Failed to update integration');
      return NextResponse.json(
        { error: 'Failed to update integration.', ref },
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
    const ref = log.error('PUT /api/integrations/[id] error', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.', ref },
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
    const idResult = parseValue(id, idSchema);
    if (!idResult.ok) return idResult.response;
    const integrationId = parseInt(idResult.data);

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
        const ref = log.error('Failed to delete integration');
        return NextResponse.json(
          { error: 'Failed to delete integration.', ref },
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
        const ref = log.error('Failed to delete integration');
        return NextResponse.json(
          { error: 'Failed to delete integration.', ref },
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
    const ref = log.error('DELETE /api/integrations/[id] error', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.', ref },
      { status: 500 }
    );
  }
}
