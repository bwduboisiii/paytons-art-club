# Payton's Art Club — v16b: Full-Body Avatars 🐰🦊🐼

## What changed

All 28 buddy avatars are now **full-body characters** instead of face-only.

Each avatar now has:
- Head with face details (eyes, nose, mouth, ears) — same expressive faces as before
- Body / torso (with chest patches where appropriate)
- Arms (positioned naturally at sides)
- Legs / feet (or tail for sea creatures)
- Character-specific extras (bunny cottontail, fox bushy tail, panda chest band, dragon spikes, mermaid tail, etc.)

The viewBox changed from 100×100 to 100×140 (taller for body+legs proportions).
Companion auto-renders at 1.4× the height of the size prop.

### What was actually done

- **16 of 28 avatars REWRITTEN from face-only to full-body** (the originals from v1-v8): bunny, kitty, fox, owl, panda, bear, unicorn, dragon, monkey, sloth, octopus, deer, frog, penguin, hedgehog, turtle
- **12 of 28 avatars KEPT as-is** (the v13 additions were already designed full-body): dog, husky, poodle, hamster, koala, lion, tiger, zebra, giraffe, butterfly, bee, mermaid

So I only had to redraw 16 — the rest were already in this format. Lucky break.

### Layout adjustments

- `FloatingBuddy`'s circular background changed to a soft rounded rectangle (the new avatars no longer fit nicely in a circle)
- Collapsed peek tab is now slightly taller to accommodate the standing pose
- BuddyChangeModal grid auto-grows to fit (no manual change needed — flex layout)

## Files changed

Two files:
1. `components/Companion.tsx` — all 28 avatar SVG renderers, viewBox change
2. `components/FloatingBuddy.tsx` — wrapper styling for taller buddy

## How to apply

1. Back up v16a (or v15 if you skipped v16a), unzip v16b, copy `.git` over
2. `git add . && git commit -m "v16b: full-body avatars"`
3. `git push`
4. Hard refresh on every device

## Test these

- [ ] Open Free Draw → buddy in bottom-left now shows full body (head + body + legs)
- [ ] Tap "Change Buddy" → grid of 28 — every one is full-body
- [ ] Pick a few different ones and verify they each look right
- [ ] Open a lesson → reward screen shows large full-body buddy
- [ ] Check Friends list → friend avatars now full-body
- [ ] Open kid switcher (if you have multiple kids) → kid avatars full-body
- [ ] Mobile: home page shows kid's full-body avatar in welcome row

## Honest caveats

- **The 16 redrawn avatars look stiff and template-like.** I told you this would be the case — I'm an AI generating SVG by hand, not a children's book illustrator. The characters are recognizable and consistent, but they're geometric primitives stacked together, not expressive hand-drawn art.
- **The 12 v13 avatars are slightly more polished** because I had more focused attention on them when they were originally created. There's a visible quality variation across the 28.
- **All 28 are stiff in animation.** The mood animations (idle, happy, cheering, thinking) just bob/wiggle the whole figure. There's no articulated movement (arms don't wave independently of body).
- **They take more screen space.** Avatar containers are now 40% taller. On crowded mobile screens this may feel like more visual weight.

## What's NOT changed

Everything else:
- v15 drawing fix: preserved
- v16a buddy bottom-left positioning: preserved
- All 87 lessons across 18 worlds
- Stripe subscription, Friends, Voice notes
- Mobile UI, iOS Safari fix
- Logo, favicons, stickers

Only the avatar art changed.

## What I'd suggest next

Watch Payton react to the new avatars for a few sessions. If she says "make them cuter" or "the bunny doesn't look right" — that's actionable feedback I can act on (focused per-avatar fixes). If she doesn't say anything about them, that means they're good enough — move on.

If after using v16b you decide the full-body look is worse than face-only, the v15 zip still has the old face avatars and you can roll back by re-deploying that.
