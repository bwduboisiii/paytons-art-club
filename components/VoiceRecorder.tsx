'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import Button from './Button';

interface Props {
  /**
   * Called when the kid finishes recording + taps "Keep it".
   * Returns the raw audio blob and duration in seconds.
   */
  onSave: (blob: Blob, durationSec: number) => Promise<void>;
  /** Called when kid skips recording */
  onSkip?: () => void;
  /** Loading text during save */
  savingLabel?: string;
  /** Prompt text shown above the recorder */
  prompt?: string;
  /** Max seconds (default 60) */
  maxSeconds?: number;
}

type Phase = 'idle' | 'recording' | 'recorded' | 'saving' | 'denied' | 'error';

/**
 * Cute-friendly voice recorder for kids.
 *
 * Flow:
 *   idle -> kid taps big mic button -> permission prompt -> recording
 *   recording -> countdown clock -> kid taps stop OR max hit -> recorded
 *   recorded -> kid can play preview, re-record, or keep it
 *
 * Uses MediaRecorder API. Works in Chrome/Safari/Firefox on modern iPad.
 * Not supported on older iOS (<14.3) — we degrade gracefully with an error.
 */
export default function VoiceRecorder({
  onSave,
  onSkip,
  savingLabel = 'Saving...',
  prompt = 'Want to tell me about your drawing?',
  maxSeconds = 60,
}: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startedAtRef = useRef<number>(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAll();
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopAll() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  async function startRecording() {
    setErrorMsg(null);
    // Browser compat check
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setPhase('error');
      setErrorMsg("Voice recording isn't supported on this device.");
      return;
    }
    if (typeof MediaRecorder === 'undefined') {
      setPhase('error');
      setErrorMsg("Voice recording isn't supported on this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      // Pick a mime type the browser supports. webm on Chrome, mp4 on Safari.
      let mimeType = '';
      const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
      for (const c of candidates) {
        if (MediaRecorder.isTypeSupported(c)) {
          mimeType = c;
          break;
        }
      }
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType || 'audio/webm',
        });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedUrl(url);
        setDuration(Math.floor((Date.now() - startedAtRef.current) / 1000));
        setPhase('recorded');
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
      };
      mr.start();
      startedAtRef.current = Date.now();
      setElapsed(0);
      setPhase('recording');
      timerRef.current = setInterval(() => {
        const secs = Math.floor((Date.now() - startedAtRef.current) / 1000);
        setElapsed(secs);
        if (secs >= maxSeconds) stopRecording();
      }, 250);
    } catch (err: any) {
      setPhase('denied');
      setErrorMsg(
        err?.name === 'NotAllowedError'
          ? "We need microphone access to record. Look for a pop-up in your browser."
          : err?.message || 'Could not access microphone.'
      );
      stopAll();
    }
  }

  function stopRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }

  function resetRecording() {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setDuration(0);
    setElapsed(0);
    setPhase('idle');
  }

  async function handleKeep() {
    if (!recordedBlob) return;
    setPhase('saving');
    try {
      await onSave(recordedBlob, duration);
    } catch (e: any) {
      setErrorMsg(e?.message || 'Could not save.');
      setPhase('recorded');
    }
  }

  // --- Render ---

  const secondsLeft = Math.max(0, maxSeconds - elapsed);

  return (
    <div className="card-cozy p-6 text-center max-w-md mx-auto">
      <p className="font-display font-bold text-lg mb-4 text-ink-900">{prompt}</p>

      <AnimatePresence mode="wait">
        {phase === 'idle' && (
          <motion.div key="idle" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}>
            <button
              onClick={startRecording}
              className="w-24 h-24 rounded-full bg-coral-500 hover:bg-coral-400 shadow-chunky text-white text-4xl mx-auto flex items-center justify-center active:translate-y-1 transition-transform"
              aria-label="Start recording"
            >
              🎤
            </button>
            <p className="text-sm text-ink-700 mt-3">Tap the mic to start!</p>
            {onSkip && (
              <button
                onClick={onSkip}
                className="mt-4 text-ink-500 text-sm underline hover:text-ink-900"
              >
                Skip this
              </button>
            )}
          </motion.div>
        )}

        {phase === 'recording' && (
          <motion.div key="recording" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}>
            <button
              onClick={stopRecording}
              className="w-24 h-24 rounded-full bg-coral-500 shadow-chunky text-white text-4xl mx-auto flex items-center justify-center animate-pulse"
              aria-label="Stop recording"
            >
              ⏹
            </button>
            <p className="text-3xl font-display font-bold text-coral-500 mt-3">
              {elapsed}s
            </p>
            <p className="text-sm text-ink-700 mt-1">
              {secondsLeft} seconds left — tap to stop
            </p>
            <div className="mt-3 h-2 bg-cream-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-coral-500 transition-all"
                style={{ width: `${(elapsed / maxSeconds) * 100}%` }}
              />
            </div>
          </motion.div>
        )}

        {phase === 'recorded' && recordedUrl && (
          <motion.div key="recorded" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="mb-4">
              <div className="inline-block w-20 h-20 rounded-full bg-meadow-400 shadow-chunky flex items-center justify-center text-4xl mb-2">
                ✓
              </div>
              <p className="text-ink-900 font-display font-bold text-lg">
                Got it! {duration} seconds
              </p>
            </div>
            <audio
              controls
              src={recordedUrl}
              className="mx-auto mb-4 w-full max-w-xs"
            />
            {errorMsg && (
              <p className="text-coral-600 text-sm mb-3">{errorMsg}</p>
            )}
            <div className="flex gap-2 justify-center flex-wrap">
              <Button variant="ghost" size="md" onClick={resetRecording}>
                🔄 Try again
              </Button>
              <Button variant="primary" size="lg" onClick={handleKeep}>
                Keep it! ✨
              </Button>
            </div>
          </motion.div>
        )}

        {phase === 'saving' && (
          <motion.div key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="text-4xl mb-2 animate-spin inline-block">✨</div>
            <p className="text-ink-700">{savingLabel}</p>
          </motion.div>
        )}

        {(phase === 'denied' || phase === 'error') && (
          <motion.div key="denied" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="text-4xl mb-2">🎤</div>
            <p className="text-ink-700 mb-2 font-bold">
              {phase === 'denied' ? "Can't hear you!" : "Oops!"}
            </p>
            <p className="text-sm text-ink-500 mb-4">
              {errorMsg}
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              <Button variant="secondary" size="md" onClick={resetRecording}>
                Try again
              </Button>
              {onSkip && (
                <Button variant="ghost" size="md" onClick={onSkip}>
                  Skip
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
