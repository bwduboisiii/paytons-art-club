# Payton's Art Club — v14a: Free Worlds Expansion 🌍

## What's new in v14a

### 🌍 9 free worlds (was 4)

5 new free worlds added:
- 🐶 **Pet Parade** — cuddly pets (puppy, cat, fish, hamster) — 4 lessons
- 🌈 **Weather Wonders** — sun, cloud, rainbow, snowflake — 4 lessons
- 🐝 **Bug Buddies** — friendly insects (bee, ladybug, butterfly, snail) — 4 lessons
- ⭐ **Shape Shop** — basic shapes turned cute (square, triangle, star, heart) — 4 lessons
- 🌷 **Garden Patch** — plants & nature (daisy, apple tree, pumpkin, mushroom house) — 4 lessons

That's **20 brand new always-available lessons** in addition to what kids already had.

### 🎲 Hidden daily-rotation pool (16 new lessons)

Per your request — the daily lesson now pulls from a HIDDEN pool of bonus lessons that aren't shown in any world's lesson list. They only appear as "today's special drawing." 4 hidden lessons per existing free world:

- **Critter Cove rotation pool**: Sleepy Sloth, Hedgehog Hugs, Penguin Pal, Foxy Friend
- **Sparkle Kingdom rotation pool**: Magic Wand, Tiny Castle, Crown Jewel, Princess Bow
- **Star Hop rotation pool**: Friendly Alien, Astronaut Helmet, Saturn Spin, UFO
- **Mermaid Lagoon rotation pool**: Seashell, Friendly Octopus, Treasure Chest, Coral Reef

Plus all 20 of the new world lessons are also in the daily pool.

**Total daily pool: 36 lessons.** A different one is featured each calendar day. Kids can browse 36+ days before any daily lesson repeats.

### 📊 Total lesson count

- **Before v14a**: 31 lessons across 8 worlds
- **After v14a**: 67 lessons across 13 worlds (9 free + 4 premium still)
- **Daily pool**: 36 unique lessons (was 19)

---

## How to apply

### No SQL. Just code.

1. Back up v13, unzip v14a, copy `.git` over
2. `git add . && git commit -m "v14a: 5 new free worlds + hidden rotation pool"`
3. `git push`
4. Vercel auto-deploys (~2 minutes — bigger than usual because of 36 new JSON files)
5. Hard refresh on every device

### Test on iPad

- [ ] Home screen shows the new "Today's Special" lesson if applicable
- [ ] Tap "Play Game" / world list — see 9 free worlds (was 4)
- [ ] Tap each new world — verify 4 lessons listed
- [ ] Try Pet Parade → Buddy the Puppy — drawing works
- [ ] Try Shape Shop → Mr. Square — simple shape lesson works
- [ ] Premium worlds still locked behind paywall (Dino Land, Fairy Garden, Food Friends, Vehicle Village)

### Test desktop

Same checks. New worlds should grid out cleanly on the world picker.

---

## What's NOT changed

- v13 logo + 28 avatars + ~489 stickers: preserved
- v12 iOS Safari drawing fix: preserved
- v11 mobile UI: preserved
- v10 Stripe / subscription: preserved (premium worlds still locked behind paywall)
- Existing 31 lessons: unchanged
- Database schema: unchanged

---

## Honest caveats

- **The new lessons are simpler than the original 31.** I generated them programmatically from a template to ship 36 in one pass. They follow the same step-by-step trace pattern, but the SVG paths are less hand-tuned. Drawings will be cute but not as polished as some of the original lessons.
- **Reference path positioning may need eyeballing.** I used standard 800x600 canvas coordinates. If any lesson's reference paths sit off-center on iPad's actual canvas, it'll be a small visual shift, not a broken lesson.
- **The daily rotation pool is now bigger but functionally the same.** The selection is still deterministic by UTC date. If you want the daily lesson to feel "different" from before (e.g., highlight it as "today's surprise!"), that's a UI change for a future pass.

---

## Coming next: v14b (premium worlds)

Per your plan, v14b will add 5 premium worlds (Sea Adventure, Robot Workshop, Bakery Sweets, Toy Box, Holiday Magic) with ~20 new lessons. Premium count goes 4 → 9.

Tell me when you've deployed v14a and I'll start v14b.

---

## Summary numbers

| Thing | Before | After |
|---|---|---|
| Free worlds | 4 | 9 |
| Premium worlds | 4 | 4 |
| Total lessons | 31 | 67 |
| Daily rotation pool | 19 | 36 |
| Free lessons always available | 19 | 39 |
