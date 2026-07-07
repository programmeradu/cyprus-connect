// Server-only Stripe instance
// This file should ONLY be imported by API routes and server components
import Stripe from 'stripe';

const STRIPE_API_VERSION = '2025-11-17.clover' as const;

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: STRIPE_API_VERSION,
  typescript: true,
});
