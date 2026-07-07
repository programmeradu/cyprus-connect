import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/db';
import { subscriptions, paymentHistory, creditPurchases, user } from '@/db/schema';
import { eq } from 'drizzle-orm';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;

function verifyWebhookSignature(body: string, signature: string): boolean {
  const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY).update(body).digest('hex');
  return hash === signature;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('x-paystack-signature');

  if (!signature || !verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    const event = JSON.parse(body);
    const { event: eventType, data } = event;

    switch (eventType) {
      case 'charge.success': {
        const metadata = data.metadata as { userId?: string; type?: string; planId?: string; credits?: number };
        
        if (!metadata?.userId) break;

        const existingPayment = await db.select().from(paymentHistory)
          .where(eq(paymentHistory.stripePaymentId, data.reference)).limit(1);
        
        if (existingPayment.length > 0) break;

        await db.insert(paymentHistory).values({
          userId: metadata.userId,
          stripePaymentId: data.reference,
          amount: data.amount,
          currency: data.currency,
          status: 'succeeded',
          paymentType: metadata.type === 'credits' ? 'credits' : 'subscription',
          description: metadata.type === 'credits' 
            ? `${metadata.credits} AI Credits (Paystack)` 
            : `${metadata.planId} subscription (Paystack)`,
          metadata: JSON.stringify({ ...metadata, gateway: 'paystack' }),
          createdAt: new Date().toISOString(),
        });

        if (metadata.type === 'credits' && metadata.credits) {
          await db.insert(creditPurchases).values({
            userId: metadata.userId,
            stripePaymentId: data.reference,
            creditsPurchased: metadata.credits,
            amountPaid: data.amount,
            currency: data.currency,
            createdAt: new Date().toISOString(),
          });

          const currentUser = await db.select().from(user).where(eq(user.id, metadata.userId)).limit(1);
          const currentCredits = currentUser[0]?.totalCredits || 0;
          
          await db.update(user).set({
            totalCredits: currentCredits + metadata.credits,
            updatedAt: new Date(),
          }).where(eq(user.id, metadata.userId));
        }

        if (metadata.type === 'subscription' && metadata.planId) {
          const existing = await db.select().from(subscriptions).where(eq(subscriptions.userId, metadata.userId)).limit(1);

          if (existing[0]) {
            await db.update(subscriptions).set({
              planId: metadata.planId,
              status: 'active',
              currentPeriodStart: new Date().toISOString(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date().toISOString(),
            }).where(eq(subscriptions.userId, metadata.userId));
          } else {
            await db.insert(subscriptions).values({
              userId: metadata.userId,
              stripeCustomerId: `paystack_${data.customer.customer_code}`,
              planId: metadata.planId,
              status: 'active',
              currentPeriodStart: new Date().toISOString(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        }
        break;
      }

      case 'subscription.create':
      case 'subscription.enable': {
        const customerCode = data.customer?.customer_code;
        const planCode = data.plan?.plan_code;
        
        if (customerCode) {
          await db.update(subscriptions).set({
            status: 'active',
            updatedAt: new Date().toISOString(),
          }).where(eq(subscriptions.stripeCustomerId, `paystack_${customerCode}`));
        }
        break;
      }

      case 'subscription.disable': {
        const customerCode = data.customer?.customer_code;
        
        if (customerCode) {
          await db.update(subscriptions).set({
            status: 'canceled',
            planId: 'free',
            updatedAt: new Date().toISOString(),
          }).where(eq(subscriptions.stripeCustomerId, `paystack_${customerCode}`));
        }
        break;
      }

      case 'charge.failed': {
        console.log('Payment failed:', data.reference);
        break;
      }

      default:
        console.log(`Unhandled Paystack event: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
