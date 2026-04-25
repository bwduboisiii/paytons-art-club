# Payton's Art Club — v17: REAL Drawing Fix 🎨

## The actual bug (and why v15 didn't fully fix it)

I told you v15 was the real fix. It wasn't. v15 fixed PART of it (the duplicate window listeners) but missed a deeper bug. Here's what I finally found:

### The chain of events

1. `onStrokeComplete` in the parent (draw page / lesson page) calls `setBuddyMood('cheering')` after every stroke ends
2. That triggers the parent to re-render
3. `DrawingCanvas` re-renders with new prop references
4. The `redraw` `useCallback` had dependencies on `[width, height, strokes, stickers, referencePaths, ghostPaths, traceMode, selectedStickerIdx]` — so it gets a NEW IDENTITY on every re-render
5. The `scheduleRedraw` `useCallback` (which depends on `redraw`) also gets a new identity on every re-render
6. **The killer**: a pending `requestAnimationFrame` callback queued mid-stroke holds a reference to the OLD `redraw` function with stale state
7. When the rAF fires, it draws using stale state — the in-flight stroke renders incompletely or not at all
8. The next pointermove triggers a fresh scheduleRedraw → stroke "pops back"

### Why I missed this in v15

In v15 I removed the duplicate window event listeners (the obvious bug). But I didn't realize the rAF batching itself had a closure-staleness issue when the parent re-renders during a stroke.

The bug requires **a parent re-render to happen WHILE a stroke is in flight**. Some strokes won't trigger it (if no rAF is pending at the moment of the parent re-render). That's why v15 "kind of worked" and you didn't immediately notice.

In v16b, two things made it worse:
- Companion grew 40% taller → more layout work per Companion render → more re-render time
- The `setBuddyMood` chain creates state cascades that hit during strokes

### Why hard refresh doesn't help

It's not browser cache. It's a real bug in the deployed code. Same bug exists in v15 too — you just hit it less often.

## What v17 actually changes

### 1. `redraw` is now STABLE (no useCallback dependencies)

I added refs that mirror every piece of state `redraw` reads:
- `strokesRef` mirrors `strokes`
- `stickersRef` mirrors `stickers`
- `selectedStickerIdxRef` mirrors `selectedStickerIdx`
- `referencePathsRef` mirrors `referencePaths` prop
- `ghostPathsRef` mirrors `ghostPaths` prop
- `traceModeRef` mirrors `traceMode` prop
- `widthRef` / `heightRef` mirror canvas dimensions

These refs are kept in sync via `useEffect`. The `redraw` function reads everything from these refs instead of from closure-captured props/state.

The result: **`redraw` has a stable identity across all renders**. Any pending rAF callback that fires after a parent re-render still calls a valid `redraw` with the latest state.

### 2. `scheduleRedraw` is also stable

Because `redraw` is stable, `scheduleRedraw` (which depends on it) is also stable.

### 3. FloatingBuddy uses surgical pointer-events

Brought in from the prepared v16c fix. Only the actual avatar circle and the close X button capture pointer events. Speech bubble area, padding, and the sparkle glow are transparent. Kids can draw right under and around the buddy without it stealing strokes.

## How to apply

1. Back up v16b, unzip v17, copy `.git` over
2. `git add . && git commit -m "v17: real drawing fix — stable redraw identity"`
3. `git push`
4. Vercel auto-deploys (~2 min)
5. Hard refresh

## Test these specifically

- [ ] Draw 30+ strokes in a row, fast and slow, anywhere on canvas
- [ ] Lines should ALWAYS appear and stay — no disappearing, no popping back
- [ ] Try drawing immediately after a buddy speech bubble appears (this is when re-renders cluster)
- [ ] Try drawing in the bottom-left where buddy lives — should pass right through
- [ ] Tap buddy avatar → collapses to peek tab
- [ ] Tap peek tab → buddy returns
- [ ] Same on PC and iPad

## What's NOT changed

- Companion full-body avatars from v16b: preserved
- Buddy bottom-left position from v16a: preserved
- Stripe, friends, voice, multiplayer, lessons: all preserved
- Mobile UI, iOS Safari fix: preserved

Two files changed:
- `components/DrawingCanvas.tsx` (added refs, refactored redraw to use them, made redraw stable)
- `components/FloatingBuddy.tsx` (surgical pointer-events)

## Why I'm confident this time

I traced the exact code path that produces "disappear and pop back" with parent re-renders during a stroke. The fix removes the staleness vector. There's no remaining mechanism I can identify that would reproduce the symptom.

If drawing STILL has issues after v17:
1. Take a screen recording
2. Note what device/browser
3. Note what you're doing when it happens (pressure? speed? specific tool?)
4. Try it in incognito mode

But I'm not expecting that to be needed. This should be it.

## What to do next (broken record)

After v17 deploys and drawing works:
- Stop adding features
- Watch Payton play for a week
- Note 2-3 things she actually does or asks for
- Come back with that signal, not feature ideas

You now have a real drawing app. Let her use it.
