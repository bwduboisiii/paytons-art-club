'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Companion from '@/components/Companion';
import LoadingSpinner from '@/components/LoadingSpinner';
import { createClient } from '@/lib/supabase/client';
import { useKidStore } from '@/lib/store';
import { removeFriend, markFriendshipsSeen } from '@/lib/friends';
import { useEntitlement } from '@/lib/useEntitlement';
import type { Kid, FriendInfo } from '@/lib/types';
import clsx from 'clsx';

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

function SubscriptionSection() {
  const { entitlement, loading, refresh } = useEntitlement();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If Stripe isn't configured on this environment, hide the whole card —
  // there's nothing to subscribe to.
  if (!entitlement.stripeConfigured) {
    return null;
  }

  if (loading) {
    return (
      <div className="card-cozy p-6 mb-6">
        <p className="text-ink-500">Loading subscription info...</p>
      </div>
    );
  }

  async function startCheckout() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.url) {
        throw new Error(json.error || 'Checkout failed');
      }
      window.location.href = json.url;
    } catch (e: any) {
      setError(e?.message || 'Could not start checkout');
      setBusy(false);
    }
  }

  async function openPortal() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.url) {
        throw new Error(json.error || 'Could not open billing portal');
      }
      window.location.href = json.url;
    } catch (e: any) {
      setError(e?.message || 'Could not open billing portal');
      setBusy(false);
    }
  }

  // Not subscribed — show upsell
  if (!entitlement.hasPremium) {
    return (
      <div className="card-cozy p-6 mb-6 bg-gradient-to-br from-sparkle-300/30 to-coral-300/30">
        <h3 className="heading-3 mb-2">⭐ Unlock all bonus worlds</h3>
        <p className="text-ink-700 mb-4">
          Get access to Dino Land, Fairy Garden, Food Friends, and Vehicle
          Village. Start with a <strong>7-day free trial</strong>, then
          $4.99/month. Cancel anytime.
        </p>
        <Button variant="primary" size="lg" onClick={startCheckout} disabled={busy}>
          {busy ? 'Starting...' : 'Start free trial →'}
        </Button>
        {error && (
          <p className="text-coral-600 text-sm mt-3 bg-coral-300/20 rounded-xl p-2">
            {error}
          </p>
        )}
      </div>
    );
  }

  // Subscribed — show status + manage
  const statusLabel =
    entitlement.subscriptionStatus === 'trialing'
      ? 'Free trial'
      : entitlement.subscriptionStatus === 'active'
      ? 'Active'
      : entitlement.subscriptionStatus === 'past_due'
      ? 'Payment issue'
      : entitlement.subscriptionStatus === 'canceled'
      ? 'Cancelled'
      : entitlement.subscriptionStatus || 'Active';

  const endDate = entitlement.hasActiveTrial
    ? entitlement.trialEnd
    : entitlement.currentPeriodEnd;

  return (
    <div className="card-cozy p-6 mb-6 bg-meadow-300/30">
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex-1 min-w-[220px]">
          <h3 className="heading-3 mb-1">⭐ Premium active</h3>
          <p className="text-ink-700 text-sm">
            Status: <strong>{statusLabel}</strong>
            {endDate && (
              <>
                {' · '}
                {entitlement.hasActiveTrial ? 'Trial ends' : 'Renews'}{' '}
                {new Date(endDate).toLocaleDateString()}
              </>
            )}
          </p>
        </div>
        <Button variant="secondary" size="md" onClick={openPortal} disabled={busy}>
          Manage subscription
        </Button>
      </div>
      {error && (
        <p className="text-coral-600 text-sm mt-3 bg-coral-300/20 rounded-xl p-2">
          {error}
        </p>
      )}
    </div>
  );
}

