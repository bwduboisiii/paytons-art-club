'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Companion from './Companion';
import type { CompanionKey } from '@/lib/types';

interface Props {
  character: CompanionKey;
  encouragements?: string[];
  message?: string;
  mood?: 'happy' | 'cheering' | 'thinking' | 'idle';
  /** @deprecated Kept for backward compat; ignored. */
  offsetRight?: number;
  /** Start in collapsed (peek tab) mode. */
  defaultCollapsed?: boolean;
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

export default function FloatingBuddy({
  character,
  encouragements = DEFAULT_LINES,
  message,
  mood = 'happy',
  defaultCollapsed = false,
}: Props) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [lineIdx, setLineIdx] = useState(0);
  const [showBubble, setShowBubble] = useState(true);

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

  useEffect(() => {
    if (message) setShowBubble(true);
  }, [message]);

  const currentLine = message || encouragements[lineIdx];

  // ============================================================
  // CRITICAL: pointer-events handling (v16c fix)
  // ============================================================
  // The whole outer wrapper uses pointer-events-none. Only the EXACT
  // interactive elements (the avatar button, the close X, the peek tab)
  // opt back in via pointer-events-auto.
  //
  // This means kids drawing on the canvas behind/around the buddy will
  // NOT have their pointer events captured by empty buddy padding or
  // the speech bubble area. The buddy only intercepts when they tap
  // directly on the avatar circle or the close button.
  // ============================================================

  // COLLAPSED MODE: tiny tab on the left edge
  if (collapsed) {
    return (
      <div className="fixed left-0 bottom-24 md:bottom-20 z-40 pointer-events-none">
        <motion.button
          initial={{ x: -80 }}
          animate={{ x: 0 }}
          exit={{ x: -80 }}
          onClick={() => setCollapsed(false)}
          aria-label="Show buddy"
          className="bg-coral-500 hover:bg-coral-400 rounded-r-2xl p-2 shadow-chunky active:-translate-x-1 transition-transform pointer-events-auto"
        >
          <div className="w-10 h-14 rounded-xl bg-cream-50 flex items-end justify-center overflow-hidden">
            <Companion character={character} mood="idle" size={36} />
          </div>
          <span className="block text-[10px] font-bold text-white mt-1">Hi!</span>
        </motion.button>
      </div>
    );
  }

  // EXPANDED MODE: speech bubble + buddy avatar
  return (
    <div className="fixed left-4 bottom-24 md:bottom-20 z-40 pointer-events-none">
      <div className="flex flex-col items-start gap-2">
        {/* Speech bubble — purely visual, NO pointer events */}
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
              <div className="absolute -bottom-2 left-6 w-4 h-4 bg-cream-50 border-r-4 border-b-4 border-coral-300 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Buddy avatar block — ONLY the actual avatar gets pointer events */}
        <div className="relative">
          {/* Sparkle glow — visual only, no events */}
          <div className="absolute inset-0 rounded-3xl bg-sparkle-300/40 blur-xl animate-sparkle" />

          {/* The actual buddy — clicking it collapses */}
          <div
            onClick={() => setCollapsed(true)}
            className="relative bg-cream-50 rounded-3xl p-1.5 shadow-float border-4 border-sparkle-300 flex items-end justify-center pointer-events-auto cursor-pointer hover:scale-105 transition-transform"
            title="Tap to hide buddy"
          >
            <Companion character={character} mood={mood} size={56} />
          </div>

          {/* Hide button — pointer-events-auto */}
          <button
            onClick={(e) => { e.stopPropagation(); setCollapsed(true); }}
            aria-label="Hide buddy"
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-ink-900 text-white text-xs font-bold flex items-center justify-center shadow-chunky hover:scale-110 transition-transform pointer-events-auto"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
