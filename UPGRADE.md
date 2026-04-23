# Payton's Art Club — v4 Upgrade

## What's new

### Sticker manipulation (full)
- Tap any sticker to select it — dashed selection box appears
- **Corner handle**: drag to resize (uniform scale)
- **Rotation handle** (line going up top): drag to rotate
- **Two-finger pinch**: resize on touch devices
- **Two-finger twist**: rotate on touch devices
- **Delete button** (🗑 top-left) when a sticker is selected
- **Bring forward** (⬆) to raise sticker layer order
- Tap outside a sticker to deselect

### 15 drawing tools (was 7)
- Draw: marker, pen, pencil, crayon, **paintbrush** (watercolor), **chalk**
- Effect: highlighter, **neon** (glowing), spray, glitter
- Shape: **line**, **rectangle**, **circle** (drag to create)
- Utility: **fill bucket** (tap to flood fill), eraser
- Tool picker is now categorized with dividers so 15 tools don't feel overwhelming

### Color palette — always visible
- Full standard palette (50+ swatches) visible at all times, horizontal scroll on mobile
- Rainbow-circle button on the right opens a native color picker for ANY color
- Organized by color family: reds, oranges, yellows, greens, blues, purples, browns, neutrals, skin tones

### 16 avatars (was 8)
- New: monkey, sloth, octopus, deer, frog, penguin, hedgehog, turtle
- **Tap avatar in home header** → opens picker with all 16 options
- Also offers "Switch to another kid" if multiple kids exist
- Your pick saves to the database — persists across devices

## How to apply

1. **Run `supabase/schema_additions.sql`** (or the safe version I sent earlier — whichever fixes your bucket error)
2. Back up v3, unzip v4, copy `.git` over
3. `git add . && git commit -m "v4: sticker handles, 15 tools, full palette, 16 avatars, tap-to-change-buddy" && git push`
4. Hard refresh (Ctrl+Shift+R) and test

## Test checklist

- [ ] Sticker: tap a sticker, drag corner to resize, drag top-dot to rotate
- [ ] Sticker: two-finger pinch (touch device) resizes
- [ ] Drawing: try all 15 tools — especially fill bucket and line/rectangle/circle
- [ ] Colors: scroll the palette, tap rainbow button, pick custom color
- [ ] Avatar: tap your buddy icon in top-left of home screen → pick new buddy from 16
- [ ] Onboarding a new kid shows all 16 avatar options

## Known rough edges

- **Fill bucket has a ~30 pixel tolerance** so it fills anti-aliased edges. If it bleeds in unexpected ways, undo. Lower tolerance = cleaner fills but leaves ring artifacts.
- **Fill is slow on big empty areas** (scanline flood fill is O(pixels)). Fine in practice for this canvas size.
- **Sticker selection is hidden during PNG export** — if you see the dashed outline flash when you tap Save, that's the selection briefly clearing.
- **Two-finger gestures only work on touch devices.** On desktop, use the corner/rotation handles instead.
