import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getStripe, isStripeConfigured } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/stripe/portal
 * Creates a Stripe Billing Portal session for the current parent.
 * Returns { url } — client redirects there so they can cancel / update card.
 */
export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: 'Stripe is not configured on this environment.' },
      { status: 503 }
    );
  }

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: parentRow } = await admin
    .from('parents')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!parentRow?.stripe_customer_id) {
    return NextResponse.json(
      { error: 'No Stripe customer found. Start a subscription first.' },
      { status: 400 }
    );
  }

  const origin =
    req.headers.get('origin') ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000';

  try {
    const stripe = getStripe();
    const portal = await stripe.billingPortal.sessions.create({
      customer: parentRow.stripe_customer_id,
      return_url: `${origin}/parent`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (err: any) {
    console.error('[stripe/portal]', err);
    return NextResponse.json(
      { error: err.message || 'Portal creation failed' },
      { status: 500 }
    );
  }
}
