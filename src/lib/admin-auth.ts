/**
 * Admin gate for the few tools that change shared data (marketplace
 * listings, AI banner generation). Being signed in is not enough: the
 * account must hold the 'admin' role in `user_roles`. The QA identity is
 * never an admin.
 */

import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { userRoles } from "@/db/schema";
import { bindSessionUser } from "@/lib/api-auth";
import { QA_ACCOUNT } from "@/lib/qa-bypass";

export type AdminCheck = { ok: true; userId: string } | { ok: false; response: NextResponse };

/** Pure decision, exported for tests. */
export function decideAdmin(userId: string | null, hasRole: boolean): AdminCheck {
  if (!userId) {
    return { ok: false, response: NextResponse.json({ error: "Please sign in.", code: "UNAUTHENTICATED" }, { status: 401 }) };
  }
  if (!hasRole || userId === QA_ACCOUNT.id) {
    return { ok: false, response: NextResponse.json({ error: "Only an administrator can do this.", code: "FORBIDDEN" }, { status: 403 }) };
  }
  return { ok: true, userId };
}

export async function isAdmin(userId: string): Promise<boolean> {
  const rows = await db
    .select({ id: userRoles.id })
    .from(userRoles)
    .where(and(eq(userRoles.userId, userId), eq(userRoles.role, "admin")))
    .limit(1);
  return rows.length > 0;
}

export async function requireAdmin(request: { headers: Headers }): Promise<AdminCheck> {
  const bound = await bindSessionUser(request);
  if (!bound.ok) return bound;
  return decideAdmin(bound.userId, await isAdmin(bound.userId));
}
