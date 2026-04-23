-- ============================================================
-- Schema additions for custom stickers feature.
-- SAFE TO RE-RUN — every statement checks/drops before creating.
-- Run this in Supabase SQL Editor.
-- ============================================================

-- 1. Table
create table if not exists public.custom_stickers (
  id uuid primary key default uuid_generate_v4(),
  kid_id uuid not null references public.kids(id) on delete cascade,
  name text not null,
  storage_path text not null,
  created_at timestamptz default now() not null
);

create index if not exists idx_custom_stickers_kid
  on public.custom_stickers(kid_id, created_at desc);

alter table public.custom_stickers enable row level security;

-- 2. Table policy (drop-and-recreate for idempotency)
drop policy if exists "custom_stickers_parent_all" on public.custom_stickers;
create policy "custom_stickers_parent_all" on public.custom_stickers
  for all using (
    kid_id in (select id from public.kids where parent_id = auth.uid())
  );

-- 3. Storage bucket
insert into storage.buckets (id, name, public)
  values ('custom-stickers', 'custom-stickers', false)
  on conflict (id) do nothing;

-- 4. Storage policies (drop-and-recreate)
drop policy if exists "custom_stickers_parent_read" on storage.objects;
create policy "custom_stickers_parent_read" on storage.objects
  for select using (
    bucket_id = 'custom-stickers' and
    (storage.foldername(name))[1] in (
      select id::text from public.kids where parent_id = auth.uid()
    )
  );

drop policy if exists "custom_stickers_parent_write" on storage.objects;
create policy "custom_stickers_parent_write" on storage.objects
  for insert with check (
    bucket_id = 'custom-stickers' and
    (storage.foldername(name))[1] in (
      select id::text from public.kids where parent_id = auth.uid()
    )
  );

drop policy if exists "custom_stickers_parent_delete" on storage.objects;
create policy "custom_stickers_parent_delete" on storage.objects
  for delete using (
    bucket_id = 'custom-stickers' and
    (storage.foldername(name))[1] in (
      select id::text from public.kids where parent_id = auth.uid()
    )
  );
