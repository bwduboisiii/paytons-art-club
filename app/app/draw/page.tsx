'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button';
import DrawingCanvas, { type DrawingCanvasHandle } from '@/components/DrawingCanvas';
import ColorPaletteVertical from '@/components/ColorPaletteVertical';
import ToolPickerVertical from '@/components/ToolPickerVertical';
import BrushSizer from '@/components/BrushSizer';
import MobileDrawingToolbar from '@/components/MobileDrawingToolbar';
import FloatingBuddy from '@/components/FloatingBuddy';
import StickerTray from '@/components/StickerTray';
import VoiceRecorder from '@/components/VoiceRecorder';
import { useKidStore } from '@/lib/store';
import { useIsMobile } from '@/lib/useIsMobile';
import { createClient } from '@/lib/supabase/client';
import { safeUUID, MAX_ARTWORK_BYTES } from '@/lib/utils';
import type { DrawingToolId } from '@/lib/drawingTools';

const SIDEBAR_W = 76;

export default function FreeDrawPage() {
  const router = useRouter();
  const activeKid = useKidStore((s) => s.activeKid);
  const isMobile = useIsMobile();
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const [color, setColor] = useState('#2A1B3D');
  const [tool, setTool] = useState<DrawingToolId>('marker');
  const [brushWidth, setBrushWidth] = useState(8);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [showStickerTray, setShowStickerTray] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [voiceRecorderOpen, setVoiceRecorderOpen] = useState(false);
  const [voiceSaved, setVoiceSaved] = useState(false);
  const [title, setTitle] = useState('My Masterpiece');
  const [buddyMood, setBuddyMood] = useState<'happy' | 'cheering' | 'thinking' | 'idle'>('happy');

  useEffect(() => {
    function resize() {
      const mobile = window.innerWidth < 768;
      let availW: number;
      let availH: number;
      if (mobile) {
        // Mobile: full-width canvas, top bar ~60px + bottom toolbar ~90px + small padding
        availW = window.innerWidth - 16;
        availH = window.innerHeight - 60 - 90 - 16;
      } else {
        // Desktop: two sidebars + collapsed buddy tab (~32px) + padding
        availW = window.innerWidth - SIDEBAR_W * 2 - 40 - 32;
        availH = window.innerHeight - 80 - 72 - 32;
      }
      const ratio = 4 / 3;
      let w = Math.min(availW, availH * ratio, 1100);
      let h = w / ratio;
      if (h > availH) { h = availH; w = h * ratio; }
      setCanvasSize({
        width: Math.max(mobile ? 280 : 400, w),
        height: Math.max(mobile ? 210 : 300, h),
      });
    }
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (canvasRef.current?.hasContent() && !savedId) {
        e.preventDefault(); e.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [savedId]);

  function onStrokeComplete() {
    setBuddyMood('cheering');
    setTimeout(() => setBuddyMood('happy'), 500);
  }

  async function handleSave() {
    setSaving(true); setSaveError(null);
    try {
      if (!activeKid || !canvasRef.current) throw new Error('Not ready');
      if (!canvasRef.current.hasContent()) { setSaveError('Draw something first!'); return; }
      const supabase = createClient();
      const blob = await canvasRef.current.exportPNG();
      if (blob.size > MAX_ARTWORK_BYTES) throw new Error('Drawing too large.');
      const filename = `${activeKid.id}/${safeUUID()}.png`;
      const { error: uploadErr } = await supabase.storage.from('artwork').upload(filename, blob, { contentType: 'image/png' });
      if (uploadErr) throw uploadErr;
      const { data } = await supabase.from('artworks').insert({
        kid_id: activeKid.id, lesson_id: null, title: title || 'Untitled', storage_path: filename,
      }).select().single();
      if (data) setSavedId((data as any).id);
    } catch (e: any) { setSaveError(e.message || 'Could not save.'); }
    finally { setSaving(false); }
  }

  async function handleVoiceNoteSave(blob: Blob, durationSec: number) {
    if (!activeKid || !savedId) return;
    const supabase = createClient();
    const ext = blob.type.includes('mp4') ? 'm4a' : 'webm';
    const path = `${activeKid.id}/${safeUUID()}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from('voice-notes').upload(path, blob, { contentType: blob.type });
    if (uploadErr) throw uploadErr;
    await supabase.from('artworks').update({
      voice_note_path: path,
      voice_note_duration_seconds: durationSec,
    }).eq('id', savedId);
    setVoiceRecorderOpen(false);
    setVoiceSaved(true);
  }

  return (
    <main className="h-screen overflow-hidden flex flex-col">
      {showStickerTray && (
        <StickerTray
          onClose={() => setShowStickerTray(false)}
          onPick={(value, src) => { canvasRef.current?.placeSticker(value, src); setShowStickerTray(false); }}
        />
      )}

      {/* Buddy is now rendered inside the canvas wrapper below — see canvas section */}

      <header className="shrink-0 px-4 py-3 flex items-center gap-3 border-b-2 border-cream-200 bg-cream-100/60">
        <Link href="/app"><Button variant="ghost" size="sm">← Home</Button></Link>
        <input
          type="text" value={title}
          onChange={(e) => setTitle(e.target.value)} maxLength={40}
          className="flex-1 px-4 py-2 rounded-2xl border-4 border-cream-200 bg-cream-50 focus:border-coral-400 outline-none text-ink-900 font-display font-bold text-center max-w-md mx-auto"
        />
        <Button variant="primary" size="md" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : savedId ? '✓ Saved' : '💾 Save'}
        </Button>
      </header>

      {saveError && (
        <div className="shrink-0 px-6 py-2 bg-coral-300/30 text-coral-600 text-sm text-center">{saveError}</div>
      )}
      {savedId && (
        <div className="shrink-0 px-6 py-2 bg-meadow-300/30 text-meadow-500 text-sm text-center font-display font-bold flex items-center justify-center gap-2 flex-wrap">
          {voiceSaved ? (
            <>✓ Saved with voice note! ✨</>
          ) : (
            <>
              Saved! ✨
              <button onClick={() => setVoiceRecorderOpen(true)} className="underline">
                🎤 Add voice note
              </button>
            </>
          )}
          <button onClick={() => router.push('/app/gallery')} className="underline">
            View
          </button>
        </div>
      )}

      {voiceRecorderOpen && (
        <div
          className="fixed inset-0 z-50 bg-ink-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setVoiceRecorderOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md">
            <VoiceRecorder
              prompt="Tell me about your drawing!"
              onSave={handleVoiceNoteSave}
              onSkip={() => setVoiceRecorderOpen(false)}
              maxSeconds={60}
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden min-h-0">
        {!isMobile && (
          <aside
            className="shrink-0 bg-cream-100/60 border-r-2 border-cream-200 flex flex-col py-2"
            style={{ width: SIDEBAR_W }}
          >
            <ToolPickerVertical value={tool} onChange={setTool} className="flex-1" />
          </aside>
        )}

        <div className="flex-1 flex flex-col items-center justify-center overflow-hidden px-2 md:px-4 relative">
          <div className="relative">
            <DrawingCanvas
              ref={canvasRef}
              width={canvasSize.width} height={canvasSize.height}
              color={color} brushWidth={brushWidth} tool={tool}
              onStroke={onStrokeComplete}
            />
            {/* Buddy anchored to bottom-left of the canvas itself */}
            {activeKid && (
              <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
                <FloatingBuddy
                  character={activeKid.avatar_key as any}
                  mood={buddyMood}
                  defaultCollapsed={false}
                  anchored
                  encouragements={[
                    'Wow! So creative!', 'I love this!', 'Try a new tool!',
                    'Keep going!', 'Beautiful!', '✨ Magical! ✨',
                    'More colors, more colors!', 'You\'re an artist!',
                  ]}
                />
              </div>
            )}
          </div>
        </div>

        {!isMobile && (
          <aside
            className="shrink-0 bg-cream-100/60 border-l-2 border-cream-200 flex flex-col py-2 px-1"
            style={{ width: SIDEBAR_W }}
          >
            <ColorPaletteVertical selected={color} onChange={setColor} className="flex-1" />
          </aside>
        )}
      </div>

      {/* Desktop bottom utility row */}
      {!isMobile && (
        <div className="shrink-0 px-4 py-2 bg-cream-100/60 border-t-2 border-cream-200 flex items-center gap-2 flex-wrap justify-center">
          <BrushSizer value={brushWidth} onChange={setBrushWidth} />
          <Button variant="secondary" size="md" onClick={() => canvasRef.current?.undo()}>↶</Button>
          <Button variant="secondary" size="md" onClick={() => { if (confirm('Erase everything?')) canvasRef.current?.clear(); }}>🗑</Button>
          <Button variant="sparkle" size="md" onClick={() => setShowStickerTray(true)}>😊 Stickers</Button>
        </div>
      )}

      {/* Mobile floating toolbar */}
      {isMobile && (
        <MobileDrawingToolbar
          tool={tool}
          onToolChange={setTool}
          color={color}
          onColorChange={setColor}
          brushWidth={brushWidth}
          onBrushWidthChange={setBrushWidth}
          onUndo={() => canvasRef.current?.undo()}
          leftSlot={
            <button
              onClick={() => setShowStickerTray(true)}
              className="flex flex-col items-center justify-center rounded-2xl bg-sparkle-300 active:bg-sparkle-400 px-3 py-2 min-w-[56px]"
              aria-label="Stickers"
            >
              <span className="text-2xl leading-none">😊</span>
              <span className="text-[10px] font-bold text-ink-900 mt-0.5">Stickers</span>
            </button>
          }
        />
      )}
    </main>
  );
}
