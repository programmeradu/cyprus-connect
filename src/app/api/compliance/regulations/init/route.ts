import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { complianceRegulations, complianceAuditLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireVuneliUserId } from '@/lib/auth';

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
    const defaultRegulations = [
      {
        userId,
        regulationId: 'csrd',
        name: 'CSRD - Corporate Sustainability Reporting Directive',
        jurisdiction: 'European Union',
        status: 'action_required',
        nextDeadline: '2025-12-31',
        description: 'EU directive requiring large companies to report on sustainability matters',
        requirements: JSON.stringify(['Double materiality assessment', 'ESRS disclosure', 'Third-party assurance']),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        userId,
        regulationId: 'cdp',
        name: 'CDP Climate Change Questionnaire',
        jurisdiction: 'Global',
        status: 'compliant',
        nextDeadline: '2025-07-31',
        description: 'Global disclosure system for environmental impact',
        requirements: JSON.stringify(['GHG emissions data', 'Climate risks assessment', 'Transition plan']),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        userId,
        regulationId: 'ghg',
        name: 'GHG Protocol Corporate Standard',
        jurisdiction: 'Global',
        status: 'compliant',
        nextDeadline: '2025-06-30',
        description: 'International standard for corporate GHG emissions accounting',
        requirements: JSON.stringify(['Scope 1 & 2 emissions', 'Scope 3 inventory', 'Annual reporting']),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        userId,
        regulationId: 'sec',
        name: 'SEC Climate Disclosure Rules',
        jurisdiction: 'United States',
        status: 'upcoming',
        nextDeadline: '2026-03-31',
        description: 'US Securities and Exchange Commission climate-related disclosure requirements',
        requirements: JSON.stringify(['Material climate risks', 'GHG emissions (phased)', 'Governance disclosure']),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

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
