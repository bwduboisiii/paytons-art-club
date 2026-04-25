'use client';

import { useState } from 'react';
import clsx from 'clsx';
import BottomSheet from './BottomSheet';
import ToolPickerVertical from './ToolPickerVertical';
import ColorPaletteVertical from './ColorPaletteVertical';
import BrushSizer from './BrushSizer';
import type { DrawingToolId } from '@/lib/drawingTools';

interface Props {
  tool: DrawingToolId;
  onToolChange: (t: DrawingToolId) => void;
  color: string;
  onColorChange: (c: string) => void;
  brushWidth: number;
  onBrushWidthChange: (n: number) => void;
  /** Undo action */
  onUndo?: () => void;
  /** Optional extra left-side slot (e.g. "+ Stickers" in remix mode) */
  leftSlot?: React.ReactNode;
  /** Optional primary action button (e.g. "Next →" or "Done!") */
  primaryAction?: React.ReactNode;
}

/**
 * Mobile-only floating toolbar that sits above the bottom edge of the screen.
 * All tool/color pickers open as bottom sheets.
 *
 * Layout (horizontal, from left):
 *   [ Tool: shows current tool icon ] [ Color: shows current swatch ] [ Size ] [ Undo ]
 *   [ leftSlot (optional) ]                                          [ primaryAction (optional) ]
 */
export default function MobileDrawingToolbar({
  tool,
  onToolChange,
  color,
  onColorChange,
  brushWidth,
  onBrushWidthChange,
  onUndo,
  leftSlot,
  primaryAction,
}: Props) {
  const [sheet, setSheet] = useState<'tool' | 'color' | 'size' | null>(null);

  return (
    <>
      {/* Primary action floats at top-right of the canvas area */}
      {primaryAction && (
        <div className="absolute top-3 right-3 z-20">{primaryAction}</div>
      )}

      {/* Bottom toolbar */}
      <div
        className={clsx(
          'fixed left-0 right-0 bottom-0 z-30',
          'bg-cream-50/95 backdrop-blur-md',
          'border-t-2 border-cream-200',
          'pb-[env(safe-area-inset-bottom)]',
          'px-3 py-2'
        )}
      >
        <div className="flex items-center justify-between gap-2 max-w-2xl mx-auto">
          {/* Left slot */}
          {leftSlot && <div className="shrink-0">{leftSlot}</div>}

          {/* Main tool row */}
          <div className="flex-1 flex items-center justify-center gap-2">
            <button
              onClick={() => setSheet('tool')}
              className="flex flex-col items-center justify-center rounded-2xl bg-cream-100 active:bg-cream-200 px-3 py-2 min-w-[56px]"
              aria-label="Tools"
            >
              <ToolIcon toolId={tool} />
              <span className="text-[10px] font-bold text-ink-700 mt-0.5">Tool</span>
            </button>

            <button
              onClick={() => setSheet('color')}
              className="flex flex-col items-center justify-center rounded-2xl bg-cream-100 active:bg-cream-200 px-3 py-2 min-w-[56px]"
              aria-label="Colors"
            >
              <div
                className="w-7 h-7 rounded-full shadow-chunky border-2 border-cream-50"
                style={{ backgroundColor: color }}
              />
              <span className="text-[10px] font-bold text-ink-700 mt-0.5">Color</span>
            </button>

            <button
              onClick={() => setSheet('size')}
              className="flex flex-col items-center justify-center rounded-2xl bg-cream-100 active:bg-cream-200 px-3 py-2 min-w-[56px]"
              aria-label="Brush size"
            >
              <div
                className="rounded-full bg-ink-900"
                style={{
                  width: `${Math.min(24, Math.max(6, brushWidth))}px`,
                  height: `${Math.min(24, Math.max(6, brushWidth))}px`,
                }}
              />
              <span className="text-[10px] font-bold text-ink-700 mt-0.5">Size</span>
            </button>

            {onUndo && (
              <button
                onClick={onUndo}
                className="flex flex-col items-center justify-center rounded-2xl bg-cream-100 active:bg-cream-200 px-3 py-2 min-w-[56px]"
                aria-label="Undo"
              >
                <span className="text-2xl leading-none">↶</span>
                <span className="text-[10px] font-bold text-ink-700 mt-0.5">Undo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tool sheet */}
      <BottomSheet
        open={sheet === 'tool'}
        onClose={() => setSheet(null)}
        title="Pick a tool"
        maxHeightVh={70}
      >
        <div className="h-[55vh]">
          <ToolPickerVertical
            value={tool}
            onChange={(t) => {
              onToolChange(t);
              setSheet(null);
            }}
          />
        </div>
      </BottomSheet>

      {/* Color sheet */}
      <BottomSheet
        open={sheet === 'color'}
        onClose={() => setSheet(null)}
        title="Pick a color"
        maxHeightVh={70}
      >
        <div className="h-[55vh]">
          <ColorPaletteVertical
            selected={color}
            onChange={(c) => {
              onColorChange(c);
              setSheet(null);
            }}
          />
        </div>
      </BottomSheet>

      {/* Size sheet */}
      <BottomSheet
        open={sheet === 'size'}
        onClose={() => setSheet(null)}
        title="Brush size"
        maxHeightVh={40}
      >
        <div className="py-4">
          <BrushSizer value={brushWidth} onChange={onBrushWidthChange} />
        </div>
      </BottomSheet>
    </>
  );
}

/**
 * Tiny tool icon renderer. Re-uses the same emoji mapping the tool picker uses.
 * Kept simple — just shows the current tool's icon.
 */
function ToolIcon({ toolId }: { toolId: DrawingToolId }) {
  const iconMap: Record<string, string> = {
    marker: '🖍️',
    pen: '✒️',
    pencil: '✏️',
    crayon: '🖍',
    paintbrush: '🖌',
    chalk: '▪',
    highlighter: '🖊',
    neon: '💡',
    spray: '💨',
    glitter: '✨',
    line: '📏',
    rectangle: '▭',
    circle: '◯',
    fill_bucket: '🪣',
    eraser: '🧽',
  };
  return (
    <span className="text-2xl leading-none">
      {iconMap[toolId] || '✏️'}
    </span>
  );
}
