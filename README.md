# Pip's bedroom

The homepage of **Pip the Skull Baby**, Junior Dream Engineer at the Midnight Nursery.
*"I build the dreams you fall asleep inside."*

**Visit Pip's bedroom: [pip-the-skull-baby.netlify.app](https://pip-the-skull-baby.netlify.app)**

Built for **Baby's First Website** at [haX.baby](https://hax.baby) (Track 1: Pip).

The whole site is Pip's nursery at night. You scroll through the story of the night the crickets went on holiday, then play with the five things Pip built to fill the quiet.

## What's in the room

- **Pip himself**: a hand-drawn SVG Pip whose eyes follow your cursor (or your last tap). He giggles when you poke him, gets sleepy when the big light goes off, and fidgets if you go quiet for too long.
- **The story** in seven scroll-driven scenes: a hum that turns into a baby, the crickets leaving for the seaside, rattles and blocks, the music box, lamps for the dark bits, the long way round the weathervane, and what everybody sounds like asleep.
- **Five playable projects**:
  1. **The Lullaby Lab**: a music box you wind with the gold key. It makes up a new phrase every time (real Web Audio, never the same phrase twice in a row) and has a "How sleepy?" tempo.
  2. **Nightlight Collection**: six lamps that throw their own shapes on the wall.
  3. **Dream Delivery Routes**: a crayon map of Lantern Lane. Drop dreams down the chimneys.
  4. **Rattle & Block Toys**: stack the note blocks in colour order and they play a tune.
  6. **Pip's Growth Chart**: he hasn't grown, so he draws his marks sideways. You can add your own.
- **A 3D Pip head** you can drag to spin.
- **The switches**: sound (off until you click anything, and remembered), the big light (day and night, with the new palette spreading from the switch), and chaos mode (it's 1999 in here).
- **The dream-wish jar** (a live guestbook) and a **baby-monitor hit counter**.
- A sparkle trail, a webring, and something that happens on Tuesdays.

Everything works with a keyboard, respects reduced motion and fits phones from 360 px up.

## Run it locally

You need Node 20 or newer.

```bash
npm install
npm run dev        # http://127.0.0.1:5173
```

The dev server serves `public/` and the `/api` routes, and keeps guestbook and counter data in `.data/`.

## Tests

```bash
npm test           # API and server tests (node:test)
npm run e2e        # clicks through the whole site in a browser at 360, 768 and 1280 px
```

The browser test needs Python 3 with Playwright (`pip install playwright`, then `playwright install chromium`). It fails on any console error or warning.

## Deploy

The site is set up for Netlify: `public/` is published as is (no build step), and `netlify/functions/api.mjs` runs the same API handler as the dev server, storing wishes and the hit count in Netlify Blobs.

## How it's built

- Plain HTML, CSS and JavaScript modules. No framework and no build step.
- `public/js/scenes/`: one module per story scene, each driven by scroll progress.
- `public/js/`: Pip, the audio engine, the music box, the toys and the projects. Story and projects share the same toys.
- `server/`: one small API (`/api/guestbook`, `/api/hits`) used by both the dev server and the Netlify Function.
- Every sound is synthesised with the Web Audio API. There are no audio files.

## Credits

- Pip character and art: the official haX.baby Track 1 asset pack.
- Fonts: [Fredoka](https://fonts.google.com/specimen/Fredoka), [Manrope](https://fonts.google.com/specimen/Manrope) and [Patrick Hand](https://fonts.google.com/specimen/Patrick+Hand) from Google Fonts, with Georgia for the story.
- Libraries: [Motion](https://motion.dev), [Zdog](https://zzz.dog) and [canvas-confetti](https://github.com/catdad/canvas-confetti).
- Scenery, toys and sounds are hand-made in SVG, CSS and Web Audio.
