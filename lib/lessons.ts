import type { Lesson } from './types';

// Lessons are imported statically so Next.js bundles them.
// Adding a new lesson = add the JSON file + add the import here.
import critterCove01 from '@/public/lessons/critter_cove_01.json';
import critterCove02 from '@/public/lessons/critter_cove_02.json';
import critterCove03 from '@/public/lessons/critter_cove_03.json';
import critterCove04 from '@/public/lessons/critter_cove_04.json';
import critterCove05 from '@/public/lessons/critter_cove_05.json';
import sparkle01 from '@/public/lessons/sparkle_kingdom_01.json';
import sparkle02 from '@/public/lessons/sparkle_kingdom_02.json';
import sparkle03 from '@/public/lessons/sparkle_kingdom_03.json';
import starHop01 from '@/public/lessons/star_hop_01.json';
import starHop02 from '@/public/lessons/star_hop_02.json';

const LESSON_MAP: Record<string, Lesson> = {
  critter_cove_01: critterCove01 as Lesson,
  critter_cove_02: critterCove02 as Lesson,
  critter_cove_03: critterCove03 as Lesson,
  critter_cove_04: critterCove04 as Lesson,
  critter_cove_05: critterCove05 as Lesson,
  sparkle_kingdom_01: sparkle01 as Lesson,
  sparkle_kingdom_02: sparkle02 as Lesson,
  sparkle_kingdom_03: sparkle03 as Lesson,
  star_hop_01: starHop01 as Lesson,
  star_hop_02: starHop02 as Lesson,
};

export function getLesson(id: string): Lesson | undefined {
  return LESSON_MAP[id];
}

export function getAllLessons(): Lesson[] {
  return Object.values(LESSON_MAP).sort(
    (a, b) => a.order_index - b.order_index
  );
}

export function getLessonsForWorld(worldId: string): Lesson[] {
  return getAllLessons()
    .filter(l => l.world_id === worldId)
    .sort((a, b) => a.order_index - b.order_index);
}
