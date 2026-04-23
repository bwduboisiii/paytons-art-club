'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Companion from '@/components/Companion';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useKidStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import type { Artwork, FriendInfo } from '@/lib/types';
import { formatRelativeDate } from '@/lib/utils';

export default function FriendDetailPage({ params }: { params: { id: string } }) {
  const { id: friendId } = params;
  const router = useRouter();
  const { activeKid } = useKidStore();
  const [friend, setFriend] = useState<FriendInfo | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeKid) { router.replace('/app'); return; }
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      // Gap 8: verify friendship in BOTH directions to tolerate orphaned rows
      const [dir1, dir2] = await Promise.all([
        supabase
          .from('friendships').select('id')
          .eq('kid_id', activeKid.id)
          .eq('friend_kid_id', friendId)
          .maybeSingle(),
        supabase
          .from('friendships').select('id')
          .eq('kid_id', friendId)
          .eq('friend_kid_id', activeKid.id)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      if (!dir1.data && !dir2.data) {
        router.replace('/app/friends');
        return;
      }
      // Load friend info from lookup view
      const { data: friendRow } = await supabase
        .from('kids_lookup')
        .select('id, name, avatar_key, friend_code')
        .eq('id', friendId).single();
      // Load their shared artworks
      const { data: art } = await supabase
        .from('artworks')
        .select('*')
        .eq('kid_id', friendId)
        .eq('is_shared', true)
        .order('created_at', { ascending: false });

      if (cancelled) return;
      setFriend(friendRow as any);
      setArtworks((art || []) as Artwork[]);

      if (art?.length) {
        const paths = art.map((a: any) => a.storage_path);
        const { data: urlRows } = await supabase.storage
          .from('artwork')
          .createSignedUrls(paths, 60 * 60);
        const map: Record<string, string> = {};
        urlRows?.forEach((r: any) => { if (r.path && r.signedUrl) map[r.path] = r.signedUrl; });
        setSignedUrls(map);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friendId]);

  if (loading) return <LoadingSpinner label="Loading..." />;
  if (!friend) return null;

  return (
    <main className="min-h-screen">
      <header className="flex items-center gap-3 px-6 md:px-12 py-5">
        <Link href="/app/friends"><Button variant="ghost" size="sm">← Friends</Button></Link>
      </header>

      <section className="px-6 md:px-12 py-4 max-w-5xl mx-auto">
        <div className="card-cozy p-6 mb-6 flex items-center gap-4">
          <Companion character={friend.avatar_key} size={80} />
          <div>
            <h1 className="heading-1">{friend.name}</h1>
            <p className="text-ink-700">
              {artworks.length} shared {artworks.length === 1 ? 'artwork' : 'artworks'}
            </p>
          </div>
        </div>

        {artworks.length === 0 ? (
          <div className="card-cozy p-8 text-center">
            <Companion character={friend.avatar_key} mood="idle" size={80} />
            <p className="text-ink-700 mt-4">
              {friend.name} hasn't shared any artwork yet.
            </p>
            <p className="text-ink-500 text-sm mt-2">
              When they mark art as shared, it'll show up here!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {artworks.map((a) => (
              <div key={a.id} className="card-cozy p-3 flex flex-col">
                <div className="aspect-square bg-cream-100 rounded-2xl overflow-hidden mb-2">
                  {signedUrls[a.storage_path] && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={signedUrls[a.storage_path]}
                      alt={a.title || 'Art'}
                      className="w-full h-full object-contain bg-cream-50"
                    />
                  )}
                </div>
                <p className="font-display font-bold text-sm truncate">
                  {a.title || 'Untitled'}
                </p>
                <p className="text-xs text-ink-500">{formatRelativeDate(a.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
