# 🚀 VerdeIQ - Vercel Deployment Guide

Your application is configured for deployment at: **https://verdeiqapp.vercel.app**

## ✅ Completed Configuration

The following environment variables have been updated for your Vercel deployment:

- `NEXT_PUBLIC_APP_URL=https://verdeiqapp.vercel.app`
- `BETTER_AUTH_URL=https://verdeiqapp.vercel.app`
- `QB_REDIRECT_URI=https://verdeiqapp.vercel.app/api/oauth/quickbooks/callback`

## 📋 Deployment Checklist

### 1. Add Environment Variables to Vercel

Go to your Vercel project dashboard: https://vercel.com/dashboard

Navigate to: **Settings → Environment Variables**

Copy ALL variables from your `.env` file and add them to Vercel:

**Critical Variables:**
```bash
TURSO_CONNECTION_URL=libsql://db-941d64ce-418c-43a8-8d2f-da8a089432ee-orchids.aws-us-west-2.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
BETTER_AUTH_SECRET=GjPrKZespPJstYaeuLhcqsKGNN/4VkG7L1X6Y95do8U=
BETTER_AUTH_URL=https://verdeiqapp.vercel.app

GOOGLE_CLIENT_ID=429966742866-bg42lqicvfijun55emerlrrp4rh9c3go.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

STRIPE_SECRET_KEY=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
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51MtKvMC9dojwoOvIWVnsJluGhsFTB44w4tfNbVPU8X1ht7oQT6xWiyDr0u41Oj5omlIqfuEAvPOxTxOe60hS0U4e00HZZuCvzX
STRIPE_WEBHOOK_SECRET=whsec_IuFg7tqejD9wuqFBfS6aLTGMcf8LjTgH

NEXT_PUBLIC_APP_URL=https://verdeiqapp.vercel.app
```

**Note:** Make sure to add ALL environment variables from your `.env` file, including API keys for:
- Google Gemini
- Climatiq
- OpenEI
- WikiRate
- Electricity Maps
- Supabase
- QuickBooks
- etc.

### 2. Update Google OAuth Configuration

**CRITICAL: Update Authorized Redirect URIs**

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", add:
   ```
   https://verdeiqapp.vercel.app/api/auth/callback/google
   ```
4. Keep the localhost URI for local development:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
5. Click **Save**

### 3. Configure Stripe Webhook for Production

**CRITICAL: Set up production webhook endpoint**

