## Goal

Replace the direct-SDK BYOK Stripe flow with Lovable's built-in payments (gateway-proxied Stripe), keeping existing UI (`PricingTable`, `BillingDashboard`, `CreditPurchaseDialog`) working, and add the business logic you chose.

## Files to add

1. **`src/lib/stripe-gateway.server.ts`** — server-only gateway client
   - `createStripeClient(env)` — wraps Stripe SDK with a custom fetch that rewrites `api.stripe.com` → `https://connector-gateway.lovable.dev/stripe` and injects `X-Connection-Api-Key` (`STRIPE_SANDBOX_API_KEY` / `STRIPE_LIVE_API_KEY`) + `Lovable-API-Key`.
   - `verifyWebhook(req, env)` — HMAC-SHA256 verifier using `PAYMENTS_SANDBOX_WEBHOOK_SECRET` / `PAYMENTS_LIVE_WEBHOOK_SECRET`.
   - `resolveOrCreateCustomer({ email, userId })` — searches by `metadata.userId` then email, stamps userId on the Customer.
   - `getStripeErrorMessage(err)`.

2. **`src/lib/stripe-env.ts`** — client-safe env detection
   - Reads `NEXT_PUBLIC_PAYMENTS_CLIENT_TOKEN` (or falls back to `pk_test_` prefix detection).
   - Exports `getStripeEnvironment(): 'sandbox' | 'live'`.

3. **`src/app/api/public/payments/webhook/route.ts`** — new webhook endpoint at the path the built-in provider registered (`/api/public/payments/webhook?env=sandbox|live`). Handles:
   - `customer.subscription.created/updated` → upsert `subscriptions` row (user_id, plan_id from `lookup_key`, status, period, `cancel_at_period_end`).
   - On new active subscription: **grant plan's monthly AI credits** (call Autumn or write to credits table), **send welcome email** (existing `sendEmail` util), **fire analytics event** `plan_started`.
   - `customer.subscription.deleted` → **immediate revoke**: set status `canceled`, `current_period_end = now()`, downgrade to Free.
   - `customer.subscription.updated` with plan change: log analytics `plan_changed`; credit balance is refreshed via new period (Stripe handles proration automatically).
   - `checkout.session.completed` with `mode: payment` + credits metadata → grant one-time credits.

## Files to modify

4. **`src/lib/stripe/config.ts`** — replace env-var `priceId` fields with the new stable slugs created above (`pro_monthly_usd`, `pro_monthly_eur`, `enterprise_monthly_usd`, `enterprise_monthly_eur`, `credits_100_usd/eur`, `credits_500_usd/eur`, `credits_1000_usd/eur`). Add a `resolvePriceId(planId, variant)` helper.

5. **`src/app/api/stripe/checkout/route.ts`** — swap `new Stripe(process.env.STRIPE_SECRET_KEY)` for `createStripeClient(env)`; resolve human-readable priceId via `stripe.prices.list({ lookup_keys: [...] })`; use `resolveOrCreateCustomer` (writes `userId` to Customer metadata — required for reliable webhook routing); keep `automatic_tax` + `tax_id_collection` for EU VAT; add `proration_behavior: 'always_invoice'` on subscription updates from the portal. Pass `subscription_data.metadata.userId`.

6. **`src/app/api/stripe/webhook/route.ts`** — **delete** (superseded by `/api/public/payments/webhook`). Keep the file as a 410 Gone stub in case Stripe still holds the old URL from the BYOK account.

7. **`src/app/api/stripe/billing-portal/route.ts`** — swap to gateway client, add `flow_data` for cancel = immediate (`cancellation_reason.enabled: true`, `subscription_cancel.mode: 'immediately'`) and `subscription_update.proration_behavior: 'always_invoice'`.

8. **`src/hooks/useSubscription.ts`** — no schema change; just make sure it reads plan from the updated `SUBSCRIPTION_PLANS`.

9. **`src/components/billing/PricingTable.tsx`** and **`CreditPurchaseDialog.tsx`** — pass the new price IDs; no UI change.

10. **Delete unused env vars** (docs update only): `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_*_PRICE_ID*`. Keep `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` swapped for `NEXT_PUBLIC_PAYMENTS_CLIENT_TOKEN` (auto-set by Lovable in `.env.development`).

## Business logic mapping (your answers)

| Event | Action |
|---|---|
| Subscription active | Upsert row · grant `plan.limits.aiCredits` · send welcome email · analytics `plan_started` |
| Subscription canceled | Immediate revoke: status=canceled, period_end=now, downgrade to Free · analytics `plan_canceled` |
| Plan upgrade/downgrade | Stripe portal with `proration_behavior: 'always_invoice'` → immediate switch + prorated invoice · webhook updates row · analytics `plan_changed` |
| Credit pack purchase | Grant credits on `checkout.session.completed` (idempotent by `session.id`) · analytics `credits_purchased` |

## Out of scope (this pass)

- Migrating existing BYOK subscribers (none in test).
- Removing the Paystack flow (kept as alt provider).
- Autumn credits sync — will call existing `/api/credits/award` internally from the webhook instead of duplicating logic.

## Verification

- Curl the webhook path with a signed payload to confirm signature verification.
- Open PricingTable in preview → checkout with test card `4242 4242 4242 4242` → confirm row in `subscriptions` + credits granted + email logged.
- Cancel via portal → confirm immediate revoke.
- Upgrade Pro → Enterprise via portal → confirm prorated invoice + new limits.

Confirm and I'll implement.
