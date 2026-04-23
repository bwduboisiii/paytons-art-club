'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  type GameEvent,
  type GameRoom,
  type GamePhase,
  type Guess,
  ROUND_DURATION_SECONDS,
  POINTS_FOR_CORRECT_GUESS,
  POINTS_FOR_DRAWER_ON_CORRECT_GUESS,
} from './gameTypes';
import { type GameWord, pickRandomWords, matchesGuess } from './gameWords';
import { safeUUID } from './utils';

interface UseGameRoomOpts {
  roomCode: string | null;
  myKidId: string;
  myName: string;
  myAvatar: string;
  isHost: boolean;
}

export interface GameRoomState {
  room: GameRoom | null;
  myRole: 'host' | 'guest' | null;
  iAmDrawer: boolean;
  wordOptions: GameWord[];
  currentWord: string | undefined;
  guesses: Guess[];
  timeLeft: number;
  connected: boolean;
  canvasEvents: GameEvent[];
  // Gap 11: expose timeout for word_pick phase so UI can display it
  wordPickTimeLeft: number;
  // Gap 17: expose reconnection state
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

// Gap 11: Max time drawer has to pick a word before round auto-cancels
const WORD_PICK_TIMEOUT_SECONDS = 120;

/**
 * ==================================================================
 * NOTE: This hook is designed for 2-player games only. (Gap 6)
 * Expanding to 3+ players would require a guess queue and drawer
 * judgment serialization. Don't use this as a 3+ player hook.
 * ==================================================================
 */
export function useGameRoom({
  roomCode,
  myKidId,
  myName,
  myAvatar,
  isHost,
}: UseGameRoomOpts) {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [wordOptions, setWordOptions] = useState<GameWord[]>([]);
  const [currentWord, setCurrentWord] = useState<string | undefined>(undefined);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION_SECONDS);
  const [wordPickTimeLeft, setWordPickTimeLeft] = useState(WORD_PICK_TIMEOUT_SECONDS);
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected' | 'error'
  >('connecting');
  const [canvasEvents, setCanvasEvents] = useState<GameEvent[]>([]);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const wordPickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentWordRef = useRef<string | undefined>(undefined);
  const reconnectAttemptsRef = useRef(0);

  useEffect(() => { currentWordRef.current = currentWord; }, [currentWord]);

  const myRole: 'host' | 'guest' | null = !room
    ? null
    : room.hostKidId === myKidId
    ? 'host'
    : room.guestKidId === myKidId
    ? 'guest'
    : null;

  const iAmDrawer = room?.drawerKidId === myKidId;

  // ---------- Broadcast helper ----------
  const broadcast = useCallback((event: GameEvent) => {
    const ch = channelRef.current;
    if (!ch) return;
    ch.send({ type: 'broadcast', event: 'game', payload: event });
  }, []);

  // ---------- Lifecycle: subscribe + reconnection ----------
  useEffect(() => {
    if (!roomCode) return;
    let cancelled = false;
    const supabase = createClient();

    (async () => {
      const { data: roomRow } = await supabase
        .from('game_rooms')
        .select('code, host_kid_id, guest_kid_id, phase, round_num, host_score, guest_score')
        .eq('code', roomCode)
        .maybeSingle();
      if (cancelled) return;
      if (!roomRow) {
        console.warn('[game] Room not found:', roomCode);
        return;
      }
      const kidIds = [roomRow.host_kid_id, roomRow.guest_kid_id].filter(Boolean);
      const { data: kids } = await supabase
        .from('kids_lookup')
        .select('id, name, avatar_key')
        .in('id', kidIds);
      const hostKid = kids?.find((k: any) => k.id === roomRow.host_kid_id);
      const guestKid = kids?.find((k: any) => k.id === roomRow.guest_kid_id);
      setRoom({
        code: roomRow.code,
        hostKidId: roomRow.host_kid_id,
        hostKidName: hostKid?.name || 'Host',
        hostAvatarKey: hostKid?.avatar_key || 'bunny',
        guestKidId: roomRow.guest_kid_id || undefined,
        guestKidName: guestKid?.name,
        guestAvatarKey: guestKid?.avatar_key,
        phase: (roomRow.phase as GamePhase) || 'lobby',
        roundNum: roomRow.round_num || 0,
        hostScore: roomRow.host_score || 0,
        guestScore: roomRow.guest_score || 0,
      });
    })();

    // Subscribe to realtime channel
    const ch = supabase.channel(`game:${roomCode}`, {
      config: { broadcast: { self: false, ack: false } },
    });

    ch.on('broadcast', { event: 'game' }, ({ payload }) => {
      handleIncomingEvent(payload as GameEvent);
    });

    ch.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_rooms',
        filter: `code=eq.${roomCode}`,
      },
      (payload: any) => {
        setRoom((prev) => {
          if (!prev) return prev;
          const row = payload.new;
          return {
            ...prev,
            guestKidId: row.guest_kid_id || prev.guestKidId,
            phase: row.phase as GamePhase,
            roundNum: row.round_num,
            hostScore: row.host_score,
            guestScore: row.guest_score,
          };
        });
      }
    );

