'use client';

import clsx from 'clsx';
import { DRAWING_TOOLS, TOOL_ORDER, type DrawingToolId } from '@/lib/drawingTools';

interface Props {
  value: DrawingToolId;
  onChange: (t: DrawingToolId) => void;
  className?: string;
  compact?: boolean;
}

// Group tools by category for clearer UI
const CATEGORY_ORDER: Array<{ key: string; label: string }> = [
  { key: 'draw', label: 'Draw' },
  { key: 'effect', label: 'Effects' },
  { key: 'shape', label: 'Shapes' },
  { key: 'utility', label: 'Tools' },
];

export default function ToolPicker({ value, onChange, className, compact = false }: Props) {
  const grouped: Record<string, DrawingToolId[]> = {};
  TOOL_ORDER.forEach((id) => {
    const cat = DRAWING_TOOLS[id].category;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(id);
  });

  return (
    <div className={clsx('flex gap-3 items-center overflow-x-auto no-scrollbar py-1', className)}>
      {CATEGORY_ORDER.map((cat, catIdx) => (
        <div key={cat.key} className="flex gap-1 items-center shrink-0">
          {grouped[cat.key]?.map((id) => {
            const t = DRAWING_TOOLS[id];
            const isSelected = value === id;
            return (
              <button
                key={id}
                onClick={() => onChange(id)}
                title={`${t.label} — ${t.description}`}
                aria-label={t.label}
                className={clsx(
                  'w-11 h-11 rounded-2xl transition-all flex items-center justify-center text-lg shrink-0',
                  'hover:scale-110 active:scale-95 border-[3px]',
                  isSelected
                    ? 'bg-coral-500 border-coral-500 scale-110 shadow-chunky'
                    : 'bg-cream-50 border-white shadow-float'
                )}
              >
                <span>{t.icon}</span>
              </button>
            );
          })}
          {catIdx < CATEGORY_ORDER.length - 1 && (
            <div className="w-px h-8 bg-cream-200 mx-1 shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}
