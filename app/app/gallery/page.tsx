'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Button from '@/components/Button';
import Companion from '@/components/Companion';
import { useKidStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import type { Artwork } from '@/lib/types';

interface GalleryItem extends Artwork {
  signed_url?: string;
}

export default function GalleryPage() {
  const activeKid = useKidStore(s => s.activeKid);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeKid) return;
    (async () => {
      const supabase = createClient();
      const { data: artworks } = await supabase
        .from('artworks')
        .select('*')
        .eq('kid_id', activeKid.id)
        .order('created_at', { ascending: false });

      if (!artworks) {
        setLoading(false);
        return;
      }

      // Get signed URLs (artwork bucket is private)
      const withUrls: GalleryItem[] = await Promise.all(
        (artworks as Artwork[]).map(async (a) => {
          const { data } = await supabase.storage
            .from('artwork')
            .createSignedUrl(a.storage_path, 60 * 60);
          return { ...a, signed_url: data?.signedUrl };
        })
      );
      setItems(withUrls);
      setLoading(false);
    })();
  }, [activeKid]);

  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between px-6 md:px-12 py-5">
        <Link href="/app">
          <Button variant="ghost" size="sm">← Home</Button>
        </Link>
        <h1 className="font-display font-bold text-xl">My Art Gallery</h1>
        <div className="w-16" />
      </header>

      <section className="px-6 md:px-12 py-8 max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-6xl mb-2 inline-block animate-bounce-soft">🖼️</div>
          <h1 className="heading-1">Your Masterpieces</h1>
          <p className="text-ink-700 mt-2">Every drawing you've made, all in one cozy place.</p>
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <Companion character="bunny" mood="thinking" size={100} />
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="card-cozy p-12 text-center max-w-lg mx-auto">
            <Companion character="kitty" mood="idle" size={120} />
            <h2 className="heading-2 mt-4 mb-2">No drawings yet!</h2>
            <p className="text-ink-700 mb-6">
              Finish your first lesson and your art will appear here.
            </p>
            <Link href="/app">
              <Button variant="primary" size="lg">Pick a Lesson ✏️</Button>
            </Link>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map(item => (
              <div key={item.id} className="card-cozy overflow-hidden group">
                {item.signed_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={item.signed_url}
                    alt={item.title || 'Artwork'}
                    className="w-full aspect-[4/3] object-cover bg-cream-50"
                  />
                ) : (
                  <div className="w-full aspect-[4/3] bg-cream-200 animate-pulse" />
                )}
                <div className="p-3">
                  <p className="font-display font-bold text-sm truncate">{item.title}</p>
                  <p className="text-xs text-ink-500">
                    {new Date(item.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
