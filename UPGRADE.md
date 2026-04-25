# Payton's Art Club — v15: Real Drawing Fix ✏️

## What's fixed

**The bug**: Lines didn't follow finger/mouse accurately. Drawing would appear, then disappear, then pop back. Affected ALL tools, on ALL devices (iPad, PC mouse, etc).

**The root cause** (the part I got wrong in v12-v14):

In v12 I added window-level pointer event listeners thinking it would "rescue" pointer capture if iOS Safari yanked it. But the canvas already had React's `onPointerMove` handler attached — so EVERY pointer move fired TWICE:

1. React handler fires → adds points → calls redraw → line appears
2. Same event fires window listener → adds duplicate points → calls redraw AGAIN → race condition

That race condition is what caused "drawing then disappearing then popping back." The bug was in v12, not iOS — but I incorrectly diagnosed it as iOS-specific because that's what your daughter's device was. Mouse on PC had the same bug all along, just less obvious because mouse events fire at consistent rates.

## What v15 actually changes

### 1. Removed window-level pointer listeners entirely

The whole `useEffect` that registered `window.addEventListener('pointermove', ...)` and friends is **gone**. We use only React's `onPointerMove` handler now, which fires once per event.

### 2. Use `setPointerCapture` properly

This is the browser's native solution to "finger leaves canvas mid-stroke." When called on `pointerdown`, all subsequent pointer events for that pointerId route to the canvas regardless of where the finger/cursor goes. Works on Chrome, Safari (desktop and iOS), Firefox, Edge. Already in the code — we just stopped fighting it with window listeners.

### 3. Added rAF-batched redraws (`scheduleRedraw`)

Multiple pointer moves in a single animation frame now coalesce into ONE redraw instead of N. This eliminates flicker when the user moves fast and prevents the "draws then redraws then redraws" cascade.

### 4. Cleaner stroke point collection

The new `addPointsFromPointerEvent` function:
- Uses `getCoalescedEvents()` to recover sub-frame points (smooth lines)
- Reads coordinates from each coalesced event individually (accurate positioning)
- Has no `useCallback` dependency churn (was causing re-registrations in v12)

### 5. Fixed stroke endings

`pointerup` correctly ends the stroke and adds it to the saved strokes array. `pointercancel` no longer kills the stroke for single touches (it only fired in v12 because the window listener was triggering it spuriously).

## How to apply

### No SQL. Just code.

1. Back up v14b folder, unzip v15, copy `.git` over
2. `git add . && git commit -m "v15: real drawing fix — remove buggy duplicate event handling"`
3. `git push`
4. Vercel auto-deploys (~2 minutes — only one file changed)
5. **Hard refresh on every device**. Important: Browser caches the old broken JavaScript. On iPad, close and reopen Safari. On PC, Ctrl+F5 or Cmd+Shift+R.

## Test these on PC (mouse) and iPad (finger)

The same tests should pass on both:

- [ ] **Slow line**: draw a slow continuous curve. Should follow cursor/finger smoothly, no gaps, no popping.
- [ ] **Fast line**: scribble back and forth quickly. Should be smooth without breaks or duplicate ghost lines.
- [ ] **Long stroke off-canvas**: start drawing inside canvas, move cursor/finger OUTSIDE canvas, come back. The stroke should continue uninterrupted (setPointerCapture handles this).
- [ ] **Tool switching**: change tools mid-drawing-session. Each new stroke should work cleanly.
- [ ] **Color switching**: change colors. Strokes should use the new color.
- [ ] **Stickers**: add/move/resize a sticker. Should still work (didn't touch sticker logic).
- [ ] **Eraser**: works without breaks.
- [ ] **All 15 tools**: marker, pen, pencil, crayon, paintbrush, chalk, highlighter, neon, spray, glitter, line, rectangle, circle, fill bucket, eraser.

## Why I'm confident this time

In v12 I was patching symptoms. I added window listeners hoping they'd "catch" missed events. Instead they caused duplicate processing.

In v15 I went the opposite direction: **fewer event handlers, simpler flow**. One handler per event. No duplicates possible. rAF batching prevents redraw thrashing.

This is the standard pattern for canvas drawing apps. It's what real drawing apps (Excalidraw, tldraw, Figma) use. The v12 approach was clever and wrong.

## What's NOT changed

- Sticker drag/resize/rotate logic: untouched
- Multiplayer canvas: untouched (it doesn't use the buggy v12 code)
- Drawing tools, palette, brush size, undo: same
- All 87 lessons, 18 worlds, 28 avatars, ~489 stickers: same
- Stripe subscription, Friends, Voice notes, Gallery: same
- Mobile UI from v11: same
- Logo and favicons from v13: same
- iOS touch gesture prevention (touchstart preventDefault on wrapper): kept

Only the broken pointer-handler logic in DrawingCanvas.tsx changed. One file. ~45 lines removed, ~50 lines added (net cleaner).

## If lines STILL break after v15

If after deploying v15 you still see drawing issues, send me the precise repro:

1. Which device (PC mouse / iPad / iPhone)?
2. Which tool?
3. What motion?
4. What does it look like (slow video or screen recording would be best)?

Anything left would be a different bug than what v12 caused. The "draws then disappears then pops back" pattern is specifically the duplicate-handler bug, and that's gone now.

## What to do next

After v15 is deployed and confirmed working:

1. **Stop adding features.** Watch Payton actually use the app for a week.
2. **Note what she does and doesn't engage with** — which avatars, which lessons, which worlds.
3. **Come back with specific observations**, not feature requests. Something like "she finished 8 lessons in Critter Cove but didn't open Bug Buddies" tells us more than "add more stickers."

The product is real and complete. The drawing engine should now be reliable. Use signal beats speculation.
