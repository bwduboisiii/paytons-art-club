'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Button from '@/components/Button';
import Companion from '@/components/Companion';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useKidStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { getAllLessons } from '@/lib/lessons';
import { formatRelativeDate } from '@/lib/utils';
import clsx from 'clsx';

const STICKER_EMOJI: Record<string, string> = {
  // Critter Cove
  bunny_gold: '🐰',
  fish_rainbow: '🐠',
  cat_cozy: '🐱',
  bee_buzzy: '🐝',
  frog_hoppy: '🐸',
  dog_happy: '🐶',
  butterfly_bright: '🦋',
  dino_roar: '🦖',
  // Sparkle Kingdom
  crown_royal: '👑',
  unicorn_dream: '🦄',
  cupcake_sprinkle: '🧁',
  flower_bloom: '🌸',
  rainbow_magic: '🌈',
  // Star Hop
  rocket_zoom: '🚀',
  moon_dreamy: '🌙',
  // Mermaid Lagoon
  mermaid_sparkle: '🧜‍♀️',
  seahorse_sweet: '🦄',
};

interface EarnedSticker {
  sticker_key: string;
  earned_at: string;
}

export default function StickersPage() {
  const activeKid = useKidStore((s) => s.activeKid);
  const [earned, setEarned] = useState<EarnedSticker[]>([]);
  const [loading, setLoading] = useState(true);

  const allLessons = getAllLessons();
  const allStickerKeys = Array.from(
    new Set(allLessons.map((l) => l.completion_sticker))
  );

  useEffect(() => {
    if (!activeKid) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('kid_stickers')
        .select('sticker_key, earned_at')
        .eq('kid_id', activeKid.id)
        .order('earned_at', { ascending: false });
      if (!cancelled) {
        setEarned((data as EarnedSticker[]) || []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeKid]);

  const earnedKeys = new Set(earned.map((e) => e.sticker_key));

  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between px-6 md:px-12 py-5">
        <Link href="/app">
          <Button variant="ghost" size="sm">← Home</Button>
        </Link>
        <h1 className="font-display font-bold text-xl">Sticker Book</h1>
        <div className="w-16" />
      </header>

      <section className="px-6 md:px-12 py-8 max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-6xl mb-2 inline-block animate-bounce-soft">⭐</div>
          <h1 className="heading-1">Your Sticker Book</h1>
          <p className="text-ink-700 mt-2">
            You've collected <strong>{earned.length}</strong> of{' '}
            {allStickerKeys.length} stickers!
          </p>
        </div>

        {loading ? (
          <LoadingSpinner label="Finding your stickers..." />
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
            {allStickerKeys.map((key) => {
              const isEarned = earnedKeys.has(key);
              const earnedInfo = earned.find((e) => e.sticker_key === key);
              const emoji = STICKER_EMOJI[key] || '⭐';
              return (
                <div
                  key={key}
                  className={clsx(
                    'card-cozy p-6 flex flex-col items-center gap-2 transition-transform',
                    isEarned ? 'hover:-translate-y-1' : 'opacity-30'
                  )}
                >
                  <div className={clsx('text-6xl', isEarned ? 'animate-bounce-soft' : 'grayscale')}>
                    {isEarned ? emoji : '❓'}
                  </div>
                  <p className="text-xs text-center text-ink-700 font-bold">
                    {isEarned ? key.replace(/_/g, ' ') : 'Locked'}
                  </p>
                  {isEarned && earnedInfo && (
                    <p className="text-[10px] text-ink-500">
                      {formatRelativeDate(earnedInfo.earned_at)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && earned.length === 0 && (
          <div className="card-cozy p-8 text-center max-w-md mx-auto mt-8">
            <Companion character="fox" mood="idle" size={100} />
            <p className="text-ink-700 mt-4">
              Finish a lesson to earn your first sticker!
            </p>
            <Link href="/app" className="inline-block mt-4">
              <Button variant="primary" size="md">Start Drawing</Button>
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
