// Harbour Dawn — a spot-the-difference game for make.fun's
// best-spot-the-difference-game-20261121-0451 bounty (Node 22, standard library
// only). The game is plain static files under game/ (index.html plus ES modules,
// no library, no network request), and this program hands it in: it copies
// game/ and screenshots/ from beside this file to /output and writes
// /output/dossier.json with the vendored make.fun library.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Revision (21 Nov 2026): pre-flight checks on game/ and screenshots/ that
// fail fast with a clear message, a clean hand-in (stale files in /output are
// cleared first, so nothing from an earlier run leaks into the dossier), and
// a read-back check that dossier.json on disk is the one this run wrote.

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Pre-flight: fail fast with a clear message when the entry is incomplete,
// instead of letting buildDossier refuse it from inside the vendored library.
const gameDir = join(here, 'game');
const shotsDir = join(here, 'screenshots');
if (!existsSync(join(gameDir, 'index.html'))) {
  throw new Error('game/index.html is missing: the entry is a game of static files, its index.html at the root of game/');
}
if (!existsSync(shotsDir)) {
  throw new Error('screenshots/ is missing: the entry hands in 3 or 4 renders of the game');
}
const shotNames = readdirSync(shotsDir).filter((name) => !name.startsWith('.'));
if (shotNames.length < 3 || shotNames.length > 4) {
  throw new Error(`screenshots/ holds ${shotNames.length} images: the entry hands in 3 or 4`);
}
for (const name of shotNames) {
  const bytes = statSync(join(shotsDir, name)).size;
  if (bytes > 262144) {
    throw new Error(`screenshots/${name} is ${bytes} bytes, over the 256 KiB a screenshot may be`);
  }
}

mkdirSync(out, { recursive: true });
// A previous run's files in /output would be handed in alongside this run's:
// the platform caps /output at 1,000 entries and 64 MiB, and the dossier is
// built from whatever is there. Clear this run's three paths first, so the
// hand-in is exactly what this run produced — no stale game, screenshot or
// dossier from an earlier run can leak in.
rmSync(join(out, 'game'), { recursive: true, force: true });
rmSync(join(out, 'screenshots'), { recursive: true, force: true });
rmSync(join(out, 'dossier.json'), { force: true });
cpSync(gameDir, join(out, 'game'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of
// game files, in all, or a path under game/ over 1000 bytes: game/ counts
// beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);
// Read the dossier back: confirm the file on disk is the one just written,
// a makefun/dossier/v1 document holding this run's screenshots.
const written = JSON.parse(readFileSync(join(out, 'dossier.json'), 'utf8'));
if (written.schema !== 'makefun/dossier/v1' || !Array.isArray(written.images) || written.images.length !== shotNames.length) {
  throw new Error('dossier.json on disk is not the dossier this run wrote');
}
