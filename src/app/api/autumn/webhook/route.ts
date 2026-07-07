import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { subscriptions, paymentHistory, creditPurchases, user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import crypto from 'crypto';
import { getAutumnSubscriptionData } from '@/lib/autumn/client';

const webhookSecret = process.env.AUTUMN_SECRET_KEY!;

async function syncAutumnData(userId: string) {
  try {
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
      console.log(`Synced Autumn data for user ${userId}`);
    }
  } catch (error) {
    console.error(`Failed to sync Autumn data for user ${userId}:`, error);
  }
}

// Helper function to verify Autumn webhook signature
function verifyWebhookSignature(payload: string, signature: string): boolean {
  if (!webhookSecret) {
    console.error('AUTUMN_SECRET_KEY is not configured');
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

// Helper function to record payment
async function recordPayment(
  userId: string,
  paymentId: string,
  amount: number,
  currency: string,
  status: string,
  paymentType: 'subscription' | 'one_time' | 'credits',
  description: string,
  metadata?: Record<string, any>
) {
  await db.insert(paymentHistory).values({
    userId,
    stripePaymentId: paymentId, // Reuse this field for Autumn payment IDs
    amount,
    currency,
    status,
    paymentType,
    description,
    metadata: JSON.stringify({ ...metadata, gateway: 'autumn' }),
    createdAt: new Date().toISOString(),
  });
}

// Helper function to record credit purchase
async function recordCreditPurchase(
  userId: string,
  paymentId: string,
  creditsPurchased: number,
  amountPaid: number,
  currency: string
) {
  await db.insert(creditPurchases).values({
    userId,
    stripePaymentId: paymentId,
    creditsPurchased,
    amountPaid,
    currency,
    createdAt: new Date().toISOString(),
  });

  // Update user's total credits
  const currentUser = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  const currentCredits = currentUser[0]?.totalCredits || 0;
  
  await db
    .update(user)
    .set({
      totalCredits: currentCredits + creditsPurchased,
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId));
}

// Map Autumn product IDs to plan IDs
function getProductPlanId(productId: string): string {
  const mapping: Record<string, string> = {
    'professional': 'pro',
    'enterprise': 'enterprise',
    'free': 'free',
    'credits_100': 'credits_100',
    'credits_500': 'credits_500',
    'credits_1000': 'credits_1000',
  };
  return mapping[productId] || productId;
}

// Extract credit amount from product
function getCreditAmount(productId: string): number | null {
  const creditProducts: Record<string, number> = {
    'credits_100': 100,
    'credits_500': 500,
    'credits_1000': 1000,
  };
  return creditProducts[productId] || null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('x-autumn-signature') || headersList.get('autumn-signature') || '';

    // Verify webhook signature (if provided)
    if (signature && !verifyWebhookSignature(body, signature)) {
      console.error('Autumn webhook signature verification failed');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);
    console.log('Autumn webhook event:', event.type, event);

    const eventType = event.type || event.event_type || event.eventType;
    const eventData = event.data || event;

    switch (eventType) {
      // Subscription created/updated
      case 'subscription.created':
      case 'subscription.updated':
      case 'subscription_created':
      case 'subscription_updated': {
        const customerId = eventData.customer_id || eventData.customerId;
        const productId = eventData.product_id || eventData.productId;
        const subscriptionId = eventData.subscription_id || eventData.subscriptionId || eventData.id;
        const status = eventData.status || 'active';
        const planId = getProductPlanId(productId);

        if (!customerId) {
          console.error('No customer ID in subscription event');
          break;
        }

        // Check if subscription already exists for this user
        const existingSub = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.userId, customerId))
          .limit(1);

        const subData = {
          userId: customerId,
          stripeCustomerId: customerId, // Store Autumn customer ID
          stripeSubscriptionId: subscriptionId || `autumn_${Date.now()}`,
          planId,
          status,
          currentPeriodStart: eventData.current_period_start 
            ? new Date(eventData.current_period_start * 1000).toISOString()
            : new Date().toISOString(),
          currentPeriodEnd: eventData.current_period_end
            ? new Date(eventData.current_period_end * 1000).toISOString()
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default 30 days
          cancelAtPeriodEnd: eventData.cancel_at_period_end || false,
          metadata: JSON.stringify({ gateway: 'autumn', productId }),
          updatedAt: new Date().toISOString(),
        };

        if (existingSub.length > 0) {
          await db
            .update(subscriptions)
            .set(subData)
            .where(eq(subscriptions.userId, customerId));
        } else {
          await db.insert(subscriptions).values({
            ...subData,
            createdAt: new Date().toISOString(),
          });
        }

        console.log(`Subscription ${eventType} processed for user ${customerId}`);
        break;
      }

      // Subscription cancelled
      case 'subscription.cancelled':
      case 'subscription.deleted':
      case 'subscription_cancelled':
      case 'subscription_deleted': {
        const customerId = eventData.customer_id || eventData.customerId;

        if (!customerId) {
          console.error('No customer ID in subscription cancellation event');
          break;
        }

        await db
          .update(subscriptions)
          .set({
            status: 'canceled',
            cancelAtPeriodEnd: true,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(subscriptions.userId, customerId));

        console.log(`Subscription cancelled for user ${customerId}`);
        break;
      }

      // Payment succeeded
      case 'payment.succeeded':
      case 'payment_succeeded':
      case 'checkout.completed':
      case 'checkout_completed': {
        const customerId = eventData.customer_id || eventData.customerId;
        const productId = eventData.product_id || eventData.productId;
        const amount = eventData.amount || eventData.total || 0;
        const currency = eventData.currency || 'usd';
        const paymentId = eventData.payment_id || eventData.paymentId || `autumn_${Date.now()}`;
        
        if (!customerId) {
          console.error('No customer ID in payment event');
          break;
        }

        const planId = getProductPlanId(productId);
        const creditAmount = getCreditAmount(productId);
        
        // Determine if this is a credit purchase or subscription
        const isCredits = creditAmount !== null;
        const paymentType = isCredits ? 'credits' : 'subscription';
        const description = isCredits 
          ? `${creditAmount} AI Credits`
          : `Subscription payment - ${planId}`;

        // Record payment in history
        await recordPayment(
          customerId,
          paymentId,
          Math.round(amount * 100), // Convert to cents
          currency,
          'succeeded',
          paymentType,
          description,
          {
            productId,
            planId,
            gateway: 'autumn',
          }
        );

        // If credits, add to user account
        if (isCredits && creditAmount) {
          await recordCreditPurchase(
            customerId,
            paymentId,
            creditAmount,
            Math.round(amount * 100),
            currency
          );
        }

        console.log(`Payment processed for user ${customerId}: ${description}`);
        break;
      }

      // Payment failed
      case 'payment.failed':
      case 'payment_failed': {
        const customerId = eventData.customer_id || eventData.customerId;
        const productId = eventData.product_id || eventData.productId;
        const amount = eventData.amount || eventData.total || 0;
        const currency = eventData.currency || 'usd';
        const paymentId = eventData.payment_id || eventData.paymentId || `autumn_${Date.now()}`;

        if (!customerId) {
          console.error('No customer ID in failed payment event');
          break;
        }

        const planId = getProductPlanId(productId);
        
        await recordPayment(
          customerId,
          paymentId,
          Math.round(amount * 100),
          currency,
          'failed',
          'subscription',
          `Failed payment - ${planId}`,
          {
            productId,
            planId,
            gateway: 'autumn',
          }
        );

        console.log(`Failed payment recorded for user ${customerId}`);
        break;
      }

      default:
        console.log(`Unhandled Autumn webhook event: ${eventType}`);
    }

    return NextResponse.json({ received: true, eventType });
  } catch (error: any) {
    console.error('Autumn webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 }
    );
  }
}