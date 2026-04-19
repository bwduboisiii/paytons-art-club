'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Companion from '@/components/Companion';
import Sparkles from '@/components/Sparkles';
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

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('kids')
        .select('*')
        .eq('parent_id', user.id)
        .order('created_at', { ascending: true });
      if (data) {
        setKids(data as Kid[]);
        if (!activeKid && data.length) setActiveKid(data[0] as Kid);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Companion character="bunny" mood="thinking" size={100} />
      </div>
    );
  }

  const kid = activeKid || kids[0];

  return (
    <main className="min-h-screen relative">
      <Sparkles count={15} />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5">
        <div className="flex items-center gap-3">
          {kid && <Companion character={kid.avatar_key as any} size={60} />}
          <div>
            <p className="text-sm text-ink-500">Welcome back,</p>
            <h1 className="font-display font-bold text-xl text-ink-900">{kid?.name}!</h1>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href="/app/gallery">
            <Button variant="secondary" size="sm">🖼️ Gallery</Button>
          </Link>
          <Link href="/parent">
            <Button variant="ghost" size="sm">🔒 Parent</Button>
          </Link>
        </div>
      </header>

      {/* Worlds */}
      <section className="relative z-10 px-6 md:px-12 py-8 max-w-6xl mx-auto">
        <h2 className="heading-1 mb-2">Pick a world to explore</h2>
        <p className="text-ink-700 text-lg mb-10">Each world has its own drawing adventures!</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {WORLDS.map((w) => {
            const colors = WORLD_COLOR_CLASSES[w.color] || WORLD_COLOR_CLASSES.meadow;
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
                <div className={clsx(
                  'absolute -top-6 -right-6 w-32 h-32 rounded-blob',
                  colors.bg,
                  'opacity-30'
                )} />
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
    </main>
  );
}
