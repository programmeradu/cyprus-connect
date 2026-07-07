import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { subscriptions } from '@/db/schema';

export async function POST(req: NextRequest) {
  try {
    // Clear all Stripe customer IDs to allow fresh creation with test mode
    await db.update(subscriptions).set({
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    });

    return NextResponse.json({
      success: true,
      message: 'All Stripe customer IDs have been cleared. Users can now create new test mode customers.',
    });
  } catch (error: any) {
    console.error('Reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset customer IDs', details: error.message },
      { status: 500 }
    );
  }
}