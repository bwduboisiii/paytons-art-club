// ============================================================
// Pictionary word bank
// Kid-safe words for ages 5-10. Organized by difficulty.
// Easy = concrete noun, kids can picture instantly
// Medium = slightly trickier but still visual
// Hard = requires more creative drawing or abstraction
// ============================================================

export type WordDifficulty = 'easy' | 'medium' | 'hard';

export interface GameWord {
  word: string;
  difficulty: WordDifficulty;
  emoji?: string; // optional hint emoji for UI
}

export const WORD_BANK: GameWord[] = [
  // Easy — animals
  { word: 'cat', difficulty: 'easy', emoji: '🐱' },
  { word: 'dog', difficulty: 'easy', emoji: '🐶' },
  { word: 'fish', difficulty: 'easy', emoji: '🐟' },
  { word: 'bird', difficulty: 'easy', emoji: '🐦' },
  { word: 'cow', difficulty: 'easy', emoji: '🐄' },
  { word: 'bunny', difficulty: 'easy', emoji: '🐰' },
  { word: 'pig', difficulty: 'easy', emoji: '🐷' },
  { word: 'bee', difficulty: 'easy', emoji: '🐝' },
  { word: 'frog', difficulty: 'easy', emoji: '🐸' },
  { word: 'duck', difficulty: 'easy', emoji: '🦆' },

  // Easy — things
  { word: 'sun', difficulty: 'easy', emoji: '☀️' },
  { word: 'moon', difficulty: 'easy', emoji: '🌙' },
  { word: 'star', difficulty: 'easy', emoji: '⭐' },
  { word: 'tree', difficulty: 'easy', emoji: '🌳' },
  { word: 'flower', difficulty: 'easy', emoji: '🌸' },
  { word: 'house', difficulty: 'easy', emoji: '🏠' },
  { word: 'ball', difficulty: 'easy', emoji: '⚽' },
  { word: 'car', difficulty: 'easy', emoji: '🚗' },
  { word: 'apple', difficulty: 'easy', emoji: '🍎' },
  { word: 'cake', difficulty: 'easy', emoji: '🍰' },
  { word: 'hat', difficulty: 'easy', emoji: '🎩' },
  { word: 'heart', difficulty: 'easy', emoji: '❤️' },

  // Medium — animals
  { word: 'elephant', difficulty: 'medium', emoji: '🐘' },
  { word: 'butterfly', difficulty: 'medium', emoji: '🦋' },
  { word: 'unicorn', difficulty: 'medium', emoji: '🦄' },
  { word: 'dragon', difficulty: 'medium', emoji: '🐉' },
  { word: 'octopus', difficulty: 'medium', emoji: '🐙' },
  { word: 'penguin', difficulty: 'medium', emoji: '🐧' },
  { word: 'dinosaur', difficulty: 'medium', emoji: '🦖' },
  { word: 'mermaid', difficulty: 'medium', emoji: '🧜' },

  // Medium — things
  { word: 'rainbow', difficulty: 'medium', emoji: '🌈' },
  { word: 'castle', difficulty: 'medium', emoji: '🏰' },
  { word: 'rocket', difficulty: 'medium', emoji: '🚀' },
  { word: 'airplane', difficulty: 'medium', emoji: '✈️' },
  { word: 'cupcake', difficulty: 'medium', emoji: '🧁' },
  { word: 'pizza', difficulty: 'medium', emoji: '🍕' },
  { word: 'snowman', difficulty: 'medium', emoji: '⛄' },
  { word: 'umbrella', difficulty: 'medium', emoji: '☂️' },
  { word: 'balloon', difficulty: 'medium', emoji: '🎈' },
  { word: 'guitar', difficulty: 'medium', emoji: '🎸' },
  { word: 'crown', difficulty: 'medium', emoji: '👑' },
  { word: 'backpack', difficulty: 'medium', emoji: '🎒' },

  // Hard — compound or abstract
  { word: 'birthday party', difficulty: 'hard', emoji: '🎉' },
  { word: 'ice cream cone', difficulty: 'hard', emoji: '🍦' },
  { word: 'school bus', difficulty: 'hard', emoji: '🚌' },
  { word: 'shooting star', difficulty: 'hard', emoji: '🌠' },
  { word: 'treasure chest', difficulty: 'hard', emoji: '💎' },
  { word: 'fairy garden', difficulty: 'hard', emoji: '🧚' },
  { word: 'spaceship', difficulty: 'hard', emoji: '🛸' },
  { word: 'jellyfish', difficulty: 'hard', emoji: '🪼' },
  { word: 'haunted house', difficulty: 'hard', emoji: '🏚️' },
  { word: 'sand castle', difficulty: 'hard', emoji: '🏖️' },
  { word: 'pirate ship', difficulty: 'hard', emoji: '⛵' },
  { word: 'lighthouse', difficulty: 'hard', emoji: '💡' },
];

export function pickRandomWords(count: number, difficulty?: WordDifficulty): GameWord[] {
  const pool = difficulty ? WORD_BANK.filter((w) => w.difficulty === difficulty) : WORD_BANK;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Check if a guess matches the target word. Forgives case, trailing "s",
 * spaces, and some articles. Kid-friendly fuzzy match.
 */
export function matchesGuess(guess: string, target: string): boolean {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace(/^(a|an|the)/, '')
      .replace(/s$/, '');

  const g = normalize(guess);
  const t = normalize(target);
  if (!g || !t) return false;
  if (g === t) return true;
  // Also accept very close matches (off by one char) for short words
  if (t.length >= 4 && Math.abs(g.length - t.length) <= 1) {
    let diffs = 0;
    const longer = g.length > t.length ? g : t;
    const shorter = g.length > t.length ? t : g;
    let j = 0;
    for (let i = 0; i < longer.length; i++) {
      if (longer[i] === shorter[j]) j++;
      else diffs++;
      if (diffs > 1) return false;
    }
    return j === shorter.length;
  }
  return false;
}
