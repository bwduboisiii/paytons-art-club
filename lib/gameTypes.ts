// ============================================================
// Game event types for realtime pictionary
// Everything that travels over Supabase Realtime is one of these.
// ============================================================

import type { GameWord } from './gameWords';

export type GamePhase =
  | 'lobby' // Waiting for second player to join
  | 'word_pick' // Drawer is picking from 3 word options
  | 'drawing' // Drawer is drawing, guesser is guessing
  | 'round_end' // Reveal word, show points
  | 'game_over'; // Someone left or player chose to end

export interface GameRoom {
  code: string; // 4-char room code like "WOLF"
  hostKidId: string;
  hostKidName: string;
  hostAvatarKey: string;
  guestKidId?: string;
  guestKidName?: string;
  guestAvatarKey?: string;
  phase: GamePhase;
  roundNum: number;
  // Current drawer (rotates each round). Kid IDs.
  drawerKidId?: string;
  currentWord?: string; // only present for drawer in state
  wordOptions?: GameWord[]; // shown to drawer during word_pick
  hostScore: number;
  guestScore: number;
  roundStartedAt?: number; // ms timestamp
}

// --- Event payloads (what travels on the channel) ---

export type GameEvent =
  | { type: 'player_joined'; kidId: string; name: string; avatar: string }
  | { type: 'player_left'; kidId: string }
  | { type: 'word_options'; drawerKidId: string; words: GameWord[] } // host tells guest who draws, hints at game state
  | { type: 'word_picked'; drawerKidId: string; wordHash: string } // wordHash is opaque to guesser
  | { type: 'round_start'; roundNum: number; drawerKidId: string; startedAt: number }
  | {
      type: 'stroke_point';
      // Single point of a stroke. We batch these at ~20Hz.
      pts: Array<{ x: number; y: number }>;
      color: string;
      width: number;
      strokeId: string;
      isLast?: boolean;
    }
  | { type: 'canvas_clear' }
  | { type: 'guess'; guesserKidId: string; text: string; correct: boolean }
  | { type: 'round_end'; word: string; winnerKidId?: string; hostScore: number; guestScore: number }
  | { type: 'next_round_request'; kidId: string }
  | { type: 'chat_emoji'; kidId: string; emoji: string };

export interface Guess {
  id: string;
  kidId: string;
  text: string;
  correct: boolean;
  at: number;
}

/**
 * Constants controlling game feel.
 */
export const ROUND_DURATION_SECONDS = 60;
export const POINTS_FOR_CORRECT_GUESS = 2;
export const POINTS_FOR_DRAWER_ON_CORRECT_GUESS = 1;

/**
 * Generate a fresh 4-character room code.
 * Uses letters only (no confusing 0/O/1/I/L) — 4 chars = 23^4 = 279,841 combinations.
 * Collisions handled at room-creation time by retry.
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  let out = '';
  for (let i = 0; i < 4; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}
