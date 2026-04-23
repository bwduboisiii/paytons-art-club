# Payton's Art Club — v9 / Pass D-1: Voice Recording 🎤

## What's new

### 🎤 Voice recording for drawings

Kids can now record a short voice note (up to 60 seconds) about their drawing. Saved alongside the artwork, playable from the gallery.

**Where it appears:**
- **After a lesson** — on the reward screen, after the "New sticker unlocked!" celebration, a mic appears: *"Want to tell me about your drawing?"* with a skip option
- **In Free Draw** — after saving, the success banner includes an **"🎤 Add voice note"** button; tap to open the recorder modal
- **In Gallery** — any artwork with a voice note gets a 🎤 badge on its tile. In the lightbox, a full audio player appears below the image with delete option
- **In Friend's gallery** — friends who view shared art also see the voice note (compact "▶ Hear it" button)
- **Parent dashboard** — kid cards now show "🎤 N voice" alongside lesson and artwork counts

**How recording works:**
- Tap the big coral mic button
- Browser asks for microphone permission (one-time)
- 60-second countdown with live progress bar
- Tap stop (or let it auto-stop)
- Preview your recording → "Keep it!" or "Try again" or skip
- Saves to private storage bucket

**Browser support:**
- ✅ Chrome, Safari, Firefox on iPad and desktop
- ⚠️  Very old iOS (< 14.3) — recorder shows a clear error and lets kids skip
- Permission denied → clear error message telling kids to look for the pop-up

---

## How to apply

### Step 1: Run the voice schema SQL

1. Supabase → SQL Editor → **New query**
2. Paste contents of `supabase/voice_schema.sql`
3. Click **Run**
4. Should say "Success"

This adds:
- `voice_note_path` and `voice_note_duration_seconds` columns to `artworks`
- A `voice-notes` storage bucket (private)
- RLS policies so parents can read/write/delete their own kids' voice notes, and friends can read voice notes only on artworks the kid has marked shared

### Step 2: Swap folders

1. Back up v8 folder, unzip v9, copy `.git` over
2. `git add . && git commit -m "v9: voice recording for drawings" && git push`
3. Hard refresh (Ctrl+Shift+R)

### Step 3: Test

**Most important test — do this on the iPad Payton actually uses:**

1. Home → any free lesson → complete the lesson → see reward screen
2. Mic button should appear under the sticker celebration
3. Tap mic → iPad will prompt for microphone permission — say Allow
4. Talk for 5 seconds → tap stop → preview plays back
5. Tap "Keep it!" → should save
6. Go to Gallery → lesson artwork tile should have a 🎤 badge
7. Tap the tile → lightbox opens → audio player appears below the image → play it

**If microphone permission fails on iPad:**
- Go to iPad Settings → Safari → Camera & Microphone → Allow
- Or make sure you're on HTTPS (which Vercel provides)
- Recording will NOT work on http:// or localhost without HTTPS

**Other tests:**
- Free Draw → save → tap "🎤 Add voice note" → record → verify tile gets 🎤 badge
- Parent dashboard → verify voice note count appears under kid's stats
- Share an artwork (👥 in lightbox) → view from a friend account → verify they see "▶ Hear it"

---

## Known rough edges

- **Very long voice notes** — capped at 60 seconds. If you want longer, change `maxSeconds` prop in the lesson/draw pages.
- **No transcription** — recordings are pure audio. Not a mistake; a feature. If you wanted transcription later, needs an external API (Whisper, Deepgram) with cost.
- **No background removal of voice noise** — whatever's in the room when Payton records is what gets recorded. Fine for home use.
- **Audio file size** — about 100-200KB per 30-second recording. Supabase free tier has 1GB storage; you'd hit the ceiling at ~5000 voice notes, which is fine.
- **Safari sometimes loses permission** — if iPad Safari forgets microphone permission, kids will see the "Can't hear you!" error and need to hit "Try again." Normal browser behavior.
- **Recording while in Free Draw** — the big success banner with the voice button can get overlooked if kids immediately tap "View gallery." That's by design; they can always add a voice note later by opening the artwork in gallery, which... actually, I didn't wire THAT up. You can only add a voice note at save time, not retroactively. That's a real limitation worth noting.
- **Voice notes survive friendship removal** — if Payton shared art and a friend removed her, the friend can no longer access the voice note because storage RLS checks current friendship status. Correct behavior.
- **Export PNG doesn't include audio** — obviously. Downloaded artwork files are image-only. The audio lives only in the app.

---

## What's NOT in this pass

Pass D-1 is voice recording only. Not yet:
- Pass D-2: Stripe premium tier (next)
- Pass D-3: Polish (sticker flicker deep fix, SVG cleanups)
- Pass D-4: Final gap audit + packaging

Still deployable and useful standalone — voice notes are independent of the other Pass D work.

---

## What should feel different

**For Payton:**
- A magical new thing: she can talk to her drawings and hear herself back
- This is the single highest-delight feature I've built for her. A 7-year-old narrating "THIS IS A BUNNY AND HE HAS GLITTERY EARS" and playing it back is memorable

**For you:**
- Gallery becomes a little scrapbook with her voice attached
- Parent dashboard shows how much she's using it
- Voice notes are a reason to revisit the gallery (in a way static art isn't)

**For friends:**
- Friends see and hear the story behind shared drawings. Much warmer than silent image share.

---

## One honest concern

Voice recording can surface privacy things that didn't exist before. A kid might record something personal (family in the background, etc.) and not realize it's shared when they share the artwork. I wired the share toggle correctly — voice notes inherit the `is_shared` flag from the artwork — but worth knowing: **when Payton taps "Share with friends" on an artwork, any voice note attached gets shared too.** There's no separate "share voice but not art" or vice versa.

If this matters, the mitigation is: remove the voice note (via the 🎤 Remove voice button in the lightbox) before sharing. Or teach Payton: "Only share drawings without recordings, or check the recording first." This is a teaching moment with her, not a code fix.
