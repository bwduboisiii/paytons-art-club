'use client';

import clsx from 'clsx';

interface Props {
  value: number;
  onChange: (size: number) => void;
  className?: string;
}

const SIZES = [
  { px: 4, label: 'Thin' },
  { px: 8, label: 'Medium' },
  { px: 14, label: 'Thick' },
  { px: 22, label: 'Chunky' },
];

export default function BrushSizer({ value, onChange, className }: Props) {
  return (
    <div className={clsx('flex gap-2 items-center', className)}>
      {SIZES.map(({ px, label }) => {
        const isSelected = value === px;
        return (
          <button
            key={px}
            aria-label={`${label} brush`}
            onClick={() => onChange(px)}
            className={clsx(
              'w-12 h-12 rounded-2xl flex items-center justify-center transition-all',
              'hover:scale-110 active:scale-95 border-4',
              isSelected
                ? 'bg-ink-900 border-ink-900 scale-110 shadow-chunky'
                : 'bg-cream-100 border-white shadow-float'
            )}
          >
            <div
              className={clsx('rounded-full', isSelected ? 'bg-white' : 'bg-ink-900')}
              style={{ width: px, height: px }}
            />
          </button>
        );
      })}
    </div>
  );
}
