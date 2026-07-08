# Payments consolidation & gap fix

## Current state (findings)

**Business logic**
- Two subscription sources: Autumn SDK (checked first in `GET /api/stripe/subscription`) + `subscriptions` table populated by the new Lovable Payments webhook. State can diverge.
- Third gateway (Paystack) still wired: `/api/paystack/*` routes, `PaystackButton`, `PaymentGatewaySelector`.
- `useSubscription` hits `/api/stripe/subscription` (which calls Autumn) — no realtime, no env awareness.
- No Free-plan handling on signup — new users have no `subscriptions` row, and the checkout route rejects `planId='free'` because `priceId` is null.

**Technical**
- No products/prices exist in Lovable Payments yet — `resolvePriceIdFromLookupKey('pro_monthly_usd')` will 404 on the first real checkout.
- Everything hardcoded to `'sandbox'`; no auto env split.
- Tax handled via manual `automatic_tax` + `tax_id_collection` — not the managed compliance flow.
- Checkout route uses `success_url`/`cancel_url` redirect, not embedded checkout.
- Legacy Stripe webhook (`/api/stripe/webhook`) still present as 410 stub — fine.

## Plan

### 1. Create products & prices in Lovable Payments (sandbox → auto-syncs to live)
Batch-create 5 products with USD + EUR prices, each tagged with the SaaS tax code `txcd_10103001`:
- `pro` → `pro_monthly_usd` ($49), `pro_monthly_eur` (€45)
- `enterprise` → `enterprise_monthly_usd` ($199), `enterprise_monthly_eur` (€185)
- `credits_100`, `credits_500`, `credits_1000` → one-time USD + EUR each

Free plan is NOT created in Stripe (per your answer — entitlement only).

### 2. Env auto-switch
- Add `getStripeEnvironment()` deriving `sandbox`/`live` from `VITE_PAYMENTS_CLIENT_TOKEN` prefix.
- Server side: `resolveStripeEnv(request)` reads `X-Stripe-Env` header sent by client, falls back to `sandbox`.
- Add `environment` column to `subscriptions`, `payment_history`, `credit_purchases` tables (migration). Filter every read by env.

### 3. Free-plan auto-assignment on signup
- Better-Auth `after` hook on user creation: insert `subscriptions` row `{planId:'free', status:'active', environment}` and grant 100 free AI credits.
- Downgrade path (webhook `customer.subscription.deleted` — already immediate) sets `planId='free'` — already correct.
- Frontend: "Downgrade to Free" button calls `DELETE /api/stripe/subscription` (already exists).

### 4. Full compliance handling on checkout
Rewrite `/api/stripe/checkout` and `/api/stripe/subscription` (POST):
- Add `managed_payments: { enabled: true }` on session creation.
- Remove incompatible params: `automatic_tax`, `tax_id_collection`, `billing_address_collection`, `customer_update`, `payment_method_types`.
- Keep `resolveOrCreateCustomer` for `metadata.userId` (needed for webhooks/portal).
- Add `PaymentTestModeBanner` component; render at billing page top.

### 5. Remove Autumn + Paystack (single source of truth)
- Delete: `autumn.config.ts`, `src/lib/autumn/`, `src/lib/autumn-provider.tsx`, `src/app/api/autumn/`, `src/components/autumn/`, `AUTUMN_SECRET_KEY` usage.
- Delete: `src/lib/paystack/`, `src/app/api/paystack/`, `src/components/billing/PaystackButton.tsx`, `PaymentGatewaySelector.tsx`, paystack types.
- Rewrite `GET /api/stripe/subscription` to read only from DB (no Autumn fallback).
- Refactor `useSubscription` to query Supabase directly (env-filtered) + subscribe to realtime changes so Stripe webhook writes reflect instantly in the UI.
- Update `PricingTable`, `CreditPurchaseDialog`, `BillingDashboard` — drop gateway toggle.

### 6. Portal & upgrades (already exist — verify + patch)
- `POST /api/stripe/subscription` already uses `proration_behavior: 'always_invoice'` — keep.
- `/api/stripe/billing-portal` — swap to `createStripeClient(env)`, open in new tab from client.
- Realtime: `useSubscription` subscribes to `subscriptions` table filtered by `user_id`, refetches on any change.

### 7. Analytics + emails (already wired in webhook)
Keep the existing `plan_started` / `plan_changed` / `plan_canceled` / `credits_purchased` events and `sendWelcomeEmail`. Add a `plan_started` event on the signup free-tier insert too.

## Files touched
- **Create**: DB migration (env columns + free-tier default), `src/lib/stripe/env.ts`, `src/components/billing/PaymentTestModeBanner.tsx`, auth hook update
- **Rewrite**: `src/app/api/stripe/checkout/route.ts`, `src/app/api/stripe/subscription/route.ts`, `src/app/api/stripe/billing-portal/route.ts`, `src/hooks/useSubscription.ts`, `src/components/billing/PricingTable.tsx`, `src/components/billing/BillingDashboard.tsx`, `src/components/billing/CreditPurchaseDialog.tsx`
- **Delete**: `autumn.config.ts`, `src/lib/autumn*`, `src/app/api/autumn/`, `src/components/autumn/`, `src/lib/paystack/`, `src/app/api/paystack/`, `src/components/billing/PaystackButton.tsx`, `src/components/billing/PaymentGatewaySelector.tsx`

## Test plan (preview)

### Setup
1. Sign in as a **new** user via `/en/auth` — confirm a `subscriptions` row appears with `plan_id='free'`, `environment='sandbox'`.
2. Confirm the orange test-mode banner shows at the top of `/en/app/billing`.

### Subscribe (Pro)
1. Billing page → "Upgrade to Pro" (USD).
2. Embedded Stripe form loads. Card: `4242 4242 4242 4242`, exp `12/34`, CVC `123`, ZIP `10001`.
3. Return page → billing dashboard refreshes automatically (realtime): plan shows Pro, `plan_started` in server logs, welcome email logged, 1000 AI credits granted.

### Upgrade (Pro → Enterprise)
1. Click "Upgrade to Enterprise". Immediate switch; a prorated invoice appears in Stripe dashboard.
2. Billing card updates without page reload; `plan_changed` in logs; AI credits topped up to 10000.

### Downgrade (Enterprise → Free)
1. Click "Cancel plan". Confirms → `DELETE /api/stripe/subscription` → immediate revoke.
2. Row flips to `plan_id='free'`, `status='canceled'`; `plan_canceled` in logs. Enterprise-gated pages become locked immediately.

### Credit pack
1. "Buy 500 credits" → embedded checkout → `4242…`.
2. Return: balance +500, `credits_purchased` in logs, row in `credit_purchases`. Re-submitting same session doesn't double-grant (idempotent by session id).

### VAT (EU)
1. Switch currency to EUR, use card `4000 0025 0000 0000 0053` (Cyprus BIN) or set billing country CY → 19% VAT calculated by Stripe automatically. Statement descriptor shows `LINK.COM* …`.

### Failure paths
- Decline: `4000 0000 0000 0002` → checkout shows error, no DB write.
- 3DS: `4000 0025 0000 3155` → challenge shown inline.

### Test-card cheat sheet
| Purpose | Number |
|---|---|
| Success | 4242 4242 4242 4242 |
| Decline | 4000 0000 0000 0002 |
| 3DS required | 4000 0025 0000 3155 |
| Insufficient funds | 4000 0000 0000 9995 |

Any future expiry, any 3-digit CVC, any ZIP.
