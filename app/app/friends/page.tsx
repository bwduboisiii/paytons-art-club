'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/Button';
import Companion from '@/components/Companion';
import LoadingSpinner from '@/components/LoadingSpinner';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useKidStore } from '@/lib/store';
import { useIsMobile } from '@/lib/useIsMobile';
import {
  listFriends,
  addFriendByCode,
  removeFriend,
  regenerateFriendCode,
} from '@/lib/friends';
import { createClient } from '@/lib/supabase/client';
import type { FriendInfo, Kid } from '@/lib/types';
import clsx from 'clsx';

export default function FriendsPage() {
  const router = useRouter();
  const { activeKid, setActiveKid } = useKidStore();
  const isMobile = useIsMobile();
  const [kid, setKid] = useState<Kid | null>(null);
  const [friends, setFriends] = useState<FriendInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [codeInput, setCodeInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<FriendInfo | null>(null);
  const [showCodeShare, setShowCodeShare] = useState(false);

  // Load active kid + friends
  useEffect(() => {
    if (!activeKid) {
      router.replace('/app');
      return;
    }
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      // Refresh the kid record so we have the latest friend_code
      const { data } = await supabase
        .from('kids').select('*').eq('id', activeKid.id).single();
      if (cancelled) return;
      if (data) {
        setKid(data as Kid);
        // Keep store in sync if code changed
        setActiveKid(data as Kid);
      }
      const list = await listFriends(activeKid.id);
      if (!cancelled) {
        setFriends(list);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAdd() {
    if (!activeKid) return;
    setAdding(true); setAddError(null); setAddSuccess(null);
    const result = await addFriendByCode(activeKid.id, codeInput);
    if (!result.ok) {
      setAddError(result.error);
    } else {
      setAddSuccess(result.friend);
      setCodeInput('');
      // Reload friends
      const list = await listFriends(activeKid.id);
      setFriends(list);
      setTimeout(() => setAddSuccess(null), 4000);
    }
    setAdding(false);
  }

  async function handleRemove(friend: FriendInfo) {
    if (!activeKid) return;
    if (!confirm(`Un-friend ${friend.name}?`)) return;
    await removeFriend(activeKid.id, friend.id);
    setFriends((prev) => prev.filter((f) => f.id !== friend.id));
  }

  async function handleRegenerate() {
    if (!activeKid || !kid) return;
    if (!confirm(
      "Get a new code? Your old code will stop working — but your current friends stay."
    )) return;
    const result = await regenerateFriendCode(activeKid.id);
    if (result.ok) {
      setKid({ ...kid, friend_code: result.code });
      setActiveKid({ ...activeKid, friend_code: result.code });
    } else {
      alert(`Couldn't generate a new code: ${result.error}`);
    }
  }

  if (loading) return <LoadingSpinner label="Finding your friends..." />;

  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between px-6 md:px-12 py-5">
        <Link href="/app"><Button variant="ghost" size="sm">← Home</Button></Link>
        <h1 className="font-display font-bold text-xl">My Friends</h1>
        <div className="w-16" />
      </header>

      <section className="px-6 md:px-12 py-4 max-w-3xl mx-auto">
        {/* Play game CTA */}
        <Link href="/app/game" className="block mb-6">
          <div className="card-cozy card-cozy-hover p-5 bg-gradient-to-r from-meadow-300 to-sky-300 relative overflow-hidden">
            <div className="absolute top-2 right-3 text-4xl opacity-40">🎮</div>
            <div className="flex items-center gap-3">
              <div className="text-4xl">✏️</div>
              <div className="flex-1">
                <h2 className="heading-3">Draw & Guess Game</h2>
                <p className="text-ink-700 text-sm">
                  Play in real-time with a friend!
                </p>
              </div>
              <span className="text-coral-600 font-bold text-lg">→</span>
            </div>
          </div>
        </Link>

        {/* My friend code card */}
        <div className="card-cozy p-6 mb-6 bg-gradient-to-br from-sparkle-300 to-sparkle-400">
          <p className="text-sm font-bold uppercase tracking-wide text-ink-700 mb-2">
            Your friend code
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowCodeShare(true)}
              className="bg-cream-50 rounded-2xl px-6 py-4 shadow-chunky text-3xl font-mono font-bold tracking-widest text-ink-900 hover:scale-105 transition-transform"
            >
              {kid?.friend_code || '------'}
            </button>
            <div className="flex-1 min-w-[200px]">
              <p className="text-ink-700 text-sm font-bold">
                Share with friends you know in real life so they can add you.
              </p>
              <button
                onClick={handleRegenerate}
                className="text-xs text-ink-500 underline mt-1 hover:text-ink-900"
              >
                Get a new code →
              </button>
            </div>
          </div>
        </div>

        {/* Add a friend */}
        <div className="card-cozy p-6 mb-6">
          <h2 className="heading-3 mb-2">Add a friend</h2>
          <p className="text-ink-700 text-sm mb-4">
            Ask your friend for their 6-character code, then type it here.
          </p>
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="BUNNY7"
              maxLength={6}
              className="flex-1 min-w-[180px] px-4 py-3 rounded-2xl border-4 border-cream-200 bg-cream-50 focus:border-coral-400 outline-none font-mono font-bold text-2xl text-center tracking-widest"
            />
            <Button
              variant="primary"
              size="lg"
              onClick={handleAdd}
              disabled={adding || codeInput.length !== 6}
            >
              {adding ? 'Adding...' : 'Add friend'}
            </Button>
          </div>
          {addError && (
            <p className="text-coral-600 text-sm mt-3 bg-coral-300/20 rounded-xl p-3">
              {addError}
            </p>
          )}
          <AnimatePresence>
            {addSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 bg-meadow-300/30 rounded-xl p-3 flex items-center gap-3"
              >
                <Companion character={addSuccess.avatar_key} size={40} />
                <p className="font-display font-bold text-ink-900">
                  You're now friends with {addSuccess.name}! 🎉
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Friends list */}
        <h2 className="heading-2 mb-3">
          Your friends{' '}
          <span className="text-ink-500 text-lg font-normal">
            ({friends.length})
          </span>
        </h2>

        {friends.length === 0 ? (
          <div className="card-cozy p-8 text-center">
            <Companion character="fox" mood="idle" size={80} />
            <p className="text-ink-700 mt-4">
              No friends yet! Ask a buddy for their code and type it above.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {friends.map((f) => (
              <div
                key={f.id}
                className="card-cozy p-4 flex items-center gap-3"
              >
                <Companion character={f.avatar_key} size={56} />
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-lg truncate">
                    {f.name}
                  </p>
                  <Link
                    href={`/app/friends/${f.id}`}
                    className="text-sm text-coral-500 font-bold hover:underline"
                  >
                    See their art →
                  </Link>
                </div>
                <button
                  onClick={() => handleRemove(f)}
                  aria-label={`Un-friend ${f.name}`}
                  className="w-8 h-8 rounded-full hover:bg-cream-200 text-ink-500 text-sm"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Share code modal */}
      <AnimatePresence>
        {showCodeShare && kid?.friend_code && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCodeShare(false)}
            className="fixed inset-0 z-50 bg-ink-900/50 backdrop-blur-sm flex items-center justify-center px-6"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="card-cozy p-8 max-w-sm w-full text-center"
            >
              <p className="text-sm uppercase tracking-wide text-ink-500 mb-2 font-bold">
                Share this code
              </p>
              <p className="font-mono font-bold tracking-widest text-6xl text-coral-500 my-4">
                {kid.friend_code}
              </p>
              <p className="text-ink-700 mb-6">
                Read this to your friend! They can type it on their Friends
                screen to add you.
              </p>
              <Button
                variant="primary"
                size="lg"
                onClick={() => setShowCodeShare(false)}
              >
                Got it!
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isMobile && <div className="h-20" aria-hidden />}
      {isMobile && <MobileBottomNav />}
    </main>
  );
}
