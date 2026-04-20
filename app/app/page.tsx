'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/Button';
import Companion from '@/components/Companion';
import Sparkles from '@/components/Sparkles';
import LoadingSpinner from '@/components/LoadingSpinner';
import { WORLDS } from '@/lib/worlds';
import { useKidStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import type { Kid } from '@/lib/types';
import clsx from 'clsx';

const WORLD_COLOR_CLASSES: Record<string, { bg: string; shadow: string }> = {
  meadow: { bg: 'bg-meadow-400', shadow: 'shadow-chunky' },
  berry: { bg: 'bg-berry-400', shadow: 'shadow-chunky' },
  sky: { bg: 'bg-sky-400', shadow: 'shadow-chunky' },
  coral: { bg: 'bg-coral-400', shadow: 'shadow-chunky' },
  sparkle: { bg: 'bg-sparkle-400', shadow: 'shadow-chunky' },
};

export default function HomePage() {
  const router = useRouter();
  const { activeKid, setActiveKid } = useKidStore();
  const [kids, setKids] = useState<Kid[]>([]);
  const [loading, setLoading] = useState(true);
  const [showKidSwitcher, setShowKidSwitcher] = useState(false);
  const [stickerCount, setStickerCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('kids')
        .select('*')
        .eq('parent_id', user.id)
        .order('created_at', { ascending: true });

      if (cancelled) return;
      if (data) {
        setKids(data as Kid[]);
        // If activeKid is missing or doesn't match a real kid (parent deleted
        // on another device), reset it.
        const currentExists =
          activeKid && data.some((k: any) => k.id === activeKid.id);
        if (!currentExists && data.length) {
          setActiveKid(data[0] as Kid);
        }
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeKid) return;
    (async () => {
      const supabase = createClient();
      const { count } = await supabase
        .from('kid_stickers')
        .select('*', { count: 'exact', head: true })
        .eq('kid_id', activeKid.id);
      setStickerCount(count || 0);
    })();
  }, [activeKid]);

  if (loading) return <LoadingSpinner label="Warming up the crayons..." />;

  const kid = activeKid || kids[0];

  return (
    <main className="min-h-screen relative">
      <Sparkles count={15} />

      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5">
        <button
          onClick={() => kids.length > 1 && setShowKidSwitcher(true)}
          className={clsx(
            'flex items-center gap-3 rounded-2xl p-2 transition-colors',
            kids.length > 1 && 'hover:bg-cream-100'
          )}
          aria-label="Switch kid"
        >
          {kid && <Companion character={kid.avatar_key as any} size={60} />}
          <div className="text-left">
            <p className="text-sm text-ink-500">Welcome back,</p>
            <h1 className="font-display font-bold text-xl text-ink-900">
              {kid?.name}! {kids.length > 1 && '▾'}
            </h1>
          </div>
        </button>
        <div className="flex gap-3 items-center">
          {stickerCount > 0 && (
            <Link href="/app/stickers">
              <div className="card-cozy px-3 py-2 flex items-center gap-2 cursor-pointer hover:-translate-y-1 transition-transform">
                <span className="text-xl">⭐</span>
                <span className="font-display font-bold">{stickerCount}</span>
              </div>
            </Link>
          )}
          <Link href="/app/gallery">
            <Button variant="secondary" size="sm">
              🖼️ Gallery
            </Button>
          </Link>
          <Link href="/parent">
            <Button variant="ghost" size="sm">
              🔒 Parent
            </Button>
          </Link>
        </div>
      </header>

      <section className="relative z-10 px-6 md:px-12 py-8 max-w-6xl mx-auto">
        <h2 className="heading-1 mb-2">Pick a world to explore</h2>
        <p className="text-ink-700 text-lg mb-10">
          Each world has its own drawing adventures!
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {WORLDS.map((w) => {
            const colors =
              WORLD_COLOR_CLASSES[w.color] || WORLD_COLOR_CLASSES.meadow;
            const locked = !w.unlocked;
            return (
              <button
                key={w.id}
                disabled={locked}
                onClick={() => !locked && router.push(`/app/world/${w.id}`)}
                className={clsx(
                  'card-cozy card-cozy-hover p-6 text-left relative overflow-hidden',
                  locked && 'opacity-60 cursor-not-allowed hover:translate-y-0'
                )}
              >
                <div
                  className={clsx(
                    'absolute -top-6 -right-6 w-32 h-32 rounded-blob',
                    colors.bg,
                    'opacity-30'
                  )}
                />
                <div className="relative">
                  <div className="text-6xl mb-3">{w.icon}</div>
                  <h3 className="heading-3 mb-1">{w.name}</h3>
                  <p className="text-ink-700 mb-4">{w.tagline}</p>
                  {locked ? (
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-ink-500">
                      🔒 Coming Soon
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-coral-500">
                      {w.lessons.length} lessons →
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Kid switcher */}
      <AnimatePresence>
        {showKidSwitcher && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink-900/50 backdrop-blur-sm flex items-center justify-center px-6"
            onClick={() => setShowKidSwitcher(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="card-cozy p-6 max-w-md w-full"
            >
              <h2 className="heading-2 mb-4 text-center">Who's drawing?</h2>
              <div className="space-y-3">
                {kids.map((k) => (
                  <button
                    key={k.id}
                    onClick={() => {
                      setActiveKid(k);
                      setShowKidSwitcher(false);
                    }}
                    className={clsx(
                      'w-full card-cozy p-4 flex items-center gap-4 text-left transition-all hover:-translate-y-1',
                      activeKid?.id === k.id && 'border-coral-400 bg-coral-300/10'
                    )}
                  >
                    <Companion character={k.avatar_key as any} size={50} />
                    <div>
                      <p className="font-display font-bold text-lg">{k.name}</p>
                      <p className="text-sm text-ink-500">Age {k.age}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
