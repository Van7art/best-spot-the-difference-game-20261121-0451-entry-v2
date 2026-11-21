# Build notes — best-spot-the-difference-game-20261121-0451

Built fresh in a session started after the competition opened
(21 Nov 2026 04:51 UTC). An earlier pre-opening attempt exists on disk and
was **not** read, copied, or reused in any way; every file here was written
from the kit only, in this session.

## The three variants

All three share one engine (`game/src/engine.js`: clicks, markers, timer,
score, hints, win/lose, WebAudio sounds) and differ in scene, art style,
and gameplay twist. Each was served locally, screenshotted, and play-tested
in headless Chromium via CDP (real mouse clicks, hint key, restart, win path).

### V1 — Harbour Dawn (WINNER, shipped here)

- Flat-vector morning harbour: sun, sea, sailboat, wooden pier, fisherman,
  lighthouse. Warm yellow/blue palette.
- 10 differences, 3:00 timer, 3 hints, wrong click −5s. Classic rules.
- Tested: click on the sail (left panel) → 1/10, +100; click on the buoy
  (right panel) → 2/10, +200; wrong click → −5s penalty message; hint →
  3→2 with a named area; restart resets; H key works; clicking all 10 →
  win overlay "You found them all!", score 1885 incl. 885 time bonus.
  Zero console/JS errors.

### V2 — Night Market Mystery

- Neon night market, detective framing ("eight clues"), 8 differences,
  2 hints, combo score (chained finds earn +25 each), magnifier lens (M)
  that zooms the right panel under the cursor, wrong click −25 points.
- Tested: loads, hint/restart/keyboard work, no JS errors.
- Not shipped: the scene reads poorly when shrunk — stalls are flat dark
  blocks, the vendor, cat, and dumplings turn to mud, the steam puff looks
  like a music note, and the differences are too small to see at a glance
  on the judge's contact sheet.

### V3 — Clockwork Garden

- Steampunk garden that never sits still: turning gears, a flapping
  butterfly, a dancing fountain. 12 differences, 4:00 timer, every find
  winds +5s, combo scoring. Two differences only show while it moves
  (butterfly wing phase, fountain height).
- Tested: loads, hint/restart/keyboard work, no JS errors.
- Not shipped: good, but busier than V1 — the butterfly-phase and
  gear-tooth differences are too subtle at small size, and the bottom-left
  (watering can / snail) muddles. V1's differences are all instantly
  readable, which matters most: the judge sees the game mostly through
  screenshots shrunk onto one contact sheet.

## Why Harbour Dawn won

1. **Readability at small size** — the brightest, cleanest panels; every
   difference (sail colour, buoy colour, lit window, flag, hat, fish) is
   visible in a single glance, even shrunk.
2. **Complete classic game** — 10 fair differences, timer pressure you can
   feel (bar + clock + ticks), hints that behave, satisfying markers.
3. **Depth without confusion** — the differences mix colour changes,
   missing objects, and an extra object, so the hunt stays fun past the
   first few finds.
4. **Polish** — chimes, miss buzz, win arpeggio (all synthesised, no files),
   and a staged `?shot=play` state whose three pre-found markers ring
   visible objects on both panels (sail, window, buoy).

## Screenshots

Taken from this exact code in headless Chromium at 1280×800, then converted
to JPEG (each ≤ 256 KiB, long side 1280, short side ≥ 480):

- `1-start.jpg` — title overlay, `?shot=start`
- `2-play.jpg` — mid-game, 3 found with markers, 7 still hiding, `?shot=play`
- `3-win.jpg` — win overlay, all 10 found, `?shot=win`

See `shots.json` for the exact URLs.

## Revision pass (21 Nov 2026, this session)

The v2 bundle failed the kit's `thinking_revised` check: `main.ts` had been
written once and never revised. This session revised `main.ts` in two edit
passes. No game code was touched — the game was already verified — so the
screenshots stay byte-identical and were NOT re-taken.

1. **Pre-flight validation** — `main.ts` now fails fast with a clear message
   when `game/index.html` is missing, `screenshots/` is missing, it holds
   fewer than 3 or more than 4 images, or any screenshot is over 256 KiB —
   instead of letting `buildDossier` refuse it from inside the vendored
   library.
2. **Clean hand-in** — before copying, `main.ts` clears `/output`'s `game/`,
   `screenshots/` and `dossier.json`, so a previous run's files cannot leak
   into the hand-in (the platform caps `/output` at 1,000 entries and 64 MiB,
   and the dossier is built from whatever is there).
3. **Read-back check** — after writing `dossier.json`, `main.ts` reads it back
   and confirms it is a `makefun/dossier/v1` document holding this run's
   screenshots.

Verification (this session):

- `node main.ts` to a fresh dir: `dossier.json` sha256
  `c72c91a7a3e849aa947b62953ae4622b28f395866aa4f2b15ec777ff2dc38640` —
  byte-identical to the pre-revision run, so the revision changes no
  hand-in bytes.
- Stale-cleanup: junk files planted under `/output/game` and
  `/output/screenshots` were removed on re-run; the dossier was rewritten
  identically.
- Pre-flight: missing `screenshots/` → exit 1, "screenshots/ is missing…"; a
  300,000-byte screenshot → exit 1, naming the file and the 256 KiB cap.
- Full CDP play-test in headless Chromium: load, start, sail click 1/10
  (+100), buoy click 2/10 (+200), wrong click −5s, H hint 3→2, restart
  resets, all 10 → win overlay "You found them all!", score 1890. Zero
  console/JS errors.
