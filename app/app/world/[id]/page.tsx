'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Companion from '@/components/Companion';
import { getWorld } from '@/lib/worlds';
import { getLessonsForWorld } from '@/lib/lessons';
import { useKidStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import clsx from 'clsx';

export default function WorldPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const activeKid = useKidStore(s => s.activeKid);
  const world = getWorld(id);
  const lessons = world ? getLessonsForWorld(world.id) : [];
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!activeKid) return;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('lesson_completions')
        .select('lesson_id')
        .eq('kid_id', activeKid.id);
      if (data) setCompleted(new Set(data.map((d: any) => d.lesson_id)));
    })();
  }, [activeKid]);

  if (!world) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <Companion character="owl" mood="thinking" size={100} />
        <p className="mt-4 text-lg text-ink-700">World not found.</p>
        <Link href="/app" className="mt-4">
          <Button variant="primary">Back to Home</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between px-6 md:px-12 py-5">
        <Link href="/app">
          <Button variant="ghost" size="sm">← Home</Button>
        </Link>
        {activeKid && <Companion character={activeKid.avatar_key as any} size={50} />}
      </header>

      <section className="px-6 md:px-12 py-8 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-7xl mb-4 inline-block animate-bounce-soft">{world.icon}</div>
          <h1 className="heading-1">{world.name}</h1>
          <p className="text-lg text-ink-700 mt-2">{world.tagline}</p>
        </div>

        <div className="space-y-4">
          {lessons.map((lesson, idx) => {
            const isCompleted = completed.has(lesson.id);
            const prevCompleted = idx === 0 || completed.has(lessons[idx - 1].id);
            const locked = !prevCompleted && !isCompleted;

            return (
              <button
                key={lesson.id}
                disabled={locked}
                onClick={() => !locked && router.push(`/app/lesson/${lesson.id}`)}
                className={clsx(
                  'w-full card-cozy p-6 flex items-center gap-5 text-left transition-all',
                  !locked && 'card-cozy-hover',
                  locked && 'opacity-50 cursor-not-allowed',
                  isCompleted && 'border-meadow-400 bg-meadow-300/20'
                )}
              >
                <div className={clsx(
                  'w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center shrink-0',
                  isCompleted ? 'bg-meadow-400' : locked ? 'bg-cream-200' : 'bg-coral-400',
                  'shadow-chunky'
                )}>
                  <span className="text-3xl md:text-4xl font-display font-bold text-white">
                    {isCompleted ? '✓' : locked ? '🔒' : idx + 1}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="heading-3">{lesson.title}</h3>
                  <p className="text-ink-700 text-sm mt-1">
                    {lesson.estimated_minutes} min • {lesson.steps.length} steps
                  </p>
                </div>
                {!locked && (
                  <span className="text-2xl text-coral-500 font-bold">
                    {isCompleted ? '↻' : '→'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}
