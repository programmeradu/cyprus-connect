import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { complianceRegulations, complianceAuditLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireVuneliUserId } from '@/lib/auth';
import { FRAMEWORKS } from '@/lib/compliance/frameworks';

export async function POST(req: NextRequest) {
  try {
    const userId = await requireVuneliUserId(req.headers);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check if user already has regulations
    const existing = await db.select().from(complianceRegulations).where(eq(complianceRegulations.userId, userId));
    
    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Regulations already initialized',
        regulations: existing
      });
    }

    // Initialize default regulations
    // Status starts as "upcoming" for every rule. Only the user marks a rule met.
    const now = new Date().toISOString();
    const defaultRegulations = FRAMEWORKS.map((f) => ({
      userId,
      regulationId: f.regulationId,
      name: f.name,
      jurisdiction: f.jurisdiction,
      status: 'upcoming',
      nextDeadline: f.nextDeadline(),
      description: f.description,
      requirements: JSON.stringify(f.requirements),
      createdAt: now,
      updatedAt: now,
    }));

    const created = await db.insert(complianceRegulations).values(defaultRegulations).returning();

    // Log the action
    await db.insert(complianceAuditLogs).values({
      userId,
      action: 'Regulations initialized',
      details: '4 default regulations created',
      createdBy: 'System',
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      regulations: created
    });
  } catch (error) {
    console.error('Error initializing regulations:', error);
    return NextResponse.json(
      { error: 'Failed to initialize regulations' },
      { status: 500 }
    );
  }
}
