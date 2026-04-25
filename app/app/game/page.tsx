'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button';
import Companion from '@/components/Companion';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useKidStore } from '@/lib/store';
import { useIsMobile } from '@/lib/useIsMobile';
import { createClient } from '@/lib/supabase/client';
import { generateRoomCode } from '@/lib/gameTypes';

export default function GameLandingPage() {
  const router = useRouter();
  const activeKid = useKidStore((s) => s.activeKid);
  const isMobile = useIsMobile();
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createRoom() {
    if (!activeKid) return;
    setCreating(true);
    setError(null);
    const supabase = createClient();

    // Retry up to 5 times for code collisions
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateRoomCode();
      const { error: insertErr } = await supabase.from('game_rooms').insert({
        code,
        host_kid_id: activeKid.id,
        phase: 'lobby',
      });
      if (!insertErr) {
        router.push(`/app/game/play/${code}`);
        return;
      }
      // If unique violation, retry. Otherwise bail.
      if (!insertErr.message?.toLowerCase().includes('duplicate')) {
        setError(insertErr.message || 'Could not create room');
        setCreating(false);
        return;
      }
    }
    setError('Too many rooms exist. Try again in a minute.');
    setCreating(false);
  }

  async function joinRoom() {
    if (!activeKid) return;
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 4) {
      setError('Room codes are 4 letters.');
      return;
    }
    setJoining(true);
    setError(null);
    const supabase = createClient();
    const { error: rpcErr } = await supabase.rpc('join_game_room', {
      target_room_code: code,
      requesting_kid_id: activeKid.id,
    });
    if (rpcErr) {
      const msg = (rpcErr.message || '').toLowerCase();
      if (msg.includes('room_not_found')) setError("We couldn't find that room.");
      else if (msg.includes('room_full')) setError('That room is already full.');
      else if (msg.includes('game_in_progress')) setError('That game already started.');
      else if (msg.includes('cannot_join_own_room')) setError("That's your own room!");
      else setError(rpcErr.message);
      setJoining(false);
      return;
    }
    router.push(`/app/game/play/${code}`);
  }

  return (
    <main className="min-h-screen">
      <header className="flex items-center gap-3 px-6 md:px-12 py-5">
        <Link href="/app"><Button variant="ghost" size="sm">← Home</Button></Link>
        <h1 className="font-display font-bold text-xl">Draw & Guess Game</h1>
      </header>

      <section className="px-6 md:px-12 py-4 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center gap-3 mb-4">
            <Companion character="bunny" mood="happy" size={80} />
            <Companion character="fox" mood="cheering" size={80} />
          </div>
          <h1 className="heading-1 mb-2">Play with a friend!</h1>
          <p className="text-ink-700">
            One of you draws, the other guesses. Take turns!
          </p>
        </div>

        <div className="card-cozy p-6 mb-4">
          <h2 className="heading-3 mb-2">🎨 Start a new game</h2>
          <p className="text-ink-700 text-sm mb-4">
            You'll get a 4-letter code. Tell your friend the code so they can join.
          </p>
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={createRoom}
            disabled={creating || !activeKid}
          >
            {creating ? 'Starting...' : 'Create room'}
          </Button>
        </div>

        <div className="card-cozy p-6 mb-4">
          <h2 className="heading-3 mb-2">🔑 Join a friend's game</h2>
          <p className="text-ink-700 text-sm mb-4">
            Got a 4-letter code from a friend? Type it here.
          </p>
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
              placeholder="WOLF"
              maxLength={4}
              className="flex-1 min-w-[150px] px-4 py-3 rounded-2xl border-4 border-cream-200 bg-cream-50 focus:border-coral-400 outline-none font-mono font-bold text-2xl text-center tracking-widest"
            />
            <Button
              variant="meadow"
              size="lg"
              onClick={joinRoom}
              disabled={joining || joinCode.length !== 4}
            >
              {joining ? 'Joining...' : 'Join'}
            </Button>
          </div>
        </div>

        {error && (
          <p className="text-coral-600 text-sm bg-coral-300/20 rounded-xl p-3 text-center">
            {error}
          </p>
        )}

        <div className="text-center mt-6">
          <Link href="/app/friends" className="text-sm text-ink-500 underline">
            Or see your friends →
          </Link>
        </div>
      </section>

      {isMobile && <div className="h-20" aria-hidden />}
      {isMobile && <MobileBottomNav />}
    </main>
  );
}
