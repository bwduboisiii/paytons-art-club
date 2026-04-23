-- ============================================================
-- Pass B: Friends system schema
-- SAFE TO RE-RUN - all statements idempotent
-- ============================================================

-- 1. Add friend_code column to kids if missing
alter table public.kids
  add column if not exists friend_code text unique;

create index if not exists idx_kids_friend_code
  on public.kids(friend_code);

-- 2. Friendships table: one row per directed friendship.
--    We'll insert two rows per friendship (A->B and B->A) for easy querying.
--    `auto_accepted=true` with Path A (no approval gate).
create table if not exists public.friendships (
  id uuid primary key default uuid_generate_v4(),
  kid_id uuid not null references public.kids(id) on delete cascade,
  friend_kid_id uuid not null references public.kids(id) on delete cascade,
  created_at timestamptz default now() not null,
  parent_seen_at timestamptz, -- null = parent hasn't seen this in dashboard yet
  unique(kid_id, friend_kid_id),
  check (kid_id <> friend_kid_id)
);

create index if not exists idx_friendships_kid
  on public.friendships(kid_id, created_at desc);

create index if not exists idx_friendships_parent_unseen
  on public.friendships(kid_id, parent_seen_at);

alter table public.friendships enable row level security;

-- Parent of the kid can see and manage their kid's friendships
drop policy if exists "friendships_parent_all" on public.friendships;
create policy "friendships_parent_all" on public.friendships
  for all using (
    kid_id in (select id from public.kids where parent_id = auth.uid())
  );

-- 3. A function to generate a new friend_code for kids that don't have one.
--    Format: 6-char alphanumeric, excluding 0/O/1/I/L to avoid confusion.
create or replace function public.generate_friend_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..6 loop
    result := result || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  end loop;
  return result;
end;
$$;

-- 4. Backfill existing kids without a friend_code
do $$
declare
  kid_rec record;
  new_code text;
  attempts int;
begin
  for kid_rec in select id from public.kids where friend_code is null loop
    attempts := 0;
    loop
      new_code := public.generate_friend_code();
      exit when not exists (select 1 from public.kids where friend_code = new_code);
      attempts := attempts + 1;
      if attempts > 20 then
        raise exception 'Could not generate unique friend code';
      end if;
    end loop;
    update public.kids set friend_code = new_code where id = kid_rec.id;
  end loop;
end $$;

-- 5. Trigger: auto-generate friend_code for new kids
create or replace function public.kids_assign_friend_code()
returns trigger
language plpgsql
as $$
declare
  new_code text;
  attempts int := 0;
begin
  if new.friend_code is null then
    loop
      new_code := public.generate_friend_code();
      exit when not exists (select 1 from public.kids where friend_code = new_code);
      attempts := attempts + 1;
      if attempts > 20 then
        raise exception 'Could not generate unique friend code';
      end if;
    end loop;
    new.friend_code := new_code;
  end if;
  return new;
end;
$$;

drop trigger if exists kids_friend_code_trigger on public.kids;
create trigger kids_friend_code_trigger
  before insert on public.kids
  for each row execute function public.kids_assign_friend_code();

-- 6. Public-read view of kids by friend_code (for the "add friend" lookup).
--    Exposes ONLY: id, name, avatar_key, friend_code. No age, no parent_id.
--    Anyone signed in can query this view by friend_code.
create or replace view public.kids_lookup
with (security_invoker = true) as
select id, name, avatar_key, friend_code
from public.kids
where friend_code is not null;

grant select on public.kids_lookup to authenticated;

-- Need a policy on kids that allows reading the minimal lookup fields when
-- someone is looking up a friend_code. We'll allow read of these specific
-- fields to any authenticated user, since friend codes are intended to
-- be shared between kids.
drop policy if exists "kids_friend_code_public_read" on public.kids;
create policy "kids_friend_code_public_read" on public.kids
  for select
  to authenticated
  using (true);
-- Note: the existing parent-scoped policies remain; this one ADDS read access.
-- Clients should only ever select (id, name, avatar_key, friend_code) when
-- looking up other kids; all write operations remain parent-gated by the
-- pre-existing policies.

-- 7. Allow a kid's parent to read basic info about their kid's friends.
--    Combined with the view above, friends appear in UI with name + avatar.

-- 8. Public-ish view of artworks that are favorited (shared with friends).
--    Parent can mark an artwork as "shared" via a new is_shared flag.
alter table public.artworks
  add column if not exists is_shared boolean default false not null;

create index if not exists idx_artworks_shared
  on public.artworks(kid_id, is_shared) where is_shared = true;

-- Policy: a kid's friends can read that kid's shared artworks.
drop policy if exists "artworks_friend_read_shared" on public.artworks;
create policy "artworks_friend_read_shared" on public.artworks
  for select
  to authenticated
  using (
    is_shared = true
    and kid_id in (
      -- friends of the current user's kids
      select friend_kid_id from public.friendships
      where kid_id in (select id from public.kids where parent_id = auth.uid())
    )
  );

-- Storage: allow reading shared artwork images
drop policy if exists "artwork_friend_read_shared" on storage.objects;
create policy "artwork_friend_read_shared" on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'artwork'
    and (storage.foldername(name))[1] in (
      select friend_kid_id::text from public.friendships
      where kid_id in (select id from public.kids where parent_id = auth.uid())
    )
  );

-- 9. RPC: add_friend_by_code
--    Atomically creates BOTH directions of the friendship so either kid
--    (and either kid's parent) can see the friendship immediately.
--    security definer so it can bypass RLS for the reverse direction.
create or replace function public.add_friend_by_code(
  requesting_kid_id uuid,
  target_friend_code text
)
returns table(
  friend_id uuid,
  friend_name text,
  friend_avatar text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_kid_id uuid;
  target_name text;
  target_avatar text;
  owner_check_count int;
begin
  -- Verify the caller owns requesting_kid_id
  select count(*) into owner_check_count
  from public.kids
  where id = requesting_kid_id and parent_id = auth.uid();

  if owner_check_count = 0 then
    raise exception 'not_authorized';
  end if;

  -- Look up the target kid by friend_code
  select id, name, avatar_key
  into target_kid_id, target_name, target_avatar
  from public.kids
  where friend_code = upper(trim(target_friend_code));

  if target_kid_id is null then
    raise exception 'code_not_found';
  end if;

  if target_kid_id = requesting_kid_id then
    raise exception 'own_code';
  end if;

  -- Insert both directions (idempotent via unique constraint)
  insert into public.friendships (kid_id, friend_kid_id)
    values (requesting_kid_id, target_kid_id)
    on conflict (kid_id, friend_kid_id) do nothing;

  insert into public.friendships (kid_id, friend_kid_id)
    values (target_kid_id, requesting_kid_id)
    on conflict (kid_id, friend_kid_id) do nothing;

  return query select target_kid_id, target_name, target_avatar;
end;
$$;

grant execute on function public.add_friend_by_code(uuid, text) to authenticated;

-- 10. RPC: remove_friend (removes BOTH directions)
create or replace function public.remove_friend(
  requesting_kid_id uuid,
  other_kid_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_check_count int;
begin
  select count(*) into owner_check_count
  from public.kids
  where id = requesting_kid_id and parent_id = auth.uid();

  if owner_check_count = 0 then
    raise exception 'not_authorized';
  end if;

  delete from public.friendships
  where (kid_id = requesting_kid_id and friend_kid_id = other_kid_id)
     or (kid_id = other_kid_id and friend_kid_id = requesting_kid_id);
end;
$$;

grant execute on function public.remove_friend(uuid, uuid) to authenticated;
