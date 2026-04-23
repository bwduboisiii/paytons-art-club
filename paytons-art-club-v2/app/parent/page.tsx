'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Companion from '@/components/Companion';
import LoadingSpinner from '@/components/LoadingSpinner';
import { createClient } from '@/lib/supabase/client';
import { useKidStore } from '@/lib/store';
import type { Kid } from '@/lib/types';

function ParentGate({ onPass }: { onPass: () => void }) {
  const [a] = useState(() => 3 + Math.floor(Math.random() * 7));
  const [b] = useState(() => 3 + Math.floor(Math.random() * 7));
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  function check() {
    if (parseInt(answer, 10) === a + b) {
      onPass();
    } else {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      setError('Not quite — please try again.');
      setAnswer('');
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="card-cozy p-8 md:p-12 max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <Companion character="owl" mood="thinking" size={100} />
        </div>
        <h1 className="heading-1 mb-2">Parent Zone 🔒</h1>
        <p className="text-ink-700 mb-6">
          Please answer this question to continue.
        </p>
        <p className="text-3xl font-display font-bold text-ink-900 mb-4">
          What is {a} + {b}?
        </p>
        <input
          type="number"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && check()}
          className="w-full px-6 py-4 rounded-2xl border-4 border-cream-200 bg-cream-50 focus:border-coral-400 outline-none text-ink-900 text-2xl text-center font-display font-bold mb-3"
          autoFocus
        />
        {error && (
          <p className="text-coral-600 text-sm mb-3">
            {error}
            {attempts >= 3 && ' (Use a calculator if you need!)'}
          </p>
        )}
        <div className="flex gap-3">
          <Link href="/app" className="flex-1">
            <Button variant="secondary" size="lg" className="w-full">
              Cancel
            </Button>
          </Link>
          <Button
            variant="primary"
            size="lg"
            onClick={check}
            className="flex-1"
          >
            Continue
          </Button>
        </div>
      </div>
    </main>
  );
}

