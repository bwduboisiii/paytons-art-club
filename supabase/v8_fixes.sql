-- ============================================================
-- v8 gap fixes
-- SAFE TO RE-RUN
-- ============================================================

-- Gap 9: heartbeat column for detecting abandoned rooms
alter table public.game_rooms
  add column if not exists last_heartbeat timestamptz default now();

create index if not exists idx_game_rooms_heartbeat
  on public.game_rooms(last_heartbeat);

-- Update the cleanup function to also remove rooms with stale heartbeats
-- (no heartbeat for > 2 minutes means everyone is gone)
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
    where created_at < now() - interval '2 hours'
       or last_heartbeat < now() - interval '10 minutes';
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;
