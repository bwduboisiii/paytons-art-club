'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Companion from './Companion';
import type { CompanionKey } from '@/lib/types';

interface Props {
  character: CompanionKey;
  // Pool of things the buddy can say. Rotates randomly every ~8s.
  encouragements?: string[];
  // Optional fixed message (e.g. current lesson step). Overrides the pool.
  message?: string;
  // If true, buddy is playing a 'cheering' mood (e.g. on stroke complete).
  mood?: 'happy' | 'cheering' | 'thinking' | 'idle';
}

const DEFAULT_LINES = [
  'You\'re doing great!',
  'Wow, look at those colors!',
  'I love your drawing!',
  'Keep going!',
  'So creative!',
  'You\'re an artist!',
  'That looks amazing!',
  'Try a new color!',
  '✨ Magic! ✨',
  'More, more!',
];

/**
 * A cute companion that floats on the right side of the screen.
 * Can be collapsed to a peek tab. Rotates encouragement bubbles
 * periodically. Temporarily swaps in a provided message if given.
 */
export default function FloatingBuddy({
  character,
  encouragements = DEFAULT_LINES,
  message,
  mood = 'happy',
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [lineIdx, setLineIdx] = useState(0);
  const [showBubble, setShowBubble] = useState(true);

  // Rotate encouragement lines when no explicit message is provided
  useEffect(() => {
    if (message) return;
    const id = setInterval(() => {
      setShowBubble(false);
      setTimeout(() => {
        setLineIdx((i) => (i + 1) % encouragements.length);
        setShowBubble(true);
      }, 300);
    }, 8000);
    return () => clearInterval(id);
  }, [encouragements, message]);

  // When an explicit message arrives, always show the bubble
  useEffect(() => {
    if (message) setShowBubble(true);
  }, [message]);

  const currentLine = message || encouragements[lineIdx];

  // Collapsed mode: tiny tab peeking from the right edge
  if (collapsed) {
    return (
      <motion.button
        initial={{ x: 80 }}
        animate={{ x: 0 }}
        exit={{ x: 80 }}
        onClick={() => setCollapsed(false)}
        aria-label="Show buddy"
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-coral-500 hover:bg-coral-400 rounded-l-2xl p-2 shadow-chunky active:translate-x-1 transition-transform"
      >
        <div className="w-12 h-12 rounded-xl bg-cream-50 flex items-center justify-center overflow-hidden">
          <Companion character={character} mood="idle" size={48} />
        </div>
        <span className="block text-[10px] font-bold text-white mt-1">Hi!</span>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ x: 120, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 18 }}
      className="fixed right-4 top-1/2 -translate-y-1/2 z-40 pointer-events-none"
    >
      <div className="flex flex-col items-end gap-2 pointer-events-auto">
        {/* Speech bubble */}
        <AnimatePresence mode="wait">
          {showBubble && currentLine && (
            <motion.div
              key={currentLine}
              initial={{ opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="relative max-w-[180px] bg-cream-50 border-4 border-coral-300 rounded-2xl shadow-chunky px-3 py-2"
            >
              <p className="text-sm font-display font-bold text-ink-900 leading-tight">
                {currentLine}
              </p>
              {/* tail pointing down-right toward the companion */}
              <div className="absolute -bottom-2 right-6 w-4 h-4 bg-cream-50 border-r-4 border-b-4 border-coral-300 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Buddy + tiny collapse tab */}
        <div className="relative">
          {/* subtle glow */}
          <div className="absolute inset-0 rounded-full bg-sparkle-300/40 blur-xl animate-sparkle" />
          <div className="relative bg-cream-50 rounded-full p-2 shadow-float border-4 border-sparkle-300">
            <Companion character={character} mood={mood} size={70} />
          </div>
          <button
            onClick={() => setCollapsed(true)}
            aria-label="Hide buddy"
            className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-ink-900 text-white text-xs font-bold flex items-center justify-center shadow-chunky hover:scale-110 transition-transform"
          >
            ×
          </button>
        </div>
      </div>
    </motion.div>
  );
}
