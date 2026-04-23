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
  // True if I'm the host (I created this room)
  isHost: boolean;
}

export interface GameRoomState {
  room: GameRoom | null;
  myRole: 'host' | 'guest' | null;
  // Am I the drawer this round?
  iAmDrawer: boolean;
  // For the drawer only: their 3 word options
  wordOptions: GameWord[];
  // The picked word. For drawer: the real word. For guesser: undefined until round_end.
  currentWord: string | undefined;
  guesses: Guess[];
  timeLeft: number;
  connected: boolean;
  // Raw events received (for canvas component to consume)
  canvasEvents: GameEvent[];
}

const STROKE_BATCH_MS = 50; // Flush stroke points at 20Hz

/**
 * Hook that manages the entire realtime game. One hook per page.
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
  const [connected, setConnected] = useState(false);
  const [canvasEvents, setCanvasEvents] = useState<GameEvent[]>([]);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentWordRef = useRef<string | undefined>(undefined);

  // Keep ref synced for timer callback
  useEffect(() => {
    currentWordRef.current = currentWord;
  }, [currentWord]);

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

  // ---------- Lifecycle: subscribe ----------
  useEffect(() => {
    if (!roomCode) return;
    let cancelled = false;
    const supabase = createClient();

    (async () => {
      // Load room state from DB
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

      // Look up kid names/avatars
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

    // Also listen to DB changes to the room row (join events, phase changes)
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
          const next = { ...prev };
          const row = payload.new;
          if (row.guest_kid_id && row.guest_kid_id !== prev.guestKidId) {
            next.guestKidId = row.guest_kid_id;
            // We'll refresh guest info in an effect below
          }
          next.phase = row.phase as GamePhase;
          next.roundNum = row.round_num;
          next.hostScore = row.host_score;
          next.guestScore = row.guest_score;
          return next;
        });
      }
    );

    ch.subscribe((status) => {
      setConnected(status === 'SUBSCRIBED');
      if (status === 'SUBSCRIBED') {
        // Announce myself
        broadcast({
          type: 'player_joined',
          kidId: myKidId,
          name: myName,
          avatar: myAvatar,
        });
      }
    });

    channelRef.current = ch;

    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (timerRef.current) clearInterval(timerRef.current);
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

  // ---------- Incoming event handler ----------
  function handleIncomingEvent(ev: GameEvent) {
    switch (ev.type) {
      case 'player_joined':
        // Host learns who joined; guest learns host is present
        // (DB trigger will have updated room state too)
        break;
      case 'stroke_point':
      case 'canvas_clear':
        // Canvas consumes these via canvasEvents
        setCanvasEvents((prev) => [...prev, ev]);
        break;
      case 'word_options':
        // Non-drawer players don't need these; drawer sets their own locally
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
        startRoundTimer(ev.startedAt);
        break;
      case 'guess':
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
      if (remaining === 0) {
        stopRoundTimer();
        // Drawer is responsible for calling endRound if host; but if nobody guessed
        // correctly the drawer should call it too. For simplicity, both clients
        // auto-end when timer hits 0.
      }
    }, 250);
  }

  function stopRoundTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  // ---------- Public actions ----------

  /** Host starts a new round by picking words for the current drawer */
  const startWordPick = useCallback(() => {
    if (!room) return;
    if (myRole !== 'host') return; // Only host orchestrates
    const words = pickRandomWords(3, 'easy');
    setWordOptions(words);
    // Drawer alternates: odd rounds = host draws, even = guest draws
    const nextRound = room.roundNum + 1;
    const drawerKidId = nextRound % 2 === 1 ? room.hostKidId : room.guestKidId!;
    setRoom((prev) =>
      prev ? { ...prev, phase: 'word_pick', drawerKidId, roundNum: nextRound } : prev
    );
    broadcast({ type: 'word_options', drawerKidId, words });
    // Persist phase to DB (so room row stays fresh)
    const supabase = createClient();
    supabase
      .from('game_rooms')
      .update({ phase: 'word_pick', round_num: nextRound, drawer_kid_id: drawerKidId })
      .eq('code', room.code);
  }, [room, myRole, broadcast]);

  /** Drawer confirms word choice → round starts */
  const pickWord = useCallback(
    (word: string) => {
      if (!room || !iAmDrawer) return;
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
      // Persist
      const supabase = createClient();
      supabase
        .from('game_rooms')
        .update({ phase: 'drawing', current_word: word })
        .eq('code', room.code);
    },
    [room, iAmDrawer, myKidId, broadcast]
  );

  /** Guesser submits a guess */
  const submitGuess = useCallback(
    (text: string) => {
      if (!room || iAmDrawer) return;
      if (!currentWordRef.current && room.phase === 'drawing') {
        // Guesser doesn't know the word — compare against broadcast-known word via matchesGuess
        // But we don't HAVE the word client-side for guesser. Solution: drawer broadcasts
        // whether each guess is correct, not the guesser judging locally.
        // For simplicity in v1, we send the guess and the DRAWER client judges and broadcasts the result.
        broadcast({ type: 'guess', guesserKidId: myKidId, text, correct: false });
        return;
      }
    },
    [room, iAmDrawer, myKidId, broadcast]
  );

  /**
   * Drawer's client listens to incoming 'guess' events in a special way:
   * it judges correctness and re-broadcasts with correct=true if so.
   * Implemented via useEffect on incoming guesses + the word.
   */
  useEffect(() => {
    if (!iAmDrawer) return;
    if (!currentWord) return;
    if (!room) return;
    // Inspect new incoming guesses; find ones from guesser not yet marked correct.
    const lastGuess = guesses[guesses.length - 1];
    if (!lastGuess || lastGuess.correct) return;
    if (lastGuess.kidId === myKidId) return;
    if (matchesGuess(lastGuess.text, currentWord)) {
      // Mark correct, update scores, end round
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
      // Tell everyone the guess was correct
      broadcast({
        type: 'guess',
        guesserKidId: lastGuess.kidId,
        text: lastGuess.text,
        correct: true,
      });
      // End the round
      broadcast({
        type: 'round_end',
        word: currentWord,
        winnerKidId: lastGuess.kidId,
        hostScore: newHostScore,
        guestScore: newGuestScore,
      });
      // Locally reflect
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
      // Persist
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

  // When timer hits 0 and drawer still has word, end round as timeout
  useEffect(() => {
    if (timeLeft > 0) return;
    if (!room || room.phase !== 'drawing') return;
    if (!iAmDrawer) return; // only drawer ends
    if (!currentWord) return;
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

  /** Stroke broadcaster - batched by the consumer */
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
    // Host initiates the new round when they receive this
    if (myRole === 'host') {
      startWordPick();
    }
  }, [room, myKidId, myRole, broadcast, startWordPick]);

  // Listen for next_round_request events
  useEffect(() => {
    if (myRole !== 'host') return;
    // Already handled inside handleIncomingEvent implicitly via broadcast reception
    // We need an explicit listener
  }, [myRole]);

  const state: GameRoomState = {
    room,
    myRole,
    iAmDrawer,
    wordOptions,
    currentWord: iAmDrawer || room?.phase === 'round_end' ? currentWord : undefined,
    guesses,
    timeLeft,
    connected,
    canvasEvents,
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
