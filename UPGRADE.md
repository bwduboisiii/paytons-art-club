# Payton's Art Club — v5.1 (Buddy Fix)

## What's new

### The buddy no longer blocks the colors
- On drawing & lesson pages, the buddy starts **collapsed** (peek tab on the right edge)
- When expanded, the buddy sits **past the color sidebar** (not on top of it)
- Tap the peek tab anytime to see buddy + speech bubble
- Tap the × to go back to peek mode

### The rest of v5 still applies
Two-sidebar layout from v5 is intact: tools on left, colors on right, canvas center. This is a small fix on top of that.

## Why collapsed by default on drawing screens?

Because when you're actively drawing, every pixel of the canvas matters. A big buddy on the side of the screen is cute for 10 seconds, then it's in the way. Starting collapsed gives you maximum canvas. One tap brings buddy back when you want encouragement.

On the lesson page, if the lesson step has a specific companion line to say (e.g. "Now draw the ears!"), the buddy stays expanded so the line is visible. For generic encouragement, buddy peeks.

## How to apply

1. Unzip v5.1, swap folders, keep `.git`
2. No SQL changes needed
3. `git add . && git commit -m "v5.1: buddy doesn't block colors" && git push`
4. Hard refresh

## Test

- [ ] Go to Free Draw — buddy should be a small coral tab on the far right edge
- [ ] Tap the tab — buddy expands with speech bubble
- [ ] Verify the expanded buddy sits LEFT of the color sidebar, not over it
- [ ] Tap × on expanded buddy — back to peek
- [ ] Start a lesson — during steps, buddy is expanded showing the lesson's line
- [ ] On home screen and gallery — buddy doesn't appear (never did, no change there)
