'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Companion from '@/components/Companion';
import Sparkles from '@/components/Sparkles';
import LoadingSpinner from '@/components/LoadingSpinner';
import BuddyChangeModal from '@/components/BuddyChangeModal';
import { WORLDS, getFreeWorlds, getPremiumWorlds } from '@/lib/worlds';
import { getDailyLesson } from '@/lib/lessons';
import { useKidStore } from '@/lib/store';
import { countUnseenFriendships } from '@/lib/friends';
import { createClient } from '@/lib/supabase/client';
import type { Kid, World } from '@/lib/types';
import clsx from 'clsx';

const WORLD_COLOR_CLASSES: Record<string, string> = {
  meadow: 'bg-meadow-400', berry: 'bg-berry-400', sky: 'bg-sky-400',
  coral: 'bg-coral-400', sparkle: 'bg-sparkle-400',
};

function WorldCard({ world, onClick }: { world: World; onClick: () => void }) {
  const colorClass = WORLD_COLOR_CLASSES[world.color] || 'bg-meadow-400';
  const locked = !world.unlocked;
  return (
    <button
      disabled={locked}
      onClick={onClick}
      className={clsx(
        'card-cozy card-cozy-hover p-6 text-left relative overflow-hidden',
        locked && 'opacity-60 cursor-not-allowed hover:translate-y-0'
      )}
    >
      {world.tier === 'premium' && (
        <div className="absolute top-3 right-3 bg-sparkle-400 text-ink-900 text-xs font-bold px-2 py-1 rounded-full shadow-chunky">
          ⭐ Premium
        </div>
      )}
      <div className={clsx('absolute -top-6 -right-6 w-32 h-32 rounded-blob opacity-30', colorClass)} />
      <div className="relative">
        <div className="text-6xl mb-3">{world.icon}</div>
        <h3 className="heading-3 mb-1">{world.name}</h3>
        <p className="text-ink-700 mb-4">{world.tagline}</p>
        {locked ? (
          <span className="inline-flex items-center gap-2 text-sm font-bold text-ink-500">🔒 Coming Soon</span>
        ) : (
          <span className="inline-flex items-center gap-2 text-sm font-bold text-coral-500">
            {world.lessons.length} lessons →
          </span>
        )}
      </div>
    </button>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { activeKid, setActiveKid } = useKidStore();
  const [kids, setKids] = useState<Kid[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuddyModal, setShowBuddyModal] = useState(false);
  const [stickerCount, setStickerCount] = useState(0);
  const [dailyDone, setDailyDone] = useState(false);
  const [unseenFriends, setUnseenFriends] = useState(0);

  const dailyLesson = getDailyLesson();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('kids').select('*')
        .eq('parent_id', user.id)
        .order('created_at', { ascending: true });
      if (cancelled) return;
      if (data) {
        setKids(data as Kid[]);
        const currentExists = activeKid && data.some((k: any) => k.id === activeKid.id);
        if (!currentExists && data.length) setActiveKid(data[0] as Kid);
      }
      // Load unseen friend count for parent badge
      const unseen = await countUnseenFriendships(user.id);
      if (!cancelled) setUnseenFriends(unseen);
      setLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeKid) return;
    (async () => {
      const supabase = createClient();
      const { count } = await supabase
        .from('kid_stickers').select('*', { count: 'exact', head: true })
        .eq('kid_id', activeKid.id);
      setStickerCount(count || 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from('lesson_completions').select('completed_at')
        .eq('kid_id', activeKid.id).eq('lesson_id', dailyLesson.id)
        .gte('completed_at', today.toISOString()).limit(1);
      setDailyDone((data || []).length > 0);
    })();
  }, [activeKid, dailyLesson.id]);

  if (loading) return <LoadingSpinner label="Warming up the crayons..." />;

  const kid = activeKid || kids[0];
  const freeWorlds = getFreeWorlds();
  const premiumWorlds = getPremiumWorlds();

  return (
    <main className="min-h-screen relative">
      <Sparkles count={15} />

      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5">
        <button
          onClick={() => setShowBuddyModal(true)}
          className="flex items-center gap-3 rounded-2xl p-2 hover:bg-cream-100 transition-colors relative"
          aria-label="Change buddy or switch kid"
        >
          {kid && <Companion character={kid.avatar_key as any} size={60} />}
          <div className="text-left">
            <p className="text-sm text-ink-500">Welcome back,</p>
            <h1 className="font-display font-bold text-xl text-ink-900">
              {kid?.name}! ▾
            </h1>
          </div>
          {/* Pencil overlay hinting tappable */}
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-sparkle-400 shadow-chunky flex items-center justify-center text-xs">
            ✎
          </div>
        </button>
        <div className="flex gap-2 md:gap-3 items-center flex-wrap justify-end">
          {stickerCount > 0 && (
            <Link href="/app/stickers">
              <div className="card-cozy px-3 py-2 flex items-center gap-2 cursor-pointer hover:-translate-y-1 transition-transform">
                <span className="text-xl">⭐</span>
                <span className="font-display font-bold">{stickerCount}</span>
              </div>
            </Link>
          )}
          <Link href="/app/game"><Button variant="meadow" size="sm">🎮 Play Game</Button></Link>
          <Link href="/app/friends"><Button variant="secondary" size="sm">👯 Friends</Button></Link>
          <Link href="/app/gallery"><Button variant="secondary" size="sm">🖼️ Gallery</Button></Link>
          <Link href="/parent" className="relative">
            <Button variant="ghost" size="sm">🔒 Parent</Button>
            {unseenFriends > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-coral-500 ring-2 ring-cream-50" aria-label={`${unseenFriends} new friendships to review`} />
            )}
          </Link>
        </div>
      </header>

      <section className="relative z-10 px-6 md:px-12 py-4 max-w-6xl mx-auto">
        <Link href={`/app/lesson/${dailyLesson.id}`} className="block mb-4">
          <div className={clsx(
            'card-cozy card-cozy-hover p-5 relative overflow-hidden',
            dailyDone
              ? 'bg-gradient-to-r from-meadow-300 to-meadow-400 border-meadow-500'
              : 'bg-gradient-to-r from-sparkle-300 to-sparkle-400 border-sparkle-500'
          )}>
            <div className="absolute top-2 right-3 text-4xl opacity-60">
              {dailyDone ? '✓' : '☀️'}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-4xl">📅</div>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wide text-ink-700 mb-1">
                  {dailyDone ? 'Today\'s daily lesson — done!' : 'Today\'s free daily lesson'}
                </p>
                <h2 className="heading-3">{dailyLesson.title}</h2>
                <p className="text-ink-700 text-sm">
                  {dailyDone ? 'Great job! Draw it again if you want.' : 'A new one every day!'}
                </p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/app/draw" className="block mb-8">
          <div className="card-cozy card-cozy-hover p-6 bg-gradient-to-r from-sparkle-300 via-berry-300 to-coral-300 relative overflow-hidden">
            <div className="absolute -top-4 -right-4 text-7xl opacity-40">✨</div>
            <div className="absolute -bottom-2 left-4 text-5xl opacity-30">🎨</div>
            <div className="relative flex items-center gap-4">
              <div className="text-5xl">🖌️</div>
              <div className="flex-1">
                <h2 className="heading-2 mb-1">Free Draw Mode</h2>
                <p className="text-ink-700">Blank canvas, 15 tools, every color. Go wild!</p>
              </div>
              <div className="text-3xl font-bold text-coral-600">→</div>
            </div>
          </div>
        </Link>

        <h2 className="heading-1 mb-2">Free worlds 🌈</h2>
        <p className="text-ink-700 text-lg mb-6">All yours — no unlock needed!</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {freeWorlds.map((w) => (
            <WorldCard key={w.id} world={w} onClick={() => router.push(`/app/world/${w.id}`)} />
          ))}
        </div>

        <h2 className="heading-1 mb-2">More adventures ⭐</h2>
        <p className="text-ink-700 text-lg mb-6">
          Special worlds to explore! (Free for now while we're building!)
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {premiumWorlds.map((w) => (
            <WorldCard key={w.id} world={w} onClick={() => router.push(`/app/world/${w.id}`)} />
          ))}
        </div>
      </section>

      <BuddyChangeModal
        open={showBuddyModal}
        onClose={() => setShowBuddyModal(false)}
        kids={kids}
        onKidSwitch={(k) => setActiveKid(k)}
      />
    </main>
  );
}
