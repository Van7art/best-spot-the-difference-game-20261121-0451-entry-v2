// SpotGame: the spot-the-difference engine. A scene draws one picture twice —
// the left panel plain, the right panel with every difference applied — and this
// engine owns the hunt: clicks, markers, timer, score, hints and win/lose.
import { SoundEffects } from './audio.js';

const PANEL_WIDTH = 640;
const PANEL_HEIGHT = 420;

export class SpotGame {
  constructor(config, scene, elements) {
    this.config = config;
    this.scene = scene;
    this.el = elements;
    this.sounds = new SoundEffects();
    this.state = 'title';
    this.found = new Set();
    this.hintsLeft = config.hints;
    this.score = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.timeLeft = config.timeLimitSec;
    this.wrongClicks = 0;
    this.hintsUsed = 0;
    this.misses = [];
    this.hintPulse = null;
    this.lastTickSecond = -1;
    this.magnifierOn = false;
    this.rafId = 0;
    this.lastFrameAt = 0;
    this.startedAt = 0;
    this.finishedAt = 0;
  }

  start() {
    this.state = 'playing';
    this.found = new Set();
    this.hintsLeft = this.config.hints;
    this.score = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.timeLeft = this.config.timeLimitSec;
    this.wrongClicks = 0;
    this.hintsUsed = 0;
    this.misses = [];
    this.hintPulse = null;
    this.lastTickSecond = -1;
    this.startedAt = performance.now();
    this.hideOverlay();
    this.setMessage('Find every difference — click it on either picture.');
    this.updateHud();
    this.el.hintButton.disabled = false;
  }

  restart() {
    this.start();
  }

  updateHud() {
    const total = this.scene.differences.length;
    this.el.foundCount.textContent = `${this.found.size} / ${total}`;
    this.el.scoreValue.textContent = String(this.score);
    this.el.hintValue.textContent = String(this.hintsLeft);
    const seconds = Math.max(0, Math.ceil(this.timeLeft));
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    this.el.timeValue.textContent = `${minutes}:${String(rest).padStart(2, '0')}`;
    this.el.timeValue.classList.toggle('low', this.timeLeft <= 15 && this.state === 'playing');
    const bar = this.el.timeBar;
    bar.style.width = `${Math.max(0, (this.timeLeft / this.config.timeLimitSec) * 100)}%`;
    bar.classList.toggle('low', this.timeLeft <= 15);
    this.el.hintButton.disabled = this.hintsLeft <= 0 || this.state !== 'playing';
  }

  setMessage(text) {
    this.el.messageBar.textContent = text;
    this.el.status.textContent = text;
  }

