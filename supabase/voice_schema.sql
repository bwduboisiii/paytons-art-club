-- ============================================================
-- v9 / Pass D-1: Voice recordings for lessons
-- SAFE TO RE-RUN
-- ============================================================

-- Add voice_note_path column to artworks
alter table public.artworks
  add column if not exists voice_note_path text,
  add column if not exists voice_note_duration_seconds int;

create index if not exists idx_artworks_voice
  on public.artworks(kid_id) where voice_note_path is not null;

-- Storage bucket for voice recordings
insert into storage.buckets (id, name, public)
  values ('voice-notes', 'voice-notes', false)
  on conflict (id) do nothing;

-- RLS: parent can read/write/delete their own kids' voice notes
drop policy if exists "voice_notes_parent_read" on storage.objects;
create policy "voice_notes_parent_read" on storage.objects
  for select using (
    bucket_id = 'voice-notes' and
    (storage.foldername(name))[1] in (
      select id::text from public.kids where parent_id = auth.uid()
    )
  );

drop policy if exists "voice_notes_parent_write" on storage.objects;
create policy "voice_notes_parent_write" on storage.objects
  for insert with check (
    bucket_id = 'voice-notes' and
    (storage.foldername(name))[1] in (
      select id::text from public.kids where parent_id = auth.uid()
    )
  );

drop policy if exists "voice_notes_parent_delete" on storage.objects;
create policy "voice_notes_parent_delete" on storage.objects
  for delete using (
    bucket_id = 'voice-notes' and
    (storage.foldername(name))[1] in (
      select id::text from public.kids where parent_id = auth.uid()
    )
  );

-- Friends can also read voice notes on artworks that are shared
drop policy if exists "voice_notes_friend_read_shared" on storage.objects;
create policy "voice_notes_friend_read_shared" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'voice-notes'
    and (storage.foldername(name))[1] in (
      select friend_kid_id::text from public.friendships
      where kid_id in (select id from public.kids where parent_id = auth.uid())
    )
  );
