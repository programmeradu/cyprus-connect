# 🎯 Stripe Payment Integration Setup Guide

## Complete Payment System Implementation for VerdeIQ

This guide will walk you through setting up Stripe payments for VerdeIQ, including subscriptions and one-time credit purchases.

---

## 📋 Prerequisites

- [ ] Stripe account (create at https://dashboard.stripe.com/register)
- [ ] Business verification completed (for live mode)
- [ ] Access to project's `.env` file

---

## 🚀 Quick Start (5 Steps)

### Step 1: Create Stripe Account & Get API Keys

1. Go to **[Stripe Dashboard](https://dashboard.stripe.com/register)**
2. Complete signup and verification
3. Navigate to **Developers → API Keys**
4. Copy your keys:
   - **Publishable key** (starts with `pk_test_*` or `pk_live_*`)
   - **Secret key** (starts with `sk_test_*` or `sk_live_*`)

**Add to `.env`:**
```bash
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

⚠️ **IMPORTANT**: Use **test mode** keys during development!

---

### Step 2: Create Subscription Products

Go to **[Products](https://dashboard.stripe.com/products)** and create:

#### 🌱 **Pro Plan**
- **Name**: Pro Plan
- **Description**: Advanced carbon analytics and team collaboration
- **Pricing**: 
  - Model: Recurring
  - Price: $49.00 USD
  - Billing period: Monthly
- Click **Save product**
- **Copy the Price ID** (starts with `price_*`)

**Add to `.env`:**
```bash
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_your_pro_price_id_here
```

#### 👑 **Enterprise Plan**
- **Name**: Enterprise Plan
- **Description**: Unlimited features, white-label reports, dedicated support
- **Pricing**:
  - Model: Recurring
  - Price: $199.00 USD
  - Billing period: Monthly
- Click **Save product**
- **Copy the Price ID**

**Add to `.env`:**
```bash
NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID=price_your_enterprise_price_id_here
```

---

### Step 3: Create Credit Packages (One-time Purchases)

Create three credit packages:

#### 💎 **100 Credits**
- **Name**: 100 AI Credits
- **Description**: One-time purchase of 100 AI credits
- **Pricing**:
  - Model: One-time
  - Price: $9.99 USD
- **Copy Price ID**

```bash
NEXT_PUBLIC_STRIPE_CREDITS_100_PRICE_ID=price_your_100_credits_price_id
```

#### 💎💎 **500 Credits** (20% off)
- **Name**: 500 AI Credits
- **Description**: One-time purchase of 500 AI credits (20% discount)
- **Pricing**:
  - Model: One-time
  - Price: $39.99 USD
- **Copy Price ID**

```bash
NEXT_PUBLIC_STRIPE_CREDITS_500_PRICE_ID=price_your_500_credits_price_id
```

#### 💎💎💎 **1000 Credits** (30% off)
- **Name**: 1000 AI Credits
- **Description**: One-time purchase of 1000 AI credits (30% discount)
- **Pricing**:
  - Model: One-time
  - Price: $69.99 USD
- **Copy Price ID**

```bash
NEXT_PUBLIC_STRIPE_CREDITS_1000_PRICE_ID=price_your_1000_credits_price_id
```

---

### Step 4: Configure Webhooks

Webhooks notify your app when payment events occur.

#### For Local Development (using Stripe CLI):

1. **Install Stripe CLI**: https://stripe.com/docs/stripe-cli#install

2. **Login to Stripe**:
   ```bash
   stripe login
   ```

3. **Forward webhooks to localhost**:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. **Copy the webhook signing secret** from the terminal output

**Add to `.env`:**
```bash
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

#### For Production Deployment:

1. Go to **[Webhooks](https://dashboard.stripe.com/webhooks)**
2. Click **Add endpoint**
3. **Endpoint URL**: `https://yourdomain.com/api/stripe/webhook`
4. **Description**: VerdeIQ Payment Events
5. **Select events to listen to**:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
6. Click **Add endpoint**
7. **Copy the Signing secret**

**Add to `.env`:**
```bash
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret
```

---

### Step 5: Test Payment Flow

#### Test Cards (Test Mode Only):

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0027 6000 3184` | 3D Secure authentication required |

**Test Details:**
- **Expiry**: Any future date (e.g., 12/34)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP**: Any 5 digits (e.g., 12345)

#### Testing Subscription Flow:

1. Start your dev server: `bun dev`
2. Navigate to: `http://localhost:3000/app/settings?tab=billing`
3. Click **Upgrade to Pro** or **Upgrade to Enterprise**
4. Complete checkout with test card
5. Verify:
   - ✅ Redirected back to settings with success message
   - ✅ Plan badge updated in navigation
   - ✅ Subscription status shows "Active"
   - ✅ Database record created in `subscriptions` table

#### Testing Credit Purchase:

1. Click **Purchase Credits**
2. Select a credit package
3. Complete checkout with test card
4. Verify:
   - ✅ Credits added to user account
   - ✅ Payment recorded in `payment_history` table
   - ✅ Credit purchase in `credit_purchases` table

---

## 🎨 What's Included

### ✅ Features Implemented:

1. **Three Subscription Tiers**:
   - 🌱 Free Plan (Default)
   - ⭐ Pro Plan ($49/month)
   - 👑 Enterprise Plan ($199/month)

2. **Credit Packages**:
   - 100 Credits ($9.99)
   - 500 Credits ($39.99, 20% off)
   - 1000 Credits ($69.99, 30% off)

3. **Billing Dashboard** (`/app/settings?tab=billing`):
   - Current plan display
   - Subscription management
   - Credit purchase
   - Payment history
   - Billing portal access

4. **Subscription Badge**:
   - Shows current plan in navigation
   - Links to billing settings
   - Animated premium badge

5. **Feature Gating Hooks**:
   - `useSubscription()` - Get current subscription
   - `useFeatureAccess()` - Check feature permissions
   - Automatic enforcement of plan limits

6. **Stripe Integration**:
   - Checkout sessions (subscription + one-time)
   - Customer portal (manage subscription)
   - Webhook handlers (real-time events)
   - Payment history tracking
   - Automatic credit allocation

---

## 📊 Database Schema

### Tables Created:

```sql
-- Subscriptions
CREATE TABLE subscriptions (
  id INTEGER PRIMARY KEY,
  userId TEXT NOT NULL,
  stripeCustomerId TEXT,
  stripeSubscriptionId TEXT,
  planId TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active',
  currentPeriodStart TEXT,
  currentPeriodEnd TEXT,
  cancelAtPeriodEnd BOOLEAN DEFAULT 0,
  trialEnd TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Payment History
CREATE TABLE payment_history (
  id INTEGER PRIMARY KEY,
  userId TEXT NOT NULL,
  stripePaymentId TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  paymentType TEXT NOT NULL,
  description TEXT,
  metadata TEXT,
  createdAt TEXT NOT NULL
);

-- Credit Purchases
CREATE TABLE credit_purchases (
  id INTEGER PRIMARY KEY,
  userId TEXT NOT NULL,
  stripePaymentId TEXT NOT NULL,
  creditsPurchased INTEGER NOT NULL,
  amountPaid INTEGER NOT NULL,
  currency TEXT NOT NULL,
  createdAt TEXT NOT NULL
);
```

---

## 🔐 Security Best Practices

### ✅ Implemented Security:

1. **Server-side Stripe Instance**:
   - Secret key only in API routes
   - Never exposed to client

2. **Webhook Signature Verification**:
   - All webhooks verified with signing secret
   - Prevents webhook spoofing

3. **User Authentication**:
   - All payment endpoints require auth
   - User ID from session (not client)

4. **Environment Variables**:
   - Secrets in `.env` (gitignored)
   - Public keys prefixed with `NEXT_PUBLIC_`

---

## 🚨 Troubleshooting

### Issue: "STRIPE_SECRET_KEY is not defined"

**Solution**: Make sure `.env` file has the correct key:
```bash
STRIPE_SECRET_KEY=sk_test_your_key_here
```
Restart dev server: `bun dev`

---

### Issue: Webhook events not received

**Local Development**:
```bash
# Terminal 1: Run dev server
bun dev

# Terminal 2: Forward webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**Production**:
- Verify endpoint URL in Stripe Dashboard
- Check webhook signing secret matches `.env`
- View webhook logs in Stripe Dashboard

---

### Issue: Checkout redirect fails

**Check**:
1. `NEXT_PUBLIC_APP_URL` matches your app URL
2. Success/cancel URLs are correctly formed
3. User is authenticated before checkout

---

### Issue: Test card fails

**Solutions**:
- Ensure using test mode keys (`pk_test_*`, `sk_test_*`)
- Try different test card: `4242 4242 4242 4242`
- Check Stripe Dashboard → Developers → Logs for errors

---

## 📈 Going Live (Production Checklist)

### Before Launching:

- [ ] Complete Stripe business verification
- [ ] Switch to **live mode** in Stripe Dashboard
- [ ] Replace test keys with live keys in `.env`:
  ```bash
  STRIPE_SECRET_KEY=sk_live_your_live_secret_key
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_public_key
  ```
- [ ] Create live products and update price IDs
- [ ] Configure production webhook endpoint
- [ ] Update `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Test with real card (small amount)
- [ ] Set up Stripe alerts for failed payments
- [ ] Enable Stripe Radar for fraud prevention
- [ ] Configure tax collection (if required)
- [ ] Set up invoice email templates

---

## 💰 Pricing Strategy

### Current Tiers:

| Plan | Price | Target Audience |
|------|-------|-----------------|
| **Free** | $0 | Individual users, testing |
| **Pro** | $49/mo | Small teams, growing SMEs |
| **Enterprise** | $199/mo | Large organizations, agencies |

### Credit Pricing:

| Package | Price | Per Credit Cost | Discount |
|---------|-------|-----------------|----------|
| 100 Credits | $9.99 | $0.10 | - |
| 500 Credits | $39.99 | $0.08 | 20% |
| 1000 Credits | $69.99 | $0.07 | 30% |

---

## 🎯 Next Steps

After payment setup is complete:

1. **Implement Feature Gates**:
   - Gate premium features based on plan
   - Add upgrade prompts for locked features

2. **Add Analytics**:
   - Track conversion rates
   - Monitor churn
   - A/B test pricing

3. **Marketing**:
   - Create pricing page
   - Add social proof
   - Offer free trials

4. **Customer Support**:
   - Set up help center
   - Create billing FAQs
   - Add live chat

---

## 📚 Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Subscription Lifecycle](https://stripe.com/docs/billing/subscriptions/overview)
- [Payment Intents Guide](https://stripe.com/docs/payments/payment-intents)

---

## 🆘 Support

If you encounter issues:

1. Check Stripe Dashboard → Developers → Logs
2. Review webhook event history
3. Test with Stripe CLI locally
4. Contact Stripe Support: https://support.stripe.com/

---

**Built with ❤️ for VerdeIQ - Empowering SMEs to Lead on Sustainability 🌱**
