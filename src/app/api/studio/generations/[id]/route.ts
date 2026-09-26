import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { mediaGenerations } from '@/db/schema';
import { bindSessionUser } from '@/lib/api-auth';
import { readJson, parseValue } from '@/lib/validate';
import { logger } from '@/lib/log';

const log = logger("api.studio.generations.id");

const idSchema = z.coerce.number().int().positive();

const patchSchema = z.object({
  saved: z.boolean(),
});

type Ctx = { params: Promise<{ id: string }> };

/** Resolves the caller and the id; every query below is scoped to both. */
async function scope(request: NextRequest, params: Ctx['params']) {
  const auth = await bindSessionUser(request);
  if (!auth.ok) return { ok: false as const, response: auth.response };
  const parsedId = parseValue((await params).id, idSchema);
  if (!parsedId.ok) return { ok: false as const, response: parsedId.response };
  return {
    ok: true as const,
    where: and(eq(mediaGenerations.id, parsedId.data), eq(mediaGenerations.userId, auth.userId)),
  };
}

const notFound = () => NextResponse.json({ message: 'That image is not in your library.' }, { status: 404 });

export async function GET(request: NextRequest, { params }: Ctx) {
  const s = await scope(request, params);
  if (!s.ok) return s.response;
  try {
    const [row] = await db.select().from(mediaGenerations).where(s.where).limit(1);
    return row ? NextResponse.json(row) : notFound();
  } catch (error) {
    const ref = log.error('GET failed', error);
    return NextResponse.json({ message: 'Could not read this image.', ref }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const s = await scope(request, params);
  if (!s.ok) return s.response;
  const parsed = await readJson(request, patchSchema);
  if (!parsed.ok) return parsed.response;
  try {
    const [row] = await db
      .update(mediaGenerations)
      .set({ saved: parsed.data.saved, updatedAt: new Date().toISOString() })
      .where(s.where)
      .returning();
    return row ? NextResponse.json(row) : notFound();
  } catch (error) {
    const ref = log.error('PATCH failed', error);
    return NextResponse.json({ message: 'Could not update this image.', ref }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const s = await scope(request, params);
  if (!s.ok) return s.response;
  try {
    const [row] = await db.delete(mediaGenerations).where(s.where).returning({ id: mediaGenerations.id });
    return row ? NextResponse.json({ deleted: row.id }) : notFound();
  } catch (error) {
    const ref = log.error('DELETE failed', error);
    return NextResponse.json({ message: 'Could not delete this image.', ref }, { status: 500 });
  }
}
