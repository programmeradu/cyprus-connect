import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { activityEvents, complianceAuditLogs, workspaces } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { resolveConsoleSession } from '@/lib/console-session';
import { requireUserIdOrQa } from '@/lib/api-auth';
import { logger } from '@/lib/log';

export const dynamic = "force-dynamic";

const log = logger('api.compliance.audit-logs');

export async function GET(req: NextRequest) {
  try {
    const s = await resolveConsoleSession(req.headers);
    let wsId: string | null = null;
    let userId: string | null = null;

    if (s.ok) {
      wsId = s.session.workspace.id;
      userId = s.session.account.id;
    } else {
      userId = await requireUserIdOrQa(req.headers);
      if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const [w] = await db
        .select({ id: workspaces.id })
        .from(workspaces)
        .where(eq(workspaces.ownerUserId, userId))
        .limit(1);
      wsId = w?.id ?? null;
    }

    // 1. Fetch real workspace activity events (uploads, edits, imports, approvals, deletions)
    const events = wsId
      ? await db
          .select()
          .from(activityEvents)
          .where(eq(activityEvents.workspaceId, wsId))
          .orderBy(desc(activityEvents.createdAt))
          .limit(100)
      : [];

    // 2. Also fetch any legacy complianceAuditLogs if present
    const legacy = userId
      ? await db
          .select()
          .from(complianceAuditLogs)
          .where(eq(complianceAuditLogs.userId, userId))
          .orderBy(desc(complianceAuditLogs.createdAt))
          .limit(50)
      : [];

    const mappedEvents = events.map((e) => ({
      id: e.id,
      action: `${e.verb.slice(0, 1).toUpperCase() + e.verb.slice(1)}: ${e.object}`,
      details: e.detail || (e.actorType === "agent" ? "Autopilot system execution" : "User action"),
      createdBy: e.actorName || (e.actorType === "agent" ? "Verde Autopilot" : "User"),
      createdAt: e.createdAt.toISOString(),
    }));

    const mappedLegacy = legacy.map((l) => ({
      id: 100_000 + l.id,
      action: l.action,
      details: l.details,
      createdBy: l.createdBy,
      createdAt: typeof l.createdAt === "string" ? l.createdAt : (l.createdAt as Date).toISOString(),
    }));

    // Combine and sort by createdAt descending
    const all = [...mappedEvents, ...mappedLegacy].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return NextResponse.json({
      success: true,
      logs: all.slice(0, 100),
    });
  } catch (error) {
    const ref = log.error('Failed to fetch audit logs', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs', ref },
      { status: 500 },
    );
  }
}
