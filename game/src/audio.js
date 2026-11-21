// SoundEffects: every sound is synthesised with WebAudio — no audio files.
export class SoundEffects {
  constructor() {
    this.enabled = true;
    this.context = null;
  }

  ensureContext() {
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      this.context = new AudioContext();
    }
    if (this.context.state === 'suspended') void this.context.resume();
    return this.context;
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  playTone(frequency, startAt, duration, type = 'sine', volume = 0.16) {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + startAt);
    gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startAt + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(ctx.currentTime + startAt);
    oscillator.stop(ctx.currentTime + startAt + duration + 0.05);
  }

  playFound() {
    this.playTone(660, 0, 0.14, 'sine', 0.18);
    this.playTone(880, 0.09, 0.2, 'sine', 0.18);
    this.playTone(1320, 0.18, 0.22, 'triangle', 0.1);
  }

  playWrong() {
    this.playTone(180, 0, 0.18, 'sawtooth', 0.1);
    this.playTone(140, 0.1, 0.22, 'sawtooth', 0.1);
  }

  playHint() {
    this.playTone(520, 0, 0.12, 'triangle', 0.12);
    this.playTone(780, 0.1, 0.16, 'triangle', 0.12);
  }

  playTick() {
    this.playTone(980, 0, 0.06, 'square', 0.05);
  }

  playWin() {
    [523, 659, 784, 1047].forEach((frequency, index) => {
      this.playTone(frequency, index * 0.12, 0.3, 'triangle', 0.16);
    });
  }

  playLose() {
    [392, 330, 262].forEach((frequency, index) => {
      this.playTone(frequency, index * 0.16, 0.3, 'triangle', 0.14);
    });
  }
}
