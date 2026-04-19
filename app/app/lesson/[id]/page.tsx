'use client';

import { use, useEffect, useRef, useState } from 'react';
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

type Phase = 'intro' | 'drawing' | 'remix' | 'reward';

export default function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const activeKid = useKidStore(s => s.activeKid);
  const lesson = getLesson(id);

  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const [phase, setPhase] = useState<Phase>('intro');
  const [stepIdx, setStepIdx] = useState(0);
  const [color, setColor] = useState(lesson?.palette[0] || '#2A1B3D');
  const [brushWidth, setBrushWidth] = useState(8);
  const [remixApplied, setRemixApplied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const startTime = useRef(Date.now());
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Responsive canvas sizing
  useEffect(() => {
    function resize() {
      const isMobile = window.innerWidth < 768;
      const maxWidth = Math.min(window.innerWidth - 48, 900);
      const maxHeight = Math.min(window.innerHeight - (isMobile ? 280 : 200), 700);
      // Keep 4:3 aspect
      const width = Math.min(maxWidth, (maxHeight * 4) / 3);
      const height = (width * 3) / 4;
      setCanvasSize({ width, height });
    }
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

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

  async function handleFinishDrawing() {
    // Move from last step to remix phase
    setPhase('remix');
  }

  async function handleSaveAndReward() {
    setSaving(true);
    setSaveError(null);
    try {
      const supabase = createClient();
      if (activeKid && canvasRef.current) {
        const dataURL = await canvasRef.current.exportPNG();

        // Upload PNG to storage
        const blob = await (await fetch(dataURL)).blob();
        const filename = `${activeKid.id}/${crypto.randomUUID()}.png`;
        const { error: uploadErr } = await supabase.storage
          .from('artwork')
          .upload(filename, blob, { contentType: 'image/png' });
        if (uploadErr) throw uploadErr;

        // Record artwork
        await supabase.from('artworks').insert({
          kid_id: activeKid.id,
          lesson_id: lesson!.id,
          title: lesson!.title,
          storage_path: filename,
        });

        // Record completion
        const duration = Math.floor((Date.now() - startTime.current) / 1000);
        await supabase.from('lesson_completions').insert({
          kid_id: activeKid.id,
          lesson_id: lesson!.id,
          duration_seconds: duration,
          stickers_earned: [lesson!.completion_sticker],
          remix_applied: remixApplied,
        });

        // Award sticker (upsert)
        await supabase.from('kid_stickers').upsert({
          kid_id: activeKid.id,
          sticker_key: lesson!.completion_sticker,
        }, { onConflict: 'kid_id,sticker_key' });
      }
    } catch (e: any) {
      setSaveError(e.message || 'Could not save, but your art is safe on screen!');
    } finally {
      setSaving(false);
      setPhase('reward');
    }
  }

  // Reference paths for the canvas:
  // Show all paths up to and including current step as the reference.
  const referencePaths = currentStep?.reference_paths || [];

  return (
    <main className="min-h-screen flex flex-col overflow-hidden">
      {/* ============== INTRO PHASE ============== */}
      <AnimatePresence mode="wait">
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
                  character={activeKid?.avatar_key as any || 'bunny'}
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
                  <Button variant="ghost" size="md">← Maybe later</Button>
                </Link>
                <Button variant="primary" size="xl" onClick={() => setPhase('drawing')}>
                  Let's Go! ✏️
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ============== DRAWING PHASE ============== */}
        {phase === 'drawing' && (
          <motion.div
            key="drawing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col"
          >
            {/* Top: companion + instruction */}
            <div className="px-4 md:px-8 pt-4 pb-2 flex items-start gap-4">
              <Companion
                character={activeKid?.avatar_key as any || 'bunny'}
                mood="happy"
                size={80}
              />
              <div className="flex-1 bg-cream-100 rounded-2xl p-3 md:p-4 relative shadow-float">
                {/* speech pointer */}
                <div className="absolute -left-2 top-4 w-4 h-4 bg-cream-100 rotate-45" />
                <p className="text-sm font-bold text-coral-500 mb-1">
                  Step {stepIdx + 1} of {lesson.steps.length}: {currentStep.instruction}
                </p>
                <p className="text-ink-700 text-sm md:text-base">"{currentStep.companion_line}"</p>
              </div>
              <Link href={`/app/world/${lesson.world_id}`}>
                <Button variant="ghost" size="sm">✕</Button>
              </Link>
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
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <ColorPalette colors={lesson.palette} selected={color} onChange={setColor} />
              </div>
              <div className="flex items-center gap-3">
                <BrushSizer value={brushWidth} onChange={setBrushWidth} />
                <Button variant="secondary" size="md" onClick={() => canvasRef.current?.undo()}>
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
                  <Button variant="meadow" size="lg" onClick={handleFinishDrawing}>
                    I'm done! ✨
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ============== REMIX PHASE ============== */}
        {phase === 'remix' && (
          <motion.div
            key="remix"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col"
          >
            <div className="px-4 md:px-8 pt-4 pb-2 flex items-center gap-4">
              <Companion
                character={activeKid?.avatar_key as any || 'bunny'}
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
              </div>
              <div className="flex justify-between items-center flex-wrap gap-3">
                <ColorPalette colors={lesson.palette} selected={color} onChange={setColor} />
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleSaveAndReward}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'All done! 🎉'}
                </Button>
              </div>
              {saveError && <p className="text-coral-600 text-sm mt-2">{saveError}</p>}
            </div>
          </motion.div>
        )}

        {/* ============== REWARD PHASE ============== */}
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
                  character={activeKid?.avatar_key as any || 'bunny'}
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
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/app/gallery">
                  <Button variant="secondary" size="lg">See My Art 🖼️</Button>
                </Link>
                <Link href={`/app/world/${lesson.world_id}`}>
                  <Button variant="primary" size="lg">More Drawing ✏️</Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
