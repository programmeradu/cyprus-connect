# Stripe for Vuneli: subscriptions, invoices and payments

Runs on Vuneli's own Stripe account (Cyprus). Keys live in Cloudflare. No Lovable Cloud and no Lovable built-in payments.

## Where things stand

Most of the Stripe code is already there: checkout, the billing portal, payment history, a webhook, a pricing table and a marketplace purchase route. It was written for Lovable's built-in payments, though, so it doesn't fit the own-account setup:
- The webhook only checks payments against the built-in payments' signing secrets, not your own account's.
- Checkout turns on a Stripe feature (`managed_payments`) that is still in preview and may be rejected on a normal Cyprus account.
- The plan feature lists promise things that don't exist (Xero/QuickBooks, custom AI training, a 99.9% uptime promise, a dedicated manager, SSO).
- There are no yearly prices, no invoices for bank-transfer customers and no handling for failed payments.

## What I'll build

1. **One Stripe connection.** Your own secret key from Cloudflare (`STRIPE_SECRET_KEY`, test or live). Webhook checks use `STRIPE_WEBHOOK_SECRET`. Test vs live is decided by the key itself, not by a header the browser sends.
2. **Truthful plans.** Prices stay Free / Pro EUR 45 / Enterprise EUR 185 a month, with yearly at 10x the monthly price (two months free). Each plan lists only what works today, in EN and EL.
3. **Prices in Stripe.** A one-off setup script creates the products and prices (monthly and yearly, EUR) using the existing price names (lookup keys) and SaaS tax code `txcd_10103001`. Running it again doesn't create duplicates.
4. **Checkout.**
   - Stripe Checkout with automatic VAT (Stripe Tax). Collects the billing address and VAT ID, so EU businesses with a valid VAT ID get reverse charge.
   - Card and SEPA Direct Debit.
   - A monthly/yearly switch on the pricing table and in Settings, Plan.
5. **Invoices for bigger firms.** In the admin area, start a subscription that's billed by invoice and paid by bank transfer within 30 days (`collection_method: send_invoice`, payment terms of 30 days). Stripe emails a VAT invoice with bank details.
6. **Receipts.** Every subscription payment gets a Stripe VAT invoice. Settings, Plan lists them with PDF links (the existing payment history, rebuilt on invoices).
7. **Marketplace purchases.** The checkout route stays dormant until a real listing exists. When it runs, it creates an invoice per purchase. Your platform fee is recorded on the order.
8. **Webhook that keeps the app in sync.**
   - Handles subscription created, updated and deleted, checkout completed and async payment succeeded/failed, invoice paid, invoice payment failed and invoice overdue.
   - Each event is processed only once, so retries do no harm.
   - Failed or overdue payments give a grace notice on Home, not an instant downgrade.
9. **Billing portal.** Customers change plan, switch card or bank, and download invoices.
10. **Tests.** Webhook signature checks, event handling (including duplicates), plan lookups and a check that no plan lists a feature that isn't built.

## What you'll do outside the app

I'll add these to the founder setup doc:
1. Create the Stripe account (country Cyprus) and turn on Stripe Tax with your Cyprus VAT number.
2. Turn on SEPA Direct Debit and Invoicing in the Stripe dashboard. Add your bank details for invoices.
3. Add `STRIPE_SECRET_KEY` (test key first) to Cloudflare.
4. Point a webhook at `https://vuneli.com/api/public/payments/webhook`. Add its signing secret to Cloudflare as `STRIPE_WEBHOOK_SECRET`.
5. Run one test purchase with me. After that, repeat steps 3 and 4 with the live keys.

## Technical details

- `src/lib/stripe/server.ts`: drop the gateway path. One `createStripeClient()` from `STRIPE_SECRET_KEY`, pinned API version. `verifyWebhook()` uses `STRIPE_WEBHOOK_SECRET` (HMAC, Workers-safe). Mode comes from the `sk_test_`/`sk_live_` key prefix.
- `src/lib/stripe/env.ts`: the browser no longer picks the mode. The test-mode banner reads a server flag.
- `src/lib/stripe/config.ts`: real feature lists, plus `priceIdYearly`/`priceIdEurYearly` lookup keys. USD prices are dropped unless you want them.
- `scripts/stripe-setup.ts`: idempotent product and price creation by lookup key.
- Checkout route: drop `managed_payments`. Add `automatic_tax`, `tax_id_collection`, `billing_address_collection`, `customer_update`, `payment_method_types: ['card','sepa_debit']` and `subscription_data.metadata.userId`. All requests go through `src/lib/validate.ts`.
- New admin route `/api/admin/billing/invoice-subscription`, checked through `admin-auth.ts`.
- New table `stripe_events` (event id primary key) for processing each event once. SQL goes in `scripts/sql/`, mirrored in `src/db/schema.ts`.
- `/api/stripe/webhook` stays retired (returns 410). Errors go through `logger(scope)`.
- `AGENTS.md`: record the rule that Stripe uses Vuneli's own account, keys in Cloudflare, one webhook, and the plan list must match built features.

## Not included

- A plugin or Stripe-hosted planning tool. Those run in other coding tools, not here. This plan follows Stripe's documented best practice for subscriptions with tax.
- Usage-based billing for AI credits. Credits keep coming from the plan.
