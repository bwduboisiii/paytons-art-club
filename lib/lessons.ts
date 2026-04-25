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
// v14a rotation lessons
import cc_r01 from '@/public/lessons/critter_cove_r01.json';
import cc_r02 from '@/public/lessons/critter_cove_r02.json';
import cc_r03 from '@/public/lessons/critter_cove_r03.json';
import cc_r04 from '@/public/lessons/critter_cove_r04.json';

// ========== SPARKLE KINGDOM ==========
import sk01 from '@/public/lessons/sparkle_kingdom_01.json';
import sk02 from '@/public/lessons/sparkle_kingdom_02.json';
import sk03 from '@/public/lessons/sparkle_kingdom_03.json';
import sk04 from '@/public/lessons/sparkle_kingdom_04.json';
import sk05 from '@/public/lessons/sparkle_kingdom_05.json';
import sk_r01 from '@/public/lessons/sparkle_kingdom_r01.json';
import sk_r02 from '@/public/lessons/sparkle_kingdom_r02.json';
import sk_r03 from '@/public/lessons/sparkle_kingdom_r03.json';
import sk_r04 from '@/public/lessons/sparkle_kingdom_r04.json';

// ========== STAR HOP ==========
import sh01 from '@/public/lessons/star_hop_01.json';
import sh02 from '@/public/lessons/star_hop_02.json';
import sh03 from '@/public/lessons/star_hop_03.json';
import sh_r01 from '@/public/lessons/star_hop_r01.json';
import sh_r02 from '@/public/lessons/star_hop_r02.json';
import sh_r03 from '@/public/lessons/star_hop_r03.json';
import sh_r04 from '@/public/lessons/star_hop_r04.json';

// ========== MERMAID LAGOON ==========
import ml01 from '@/public/lessons/mermaid_lagoon_01.json';
import ml02 from '@/public/lessons/mermaid_lagoon_02.json';
import ml03 from '@/public/lessons/mermaid_lagoon_03.json';
import ml_r01 from '@/public/lessons/mermaid_lagoon_r01.json';
import ml_r02 from '@/public/lessons/mermaid_lagoon_r02.json';
import ml_r03 from '@/public/lessons/mermaid_lagoon_r03.json';
import ml_r04 from '@/public/lessons/mermaid_lagoon_r04.json';

// ========== v14a NEW FREE WORLDS ==========
import pp01 from '@/public/lessons/pet_parade_01.json';
import pp02 from '@/public/lessons/pet_parade_02.json';
import pp03 from '@/public/lessons/pet_parade_03.json';
import pp04 from '@/public/lessons/pet_parade_04.json';

import ww01 from '@/public/lessons/weather_wonders_01.json';
import ww02 from '@/public/lessons/weather_wonders_02.json';
import ww03 from '@/public/lessons/weather_wonders_03.json';
import ww04 from '@/public/lessons/weather_wonders_04.json';

import bb01 from '@/public/lessons/bug_buddies_01.json';
import bb02 from '@/public/lessons/bug_buddies_02.json';
import bb03 from '@/public/lessons/bug_buddies_03.json';
import bb04 from '@/public/lessons/bug_buddies_04.json';

import ss01 from '@/public/lessons/shape_shop_01.json';
import ss02 from '@/public/lessons/shape_shop_02.json';
import ss03 from '@/public/lessons/shape_shop_03.json';
import ss04 from '@/public/lessons/shape_shop_04.json';

