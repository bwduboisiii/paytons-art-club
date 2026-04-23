// ============================================================
// Payton's Art Club - Core Types
// ============================================================

import type { DrawingToolId } from './drawingTools';

export type GuidanceLevel =
  | 'trace_strict'
  | 'trace_loose'
  | 'show_and_copy'
  | 'free_prompt';

export type CompanionKey = 'bunny' | 'kitty' | 'fox' | 'owl';

export interface World {
  id: string;
  name: string;
  tagline: string;
  color: string;
  icon: string;
  unlocked: boolean;
  lessons: string[];
}

export interface LessonStep {
  id: string;
  instruction: string;
  companion_line: string;
  reference_paths: string[];
  show_ghost: boolean;
}

export interface RemixOption {
  id: string;
  label: string;
  emoji: string;
  sticker_keys?: string[];
}

export interface Lesson {
  id: string;
  world_id: string;
  order_index: number;
  title: string;
  subject: string;
  guidance_level: GuidanceLevel;
  estimated_minutes: number;
  is_premium: boolean;
  palette: string[];
  steps: LessonStep[];
  remix_options: RemixOption[];
  completion_sticker: string;
}

export interface Kid {
  id: string;
  parent_id: string;
  name: string;
  age: number | null;
  avatar_key: CompanionKey;
  created_at: string;
}

export interface Artwork {
  id: string;
  kid_id: string;
  lesson_id: string | null;
  title: string | null;
  storage_path: string;
  thumbnail_path: string | null;
  is_favorite: boolean;
  created_at: string;
}

export interface LessonCompletion {
  id: string;
  kid_id: string;
  lesson_id: string;
  completed_at: string;
  duration_seconds: number | null;
  stickers_earned: string[];
  remix_applied: boolean;
}

// ============================================================
// Drawing
// ============================================================

export interface Stroke {
  points: Array<{ x: number; y: number; pressure?: number }>;
  color: string;
  width: number;
  toolId?: DrawingToolId;
}

export interface PlacedSticker {
  key: string;
  // If src is present it's an image sticker (uploaded or URL).
  // If absent, key is treated as an emoji glyph.
  src?: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface CanvasState {
  strokes: Stroke[];
  stickers: PlacedSticker[];
}

// ============================================================
// Custom stickers (user-uploaded)
// ============================================================

export interface CustomSticker {
  id: string;
  kid_id: string;
  name: string;
  storage_path: string;
  created_at: string;
  // Populated client-side after fetch
  signed_url?: string;
}
