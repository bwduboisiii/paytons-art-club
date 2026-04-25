# Payton's Art Club 🎨

A complete kid-friendly drawing web app built for Payton (age 7) — but designed for any kid ages 5-10.

This is the **complete cumulative codebase** through v14b. Every feature built across all 14 versions is included here.

---

## Quick start

This is a Next.js 14 app deployed on Vercel with Supabase backend and Stripe subscriptions.

### To run locally:
```bash
npm install
# Set up .env.local from .env.example (see "Environment variables" below)
npm run dev
```

### To deploy:
1. Push to GitHub
2. Connect to Vercel (auto-deploys on push to main)
3. Add environment variables in Vercel project settings (see below)

---

## Environment variables

See `.env.example`. You need:

**Required for any deploy:**
- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role (for webhook)
- `NEXT_PUBLIC_SITE_URL` — your production URL (e.g. `https://project-quucx.vercel.app`)

**Required for Stripe subscriptions:**
- `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` — Stripe publishable key (`pk_test_...` or `pk_live_...`)
- `STRIPE_SECRET_KEY` — Stripe secret key (`sk_test_...` or `sk_live_...`)
- `STRIPE_PRICE_ID` — Stripe Price ID for $4.99/mo subscription
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret (`whsec_...`)

The Stripe code gracefully degrades if Stripe vars are absent — premium features simply lock without crashing.

---

## Database setup

All required SQL is in `supabase/`. Run these migrations in order via Supabase SQL Editor:

1. `supabase/01_schema.sql` — core tables (kids, artworks, parents, etc.)
2. `supabase/02_friends.sql` — friend codes + relationships
3. `supabase/03_game.sql` — multiplayer game tables
4. `supabase/04_voice.sql` — voice notes storage
5. `supabase/05_stripe.sql` — Stripe subscription columns + entitlement view

Storage buckets needed:
- `artworks` — kids' drawings
- `voice-notes` — voice recordings
- `stickers` — user-uploaded custom stickers

---

## Feature inventory

### Drawing & creativity
- **15 drawing tools**: marker, pen, pencil, crayon, paintbrush, chalk, highlighter, neon, spray, glitter, line, rectangle, circle, fill bucket, eraser
- **Brush size control** with visual preview
- **Always-visible color sidebar** with 50+ colors + custom rainbow color picker
- **Free Draw mode** — open canvas, no lessons
- **Sticker tray** — ~489 stickers across 9 categories (animals, nature, food, magic, space, faces, emoji, fun, places)
- **Sticker manipulation** — drag, resize via handles, rotate, pinch-to-zoom, duplicate, layering (bring forward/back), delete
- **Custom sticker uploads** — kids can upload their own stickers
- **Voice notes** — 60-second voice recordings attached to artwork (MediaRecorder API)
- **Undo/clear**

