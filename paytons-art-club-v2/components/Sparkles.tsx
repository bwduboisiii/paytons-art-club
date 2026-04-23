'use client';

import { useMemo } from 'react';

interface Props {
  count?: number;
  className?: string;
}

/**
 * Floaty sparkles scattered across a container's background.
 * Pure CSS animation for performance.
 */
export default function Sparkles({ count = 12, className = '' }: Props) {
  const dots = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 6 + Math.random() * 12,
        delay: Math.random() * 2,
      })),
    [count]
  );

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {dots.map(d => (
        <div
          key={d.id}
          className="absolute animate-sparkle"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: d.size,
            height: d.size,
            animationDelay: `${d.delay}s`,
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            <path
              d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z"
              fill="#FFD166"
              opacity="0.8"
            />
          </svg>
        </div>
      ))}
    </div>
  );
}
