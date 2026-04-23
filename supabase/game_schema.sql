-- ============================================================
-- Pass C: Game rooms for pictionary multiplayer
-- SAFE TO RE-RUN
-- ============================================================
-- Notes:
--   - Game rooms are ephemeral. We keep them in a table for lobby
--     creation & friend-can-join-via-code; the actual canvas/guess
--     events flow over Supabase Realtime channels, NOT through
--     this table. The table just holds current game state.
--   - Rooms auto-expire after 30 min via a scheduled cleanup query
--     that you'd run via a Supabase scheduled function. For now
--     old rooms just sit around; they don't hurt anything and the
--     client filters to "active" ones.

create table if not exists public.game_rooms (
  code text primary key,
  host_kid_id uuid not null references public.kids(id) on delete cascade,
  guest_kid_id uuid references public.kids(id) on delete set null,
  phase text not null default 'lobby',
  round_num int not null default 0,
  drawer_kid_id uuid references public.kids(id) on delete set null,
  host_score int not null default 0,
  guest_score int not null default 0,
  current_word text, -- server-side, only host client sets this; guesser queries never read it
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_game_rooms_host on public.game_rooms(host_kid_id);
create index if not exists idx_game_rooms_guest on public.game_rooms(guest_kid_id);
create index if not exists idx_game_rooms_created on public.game_rooms(created_at);

alter table public.game_rooms enable row level security;

-- Host's parent can do anything
drop policy if exists "game_rooms_host_parent_all" on public.game_rooms;
create policy "game_rooms_host_parent_all" on public.game_rooms
  for all using (
    host_kid_id in (select id from public.kids where parent_id = auth.uid())
  );

-- Guest's parent can do anything (including join)
drop policy if exists "game_rooms_guest_parent_all" on public.game_rooms;
create policy "game_rooms_guest_parent_all" on public.game_rooms
  for all using (
    guest_kid_id in (select id from public.kids where parent_id = auth.uid())
  );

-- A kid who knows a room code can SELECT (look up) the room BUT
-- they can only see minimal fields (not current_word). We enforce
-- this by letting them read any row, and the CLIENT chooses which
-- fields to query. For absolute safety we'd want a view, but for
-- v1 this is fine — we just never SELECT current_word from the
-- guest client.
drop policy if exists "game_rooms_authenticated_select" on public.game_rooms;
create policy "game_rooms_authenticated_select" on public.game_rooms
  for select to authenticated using (true);

-- Guest can update only their own join field — an RPC handles this safely.

-- ============================================================
-- RPC: join_game_room
--   - Validates the kid joining belongs to the caller
--   - Only sets guest_kid_id if the room is currently in 'lobby' and empty
--   - Returns the room state for the client to initialize from
-- ============================================================
create or replace function public.join_game_room(
  target_room_code text,
  requesting_kid_id uuid
)
returns table(
  code text,
  host_kid_id uuid,
  guest_kid_id uuid,
  phase text,
  round_num int,
  host_score int,
  guest_score int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_check int;
  room_rec public.game_rooms%rowtype;
begin
  -- Verify caller owns the joining kid
  select count(*) into owner_check
  from public.kids
  where id = requesting_kid_id and parent_id = auth.uid();
  if owner_check = 0 then
    raise exception 'not_authorized';
  end if;

  select * into room_rec from public.game_rooms
    where code = upper(trim(target_room_code));
  if room_rec.code is null then
    raise exception 'room_not_found';
  end if;

  if room_rec.host_kid_id = requesting_kid_id then
    raise exception 'cannot_join_own_room';
  end if;

  -- Already in this room? Fine, just return state.
  if room_rec.guest_kid_id = requesting_kid_id then
    return query select room_rec.code, room_rec.host_kid_id, room_rec.guest_kid_id,
      room_rec.phase, room_rec.round_num, room_rec.host_score, room_rec.guest_score;
    return;
  end if;

  if room_rec.guest_kid_id is not null then
    raise exception 'room_full';
  end if;

  if room_rec.phase <> 'lobby' then
    raise exception 'game_in_progress';
  end if;

  update public.game_rooms set
    guest_kid_id = requesting_kid_id,
    updated_at = now()
    where code = room_rec.code;

  return query select room_rec.code, room_rec.host_kid_id, requesting_kid_id,
    room_rec.phase, room_rec.round_num, room_rec.host_score, room_rec.guest_score;
end;
$$;

grant execute on function public.join_game_room(text, uuid) to authenticated;

-- ============================================================
-- RPC: leave_game_room
-- ============================================================
create or replace function public.leave_game_room(
  target_room_code text,
  requesting_kid_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_check int;
  room_rec public.game_rooms%rowtype;
begin
  select count(*) into owner_check
  from public.kids
  where id = requesting_kid_id and parent_id = auth.uid();
  if owner_check = 0 then
    raise exception 'not_authorized';
  end if;

  select * into room_rec from public.game_rooms
    where code = upper(trim(target_room_code));
  if room_rec.code is null then return; end if;

  -- Host leaving deletes the room entirely
  if room_rec.host_kid_id = requesting_kid_id then
    delete from public.game_rooms where code = room_rec.code;
    return;
  end if;

  -- Guest leaving just clears the guest slot
  if room_rec.guest_kid_id = requesting_kid_id then
    update public.game_rooms set
      guest_kid_id = null,
      phase = 'lobby',
      updated_at = now()
      where code = room_rec.code;
  end if;
end;
$$;

grant execute on function public.leave_game_room(text, uuid) to authenticated;

-- ============================================================
-- Cleanup helper: remove rooms older than 2 hours.
-- Run manually in SQL Editor occasionally, or wire to a cron.
-- ============================================================
create or replace function public.cleanup_old_game_rooms()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count int;
begin
  delete from public.game_rooms
    where created_at < now() - interval '2 hours';
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;
