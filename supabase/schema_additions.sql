-- ============================================================
-- ADDITIONAL SCHEMA for Pass 1 features (run AFTER schema.sql)
-- Custom stickers uploaded by kids. Add to existing database.
-- ============================================================

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

create policy "custom_stickers_parent_all" on public.custom_stickers
  for all using (
    kid_id in (select id from public.kids where parent_id = auth.uid())
  );

-- Storage bucket for uploaded stickers
insert into storage.buckets (id, name, public)
  values ('custom-stickers', 'custom-stickers', false)
  on conflict (id) do nothing;

create policy "custom_stickers_parent_read" on storage.objects
  for select using (
    bucket_id = 'custom-stickers' and
    (storage.foldername(name))[1] in (
      select id::text from public.kids where parent_id = auth.uid()
    )
  );

create policy "custom_stickers_parent_write" on storage.objects
  for insert with check (
    bucket_id = 'custom-stickers' and
    (storage.foldername(name))[1] in (
      select id::text from public.kids where parent_id = auth.uid()
    )
  );

create policy "custom_stickers_parent_delete" on storage.objects
  for delete using (
    bucket_id = 'custom-stickers' and
    (storage.foldername(name))[1] in (
      select id::text from public.kids where parent_id = auth.uid()
    )
  );
