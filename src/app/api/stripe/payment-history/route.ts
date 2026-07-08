import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { paymentHistory } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payments = await db
      .select()
      .from(paymentHistory)
      .where(eq(paymentHistory.userId, session.user.id))
      .orderBy(desc(paymentHistory.createdAt))
      .limit(50);

    // Add gateway information from metadata
    const enhancedPayments = payments.map((payment) => {
      const metadata = payment.metadata 
        ? (typeof payment.metadata === 'string' 
          ? JSON.parse(payment.metadata) 
          : payment.metadata)
        : {};
      
      const gateway = metadata.gateway ||
                     (payment.stripePaymentId?.startsWith('pi_') ? 'stripe' :
                      'stripe');

      return {
        ...payment,
        gateway,
      };
    });

    return NextResponse.json({
      payments: enhancedPayments,
    });
  } catch (error: any) {
    console.error('Get payment history error:', error);
    return NextResponse.json(
      { error: 'Failed to get payment history', details: error.message },
      { status: 500 }
    );
  }
}