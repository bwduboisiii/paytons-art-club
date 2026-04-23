// Shared Stripe server helpers.
// Lazy-initialized: calling getStripe() throws if keys are missing, so routes
// can catch and respond with a clear "Stripe not configured" error instead of
// crashing at module load time.

import Stripe from 'stripe';

let cachedStripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (cachedStripe) return cachedStripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY not configured');
  }
  cachedStripe = new Stripe(key, {
    apiVersion: '2024-06-20' as any,
  });
  return cachedStripe;
}

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_PRICE_ID &&
    process.env.STRIPE_WEBHOOK_SECRET
  );
}
