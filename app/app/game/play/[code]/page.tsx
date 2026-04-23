'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button';
import Companion from '@/components/Companion';
import GameCanvas, { type GameCanvasHandle } from '@/components/GameCanvas';
import LoadingSpinner from '@/components/LoadingSpinner';
import Confetti from '@/components/Confetti';
import { useKidStore } from '@/lib/store';
import { useGameRoom } from '@/lib/useGameRoom';
import { createClient } from '@/lib/supabase/client';
import clsx from 'clsx';

const BASIC_COLORS = [
  '#2A1B3D', '#FF6B5B', '#FF9500', '#FFD166',
  '#5FB85F', '#6B98D6', '#B85CA0', '#8B4513',
];

const QUICK_EMOJIS = ['👍', '🎉', '😂', '🤔', '❤️', '⭐'];

export default function GamePlayPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const code = params.code.toUpperCase();
  const activeKid = useKidStore((s) => s.activeKid);
  const canvasRef = useRef<GameCanvasHandle>(null);
  const [color, setColor] = useState('#2A1B3D');
  const [brushWidth, setBrushWidth] = useState(6);
  const [isEraser, setIsEraser] = useState(false);
  const [guessInput, setGuessInput] = useState('');
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 450 });

  const isHost = true; // We don't know yet; hook figures it out from DB.
  const {
    state,
    startWordPick,
    pickWord,
    sendGuess,
    sendStroke,
    sendClear,
    sendChatEmoji,
    requestNextRound,
  } = useGameRoom({
    roomCode: code,
    myKidId: activeKid?.id || '',
    myName: activeKid?.name || '',
    myAvatar: activeKid?.avatar_key || 'bunny',
    isHost,
  });

  useEffect(() => {
    function resize() {
      const availW = Math.min(window.innerWidth - 32, 900);
      const availH = Math.min(window.innerHeight - 320, 600);
      const ratio = 4 / 3;
      let w = Math.min(availW, availH * ratio);
      let h = w / ratio;
      if (h > availH) {
        h = availH;
        w = h * ratio;
      }
      setCanvasSize({ width: Math.max(320, w), height: Math.max(240, h) });
    }
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  async function handleLeave() {
    if (!activeKid) return;
    if (!confirm('Leave the game?')) return;
    const supabase = createClient();
    await supabase.rpc('leave_game_room', {
      target_room_code: code,
      requesting_kid_id: activeKid.id,
    });
    router.push('/app/game');
  }

  if (!activeKid) {
    return <LoadingSpinner label="Loading..." />;
  }

  if (!state.room) {
    return <LoadingSpinner label="Joining game..." />;
  }

  const { room, myRole, iAmDrawer, wordOptions, currentWord, guesses, timeLeft } =
    state;

  const myScore = myRole === 'host' ? room.hostScore : room.guestScore;
  const theirScore = myRole === 'host' ? room.guestScore : room.hostScore;
  const opponentName = myRole === 'host' ? room.guestKidName : room.hostKidName;
  const opponentAvatar = (myRole === 'host' ? room.guestAvatarKey : room.hostAvatarKey) as any;

  return (
    <main className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="shrink-0 px-4 py-3 border-b-2 border-cream-200 bg-cream-100/60 flex items-center gap-3 flex-wrap">
        <button
          onClick={handleLeave}
          className="text-ink-700 hover:text-coral-500 text-sm font-bold"
        >
          ← Leave
        </button>

        {/* Score line */}
        <div className="flex-1 flex items-center justify-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Companion character={activeKid.avatar_key as any} size={40} />
            <div>
              <p className="font-display font-bold text-sm">{activeKid.name}</p>
              <p className="text-xs text-ink-500">{myScore} pts</p>
            </div>
          </div>

          <div className="font-mono text-xl font-bold text-ink-500">vs</div>

          {opponentName ? (
            <div className="flex items-center gap-2">
              <Companion character={opponentAvatar || 'bunny'} size={40} />
              <div>
                <p className="font-display font-bold text-sm">{opponentName}</p>
                <p className="text-xs text-ink-500">{theirScore} pts</p>
              </div>
            </div>
          ) : (
            <div className="text-sm text-ink-500">Waiting for friend...</div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs">
          {state.connectionStatus === 'connected' ? (
            <span className="text-meadow-500 font-bold">● Connected</span>
          ) : state.connectionStatus === 'error' ? (
            <span className="text-sparkle-500 font-bold">● Reconnecting...</span>
          ) : state.connectionStatus === 'disconnected' ? (
            <span className="text-coral-500 font-bold">● Disconnected</span>
          ) : (
            <span className="text-ink-500 font-bold">● Connecting...</span>
          )}
          <span className="font-mono font-bold text-ink-500">{code}</span>
        </div>
      </header>

      {/* Phase-specific content */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        {/* --- LOBBY --- */}
        {room.phase === 'lobby' && (
          <div className="card-cozy p-8 max-w-md w-full text-center">
            <div className="flex justify-center mb-4">
              <Companion character={activeKid.avatar_key as any} mood="idle" size={100} />
            </div>
            {!room.guestKidId ? (
              <>
                <h2 className="heading-2 mb-2">Waiting for a friend...</h2>
                <p className="text-ink-700 mb-4">
                  Share your room code with them!
                </p>
                <div className="bg-sparkle-300 rounded-2xl p-6 shadow-chunky mb-4">
                  <p className="text-sm text-ink-700 mb-1">Room code</p>
                  <p className="font-mono font-bold text-5xl tracking-widest text-ink-900">
                    {code}
                  </p>
                </div>
                <p className="text-xs text-ink-500">
                  Tell your friend to go to Games → Join a friend's game → type this code.
                </p>
              </>
            ) : (
              <>
                <h2 className="heading-2 mb-2">
                  {opponentName} joined! 🎉
                </h2>
                <p className="text-ink-700 mb-4">Ready to play?</p>
                {myRole === 'host' ? (
                  <Button variant="primary" size="lg" onClick={startWordPick}>
                    Start game! ✨
                  </Button>
                ) : (
                  <p className="text-ink-500 text-sm italic">
                    Waiting for {room.hostKidName} to start...
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* --- WORD PICK (drawer only) --- */}
        {room.phase === 'word_pick' && (
          <div className="card-cozy p-8 max-w-lg w-full">
            {iAmDrawer ? (
              <>
                <h2 className="heading-2 mb-2 text-center">Pick a word to draw!</h2>
                <p className="text-ink-700 text-sm text-center mb-6">
                  You'll have 60 seconds. Don't say or type the word!
                </p>
                <div className="grid gap-3">
                  {wordOptions.map((w) => (
                    <button
                      key={w.word}
                      onClick={() => pickWord(w.word)}
                      className="card-cozy p-4 hover:-translate-y-1 transition-transform flex items-center gap-3 text-left"
                    >
                      <span className="text-3xl">{w.emoji}</span>
                      <div>
                        <p className="font-display font-bold text-lg">{w.word}</p>
                        <p className="text-xs text-ink-500">{w.difficulty}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center">
                <Companion character={opponentAvatar || 'bunny'} mood="thinking" size={100} />
                <h2 className="heading-2 mt-4">
                  {opponentName} is picking a word...
                </h2>
                <p className="text-ink-700 mt-2">Get ready to guess!</p>
              </div>
            )}
          </div>
        )}

        {/* --- DRAWING / GUESSING --- */}
        {room.phase === 'drawing' && (
          <div className="w-full max-w-5xl">
            <div className="flex items-center justify-between mb-3 px-2 gap-3 flex-wrap">
              <div className="bg-cream-50 rounded-2xl px-4 py-2 shadow-float">
                {iAmDrawer ? (
                  <p className="font-display font-bold">
                    Draw: <span className="text-coral-500">{currentWord}</span>
                  </p>
                ) : (
                  <p className="font-display font-bold">
                    What is {opponentName} drawing?
                  </p>
                )}
              </div>
              <div
                className={clsx(
                  'font-mono font-bold text-2xl rounded-2xl px-4 py-2 shadow-float',
                  timeLeft <= 10 ? 'bg-coral-300 text-coral-600 animate-pulse' : 'bg-cream-50'
                )}
              >
                {timeLeft}s
              </div>
            </div>

            <div className="grid md:grid-cols-[1fr_auto] gap-4 items-start">
              <div className="flex flex-col items-center gap-3">
                <GameCanvas
                  ref={canvasRef}
                  width={canvasSize.width}
                  height={canvasSize.height}
                  color={color}
                  brushWidth={brushWidth}
                  isEraser={isEraser}
                  canDraw={iAmDrawer}
                  incomingEvents={state.canvasEvents}
                  onStrokeBatch={sendStroke}
                  onClear={sendClear}
                />
                {iAmDrawer && (
                  <div className="flex gap-2 flex-wrap justify-center">
                    {BASIC_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => { setColor(c); setIsEraser(false); }}
                        className={clsx(
                          'w-8 h-8 rounded-full border-[3px] transition-transform',
                          !isEraser && c === color
                            ? 'border-ink-900 scale-110'
                            : 'border-white',
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <button
                      onClick={() => setIsEraser((e) => !e)}
                      className={clsx(
                        'w-8 h-8 rounded-full border-[3px] text-xs font-bold transition-transform',
                        isEraser
                          ? 'bg-cream-200 border-ink-900 scale-110'
                          : 'bg-cream-50 border-white',
                      )}
                    >
                      🧽
                    </button>
                    <select
                      value={brushWidth}
                      onChange={(e) => setBrushWidth(parseInt(e.target.value, 10))}
                      className="px-2 rounded-xl border-2 border-cream-200 bg-cream-50 text-sm"
                    >
                      <option value="3">Thin</option>
                      <option value="6">Medium</option>
                      <option value="12">Thick</option>
                      <option value="20">Big</option>
                    </select>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => canvasRef.current?.clear()}
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>

              {/* Guess panel */}
              <div className="w-full md:w-64 bg-cream-50 rounded-2xl shadow-float p-3 flex flex-col gap-2 max-h-[60vh]">
                <p className="font-display font-bold text-sm">Guesses</p>
                <div className="flex-1 overflow-y-auto flex flex-col gap-1 min-h-[120px]">
                  {guesses.length === 0 ? (
                    <p className="text-xs text-ink-500 italic">No guesses yet...</p>
                  ) : (
                    guesses.map((g) => (
                      <div
                        key={g.id}
                        className={clsx(
                          'rounded-xl px-2 py-1 text-sm',
                          g.correct
                            ? 'bg-meadow-300 font-bold'
                            : g.kidId === activeKid.id
                            ? 'bg-sky-300/30'
                            : 'bg-cream-100'
                        )}
                      >
                        <span className="font-bold">
                          {g.kidId === activeKid.id ? 'You' : opponentName}:
                        </span>{' '}
                        {g.text}
                        {g.correct && ' ✓'}
                      </div>
                    ))
                  )}
                </div>
                {!iAmDrawer && (
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={guessInput}
                      onChange={(e) => setGuessInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && guessInput.trim()) {
                          sendGuess(guessInput.trim());
                          setGuessInput('');
                        }
                      }}
                      placeholder="Type guess..."
                      className="flex-1 px-3 py-2 rounded-xl border-2 border-cream-200 bg-white text-sm focus:border-coral-400 outline-none"
                    />
                    <button
                      onClick={() => {
                        if (guessInput.trim()) {
                          sendGuess(guessInput.trim());
                          setGuessInput('');
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-coral-500 text-white text-sm font-bold"
                    >
                      Go
                    </button>
                  </div>
                )}
                <div className="flex gap-1 flex-wrap">
                  {QUICK_EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => sendChatEmoji(e)}
                      className="w-8 h-8 rounded-full hover:bg-cream-100 text-lg"
                      aria-label={`Send ${e}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- GAME OVER (opponent left) --- */}
        {room.phase === 'game_over' && (
          <div className="card-cozy p-8 max-w-md w-full text-center">
            <div className="flex justify-center mb-4">
              <Companion character={activeKid.avatar_key as any} mood="thinking" size={100} />
            </div>
            <h2 className="heading-2 mb-2">
              {opponentName ? `${opponentName} left the game` : 'Game ended'}
            </h2>
            <p className="text-ink-700 mb-6">
              Final score: {myScore} – {theirScore}
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              <Button variant="secondary" size="lg" onClick={() => router.push('/app/game')}>
                New game
              </Button>
              <Button variant="primary" size="lg" onClick={() => router.push('/app')}>
                Home
              </Button>
            </div>
          </div>
        )}

        {/* --- ROUND END --- */}
        {room.phase === 'round_end' && (
          <div className="card-cozy p-8 max-w-md w-full text-center relative">
            <Confetti count={30} />
            <p className="text-sm uppercase tracking-wide text-ink-500 font-bold">
              Round {room.roundNum} finished
            </p>
            <h2 className="heading-1 mt-2 mb-2">
              The word was:{' '}
              <span className="text-coral-500">{currentWord}</span>
            </h2>
            <div className="flex justify-center gap-8 my-6">
              <div className="flex flex-col items-center">
                <Companion character={activeKid.avatar_key as any} size={60} />
                <p className="font-bold mt-1">{activeKid.name}</p>
                <p className="text-2xl font-display font-bold text-coral-500">
                  {myScore}
                </p>
              </div>
              <div className="flex flex-col items-center">
                <Companion character={opponentAvatar || 'bunny'} size={60} />
                <p className="font-bold mt-1">{opponentName}</p>
                <p className="text-2xl font-display font-bold text-coral-500">
                  {theirScore}
                </p>
              </div>
            </div>
            {myRole === 'host' ? (
              <Button variant="primary" size="lg" onClick={requestNextRound}>
                Next round →
              </Button>
            ) : (
              <p className="text-ink-500 text-sm italic">
                Waiting for {room.hostKidName} to start next round...
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
