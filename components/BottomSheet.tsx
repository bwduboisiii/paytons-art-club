'use client';

import { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Optional header title */
  title?: string;
  /** Optional max height as vh value (default 85 = 85% of screen) */
  maxHeightVh?: number;
  /** Prevent closing on backdrop tap (e.g. for destructive confirms) */
  dismissable?: boolean;
}

/**
 * BottomSheet: slides up from the bottom, tappable to dismiss,
 * draggable handle at top, safe-area-aware on iOS.
 *
 * On desktop (wider than 768px) it will still render, but we typically
 * use <Modal> on desktop instead. This component is mobile-first.
 */
export default function BottomSheet({
  open,
  onClose,
  children,
  title,
  maxHeightVh = 85,
  dismissable = true,
}: Props) {
  // Lock body scroll while sheet open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dismissable && onClose()}
            className="fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-sm"
          />
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag={dismissable ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (dismissable && info.offset.y > 100) onClose();
            }}
            style={{ maxHeight: `${maxHeightVh}vh` }}
            className={clsx(
              'fixed bottom-0 left-0 right-0 z-50',
              'bg-cream-50 rounded-t-[28px] shadow-chunky',
              'flex flex-col',
              'pb-[env(safe-area-inset-bottom)]'
            )}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 bg-cream-300 rounded-full" />
            </div>
            {title && (
              <div className="px-6 py-2 border-b-2 border-cream-100">
                <h3 className="font-display font-bold text-lg">{title}</h3>
              </div>
            )}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
