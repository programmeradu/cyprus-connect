-- Stripe on Vuneli's own account: yearly plans, invoice-paid customers,
-- once-only webhook handling and the marketplace platform fee.

-- How each subscription is billed.
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS billing_interval text;          -- 'month' | 'year'
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS collection_method text;         -- 'charge_automatically' | 'send_invoice'

-- Every Stripe event id is stored once; a retried event is skipped.
CREATE TABLE IF NOT EXISTS stripe_events (
  id text PRIMARY KEY,
  type text NOT NULL,
  livemode boolean NOT NULL DEFAULT false,
  received_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stripe_events_received_idx ON stripe_events (received_at);

-- Marketplace orders keep the invoice and Vuneli's fee.
ALTER TABLE offset_purchases ADD COLUMN IF NOT EXISTS stripe_invoice_id text;
ALTER TABLE offset_purchases ADD COLUMN IF NOT EXISTS platform_fee_cents integer;
CREATE UNIQUE INDEX IF NOT EXISTS offset_purchases_stripe_payment_uidx ON offset_purchases (stripe_payment_id);
