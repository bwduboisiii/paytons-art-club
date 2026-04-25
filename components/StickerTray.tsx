'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { STICKER_LIBRARY } from '@/lib/stickers';
import { createClient } from '@/lib/supabase/client';
import { useKidStore } from '@/lib/store';
import { safeUUID, MAX_ARTWORK_BYTES } from '@/lib/utils';
import type { CustomSticker } from '@/lib/types';

interface Props {
  onPick: (stickerValue: string, src?: string) => void;
  onClose?: () => void;
}

/**
 * Modal sticker tray. Tabs across preset categories + "My Stickers"
 * (uploaded). Tapping a sticker fires onPick.
 *
 * Custom upload flow:
 *  - file input → upload to "custom-stickers" bucket at kid_id/uuid.ext
 *  - insert row in custom_stickers table
 *  - refresh list
 */
export default function StickerTray({ onPick, onClose }: Props) {
  const activeKid = useKidStore((s) => s.activeKid);
  const [activeTab, setActiveTab] = useState<string>(STICKER_LIBRARY[0].id);
  const [custom, setCustom] = useState<CustomSticker[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);

  // v18: auto-scroll the active tab into view when it changes.
  // Without this, tapping a tab that's offscreen (e.g. "Magic" when starting
  // on "Animals") leaves it offscreen — kids think nothing happened.
  useEffect(() => {
    const bar = tabBarRef.current;
    if (!bar) return;
    const activeBtn = bar.querySelector<HTMLElement>(`[data-tab-id="${activeTab}"]`);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeTab]);

  useEffect(() => {
    if (!activeKid) return;
    loadCustom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKid]);

  async function loadCustom() {
    if (!activeKid) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('custom_stickers')
      .select('*')
      .eq('kid_id', activeKid.id)
      .order('created_at', { ascending: false });
    if (data) {
      // Create signed URLs
      const withUrls = await Promise.all(
        (data as CustomSticker[]).map(async (s) => {
          const { data: urlData } = await supabase.storage
            .from('custom-stickers')
            .createSignedUrl(s.storage_path, 60 * 60);
          return { ...s, signed_url: urlData?.signedUrl };
        })
      );
      setCustom(withUrls);
    }
    setLoading(false);
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeKid) return;

    // Validate
    if (!file.type.startsWith('image/')) {
      setError('Please pick an image file (PNG, JPG, or GIF).');
      return;
    }
    if (file.size > MAX_ARTWORK_BYTES) {
      setError('Image is too big. Try one under 2 MB.');
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() || 'png';
      const filename = `${activeKid.id}/${safeUUID()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('custom-stickers')
        .upload(filename, file, { contentType: file.type });
      if (uploadErr) throw uploadErr;

      const { error: insertErr } = await supabase
        .from('custom_stickers')
        .insert({
          kid_id: activeKid.id,
          name: file.name.replace(/\.[^.]+$/, ''),
          storage_path: filename,
        });
      if (insertErr) throw insertErr;

      await loadCustom();
      setActiveTab('custom');
    } catch (e: any) {
      setError(e.message || "Couldn't upload that one.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function deleteCustom(s: CustomSticker) {
    if (!confirm('Remove this sticker?')) return;
    const supabase = createClient();
    setCustom((prev) => prev.filter((c) => c.id !== s.id));
    await supabase.storage.from('custom-stickers').remove([s.storage_path]);
    await supabase.from('custom_stickers').delete().eq('id', s.id);
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-ink-900/50 backdrop-blur-sm flex items-end md:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-cream-50 rounded-t-squircle md:rounded-squircle shadow-float max-w-2xl w-full max-h-[85vh] flex flex-col"
        >
          {/* Tab bar */}
          <div ref={tabBarRef} className="flex items-center gap-2 p-3 border-b-2 border-cream-100 overflow-x-auto no-scrollbar">
            {STICKER_LIBRARY.map((cat) => (
              <button
                key={cat.id}
                data-tab-id={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={clsx(
                  'px-3 py-2 rounded-2xl font-display font-bold whitespace-nowrap transition-all',
                  activeTab === cat.id
                    ? 'bg-coral-500 text-white shadow-chunky'
                    : 'bg-cream-100 text-ink-900 hover:bg-cream-200'
                )}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
            <button
              data-tab-id="custom"
              onClick={() => setActiveTab('custom')}
              className={clsx(
                'px-3 py-2 rounded-2xl font-display font-bold whitespace-nowrap transition-all',
                activeTab === 'custom'
                  ? 'bg-coral-500 text-white shadow-chunky'
                  : 'bg-cream-100 text-ink-900 hover:bg-cream-200'
              )}
            >
              💾 Mine
            </button>
            <button
              onClick={onClose}
              className="ml-auto w-10 h-10 rounded-full hover:bg-cream-100"
              aria-label="Close stickers"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'custom' ? (
              <div>
                <div className="mb-4 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="sticker-upload"
                  />
                  <label
                    htmlFor="sticker-upload"
                    className={clsx(
                      'inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-display font-bold shadow-chunky cursor-pointer transition-all',
                      uploading
                        ? 'bg-cream-200 text-ink-500'
                        : 'bg-sparkle-400 hover:bg-sparkle-300 text-ink-900 active:shadow-none active:translate-y-1'
                    )}
                  >
                    {uploading ? 'Uploading...' : '+ Add My Sticker'}
                  </label>
                  {error && (
                    <p className="text-coral-600 text-sm mt-2">{error}</p>
                  )}
                  <p className="text-xs text-ink-500 mt-2">
                    Ask a parent before uploading. PNG, JPG, or GIF up to 2 MB.
                  </p>
                </div>

                {loading && (
                  <p className="text-center text-ink-500">
                    Loading your stickers...
                  </p>
                )}

                {!loading && custom.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-5xl mb-2">📸</div>
                    <p className="text-ink-700">
                      No custom stickers yet! Upload your first one above.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                  {custom.map((s) => (
                    <div key={s.id} className="relative group">
                      <button
                        onClick={() =>
                          s.signed_url && onPick(s.id, s.signed_url)
                        }
                        className="w-full aspect-square rounded-2xl border-4 border-cream-200 bg-cream-50 overflow-hidden hover:scale-110 transition-transform"
                      >
                        {s.signed_url && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={s.signed_url}
                            alt={s.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </button>
                      <button
                        onClick={() => deleteCustom(s)}
                        aria-label="Delete sticker"
                        className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-coral-500 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-6 md:grid-cols-8 gap-3">
                {STICKER_LIBRARY.find((c) => c.id === activeTab)?.stickers.map(
                  (emoji) => (
                    <button
                      key={emoji}
                      onClick={() => onPick(emoji)}
                      className="w-full aspect-square rounded-2xl bg-cream-100 hover:bg-cream-200 flex items-center justify-center text-3xl hover:scale-110 transition-transform"
                    >
                      {emoji}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
