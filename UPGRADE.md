# Payton's Art Club — v19b: Buddy Position Tweak 🐰

## What changed

**One line of CSS, one file changed.** The buddy's left position shifted from `left-4` (16px from edge) to `left-28` on desktop (112px from edge) so it sits just past the 76px-wide left toolbar instead of overlapping it.

On mobile (no left toolbar) the position is unchanged — still close to the left edge.

## Files changed

`components/FloatingBuddy.tsx` — two className strings updated. That's it.

## What I deliberately did NOT do

You may have wondered why I didn't make the buddy track the canvas dynamically (so it sits in the canvas corner regardless of layout). I wrote that version and threw it away. The reason:

Dynamic position-tracking required a `setInterval` calling `setAnchorPos` (state setter) every 500ms to handle layout changes. That setState would re-render FloatingBuddy continuously, and those re-renders could cascade through the parent component and re-introduce the mid-stroke render race we just spent four iterations fixing.

The static-offset approach has zero re-render cost. Drawing stays safe.

## How to apply

1. Back up v19, unzip v19b, copy `.git` over
2. `git add . && git commit -m "v19b: buddy position past left toolbar"`
3. `git push`
4. Hard refresh

## What this does NOT fix

- Buddy may still slightly overlap the canvas's bottom-left corner (because the canvas is centered in the remaining viewport space, not flush against the toolbar). This is unavoidable without dynamic tracking.
- On very small desktop windows or unusual zoom levels, the buddy might still touch the toolbar. The fix is sized for typical iPad/desktop widths.
- On mobile the buddy is unchanged — there's no left toolbar to clear.

If the position still bothers you after testing, options:
1. Live with it — it's no longer overlapping the toolbar in normal use
2. Hide the buddy on the drawing screens entirely (one-line change)
3. Try the dynamic positioning version, accepting the drawing-bug risk

## Everything else from v19

All the other v19 fixes are preserved:
- React.memo on DrawingCanvas
- Stable useCallback for onStrokeComplete
- No setBuddyMood during strokes
- Buddy outside canvas DOM tree
- Auto-redirect when logged in (Remember Me)
- Parent/Kid signup gate
- Password gate before billing actions
- All 87 lessons, 18 worlds, 28 buddies, ~489 stickers
- Patrick Moss premium grant
- New transparent logo

## My (last) suggestion

Deploy v19b. **Stop iterating.** Let Payton actually use the app for a real period.

We've gone v15 → v16a → v16b → v16c (skipped) → v17 → v18 → v18b → v19 → v19b. That's eight builds in a few days, with two drawing regressions in the middle. Each change is risk. The signal you need most isn't more changes — it's watching what actually works for Payton in sustained use.
