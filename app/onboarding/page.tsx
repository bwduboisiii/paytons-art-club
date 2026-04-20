'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Companion from '@/components/Companion';
import { createClient } from '@/lib/supabase/client';
import { useKidStore } from '@/lib/store';
import type { CompanionKey } from '@/lib/types';
import clsx from 'clsx';

const COMPANIONS: { key: CompanionKey; name: string }[] = [
  { key: 'bunny', name: 'Hoppy' },
  { key: 'kitty', name: 'Whiskers' },
  { key: 'fox', name: 'Rusty' },
  { key: 'owl', name: 'Hoot' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const setActiveKid = useKidStore((s) => s.setActiveKid);
  const [step, setStep] = useState<'name' | 'age' | 'companion'>('name');
  const [name, setName] = useState('');
  const [age, setAge] = useState(7);
  const [companion, setCompanion] = useState<CompanionKey>('bunny');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Verify there's an active session on mount. If not, redirect to login
  // instead of letting the kid fill out onboarding only to fail on save.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        router.replace('/login?next=/onboarding');
        return;
      }
      setSessionChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function finish() {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/login?next=/onboarding');
      return;
    }
    const { data, error } = await supabase
      .from('kids')
      .insert({
        parent_id: user.id,
        name: name.trim(),
        age,
        avatar_key: companion,
      })
      .select()
      .single();
    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }
    setActiveKid(data as any);
    router.push('/app');
  }

  if (!sessionChecked) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Companion character="bunny" mood="thinking" size={100} />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="card-cozy p-8 md:p-12">
          {step === 'name' && (
            <>
              <div className="flex justify-center mb-6">
                <Companion character="bunny" mood="happy" size={120} />
              </div>
              <h1 className="heading-1 text-center mb-3">
                Let's set up your artist!
              </h1>
              <p className="text-center text-ink-700 mb-8 text-lg">
                What's your little one's name?
              </p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl border-4 border-cream-200 bg-cream-50 focus:border-coral-400 outline-none text-ink-900 text-2xl text-center font-display font-bold"
                placeholder="Kid's name"
                maxLength={30}
                autoFocus
              />
              <div className="flex justify-end mt-8">
                <Button
                  variant="primary"
                  size="lg"
                  disabled={!name.trim()}
                  onClick={() => setStep('age')}
                >
                  Next →
                </Button>
              </div>
            </>
          )}

          {step === 'age' && (
            <>
              <h1 className="heading-1 text-center mb-3">How old is {name}?</h1>
              <p className="text-center text-ink-700 mb-8 text-lg">
                We use this to pick just-right lessons.
              </p>
              <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
                {Array.from({ length: 10 }).map((_, i) => {
                  const a = i + 3;
                  return (
                    <button
                      key={a}
                      onClick={() => setAge(a)}
                      className={clsx(
                        'aspect-square rounded-2xl font-display font-bold text-2xl transition-all',
                        'border-4 hover:scale-110',
                        age === a
                          ? 'bg-coral-500 text-white border-coral-500 scale-110 shadow-chunky'
                          : 'bg-cream-50 text-ink-900 border-cream-200 shadow-float'
                      )}
                    >
                      {a}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between mt-8">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setStep('name')}
                >
                  ← Back
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setStep('companion')}
                >
                  Next →
                </Button>
              </div>
            </>
          )}

          {step === 'companion' && (
            <>
              <h1 className="heading-1 text-center mb-3">
                Pick a drawing buddy!
              </h1>
              <p className="text-center text-ink-700 mb-8 text-lg">
                Your companion will cheer you on in every lesson.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {COMPANIONS.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setCompanion(c.key)}
                    className={clsx(
                      'card-cozy p-4 transition-all',
                      companion === c.key
                        ? 'scale-105 border-coral-400 shadow-chunky'
                        : 'hover:scale-105'
                    )}
                  >
                    <Companion
                      character={c.key}
                      mood={companion === c.key ? 'happy' : 'idle'}
                      size={100}
                    />
                    <p className="font-display font-bold text-center mt-2">
                      {c.name}
                    </p>
                  </button>
                ))}
              </div>
              {error && (
                <p className="text-coral-600 mt-4 text-center bg-coral-300/30 border-2 border-coral-400 rounded-2xl p-3">
                  {error}
                </p>
              )}
              <div className="flex justify-between mt-8">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setStep('age')}
                >
                  ← Back
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={finish}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : "Let's Draw! 🎨"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
