import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { complianceAuditLogs } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireVuneliUserId } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const userId = await requireVuneliUserId(req.headers);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch audit logs
    const logs = await db.select()
      .from(complianceAuditLogs)
      .where(eq(complianceAuditLogs.userId, userId))
      .orderBy(desc(complianceAuditLogs.createdAt))
      .limit(50);

    return NextResponse.json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
