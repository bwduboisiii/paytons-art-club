# Payton's Art Club — v7 / Pass C: Multiplayer Draw & Guess Game 🎮

## What's new

### 🎨 Draw & Guess multiplayer game
Kids can now play a real-time pictionary-style game with their friends.

- **Create a room**: Gets a 4-letter room code (like `WOLF`). Share with a friend.
- **Friend joins**: They enter the code on the game screen.
- **Gameplay**:
  - One kid is the drawer, picks one of 3 words, has 60 seconds to draw it
  - The other kid guesses in a chat panel
  - Correct guess = both players score points
  - Drawers rotate each round
  - Play as many rounds as you want
- **Fuzzy guess matching** — "unicorn" matches "unicorns" matches "a unicorn"
- **Quick-reaction emojis** (👍 🎉 😂 🤔 ❤️ ⭐) in the chat panel
- **Live score** updates at the top

### Where to find it
- New **🎮 Play Game** button on the home nav
- New **Draw & Guess Game** banner at the top of the Friends page
- Both go to `/app/game`, which lets you Create a room or Join by code

### 60 kid-safe words
Organized by difficulty (easy / medium / hard). Drawer gets 3 random easy words to pick from. Includes common animals, objects, and compound words like "pirate ship" and "ice cream cone."

---

## How to apply

### Step 1: Run the Game schema SQL

1. Supabase → SQL Editor → **New query**
2. Paste the contents of `supabase/game_schema.sql`
3. Click **Run**
4. Should say "Success" — idempotent, safe to re-run

This creates: the `game_rooms` table with RLS, and two RPCs (`join_game_room`, `leave_game_room`).

### Step 2: Enable Realtime on the game_rooms table

This is **critical** and separate from running the SQL. Without this, kids won't see each other's moves.

1. Supabase → **Database** → **Replication** (or **Realtime** in newer UI)
2. Find the `game_rooms` table
3. Toggle "Realtime" **ON** for it
4. Make sure `UPDATE` events are enabled

### Step 3: Swap folders

1. Back up v6 folder, unzip v7, copy `.git` over
2. `git add . && git commit -m "v7: multiplayer draw & guess game" && git push`
3. Hard refresh (Ctrl+Shift+R)

### Step 4: Test

**This test requires two devices or two browsers.** Open one in regular browser, another in Incognito to simulate two users.

1. Sign up a second parent account in Incognito, create a kid
2. Real Payton account (device 1): Home → 🎮 Play Game → Create room → note the 4-letter code
3. Other kid (device 2): Home → 🎮 Play Game → enter the code → Join
4. Device 1 sees "friend joined!" → tap Start game
5. Drawer picks a word, starts drawing — other device should see strokes appear in real-time
6. Guesser types a guess; if correct, round ends, both scores update
7. Host taps "Next round" → roles rotate

---

## Known rough edges (I flagged these up-front)

- **No reconnection**: If either player's wifi drops, the game doesn't gracefully recover. They'll need to leave and restart.
- **Room codes expire at browser close**: Host closes the tab → room is abandoned. Guest can still see the stale room code in DB but the host isn't there to respond. Run `cleanup_old_game_rooms()` manually in Supabase to remove stale rooms.
- **No stroke replay for late joiners**: If a guesser joins mid-round, they only see strokes drawn after they subscribed, not from the beginning. First round feels weird if join timing is bad.
- **Latency on bad networks**: Strokes batched at 20Hz so you'll see 50ms delay at best. On slow wifi, strokes can arrive out of order (rare) or bunch up (common). Recovery is automatic but looks janky.
- **Drawer's canvas is the source of truth for correct-guess judgment**. If drawer's browser hiccups, the guess-checking might lag. In practice works fine.
- **Only two players**: Game is designed for exactly 2. Third player can't join a full room.
- **No voice chat / no text chat** outside the guess panel. Kids can send emojis, nothing more.
- **No undo in game canvas**: Simplified from Free Draw on purpose — undo would need to be multicast, add latency.
- **Game canvas uses only 8 colors + marker/eraser**, not all 15 tools. Realtime bandwidth for 15 tool types would be much higher and kids don't need paintbrush for pictionary.
- **"Host" role is sticky**: Only host can start rounds. If host leaves, the game ends.

---

## Safety notes

- No discovery: Games are strictly **friends-only**. No matchmaking, no "join random room."
- Room codes are ephemeral (~2 hours max before cleanup).
- Chat is locked to a tight set of kid-safe features: typed guesses (checked for word match) + reaction emojis only.
- No image sharing, no voice, no free-form messaging.
- Parent dashboard doesn't currently show game activity — that's a pass-D feature if desired.

---

## If something breaks

**"Connecting..." stays forever** → You didn't enable Realtime on the table. Go back to Step 2.

**Guesser sees drawer's strokes but drawer doesn't see guesses** → The `self: false` broadcast config means you don't receive your own events. Open the guesser's console and look for errors. Most likely the channel subscription is failing.

**"Room not found" when joining** → Code is case-sensitive in the UI but the SQL normalizes with `upper()`. If this happens, try again — the room might have just expired (>2h old).

**Strokes appear slowly / stutter** → Real network latency. On shared home wifi this should be <100ms. On mobile data it can spike to 1-2s. Not fixable in app code.

---

## Deferred to future passes

- **Stripe** for premium worlds (Pass D)
- **Game polish**: reconnection, stroke replay, word difficulty selector, custom word lists
- **Parent push notifications** for new game invites
- **Saving completed games to gallery** (a "frozen" canvas from the last drawing)
- **3+ player lobbies**
- **Spectator mode**

---

## My honest take

I've built the game end-to-end but **I genuinely cannot verify it works** without two real devices and two real accounts on two real networks. Realtime multiplayer is the one feature where simulation in my head isn't enough.

So: there's a real chance that when you and a friend try this, something will be subtly broken. That's not me being pessimistic — that's me being honest about what multiplayer networking is like. If it doesn't work, tell me exactly what happened (host saw, guest saw, in what order) and I can debug from logs.

If it works the first time: 🎉

If it doesn't: we iterate. That was baked into your "build it, accept rough edges" choice. I'm here for the iteration.
