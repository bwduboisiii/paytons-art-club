import type { Lesson } from './types';

// ========== CRITTER COVE ==========
import cc01 from '@/public/lessons/critter_cove_01.json';
import cc02 from '@/public/lessons/critter_cove_02.json';
import cc03 from '@/public/lessons/critter_cove_03.json';
import cc04 from '@/public/lessons/critter_cove_04.json';
import cc05 from '@/public/lessons/critter_cove_05.json';
import cc06 from '@/public/lessons/critter_cove_06.json';
import cc07 from '@/public/lessons/critter_cove_07.json';
import cc08 from '@/public/lessons/critter_cove_08.json';

// ========== SPARKLE KINGDOM ==========
import sk01 from '@/public/lessons/sparkle_kingdom_01.json';
import sk02 from '@/public/lessons/sparkle_kingdom_02.json';
import sk03 from '@/public/lessons/sparkle_kingdom_03.json';
import sk04 from '@/public/lessons/sparkle_kingdom_04.json';
import sk05 from '@/public/lessons/sparkle_kingdom_05.json';

// ========== STAR HOP ==========
import sh01 from '@/public/lessons/star_hop_01.json';
import sh02 from '@/public/lessons/star_hop_02.json';
import sh03 from '@/public/lessons/star_hop_03.json';

// ========== MERMAID LAGOON ==========
import ml01 from '@/public/lessons/mermaid_lagoon_01.json';
import ml02 from '@/public/lessons/mermaid_lagoon_02.json';
import ml03 from '@/public/lessons/mermaid_lagoon_03.json';

// ========== DINO LAND (premium) ==========
import dl01 from '@/public/lessons/dino_land_01.json';
import dl02 from '@/public/lessons/dino_land_02.json';
import dl03 from '@/public/lessons/dino_land_03.json';

// ========== FAIRY GARDEN (premium) ==========
import fg01 from '@/public/lessons/fairy_garden_01.json';
import fg02 from '@/public/lessons/fairy_garden_02.json';
import fg03 from '@/public/lessons/fairy_garden_03.json';

// ========== FOOD FRIENDS (premium) ==========
import ff01 from '@/public/lessons/food_friends_01.json';
import ff02 from '@/public/lessons/food_friends_02.json';
import ff03 from '@/public/lessons/food_friends_03.json';

// ========== VEHICLE VILLAGE (premium) ==========
import vv01 from '@/public/lessons/vehicle_village_01.json';
import vv02 from '@/public/lessons/vehicle_village_02.json';
import vv03 from '@/public/lessons/vehicle_village_03.json';

const LESSON_MAP: Record<string, Lesson> = {
  critter_cove_01: cc01 as Lesson, critter_cove_02: cc02 as Lesson,
  critter_cove_03: cc03 as Lesson, critter_cove_04: cc04 as Lesson,
  critter_cove_05: cc05 as Lesson, critter_cove_06: cc06 as Lesson,
  critter_cove_07: cc07 as Lesson, critter_cove_08: cc08 as Lesson,
  sparkle_kingdom_01: sk01 as Lesson, sparkle_kingdom_02: sk02 as Lesson,
  sparkle_kingdom_03: sk03 as Lesson, sparkle_kingdom_04: sk04 as Lesson,
  sparkle_kingdom_05: sk05 as Lesson,
  star_hop_01: sh01 as Lesson, star_hop_02: sh02 as Lesson, star_hop_03: sh03 as Lesson,
  mermaid_lagoon_01: ml01 as Lesson, mermaid_lagoon_02: ml02 as Lesson,
  mermaid_lagoon_03: ml03 as Lesson,
  dino_land_01: dl01 as Lesson, dino_land_02: dl02 as Lesson, dino_land_03: dl03 as Lesson,
  fairy_garden_01: fg01 as Lesson, fairy_garden_02: fg02 as Lesson, fairy_garden_03: fg03 as Lesson,
  food_friends_01: ff01 as Lesson, food_friends_02: ff02 as Lesson, food_friends_03: ff03 as Lesson,
  vehicle_village_01: vv01 as Lesson, vehicle_village_02: vv02 as Lesson, vehicle_village_03: vv03 as Lesson,
};

export function getLesson(id: string): Lesson | undefined {
  return LESSON_MAP[id];
}

export function getAllLessons(): Lesson[] {
  return Object.values(LESSON_MAP);
}

export function getLessonsForWorld(worldId: string): Lesson[] {
  return getAllLessons()
    .filter((l) => l.world_id === worldId)
    .sort((a, b) => a.order_index - b.order_index);
}

/**
 * Daily lesson: picks one lesson per calendar day, deterministic.
 * Always picks from FREE worlds so kids don't hit a paywall on the daily.
 * Gap 13: Uses UTC date so the daily is consistent across timezones and
 * (somewhat) resilient to device-local clock errors.
 */
export function getDailyLesson(): Lesson {
  const dailyPool = [
    'critter_cove_01', 'critter_cove_02', 'critter_cove_03',
    'critter_cove_04', 'critter_cove_05', 'critter_cove_06',
    'critter_cove_07', 'critter_cove_08',
    'sparkle_kingdom_01', 'sparkle_kingdom_02', 'sparkle_kingdom_03',
    'sparkle_kingdom_04', 'sparkle_kingdom_05',
    'star_hop_01', 'star_hop_02', 'star_hop_03',
    'mermaid_lagoon_01', 'mermaid_lagoon_02', 'mermaid_lagoon_03',
  ];

  const today = new Date();
  // UTC-based day index: consistent across timezones
  const dayNum =
    today.getUTCFullYear() * 10000 +
    (today.getUTCMonth() + 1) * 100 +
    today.getUTCDate();
  const idx = dayNum % dailyPool.length;
  return LESSON_MAP[dailyPool[idx]] || LESSON_MAP.critter_cove_01;
}
