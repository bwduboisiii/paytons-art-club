'use client';

import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

interface Props {
  /** Signed URL for the audio file */
  src: string;
  /** Duration in seconds (from DB) */
  durationSec?: number | null;
  /** Compact inline display or bigger button */
  variant?: 'compact' | 'full';
  className?: string;
}

export default function VoicePlayer({
  src,
  durationSec,
  variant = 'full',
  className,
}: Props) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [actualDuration, setActualDuration] = useState<number | null>(
    durationSec || null
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;
    audio.addEventListener('loadedmetadata', () => {
      if (!isNaN(audio.duration) && isFinite(audio.duration)) {
        setActualDuration(audio.duration);
      }
    });
    audio.addEventListener('timeupdate', () => {
      if (audio.duration) setProgress(audio.currentTime / audio.duration);
    });
    audio.addEventListener('ended', () => {
      setPlaying(false);
      setProgress(0);
    });
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [src]);

  function toggle() {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={toggle}
        className={clsx(
          'inline-flex items-center gap-2 bg-coral-500 hover:bg-coral-400 text-white rounded-full px-3 py-1 text-sm font-bold shadow-float',
          className
        )}
        aria-label={playing ? 'Pause voice note' : 'Play voice note'}
      >
        <span>{playing ? '⏸' : '▶'}</span>
        <span>{playing ? 'Playing...' : 'Hear it'}</span>
        {actualDuration != null && (
          <span className="text-xs opacity-80">
            {Math.round(actualDuration)}s
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-3 bg-cream-50 rounded-2xl shadow-float p-3',
        className
      )}
    >
      <button
        onClick={toggle}
        className="w-12 h-12 rounded-full bg-coral-500 hover:bg-coral-400 text-white shadow-chunky text-xl flex items-center justify-center"
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? '⏸' : '▶'}
      </button>
      <div className="flex-1 min-w-[120px]">
        <div className="h-2 bg-cream-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-coral-500 transition-all"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p className="text-xs text-ink-500 mt-1">
          {actualDuration != null ? `${Math.round(actualDuration)}s` : '...'}
        </p>
      </div>
    </div>
  );
}
