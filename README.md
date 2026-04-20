# 🎨 Payton's Art Club

A cozy, guided-drawing web app for young artists (ages 5–10). Built with Next.js 14, Supabase, and Tailwind. Deploys to Vercel.

---

## ✨ What's inside

- **Worlds & lessons** — content-driven lessons in `/public/lessons/`. Launch worlds: Critter Cove, Sparkle Kingdom, Star Hop, Mermaid Lagoon (coming soon).
- **Guided drawing canvas** — HTML5 canvas with pointer events, quadratic smoothing, reference + ghost layers, undo, Blob-based PNG export.
- **Companion characters** — four animated SVG buddies (Bunny, Kitty, Fox, Owl).
- **Lesson loop** — intro → step-by-step drawing → remix with stickers → confetti reward → sticker unlock.
- **Gallery** — full-size lightbox viewer, favorite toggle, download, delete.
- **Sticker book** — track all earned stickers, see locked/unlocked states.
- **Multi-kid support** — add multiple children, switch between them, delete individual profiles.
- **Parent mode** — COPPA-friendly arithmetic gate, dashboard, per-kid stats, delete account flow.
- **Error boundary** — any component crash shows a friendly fallback instead of a white screen.
- **Unsaved-work warning** — leaving a lesson mid-drawing asks for confirmation.
- **No child-facing monetization**. No ads. No third-party trackers.

---

## 🏗️ Tech stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS with custom design system
- Supabase — Auth, Postgres (with RLS), Storage
- Framer Motion animations
- Zustand for client state
- Vercel hosting
- PWA-installable on iPad (Safari → Add to Home Screen)

---

## 🚀 First-time setup

### 1. Install

```bash
npm install
```

### 2. Create a Supabase project

At [supabase.com](https://supabase.com) → New Project. Note the Project URL and anon key (Settings → API).

### 3. Run the schema

In Supabase SQL Editor, paste and run:

1. `supabase/schema.sql` — creates tables, RLS, storage bucket, signup trigger
2. `supabase/seed.sql` — seeds the 10 launch lessons

### 4. Environment variables

Copy `.env.example` → `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_APP_NAME=Payton's Art Club
```

### 5. Supabase auth setup

Authentication → URL Configuration:
- Site URL: `https://your-vercel-url.vercel.app`
- Redirect URLs: `https://your-vercel-url.vercel.app/**` and `http://localhost:3000/**`

Authentication → Providers → Email → turn OFF "Confirm email" (for frictionless signup) — OR keep it on and have users verify their address.

### 6. Run locally

```bash
npm run dev
```

http://localhost:3000

---

## ☁️ Deploying to Vercel

1. Push the repo to GitHub
2. vercel.com/new → Import the repo
3. Add the three env vars from `.env.example`
4. Deploy

Every subsequent `git push` auto-deploys.

---

## 📚 Adding new lessons

Lesson files live in `/public/lessons/`. To add one:

1. Create `public/lessons/my_lesson.json` following the `Lesson` shape in `lib/types.ts`
2. Register it in `lib/lessons.ts` (import + add to `LESSON_MAP`)
3. Add the lesson id to the appropriate world's `lessons` array in `lib/worlds.ts`
4. Add a row to `supabase/seed.sql` and re-run it (for analytics)
5. If it grants a new sticker, add the emoji to `STICKER_EMOJI` in `app/app/stickers/page.tsx`

Reference paths use SVG `d` attribute syntax, drawn on an 800×600 coordinate space.

---

## 🛡️ Privacy & kid-safety

- **No child-facing monetization.** Parent gate required for settings/account operations.
- **COPPA-friendly parent gate** using arithmetic — filters pre-readers without requiring PINs.
- **RLS-enforced data isolation** — parents can only access their own family via Postgres row-level security policies.
- **Private storage bucket** — artwork URLs are signed, 1 hour TTL.
- **No external trackers.** Add analytics later with a privacy-first tool (Plausible, Fathom).
- **Error boundary** catches unexpected crashes so kids don't see stack traces.
- **Unsaved-work confirm** — kids can't accidentally lose a drawing.

### Additional security hardening to consider later

- **Supabase auth rate limiting** — in the dashboard, Authentication → Policies, set rate limits on sign-in/sign-up.
- **Storage upload size cap** — currently enforced client-side (2 MB); also enforce server-side via a Postgres Edge Function or Supabase policy.
- **Full account deletion** — the parent dashboard deletes kids/artwork/stickers but the Supabase Auth row itself requires a server-side admin call. Add a Supabase Edge Function to handle this.
- **Email verification** — turn "Confirm email" back on in Supabase once you trust the email sender.

---

## 📁 Project structure

```
app/
  page.tsx                   # Landing
  login/page.tsx             # Sign in/up
  onboarding/page.tsx        # Create kid profile
  app/
    layout.tsx               # Authed shell
    page.tsx                 # Home + world map + kid switcher
    world/[id]/page.tsx      # Lesson list
    lesson/[id]/page.tsx     # Drawing flow
    gallery/page.tsx         # Artwork gallery with lightbox
    stickers/page.tsx        # Sticker collection book
  parent/page.tsx            # Parent dashboard with PIN gate
  auth/callback/route.ts     # Supabase auth callback
components/
  DrawingCanvas.tsx          # Core drawing engine
  Companion.tsx              # Animated buddies
  ErrorBoundary.tsx          # Crash safety net
  LoadingSpinner.tsx         # Friendly loading indicator
  Button, ColorPalette, BrushSizer, Confetti, Sparkles
lib/
  types.ts                   # Shared types
  worlds.ts                  # World registry
  lessons.ts                 # Lesson loader
  store.ts                   # Zustand (active kid)
  utils.ts                   # safeUUID, date formatting, etc.
  supabase/
    client.ts                # Browser client
    server.ts                # Server client
middleware.ts                # Session refresh + route protection
public/
  lessons/*.json             # Lesson content
  manifest.json, icon.svg
supabase/
  schema.sql, seed.sql
```

---

## 🧪 Commands

```bash
npm run dev         # dev server
npm run build       # production build
npm run start       # run production build
npm run lint        # eslint
npm run typecheck   # tsc --noEmit (note: build itself ignores type errors)
```

---

## 🗺️ Roadmap

**Phase 1 (this repo)**: shell, onboarding, 10 lessons across 3 worlds, drawing engine, gallery, stickers, parent mode, multi-kid ✅

**Phase 2**: free-draw mode, audio voice-over, more worlds, lesson authoring tool, cloud sync, offline PWA.

**Phase 3**: print/share, community gallery (moderated), subscription tier.

---

Made with 💛 for little artists everywhere.
