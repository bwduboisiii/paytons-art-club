'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/Button';
import Companion from '@/components/Companion';
import ColorPaletteVertical from '@/components/ColorPaletteVertical';
import BrushSizer from '@/components/BrushSizer';
import ToolPickerVertical from '@/components/ToolPickerVertical';
import FloatingBuddy from '@/components/FloatingBuddy';
import StickerTray from '@/components/StickerTray';
import VoiceRecorder from '@/components/VoiceRecorder';
import Confetti from '@/components/Confetti';
import DrawingCanvas, { type DrawingCanvasHandle } from '@/components/DrawingCanvas';
import { getLesson } from '@/lib/lessons';
import { useKidStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { safeUUID, MAX_ARTWORK_BYTES } from '@/lib/utils';
import type { DrawingToolId } from '@/lib/drawingTools';

type Phase = 'intro' | 'drawing' | 'remix' | 'reward';

const SIDEBAR_W = 76;

export default function LessonPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const activeKid = useKidStore((s) => s.activeKid);
  const lesson = getLesson(id);

  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const [phase, setPhase] = useState<Phase>('intro');
  const [stepIdx, setStepIdx] = useState(0);
  const [color, setColor] = useState(lesson?.palette[0] || '#2A1B3D');
  const [tool, setTool] = useState<DrawingToolId>('marker');
  const [brushWidth, setBrushWidth] = useState(8);
  const [remixApplied, setRemixApplied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showStickerTray, setShowStickerTray] = useState(false);
  const [savedArtworkId, setSavedArtworkId] = useState<string | null>(null);
  const [voiceNoteSaved, setVoiceNoteSaved] = useState(false);
  const [voiceSkipped, setVoiceSkipped] = useState(false);
  const startTime = useRef(Date.now());
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [buddyMood, setBuddyMood] = useState<'happy' | 'cheering' | 'thinking' | 'idle'>('happy');

  useEffect(() => {
    function resize() {
      const availW = window.innerWidth - SIDEBAR_W * 2 - 40 - 32;
      const availH = window.innerHeight - 120 - 72 - 32;
      const ratio = 4 / 3;
      let w = Math.min(availW, availH * ratio, 1100);
      let h = w / ratio;
      if (h > availH) { h = availH; w = h * ratio; }
      setCanvasSize({ width: Math.max(400, w), height: Math.max(300, h) });
    }
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (phase !== 'drawing' && phase !== 'remix') return;
      if (!canvasRef.current?.hasContent()) return;
      e.preventDefault(); e.returnValue = '';
    }
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [phase]);

  const attemptExit = useCallback(() => {
    if ((phase === 'drawing' || phase === 'remix') && canvasRef.current?.hasContent()) {
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
        <Link href="/app" className="mt-4"><Button variant="primary">Back to Home</Button></Link>
      </main>
    );
  }

  const currentStep = lesson.steps[stepIdx];
  const isLastStep = stepIdx === lesson.steps.length - 1;

  function onStrokeComplete() {
    setBuddyMood('cheering');
    setTimeout(() => setBuddyMood('happy'), 500);
  }

  function handleFinishDrawing() { setPhase('remix'); }

  async function handleSaveAndReward() {
    setSaving(true); setSaveError(null);
    try {
      if (!activeKid || !canvasRef.current) throw new Error('Not ready');
      const supabase = createClient();
      const blob = await canvasRef.current.exportPNG();
      if (blob.size > MAX_ARTWORK_BYTES) throw new Error('Drawing too large.');
      const filename = `${activeKid.id}/${safeUUID()}.png`;
      const { error: uploadErr } = await supabase.storage.from('artwork').upload(filename, blob, { contentType: 'image/png' });
      if (uploadErr) throw uploadErr;
      const { data: artwork } = await supabase.from('artworks').insert({
        kid_id: activeKid.id, lesson_id: lesson.id,
        title: lesson.title, storage_path: filename,
      }).select().single();
      if (artwork) setSavedArtworkId((artwork as any).id);
      const duration = Math.floor((Date.now() - startTime.current) / 1000);
      await supabase.from('lesson_completions').insert({
        kid_id: activeKid.id, lesson_id: lesson.id,
        duration_seconds: duration,
        stickers_earned: [lesson.completion_sticker], remix_applied: remixApplied,
      });
      await supabase.from('kid_stickers').upsert(
        { kid_id: activeKid.id, sticker_key: lesson.completion_sticker },
        { onConflict: 'kid_id,sticker_key' }
      );
    } catch (e: any) { setSaveError(e?.message || 'Could not save.'); }
    finally { setSaving(false); setPhase('reward'); }
  }

  async function handleVoiceNoteSave(blob: Blob, durationSec: number) {
    if (!activeKid || !savedArtworkId) return;
    const supabase = createClient();
    const ext = blob.type.includes('mp4') ? 'm4a' : 'webm';
    const path = `${activeKid.id}/${safeUUID()}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from('voice-notes').upload(path, blob, { contentType: blob.type });
    if (uploadErr) throw uploadErr;
    await supabase.from('artworks').update({
      voice_note_path: path,
      voice_note_duration_seconds: durationSec,
    }).eq('id', savedArtworkId);
    setVoiceNoteSaved(true);
  }

  const referencePaths = currentStep?.reference_paths || [];
  const buddyMessage = phase === 'drawing' ? currentStep?.companion_line : undefined;

  return (
    <main className="h-screen flex flex-col overflow-hidden">
      {(phase === 'drawing' || phase === 'remix') && activeKid && (
        <FloatingBuddy
          character={activeKid.avatar_key as any}
          mood={buddyMood} message={buddyMessage}
          defaultCollapsed={!buddyMessage}
          offsetRight={SIDEBAR_W + 16}
        />
      )}

      {showStickerTray && (
        <StickerTray
          onClose={() => setShowStickerTray(false)}
          onPick={(value, src) => {
            canvasRef.current?.placeSticker(value, src);
            setRemixApplied(true); setShowStickerTray(false);
          }}
        />
      )}

      <AnimatePresence>
        {showExitConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink-900/50 backdrop-blur-sm flex items-center justify-center px-6"
            onClick={() => setShowExitConfirm(false)}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()} className="card-cozy p-8 max-w-sm w-full text-center">
              <div className="text-5xl mb-3">🎨</div>
              <h2 className="heading-2 mb-2">Leave this lesson?</h2>
              <p className="text-ink-700 mb-6">Your drawing won't be saved if you leave now.</p>
              <div className="flex flex-col gap-2">
                <Button variant="primary" size="md" onClick={() => setShowExitConfirm(false)}>Keep Drawing ✏️</Button>
                <Button variant="ghost" size="md" onClick={() => router.push(`/app/world/${lesson.world_id}`)}>Leave anyway</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
            className="flex-1 flex items-center justify-center px-6">
            <div className="card-cozy p-8 md:p-12 max-w-xl text-center">
              <div className="flex justify-center mb-6">
                <Companion character={(activeKid?.avatar_key as any) || 'bunny'} mood="cheering" size={140} />
              </div>
              <h1 className="heading-1 mb-3">Today we'll draw</h1>
              <h2 className="heading-1 text-coral-500 mb-6">{lesson.title}!</h2>
              <p className="text-lg text-ink-700 mb-8">{lesson.steps.length} easy steps. Ready?</p>
              <div className="flex gap-3 justify-center">
                <Link href={`/app/world/${lesson.world_id}`}>
                  <Button variant="ghost" size="md">← Maybe later</Button>
                </Link>
                <Button variant="primary" size="xl" onClick={() => setPhase('drawing')}>Let's Go! ✏️</Button>
              </div>
            </div>
          </motion.div>
        )}

        {(phase === 'drawing' || phase === 'remix') && (
          <motion.div key="canvas-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col overflow-hidden">
            {/* Header/step info */}
            <div className="shrink-0 px-4 py-2 flex items-center gap-3 border-b-2 border-cream-200 bg-cream-100/60">
              {phase === 'drawing' ? (
                <div className="flex-1 bg-cream-50 rounded-2xl p-2 shadow-float">
                  <p className="text-sm font-bold text-coral-500">
                    Step {stepIdx + 1} of {lesson.steps.length}: {currentStep.instruction}
                  </p>
                </div>
              ) : (
                <div className="flex-1 bg-sparkle-300/40 rounded-2xl p-2 shadow-float border-2 border-sparkle-400 text-center">
                  <p className="font-display font-bold text-ink-900">
                    Beautiful! Add something silly? ✨
                  </p>
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={attemptExit} aria-label="Close">✕</Button>
            </div>

            {/* Progress dots */}
            {phase === 'drawing' && (
              <div className="shrink-0 flex gap-2 justify-center py-1 bg-cream-100/60">
                {lesson.steps.map((_, i) => (
                  <div key={i} className={`h-2 rounded-full transition-all ${
                    i < stepIdx ? 'w-6 bg-meadow-400' :
                    i === stepIdx ? 'w-8 bg-coral-500' : 'w-2 bg-cream-200'
                  }`} />
                ))}
              </div>
            )}

            {/* Main area: left tools | canvas | right colors */}
            <div className="flex-1 flex overflow-hidden min-h-0">
              <aside className="shrink-0 bg-cream-100/60 border-r-2 border-cream-200 flex flex-col py-2" style={{ width: SIDEBAR_W }}>
                <ToolPickerVertical value={tool} onChange={setTool} className="flex-1" />
              </aside>

              <div className="flex-1 flex items-center justify-center overflow-hidden px-4">
                <DrawingCanvas
                  ref={canvasRef}
                  width={canvasSize.width} height={canvasSize.height}
                  color={color} brushWidth={brushWidth} tool={tool}
                  referencePaths={phase === 'drawing' ? referencePaths : []}
                  traceMode={phase === 'drawing' && lesson.guidance_level.startsWith('trace')}
                  onStroke={onStrokeComplete}
                />
              </div>

              <aside className="shrink-0 bg-cream-100/60 border-l-2 border-cream-200 flex flex-col py-2 px-1" style={{ width: SIDEBAR_W }}>
                <ColorPaletteVertical selected={color} onChange={setColor} className="flex-1" />
              </aside>
            </div>

            {/* Bottom utility row */}
            <div className="shrink-0 px-4 py-2 bg-cream-100/60 border-t-2 border-cream-200 flex items-center gap-2 flex-wrap justify-center">
              <BrushSizer value={brushWidth} onChange={setBrushWidth} />
              <Button variant="secondary" size="md" onClick={() => canvasRef.current?.undo()}>↶</Button>
              {phase === 'remix' && (
                <Button variant="sparkle" size="md" onClick={() => setShowStickerTray(true)}>+ Stickers</Button>
              )}
              {phase === 'drawing' ? (
                !isLastStep ? (
                  <Button variant="primary" size="lg" onClick={() => setStepIdx((i) => i + 1)}>Next →</Button>
                ) : (
                  <Button variant="meadow" size="lg" onClick={handleFinishDrawing}>Done! ✨</Button>
                )
              ) : (
                <Button variant="primary" size="lg" onClick={handleSaveAndReward} disabled={saving}>
                  {saving ? 'Saving...' : 'All done! 🎉'}
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {phase === 'reward' && (
          <motion.div key="reward" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex-1 flex items-center justify-center px-6 relative overflow-y-auto">
            <Confetti count={60} />
            <motion.div initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 12, delay: 0.2 }}
              className="card-cozy p-6 md:p-10 max-w-xl text-center relative z-10 w-full my-6">
              <div className="flex justify-center mb-3">
                <Companion character={(activeKid?.avatar_key as any) || 'bunny'} mood="cheering" size={120} />
              </div>
              <h1 className="heading-1 mb-2">🎉 You did it!</h1>
              <p className="text-lg text-ink-700 mb-2">
                You drew a wonderful <strong>{lesson.title}</strong>!
              </p>
              <div className="my-4 inline-block">
                <div className="bg-sparkle-300 rounded-full p-4 shadow-chunky animate-pop-in">
                  <div className="text-5xl">⭐</div>
                </div>
                <p className="font-display font-bold mt-1 text-ink-900">New sticker unlocked!</p>
              </div>
              {saveError && <p className="text-coral-600 text-sm mb-3">(Heads up: {saveError})</p>}

              {/* Voice recording step */}
              {savedArtworkId && !voiceNoteSaved && !voiceSkipped && (
                <div className="my-4">
                  <VoiceRecorder
                    prompt="Want to tell me about your drawing?"
                    onSave={handleVoiceNoteSave}
                    onSkip={() => setVoiceSkipped(true)}
                    maxSeconds={60}
                  />
                </div>
              )}
              {voiceNoteSaved && (
                <p className="font-display font-bold text-meadow-500 my-3">
                  ✓ Your voice note is saved! 🎤
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                <Link href="/app/gallery"><Button variant="secondary" size="lg">See My Art 🖼️</Button></Link>
                <Link href={`/app/world/${lesson.world_id}`}><Button variant="primary" size="lg">More Drawing ✏️</Button></Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
