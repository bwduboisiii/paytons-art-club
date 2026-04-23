'use client';

import { useState } from 'react';
import clsx from 'clsx';

interface Props {
  colors: string[];
  selected: string;
  onChange: (color: string) => void;
  className?: string;
  showPicker?: boolean;
}

// Expanded preset palette with categories of colors. Shown when no lesson
// palette is provided (free-draw) or when the toggle is flipped.
const EXTRA_PALETTE = [
  // Brights
  '#FF6B5B', '#FF9500', '#FFD166', '#5FB85F', '#6B98D6', '#B85CA0',
  // Pastels
  '#FFB3A7', '#FFD9B3', '#FFE59A', '#B7E4B7', '#B8D4F5', '#E8A5D1',
  // Earth tones
  '#8B4513', '#A0826D', '#D4A574', '#6B4423', '#4A2C2A', '#2A1B3D',
  // Neutrals
  '#FFFBF4', '#E5E5E5', '#888888', '#444444', '#000000',
  // Skin tones (IMPORTANT: inclusive set)
  '#FFDBB4', '#F1C27D', '#E0AC69', '#C68642', '#8D5524', '#4A2C1A',
];

export default function ColorPalette({
  colors,
  selected,
  onChange,
  className,
  showPicker = true,
}: Props) {
  const [mode, setMode] = useState<'lesson' | 'full'>('lesson');
  const [showFullPicker, setShowFullPicker] = useState(false);

  const activeColors = mode === 'lesson' ? colors : EXTRA_PALETTE;

  return (
    <div className={clsx('flex flex-col gap-2', className)}>
      <div className="flex gap-2 flex-wrap items-center">
        {activeColors.map((c) => {
          const isSelected = c.toLowerCase() === selected.toLowerCase();
          return (
            <button
              key={c}
              aria-label={`Use color ${c}`}
              onClick={() => onChange(c)}
              className={clsx(
                'w-10 h-10 rounded-full transition-all duration-150 border-4',
                'hover:scale-110 active:scale-95',
                isSelected
                  ? 'border-ink-900 scale-110 shadow-chunky'
                  : 'border-white shadow-float'
              )}
              style={{ backgroundColor: c }}
            />
          );
        })}

        {showPicker && (
          <>
            {colors.length > 0 && (
              <button
                onClick={() => setMode(mode === 'lesson' ? 'full' : 'lesson')}
                className="w-10 h-10 rounded-full bg-cream-100 border-4 border-white shadow-float hover:scale-110 transition-transform flex items-center justify-center text-sm"
                aria-label="More colors"
                title={mode === 'lesson' ? 'All colors' : 'Lesson colors'}
              >
                {mode === 'lesson' ? '🎨' : '↩'}
              </button>
            )}
            <button
              onClick={() => setShowFullPicker((s) => !s)}
              className="w-10 h-10 rounded-full border-4 border-white shadow-float hover:scale-110 transition-transform"
              style={{
                background:
                  'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)',
              }}
              aria-label="Custom color picker"
              title="Pick any color"
            />
          </>
        )}
      </div>

      {showFullPicker && (
        <div className="flex items-center gap-2 px-2">
          <input
            type="color"
            value={selected}
            onChange={(e) => onChange(e.target.value)}
            className="w-16 h-10 rounded-xl cursor-pointer border-2 border-cream-200"
            aria-label="Pick any color"
          />
          <span className="text-sm font-mono text-ink-700">{selected}</span>
        </div>
      )}
    </div>
  );
}