  panelPoint(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * PANEL_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * PANEL_HEIGHT,
    };
  }

  differenceAt(point) {
    let best = null;
    let bestDistance = Infinity;
    for (const diff of this.scene.differences) {
      if (this.found.has(diff.id)) continue;
      const distance = Math.hypot(point.x - diff.x, point.y - diff.y);
      if (distance <= diff.r && distance < bestDistance) {
        best = diff;
        bestDistance = distance;
      }
    }
    return best;
  }

  handleClick(canvas, event) {
    if (this.state === 'title') {
      this.start();
      return;
    }
    if (this.state !== 'playing') return;
    const point = this.panelPoint(canvas, event);
    const diff = this.differenceAt(point);
    if (diff) {
      this.registerFound(diff);
    } else {
      this.registerMiss(point, canvas === this.el.panelRight);
    }
  }

  registerFound(diff) {
    this.found.add(diff.id);
    this.combo += 1;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    const base = 100;
    const comboBonus = this.config.comboScoring ? (this.combo - 1) * 25 : 0;
    const timeBonus = this.config.timeBonusPerFindSec || 0;
    this.score += base + comboBonus;
    if (timeBonus > 0) this.timeLeft = Math.min(this.config.timeLimitSec, this.timeLeft + timeBonus);
    this.sounds.playFound();
    const remaining = this.scene.differences.length - this.found.size;
    const comboText = this.config.comboScoring && this.combo > 1 ? ` Combo x${this.combo}!` : '';
    const timeText = timeBonus > 0 ? ` +${timeBonus}s.` : '.';
    this.setMessage(
      remaining === 0
        ? `Found it: ${diff.name}! That was the last one!`
        : `Found it: ${diff.name}!${comboText} ${remaining} still hiding${timeText}`,
    );
    this.updateHud();
    if (remaining === 0) this.win();
  }

  registerMiss(point, onRight) {
    this.combo = 0;
    this.wrongClicks += 1;
    this.misses.push({ x: point.x, y: point.y, onRight, at: performance.now() });
    this.sounds.playWrong();
    if (this.config.wrongPenaltySec > 0) {
      this.timeLeft = Math.max(0, this.timeLeft - this.config.wrongPenaltySec);
    } else {
      this.score = Math.max(0, this.score - 25);
    }
    this.setMessage(
      this.config.wrongPenaltySec > 0
        ? `Not a difference — ${this.config.wrongPenaltySec} seconds lost. Look closer!`
        : 'Not a difference — 25 points lost. Look closer!',
    );
    this.updateHud();
    if (this.timeLeft <= 0) this.lose();
  }

  useHint() {
    if (this.state !== 'playing' || this.hintsLeft <= 0) return;
    const remaining = this.scene.differences.filter((diff) => !this.found.has(diff.id));
    if (remaining.length === 0) return;
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    this.hintsLeft -= 1;
    this.hintsUsed += 1;
    this.hintPulse = { diff: pick, until: performance.now() + 2500 };
    this.sounds.playHint();
    this.setMessage(`Hint: something is different near the ${pick.hintArea}.`);
    this.updateHud();
  }

  win() {
    this.state = 'won';
    this.finishedAt = performance.now();
    const timeBonus = Math.round(this.timeLeft) * 5;
    this.score += timeBonus;
    this.sounds.playWin();
    this.updateHud();
    this.showOverlay(
      'You found them all!',
      `Every difference in ${this.scene.name} — spotted.`,
      `Score ${this.score} (incl. ${timeBonus} time bonus) · Best combo x${Math.max(1, this.bestCombo)} · Hints used ${this.hintsUsed} · Wrong clicks ${this.wrongClicks}`,
      'Play again',
    );
  }

  lose() {
    this.state = 'lost';
    this.finishedAt = performance.now();
    this.sounds.playLose();
    this.updateHud();
    const remaining = this.scene.differences.length - this.found.size;
    this.showOverlay(
      'Time ran out!',
      `The ${remaining} difference${remaining === 1 ? '' : 's'} still hiding got away this time.`,
      `You found ${this.found.size} of ${this.scene.differences.length} · Score ${this.score}`,
      'Try again',
    );
  }

  showOverlay(title, text, stats, buttonLabel) {
    this.el.overlayTitle.textContent = title;
    this.el.overlayText.textContent = text;
    this.el.overlayStats.textContent = stats;
    this.el.overlayButton.textContent = buttonLabel;
    this.el.overlay.hidden = false;
  }

  hideOverlay() {
    this.el.overlay.hidden = true;
  }

  drawMarker(ctx, diff, pulse) {
    const radius = diff.r + 6 + (pulse ? Math.sin(performance.now() / 120) * 3 : 0);
    ctx.save();
    ctx.strokeStyle = pulse ? '#ff9f1c' : '#e63946';
    ctx.lineWidth = pulse ? 5 : 4;
    ctx.beginPath();
    ctx.ellipse(diff.x, diff.y, radius, radius * 0.82, -0.25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(diff.x, diff.y, radius + 3, radius * 0.82 + 3, -0.25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawMiss(ctx, miss) {
    const age = performance.now() - miss.at;
    if (age > 900) return;
    const alpha = 1 - age / 900;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#e63946';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(miss.x - 10, miss.y - 10);
    ctx.lineTo(miss.x + 10, miss.y + 10);
    ctx.moveTo(miss.x + 10, miss.y - 10);
    ctx.lineTo(miss.x - 10, miss.y + 10);
    ctx.stroke();
    ctx.restore();
  }

  drawFrame(now) {
    const leftCtx = this.el.panelLeft.getContext('2d');
    const rightCtx = this.el.panelRight.getContext('2d');
    const allIds = new Set(this.scene.differences.map((diff) => diff.id));
    this.scene.draw(leftCtx, new Set(), now);
    this.scene.draw(rightCtx, allIds, now);
    for (const diff of this.scene.differences) {
      if (!this.found.has(diff.id)) continue;
      this.drawMarker(leftCtx, diff, false);
      this.drawMarker(rightCtx, diff, false);
    }
    if (this.hintPulse) {
      if (now > this.hintPulse.until) {
        this.hintPulse = null;
      } else {
        this.drawMarker(leftCtx, this.hintPulse.diff, true);
        this.drawMarker(rightCtx, this.hintPulse.diff, true);
      }
    }
    const freshMisses = [];
    for (const miss of this.misses) {
      if (now - miss.at <= 900) {
        freshMisses.push(miss);
        this.drawMiss(miss.onRight ? rightCtx : leftCtx, miss);
      }
    }
    this.misses = freshMisses;
  }

  tick(now) {
    if (this.lastFrameAt === 0) this.lastFrameAt = now;
    const deltaSec = (now - this.lastFrameAt) / 1000;
    this.lastFrameAt = now;
    if (this.state === 'playing') {
      this.timeLeft -= deltaSec;
      const whole = Math.ceil(this.timeLeft);
      if (this.timeLeft <= 10 && whole !== this.lastTickSecond && this.timeLeft > 0) {
        this.lastTickSecond = whole;
        this.sounds.playTick();
      }
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.updateHud();
        this.lose();
      } else {
        this.updateHud();
      }
    }
    this.drawFrame(now);
    this.rafId = requestAnimationFrame((time) => this.tick(time));
  }

  run() {
    this.rafId = requestAnimationFrame((time) => this.tick(time));
  }

  // Screenshot staging: put the game into a fixed, photogenic state.
  // The 'play' shot pre-finds the scene's coverFinds — differences that are
  // visible objects on both panels, so the markers ring something real.
  stageForShot(shot) {
    if (shot === 'play') {
      this.start();
      const wanted = this.scene.coverFinds
        || this.scene.differences.slice(0, 3).map((diff) => diff.id);
      const picks = wanted
        .map((id) => this.scene.differences.find((diff) => diff.id === id))
        .filter(Boolean);
      for (const diff of picks) this.found.add(diff.id);
      this.score = picks.length * 100;
      this.combo = picks.length;
      this.timeLeft = this.config.timeLimitSec - 47;
      const remaining = this.scene.differences.length - this.found.size;
      this.setMessage(`${this.found.size} found — ${remaining} still hiding. Can you spot the rest?`);
      this.updateHud();
    } else if (shot === 'win') {
      this.start();
      for (const diff of this.scene.differences) this.found.add(diff.id);
      this.score = 1420;
      this.timeLeft = 83;
      this.state = 'won';
      this.updateHud();
      this.showOverlay(
        'You found them all!',
        `Every difference in ${this.scene.name} — spotted.`,
        'Score 1420 · Best combo x4 · Hints used 1 · Wrong clicks 2',
        'Play again',
      );
    } else {
      // 'start': title state, panels drawn, nothing found yet.
      this.state = 'title';
      this.updateHud();
      this.showOverlay(
        this.scene.title,
        this.scene.tagline,
        `${this.scene.differences.length} differences hiding · ${Math.floor(this.config.timeLimitSec / 60)}:${String(this.config.timeLimitSec % 60).padStart(2, '0')} on the clock · ${this.config.hints} hints`,
        'Start playing',
      );
    }
  }

  bindEvents() {
    this.el.panelLeft.addEventListener('click', (event) => this.handleClick(this.el.panelLeft, event));
    this.el.panelRight.addEventListener('click', (event) => this.handleClick(this.el.panelRight, event));
    this.el.hintButton.addEventListener('click', () => this.useHint());
    this.el.restartButton.addEventListener('click', () => this.restart());
    this.el.overlayButton.addEventListener('click', () => this.start());
    this.el.soundButton.addEventListener('click', () => {
      const on = this.sounds.toggle();
      this.el.soundButton.textContent = on ? '🔊 Sound' : '🔇 Muted';
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'h' || event.key === 'H') this.useHint();
      if (event.key === 'r' || event.key === 'R') this.restart();
      if (event.key === 'm' || event.key === 'M') this.toggleMagnifier();
    });
    if (this.config.magnifier) this.bindMagnifier();
  }

  toggleMagnifier() {
    if (!this.config.magnifier) return;
    this.magnifierOn = !this.magnifierOn;
    this.setMessage(this.magnifierOn ? 'Magnifier on — hover the right picture to zoom in.' : 'Magnifier off.');
    if (!this.magnifierOn) this.el.lens.hidden = true;
  }

  bindMagnifier() {
    const lens = this.el.lens;
    const lensCtx = this.el.lensCanvas.getContext('2d');
    this.el.panelRight.addEventListener('mousemove', (event) => {
      if (!this.magnifierOn || this.state !== 'playing') {
        lens.hidden = true;
        return;
      }
      const point = this.panelPoint(this.el.panelRight, event);
      const size = 90;
      const sx = Math.max(0, Math.min(PANEL_WIDTH - size, point.x - size / 2));
      const sy = Math.max(0, Math.min(PANEL_HEIGHT - size, point.y - size / 2));
      lensCtx.imageSmoothingEnabled = true;
      lensCtx.clearRect(0, 0, 180, 180);
      lensCtx.drawImage(this.el.panelRight, sx, sy, size, size, 0, 0, 180, 180);
      lens.style.left = `${event.clientX + 18}px`;
      lens.style.top = `${event.clientY - 90}px`;
      lens.hidden = false;
    });
    this.el.panelRight.addEventListener('mouseleave', () => {
      lens.hidden = true;
    });
  }
}
