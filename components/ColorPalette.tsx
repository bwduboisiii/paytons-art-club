'use client';

import clsx from 'clsx';

interface Props {
  colors: string[];
  selected: string;
  onChange: (color: string) => void;
  className?: string;
}

export default function ColorPalette({ colors, selected, onChange, className }: Props) {
  return (
    <div className={clsx('flex gap-2 flex-wrap items-center', className)}>
      {colors.map((c) => {
        const isSelected = c.toLowerCase() === selected.toLowerCase();
        return (
          <button
            key={c}
            aria-label={`Use color ${c}`}
            onClick={() => onChange(c)}
            className={clsx(
              'w-12 h-12 rounded-full transition-all duration-150 border-4',
              'hover:scale-110 active:scale-95',
              isSelected
                ? 'border-ink-900 scale-110 shadow-chunky'
                : 'border-white shadow-float'
            )}
            style={{ backgroundColor: c }}
          />
        );
      })}
    </div>
  );
}
