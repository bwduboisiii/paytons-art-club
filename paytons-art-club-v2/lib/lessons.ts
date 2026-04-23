import type { Lesson } from './types';

// Critter Cove
import cc01 from '@/public/lessons/critter_cove_01.json';
import cc02 from '@/public/lessons/critter_cove_02.json';
import cc03 from '@/public/lessons/critter_cove_03.json';
import cc04 from '@/public/lessons/critter_cove_04.json';
import cc05 from '@/public/lessons/critter_cove_05.json';
import cc06 from '@/public/lessons/critter_cove_06.json';
import cc07 from '@/public/lessons/critter_cove_07.json';
import cc08 from '@/public/lessons/critter_cove_08.json';

// Sparkle Kingdom
import sk01 from '@/public/lessons/sparkle_kingdom_01.json';
import sk02 from '@/public/lessons/sparkle_kingdom_02.json';
import sk03 from '@/public/lessons/sparkle_kingdom_03.json';
import sk04 from '@/public/lessons/sparkle_kingdom_04.json';
import sk05 from '@/public/lessons/sparkle_kingdom_05.json';

// Star Hop
import sh01 from '@/public/lessons/star_hop_01.json';
import sh02 from '@/public/lessons/star_hop_02.json';

// Mermaid Lagoon
import ml01 from '@/public/lessons/mermaid_lagoon_01.json';
import ml02 from '@/public/lessons/mermaid_lagoon_02.json';

const LESSON_MAP: Record<string, Lesson> = {
  critter_cove_01: cc01 as Lesson,
  critter_cove_02: cc02 as Lesson,
  critter_cove_03: cc03 as Lesson,
  critter_cove_04: cc04 as Lesson,
  critter_cove_05: cc05 as Lesson,
  critter_cove_06: cc06 as Lesson,
  critter_cove_07: cc07 as Lesson,
  critter_cove_08: cc08 as Lesson,
  sparkle_kingdom_01: sk01 as Lesson,
  sparkle_kingdom_02: sk02 as Lesson,
  sparkle_kingdom_03: sk03 as Lesson,
  sparkle_kingdom_04: sk04 as Lesson,
  sparkle_kingdom_05: sk05 as Lesson,
  star_hop_01: sh01 as Lesson,
  star_hop_02: sh02 as Lesson,
  mermaid_lagoon_01: ml01 as Lesson,
  mermaid_lagoon_02: ml02 as Lesson,
};

export function getLesson(id: string): Lesson | undefined {
  return LESSON_MAP[id];
}

export function getAllLessons(): Lesson[] {
  return Object.values(LESSON_MAP).sort((a, b) => a.order_index - b.order_index);
}

export function getLessonsForWorld(worldId: string): Lesson[] {
  return getAllLessons()
    .filter((l) => l.world_id === worldId)
    .sort((a, b) => a.order_index - b.order_index);
}
