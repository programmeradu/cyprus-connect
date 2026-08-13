import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { complianceSettings, complianceAuditLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireVuneliUserId } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const userId = await requireVuneliUserId(req.headers);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    const userId = await requireVuneliUserId(req.headers);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
