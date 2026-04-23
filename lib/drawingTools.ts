// ============================================================
// Drawing Tools - full registry with 15 tools
// ============================================================

export type DrawingToolId =
  | 'marker'
  | 'pencil'
  | 'crayon'
  | 'highlighter'
  | 'spray'
  | 'glitter'
  | 'eraser'
  // New in v4:
  | 'paintbrush'
  | 'chalk'
  | 'neon'
  | 'pen'
  | 'fill'
  | 'line'
  | 'rectangle'
  | 'circle';

export type RenderMode =
  | 'smooth'
  | 'textured'
  | 'spray'
  | 'glitter'
  | 'erase'
  | 'paint'
  | 'chalk'
  | 'neon'
  | 'pen'
  | 'fill'
  | 'line'
  | 'rectangle'
  | 'circle';

export interface DrawingTool {
  id: DrawingToolId;
  label: string;
  icon: string;
  description: string;
  renderMode: RenderMode;
  opacity: number;
  widthMultiplier: number;
  isEraser?: boolean;
  /** If true, tool places exactly one shape per down/up (not per point). */
  isShape?: boolean;
  /** Tool category for grouping the picker. */
  category: 'draw' | 'effect' | 'shape' | 'utility';
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
    category: 'draw',
  },
  pencil: {
    id: 'pencil',
    label: 'Pencil',
    icon: '✏️',
    description: 'Fine lines',
    renderMode: 'textured',
    opacity: 0.85,
    widthMultiplier: 0.5,
    category: 'draw',
  },
  crayon: {
    id: 'crayon',
    label: 'Crayon',
    icon: '🖌',
    description: 'Waxy texture',
    renderMode: 'textured',
    opacity: 0.9,
    widthMultiplier: 1.3,
    category: 'draw',
  },
  paintbrush: {
    id: 'paintbrush',
    label: 'Paintbrush',
    icon: '🎨',
    description: 'Thick watercolor',
    renderMode: 'paint',
    opacity: 0.75,
    widthMultiplier: 2.2,
    category: 'draw',
  },
  chalk: {
    id: 'chalk',
    label: 'Chalk',
    icon: '⬜',
    description: 'Dusty & soft',
    renderMode: 'chalk',
    opacity: 0.7,
    widthMultiplier: 1.5,
    category: 'draw',
  },
  pen: {
    id: 'pen',
    label: 'Pen',
    icon: '🖊',
    description: 'Crisp thin lines',
    renderMode: 'pen',
    opacity: 1,
    widthMultiplier: 0.35,
    category: 'draw',
  },
  highlighter: {
    id: 'highlighter',
    label: 'Highlighter',
    icon: '🟨',
    description: 'See-through glow',
    renderMode: 'smooth',
    opacity: 0.35,
    widthMultiplier: 2,
    category: 'effect',
  },
  neon: {
    id: 'neon',
    label: 'Neon',
    icon: '💡',
    description: 'Glowing lights',
    renderMode: 'neon',
    opacity: 1,
    widthMultiplier: 1,
    category: 'effect',
  },
  spray: {
    id: 'spray',
    label: 'Spray',
    icon: '💨',
    description: 'Scattered dots',
    renderMode: 'spray',
    opacity: 0.8,
    widthMultiplier: 3,
    category: 'effect',
  },
  glitter: {
    id: 'glitter',
    label: 'Glitter',
    icon: '✨',
    description: 'Sparkly magic',
    renderMode: 'glitter',
    opacity: 1,
    widthMultiplier: 1.5,
    category: 'effect',
  },
  line: {
    id: 'line',
    label: 'Line',
    icon: '📏',
    description: 'Straight line',
    renderMode: 'line',
    opacity: 1,
    widthMultiplier: 1,
    isShape: true,
    category: 'shape',
  },
  rectangle: {
    id: 'rectangle',
    label: 'Rectangle',
    icon: '⬛',
    description: 'Box shape',
    renderMode: 'rectangle',
    opacity: 1,
    widthMultiplier: 1,
    isShape: true,
    category: 'shape',
  },
  circle: {
    id: 'circle',
    label: 'Circle',
    icon: '⭕',
    description: 'Round shape',
    renderMode: 'circle',
    opacity: 1,
    widthMultiplier: 1,
    isShape: true,
    category: 'shape',
  },
  fill: {
    id: 'fill',
    label: 'Fill',
    icon: '🪣',
    description: 'Tap to fill',
    renderMode: 'fill',
    opacity: 1,
    widthMultiplier: 1,
    category: 'utility',
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
    category: 'utility',
  },
};

export const TOOL_ORDER: DrawingToolId[] = [
  // draw
  'marker', 'pen', 'pencil', 'crayon', 'paintbrush', 'chalk',
  // effect
  'highlighter', 'neon', 'spray', 'glitter',
  // shape
  'line', 'rectangle', 'circle',
  // utility
  'fill', 'eraser',
];
