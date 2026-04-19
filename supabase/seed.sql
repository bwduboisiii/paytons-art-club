-- Seed the lessons catalog. Run after schema.sql.
-- This mirrors the JSON in /public/lessons/ so analytics queries work.

insert into public.lessons (id, world_id, order_index, title, subject, guidance_level, estimated_minutes, is_premium) values
  ('critter_cove_01', 'critter_cove', 1, 'Hoppy the Bunny',        'bunny',       'trace_loose',   4, false),
  ('critter_cove_02', 'critter_cove', 2, 'Splashy the Fish',       'fish',        'trace_loose',   4, false),
  ('critter_cove_03', 'critter_cove', 3, 'Whiskers the Cat',       'cat',         'trace_loose',   4, false),
  ('critter_cove_04', 'critter_cove', 4, 'Bumble the Bee',         'bee',         'show_and_copy', 5, false),
  ('critter_cove_05', 'critter_cove', 5, 'Toadie the Frog',        'frog',        'show_and_copy', 5, false),
  ('sparkle_kingdom_01', 'sparkle_kingdom', 1, 'Sparkle Crown',    'crown',       'trace_loose',   4, false),
  ('sparkle_kingdom_02', 'sparkle_kingdom', 2, 'Dreamy Unicorn',   'unicorn',     'show_and_copy', 6, false),
  ('sparkle_kingdom_03', 'sparkle_kingdom', 3, 'Cupcake Castle',   'cupcake',     'show_and_copy', 5, false),
  ('star_hop_01', 'star_hop', 1, 'Little Rocket',                  'rocket',      'trace_loose',   4, false),
  ('star_hop_02', 'star_hop', 2, 'Smiley Moon',                    'moon',        'show_and_copy', 5, false)
on conflict (id) do update set
  title = excluded.title,
  guidance_level = excluded.guidance_level,
  estimated_minutes = excluded.estimated_minutes;
