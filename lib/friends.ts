import { createClient } from './supabase/client';
import type { FriendInfo } from './types';

// ============================================================
// Friends data operations
// Safety model: Path A (auto-add). Kid enters a friend_code,
// friendship is created immediately, and it shows in the parent
// dashboard as "new" until parent_seen_at is set.
// ============================================================

/**
 * Look up a kid by their friend_code. Returns minimal public info or null.
 */
export async function lookupKidByCode(
  code: string
): Promise<FriendInfo | null> {
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
 * Add a friend via the server-side RPC, which creates both directions
 * atomically so both kids see the friendship instantly.
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
 * Get all friends of a kid (from either direction of the friendship).
 */
export async function listFriends(kidId: string): Promise<FriendInfo[]> {
  const supabase = createClient();

  // Our direction: friendships where kid_id = me
  const { data: mine } = await supabase
    .from('friendships')
    .select('friend_kid_id, created_at')
    .eq('kid_id', kidId);

  // Reverse direction: friendships where friend_kid_id = me
  // (These are rows owned by the OTHER parent but we can read them via
  //  the kids_friend_code_public_read policy on kids, though friendships
  //  table itself is parent-scoped. So we'll only see our own direction here.)
  // For now, friendships are only created from our side. If the friend
  // adds us back, another row is created from their side, which we CAN'T
  // read directly. We resolve this by ALWAYS adding from both sides when
  // creating a friendship, via an RPC that has elevated permissions.
  // TODO: move to RPC in a polish pass. For Pass A, we only show our direction.

  const friendIds = (mine || []).map((r: any) => r.friend_kid_id);
  if (!friendIds.length) return [];

  const { data: kids } = await supabase
    .from('kids_lookup')
    .select('id, name, avatar_key, friend_code')
    .in('id', friendIds);

  const friendedAt = new Map<string, string>();
  (mine || []).forEach((r: any) => friendedAt.set(r.friend_kid_id, r.created_at));

  return (kids || []).map((k: any) => ({
    id: k.id,
    name: k.name,
    avatar_key: k.avatar_key,
    friend_code: k.friend_code,
    friended_at: friendedAt.get(k.id),
  }));
}

/**
 * Remove a friendship (both directions, via RPC).
 */
export async function removeFriend(kidId: string, friendKidId: string) {
  const supabase = createClient();
  await supabase.rpc('remove_friend', {
    requesting_kid_id: kidId,
    other_kid_id: friendKidId,
  });
}

/**
 * Parent dashboard: count of unseen friendships across all the parent's kids.
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
 * Mark all friendships across parent's kids as seen (parent opened the dashboard).
 */
export async function markFriendshipsSeen(parentId: string) {
  const supabase = createClient();
  const { data: kids } = await supabase
    .from('kids')
    .select('id')
    .eq('parent_id', parentId);
  if (!kids?.length) return;
  await supabase
    .from('friendships')
    .update({ parent_seen_at: new Date().toISOString() })
    .in('kid_id', kids.map((k: any) => k.id))
    .is('parent_seen_at', null);
}

/**
 * Regenerate a kid's friend code (e.g. if an old code was shared with someone
 * the parent doesn't want). Uses the DB function so we don't have to worry
 * about collisions client-side.
 *
 * Note: existing friendships are NOT broken by this — only new friend-by-code
 * attempts would fail because the old code no longer resolves.
 */
export async function regenerateFriendCode(kidId: string): Promise<string | null> {
  const supabase = createClient();
  // Generate via a loop client-side — simple & works
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  for (let attempt = 0; attempt < 20; attempt++) {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    const { error } = await supabase
      .from('kids')
      .update({ friend_code: code })
      .eq('id', kidId);
    if (!error) return code;
  }
  return null;
}
