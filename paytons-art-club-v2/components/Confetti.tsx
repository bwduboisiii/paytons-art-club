'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface Props {
  count?: number;
}

const CONFETTI_COLORS = ['#FF6B5B', '#FFD166', '#8FB8E8', '#8BCE8B', '#D67FBA', '#E85545'];
const CONFETTI_EMOJI = ['⭐', '✨', '💖', '🎉', '🌟'];

export default function Confetti({ count = 40 }: Props) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.8,
        duration: 2 + Math.random() * 2,
        rotate: Math.random() * 360,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        isEmoji: Math.random() > 0.6,
        emoji: CONFETTI_EMOJI[Math.floor(Math.random() * CONFETTI_EMOJI.length)],
        size: 8 + Math.random() * 16,
      })),
    [count]
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(p => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{ left: `${p.x}%`, top: '-10%' }}
          initial={{ y: 0, rotate: 0, opacity: 1 }}
          animate={{
            y: '120vh',
            rotate: p.rotate + 720,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeIn',
          }}
        >
          {p.isEmoji ? (
            <span style={{ fontSize: p.size + 8 }}>{p.emoji}</span>
          ) : (
            <div
              style={{
                width: p.size,
                height: p.size * 0.6,
                backgroundColor: p.color,
                borderRadius: 4,
              }}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
}
