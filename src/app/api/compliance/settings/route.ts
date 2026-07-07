import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { complianceSettings, complianceAuditLogs } from '@/db/schema';
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

    // Fetch settings
    const settings = await db.select()
      .from(complianceSettings)
      .where(eq(complianceSettings.userId, userId))
      .limit(1);

    // If no settings exist, create default ones
    if (settings.length === 0) {
      const defaultSettings = await db.insert(complianceSettings).values({
        userId,
        jurisdictions: JSON.stringify(['European Union', 'Global']),
        autoSubmit: false,
        emailNotifications: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }).returning();

      return NextResponse.json({
        success: true,
        settings: {
          ...defaultSettings[0],
          jurisdictions: JSON.parse(defaultSettings[0].jurisdictions)
        }
      });
    }

    return NextResponse.json({
      success: true,
      settings: {
        ...settings[0],
        jurisdictions: JSON.parse(settings[0].jurisdictions)
      }
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
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
    const { jurisdictions, autoSubmit, emailNotifications } = await req.json();

    // Check if settings exist
    const existing = await db.select()
      .from(complianceSettings)
      .where(eq(complianceSettings.userId, userId))
      .limit(1);

    let updated;
    if (existing.length === 0) {
      // Create new settings
      updated = await db.insert(complianceSettings).values({
        userId,
        jurisdictions: JSON.stringify(jurisdictions || ['European Union', 'Global']),
        autoSubmit: autoSubmit ?? false,
        emailNotifications: emailNotifications ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }).returning();
    } else {
      // Update existing settings
      updated = await db.update(complianceSettings)
        .set({
          jurisdictions: JSON.stringify(jurisdictions),
          autoSubmit,
          emailNotifications,
          updatedAt: new Date().toISOString()
        })
        .where(eq(complianceSettings.userId, userId))
        .returning();
    }

    // Log the action
    await db.insert(complianceAuditLogs).values({
      userId,
      action: 'Settings updated',
      details: 'Compliance preferences modified',
      createdBy: 'User',
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      settings: {
        ...updated[0],
        jurisdictions: JSON.parse(updated[0].jurisdictions)
      }
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
