import { createClient } from './supabase/client';
import type { FriendInfo } from './types';

// ============================================================
// Friends data operations
// Path A auto-add. Both friendship directions created by RPC.
// ============================================================

export async function lookupKidByCode(code: string): Promise<FriendInfo | null> {
  const supabase = createClient();
  const normalized = code.trim().toUpperCase();
  if (normalized.length !== 6) return null;

  const { data, error } = await supabase
    .from('kids_lookup')
    .select('id, name, avatar_key, friend_code')
    .eq('friend_code', normalized)
    .maybeSingle();

  if (error || !data) return null;
  return data as FriendInfo;
}

/**
 * Add friend via RPC (creates both directions atomically).
 */
export async function addFriendByCode(
  myKidId: string,
  friendCode: string
): Promise<{ ok: true; friend: FriendInfo } | { ok: false; error: string }> {
  const normalized = friendCode.trim().toUpperCase();
  if (normalized.length !== 6) {
    return { ok: false, error: 'Friend codes are 6 characters.' };
  }

  const supabase = createClient();
  const { data, error } = await supabase.rpc('add_friend_by_code', {
    requesting_kid_id: myKidId,
    target_friend_code: normalized,
  });

  if (error) {
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('code_not_found'))
      return { ok: false, error: "We couldn't find that code. Check with your friend!" };
    if (msg.includes('own_code'))
      return { ok: false, error: "That's your own code! 😄" };
    if (msg.includes('not_authorized'))
      return { ok: false, error: "Hmm, something's not right. Ask a parent to help." };
    return { ok: false, error: error.message || "Couldn't add friend." };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { ok: false, error: "Couldn't add friend." };

  return {
    ok: true,
    friend: {
      id: row.friend_id,
      name: row.friend_name,
      avatar_key: row.friend_avatar,
    },
  };
}

/**
 * List all friends of a kid.
 * Gap 4/7: queries BOTH directions (kid_id=me OR friend_kid_id=me), dedupes,
 * resolves friend info from whichever column isn't me. This is resilient
 * to orphaned friendship rows.
 */
export async function listFriends(kidId: string): Promise<FriendInfo[]> {
  const supabase = createClient();

  // Query both directions in parallel
  const [mineRes, reverseRes] = await Promise.all([
    supabase
      .from('friendships')
      .select('friend_kid_id, created_at')
      .eq('kid_id', kidId),
    supabase
      .from('friendships')
      .select('kid_id, created_at')
      .eq('friend_kid_id', kidId),
  ]);

  // Collect friend kid IDs + the earliest creation time for each
  const friendedAt = new Map<string, string>();
  (mineRes.data || []).forEach((r: any) => {
    const existing = friendedAt.get(r.friend_kid_id);
    if (!existing || new Date(r.created_at) < new Date(existing)) {
      friendedAt.set(r.friend_kid_id, r.created_at);
    }
  });
  (reverseRes.data || []).forEach((r: any) => {
    const existing = friendedAt.get(r.kid_id);
    if (!existing || new Date(r.created_at) < new Date(existing)) {
      friendedAt.set(r.kid_id, r.created_at);
    }
  });

  const friendIds = Array.from(friendedAt.keys());
  if (!friendIds.length) return [];

  const { data: kids } = await supabase
    .from('kids_lookup')
    .select('id, name, avatar_key, friend_code')
    .in('id', friendIds);

  return (kids || []).map((k: any) => ({
    id: k.id,
    name: k.name,
    avatar_key: k.avatar_key,
    friend_code: k.friend_code,
    friended_at: friendedAt.get(k.id),
  }));
}

export async function removeFriend(kidId: string, friendKidId: string) {
  const supabase = createClient();
  await supabase.rpc('remove_friend', {
    requesting_kid_id: kidId,
    other_kid_id: friendKidId,
  });
}

/**
 * Count friendships across ALL the parent's kids that haven't been
 * acknowledged yet (parent_seen_at IS NULL).
 */
export async function countUnseenFriendships(parentId: string): Promise<number> {
  const supabase = createClient();
  const { data: kids } = await supabase
    .from('kids')
    .select('id')
    .eq('parent_id', parentId);
  if (!kids?.length) return 0;
  const { count } = await supabase
    .from('friendships')
    .select('*', { count: 'exact', head: true })
    .in('kid_id', kids.map((k: any) => k.id))
    .is('parent_seen_at', null);
  return count || 0;
}

/**
 * Mark specific friendship rows as seen.
 * Gap 14: accepts a list of IDs to mark seen instead of "all unseen for this parent"
 * so new friendships that arrive between load time and button click aren't
 * inadvertently marked as seen.
 */
export async function markFriendshipsSeen(
  parentId: string,
  friendshipIds?: string[]
) {
  const supabase = createClient();
  const { data: kids } = await supabase
    .from('kids')
    .select('id')
    .eq('parent_id', parentId);
  if (!kids?.length) return;

  let q = supabase
    .from('friendships')
    .update({ parent_seen_at: new Date().toISOString() })
    .in('kid_id', kids.map((k: any) => k.id))
    .is('parent_seen_at', null);

  if (friendshipIds && friendshipIds.length) {
    q = q.in('id', friendshipIds);
  }
  await q;
}

/**
 * Regenerate a kid's friend code.
 * Gap 3: explicit handling of unique-violation errors, retries only on those.
 * Other errors (network, permission) return meaningful error.
 */
export async function regenerateFriendCode(
  kidId: string
): Promise<{ ok: true; code: string } | { ok: false; error: string }> {
  const supabase = createClient();
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let lastNonCollisionError: string | null = null;

  for (let attempt = 0; attempt < 20; attempt++) {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    const { error } = await supabase
      .from('kids')
      .update({ friend_code: code })
      .eq('id', kidId);

    if (!error) return { ok: true, code };

    // Unique violation: try a different code
    // Postgres unique violation has code '23505'. Supabase surfaces message;
    // check both.
    const isCollision =
      (error as any).code === '23505' ||
      (error.message || '').toLowerCase().includes('duplicate') ||
      (error.message || '').toLowerCase().includes('unique');

    if (!isCollision) {
      lastNonCollisionError = error.message || 'Unknown error';
      break; // Don't retry non-collision errors
    }
  }

  return {
    ok: false,
    error: lastNonCollisionError || "Couldn't generate a unique code. Try again.",
  };
}