1. Go to [Stripe Webhooks Dashboard](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. Enter endpoint URL:
   ```
   https://verdeiqapp.vercel.app/api/stripe/webhook
   ```
4. Select the following events:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
5. Click **"Add endpoint"**
6. Copy the **Signing secret** (starts with `whsec_`)
7. Update in Vercel: `STRIPE_WEBHOOK_SECRET=whsec_...`

**Important:** You now have TWO webhook secrets:
- Local development: `whsec_IuFg7tqejD9wuqFBfS6aLTGMcf8LjTgH` (from Stripe CLI)
- Production: The new signing secret from Stripe Dashboard

Use the production webhook secret in your Vercel environment variables.

### 4. Update QuickBooks OAuth (Optional)

If you're using QuickBooks integration:

1. Go to [QuickBooks Developer Dashboard](https://developer.intuit.com/app/developer/dashboard)
2. Select your app
3. Under **"Keys & OAuth"**, add redirect URI:
   ```
   https://verdeiqapp.vercel.app/api/oauth/quickbooks/callback
   ```
4. Keep sandbox URI for testing:
   ```
   http://localhost:3000/api/oauth/quickbooks/callback
   ```
5. Click **Save**

### 5. Deploy to Vercel

If you haven't already connected your repository to Vercel:

**Option A: Via Vercel Dashboard**
1. Go to https://vercel.com/new
2. Import your Git repository
3. Vercel will auto-detect Next.js
4. Click **Deploy**

**Option B: Via Vercel CLI**
```bash
npm install -g vercel
vercel login
vercel
```

### 6. Verify Deployment

After deployment completes, test the following:

#### Authentication
- ✅ Visit https://verdeiqapp.vercel.app
- ✅ Click "Sign In"
- ✅ Test email/password registration
- ✅ Test Google OAuth login
- ✅ Verify session persistence

#### Payments
- ✅ Navigate to billing settings
- ✅ Test subscription checkout
- ✅ Test credit purchase
- ✅ Verify webhook events in Stripe Dashboard
- ✅ Check payment history displays correctly

#### API Routes
- ✅ Test dashboard data loading
- ✅ Test emissions calculator
- ✅ Test insights generation
- ✅ Test analytics endpoints

### 7. Production Considerations

#### Security Checklist
- ✅ All sensitive keys are in Vercel environment variables
- ✅ `.env` file is in `.gitignore` (never commit secrets!)
- ✅ Stripe webhook signature verification is enabled
- ✅ CORS is properly configured
- ✅ OAuth redirect URIs are whitelisted

#### Performance Optimization
- ✅ Enable Vercel Edge caching for static assets
- ✅ Configure ISR (Incremental Static Regeneration) for dashboard pages
- ✅ Monitor Vercel Analytics for performance metrics
- ✅ Set up proper error tracking (Sentry, LogRocket, etc.)

#### Monitoring
- ✅ Set up Vercel Log Drains for centralized logging
- ✅ Configure Stripe email alerts for failed payments
- ✅ Monitor API rate limits (Gemini, Climatiq, etc.)
- ✅ Set up uptime monitoring (UptimeRobot, Pingdom)

## 🔧 Troubleshooting

### Issue: "Redirect URI mismatch" error with Google OAuth
**Solution:** Ensure `https://verdeiqapp.vercel.app/api/auth/callback/google` is added to Google Cloud Console OAuth credentials.

### Issue: Stripe webhook returns 401/403 error
**Solution:** 
1. Verify `STRIPE_WEBHOOK_SECRET` in Vercel matches the webhook signing secret from Stripe Dashboard
2. Check that webhook endpoint is `https://verdeiqapp.vercel.app/api/stripe/webhook`
3. Ensure all required webhook events are selected

### Issue: Database connection errors
**Solution:** 
1. Verify `TURSO_CONNECTION_URL` and `TURSO_AUTH_TOKEN` are correctly set in Vercel
2. Check Turso database is accessible from external connections
3. Test connection using Drizzle Studio: `npm run db:studio`

### Issue: Environment variables not updating
**Solution:**
1. After adding/updating env vars in Vercel, redeploy the app
2. Go to Deployments → Latest Deployment → "Redeploy"
3. Or push a new commit to trigger redeployment

### Issue: CORS errors on API routes
**Solution:** Better-auth is configured with trusted origins including:
- `https://verdeiqapp.vercel.app`
- `*.vercel.app` (all Vercel preview deployments)

If issues persist, check `src/lib/auth.ts` configuration.

## 📊 Post-Deployment Checklist

After successful deployment:

- [ ] Test user registration and login
- [ ] Verify Google OAuth works
- [ ] Test payment checkout flow
- [ ] Confirm webhook events are received
- [ ] Check database migrations ran successfully
- [ ] Test all major features (calculator, insights, analytics)
- [ ] Verify email notifications work (if configured)
- [ ] Test QuickBooks integration (if enabled)
- [ ] Monitor Vercel deployment logs for errors
- [ ] Set up custom domain (optional)
- [ ] Configure SSL certificate (auto by Vercel)
- [ ] Update DNS records (if using custom domain)

## 🎯 Production Launch

When ready to go live:

1. **Switch to Stripe Live Mode:**
   - Update `STRIPE_SECRET_KEY` to `sk_live_...`
   - Update `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to `pk_live_...`
   - Create new webhook endpoint for production
   - Update all Price IDs to live mode prices

2. **Production Database:**
   - Ensure Turso database is in production tier
   - Set up automated backups
   - Configure database monitoring

3. **Email Service:**
   - Set up professional email service (SendGrid/Mailgun)
   - Configure SMTP credentials in Vercel
   - Test email deliverability

4. **Custom Domain (Optional):**
   - Add custom domain in Vercel dashboard
   - Update DNS records (A/CNAME)
   - Update all OAuth redirect URIs
   - Update `NEXT_PUBLIC_APP_URL` to custom domain

## 🆘 Support Resources

- **Vercel Documentation:** https://vercel.com/docs
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Stripe Webhooks:** https://stripe.com/docs/webhooks
- **Better-Auth Docs:** https://better-auth.com
- **Turso Database:** https://docs.turso.tech

---

## ✅ Quick Reference

**Your Production URLs:**
- App: https://verdeiqapp.vercel.app
- Auth Callback: https://verdeiqapp.vercel.app/api/auth/callback/google
- Stripe Webhook: https://verdeiqapp.vercel.app/api/stripe/webhook
- QB Callback: https://verdeiqapp.vercel.app/api/oauth/quickbooks/callback

**Live Stripe Keys:**
- Secret: `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`
- Publishable: `pk_live_51MtKvMC9dojwoOvIWVnsJluGhsFTB44w4tfNbVPU8X1ht7oQT6xWiyDr0u41Oj5omlIqfuEAvPOxTxOe60hS0U4e00HZZuCvzX`

---

**🌱 VerdeIQ is ready for production deployment!**

Your Stripe keys are already configured for live mode. Follow this guide to complete the deployment process.
