'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/Button';
import Companion from '@/components/Companion';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useKidStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import type { Artwork } from '@/lib/types';
import { formatRelativeDate } from '@/lib/utils';

interface GalleryItem extends Artwork {
  signed_url?: string;
}

// Signed URL validity — we refresh liberally to avoid 404s on page reload.
const URL_TTL_SECONDS = 60 * 60; // 1 hour

export default function GalleryPage() {
  const activeKid = useKidStore((s) => s.activeKid);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!activeKid) {
      setLoading(false);
      return;
    }
    (async () => {
      const supabase = createClient();
      const { data: artworks, error } = await supabase
        .from('artworks')
        .select('*')
        .eq('kid_id', activeKid.id)
        .order('created_at', { ascending: false });

      if (cancelled) return;
      if (error || !artworks) {
        setLoading(false);
        return;
      }

      // Batch signed URLs - fetch all at once using parallel requests.
      const withUrls: GalleryItem[] = await Promise.all(
        (artworks as Artwork[]).map(async (a) => {
          const { data } = await supabase.storage
            .from('artwork')
            .createSignedUrl(a.storage_path, URL_TTL_SECONDS);
          return { ...a, signed_url: data?.signedUrl };
        })
      );
      if (!cancelled) {
        setItems(withUrls);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeKid]);

  async function toggleFavorite(item: GalleryItem) {
    const supabase = createClient();
    const next = !item.is_favorite;
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_favorite: next } : i))
    );
    await supabase
      .from('artworks')
      .update({ is_favorite: next })
      .eq('id', item.id);
  }

  async function toggleShared(item: GalleryItem) {
    const supabase = createClient();
    const next = !item.is_shared;
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_shared: next } : i))
    );
    await supabase
      .from('artworks')
      .update({ is_shared: next })
      .eq('id', item.id);
  }

  async function deleteArtwork(item: GalleryItem) {
    if (!confirm('Delete this drawing? This cannot be undone.')) return;
    const supabase = createClient();
    // Optimistic UI
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    setLightboxIdx(null);
    // Best effort: remove storage + db
    await supabase.storage.from('artwork').remove([item.storage_path]);
    await supabase.from('artworks').delete().eq('id', item.id);
  }

  function downloadArtwork(item: GalleryItem) {
    if (!item.signed_url) return;
    const a = document.createElement('a');
    a.href = item.signed_url;
    a.download = `${(item.title || 'artwork').replace(/[^a-z0-9]/gi, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between px-6 md:px-12 py-5">
        <Link href="/app">
          <Button variant="ghost" size="sm">
            ← Home
          </Button>
        </Link>
        <h1 className="font-display font-bold text-xl">My Art Gallery</h1>
        <div className="w-16" />
      </header>

      <section className="px-6 md:px-12 py-8 max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-6xl mb-2 inline-block animate-bounce-soft">
            🖼️
          </div>
          <h1 className="heading-1">Your Masterpieces</h1>
          <p className="text-ink-700 mt-2">
            Every drawing you've made, all in one cozy place.
          </p>
        </div>

        {loading && <LoadingSpinner label="Loading your art..." />}

        {!loading && items.length === 0 && (
          <div className="card-cozy p-12 text-center max-w-lg mx-auto">
            <Companion character="kitty" mood="idle" size={120} />
            <h2 className="heading-2 mt-4 mb-2">No drawings yet!</h2>
            <p className="text-ink-700 mb-6">
              Finish your first lesson and your art will appear here.
            </p>
            <Link href="/app">
              <Button variant="primary" size="lg">
                Pick a Lesson ✏️
              </Button>
            </Link>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item, i) => (
              <button
                key={item.id}
                onClick={() => setLightboxIdx(i)}
                className="card-cozy card-cozy-hover overflow-hidden group text-left relative"
              >
                {item.is_favorite && (
                  <div className="absolute top-2 right-2 bg-coral-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-chunky z-10">
                    ♥
                  </div>
                )}
                {item.is_shared && (
                  <div className="absolute top-2 left-2 bg-sparkle-400 text-ink-900 rounded-full w-8 h-8 flex items-center justify-center shadow-chunky z-10 text-sm">
                    👥
                  </div>
                )}
                {item.signed_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={item.signed_url}
                    alt={item.title || 'Artwork'}
                    className="w-full aspect-[4/3] object-cover bg-cream-50"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full aspect-[4/3] bg-cream-200 animate-pulse" />
                )}
                <div className="p-3">
                  <p className="font-display font-bold text-sm truncate">
                    {item.title || 'Untitled'}
                  </p>
                  <p className="text-xs text-ink-500">
                    {formatRelativeDate(item.created_at)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIdx !== null && items[lightboxIdx] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink-900/85 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setLightboxIdx(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-cream-50 rounded-squircle shadow-float max-w-3xl w-full max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b-2 border-cream-100">
                <div>
                  <h2 className="font-display font-bold text-lg">
                    {items[lightboxIdx].title || 'Untitled'}
                  </h2>
                  <p className="text-xs text-ink-500">
                    {formatRelativeDate(items[lightboxIdx].created_at)}
                  </p>
                </div>
                <button
                  onClick={() => setLightboxIdx(null)}
                  className="w-10 h-10 rounded-full hover:bg-cream-100 transition-colors"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-cream-100">
                {items[lightboxIdx].signed_url && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={items[lightboxIdx].signed_url}
                    alt={items[lightboxIdx].title || 'Artwork'}
                    className="max-w-full max-h-[60vh] rounded-2xl shadow-float"
                  />
                )}
              </div>
              <div className="p-4 border-t-2 border-cream-100 flex flex-wrap justify-center gap-2">
                <Button
                  variant={items[lightboxIdx].is_favorite ? 'primary' : 'secondary'}
                  size="md"
                  onClick={() => toggleFavorite(items[lightboxIdx])}
                >
                  {items[lightboxIdx].is_favorite ? '♥ Favorited' : '♡ Favorite'}
                </Button>
                <Button
                  variant={items[lightboxIdx].is_shared ? 'sparkle' : 'secondary'}
                  size="md"
                  onClick={() => toggleShared(items[lightboxIdx])}
                >
                  {items[lightboxIdx].is_shared ? '👥 Shared with friends' : '👥 Share with friends'}
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => downloadArtwork(items[lightboxIdx])}
                >
                  💾 Download
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => deleteArtwork(items[lightboxIdx])}
                >
                  🗑️ Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
