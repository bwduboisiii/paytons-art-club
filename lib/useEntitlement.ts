'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from './supabase/client';

export interface Entitlement {
  hasPremium: boolean;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  trialEnd: string | null;
  hasActiveTrial: boolean;
  // True if Stripe is configured on this environment. If false, premium is
  // disabled everywhere (everything is free, no upsells shown).
  stripeConfigured: boolean;
}

const DEFAULT_ENTITLEMENT: Entitlement = {
  hasPremium: false,
  subscriptionStatus: null,
  currentPeriodEnd: null,
  trialEnd: null,
  hasActiveTrial: false,
  stripeConfigured: false,
};

/**
 * Hook to check whether the current parent has premium access.
 *
 * Graceful degradation: if Stripe env vars aren't set at build/deploy time,
 * `stripeConfigured` is false and everyone has effective free access. This
 * lets us ship premium UI code to prod before Stripe is fully set up.
 */
export function useEntitlement() {
  const [entitlement, setEntitlement] = useState<Entitlement>(DEFAULT_ENTITLEMENT);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    // Stripe configuration is exposed via NEXT_PUBLIC_STRIPE_PUBLIC_KEY
    // (empty / missing = not configured)
    const stripeConfigured = Boolean(
      process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setEntitlement({ ...DEFAULT_ENTITLEMENT, stripeConfigured });
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('my_entitlement')
      .select('*')
      .maybeSingle();

    if (!data) {
      setEntitlement({ ...DEFAULT_ENTITLEMENT, stripeConfigured });
      setLoading(false);
      return;
    }

    const now = new Date();
    const trialEndDate = data.trial_end ? new Date(data.trial_end) : null;
    const hasActiveTrial = Boolean(trialEndDate && trialEndDate > now);

    setEntitlement({
      hasPremium: Boolean(data.has_premium),
      subscriptionStatus: data.subscription_status,
      currentPeriodEnd: data.subscription_current_period_end,
      trialEnd: data.trial_end,
      hasActiveTrial,
      stripeConfigured,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Refresh when window regains focus (e.g. returning from Stripe checkout)
  useEffect(() => {
    function onFocus() {
      if (document.visibilityState === 'visible') refresh();
    }
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh]);

  return { entitlement, loading, refresh };
}

/**
 * Convenience function: does the current parent have premium OR is Stripe
 * not configured (so everyone acts as premium)?
 */
export function hasEffectivePremium(e: Entitlement): boolean {
  if (!e.stripeConfigured) return true; // free-for-all mode
  return e.hasPremium;
}
