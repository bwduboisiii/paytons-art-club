import type { World } from './types';

export const WORLDS: World[] = [
  {
    id: 'critter_cove',
    name: 'Critter Cove',
    tagline: 'Cozy animals & tiny friends',
    color: 'meadow',
    icon: '🐰',
    unlocked: true,
    lessons: [
      'critter_cove_01',
      'critter_cove_02',
      'critter_cove_03',
      'critter_cove_04',
      'critter_cove_05',
    ],
  },
  {
    id: 'sparkle_kingdom',
    name: 'Sparkle Kingdom',
    tagline: 'Crowns, unicorns & dreamy castles',
    color: 'berry',
    icon: '👑',
    unlocked: true,
    lessons: [
      'sparkle_kingdom_01',
      'sparkle_kingdom_02',
      'sparkle_kingdom_03',
    ],
  },
  {
    id: 'star_hop',
    name: 'Star Hop',
    tagline: 'Rockets, moons & outer-space pals',
    color: 'sky',
    icon: '🚀',
    unlocked: true,
    lessons: [
      'star_hop_01',
      'star_hop_02',
    ],
  },
  {
    id: 'mermaid_lagoon',
    name: 'Mermaid Lagoon',
    tagline: 'Shimmery tails & ocean treasures',
    color: 'sky',
    icon: '🧜‍♀️',
    unlocked: false, // coming soon
    lessons: [],
  },
];

export function getWorld(id: string): World | undefined {
  return WORLDS.find(w => w.id === id);
}
