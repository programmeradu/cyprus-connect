import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { complianceRegulations, complianceDocuments, complianceSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';

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

    // Fetch regulations
    const regulations = await db.select().from(complianceRegulations).where(eq(complianceRegulations.userId, userId));
    
    // Fetch documents
    const documents = await db.select().from(complianceDocuments).where(eq(complianceDocuments.userId, userId));
    
    // Fetch settings
    const settings = await db.select().from(complianceSettings).where(eq(complianceSettings.userId, userId));

    // Calculate compliance score
    const totalRegs = regulations.length;
    const compliantRegs = regulations.filter(r => r.status === 'compliant').length;
    const score = totalRegs > 0 ? Math.round((compliantRegs / totalRegs) * 100) : 85;

    // Parse JSON fields
    const parsedRegulations = regulations.map(reg => ({
      ...reg,
      requirements: JSON.parse(reg.requirements || '[]')
    }));

    return NextResponse.json({
      success: true,
      score,
      regulations: parsedRegulations,
      documents,
      settings: settings[0] || null
    });
  } catch (error) {
    console.error('Error fetching compliance data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance data' },
      { status: 500 }
    );
  }
}