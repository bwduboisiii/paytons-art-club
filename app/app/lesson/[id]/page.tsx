'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/Button';
import Companion from '@/components/Companion';
import ColorPalette from '@/components/ColorPalette';
import BrushSizer from '@/components/BrushSizer';
import Confetti from '@/components/Confetti';
import DrawingCanvas, { type DrawingCanvasHandle } from '@/components/DrawingCanvas';
import { getLesson } from '@/lib/lessons';
import { useKidStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { safeUUID, MAX_ARTWORK_BYTES } from '@/lib/utils';

type Phase = 'intro' | 'drawing' | 'remix' | 'reward';

export default function LessonPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const activeKid = useKidStore((s) => s.activeKid);
  const lesson = getLesson(id);

  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const [phase, setPhase] = useState<Phase>('intro');
  const [stepIdx, setStepIdx] = useState(0);
  const [color, setColor] = useState(lesson?.palette[0] || '#2A1B3D');
  const [brushWidth, setBrushWidth] = useState(8);
  const [remixApplied, setRemixApplied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const startTime = useRef(Date.now());
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // --------------------------------------------------------------
  // Responsive canvas sizing
  // --------------------------------------------------------------
  useEffect(() => {
    function resize() {
      const isMobile = window.innerWidth < 768;
      const maxWidth = Math.min(window.innerWidth - 48, 900);
      const maxHeight = Math.min(
        window.innerHeight - (isMobile ? 300 : 220),
        700
      );
      const width = Math.min(maxWidth, (maxHeight * 4) / 3);
      const height = (width * 3) / 4;
      setCanvasSize({ width, height });
    }
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // --------------------------------------------------------------
  // Warn before reload/close if there's unsaved work
  // --------------------------------------------------------------
  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (phase !== 'drawing' && phase !== 'remix') return;
      if (!canvasRef.current?.hasContent()) return;
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [phase]);

  const attemptExit = useCallback(() => {
    if (
      (phase === 'drawing' || phase === 'remix') &&
      canvasRef.current?.hasContent()
    ) {
      setShowExitConfirm(true);
    } else if (lesson) {
      router.push(`/app/world/${lesson.world_id}`);
    } else {
      router.push('/app');
    }
  }, [phase, lesson, router]);

  if (!lesson) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <Companion character="owl" mood="thinking" size={100} />
        <p className="mt-4 text-lg text-ink-700">Lesson not found.</p>
        <Link href="/app" className="mt-4">
          <Button variant="primary">Back to Home</Button>
        </Link>
      </main>
    );
  }

  const currentStep = lesson.steps[stepIdx];
  const isLastStep = stepIdx === lesson.steps.length - 1;

  function handleFinishDrawing() {
    setPhase('remix');
  }

  async function handleSaveAndReward() {
    setSaving(true);
    setSaveError(null);

    // Optimistic UX: move to reward phase even if save is slow.
    // If save errors, show it inline in the reward screen.
    try {
      if (!activeKid || !canvasRef.current) {
        throw new Error('No active kid or canvas');
      }
      const supabase = createClient();
      const blob = await canvasRef.current.exportPNG();

      if (blob.size > MAX_ARTWORK_BYTES) {
        throw new Error('Drawing too large to save. Try fewer strokes.');
      }

      const filename = `${activeKid.id}/${safeUUID()}.png`;
      const { error: uploadErr } = await supabase.storage
        .from('artwork')
        .upload(filename, blob, { contentType: 'image/png' });
      if (uploadErr) throw uploadErr;

      await supabase.from('artworks').insert({
        kid_id: activeKid.id,
        lesson_id: lesson.id,
        title: lesson.title,
        storage_path: filename,
      });

      const duration = Math.floor((Date.now() - startTime.current) / 1000);
      await supabase.from('lesson_completions').insert({
        kid_id: activeKid.id,
        lesson_id: lesson.id,
        duration_seconds: duration,
        stickers_earned: [lesson.completion_sticker],
        remix_applied: remixApplied,
      });

      await supabase.from('kid_stickers').upsert(
        {
          kid_id: activeKid.id,
          sticker_key: lesson.completion_sticker,
        },
        { onConflict: 'kid_id,sticker_key' }
      );
    } catch (e: any) {
      setSaveError(
        e?.message || 'Could not save, but your drawing is safe on this screen!'
      );
    } finally {
      setSaving(false);
      setPhase('reward');
    }
  }

  const referencePaths = currentStep?.reference_paths || [];

  return (
    <main className="min-h-screen flex flex-col overflow-hidden">
      {/* Exit confirm dialog */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink-900/50 backdrop-blur-sm flex items-center justify-center px-6"
            onClick={() => setShowExitConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="card-cozy p-8 max-w-sm w-full text-center"
            >
              <div className="text-5xl mb-3">🎨</div>
              <h2 className="heading-2 mb-2">Leave this lesson?</h2>
              <p className="text-ink-700 mb-6">
                Your drawing won't be saved if you leave now.
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setShowExitConfirm(false)}
                >
                  Keep Drawing ✏️
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => router.push(`/app/world/${lesson.world_id}`)}
                >
                  Leave anyway
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* INTRO */}
        {phase === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex-1 flex items-center justify-center px-6"
          >
            <div className="card-cozy p-8 md:p-12 max-w-xl text-center">
              <div className="flex justify-center mb-6">
                <Companion
                  character={(activeKid?.avatar_key as any) || 'bunny'}
                  mood="cheering"
                  size={140}
                />
              </div>
              <h1 className="heading-1 mb-3">Today we'll draw</h1>
              <h2 className="heading-1 text-coral-500 mb-6">{lesson.title}!</h2>
              <p className="text-lg text-ink-700 mb-8">
                {lesson.steps.length} easy steps. Ready?
              </p>
              <div className="flex gap-3 justify-center">
                <Link href={`/app/world/${lesson.world_id}`}>
                  <Button variant="ghost" size="md">
                    ← Maybe later
                  </Button>
                </Link>
                <Button
                  variant="primary"
                  size="xl"
                  onClick={() => setPhase('drawing')}
                >
                  Let's Go! ✏️
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* DRAWING */}
        {phase === 'drawing' && (
          <motion.div
            key="drawing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col"
          >
            <div className="px-4 md:px-8 pt-4 pb-2 flex items-start gap-4">
              <Companion
                character={(activeKid?.avatar_key as any) || 'bunny'}
                mood="happy"
                size={80}
              />
              <div className="flex-1 bg-cream-100 rounded-2xl p-3 md:p-4 relative shadow-float">
                <div className="absolute -left-2 top-4 w-4 h-4 bg-cream-100 rotate-45" />
                <p className="text-sm font-bold text-coral-500 mb-1">
                  Step {stepIdx + 1} of {lesson.steps.length}:{' '}
                  {currentStep.instruction}
                </p>
                <p className="text-ink-700 text-sm md:text-base">
                  "{currentStep.companion_line}"
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={attemptExit}
                aria-label="Close lesson"
              >
                ✕
              </Button>
            </div>

            {/* Progress dots */}
            <div className="flex gap-2 justify-center py-2">
              {lesson.steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all ${
                    i < stepIdx
                      ? 'w-6 bg-meadow-400'
                      : i === stepIdx
                      ? 'w-8 bg-coral-500'
                      : 'w-2 bg-cream-200'
                  }`}
                />
              ))}
            </div>

            {/* Canvas */}
            <div className="flex-1 flex items-center justify-center px-4">
              <DrawingCanvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                color={color}
                brushWidth={brushWidth}
                referencePaths={referencePaths}
                traceMode={lesson.guidance_level.startsWith('trace')}
              />
            </div>

            {/* Bottom toolbar */}
            <div className="px-4 md:px-8 py-4 flex flex-col md:flex-row gap-3 md:gap-6 items-center justify-between bg-cream-100/60 backdrop-blur-sm">
              <ColorPalette
                colors={lesson.palette}
                selected={color}
                onChange={setColor}
              />
              <div className="flex items-center gap-3">
                <BrushSizer value={brushWidth} onChange={setBrushWidth} />
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => canvasRef.current?.undo()}
                >
                  ↶ Undo
                </Button>
              </div>
              <div className="flex gap-2">
                {!isLastStep ? (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => setStepIdx((i) => i + 1)}
                  >
                    Next Step →
                  </Button>
                ) : (
                  <Button
                    variant="meadow"
                    size="lg"
                    onClick={handleFinishDrawing}
                  >
                    I'm done! ✨
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* REMIX */}
        {phase === 'remix' && (
          <motion.div
            key="remix"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col"
          >
            <div className="px-4 md:px-8 pt-4 pb-2 flex items-center gap-4">
              <Companion
                character={(activeKid?.avatar_key as any) || 'bunny'}
                mood="cheering"
                size={80}
              />
              <div className="flex-1 bg-sparkle-300/40 rounded-2xl p-4 shadow-float border-2 border-sparkle-400">
                <p className="font-display font-bold text-ink-900 text-lg">
                  Beautiful! Want to add something silly? ✨
                </p>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center px-4">
              <DrawingCanvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                color={color}
                brushWidth={brushWidth}
                referencePaths={[]}
              />
            </div>

            <div className="px-4 md:px-8 py-4 bg-cream-100/60 backdrop-blur-sm">
              <div className="flex flex-wrap gap-3 justify-center mb-4">
                {lesson.remix_options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      canvasRef.current?.placeSticker(opt.emoji);
                      setRemixApplied(true);
                    }}
                    className="card-cozy card-cozy-hover px-4 py-3 flex items-center gap-2"
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <span className="font-display font-bold">{opt.label}</span>
                  </button>
                ))}
                <button
                  onClick={() => canvasRef.current?.undo()}
                  className="card-cozy card-cozy-hover px-4 py-3 flex items-center gap-2"
                >
                  <span className="text-2xl">↶</span>
                  <span className="font-display font-bold">Undo</span>
                </button>
              </div>
              <div className="flex justify-between items-center flex-wrap gap-3">
                <ColorPalette
                  colors={lesson.palette}
                  selected={color}
                  onChange={setColor}
                />
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleSaveAndReward}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'All done! 🎉'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* REWARD */}
        {phase === 'reward' && (
          <motion.div
            key="reward"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex items-center justify-center px-6 relative"
          >
            <Confetti count={60} />
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 12, delay: 0.2 }}
              className="card-cozy p-8 md:p-12 max-w-xl text-center relative z-10"
            >
              <div className="flex justify-center mb-4">
                <Companion
                  character={(activeKid?.avatar_key as any) || 'bunny'}
                  mood="cheering"
                  size={140}
                />
              </div>
              <h1 className="heading-1 mb-3">🎉 You did it!</h1>
              <p className="text-xl text-ink-700 mb-2">
                You drew a wonderful <strong>{lesson.title}</strong>!
              </p>
              <div className="my-6 inline-block">
                <div className="bg-sparkle-300 rounded-full p-6 shadow-chunky animate-pop-in">
                  <div className="text-6xl">⭐</div>
                </div>
                <p className="font-display font-bold mt-2 text-ink-900">
                  New sticker unlocked!
                </p>
              </div>
              {saveError && (
                <p className="text-coral-600 text-sm mb-4">
                  (Heads up: {saveError})
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/app/gallery">
                  <Button variant="secondary" size="lg">
                    See My Art 🖼️
                  </Button>
                </Link>
                <Link href={`/app/world/${lesson.world_id}`}>
                  <Button variant="primary" size="lg">
                    More Drawing ✏️
                  </Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
