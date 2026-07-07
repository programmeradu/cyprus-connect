import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAutumnSubscriptionData } from '@/lib/autumn/client';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const autumnData = await getAutumnSubscriptionData(userId);

    if (!autumnData) {
      return NextResponse.json(
        { error: 'Failed to fetch Autumn subscription data' },
        { status: 500 }
      );
    }

    await db
      .update(user)
      .set({
        autumnCustomerId: autumnData.customerId,
        autumnPlan: autumnData.planId,
        aiCreditsBalance: autumnData.aiCreditsBalance,
        lastAutumnSync: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));

    return NextResponse.json({
      success: true,
      data: autumnData,
    });
  } catch (error) {
    console.error('Autumn sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync Autumn data', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const [userData] = await db
      .select({
        autumnCustomerId: user.autumnCustomerId,
        autumnPlan: user.autumnPlan,
        aiCreditsBalance: user.aiCreditsBalance,
        lastAutumnSync: user.lastAutumnSync,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const shouldSync = 
      !userData.lastAutumnSync || 
      (new Date().getTime() - new Date(userData.lastAutumnSync).getTime() > 5 * 60 * 1000);

    if (shouldSync) {
      const autumnData = await getAutumnSubscriptionData(userId);

      if (autumnData) {
        await db
          .update(user)
          .set({
            autumnCustomerId: autumnData.customerId,
            autumnPlan: autumnData.planId,
            aiCreditsBalance: autumnData.aiCreditsBalance,
            lastAutumnSync: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(user.id, userId));

        return NextResponse.json({
          success: true,
          data: autumnData,
          synced: true,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        customerId: userData.autumnCustomerId,
        planId: userData.autumnPlan,
        aiCreditsBalance: userData.aiCreditsBalance,
        lastSync: userData.lastAutumnSync,
      },
      synced: false,
    });
  } catch (error) {
    console.error('Autumn sync check error:', error);
    return NextResponse.json(
      { error: 'Failed to check Autumn sync', details: (error as Error).message },
      { status: 500 }
    );
  }
}
