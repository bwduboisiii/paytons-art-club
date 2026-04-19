# 🎨 Payton's Art Club

A cozy, guided-drawing web app for young artists (ages 5–10). Built with Next.js 14, Supabase, and Tailwind. Deploys to Vercel.

---

## ✨ What's inside

- **Worlds & lessons** — content-driven lessons defined as JSON in `/public/lessons/`. Three launch worlds: Critter Cove, Sparkle Kingdom, Star Hop.
- **Guided drawing canvas** — HTML5 Canvas with pointer events, quadratic smoothing, reference + ghost layers, undo, PNG export.
- **Companion characters** — four animated SVG buddies (Bunny, Kitty, Fox, Owl) that react through the lesson flow.
- **Lesson loop** — intro → step-by-step drawing → remix (add stickers/extras) → reward (confetti + sticker unlock).
- **Gallery** — all finished artworks saved privately in Supabase Storage.
- **Parent mode** — COPPA-friendly arithmetic gate, dashboard, per-kid stats, sign out.
- **No child-facing monetization**. No ads. No third-party trackers.

---

## 🏗️ Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** with a custom cozy-art design system
- **Supabase** — Auth, Postgres (with RLS), Storage
- **Framer Motion** for animations
- **Zustand** for active-kid client state
- **Vercel** for hosting
- Deploys as a **PWA** — installable on iPad from Safari ("Add to Home Screen")

---

## 🚀 First-time setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

Go to [supabase.com](https://supabase.com) → New Project. Note the project URL and anon key (Settings → API).

### 3. Run the schema

In the Supabase SQL Editor:

```bash
# Paste and run the contents of:
supabase/schema.sql
supabase/seed.sql
```

This creates the tables (parents, kids, lessons, lesson_completions, artworks, kid_stickers), the `artwork` storage bucket, Row Level Security policies, and the signup trigger.

### 4. Environment variables

Copy `.env.example` → `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # only if you add server admin features later
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## ☁️ Deploying to Vercel

1. Push this repo to GitHub.
2. In Vercel → **Add New Project** → import the repo.
3. Add the same env vars under **Settings → Environment Variables**.
4. Deploy. Vercel auto-detects Next.js.
5. In Supabase → **Authentication → URL Configuration**, add your Vercel domain (e.g. `https://paytons-art-club.vercel.app`) to the **Site URL** and **Redirect URLs** list.

---

## 📚 Adding new lessons

Lessons are JSON files in `/public/lessons/`. To add one:

1. Create a new file, e.g. `public/lessons/critter_cove_06.json`, following the schema in `lib/types.ts` (`Lesson` interface).
2. Register it in `lib/lessons.ts` (add the import + entry in the `LESSON_MAP`).
3. Add a row to `public/worlds` via `lib/worlds.ts` if creating a new world, or append the lesson id to an existing world's `lessons` array.
4. Add a row to `supabase/seed.sql` and re-run it so analytics work.

### Lesson anatomy

```json
{
  "id": "critter_cove_06",
  "world_id": "critter_cove",
  "order_index": 6,
  "title": "Sleepy Panda",
  "subject": "panda",
  "guidance_level": "show_and_copy",
  "estimated_minutes": 5,
  "is_premium": false,
  "palette": ["#2A1B3D", "#FFFBF4", "#FFB3A7", "#FFD166"],
  "completion_sticker": "panda_sleepy",
  "steps": [
    {
      "id": "s1",
      "instruction": "Round panda head",
      "companion_line": "A big round head to start!",
      "reference_paths": ["M 400 300 m -100 0 a 100 100 0 1 0 200 0 a 100 100 0 1 0 -200 0"],
      "show_ghost": false
    }
  ],
  "remix_options": [
    { "id": "bamboo", "label": "Bamboo snack", "emoji": "🎋", "sticker_keys": ["bamboo"] }
  ]
}
```

**Reference paths** are SVG `<path d="…">` strings drawn at 800×600 canvas coordinates. They appear faded behind the kid's drawing so they can trace. Each step should show the cumulative paths drawn so far — step 2's reference paths should include step 1's plus the new shape.

**Guidance levels** control how prominent the reference is:

- `trace_strict` / `trace_loose` — reference shown clearly; kid traces.
- `show_and_copy` — reference shown faintly; kid copies nearby.
- `free_prompt` — no reference; kid draws from imagination.

---

## 🎨 Design system

All colors, shadows, fonts live in `tailwind.config.ts`.

- **Fonts**: Fredoka (display, rounded/friendly) + Nunito (body)
- **Palette**: cream (base), coral (primary), berry/sky/meadow/sparkle (accents), ink (text)
- **Shadows**: `shadow-chunky` (6px offset no-blur, very tactile) + `shadow-float` (soft drop)
- **Radii**: `rounded-squircle` (2rem) + `rounded-blob` (organic)
- **Animations**: `bounce-soft`, `wiggle`, `pop-in`, `sparkle`, `float`

---

## 📁 Project structure

```
app/
  page.tsx                   # Landing page
  login/page.tsx             # Sign in / sign up
  onboarding/page.tsx        # Create kid profile
  app/
    layout.tsx               # Authed shell
    page.tsx                 # Home (world map)
    world/[id]/page.tsx      # Lesson list for a world
    lesson/[id]/page.tsx     # The drawing flow (intro/draw/remix/reward)
    gallery/page.tsx         # Saved artworks
  parent/page.tsx            # Parent dashboard with PIN gate
  auth/callback/route.ts     # Supabase auth callback
components/
  DrawingCanvas.tsx          # Core drawing engine
  Companion.tsx              # Animated SVG buddies
  Button.tsx, ColorPalette.tsx, BrushSizer.tsx, Confetti.tsx, Sparkles.tsx
lib/
  types.ts                   # Shared TS types
  worlds.ts                  # World registry
  lessons.ts                 # Lesson loader
  store.ts                   # Zustand (active kid)
  supabase/client.ts         # Browser Supabase client
  supabase/server.ts         # Server Supabase client
middleware.ts                # Session refresh + route protection
public/
  lessons/*.json             # Lesson content (10 launch lessons)
  manifest.json              # PWA manifest
supabase/
  schema.sql                 # Tables + RLS + triggers + storage
  seed.sql                   # Lesson catalog seed
```

---

## 🛡️ Privacy & kid-safety notes

- **No child-facing monetization.** Business-model flag is in code; upgrade screens are parent-gated only.
- **COPPA-friendly parent gate** using arithmetic (7+6 style) — filters pre-readers without storing PINs.
- **RLS-enforced data isolation** — parents can only query their own family via Postgres policies.
- **Private storage bucket** — artwork URLs are signed, short-lived (1 hr).
- **No external trackers** — no analytics scripts are wired up.

If you add analytics later, use a privacy-first tool (Plausible, Fathom) and disclose it in the parent zone.

---

## 🗺️ Roadmap (phases)

**Phase 1** (this repo): shell, onboarding, 10 lessons across 3 worlds, drawing engine, gallery, parent mode ✅

**Phase 2**: free-draw mode, sticker collection screen, more worlds, printable PDF export, audio voice-over for companions, premium unlock flow

**Phase 3**: lesson authoring tool for non-developers, cloud sync across devices, multi-kid progress comparisons, offline PWA mode

---

## 🧪 Local commands

```bash
npm run dev         # start dev server
npm run build       # production build
npm run start       # run production build
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
```

---

Made with 💛 for little artists everywhere.