export default function ParentPage() {
  const router = useRouter();
  const { activeKid, setActiveKid, clear } = useKidStore();
  const [unlocked, setUnlocked] = useState(false);
  const [kids, setKids] = useState<Kid[]>([]);
  const [completionCount, setCompletionCount] = useState<
    Record<string, number>
  >({});
  const [artworkCount, setArtworkCount] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [parentEmail, setParentEmail] = useState<string>('');

  async function loadData() {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    setParentEmail(user.email || '');

    const { data: kidsData } = await supabase
      .from('kids')
      .select('*')
      .eq('parent_id', user.id)
      .order('created_at', { ascending: true });
    const kidList = (kidsData as Kid[]) || [];
    setKids(kidList);

    const completions: Record<string, number> = {};
    const artworks: Record<string, number> = {};
    await Promise.all(
      kidList.map(async (kid) => {
        const [{ count: cc }, { count: ac }] = await Promise.all([
          supabase
            .from('lesson_completions')
            .select('*', { count: 'exact', head: true })
            .eq('kid_id', kid.id),
          supabase
            .from('artworks')
            .select('*', { count: 'exact', head: true })
            .eq('kid_id', kid.id),
        ]);
        completions[kid.id] = cc || 0;
        artworks[kid.id] = ac || 0;
      })
    );
    setCompletionCount(completions);
    setArtworkCount(artworks);
    setLoading(false);
  }

  useEffect(() => {
    if (unlocked) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    clear();
    router.push('/');
  }

  async function deleteKid(kid: Kid) {
    const confirmMsg = `Really delete ${kid.name}'s profile? This will remove all their artwork and progress. This cannot be undone.`;
    if (!confirm(confirmMsg)) return;
    const supabase = createClient();

    // Remove storage files first
    const { data: artworkRows } = await supabase
      .from('artworks')
      .select('storage_path')
      .eq('kid_id', kid.id);
    if (artworkRows && artworkRows.length) {
      await supabase.storage
        .from('artwork')
        .remove(artworkRows.map((a: any) => a.storage_path));
    }

    // Cascade delete via RLS will handle artworks/completions/stickers
    const { error } = await supabase.from('kids').delete().eq('id', kid.id);
    if (error) {
      alert(`Couldn't delete: ${error.message}`);
      return;
    }

    // If we deleted the active kid, pick another one
    if (activeKid?.id === kid.id) {
      const remaining = kids.filter((k) => k.id !== kid.id);
      setActiveKid(remaining[0] || null);
    }

    await loadData();
  }

  async function deleteAccount() {
    if (
      !confirm(
        'Permanently delete your account and ALL your children\'s artwork? This cannot be undone.'
      )
    )
      return;
    if (
      !confirm(
        'Are you absolutely sure? Type OK in the next prompt to confirm.'
      )
    )
      return;
    const final = prompt('Type DELETE to confirm:');
    if (final !== 'DELETE') {
      alert('Cancelled.');
      return;
    }
    const supabase = createClient();

    // Best effort: remove all artwork files
    for (const kid of kids) {
      const { data: artworkRows } = await supabase
        .from('artworks')
        .select('storage_path')
        .eq('kid_id', kid.id);
      if (artworkRows && artworkRows.length) {
        await supabase.storage
          .from('artwork')
          .remove(artworkRows.map((a: any) => a.storage_path));
      }
    }

    // Note: Supabase Auth deletion requires a server-side admin call, which
    // this public client can't make. The safe alternative for now is to
    // delete all data + sign out, which effectively makes the account
    // unreachable. Actual auth row deletion can be added via a Supabase Edge
    // Function later.
    await supabase.from('kids').delete().in(
      'id',
      kids.map((k) => k.id)
    );

    await supabase.auth.signOut();
    clear();
    alert(
      'Your data has been deleted. To fully remove your login, email support.'
    );
    router.push('/');
  }

  if (!unlocked) return <ParentGate onPass={() => setUnlocked(true)} />;

  if (loading) return <LoadingSpinner label="Loading your dashboard..." />;

  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between px-6 md:px-12 py-5">
        <Link href="/app">
          <Button variant="ghost" size="sm">
            ← Back to App
          </Button>
        </Link>
        <h1 className="font-display font-bold text-xl">Parent Dashboard</h1>
        <Button variant="ghost" size="sm" onClick={signOut}>
          Sign Out
        </Button>
      </header>

      <section className="px-6 md:px-12 py-8 max-w-4xl mx-auto">
        <div className="card-cozy p-6 mb-6">
          <h2 className="heading-2 mb-1">Hi, {parentEmail}</h2>
          <p className="text-ink-700">Manage your family's account here.</p>
        </div>

        <h2 className="heading-2 mb-4">Kids</h2>
        <div className="space-y-4 mb-10">
          {kids.map((kid) => (
            <div
              key={kid.id}
              className="card-cozy p-5 flex items-center gap-4 flex-wrap"
            >
              <Companion character={kid.avatar_key as any} size={70} />
              <div className="flex-1 min-w-[200px]">
                <h3 className="heading-3">{kid.name}</h3>
                <p className="text-ink-700 text-sm">Age {kid.age}</p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="font-bold text-meadow-500">
                    ✓ {completionCount[kid.id] || 0} lessons
                  </span>
                  <span className="font-bold text-berry-500">
                    🖼️ {artworkCount[kid.id] || 0} artworks
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteKid(kid)}
              >
                Delete
              </Button>
            </div>
          ))}
          <Link href="/onboarding">
            <Button variant="secondary" size="md" className="w-full">
              + Add another kid
            </Button>
          </Link>
        </div>

        <div className="card-cozy p-6 bg-cream-100/60 mb-6">
          <h3 className="heading-3 mb-2">About Payton's Art Club</h3>
          <ul className="text-ink-700 space-y-1 text-sm">
            <li>• No ads, no in-app purchases, no third-party tracking.</li>
            <li>• Artwork is stored privately; only you can see it.</li>
            <li>• You can delete individual kids or your whole account below.</li>
          </ul>
        </div>

        <div className="card-cozy p-6 border-2 border-coral-400">
          <h3 className="heading-3 mb-2 text-coral-600">Danger Zone</h3>
          <p className="text-ink-700 text-sm mb-4">
            Permanently delete your account and all your family's data.
          </p>
          <Button variant="ghost" size="sm" onClick={deleteAccount}>
            Delete my account
          </Button>
        </div>
      </section>
    </main>
  );
}
