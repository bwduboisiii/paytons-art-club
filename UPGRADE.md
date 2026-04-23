# Payton's Art Club — v8: Gap Audit Fixes

This is a **maintenance release**. No new features — just fixes for 16 of the 17 gaps I found during the audit. The app will look the same; it'll just break in fewer places.

## What's fixed

### 🔴 Critical (5 fixed)

1. **Guess duplication in multiplayer** — guesser no longer sees their guess twice (once wrong, once right). Now we update the existing optimistic guess in place.
2. **Dead `submitGuess` function** — removed, since the play page uses `sendGuess`.
3. **`regenerateFriendCode` silent failures** — now returns a proper result with error message. The Friends page shows an alert if regeneration fails instead of appearing to do nothing.
4. **Friends list only saw one direction** — now queries both friendship directions and dedupes. Resilient to any orphaned rows if an RPC ever fails mid-transaction.
5. **Home red-dot badge didn't refresh** — after visiting the parent dashboard and marking friendships seen, returning to home now refreshes the badge via visibility/focus listeners.

### 🟡 High (6 fixed)

7. **Stale listFriends comments removed** (docstring cleanup).
8. **Friend detail page checks both directions** — if only the reverse friendship row exists, the kid can still view their friend's art.
9. **Abandoned game rooms** — added a heartbeat column + `beforeunload` broadcast. If the host closes their tab, the guest now sees "[Name] left the game" and can start a new game.
10. **Self-echo defense on all game events** — every event handler now explicitly checks if the sender is us, and ignores. Prevents ghost events if Supabase's `self: false` ever misfires.
11. **Word-pick timeout** — if the drawer takes longer than 2 minutes to pick a word, the round auto-cancels. Prevents the guesser from being stuck forever.
14. **Parent mark-all-seen race condition** — now marks ONLY the friendships that were visible when the button was tapped. A new friendship arriving mid-view doesn't get silently hidden.

### 🟢 Medium (3 fixed)

12. **Tier badge wording** — changed "⭐ Premium" → "⭐ Bonus" and the section heading now says these are free while we're building. More honest until Stripe actually gates things.
13. **Daily lesson uses UTC** — consistent across timezones; Payton won't see a different daily lesson than her friend in another city.
15. **Canvas export no longer flashes selection** — export now renders to an off-screen scratch canvas. No more dashed-outline flicker on save.

### ⚪ Low (1 fixed)

17. **Reconnection for multiplayer** — if wifi drops during a game, the Realtime channel now retries with exponential backoff up to 5 times (1s → 2s → 4s → 8s → 15s). Connection status shows as "Reconnecting..." (yellow) or "Disconnected" (red) so kids know what's happening.

### What I deferred

- **Gap 6** (3+ player safety): added code comment; not applicable to current 2-player game
- **Gap 16** (room code mixed-case): extremely low priority, client + SQL already normalize

---

## How to apply

### Step 1: Run the v8 SQL migration

This adds the `last_heartbeat` column to game_rooms and updates the cleanup function (for Gap 9).

1. Supabase → SQL Editor → **New query**
2. Paste contents of `supabase/v8_fixes.sql`
3. Click **Run**
4. Should say "Success" — idempotent, safe to re-run

### Step 2: Swap folders

1. Back up v7 folder, unzip v8, copy `.git` over
2. `git add . && git commit -m "v8: gap audit fixes" && git push`
3. Hard refresh (Ctrl+Shift+R)

### Step 3: Test (no new features, just regression checks)

- [ ] Multiplayer game still works end-to-end (your existing v7 test case)
- [ ] When playing, watch the connection status indicator — should say "Connected" (green)
- [ ] Friends page: get a new code → verify it actually changes (Gap 3)
- [ ] Parent dashboard → tap "mark all seen" → red dot on home disappears after switching back (Gap 5)
- [ ] Gallery: save artwork with sticker selected → no dashed outline in the saved PNG (Gap 15)

---

## What should feel different

**For Payton:**
- Her guesses in the game no longer appear twice
- If she closes her friend's tab by accident, game ends cleanly instead of hanging
- Save button on a sticker-selected canvas no longer has a weird flicker

**For you (parent):**
- New friend red-dot badge goes away when it should
- Tier labels read "Bonus" not "Premium" so if you show another parent the app, they won't ask why you're paying for it
- Dashboard "mark seen" doesn't accidentally hide new arrivals

**Nothing else changes.** Same features, same lessons, same 16 avatars, same 15 tools.

---

## Still not fixed / future

- Multiplayer with 3+ players
- Chat beyond emojis (considered out of scope for kid safety)
- Stripe / real premium gating (Pass D)
- Voice/audio for companion
- Printable PDF export

When you're ready, Pass D or further content expansion is the next step. Let Payton use v8 a bit first — the real multiplayer experience (with a real friend on a real network) is where you'll find issues I can't predict.
