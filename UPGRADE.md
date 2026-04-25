# Payton's Art Club — v13: Logo + Content Pack 🎨

## What's new

### 🎨 New logo wired throughout the app

The painter's-palette-with-brush logo you uploaded is now the official brand mark:

- **Landing page**: shows large in the hero on desktop, prominently on mobile
- **Login page**: replaces the old emoji-and-text header with the logo
- **Browser tab favicon**: 32x32 ICO + PNG
- **iOS "Add to Home Screen"**: 180x180 apple-touch-icon
- **Android PWA icon**: 192 + 512 PNG sizes
- **Home screen** (after kid sign-in): unchanged — still focused on the kid's name + buddy. (The home page is for Payton, not for marketing the brand to her.)

### 🐾 12 new companion avatars (16 → 28)

Payton can now choose between **28 different buddies**:

Original 16: Bunny (Hoppy), Kitty (Whiskers), Fox (Rusty), Owl (Hoot), Panda (Bamboo), Bear (Honey), Unicorn (Sparkle), Dragon (Ember), Monkey (Banana), Sloth (Snooze), Octopus (Inky), Deer (Clover), Frog (Lily), Penguin (Waddle), Hedgehog (Spike), Turtle (Shelly).

**New in v13:**
- 🐶 **Dog (Buddy)** — friendly cartoon dog with floppy ears and tongue
- 🐺 **Husky (Storm)** — striking blue eyes and white face mask
- 🐩 **Poodle (Pearl)** — fluffy crown with a red bow
- 🐹 **Hamster (Nibbles)** — chubby cheeks and tummy
- 🐨 **Koala (Eucalyptus)** — big fluffy ears and black nose
- 🦁 **Lion (Roar)** — full golden mane around face
- 🐯 **Tiger (Stripes)** — orange with green eyes and bold stripes
- 🦓 **Zebra (Dash)** — black-and-white stripes plus mane tufts
- 🦒 **Giraffe (Tally)** — long face with ossicones and spots, big eyelashes
- 🦋 **Butterfly (Flutter)** — pink wings with yellow spots
- 🐝 **Bee (Buzz)** — yellow body with translucent wings
- 🧜 **Mermaid (Coral)** — red hair, green tail, shell hairclip

All avatars are hand-drawn SVG and animate with the same personality types (idle, happy, cheering, thinking) as the originals.

### ✨ Sticker library massively expanded (~144 → ~489)

The sticker tray (used on Free Draw and on Remix at the end of every lesson) now has:

**6 expanded categories:**
- **Animals** — added farm animals (cow, pig, sheep, etc.), birds (ducks, chicks, owls), and sea creatures (octopus, shark, crab, whale)
- **Nature** — added all weather types (rain, snow, thunder, fog), landscapes (mountains, beaches, volcanoes), and more plants
- **Food** — added more sweets (pudding, pretzel, waffle), all fruits (cherry, peach, mango, kiwi, pineapple), full meals (sushi, ramen, pasta, soup), and drinks
- **Magic** — added princesses, wizards, castles, magic items, costumes
- **Space** — added astronauts, robots, science instruments
- **Faces** — added 30+ more expressions

**3 brand-new categories:**
- **💯 Emoji** — dedicated category for hearts (all colors), hand gestures, and reaction symbols
- **🎉 Fun** — sports, music instruments, party/celebration emoji
- **🚗 Places** — vehicles (cars, planes, boats, trains) and buildings/landmarks

---

## How to apply

### No SQL. Just code.

1. Back up v12, unzip v13, copy `.git` over
2. `git add . && git commit -m "v13: new logo + 12 avatars + expanded sticker library" && git push`
3. Vercel auto-deploys (~2 min). The deploy is bigger than usual because of the favicon image files — should still be quick.
4. Hard refresh on every device

### Test on iPad

- [ ] Browser tab shows the new logo as favicon (instead of generic page icon)
- [ ] Visit landing page (signed out) — see the big logo
- [ ] Sign out and visit login — logo at top
- [ ] On home → tap your buddy → "Switch buddy" → scroll through — see all 28 avatars (your existing buddy at top)
- [ ] Pick one of the new ones (try the dog!)
- [ ] Open Free Draw → tap stickers → see 9 categories at the bottom
- [ ] Tap each category → scroll through new options
- [ ] Add a few new stickers to a drawing → resize/rotate them like before

### Test on desktop

Same checks as iPad. The logo should appear in the nav and hero sections.

---

## What I didn't change

- Database / schema / Stripe / webhooks: untouched
- Drawing fix from v12 (iOS Safari pointer resilience): preserved
- Mobile UI from v11: preserved
- Lesson content: same 31 lessons across 8 worlds

---

## Honest caveats

- **The avatar SVGs are hand-drawn by me, not by an illustrator.** They follow the same simple-cartoon style as the existing 16 (geometric shapes, friendly faces) but each one is just my best approximation. If any specific one looks off, tell me which and I'll iterate.
- **Some emoji stickers may render differently on different devices.** That's because emoji rendering is OS-controlled. iOS shows Apple-style emoji, Android shows Google-style, etc. Same set of stickers, different visual flavor per device. This is normal and unavoidable.
- **The `🧜‍♀️` original mermaid sticker (in Magic category)** stays as the emoji version. The new `mermaid` AVATAR is the hand-drawn SVG with red hair and green tail. Two different things — the emoji is for adding to drawings, the avatar is the buddy.

---

## What's still pending from your original batch

Your message asked for: more stickers ✅, emojis ✅, more animals ✅, more avatar options including dog ✅, drawing fix ✅ (was v12).

**Everything you asked for is now done.**

Send testing feedback when you've had a chance to deploy. If specific avatars or stickers need adjustment, tell me which and I'll iterate in a focused fix pass.