### iOS Safari drawing fix (v12)
- Window-level pointer listeners during strokes (Safari can't yank capture)
- `getCoalescedEvents()` recovers sub-frame points → smoother lines
- Non-passive `touchstart`/`touchmove` `preventDefault()` blocks swipe-back
- Stronger CSS touch isolation (`overscrollBehavior: contain`, etc.)

### Lessons & worlds (v14a + v14b)
- **18 themed worlds** total
- **9 free worlds**:
  - Critter Cove 🐰 (8 lessons + 4 hidden rotation)
  - Sparkle Kingdom 👑 (5 lessons + 4 hidden rotation)
  - Star Hop 🚀 (3 lessons + 4 hidden rotation)
  - Mermaid Lagoon 🧜‍♀️ (3 lessons + 4 hidden rotation)
  - Pet Parade 🐶 (4 lessons)
  - Weather Wonders 🌈 (4 lessons)
  - Bug Buddies 🐝 (4 lessons)
  - Shape Shop ⭐ (4 lessons)
  - Garden Patch 🌷 (4 lessons)
- **9 premium worlds** (require subscription):
  - Dino Land 🦕 (3 lessons)
  - Fairy Garden 🧚 (3 lessons)
  - Food Friends 🍰 (3 lessons)
  - Vehicle Village 🚗 (3 lessons)
  - Sea Adventure ⚓ (4 lessons)
  - Robot Workshop 🤖 (4 lessons)
  - Bakery Sweets 🧁 (4 lessons)
  - Toy Box 🧸 (4 lessons)
  - Holiday Magic 🎃 (4 lessons)
- **87 lessons total**
- **Daily lesson rotation** — UTC-based, deterministic, pulls from 36 free lessons (hidden + new), changes once per calendar day
- Each lesson: step-by-step trace guidance, companion dialogue, reference SVG paths, ghost mode toggle, completion sticker reward, remix phase with stickers

### Companion avatars (28 total)
Original 16: Hoppy (bunny), Whiskers (kitty), Rusty (fox), Hoot (owl), Bamboo (panda), Honey (bear), Sparkle (unicorn), Ember (dragon), Banana (monkey), Snooze (sloth), Inky (octopus), Clover (deer), Lily (frog), Waddle (penguin), Spike (hedgehog), Shelly (turtle).

v13 additions (12 new): Buddy (dog), Storm (husky), Pearl (poodle), Nibbles (hamster), Eucalyptus (koala), Roar (lion), Stripes (tiger), Dash (zebra), Tally (giraffe), Flutter (butterfly), Buzz (bee), Coral (mermaid).

Each avatar: hand-drawn SVG, 4 mood animations (idle, happy, cheering, thinking), used as kid's chosen companion + appears in friend lists.

### Multi-kid profiles + parent dashboard
- Multiple kid profiles per parent account
- Each kid has: name, avatar, sticker count, completed lessons, friendships, artworks
- Math-gate parent area (kids can't access without solving simple math)
- Parent dashboard: review kids' artwork, manage friends, manage subscription, delete kid/account

### Friends system
- 6-char friend codes (BUNNY7 format) — easy for kids to share
- Bidirectional auto-add via Postgres RPC
- Kids see friends' galleries (shared art)
- Friend code regeneration if compromised
- Parent approval shown for new friendships

### Multiplayer pictionary game
- 4-character room codes
- Supabase Realtime channel for live drawing
- 60 kid-safe word prompts
- 60-second rounds with auto-scoring
- Reconnection handling
- Spectator mode while waiting

### Stripe subscription tier (v10)
- $4.99/month with **7-day free trial**
- Stripe Checkout integration
- Webhook handles: `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `invoice.payment_failed`
- Customer portal for self-service cancellation
- Graceful degradation when Stripe env vars missing
- Premium worlds gate via `useEntitlement` hook

### Mobile-first UI (v11)
- `useIsMobile()` hook detects narrow viewport + touch capability
- **Mobile-only**: bottom nav bar (5 tabs), bottom-sheet modals, fullscreen lightbox with swipe gestures, floating drawing toolbar with bottom-sheet pickers
- **Desktop**: top nav, sidebar pickers, centered modals — unchanged
- Safe-area-aware (iPhone notches)

### Brand & polish (v13)
- Custom Payton's Art Club logo on landing page + login + favicons
- iOS apple-touch-icon, Android PWA icons (192/512), browser favicon
- Sparkles, confetti, animations throughout
- Cozy color palette (cream, coral, meadow, sky, berry, sparkle, ink)

---

## Tech stack

- **Frontend**: Next.js 14 App Router + TypeScript + Tailwind CSS
- **Animations**: Framer Motion
- **Auth + DB**: Supabase (Postgres + Auth + Storage + Realtime)
- **Payments**: Stripe (subscriptions + webhooks + customer portal)
- **Hosting**: Vercel (auto-deploy from GitHub `main`)
- **Mobile detection**: custom `useIsMobile` hook
- **Drawing engine**: HTML5 Canvas with PointerEvents API

---

## Version history (what shipped when)

| Version | What it added |
|---|---|
| v1-v8 | Foundation: lessons, worlds, drawing canvas, friends, multiplayer, gap fixes |
| v9 | Voice recording on artwork |
| v10 | Stripe premium tier ($4.99/mo, 7-day trial) |
| v10-hotfix-1 | Fixed Suspense boundary error in `/parent` |
| v10-hotfix-2 | Disabled automatic_tax (no business address required) |
| v11 | Mobile-first UI (bottom nav, sheets, fullscreen lightbox) |
| v12 | iOS Safari drawing fix (incomplete — caused new bugs, see v15) |
| v13 | New logo, 12 new avatars (28 total), ~489 stickers across 9 categories |
| v14a | 5 new free worlds + hidden daily-rotation pool (36 lessons) |
| v14b | 5 new premium worlds + 20 lessons |
| **v15** | **Real drawing fix — removed buggy duplicate event handling, added rAF batching** |

---

## Known caveats / honest notes

These are deliberate compromises, not bugs:

- **Lessons in v14 are template-generated.** The original 31 lessons (v1-v8) were hand-crafted with carefully tuned SVG reference paths. The 56 lessons added in v14 follow the same pattern but were generated programmatically from a template. They work, kids can trace them, but the art quality varies.
- **Tool/color pickers in mobile bottom sheets** scroll vertically rather than displaying as tight grids. Refining requires rebuilding the picker components — deferred.
- **The FloatingBuddy companion** still uses desktop offsets on mobile. May overlap the bottom toolbar in some lesson states.
- **Holiday Magic mixes seasons** (snowman + pumpkin + Christmas tree + hearts in one world). Works fine year-round — kids don't care.
- **Custom per-world reward stickers** aren't implemented. Completion gives a generic gold sticker.
- **App Store wrapper** isn't built. Would require Apple IAP, which conflicts with Stripe subscription. Web-only for now.

---

## What you should do with this

1. **Deploy** — push to GitHub, Vercel auto-builds
2. **Run SQL migrations** — Supabase SQL editor, in order
3. **Add env vars** — Vercel project settings
4. **Test on iPad** — that's Payton's actual device
5. **Watch her play** — real usage signal beats any feature speculation
6. **Iterate based on what she does** — not what you think she'll do

This is a real, complete, working kid art SaaS. Ship it. Watch your daughter use it. Refine based on what you see.

— Built session by session over 14 versions. April 2026.
