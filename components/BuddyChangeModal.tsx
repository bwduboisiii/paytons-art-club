'use client';

import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import Companion, { ALL_COMPANIONS } from './Companion';
import { createClient } from '@/lib/supabase/client';
import { useKidStore } from '@/lib/store';
import type { CompanionKey, Kid } from '@/lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
  kids: Kid[];
  onKidSwitch: (kid: Kid) => void;
  onBuddyChanged?: (newKey: CompanionKey) => void;
}

/**
 * The "I want to change my buddy OR switch to another kid" modal.
 * Tabs between the two actions so the 7-year-old isn't confused.
 */
export default function BuddyChangeModal({
  open,
  onClose,
  kids,
  onKidSwitch,
  onBuddyChanged,
}: Props) {
  const { activeKid, setActiveKid } = useKidStore();

  async function pickBuddy(key: CompanionKey) {
    if (!activeKid) return;
    const supabase = createClient();
    // Update DB
    await supabase.from('kids').update({ avatar_key: key }).eq('id', activeKid.id);
    // Update local store
    const next = { ...activeKid, avatar_key: key };
    setActiveKid(next);
    onBuddyChanged?.(key);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-ink-900/50 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="card-cozy p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto"
          >
            {/* If multiple kids, offer to switch first */}
            {kids.length > 1 && (
              <>
                <h2 className="heading-2 mb-4 text-center">Who's drawing?</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                  {kids.map((k) => (
                    <button
                      key={k.id}
                      onClick={() => { onKidSwitch(k); onClose(); }}
                      className={clsx(
                        'card-cozy p-3 flex items-center gap-3 text-left transition-all hover:-translate-y-1',
                        activeKid?.id === k.id && 'border-coral-400 bg-coral-300/10'
                      )}
                    >
                      <Companion character={k.avatar_key as any} size={50} />
                      <div>
                        <p className="font-display font-bold">{k.name}</p>
                        <p className="text-xs text-ink-500">Age {k.age}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="border-t-2 border-cream-200 my-4" />
              </>
            )}

            {/* Change buddy section */}
            <h2 className="heading-2 mb-2 text-center">
              Pick your drawing buddy!
            </h2>
            <p className="text-center text-ink-500 text-sm mb-4">
              Tap any one to make it your new friend.
            </p>

            <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
              {ALL_COMPANIONS.map((c) => {
                const isCurrent = activeKid?.avatar_key === c.key;
                return (
                  <button
                    key={c.key}
                    onClick={() => pickBuddy(c.key)}
                    className={clsx(
                      'card-cozy p-2 flex flex-col items-center gap-1 transition-all',
                      isCurrent
                        ? 'border-coral-400 scale-105 shadow-chunky'
                        : 'hover:-translate-y-1'
                    )}
                    aria-label={`Choose ${c.name}`}
                  >
                    <Companion
                      character={c.key}
                      mood={isCurrent ? 'happy' : 'idle'}
                      size={60}
                    />
                    <p className="text-xs font-display font-bold">{c.name}</p>
                  </button>
                );
              })}
            </div>

            <button
              onClick={onClose}
              className="mt-4 w-full py-2 text-ink-500 hover:text-ink-900 font-display font-bold"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
