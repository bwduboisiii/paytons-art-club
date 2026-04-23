import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe, isStripeConfigured } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
// Ensure we get the raw body (required for signature verification)
export const runtime = 'nodejs';

/**
 * POST /api/stripe/webhook
 *
 * Handles Stripe subscription events. Updates parents.has_premium and
 * related fields. Uses signature verification so random POSTs can't mutate
 * our DB.
 *
 * To set up:
 *   1. In Stripe Dashboard → Developers → Webhooks → Add endpoint
 *   2. URL: https://<your-domain>/api/stripe/webhook
 *   3. Events to listen to:
 *      - checkout.session.completed
 *      - customer.subscription.created
 *      - customer.subscription.updated
 *      - customer.subscription.deleted
 *      - invoice.payment_failed
 *   4. Copy the signing secret into env var STRIPE_WEBHOOK_SECRET
 */
export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 503 }
    );
  }

  const stripe = getStripe();
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  // Next.js App Router: read raw body as text for signature verification
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('[stripe/webhook] Signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId =
          typeof session.customer === 'string'
            ? session.customer
            : session.customer?.id;
        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id;

        if (!customerId) break;

        // Fetch full subscription to get trial_end, current_period_end, status, price_id
        let subscription: Stripe.Subscription | null = null;
        if (subscriptionId) {
          subscription = await stripe.subscriptions.retrieve(subscriptionId);
        }

        await admin
          .from('parents')
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId || null,
            subscription_status: subscription?.status || 'active',
            subscription_current_period_end: subscription?.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
            trial_end: subscription?.trial_end
              ? new Date(subscription.trial_end * 1000).toISOString()
              : null,
            stripe_price_id: subscription?.items?.data?.[0]?.price?.id || null,
            has_premium: true,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

        // Premium active if status is active or trialing
        const hasPremium = ['active', 'trialing'].includes(sub.status);

        await admin
          .from('parents')
          .update({
            stripe_subscription_id: sub.id,
            subscription_status: sub.status,
            subscription_current_period_end: new Date(
              sub.current_period_end * 1000
            ).toISOString(),
            trial_end: sub.trial_end
              ? new Date(sub.trial_end * 1000).toISOString()
              : null,
            stripe_price_id: sub.items?.data?.[0]?.price?.id || null,
            has_premium: hasPremium,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

        await admin
          .from('parents')
          .update({
            subscription_status: 'canceled',
            has_premium: false,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === 'string'
            ? invoice.customer
            : invoice.customer?.id;
        if (!customerId) break;

        // Keep has_premium true for now — Stripe has grace period, don't
        // cut off access instantly. The subsequent subscription.updated
        // event will flip has_premium to false if the subscription truly lapses.
        await admin
          .from('parents')
          .update({
            subscription_status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId);
        break;
      }

      default:
        // Ignore other events
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('[stripe/webhook] Error handling event:', err);
    // Return 500 so Stripe retries
    return NextResponse.json(
      { error: err.message || 'Webhook handler error' },
      { status: 500 }
    );
  }
}
