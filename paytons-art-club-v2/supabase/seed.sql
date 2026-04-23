-- Seed lesson catalog. Run after schema.sql and schema_additions.sql.
-- Upserts so you can re-run safely.

insert into public.lessons (id, world_id, order_index, title, subject, guidance_level, estimated_minutes, is_premium) values
  ('critter_cove_01', 'critter_cove', 1, 'Hoppy the Bunny',       'bunny',     'trace_loose',    4, false),
  ('critter_cove_02', 'critter_cove', 2, 'Splashy the Fish',      'fish',      'trace_loose',    4, false),
  ('critter_cove_03', 'critter_cove', 3, 'Whiskers the Cat',      'cat',       'trace_loose',    4, false),
  ('critter_cove_04', 'critter_cove', 4, 'Bumble the Bee',        'bee',       'show_and_copy',  5, false),
  ('critter_cove_05', 'critter_cove', 5, 'Toadie the Frog',       'frog',      'show_and_copy',  5, false),
  ('critter_cove_06', 'critter_cove', 6, 'Pupper the Dog',        'dog',       'show_and_copy',  5, false),
  ('critter_cove_07', 'critter_cove', 7, 'Fluttery Butterfly',    'butterfly', 'show_and_copy',  5, false),
  ('critter_cove_08', 'critter_cove', 8, 'Roary the Dinosaur',    'dinosaur',  'show_and_copy',  6, false),
  ('sparkle_kingdom_01', 'sparkle_kingdom', 1, 'Sparkle Crown',   'crown',     'trace_loose',    4, false),
  ('sparkle_kingdom_02', 'sparkle_kingdom', 2, 'Dreamy Unicorn',  'unicorn',   'show_and_copy',  6, false),
  ('sparkle_kingdom_03', 'sparkle_kingdom', 3, 'Cupcake Castle',  'cupcake',   'show_and_copy',  5, false),
  ('sparkle_kingdom_04', 'sparkle_kingdom', 4, 'Pretty Flower',   'flower',    'trace_loose',    4, false),
  ('sparkle_kingdom_05', 'sparkle_kingdom', 5, 'Magic Rainbow',   'rainbow',   'trace_loose',    4, false),
  ('star_hop_01',    'star_hop',    1, 'Little Rocket',           'rocket',    'trace_loose',    4, false),
  ('star_hop_02',    'star_hop',    2, 'Smiley Moon',             'moon',      'show_and_copy',  5, false),
  ('mermaid_lagoon_01', 'mermaid_lagoon', 1, 'Friendly Mermaid',  'mermaid',   'trace_loose',    5, false),
  ('mermaid_lagoon_02', 'mermaid_lagoon', 2, 'Cute Seahorse',     'seahorse',  'show_and_copy',  5, false)
on conflict (id) do update set
  title = excluded.title,
  guidance_level = excluded.guidance_level,
  estimated_minutes = excluded.estimated_minutes,
  order_index = excluded.order_index;
