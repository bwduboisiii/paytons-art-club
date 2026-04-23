'use client';

import clsx from 'clsx';
import { DRAWING_TOOLS, TOOL_ORDER, type DrawingToolId } from '@/lib/drawingTools';

interface Props {
  value: DrawingToolId;
  onChange: (t: DrawingToolId) => void;
  className?: string;
  compact?: boolean;
}

export default function ToolPicker({
  value,
  onChange,
  className,
  compact = false,
}: Props) {
  return (
    <div
      className={clsx(
        'flex gap-1 items-center',
        compact ? 'flex-wrap' : '',
        className
      )}
    >
      {TOOL_ORDER.map((id) => {
        const t = DRAWING_TOOLS[id];
        const isSelected = value === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            title={`${t.label} — ${t.description}`}
            aria-label={t.label}
            className={clsx(
              'w-12 h-12 rounded-2xl transition-all flex items-center justify-center text-xl',
              'hover:scale-110 active:scale-95 border-4',
              isSelected
                ? 'bg-coral-500 border-coral-500 scale-110 shadow-chunky'
                : 'bg-cream-50 border-white shadow-float'
            )}
          >
            <span className={isSelected ? '' : 'grayscale-0'}>{t.icon}</span>
          </button>
        );
      })}
    </div>
  );
}
