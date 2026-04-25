# Payton's Art Club — v18: Lessons Auto-Advance + Polish 🎨

## What's new

### 1. ✏️ Next lesson opens with one tap

When a kid finishes a lesson, the reward screen now shows a big **"Next: [Lesson Title] →"** button as the primary action. One tap and the next lesson in the same world opens up. If it was the last lesson in the world, the button falls back to "More Drawing ✏️" (returns to the world list).

Files changed:
- `lib/lessons.ts` — added `getNextLesson(currentLessonId)` helper
- `app/app/lesson/[id]/page.tsx` — reward screen now shows Next button

### 2. 🎫 Patrick Moss has lifetime premium

Your account (`bamoss25@gmail.com`, UID `6f5aa6d8-6cfa-4714-84d4-186a9470a15b`) now has premium access regardless of Stripe subscription status. Implemented two ways for redundancy:

**Client-side override** (`lib/useEntitlement.ts`): hardcoded list of override user IDs. The hook checks this list first and returns `hasPremium: true` immediately if the current user matches.

**Database grant** (`supabase/v18_grant_premium.sql`): SQL migration that sets `has_premium = true` on the parents row for your UID, with `subscription_current_period_end = '2099-12-31'` so it never auto-expires.

You should run the SQL migration in Supabase SQL Editor after deploying. The client-side override will work immediately on deploy without needing the SQL, but the DB grant makes it persistent in the source of truth.

### 3. 🐰 Buddy moved INSIDE canvas (no longer blocks tools)

The buddy now lives ANCHORED to the bottom-left corner of the canvas itself, not floating over the page. This means:
- Tools in the left toolbar are always fully visible/clickable
- Color sidebar on the right is always fully visible/clickable
- Bottom utility row (undo, save, etc) is always fully visible/clickable
- The buddy occupies a small portion of the canvas itself, where strokes pass through it (`pointer-events-none` on the wrapper, only the actual avatar circle and X button capture events)

### 4. 🐼 Buddy is bigger

Avatar size increased from 56 → 90 in expanded mode. Speech bubble max-width increased from 180 → 200. Hide button slightly larger.

The buddy is now a substantial presence the kid can actually engage with, not a tiny thumbnail.

### 5. 🏷️ Sticker tabs auto-scroll into view

When you tap a sticker category tab that's offscreen (e.g. "Magic" when you're scrolled to "Animals"), the tab bar now auto-scrolls so the active tab is centered/visible. Fixes the "doesn't slide all the way over" complaint.

File changed: `components/StickerTray.tsx`

### 6. 🎨 New logo

The new "Payton's Art Club" logo from your upload replaces the old one. All favicons (32px, 192px, 512px, apple-touch-icon, favicon.ico) regenerated from the new logo. Will appear:
- Browser tab favicon
- iOS home screen icon (when "Add to Home Screen")
- Android PWA icon
- Logo on landing/login pages

## How to apply

1. Back up v17, unzip v18, copy `.git` over
2. `git add . && git commit -m "v18: auto-advance lessons, premium grant, buddy polish, new logo"`
3. `git push`
4. Vercel auto-deploys (~2-3 min)
5. **Run the SQL migration**: open Supabase → SQL Editor → paste contents of `supabase/v18_grant_premium.sql` → Run
6. Hard refresh on every device (browser will need to fetch new favicons too)

## Test checklist

- [ ] Open a lesson → finish it → reward screen shows "Next: [lesson title] →"
- [ ] Tap Next → next lesson in same world opens
- [ ] Finish the LAST lesson in a world → reward screen shows "More Drawing ✏️" instead
- [ ] Log in as `bamoss25@gmail.com` → all premium worlds unlocked (no paywall)
- [ ] Open Free Draw → buddy is in bottom-left corner of canvas, NOT covering tools
- [ ] Buddy is noticeably larger than before (size 90 vs old 56)
- [ ] Tap buddy → collapses to peek tab on left edge
- [ ] Open sticker tray → tap "Magic" or other offscreen tab → tab scrolls into view
- [ ] Browser tab shows new logo favicon
- [ ] On iPad: add to home screen → home screen icon is the new logo

## What's NOT in v18

- **Language switcher** — strongly pushed back. Full app i18n is 20-40+ hours of work per language with proper translations. Partial implementations (only menus translated) feel broken. Recommend treating this as its own future project, not bundling it into a polish release.

## Honest caveats

- The buddy at size 90 covers ~120×170 pixels in the bottom-left of the canvas. Strokes pass through (pointer-events-none) so kids CAN draw under the buddy, but they won't see what they drew until they collapse the buddy. If this becomes a problem, kids can tap the buddy to collapse it.
- The "auto-scroll" sticker tab fix uses `scrollIntoView({ behavior: 'smooth' })`. On older iOS versions the smooth scroll may be janky — that's a browser limitation, not a code issue.
- The Patrick Moss override is a hardcoded user ID. If you want to add more comp accounts later, edit `PREMIUM_OVERRIDE_USER_IDS` in `lib/useEntitlement.ts`.

## Files changed in v18

| File | What changed |
|---|---|
| `components/FloatingBuddy.tsx` | Added `anchored` prop, increased size to 90 |
| `components/StickerTray.tsx` | Added auto-scroll on active tab change |
| `app/app/draw/page.tsx` | Buddy moved inside canvas wrapper, anchored |
| `app/app/lesson/[id]/page.tsx` | Buddy anchored, Next Lesson button on reward screen |
| `lib/lessons.ts` | Added `getNextLesson()` helper, imported WORLDS |
| `lib/useEntitlement.ts` | Added `PREMIUM_OVERRIDE_USER_IDS` set |
| `public/logo.png` | New "Payton's Art Club" logo |
| `public/favicon*.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png` | Regenerated from new logo |
| `supabase/v18_grant_premium.sql` | NEW — SQL migration for Patrick Moss premium grant |

## What I'd recommend next

You've made a lot of changes (v15-v18) and Payton hasn't had a chance to use the stable version for any meaningful time. **Stop and let her play for a week**. Note specifically:

- Does she actually tap "Next Lesson" or close the app at the reward screen?
- Does the bigger buddy delight her or annoy her?
- Does she find the sticker categories easier to navigate now?
- Any new issues that come up only with sustained use?

Real signal beats more iterations.