    // Gap 17: handle subscription status changes including reconnection
    ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        broadcast({ type: 'player_joined', kidId: myKidId, name: myName, avatar: myAvatar });
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setConnectionStatus('error');
        // Try to reconnect with exponential backoff, max 5 attempts
        reconnectAttemptsRef.current++;
        if (reconnectAttemptsRef.current <= 5) {
          const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 15000);
          setTimeout(() => {
            if (!cancelled && channelRef.current === ch) {
              ch.subscribe((s) => {
                if (s === 'SUBSCRIBED') setConnectionStatus('connected');
              });
            }
          }, delay);
        } else {
          setConnectionStatus('disconnected');
        }
      } else if (status === 'CLOSED') {
        setConnectionStatus('disconnected');
      }
    });

    channelRef.current = ch;

    // Gap 9: heartbeat every 30s so other client can detect if we vanish
    const heartbeatInterval = setInterval(async () => {
      try {
        await supabase
          .from('game_rooms')
          .update({ last_heartbeat: new Date().toISOString() })
          .eq('code', roomCode);
      } catch {}
    }, 30000);

    // Gap 9: best-effort leave via sendBeacon on tab close
    function handleBeforeUnload() {
      // Fire-and-forget broadcast that we're leaving. Other player sees it.
      try {
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'game',
            payload: { type: 'player_left', kidId: myKidId },
          });
        }
      } catch {}
    }
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      cancelled = true;
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(heartbeatInterval);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (wordPickTimerRef.current) clearInterval(wordPickTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode]);

  // Refresh guest info when guestKidId changes
  useEffect(() => {
    if (!room?.guestKidId || room.guestKidName) return;
    const supabase = createClient();
    supabase
      .from('kids_lookup')
      .select('id, name, avatar_key')
      .eq('id', room.guestKidId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setRoom((prev) =>
            prev ? { ...prev, guestKidName: data.name, guestAvatarKey: data.avatar_key } : prev
          );
        }
      });
  }, [room?.guestKidId, room?.guestKidName]);

  // ---------- Incoming event handler (all gaps below) ----------
  function handleIncomingEvent(ev: GameEvent) {
    // Gap 10: defensive — ignore events we sent ourselves, just in case
    // self:false doesn't always work across all event types.
    if ('kidId' in ev && (ev as any).kidId === myKidId) return;
    if ('guesserKidId' in ev && (ev as any).guesserKidId === myKidId) {
      // Exception: a 'guess' with correct:true coming back from drawer
      // needs to update OUR local optimistic guess. Don't ignore it.
      if (ev.type === 'guess' && ev.correct) {
        // Gap 1: mark our existing optimistic guess as correct instead of duplicating
        setGuesses((prev) => {
          // Find the most recent uncorrect guess with matching text
          const match = [...prev].reverse().find(
            (g) => g.kidId === myKidId && !g.correct && g.text === ev.text
          );
          if (match) {
            return prev.map((g) => (g.id === match.id ? { ...g, correct: true } : g));
          }
          // No optimistic match — add it (shouldn't happen in normal flow)
          return [
            ...prev,
            { id: safeUUID(), kidId: myKidId, text: ev.text, correct: true, at: Date.now() },
          ];
        });
        return;
      }
      // Otherwise genuinely self-echoed, skip
      return;
    }

    switch (ev.type) {
      case 'player_joined':
        // DB trigger updates room state; nothing to do here
        break;
      case 'stroke_point':
      case 'canvas_clear':
        setCanvasEvents((prev) => [...prev, ev]);
        break;
      case 'word_options':
        setRoom((prev) => (prev ? { ...prev, drawerKidId: ev.drawerKidId } : prev));
        break;
      case 'round_start':
        setRoom((prev) =>
          prev
            ? { ...prev, roundNum: ev.roundNum, drawerKidId: ev.drawerKidId, phase: 'drawing' }
            : prev
        );
        setGuesses([]);
        setCanvasEvents([]);
        setTimeLeft(ROUND_DURATION_SECONDS);
        stopWordPickTimer();
        startRoundTimer(ev.startedAt);
        break;
      case 'guess':
        // Gap 1: Not from me. Just append.
        setGuesses((prev) => [
          ...prev,
          {
            id: safeUUID(),
            kidId: ev.guesserKidId,
            text: ev.text,
            correct: ev.correct,
            at: Date.now(),
          },
        ]);
        break;
      case 'round_end':
        stopRoundTimer();
        stopWordPickTimer();
        setCurrentWord(ev.word);
        setRoom((prev) =>
          prev
            ? {
                ...prev,
                phase: 'round_end',
                hostScore: ev.hostScore,
                guestScore: ev.guestScore,
              }
            : prev
        );
        break;
      case 'chat_emoji':
        setGuesses((prev) => [
          ...prev,
          { id: safeUUID(), kidId: ev.kidId, text: ev.emoji, correct: false, at: Date.now() },
        ]);
        break;
      case 'next_round_request':
        // Host listens for this; handled below via effect
        break;
      case 'player_left':
        // If opponent leaves, we should be shown a "they left" state
        setRoom((prev) => (prev ? { ...prev, phase: 'game_over' } : prev));
        break;
      default:
        break;
    }
  }

  function startRoundTimer(startedAtMs: number) {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startedAtMs) / 1000;
      const remaining = Math.max(0, ROUND_DURATION_SECONDS - Math.floor(elapsed));
      setTimeLeft(remaining);
      if (remaining === 0) stopRoundTimer();
    }, 250);
  }

  function stopRoundTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  // Gap 11: word-pick timeout timer
  function startWordPickTimer(startedAtMs: number) {
    if (wordPickTimerRef.current) clearInterval(wordPickTimerRef.current);
    wordPickTimerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startedAtMs) / 1000;
      const remaining = Math.max(0, WORD_PICK_TIMEOUT_SECONDS - Math.floor(elapsed));
      setWordPickTimeLeft(remaining);
      if (remaining === 0) stopWordPickTimer();
    }, 500);
  }

  function stopWordPickTimer() {
    if (wordPickTimerRef.current) {
      clearInterval(wordPickTimerRef.current);
      wordPickTimerRef.current = null;
    }
    setWordPickTimeLeft(WORD_PICK_TIMEOUT_SECONDS);
  }

  // ---------- Actions ----------

  /** Host starts a new round by picking words for the current drawer */
  const startWordPick = useCallback(() => {
    if (!room) return;
    if (myRole !== 'host') return;
    const words = pickRandomWords(3, 'easy');
    setWordOptions(words);
    const nextRound = room.roundNum + 1;
    const drawerKidId = nextRound % 2 === 1 ? room.hostKidId : room.guestKidId!;
    setRoom((prev) =>
      prev ? { ...prev, phase: 'word_pick', drawerKidId, roundNum: nextRound } : prev
    );
    broadcast({ type: 'word_options', drawerKidId, words });
    const supabase = createClient();
    supabase
      .from('game_rooms')
      .update({ phase: 'word_pick', round_num: nextRound, drawer_kid_id: drawerKidId })
      .eq('code', room.code);
    // Gap 11: start the word-pick timeout
    startWordPickTimer(Date.now());
  }, [room, myRole, broadcast]);

  // Gap 11: auto-cancel round if drawer doesn't pick in time
  useEffect(() => {
    if (wordPickTimeLeft > 0) return;
    if (!room || room.phase !== 'word_pick') return;
    if (myRole !== 'host') return;
    // Force round_end with no word, no score change
    broadcast({
      type: 'round_end',
      word: '(cancelled)',
      hostScore: room.hostScore,
      guestScore: room.guestScore,
    });
    setRoom((prev) => (prev ? { ...prev, phase: 'round_end' } : prev));
    const supabase = createClient();
    supabase.from('game_rooms').update({ phase: 'round_end' }).eq('code', room.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordPickTimeLeft]);

  const pickWord = useCallback(
    (word: string) => {
      if (!room || !iAmDrawer) return;
      stopWordPickTimer();
      setCurrentWord(word);
      setWordOptions([]);
      setCanvasEvents([]);
      const startedAt = Date.now();
      setRoom((prev) => (prev ? { ...prev, phase: 'drawing' } : prev));
      setTimeLeft(ROUND_DURATION_SECONDS);
      startRoundTimer(startedAt);
      broadcast({
        type: 'round_start',
        roundNum: room.roundNum,
        drawerKidId: myKidId,
        startedAt,
      });
      const supabase = createClient();
      supabase
        .from('game_rooms')
        .update({ phase: 'drawing', current_word: word })
        .eq('code', room.code);
    },
    [room, iAmDrawer, myKidId, broadcast]
  );

  // Drawer judges incoming guesses
  useEffect(() => {
    if (!iAmDrawer || !currentWord || !room) return;
    const lastGuess = guesses[guesses.length - 1];
    if (!lastGuess || lastGuess.correct) return;
    if (lastGuess.kidId === myKidId) return;
    if (matchesGuess(lastGuess.text, currentWord)) {
      const newHostScore =
        room.hostScore +
        (lastGuess.kidId === room.hostKidId
          ? POINTS_FOR_CORRECT_GUESS
          : POINTS_FOR_DRAWER_ON_CORRECT_GUESS);
      const newGuestScore =
        room.guestScore +
        (lastGuess.kidId === room.guestKidId
          ? POINTS_FOR_CORRECT_GUESS
          : POINTS_FOR_DRAWER_ON_CORRECT_GUESS);
      broadcast({
        type: 'guess',
        guesserKidId: lastGuess.kidId,
        text: lastGuess.text,
        correct: true,
      });
      broadcast({
        type: 'round_end',
        word: currentWord,
        winnerKidId: lastGuess.kidId,
        hostScore: newHostScore,
        guestScore: newGuestScore,
      });
      setGuesses((prev) => {
        const next = [...prev];
        next[next.length - 1] = { ...lastGuess, correct: true };
        return next;
      });
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              hostScore: newHostScore,
              guestScore: newGuestScore,
              phase: 'round_end',
            }
          : prev
      );
      stopRoundTimer();
      const supabase = createClient();
      supabase
        .from('game_rooms')
        .update({
          phase: 'round_end',
          host_score: newHostScore,
          guest_score: newGuestScore,
        })
        .eq('code', room.code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guesses, iAmDrawer, currentWord, room?.hostScore, room?.guestScore]);

  // Timeout: end round when clock hits 0
  useEffect(() => {
    if (timeLeft > 0) return;
    if (!room || room.phase !== 'drawing') return;
    if (!iAmDrawer || !currentWord) return;
    broadcast({
      type: 'round_end',
      word: currentWord,
      hostScore: room.hostScore,
      guestScore: room.guestScore,
    });
    setRoom((prev) => (prev ? { ...prev, phase: 'round_end' } : prev));
    const supabase = createClient();
    supabase.from('game_rooms').update({ phase: 'round_end' }).eq('code', room.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const sendStroke = useCallback(
    (payload: {
      pts: Array<{ x: number; y: number }>;
      color: string;
      width: number;
      strokeId: string;
      isLast?: boolean;
    }) => {
      broadcast({ type: 'stroke_point', ...payload });
    },
    [broadcast]
  );

  const sendClear = useCallback(() => {
    broadcast({ type: 'canvas_clear' });
  }, [broadcast]);

  const sendGuess = useCallback(
    (text: string) => {
      if (!room || iAmDrawer) return;
      broadcast({ type: 'guess', guesserKidId: myKidId, text, correct: false });
      setGuesses((prev) => [
        ...prev,
        { id: safeUUID(), kidId: myKidId, text, correct: false, at: Date.now() },
      ]);
    },
    [room, iAmDrawer, myKidId, broadcast]
  );

  const sendChatEmoji = useCallback(
    (emoji: string) => {
      if (!room) return;
      broadcast({ type: 'chat_emoji', kidId: myKidId, emoji });
      setGuesses((prev) => [
        ...prev,
        { id: safeUUID(), kidId: myKidId, text: emoji, correct: false, at: Date.now() },
      ]);
    },
    [room, myKidId, broadcast]
  );

  const requestNextRound = useCallback(() => {
    if (!room) return;
    broadcast({ type: 'next_round_request', kidId: myKidId });
    if (myRole === 'host') {
      startWordPick();
    }
  }, [room, myKidId, myRole, broadcast, startWordPick]);

  const state: GameRoomState = {
    room,
    myRole,
    iAmDrawer,
    wordOptions,
    currentWord: iAmDrawer || room?.phase === 'round_end' ? currentWord : undefined,
    guesses,
    timeLeft,
    connected: connectionStatus === 'connected',
    canvasEvents,
    wordPickTimeLeft,
    connectionStatus,
  };

  return {
    state,
    startWordPick,
    pickWord,
    sendGuess,
    sendStroke,
    sendClear,
    sendChatEmoji,
    requestNextRound,
  };
}
