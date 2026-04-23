'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button';
import DrawingCanvas, { type DrawingCanvasHandle } from '@/components/DrawingCanvas';
import ColorPalette from '@/components/ColorPalette';
import ToolPicker from '@/components/ToolPicker';
import BrushSizer from '@/components/BrushSizer';
import FloatingBuddy from '@/components/FloatingBuddy';
import StickerTray from '@/components/StickerTray';
import { useKidStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { safeUUID, MAX_ARTWORK_BYTES } from '@/lib/utils';
import type { DrawingToolId } from '@/lib/drawingTools';

export default function FreeDrawPage() {
  const router = useRouter();
  const activeKid = useKidStore((s) => s.activeKid);
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const [color, setColor] = useState('#2A1B3D');
  const [tool, setTool] = useState<DrawingToolId>('marker');
  const [brushWidth, setBrushWidth] = useState(8);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [showStickerTray, setShowStickerTray] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [title, setTitle] = useState('My Masterpiece');
  const [buddyMood, setBuddyMood] = useState<
    'happy' | 'cheering' | 'thinking' | 'idle'
  >('happy');

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

  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (canvasRef.current?.hasContent() && !savedId) {
        e.preventDefault();
        e.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [savedId]);

  // Light-up the buddy for a moment on each stroke
  function onStrokeComplete() {
    setBuddyMood('cheering');
    setTimeout(() => setBuddyMood('happy'), 500);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      if (!activeKid || !canvasRef.current) throw new Error('Not ready');
      if (!canvasRef.current.hasContent()) {
        setSaveError('Draw something first!');
        return;
      }
      const supabase = createClient();
      const blob = await canvasRef.current.exportPNG();
      if (blob.size > MAX_ARTWORK_BYTES) {
        throw new Error('Drawing too large. Try fewer strokes.');
      }
      const filename = `${activeKid.id}/${safeUUID()}.png`;
      const { error: uploadErr } = await supabase.storage
        .from('artwork')
        .upload(filename, blob, { contentType: 'image/png' });
      if (uploadErr) throw uploadErr;

      const { data } = await supabase
        .from('artworks')
        .insert({
          kid_id: activeKid.id,
          lesson_id: null, // free-draw → no lesson
          title: title || 'Untitled',
          storage_path: filename,
        })
        .select()
        .single();

      if (data) setSavedId((data as any).id);
    } catch (e: any) {
      setSaveError(e.message || 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col overflow-hidden">
      {showStickerTray && (
        <StickerTray
          onClose={() => setShowStickerTray(false)}
          onPick={(value, src) => {
            canvasRef.current?.placeSticker(value, src);
            setShowStickerTray(false);
          }}
        />
      )}

      {activeKid && (
        <FloatingBuddy
          character={activeKid.avatar_key as any}
          mood={buddyMood}
          encouragements={[
            'Wow! So creative!',
            'I love this!',
            'Try a new tool!',
            'Keep going!',
            'Beautiful!',
            '✨ Magical! ✨',
            'More colors, more colors!',
            'You\'re an artist!',
          ]}
        />
      )}

      {/* Top bar */}
      <header className="px-4 md:px-8 pt-4 pb-2 flex items-center gap-4">
        <Link href="/app">
          <Button variant="ghost" size="sm">
            ← Home
          </Button>
        </Link>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={40}
          className="flex-1 px-4 py-2 rounded-2xl border-4 border-cream-200 bg-cream-50 focus:border-coral-400 outline-none text-ink-900 font-display font-bold text-center max-w-md mx-auto"
        />
        <Button
          variant="primary"
          size="md"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : savedId ? '✓ Saved' : '💾 Save'}
        </Button>
      </header>

      {saveError && (
        <div className="px-6 py-2 bg-coral-300/30 text-coral-600 text-sm text-center">
          {saveError}
        </div>
      )}

      {savedId && (
        <div className="px-6 py-2 bg-meadow-300/30 text-meadow-500 text-sm text-center font-display font-bold">
          Saved to your gallery! ✨{' '}
          <button
            onClick={() => router.push('/app/gallery')}
            className="underline"
          >
            View it
          </button>
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center px-4 pt-4">
        <DrawingCanvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          color={color}
          brushWidth={brushWidth}
          tool={tool}
          onStroke={onStrokeComplete}
        />
      </div>

      {/* Bottom toolbar - two rows on mobile, one on desktop */}
      <div className="px-4 md:px-8 py-4 bg-cream-100/60 backdrop-blur-sm flex flex-col gap-3">
        <div className="flex justify-center">
          <ToolPicker value={tool} onChange={setTool} compact />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ColorPalette
            colors={[]}
            selected={color}
            onChange={setColor}
            showPicker
          />
          <div className="flex items-center gap-2">
            <BrushSizer value={brushWidth} onChange={setBrushWidth} />
            <Button
              variant="secondary"
              size="md"
              onClick={() => canvasRef.current?.undo()}
            >
              ↶
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                if (confirm('Erase everything?')) canvasRef.current?.clear();
              }}
            >
              🗑
            </Button>
            <Button
              variant="sparkle"
              size="md"
              onClick={() => setShowStickerTray(true)}
            >
              😊 Stickers
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
