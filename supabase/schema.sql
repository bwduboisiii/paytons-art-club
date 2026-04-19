-- ============================================================
-- Payton's Art Club - Supabase Schema
-- Run this in Supabase SQL editor (or via migrations)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PARENTS (adult accounts — real auth happens via supabase auth)
-- ============================================================
create table if not exists public.parents (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  parent_pin_hash text, -- bcrypt hash of 4-digit parent gate pin
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================================
-- KIDS (profiles owned by a parent; no direct login)
-- A parent may have multiple kid profiles.
-- ============================================================
create table if not exists public.kids (
  id uuid primary key default uuid_generate_v4(),
  parent_id uuid not null references public.parents(id) on delete cascade,
  name text not null,
  age int check (age >= 3 and age <= 14),
  avatar_key text default 'bunny', -- companion character choice
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_kids_parent on public.kids(parent_id);

-- ============================================================
-- LESSONS (content — lives in code/JSON but mirrored here for
-- analytics and future CMS-driven content)
-- ============================================================
create table if not exists public.lessons (
  id text primary key, -- e.g. "critter_cove_01_bunny"
  world_id text not null,
  order_index int not null,
  title text not null,
  subject text not null, -- "bunny", "cupcake"
  guidance_level text not null check (
    guidance_level in ('trace_strict','trace_loose','show_and_copy','free_prompt')
  ),
  estimated_minutes int default 4,
  is_premium boolean default false,
  created_at timestamptz default now() not null
);

create index idx_lessons_world on public.lessons(world_id, order_index);

-- ============================================================
-- LESSON COMPLETIONS (one row per attempt, keep history)
-- ============================================================
create table if not exists public.lesson_completions (
  id uuid primary key default uuid_generate_v4(),
  kid_id uuid not null references public.kids(id) on delete cascade,
  lesson_id text not null references public.lessons(id) on delete cascade,
  completed_at timestamptz default now() not null,
  duration_seconds int,
  stickers_earned text[] default '{}',
  remix_applied boolean default false
);

create index idx_completions_kid on public.lesson_completions(kid_id, completed_at desc);
create index idx_completions_lesson on public.lesson_completions(lesson_id);

-- ============================================================
-- GALLERY (saved artwork — stored as PNG in supabase storage,
-- path recorded here)
-- ============================================================
create table if not exists public.artworks (
  id uuid primary key default uuid_generate_v4(),
  kid_id uuid not null references public.kids(id) on delete cascade,
  lesson_id text references public.lessons(id) on delete set null,
  title text,
  storage_path text not null, -- e.g. "kid_id/uuid.png"
  thumbnail_path text,
  is_favorite boolean default false,
  created_at timestamptz default now() not null
);

create index idx_artworks_kid on public.artworks(kid_id, created_at desc);

-- ============================================================
-- STICKERS (collectibles earned by kids)
-- ============================================================
create table if not exists public.kid_stickers (
  id uuid primary key default uuid_generate_v4(),
  kid_id uuid not null references public.kids(id) on delete cascade,
  sticker_key text not null,
  earned_at timestamptz default now() not null,
  unique(kid_id, sticker_key)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Parents can only see their own data and their kids' data.
-- ============================================================
alter table public.parents enable row level security;
alter table public.kids enable row level security;
alter table public.lesson_completions enable row level security;
alter table public.artworks enable row level security;
alter table public.kid_stickers enable row level security;
alter table public.lessons enable row level security;

-- Parents: can only read/write their own row
create policy "parents_select_self" on public.parents
  for select using (auth.uid() = id);
create policy "parents_update_self" on public.parents
  for update using (auth.uid() = id);
create policy "parents_insert_self" on public.parents
  for insert with check (auth.uid() = id);

-- Kids: parent can manage their own kids
create policy "kids_parent_all" on public.kids
  for all using (parent_id = auth.uid());

-- Completions: parent can see their kids' completions
create policy "completions_parent_all" on public.lesson_completions
  for all using (
    kid_id in (select id from public.kids where parent_id = auth.uid())
  );

-- Artworks
create policy "artworks_parent_all" on public.artworks
  for all using (
    kid_id in (select id from public.kids where parent_id = auth.uid())
  );

-- Stickers
create policy "stickers_parent_all" on public.kid_stickers
  for all using (
    kid_id in (select id from public.kids where parent_id = auth.uid())
  );

-- Lessons: world-readable (content catalog)
create policy "lessons_public_read" on public.lessons
  for select using (true);

-- ============================================================
-- STORAGE BUCKET for artwork
-- Run separately in dashboard OR via:
-- ============================================================
insert into storage.buckets (id, name, public)
  values ('artwork', 'artwork', false)
  on conflict (id) do nothing;

create policy "artwork_parent_read" on storage.objects
  for select using (
    bucket_id = 'artwork' and
    (storage.foldername(name))[1] in (
      select id::text from public.kids where parent_id = auth.uid()
    )
  );

create policy "artwork_parent_write" on storage.objects
  for insert with check (
    bucket_id = 'artwork' and
    (storage.foldername(name))[1] in (
      select id::text from public.kids where parent_id = auth.uid()
    )
  );

-- ============================================================
-- AUTO-CREATE PARENT ROW ON SIGNUP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.parents (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