import gp01 from '@/public/lessons/garden_patch_01.json';
import gp02 from '@/public/lessons/garden_patch_02.json';
import gp03 from '@/public/lessons/garden_patch_03.json';
import gp04 from '@/public/lessons/garden_patch_04.json';

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
  // Critter Cove
  critter_cove_01: cc01 as Lesson, critter_cove_02: cc02 as Lesson,
  critter_cove_03: cc03 as Lesson, critter_cove_04: cc04 as Lesson,
  critter_cove_05: cc05 as Lesson, critter_cove_06: cc06 as Lesson,
  critter_cove_07: cc07 as Lesson, critter_cove_08: cc08 as Lesson,
  critter_cove_r01: cc_r01 as Lesson, critter_cove_r02: cc_r02 as Lesson,
  critter_cove_r03: cc_r03 as Lesson, critter_cove_r04: cc_r04 as Lesson,
  // Sparkle Kingdom
  sparkle_kingdom_01: sk01 as Lesson, sparkle_kingdom_02: sk02 as Lesson,
  sparkle_kingdom_03: sk03 as Lesson, sparkle_kingdom_04: sk04 as Lesson,
  sparkle_kingdom_05: sk05 as Lesson,
  sparkle_kingdom_r01: sk_r01 as Lesson, sparkle_kingdom_r02: sk_r02 as Lesson,
  sparkle_kingdom_r03: sk_r03 as Lesson, sparkle_kingdom_r04: sk_r04 as Lesson,
  // Star Hop
  star_hop_01: sh01 as Lesson, star_hop_02: sh02 as Lesson, star_hop_03: sh03 as Lesson,
  star_hop_r01: sh_r01 as Lesson, star_hop_r02: sh_r02 as Lesson,
  star_hop_r03: sh_r03 as Lesson, star_hop_r04: sh_r04 as Lesson,
  // Mermaid Lagoon
  mermaid_lagoon_01: ml01 as Lesson, mermaid_lagoon_02: ml02 as Lesson,
  mermaid_lagoon_03: ml03 as Lesson,
  mermaid_lagoon_r01: ml_r01 as Lesson, mermaid_lagoon_r02: ml_r02 as Lesson,
  mermaid_lagoon_r03: ml_r03 as Lesson, mermaid_lagoon_r04: ml_r04 as Lesson,
  // v14a new free worlds
  pet_parade_01: pp01 as Lesson, pet_parade_02: pp02 as Lesson,
  pet_parade_03: pp03 as Lesson, pet_parade_04: pp04 as Lesson,
  weather_wonders_01: ww01 as Lesson, weather_wonders_02: ww02 as Lesson,
  weather_wonders_03: ww03 as Lesson, weather_wonders_04: ww04 as Lesson,
  bug_buddies_01: bb01 as Lesson, bug_buddies_02: bb02 as Lesson,
  bug_buddies_03: bb03 as Lesson, bug_buddies_04: bb04 as Lesson,
  shape_shop_01: ss01 as Lesson, shape_shop_02: ss02 as Lesson,
  shape_shop_03: ss03 as Lesson, shape_shop_04: ss04 as Lesson,
  garden_patch_01: gp01 as Lesson, garden_patch_02: gp02 as Lesson,
  garden_patch_03: gp03 as Lesson, garden_patch_04: gp04 as Lesson,
  // Premium worlds
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
 *
 * v14a: The daily pool now includes "rotation pool" lessons (suffix _rNN) that are
 * NOT listed in their world's `lessons[]` array. This means kids see a special
 * surprise lesson each day from a hidden grab-bag, separate from their always-
 * available free worlds.
 *
 * Uses UTC date so the daily is consistent across timezones and (somewhat)
 * resilient to device-local clock errors.
 */
export function getDailyLesson(): Lesson {
  // The rotation pool is the v14a hidden lessons + the new free world lessons.
  // We do NOT include the original free-world lessons (they're always available
  // in their worlds, so featuring them as "today's special" wouldn't feel special).
  // We DO include the new world lessons because there's so much variety now.
  const dailyPool = [
    // Hidden rotation lessons (existing free worlds)
    'critter_cove_r01', 'critter_cove_r02', 'critter_cove_r03', 'critter_cove_r04',
    'sparkle_kingdom_r01', 'sparkle_kingdom_r02', 'sparkle_kingdom_r03', 'sparkle_kingdom_r04',
    'star_hop_r01', 'star_hop_r02', 'star_hop_r03', 'star_hop_r04',
    'mermaid_lagoon_r01', 'mermaid_lagoon_r02', 'mermaid_lagoon_r03', 'mermaid_lagoon_r04',
    // New free world lessons (also always available in their worlds, but in pool too)
    'pet_parade_01', 'pet_parade_02', 'pet_parade_03', 'pet_parade_04',
    'weather_wonders_01', 'weather_wonders_02', 'weather_wonders_03', 'weather_wonders_04',
    'bug_buddies_01', 'bug_buddies_02', 'bug_buddies_03', 'bug_buddies_04',
    'shape_shop_01', 'shape_shop_02', 'shape_shop_03', 'shape_shop_04',
    'garden_patch_01', 'garden_patch_02', 'garden_patch_03', 'garden_patch_04',
  ];

  const today = new Date();
  const dayNum =
    today.getUTCFullYear() * 10000 +
    (today.getUTCMonth() + 1) * 100 +
    today.getUTCDate();
  const idx = dayNum % dailyPool.length;
  return LESSON_MAP[dailyPool[idx]] || LESSON_MAP.critter_cove_01;
}
