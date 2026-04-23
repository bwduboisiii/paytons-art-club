'use client';

import { useState } from 'react';
import clsx from 'clsx';

interface Props {
  colors?: string[]; // ignored now that we always show full palette; kept for API compat
  selected: string;
  onChange: (color: string) => void;
  className?: string;
}

// Full standard palette — always visible, scrollable on mobile.
// Organized by color family for intuitive picking.
const FULL_PALETTE = [
  // Reds & pinks
  '#FF6B5B', '#E85545', '#C73E30', '#FFB3A7', '#FF8E80', '#FFC9BB',
  // Oranges
  '#FF9500', '#FF7A00', '#FFA94D', '#FFC78F',
  // Yellows
  '#FFD166', '#F5B82E', '#FFE59A', '#FFF3B0',
  // Greens
  '#5FB85F', '#3D8F3D', '#8BCE8B', '#B7E4B7', '#2C7A2C', '#C8E6C9',
  // Blues & teals
  '#6B98D6', '#4A7AB8', '#8FB8E8', '#B8D4F5', '#2C5F9B', '#5BA3CF',
  // Purples
  '#B85CA0', '#D67FBA', '#E8A5D1', '#9B4980', '#8B4BA0', '#BC9DD6',
  // Browns & earth
  '#8B4513', '#A0826D', '#D4A574', '#6B4423', '#4A2C2A', '#C4A57B',
  // Neutrals
  '#FFFBF4', '#E5E5E5', '#BBBBBB', '#888888', '#555555', '#2A1B3D', '#000000',
  // Skin tones (inclusive)
  '#FFDBB4', '#F1C27D', '#E0AC69', '#C68642', '#8D5524', '#4A2C1A',
];

export default function ColorPalette({ selected, onChange, className }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className={clsx('flex flex-col gap-2', className)}>
      <div className="flex gap-1.5 items-center overflow-x-auto no-scrollbar py-1 flex-wrap md:flex-nowrap max-w-full">
        {FULL_PALETTE.map((c) => {
          const isSelected = c.toLowerCase() === selected.toLowerCase();
          return (
            <button
              key={c}
              aria-label={`Use color ${c}`}
              onClick={() => onChange(c)}
              className={clsx(
                'shrink-0 w-8 h-8 rounded-full transition-all duration-150 border-[3px]',
                'hover:scale-110 active:scale-95',
                isSelected
                  ? 'border-ink-900 scale-110 shadow-chunky'
                  : 'border-white shadow-float'
              )}
              style={{ backgroundColor: c }}
            />
          );
        })}
        <button
          onClick={() => setPickerOpen((s) => !s)}
          className="shrink-0 w-8 h-8 rounded-full border-[3px] border-white shadow-float hover:scale-110 transition-transform ml-1"
          style={{
            background:
              'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)',
          }}
          aria-label="Custom color picker"
          title="Pick any color"
        />
      </div>

      {pickerOpen && (
        <div className="flex items-center gap-2 px-2 bg-cream-100 rounded-2xl p-2">
          <input
            type="color"
            value={selected}
            onChange={(e) => onChange(e.target.value)}
            className="w-12 h-10 rounded-xl cursor-pointer border-2 border-cream-200"
            aria-label="Pick any color"
          />
          <span className="text-sm font-mono text-ink-700">{selected}</span>
          <button
            onClick={() => setPickerOpen(false)}
            className="ml-auto text-sm text-ink-500 hover:text-ink-900 px-2"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
