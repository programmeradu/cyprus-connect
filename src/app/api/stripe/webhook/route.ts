import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe/server';
import { db } from '@/db';
import { subscriptions, paymentHistory, creditPurchases, user } from '@/db/schema';
import { eq } from 'drizzle-orm';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Helper function to record payment
async function recordPayment(
  userId: string,
  stripePaymentId: string,
  amount: number,
  currency: string,
  status: string,
  paymentType: 'subscription' | 'one_time' | 'credits',
  description: string,
  metadata?: Record<string, any>
) {
  await db.insert(paymentHistory).values({
    userId,
    stripePaymentId,
    amount,
    currency,
    status,
    paymentType,
    description,
    metadata: metadata ? JSON.stringify(metadata) : null,
    createdAt: new Date().toISOString(),
  });
}

// Helper function to record credit purchase
async function recordCreditPurchase(
  userId: string,
  stripePaymentId: string,
  creditsPurchased: number,
  amountPaid: number,
  currency: string
) {
  await db.insert(creditPurchases).values({
    userId,
    stripePaymentId,
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

// Helper function to update subscription status
async function updateSubscriptionStatus(
  stripeSubscriptionId: string,
  status: string
) {
  await db
    .update(subscriptions)
    .set({
      status,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = (await headers()).get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      // Subscription events
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        
        // Get plan ID from price ID - Use NEXT_PUBLIC environment variables
        let planId = 'free';
        const priceId = subscription.items.data[0]?.price.id;
        
        if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) {
          planId = 'pro';
        } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID) {
          planId = 'enterprise';
        }

        // Update or create subscription record
        const existing = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripeCustomerId, subscription.customer as string))
          .limit(1);

        if (existing[0]) {
          await db
            .update(subscriptions)
            .set({
              stripeSubscriptionId: subscription.id,
              planId,
              status: subscription.status,
              currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(subscriptions.stripeCustomerId, subscription.customer as string));
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        // Downgrade to free plan
        await db
          .update(subscriptions)
          .set({
            stripeSubscriptionId: null,
            planId: 'free',
            status: 'canceled',
            updatedAt: new Date().toISOString(),
          })
          .where(eq(subscriptions.stripeCustomerId, subscription.customer as string));
        break;
      }

      // Payment events
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const metadata = paymentIntent.metadata;

        if (metadata.userId) {
          await recordPayment(
            metadata.userId,
            paymentIntent.id,
            paymentIntent.amount,
            paymentIntent.currency,
            'succeeded',
            metadata.type === 'credits' ? 'credits' : 'one_time',
            metadata.description || 'Payment',
            metadata
          );

          // If this was a credit purchase, add credits to user
          if (metadata.type === 'credits' && metadata.credits) {
            await recordCreditPurchase(
              metadata.userId,
              paymentIntent.id,
              parseInt(metadata.credits),
              paymentIntent.amount,
              paymentIntent.currency
            );
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const metadata = paymentIntent.metadata;

        if (metadata.userId) {
          await recordPayment(
            metadata.userId,
            paymentIntent.id,
            paymentIntent.amount,
            paymentIntent.currency,
            'failed',
            metadata.type === 'credits' ? 'credits' : 'one_time',
            metadata.description || 'Payment',
            metadata
          );
        }
        break;
      }

      // Invoice events for subscription payments
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        
        if (invoice.subscription && invoice.customer_email) {
          const sub = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.stripeCustomerId, invoice.customer as string))
            .limit(1);

          if (sub[0]) {
            await recordPayment(
              sub[0].userId,
              invoice.payment_intent as string,
              invoice.amount_paid,
              invoice.currency,
              'succeeded',
              'subscription',
              `Subscription payment - ${sub[0].planId}`,
              {
                invoiceId: invoice.id,
                subscriptionId: invoice.subscription,
              }
            );
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        
        if (invoice.subscription) {
          // Update subscription status to past_due
          await updateSubscriptionStatus(
            invoice.subscription as string,
            'past_due'
          );
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 }
    );
  }
}