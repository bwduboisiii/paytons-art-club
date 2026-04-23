// ============================================================
// Drawing Tools
// Each tool has its own rendering behavior. The canvas reads this
// descriptor and applies the right settings.
// ============================================================

export type DrawingToolId =
  | 'marker'
  | 'pencil'
  | 'crayon'
  | 'highlighter'
  | 'spray'
  | 'glitter'
  | 'eraser';

export interface DrawingTool {
  id: DrawingToolId;
  label: string;
  icon: string; // emoji or single char
  description: string;
  // Rendering hints. The canvas uses these to decide how to draw.
  renderMode: 'smooth' | 'textured' | 'spray' | 'glitter' | 'erase';
  // Opacity multiplier (1 = fully opaque, 0.4 = transparent like highlighter)
  opacity: number;
  // Extra stroke-width multiplier (1 = normal)
  widthMultiplier: number;
  // If true, uses destination-out composite (eraser mode)
  isEraser?: boolean;
}

export const DRAWING_TOOLS: Record<DrawingToolId, DrawingTool> = {
  marker: {
    id: 'marker',
    label: 'Marker',
    icon: '🖍',
    description: 'Bold and smooth',
    renderMode: 'smooth',
    opacity: 1,
    widthMultiplier: 1,
  },
  pencil: {
    id: 'pencil',
    label: 'Pencil',
    icon: '✏️',
    description: 'Fine lines',
    renderMode: 'textured',
    opacity: 0.85,
    widthMultiplier: 0.5,
  },
  crayon: {
    id: 'crayon',
    label: 'Crayon',
    icon: '🖌',
    description: 'Waxy texture',
    renderMode: 'textured',
    opacity: 0.9,
    widthMultiplier: 1.3,
  },
  highlighter: {
    id: 'highlighter',
    label: 'Highlighter',
    icon: '🟨',
    description: 'See-through glow',
    renderMode: 'smooth',
    opacity: 0.35,
    widthMultiplier: 2,
  },
  spray: {
    id: 'spray',
    label: 'Spray',
    icon: '💨',
    description: 'Scattered dots',
    renderMode: 'spray',
    opacity: 0.8,
    widthMultiplier: 3,
  },
  glitter: {
    id: 'glitter',
    label: 'Glitter',
    icon: '✨',
    description: 'Sparkly magic',
    renderMode: 'glitter',
    opacity: 1,
    widthMultiplier: 1.5,
  },
  eraser: {
    id: 'eraser',
    label: 'Eraser',
    icon: '🧽',
    description: 'Erase mistakes',
    renderMode: 'erase',
    opacity: 1,
    widthMultiplier: 1.5,
    isEraser: true,
  },
};

export const TOOL_ORDER: DrawingToolId[] = [
  'marker',
  'pencil',
  'crayon',
  'highlighter',
  'spray',
  'glitter',
  'eraser',
];
