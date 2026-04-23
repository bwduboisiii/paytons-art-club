# Payton's Art Club — v2 Upgrade Guide

## What's new in this version

### 🎨 Drawing experience
- **7 drawing tools**: marker, pencil, crayon, highlighter, spray, glitter, eraser — each with its own distinct look and feel
- **Expanded colors**: preset palette with brights, pastels, earth tones, and inclusive skin tones, plus a full rainbow picker for any color
- **Floating buddy**: cute animated companion on the right side during drawing, with rotating encouragements and a collapsible tab

### 🖼️ Free draw mode
- Blank canvas mode at `/app/draw`
- All tools and colors available
- Saves to the main gallery just like lesson drawings
- CTA banner on the home screen

### 🎁 Sticker library
- 6 categories × 24 stickers = **144 preset stickers** (animals, nature, food, magic, space, faces)
- **Custom sticker upload** — kids can upload their own PNG/JPG/GIF stickers (up to 2 MB)
- Available in both free-draw and the remix phase of lessons

### 📚 More lessons
- **7 new lessons** added (Pupper the Dog, Fluttery Butterfly, Roary the Dinosaur, Pretty Flower, Magic Rainbow, Friendly Mermaid, Cute Seahorse)
- **Mermaid Lagoon unlocked** as a real world (was "Coming Soon")
- Total lesson count: **17 across 4 worlds**

---

## How to apply this upgrade

Same pattern as before: unzip, copy over your existing folder, keep the `.git` folder, push.

### Step 1: Back up and unzip

1. In File Explorer: rename your current `paytons-art-club` folder to `paytons-art-club-v1-backup` (keep as safety net)
2. Unzip `paytons-art-club-v2.zip`
3. Rename the extracted folder to `paytons-art-club`

### Step 2: Restore your git history

With **Hidden items** visible in File Explorer:

1. Copy the `.git` folder from `paytons-art-club-v1-backup`
2. Paste it into the new `paytons-art-club`

### Step 3: Run the new database migration

**This is required before deploying** — new features reference new database tables.

1. Go to Supabase → SQL Editor → New query
2. Paste the contents of `supabase/schema_additions.sql`
3. Click Run
4. Should say "Success"

Then run the updated seed to register the new lessons:
1. New query
2. Paste `supabase/seed.sql`
3. Run

### Step 4: Push to GitHub

```
cd C:\Users\Benja\projects\paytons-art-club
git add .
git commit -m "v2: 7 drawing tools, floating buddy, free draw, custom stickers, 7 new lessons, mermaid lagoon"
git push
```

Vercel auto-deploys.

### Step 5: Test

Hard refresh (**Ctrl+Shift+R**) and try:

1. Home screen — should show the new **Free Draw Mode** banner at the top
2. Click any lesson — try the new tool picker row (marker, pencil, crayon, highlighter, spray, glitter, eraser)
3. Notice the cute buddy floating on the right side — click the × to collapse, click the tab to reveal again
4. Tap the 🎨 button in the color row to see the expanded palette
5. Tap the rainbow button to pop open a full color picker
6. In the remix step, tap "+ More Stickers" → browse categories → try **Mine** tab to upload your own
7. Back to home → click **Free Draw Mode** → blank canvas with full toolbox
8. Check the worlds list — **Mermaid Lagoon** should now be unlocked!

---

## Troubleshooting

**"Column 'custom_stickers' does not exist"** — you didn't run `schema_additions.sql`. Go back to Step 3.

**Floating buddy doesn't appear** — buddy only shows during the drawing and remix phases, and on free-draw. Not on intro or reward screens.

**Sticker upload fails** — check Supabase → Storage → confirm the `custom-stickers` bucket exists (schema_additions.sql creates it automatically; if missing, re-run that SQL).

**New lessons don't show up** — if the lesson list shows old lessons only: did you push to GitHub? Vercel only rebuilds on push.

**"coming soon" still shows on Mermaid Lagoon** — hard refresh your browser (Ctrl+Shift+R). The world config is cached until fresh JavaScript loads.

---

## What's still coming (Pass 3, if you want)

- More lessons to reach 20+ total (still need ~6 more across worlds)
- More Mermaid Lagoon lessons (currently 2; could add 3 more)
- Audio/voice-over for companion dialogue
- Printable PDF export
- Server-side account deletion (Supabase Edge Function)

Just ask "continue" when you're ready.
