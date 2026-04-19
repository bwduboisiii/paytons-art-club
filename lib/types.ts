// ============================================================
// Payton's Art Club - Core Types
// ============================================================

export type GuidanceLevel = 'trace_strict' | 'trace_loose' | 'show_and_copy' | 'free_prompt';

export type CompanionKey = 'bunny' | 'kitty' | 'fox' | 'owl';

export interface World {
  id: string;
  name: string;
  tagline: string;
  color: string; // tailwind token, e.g. "meadow"
  icon: string; // emoji or svg ref
  unlocked: boolean;
  lessons: string[]; // lesson ids in order
}

export interface LessonStep {
  id: string;
  instruction: string; // child-friendly, short
  companion_line: string; // what the companion says (can be audio voiced later)
  // Reference shape drawn behind the kid's canvas at this step.
  // Stored as an array of SVG path "d" strings for simplicity.
  reference_paths: string[];
  // Ghost hint: if true, show faded next-shape outline
  show_ghost: boolean;
}

export interface RemixOption {
  id: string;
  label: string; // "Add a bow!"
  emoji: string;
  // Stickers that can be dropped onto the canvas
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
  palette: string[]; // hex colors offered for this lesson
  steps: LessonStep[];
  remix_options: RemixOption[];
  // Sticker awarded on completion
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
// Drawing engine types
// ============================================================

export interface Stroke {
  points: Array<{ x: number; y: number; pressure?: number }>;
  color: string;
  width: number;
}

export interface PlacedSticker {
  key: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface CanvasState {
  strokes: Stroke[];
  stickers: PlacedSticker[];
}
