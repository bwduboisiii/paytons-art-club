import type { World } from './types';

export const WORLDS: World[] = [
  // ========== FREE WORLDS ==========
  {
    id: 'critter_cove',
    name: 'Critter Cove',
    tagline: 'Cozy animals & tiny friends',
    color: 'meadow',
    icon: '🐰',
    unlocked: true,
    tier: 'free',
    lessons: [
      'critter_cove_01', 'critter_cove_02', 'critter_cove_03',
      'critter_cove_04', 'critter_cove_05', 'critter_cove_06',
      'critter_cove_07', 'critter_cove_08',
    ],
  },
  {
    id: 'sparkle_kingdom',
    name: 'Sparkle Kingdom',
    tagline: 'Crowns, unicorns & dreamy castles',
    color: 'berry',
    icon: '👑',
    unlocked: true,
    tier: 'free',
    lessons: [
      'sparkle_kingdom_01', 'sparkle_kingdom_02', 'sparkle_kingdom_03',
      'sparkle_kingdom_04', 'sparkle_kingdom_05',
    ],
  },
  {
    id: 'star_hop',
    name: 'Star Hop',
    tagline: 'Rockets, moons & outer-space pals',
    color: 'sky',
    icon: '🚀',
    unlocked: true,
    tier: 'free',
    lessons: ['star_hop_01', 'star_hop_02', 'star_hop_03'],
  },
  {
    id: 'mermaid_lagoon',
    name: 'Mermaid Lagoon',
    tagline: 'Shimmery tails & ocean treasures',
    color: 'sky',
    icon: '🧜‍♀️',
    unlocked: true,
    tier: 'free',
    lessons: ['mermaid_lagoon_01', 'mermaid_lagoon_02', 'mermaid_lagoon_03'],
  },
  // ========== PREMIUM WORLDS ==========
  {
    id: 'dino_land',
    name: 'Dino Land',
    tagline: 'Prehistoric pals & ancient adventures',
    color: 'meadow',
    icon: '🦕',
    unlocked: true,
    tier: 'premium',
    lessons: ['dino_land_01', 'dino_land_02', 'dino_land_03'],
  },
  {
    id: 'fairy_garden',
    name: 'Fairy Garden',
    tagline: 'Pixies, flowers & enchanted blooms',
    color: 'berry',
    icon: '🧚',
    unlocked: true,
    tier: 'premium',
    lessons: ['fairy_garden_01', 'fairy_garden_02', 'fairy_garden_03'],
  },
  {
    id: 'food_friends',
    name: 'Food Friends',
    tagline: 'Smiley snacks & adorable treats',
    color: 'coral',
    icon: '🍰',
    unlocked: true,
    tier: 'premium',
    lessons: ['food_friends_01', 'food_friends_02', 'food_friends_03'],
  },
  {
    id: 'vehicle_village',
    name: 'Vehicle Village',
    tagline: 'Wheels, wings & things that zoom',
    color: 'sparkle',
    icon: '🚗',
    unlocked: true,
    tier: 'premium',
    lessons: ['vehicle_village_01', 'vehicle_village_02', 'vehicle_village_03'],
  },
];

export function getWorld(id: string): World | undefined {
  return WORLDS.find((w) => w.id === id);
}

export function getFreeWorlds(): World[] {
  return WORLDS.filter((w) => w.tier === 'free');
}

export function getPremiumWorlds(): World[] {
  return WORLDS.filter((w) => w.tier === 'premium');
}
