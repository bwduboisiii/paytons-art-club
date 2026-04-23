-- ============================================================
-- v10 / Pass D-2: Stripe subscription schema
-- SAFE TO RE-RUN
-- ============================================================

-- 1. Parents table — extends auth.users with subscription state.
--    One row per auth user, created on first lookup if missing.
create table if not exists public.parents (
  id uuid primary key references auth.users(id) on delete cascade,
  -- Stripe identifiers
  stripe_customer_id text unique,
  stripe_subscription_id text,
  stripe_price_id text,
  -- Subscription state
  subscription_status text, -- 'trialing', 'active', 'canceled', 'past_due', 'incomplete', null
  subscription_current_period_end timestamptz,
  trial_end timestamptz,
  -- Derived flag, updated via webhook
  has_premium boolean default false not null,
  -- Metadata
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_parents_stripe_customer
  on public.parents(stripe_customer_id);
create index if not exists idx_parents_stripe_subscription
  on public.parents(stripe_subscription_id);

alter table public.parents enable row level security;

-- Parent can read their own row
drop policy if exists "parents_self_read" on public.parents;
create policy "parents_self_read" on public.parents
  for select using (id = auth.uid());

-- Parent can update their own row (e.g. triggering checkout sets their stripe_customer_id
-- via the server-side API route, not here; but we still want to allow reads)
drop policy if exists "parents_self_update" on public.parents;
create policy "parents_self_update" on public.parents
  for update using (id = auth.uid());

-- Parent can insert their own row
drop policy if exists "parents_self_insert" on public.parents;
create policy "parents_self_insert" on public.parents
  for insert with check (id = auth.uid());

-- 2. Trigger: create parent row on auth signup (extends existing handle_new_user)
-- We don't REPLACE the existing trigger, just ensure parent row exists.
-- Safer: a separate trigger.
create or replace function public.handle_new_parent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.parents (id)
    values (new.id)
    on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_parent on auth.users;
create trigger on_auth_user_created_parent
  after insert on auth.users
  for each row execute function public.handle_new_parent();

-- 3. Backfill existing auth users into parents table
do $$
begin
  insert into public.parents (id)
    select id from auth.users
    on conflict (id) do nothing;
end $$;

-- 4. Helper view: convenient way for client to check entitlement
create or replace view public.my_entitlement
with (security_invoker = true) as
select
  id as parent_id,
  has_premium,
  subscription_status,
  subscription_current_period_end,
  trial_end,
  stripe_customer_id,
  stripe_subscription_id
from public.parents
where id = auth.uid();

grant select on public.my_entitlement to authenticated;
