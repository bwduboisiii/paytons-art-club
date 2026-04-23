# Payton's Art Club — v3 Upgrade (Pass A)

## What's new in v3 (this upgrade)

### 🎨 4 brand new lesson worlds
- **Dino Land** 🦕 (premium) — T-Rex, Triceratops, Stegosaurus
- **Fairy Garden** 🧚 (premium) — Fairy, Mushroom, Magic Wand
- **Food Friends** 🍰 (premium) — Apple, Pizza, Ice Cream
- **Vehicle Village** 🚗 (premium) — Car, Plane, Sailboat

### 📚 Lesson content
- **14 new lessons** on top of the existing 17 — total of **31 lessons** across 8 worlds
- Added to existing worlds too: **Zippy the Alien** (Star Hop), **Starry Starfish** (Mermaid Lagoon)

### ⭐ Free vs. Premium tier system
- Home screen now has a "Free worlds" section and a "More adventures" premium section
- Premium worlds are clearly badged with a ⭐ Premium tag
- Currently **all worlds are fully playable** — the tier flag is UI-only for now
- Stripe/payment wiring is marked for a future pass (so parents aren't charged yet)

### 📅 Daily Lesson
- Big banner at the top of the home screen showing the day's featured lesson
- Rotates automatically every day (same for all users, deterministic by date)
- Only picks from free lessons so kids never hit a paywall on the daily
- Shows a green "Done!" state when today's daily is completed

### 👯 8 avatar choices (was 4)
- Original 4: Bunny 🐰, Kitty 😺, Fox 🦊, Owl 🦉
- **New 4**: Panda 🐼, Bear 🐻, Unicorn 🦄, Dragon 🐲
- Shown during onboarding and in the parent dashboard

### 🛠️ Carried forward from v2
- 7 drawing tools, floating buddy, free-draw mode, 144 preset stickers, custom sticker upload, error boundary, multi-kid switcher, gallery lightbox — all still there

---

## What's NOT in this pass (coming in future passes)

You asked for social/multiplayer/paid features. They're substantial builds:

- **Friend system** → Pass B
- **Guess-what-I'm-drawing multiplayer** → Pass C
- **Stripe purchase for premium worlds** → Pass D

Each of those needs its own focused session to do right. What you have here is a fully working app with much more content; you can deploy it and let Payton use it immediately while the rest gets built.

---

## How to apply

### Step 1: Fix the sticker bucket (if you haven't yet)

Your earlier error was from re-running `schema.sql`. That's already applied. You need `schema_additions.sql` instead:

1. Supabase → SQL Editor → **New query**
2. Paste contents of `supabase/schema_additions.sql`
3. Click Run
4. Verify in Supabase → Storage that you now see **two buckets**: `artwork` and `custom-stickers`

### Step 2: Run the updated seed SQL (registers new lessons)

1. Supabase → SQL Editor → **New query**
2. Paste contents of `supabase/seed.sql`
3. Run
4. This uses `on conflict do update` so it's safe to re-run — it upserts existing rows and adds the 14 new ones.

### Step 3: Swap folders, keep `.git`

1. File Explorer — rename current `paytons-art-club` to `paytons-art-club-v2-backup`
2. Unzip `paytons-art-club-v3.zip`, rename extracted folder to `paytons-art-club`
3. With Hidden items visible, copy `.git` folder from backup → new folder

### Step 4: Push

```
cd C:\Users\Benja\projects\paytons-art-club
git add .
git commit -m "v3: 4 new worlds, 14 lessons, daily lesson, 8 avatars, tier system"
git push
```

### Step 5: Test

Ctrl+Shift+R hard refresh, and try:

1. **Home** — new banner shows **today's daily lesson** at the top
2. Scroll down — **Free worlds** section (4 worlds) then **More adventures** (4 premium-badged worlds)
3. Click **Dino Land** → try Rexy the T-Rex
4. Click **Fairy Garden** → Dewdrop the Fairy
5. Go to Parent → "Add another kid" → onboarding → see **8 avatar options** now instead of 4
6. If you already completed today's daily, the banner turns green with a ✓

---

## Known rough edges

- **Premium tier is visual only right now**. The ⭐ badge shows but kids can still play every world. Once Stripe is added, worlds tagged premium will actually gate until the parent unlocks them. Plan accordingly if you're showing this to others.
- **Dragon avatar is new art** — might need iteration on the face if Payton doesn't love it, easy to adjust.
- **Daily lesson resets at local midnight** based on the user's device clock, not a server clock. Two users in different time zones see different dailies — fine for family use, would matter if the app gets bigger.
- **15 new lesson drawings** were generated with more utilitarian SVG paths than the first 10 hand-tuned ones. Quality is still solid but some shapes (especially dinosaurs and vehicles) may look geometric. Easy to hand-tune any that bug you — just edit the JSON files directly.

---

## Next pass preview

**Pass B (Friends system)** will add:
- Kid profile gets a unique 6-character friend code
- "My Friends" screen
- Send/receive friend requests via code (no search — safer for kids)
- Requires parent approval on both sides before a friendship is created
- Strict RLS so kids can only see what their mutual friends explicitly share

Just say "continue" when you're ready. Or tell me what you want Pass B to be — maybe you want multiplayer first.
