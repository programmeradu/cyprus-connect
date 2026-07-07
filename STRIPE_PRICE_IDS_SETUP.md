# 🔧 CRITICAL: Fix Stripe Price IDs

## ⚠️ Current Issue
Your `.env` file has **Product IDs** (`prod_*`) instead of **Price IDs** (`price_*`). Stripe checkout requires Price IDs to work.

## 📋 How to Get Correct Price IDs

### Step 1: Go to Stripe Dashboard
1. Visit: https://dashboard.stripe.com/products
2. Sign in to your Stripe account

### Step 2: Find Your Products
You should see these 5 products (if not, create them):

#### **1. Pro Plan** - $49/month
- Click on the product
- Under "Pricing", copy the **Price ID** (starts with `price_`)
- Example: `price_1ABC123xyz456789`

#### **2. Enterprise Plan** - $199/month
- Click on the product
- Copy the **Price ID**

#### **3. 100 Credits Package** - $9.99
- Click on the product
- Copy the **Price ID**

#### **4. 500 Credits Package** - $39.99
- Click on the product
- Copy the **Price ID**

#### **5. 1000 Credits Package** - $69.99
- Click on the product
- Copy the **Price ID**

### Step 3: Update Your .env File

Replace these lines in your `.env`:

```bash
# OLD (WRONG - Product IDs)
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=prod_TUhzOwukCCt8l1
NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID=prod_TUi0nc49ywwwdf
NEXT_PUBLIC_STRIPE_CREDITS_100_PRICE_ID=prod_TUi3MCHDcbBQe1
NEXT_PUBLIC_STRIPE_CREDITS_500_PRICE_ID=prod_TUi4xmztsSVfjv
NEXT_PUBLIC_STRIPE_CREDITS_1000_PRICE_ID=prod_TUi44WVyl6M6Dn

# NEW (CORRECT - Price IDs)
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_YOUR_PRO_PRICE_ID_HERE
NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID=price_YOUR_ENTERPRISE_PRICE_ID_HERE
NEXT_PUBLIC_STRIPE_CREDITS_100_PRICE_ID=price_YOUR_100_CREDITS_PRICE_ID_HERE
NEXT_PUBLIC_STRIPE_CREDITS_500_PRICE_ID=price_YOUR_500_CREDITS_PRICE_ID_HERE
NEXT_PUBLIC_STRIPE_CREDITS_1000_PRICE_ID=price_YOUR_1000_CREDITS_PRICE_ID_HERE
```

### Step 4: Also Add Server-Side Variables

Add these lines to your `.env` (same Price IDs, without NEXT_PUBLIC_ prefix):

```bash
STRIPE_PRO_PRICE_ID=price_YOUR_PRO_PRICE_ID_HERE
STRIPE_ENTERPRISE_PRICE_ID=price_YOUR_ENTERPRISE_PRICE_ID_HERE
STRIPE_CREDITS_100_PRICE_ID=price_YOUR_100_CREDITS_PRICE_ID_HERE
STRIPE_CREDITS_500_PRICE_ID=price_YOUR_500_CREDITS_PRICE_ID_HERE
STRIPE_CREDITS_1000_PRICE_ID=price_YOUR_1000_CREDITS_PRICE_ID_HERE
```

## 🚀 Quick Setup Script

If you need to **create the products from scratch** in Stripe:

### Pro Plan ($49/month)
1. Go to: https://dashboard.stripe.com/products/create
2. Name: "Pro Plan"
3. Price: $49.00 USD
4. Billing: Recurring, Monthly
5. Click "Save product"
6. Copy the **Price ID**

### Enterprise Plan ($199/month)
1. Create product
2. Name: "Enterprise Plan"
3. Price: $199.00 USD
4. Billing: Recurring, Monthly
5. Copy the **Price ID**

### Credit Packages (One-time payments)
Create 3 products:
- **100 Credits** - $9.99 (One time)
- **500 Credits** - $39.99 (One time)
- **1000 Credits** - $69.99 (One time)

## ✅ Verify Setup

After updating `.env`:

1. **Restart your dev server**:
   ```bash
   bun run dev
   ```

2. **Test checkout flow**:
   - Go to `/pricing`
   - Click "Upgrade to Pro"
   - Should redirect to Stripe Checkout
   - If you see "Invalid price ID" error → Wrong Price ID

3. **Check webhook**:
   - In Stripe Dashboard → Developers → Webhooks
   - Endpoint: `https://verdeiqapp.vercel.app/api/stripe/webhook`
   - Events to send:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`

## 🔐 Security Note

- `NEXT_PUBLIC_*` variables are visible in browser
- Never put secret keys in `NEXT_PUBLIC_*` variables
- Webhook secret (`STRIPE_WEBHOOK_SECRET`) is already correct ✅

## 📝 Example .env (with correct format)

```bash
# Stripe Keys (Already Correct ✅)
STRIPE_SECRET_KEY=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
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51MtKvMC9dojwoOvIWVnsJluGhsFTB44w4tfNbVPU8X1ht7oQT6xWiyDr0u41Oj5omlIqfuEAvPOxTxOe60hS0U4e00HZZuCvzX
STRIPE_WEBHOOK_SECRET=whsec_IuFg7tqejD9wuqFBfS6aLTGMcf8LjTgH

# Stripe Price IDs (NEEDS FIXING ⚠️)
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_ABC123...
NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID=price_DEF456...
NEXT_PUBLIC_STRIPE_CREDITS_100_PRICE_ID=price_GHI789...
NEXT_PUBLIC_STRIPE_CREDITS_500_PRICE_ID=price_JKL012...
NEXT_PUBLIC_STRIPE_CREDITS_1000_PRICE_ID=price_MNO345...

# Server-side Price IDs (same as above)
STRIPE_PRO_PRICE_ID=price_ABC123...
STRIPE_ENTERPRISE_PRICE_ID=price_DEF456...
STRIPE_CREDITS_100_PRICE_ID=price_GHI789...
STRIPE_CREDITS_500_PRICE_ID=price_JKL012...
STRIPE_CREDITS_1000_PRICE_ID=price_MNO345...
```

---

## 🎯 Next Steps After Fixing Price IDs

Once your Price IDs are correct:

1. ✅ Webhook is fixed
2. ✅ Checkout flow will work
3. ✅ Subscriptions will sync to database
4. ✅ Payment history will be recorded
5. ✅ Credits will be added automatically

Then you can move to **Phase 2: Carbon Offset Marketplace** 🌍
