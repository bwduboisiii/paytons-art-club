# Payton's Art Club — v5 Upgrade (Layout Redesign)

## What's new in this version

### 🎨 Two-sidebar layout
- **Left sidebar (narrow, 76px)**: All 15 tools stacked vertically, grouped by category (Draw / Effects / Shapes / Tools) with subtle dividers
- **Right sidebar (narrow, 76px)**: Full color palette (50+ colors) stacked vertically, **scrollable**
- **Center**: Canvas fills the remaining space, auto-sized to keep a nice 4:3 ratio
- **Top**: Title + Save button
- **Bottom**: Brush sizer, undo, clear, stickers button

Before: all tools/colors crammed at the bottom, colors cut off past the right edge
After: every tool and color is visible (or scrollable) without the canvas shrinking

### Lesson page too
- Same two-sidebar layout applied to lessons
- Step instructions still show at the top
- Progress dots still appear below the step banner
- During "Add stickers" remix phase, the stickers button stays in the bottom row

### What stayed the same
- 15 drawing tools
- Sticker tap-select with corner/rotation handles and two-finger pinch
- 16 companion avatars
- Tap-avatar-to-change-buddy modal
- Daily lesson, tier system, 8 worlds, 31 lessons

## How to apply

1. Back up v4 folder, unzip v5, copy `.git` over
2. No new SQL this time — database schema is unchanged
3. `git add . && git commit -m "v5: two-sidebar layout, full palette always visible" && git push`
4. Hard refresh live site

## Test checklist

- [ ] Free Draw: left sidebar has 15 tools in 4 categorized groups
- [ ] Free Draw: right sidebar scrolls through all 50+ colors
- [ ] Free Draw: rainbow color-picker button at bottom of color column still opens custom picker
- [ ] Lesson: same layout works, step instructions visible at top
- [ ] On smaller screens: canvas shrinks proportionally, sidebars stay narrow
- [ ] On iPad landscape: plenty of canvas room, all tools tappable with thumb

## Known rough edges

- **iPad portrait orientation**: with two 76px sidebars + buddy on the right, the canvas ends up ~600×450. That's fine but not huge. Landscape is much better.
- **Super narrow phones (<500px wide)**: might feel tight. Not designed for phone-size use primarily.
- **Color sidebar scrolling**: I used `overflow-y-auto` which should work on touch, but if it doesn't scroll smoothly on iPad, let me know — there's a fallback I can add.
