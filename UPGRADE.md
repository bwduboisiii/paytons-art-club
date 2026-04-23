# Payton's Art Club — v6 / Pass B: Friends System

## What's new

### Kid-facing
- **My Friends screen** at `/app/friends`
  - Your own 6-character friend code displayed prominently — tap for a big shareable modal
  - "Add a friend" input — type a 6-char code, instantly friended
  - Friends list with avatar + name + link to their shared art
  - Remove friend button on each row
  - "Get a new code" option if current code got shared with the wrong person
- **Friend detail page** at `/app/friends/[id]` — shows what artworks they've shared with friends
- **Home screen** — new 👯 Friends button in the nav
- **Gallery lightbox** — new "Share with friends" toggle button. A small 👥 badge appears on grid tiles that are shared

### Parent-facing
- **Parent dashboard** now shows each kid's friends list inline on their card
- **NEW badges** on friendships the parent hasn't seen yet (persists across sessions until acknowledged)
- **Home screen Parent button** has a red dot when there are new friendships to review
- **"Mark all seen"** link at the top of the Kids section clears all NEW badges at once
- **Remove friend** (✕) button on each friend row — parent can un-friend on behalf of their kid anytime
- **Friend code** is now shown on each kid's parent card (you can read it aloud to Payton if she forgets hers)

### How friendships work (Path A — auto-add)

1. Each kid gets a unique 6-character code auto-generated on creation. Existing kids get one the moment you run the migration SQL.
2. Kid A tells Kid B their code (verbally, in person).
3. Kid B types the code into the Add Friend input → **instantly friended**.
4. Both kids see each other in their friend lists.
5. Both parents see the new friendship with a **NEW** badge until they tap "mark all seen".
6. Parents can remove any friendship, anytime, with one tap.

### What friends can see about each other
- Name + avatar
- Artworks the kid has **explicitly shared** by toggling the share button in the gallery lightbox
- Nothing else. No age, no parent info, no last-seen, no real-time activity, no un-shared artwork.

Kids have to opt-in *per artwork* to share. New art is private by default.

---

## How to apply

### Step 1: Run the Friends schema SQL

1. Supabase → SQL Editor → **New query**
2. Paste the contents of `supabase/friends_schema.sql`
3. Click **Run**
4. Should say "Success" — it's idempotent, safe to re-run if anything flakes

This creates: the `friendships` table, adds `friend_code` column to kids, adds `is_shared` column to artworks, backfills existing kids with friend codes, adds RPCs `add_friend_by_code` and `remove_friend`, and sets up RLS policies so friends can only see shared art.

### Step 2: Swap folders

1. Back up v5 folder, unzip v6, copy `.git` over
2. `git add . && git commit -m "v6: friends system - codes, add/remove, shared art" && git push`
3. Hard refresh (Ctrl+Shift+R)

### Step 3: Test

- [ ] Home → 👯 Friends → you should see Payton's 6-character code
- [ ] Create a second test kid (onboarding) to simulate a friend
- [ ] Switch to test kid → Friends screen → add by code → verify both kids now see each other
- [ ] Open gallery on either kid → pick artwork → tap "Share with friends" → 👥 badge appears
- [ ] Other kid's friend detail page → that shared artwork is visible
- [ ] Parent dashboard → both kids show the friend with a NEW badge
- [ ] Tap "mark all seen" → NEW badges disappear
- [ ] Home screen Parent button: red dot disappears

---

## Known rough edges / honest caveats

- **No abuse reporting.** If a friend becomes weird, parent un-friends. No flag/report flow yet.
- **No push notifications.** Parent sees new friends next time they open the app (red dot + NEW badges). Notifications would be their own pass.
- **Friend codes don't expire.** If Payton gives her code away, it works forever unless regenerated. Regenerate fixes this but it's manual.
- **Shared art stays shared even if friend is removed.** Only the friendship row is deleted. To fully hide, toggle "Share with friends" off on each artwork.
- **Friend code space**: 6 chars from 31 characters (alphabet minus 0/O/1/I/L) = ~887 million combinations. Collisions are ~impossible, but the RPC handles them.
- **URL-guessing isn't a risk**: useEffect on the friend detail page verifies friendship exists before loading, and RLS blocks unauthorized storage reads.

---

## Deferred (future passes)

- **Multiplayer "guess what I'm drawing"** game with friends (Pass C)
- **Stripe** for premium world purchase (Pass D)
- **Parent push notifications** for new friendships
- **Friend code cooldown** after regeneration
- **Abuse reporting flow**
- **Custom friend names** ("call this friend 'Emma from soccer'")

---

## Safety summary

You chose **Path A** (auto-add, parent sees after). Your accepted surface area:

- Kids can friend anyone whose code they enter — no parent approval gate.
- Once friended, they see friend's name/avatar and any artwork the friend marked as shared.
- Parents see all friendships in the dashboard with NEW badges, can remove any at any time.
- Home screen Parent button shows a red dot whenever there are unseen friendships.
- Anyone who knows a kid's code can add them as a friend. **Treat codes like a phone number** — share only with people you know in real life.
- Friend codes can be regenerated at any time by the kid (old code stops working instantly).

If real-world usage reveals this is too loose, I can tighten to Path B (mutual-accept) in a future pass without data loss.