export default function ParentPage() {
  const router = useRouter();
  // Read checkout query param from URL directly (avoids useSearchParams which
  // would require Suspense wrapping in Next.js 14 static generation).
  const [checkoutStatus, setCheckoutStatus] = useState<string | null>(null);
  const [checkoutBanner, setCheckoutBanner] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get('checkout');
    if (status) {
      setCheckoutStatus(status);
      setCheckoutBanner(
        status === 'success'
          ? '🎉 Subscription started! It may take a moment to activate.'
          : status === 'cancelled'
          ? 'Checkout was cancelled. No charges were made.'
          : null
      );
    }
  }, []);

  // Clear banner from URL once shown, and auto-dismiss after 6s
  useEffect(() => {
    if (!checkoutStatus) return;
    const t = setTimeout(() => {
      setCheckoutBanner(null);
      // Remove the query param from URL without reloading
      window.history.replaceState({}, '', '/parent');
    }, 6000);
    return () => clearTimeout(t);
  }, [checkoutStatus]);
  const { activeKid, setActiveKid, clear } = useKidStore();
  const [unlocked, setUnlocked] = useState(false);
  const [kids, setKids] = useState<Kid[]>([]);
  const [completionCount, setCompletionCount] = useState<
    Record<string, number>
  >({});
  const [artworkCount, setArtworkCount] = useState<Record<string, number>>({});
  const [voiceNoteCount, setVoiceNoteCount] = useState<Record<string, number>>({});
  // Map of kid_id -> friend list with per-friend "new" flag
  const [kidFriends, setKidFriends] = useState<
    Record<string, Array<FriendInfo & { isNew: boolean; friendshipId: string }>>
  >({});
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
    const voiceNoteCounts: Record<string, number> = {};
    const friendsMap: Record<
      string,
      Array<FriendInfo & { isNew: boolean; friendshipId: string }>
    > = {};
    await Promise.all(
      kidList.map(async (kid) => {
        const [{ count: cc }, { count: ac }, { count: vc }, friendshipsRes] = await Promise.all([
          supabase
            .from('lesson_completions')
            .select('*', { count: 'exact', head: true })
            .eq('kid_id', kid.id),
          supabase
            .from('artworks')
            .select('*', { count: 'exact', head: true })
            .eq('kid_id', kid.id),
          supabase
            .from('artworks')
            .select('*', { count: 'exact', head: true })
            .eq('kid_id', kid.id)
            .not('voice_note_path', 'is', null),
          supabase
            .from('friendships')
            .select('id, friend_kid_id, created_at, parent_seen_at')
            .eq('kid_id', kid.id)
            .order('created_at', { ascending: false }),
        ]);
        completions[kid.id] = cc || 0;
        artworks[kid.id] = ac || 0;
        voiceNoteCounts[kid.id] = vc || 0;

        const fRows = (friendshipsRes.data || []) as Array<any>;
        if (fRows.length) {
          const friendIds = fRows.map((r) => r.friend_kid_id);
          const { data: friendKids } = await supabase
            .from('kids_lookup')
            .select('id, name, avatar_key, friend_code')
            .in('id', friendIds);
          const friendKidMap = new Map(
            (friendKids || []).map((k: any) => [k.id, k])
          );
          friendsMap[kid.id] = fRows
            .map((r) => {
              const fk = friendKidMap.get(r.friend_kid_id);
              if (!fk) return null;
              return {
                id: fk.id,
                name: fk.name,
                avatar_key: fk.avatar_key,
                friend_code: fk.friend_code,
                friended_at: r.created_at,
                isNew: !r.parent_seen_at,
                friendshipId: r.id,
              } as FriendInfo & { isNew: boolean; friendshipId: string };
            })
            .filter((x): x is NonNullable<typeof x> => x !== null);
        } else {
          friendsMap[kid.id] = [];
        }
      })
    );
    setCompletionCount(completions);
    setArtworkCount(artworks);
    setVoiceNoteCount(voiceNoteCounts);
    setKidFriends(friendsMap);
    setLoading(false);
  }

  useEffect(() => {
    if (unlocked) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked]);

  async function parentRemoveFriend(kid: Kid, friend: FriendInfo) {
    if (!confirm(`Remove ${friend.name} as ${kid.name}'s friend?`)) return;
    await removeFriend(kid.id, friend.id);
    setKidFriends((prev) => ({
      ...prev,
      [kid.id]: (prev[kid.id] || []).filter((f) => f.id !== friend.id),
    }));
  }

  async function markAllSeen() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // Gap 14: pass the IDs of the friendships currently visible with isNew=true
    // so new ones arriving between load and click aren't stealthily marked seen.
    const visibleUnseenIds: string[] = [];
    for (const list of Object.values(kidFriends)) {
      for (const f of list) {
        if (f.isNew) visibleUnseenIds.push(f.friendshipId);
      }
    }
    if (!visibleUnseenIds.length) return;
    await markFriendshipsSeen(user.id, visibleUnseenIds);
    setKidFriends((prev) => {
      const next: typeof prev = {};
      for (const [kidId, list] of Object.entries(prev)) {
        next[kidId] = list.map((f) =>
          visibleUnseenIds.includes(f.friendshipId) ? { ...f, isNew: false } : f
        );
      }
      return next;
    });
  }

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
        {checkoutBanner && (
          <div
            className={clsx(
              'card-cozy p-4 mb-6 font-display font-bold text-center',
              checkoutStatus === 'success'
                ? 'bg-meadow-300/50 text-meadow-500'
                : 'bg-cream-200'
            )}
          >
            {checkoutBanner}
          </div>
        )}
        <div className="card-cozy p-6 mb-6">
          <h2 className="heading-2 mb-1">Hi, {parentEmail}</h2>
          <p className="text-ink-700">Manage your family's account here.</p>
        </div>

        <h2 className="heading-2 mb-4 flex items-center gap-3 flex-wrap">
          Kids
          {(() => {
            const unseenTotal = Object.values(kidFriends).reduce(
              (sum, list) => sum + list.filter((f) => f.isNew).length,
              0
            );
            return unseenTotal > 0 ? (
              <>
                <span className="bg-coral-500 text-white text-xs font-bold rounded-full px-3 py-1">
                  {unseenTotal} NEW {unseenTotal === 1 ? 'friend' : 'friends'}
                </span>
                <button
                  onClick={markAllSeen}
                  className="text-sm text-ink-500 underline hover:text-ink-900"
                >
                  mark all seen
                </button>
              </>
            ) : null;
          })()}
        </h2>
        <div className="space-y-4 mb-10">
          {kids.map((kid) => {
            const friends = kidFriends[kid.id] || [];
            const newFriendCount = friends.filter((f) => f.isNew).length;
            return (
              <div key={kid.id} className="card-cozy p-5">
                {/* Header row: kid info + delete */}
                <div className="flex items-center gap-4 flex-wrap">
                  <Companion character={kid.avatar_key as any} size={70} />
                  <div className="flex-1 min-w-[200px]">
                    <h3 className="heading-3">{kid.name}</h3>
                    <p className="text-ink-700 text-sm">Age {kid.age}</p>
                    <div className="flex gap-4 mt-2 text-sm flex-wrap">
                      <span className="font-bold text-meadow-500">
                        ✓ {completionCount[kid.id] || 0} lessons
                      </span>
                      <span className="font-bold text-berry-500">
                        🖼️ {artworkCount[kid.id] || 0} artworks
                      </span>
                      {(voiceNoteCount[kid.id] || 0) > 0 && (
                        <span className="font-bold text-coral-500">
                          🎤 {voiceNoteCount[kid.id]} voice
                        </span>
                      )}
                      {kid.friend_code && (
                        <span className="font-mono font-bold text-ink-500">
                          Code: {kid.friend_code}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteKid(kid)}>
                    Delete
                  </Button>
                </div>

                {/* Friends subsection */}
                <div className="mt-4 pt-4 border-t-2 border-cream-100">
                  <h4 className="font-display font-bold text-sm mb-2 flex items-center gap-2">
                    👯 Friends ({friends.length})
                    {newFriendCount > 0 && (
                      <span className="bg-coral-500 text-white text-xs rounded-full px-2 py-0.5">
                        {newFriendCount} NEW
                      </span>
                    )}
                  </h4>
                  {friends.length === 0 ? (
                    <p className="text-ink-500 text-sm">
                      No friends yet.
                    </p>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-2">
                      {friends.map((f) => (
                        <div
                          key={f.id}
                          className={`flex items-center gap-2 rounded-xl p-2 ${
                            f.isNew
                              ? 'bg-coral-300/20 border-2 border-coral-400'
                              : 'bg-cream-100'
                          }`}
                        >
                          <Companion character={f.avatar_key} size={40} />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate flex items-center gap-1">
                              {f.name}
                              {f.isNew && (
                                <span className="text-[10px] bg-coral-500 text-white rounded-full px-1.5 py-0.5">
                                  NEW
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-ink-500">
                              {f.friend_code} · added{' '}
                              {f.friended_at
                                ? new Date(f.friended_at).toLocaleDateString()
                                : ''}
                            </p>
                          </div>
                          <button
                            onClick={() => parentRemoveFriend(kid, f)}
                            aria-label={`Remove ${f.name}`}
                            className="w-7 h-7 rounded-full hover:bg-coral-300/40 text-ink-500 text-sm shrink-0"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <Link href="/onboarding">
            <Button variant="secondary" size="md" className="w-full">
              + Add another kid
            </Button>
          </Link>
        </div>

        <SubscriptionSection />

        <div className="card-cozy p-6 bg-cream-100/60 mb-6">
          <h3 className="heading-3 mb-2">About Payton's Art Club</h3>
          <ul className="text-ink-700 space-y-1 text-sm">
            <li>• No ads, no third-party tracking.</li>
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
