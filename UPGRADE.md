# Payton's Art Club — v18b: Logo Background Removed 🎨

## What changed

Just the logo. The previous logo image had a black background built into the JPEG. v18b replaces it with a true PNG that has a transparent background, so the logo now floats cleanly against the cream-colored page background instead of sitting in a black square.

All favicons regenerated from the transparent logo too:
- `public/logo.png` (now PNG with RGBA, was JPEG with black background)
- `public/favicon.ico`
- `public/favicon-32.png`
- `public/icon-192.png`
- `public/icon-512.png`
- `public/apple-touch-icon.png`

No code changes. Six image files swapped.

## How to apply

1. Back up v18, unzip v18b, copy `.git` over
2. `git add . && git commit -m "v18b: transparent logo background"`
3. `git push`
4. **Hard refresh** — browsers aggressively cache favicons. On iPad, you may need to remove the home-screen icon and re-add it to see the new transparent version.

## Test

- Landing page: logo appears as a clean circle on cream background, no black box
- Header on all pages: small logo also clean
- Browser tab favicon: should show the logo without any black background
- iPad home screen (after re-adding): icon should be the transparent logo

## What's the same as v18

Everything else — auto-advance lessons, Patrick Moss premium grant, bigger buddy, anchored buddy inside canvas, sticker tab auto-scroll. Nothing else changed.
