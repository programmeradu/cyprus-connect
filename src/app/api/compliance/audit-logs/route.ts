import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { complianceAuditLogs } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    // Get user_id from session token
    const sessionResult = await db.query.session.findFirst({
      where: (session, { eq }) => eq(session.token, token),
    });

    if (!sessionResult) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const userId = sessionResult.userId;

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
