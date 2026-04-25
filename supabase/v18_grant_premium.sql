-- v18: Grant lifetime premium to specific users.
-- Run this in Supabase SQL Editor after deploying v18.
-- These users will have premium access forever, regardless of Stripe subscription.

UPDATE public.parents
SET
  has_premium = true,
  subscription_status = 'admin_grant',
  -- Set period end to a far future date (year 2099) to prevent any auto-expiry logic
  subscription_current_period_end = '2099-12-31 23:59:59+00'::timestamptz
WHERE id = '6f5aa6d8-6cfa-4714-84d4-186a9470a15b';
-- Patrick Moss (bamoss25@gmail.com)

-- Verify the update worked:
SELECT id, has_premium, subscription_status, subscription_current_period_end
FROM public.parents
WHERE id = '6f5aa6d8-6cfa-4714-84d4-186a9470a15b';
