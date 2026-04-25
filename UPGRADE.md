# Payton's Art Club — v19: Drawing Fix Attempt #4 + Account Polish 🎨

## TL;DR

Four things changed:

1. **Drawing fix attempt #4** — root cause: every stroke triggered a parent re-render via `setBuddyMood('cheering')`, which bypassed v17's stable redraw protection in subtle ways. Fixed properly this time with React.memo + stable callback + buddy moved out of canvas DOM tree.
2. **Auto-redirect when already logged in** — your "remember me" request. Supabase already keeps sessions persistent; the bug was that the login page didn't check for an existing session. Now it does.
3. **Parent vs kid signup choice** — added a friendly gate at the top of the signup form. Kids see a "ask a grown-up to set this up for you" screen.
4. **Password gate before billing actions** — both "Start trial" and "Manage subscription" now require typing your account password before proceeding.

## What changed

### Drawing — REAL root cause this time

After v15 and v17 both failed to fully fix this, I dug deeper. The bug:

`onStrokeComplete` in draw page and lesson page called `setBuddyMood('cheering')` after every stroke. This triggered the **parent component** to re-render. The parent re-rendered DrawingCanvas with a NEW `onStroke` prop reference (functions are recreated on every render unless memoized). The canvas re-rendered. Even with v17's stable `redraw` (via refs), the canvas re-render still ran after the canvas mutation — and any pending rAF callback could see the wrong state during this race.

**v19 fix** (three layers):
1. **`React.memo` on DrawingCanvas** — prevents canvas from re-rendering when parent state changes that don't affect its props
2. **`useCallback` on `onStrokeComplete`** — stable reference so React.memo can actually compare equal
3. **Removed `setBuddyMood` from `onStrokeComplete`** — no more parent re-render during strokes
4. **Moved buddy OUT of canvas wrapper** — buddy is a separate fixed sibling now, its animations don't share a render tree with the canvas

Plus the v17 ref-based redraw is still in place. Belt and suspenders.

The buddy now stays in `mood="happy"` permanently. It won't switch to `cheering` after each stroke. Trade-off: the buddy is less reactive but the drawing actually works.

### Auto-redirect (Remember Me)

Login page now checks `supabase.auth.getSession()` on mount. If a session exists, it redirects to `/app` (or `?next=` URL) immediately. Shows a brief "Checking…" spinner. Supabase's default behavior already persists sessions in localStorage for ~1 week — this fix exposes that.

If you have multiple parent accounts on the same browser, you'll still need to use private mode or clear cookies to switch between them.

### Parent/Kid signup gate

When clicking signup, the user now sees:

> Quick question first — who's signing up?
> 👩 I'm a grown-up — I'll set up an account and add my kid(s).
> 🧒 I'm a kid — I want to draw!

If they pick "kid," they see:

> Yay! Welcome to Payton's Art Club!
> A grown-up needs to set up your account first. Show this screen to a parent or guardian and ask them to help you sign up — it only takes a minute!

This addresses the COPPA-friendly concern that kids shouldn't be creating their own accounts. The "Go back" button takes them to the parent/kid choice again.

### Password gate before billing

Created `components/PasswordConfirm.tsx` — a modal that prompts for the account password and verifies it via `supabase.auth.signInWithPassword`. If correct, runs the pending action (start checkout, open billing portal). If wrong, shows error.

Wired into BOTH the Subscribe button (start free trial) AND the Manage subscription button. So a kid clicking around in a logged-in parent's session can't accidentally start a subscription or cancel one without the parent typing their password.

Title text changes per action: "Confirm to start trial" or "Confirm to manage billing."

## How to apply

1. Back up v18b, unzip v19, copy `.git` over
2. `git add . && git commit -m "v19: drawing fix #4, account polish"`
3. `git push`
4. Hard refresh

## Test checklist

**Drawing (most important):**
- [ ] Draw 30+ strokes, fast and slow, anywhere on canvas
- [ ] Lines should appear and stay — no disappearing, no popping back
- [ ] Buddy is in fixed position bottom-left (not inside canvas anymore)
- [ ] Drawing in the bottom-left where buddy was — strokes pass through buddy area cleanly

**Auto-redirect:**
- [ ] Sign in once → close tab → reopen the site → should go straight to /app
- [ ] Sign out → /login should show the form

**Signup gate:**
- [ ] Click "I Have an Account" → "New here?" → should see parent/kid choice
- [ ] Pick "I'm a kid" → see friendly redirect message + Go back button
- [ ] Pick "I'm a grown-up" → see normal signup form

**Password gate:**
- [ ] Go to /parent → tap "Start free trial" → password modal appears
- [ ] Wrong password → error message, doesn't proceed
- [ ] Correct password → modal closes, Stripe checkout opens
- [ ] When subscribed: tap "Manage subscription" → password modal appears

## What's NOT changed

- All v18 features: auto-advance lessons, Patrick Moss premium grant, sticker tab auto-scroll, new logo
- All v18b: transparent logo background
- 87 lessons, 18 worlds, 28 buddies, ~489 stickers
- Stripe webhook, friends system, multiplayer, voice notes
- v15/v17 drawing fixes (still in place — v19 adds belt-and-suspenders on top)

## Honest pushback (for the Nth time)

This is the **fourth drawing fix**. v15, v17, v19 were each "definitively the fix" and the previous two weren't. I genuinely think v19 is right because the architecture is now textbook React (memo + stable callbacks + isolation between canvas and animated UI), but I've been wrong about this before.

If drawing breaks AGAIN after deploying v19:
- I cannot keep guessing without seeing the actual broken behavior
- I will need a screen recording (~10 seconds) showing the bug happening
- I will also need confirmation that v19 is what's deployed (browser dev tools → Network tab → look at the JavaScript bundle filename)
- Without these, any further "fix" I attempt is just rolling dice

If drawing works:
- **Stop** asking for changes for a real period (a week of Payton actually using the app)
- The number of changes you've requested in the past few days has dramatically outpaced any sustained use of the app
- Each change is a chance to break something, and we've already seen that play out

## Files changed

| File | What changed |
|---|---|
| `components/DrawingCanvas.tsx` | Wrapped in React.memo |
| `components/PasswordConfirm.tsx` | NEW — password gate modal |
| `app/app/draw/page.tsx` | Stable onStrokeComplete, buddy moved out of canvas wrapper |
| `app/app/lesson/[id]/page.tsx` | Same as draw page |
| `app/login/page.tsx` | Auto-redirect if logged in, parent/kid signup gate |
| `app/parent/page.tsx` | Password gate before checkout/portal |
