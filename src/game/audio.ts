// ─── Procedural Audio — Web Audio API only, zero external files ───────────────

// ─── Music Player — look-ahead clock sequencer ───────────────────────────────
// Fires every 25 ms, schedules notes that fall within the next 120 ms window.
// This is immune to setTimeout jitter because note times come from the AudioContext
// clock, not from wall-clock delays.

class MusicPlayer {
  private ctx: AudioContext;
  private musicGain: GainNode;
  private running = false;
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private nextNoteTime = 0;
  private currentStep = 0;
  private intensity = 0;

  private static readonly BPM      = 120;
  private static readonly STEP     = 60 / MusicPlayer.BPM / 4; // 16th note = 0.125 s
  private static readonly STEPS    = 64;   // 4 bars
  private static readonly LOOKAHEAD= 0.12; // schedule 120 ms ahead
  private static readonly INTERVAL = 25;   // scheduler fires every 25 ms

  // Chord roots + tones per bar (4 bars: Am G Am F)
  private static readonly CHORDS: [number, number, number][] = [
    [110,   130.8, 164.8], // Am: A2 C3 E3
    [98,    123.5, 146.8], // G:  G2 B2 D3
    [110,   130.8, 164.8], // Am
    [87.3,  110,   130.8], // F:  F2 A2 C3
  ];

  // Lead melody — 16 notes, loops every 2 bars (8th-note grid)
  private static readonly MELODY = [
    440, 329.6, 392, 329.6,
    440, 392,   329.6, 293.7,
    261.6, 293.7, 329.6, 392,
    440, 392,   329.6, 261.6,
  ];

  // Counter melody — 16 notes, loops every 4 bars (quarter-note grid)
  private static readonly COUNTER = [
    392, 329.6, 261.6, 220,
    329.6, 261.6, 220, 196,
    261.6, 220, 196, 164.8,
    220, 261.6, 329.6, 392,
  ];

  constructor(ctx: AudioContext, master: GainNode) {
    this.ctx = ctx;
    this.musicGain = ctx.createGain();
    this.musicGain.gain.value = 0.32;
    this.musicGain.connect(master);
  }

  play() {
    if (this.running) return;
    this.running = true;
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this.currentStep  = 0;
    this._tick();
  }

  stop() {
    this.running = false;
    if (this.timerId !== null) clearTimeout(this.timerId);
    this.musicGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.4);
    // Restore so next play() works
    setTimeout(() => { if (!this.running) this.musicGain.gain.value = 0.32; }, 2000);
  }

  setIntensity(level: number) {
    this.intensity = Math.max(0, Math.min(4, level));
    const vol = 0.28 + this.intensity * 0.03;
    this.musicGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.5);
  }

  // ── Scheduler loop ─────────────────────────────────────────────────────────

  private _tick() {
    if (!this.running) return;

    // Resume suspended context (browser can suspend after inactivity)
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const now = this.ctx.currentTime;
    while (this.nextNoteTime < now + MusicPlayer.LOOKAHEAD) {
      this._scheduleStep(this.currentStep, this.nextNoteTime);
      this.currentStep  = (this.currentStep + 1) % MusicPlayer.STEPS;
      this.nextNoteTime += MusicPlayer.STEP;
    }

    this.timerId = setTimeout(() => this._tick(), MusicPlayer.INTERVAL);
  }

  // ── Step scheduler ─────────────────────────────────────────────────────────

  private _scheduleStep(step: number, t: number) {
    const S = MusicPlayer.STEP;
    const bar = Math.floor(step / 16) % 4;

    // Kick: beats 1 and 3 (every 8 steps)
    if (step % 8 === 0) this._kick(t);

    // Extra syncopated kick at stage 2+ (step 10 per bar)
    if (step % 16 === 10 && this.intensity >= 2) this._kick(t, 0.48);

    // Snare: beats 2 and 4 (every 8 steps, offset 4)
    if (step % 8 === 4) this._snare(t);

    // Hi-hat: every 8th note (every 2 steps), open on offbeat at stage 2+
    if (step % 2 === 0) {
      const open = step % 8 === 6 && this.intensity >= 2;
      this._hihat(t, open);
    }

    // Chord pad: whole bar (on beat 1 of each bar)
    if (step % 16 === 0) {
      MusicPlayer.CHORDS[bar].forEach(f => this._osc(t, f, S * 15, 'sine', 0.048));
    }

    // Bass: beat 1 and beat 3 of each bar
    if (step % 8 === 0) {
      const root = MusicPlayer.CHORDS[bar][0];
      this._osc(t, root,     S * 7, 'triangle', 0.22);
      this._osc(t, root / 2, S * 7, 'sine',     0.1);
    }

    // Lead melody: 8th notes (every 2 steps), stage 1+
    if (this.intensity >= 1 && step % 2 === 0) {
      const mi = (step / 2) % MusicPlayer.MELODY.length;
      this._osc(t, MusicPlayer.MELODY[mi], S * 1.65, 'sine', this.intensity >= 2 ? 0.1 : 0.075);
    }

    // Counter melody: quarter notes (every 4 steps), stage 3+
    if (this.intensity >= 3 && step % 4 === 2) {
      const ci = Math.floor(step / 4) % MusicPlayer.COUNTER.length;
      this._osc(t, MusicPlayer.COUNTER[ci] * 0.5, S * 3.2, 'triangle', 0.065);
    }
  }

  // ── Drum voices ────────────────────────────────────────────────────────────

  private _kick(t: number, vol = 0.65) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain); gain.connect(this.musicGain);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.12);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.start(t); osc.stop(t + 0.22);
  }

  private _snare(t: number) {
    const size = Math.floor(this.ctx.sampleRate * 0.1);
    const buf  = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
    const d    = buf.getChannelData(0);
    for (let i = 0; i < size; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / size);
    const src = this.ctx.createBufferSource();
    const hp  = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    src.buffer = buf; hp.type = 'highpass'; hp.frequency.value = 2000;
    src.connect(hp); hp.connect(gain); gain.connect(this.musicGain);
    gain.gain.setValueAtTime(0.38, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    src.start(t);
  }

  private _hihat(t: number, open = false) {
    const dur  = open ? 0.11 : 0.032;
    const size = Math.floor(this.ctx.sampleRate * dur);
    const buf  = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
    const d    = buf.getChannelData(0);
    for (let i = 0; i < size; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    const hp  = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    src.buffer = buf; hp.type = 'highpass'; hp.frequency.value = 9000;
    src.connect(hp); hp.connect(gain); gain.connect(this.musicGain);
    gain.gain.setValueAtTime(open ? 0.1 : 0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.start(t);
  }

  // ── Tonal voice ────────────────────────────────────────────────────────────

  private _osc(t: number, freq: number, dur: number, type: OscillatorType, vol: number) {
    const osc  = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain); gain.connect(this.musicGain);
    osc.type = type; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.015);
    gain.gain.setValueAtTime(vol, t + dur - 0.03);
    gain.gain.linearRampToValueAtTime(0, t + dur);
    osc.start(t); osc.stop(t + dur + 0.01);
  }
}

// ─── Audio Manager ────────────────────────────────────────────────────────────

export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private music: MusicPlayer | null = null;
  private _muted = false;
  private _stepCooldown = 0;

  // ── Context init ───────────────────────────────────────────────────────────

  private boot(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(this.ctx.destination);
      this.music = new MusicPlayer(this.ctx, this.master);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  get muted(): boolean { return this._muted; }

  toggle(): boolean {
    this._muted = !this._muted;
    if (this.master) {
      const ctx = this.boot();
      this.master.gain.setTargetAtTime(this._muted ? 0 : 0.55, ctx.currentTime, 0.06);
    }
    return this._muted;
  }

  tick(dt: number, playerMoving: boolean): void {
    if (this._stepCooldown > 0) this._stepCooldown -= dt;
    if (playerMoving && this._stepCooldown <= 0) {
      this._step();
      this._stepCooldown = 0.22;
    }
  }

  // ── Music controls ─────────────────────────────────────────────────────────

  startMusic(): void {
    this.boot();
    this.music?.play();
  }

  stopMusic(): void {
    this.music?.stop();
  }

  setMusicIntensity(stage: number): void {
    this.music?.setIntensity(stage);
  }

  // ── SFX ────────────────────────────────────────────────────────────────────

  pickup(): void {
    if (this._muted) return;
    const ctx = this.boot();
    [523, 659, 784].forEach((f, i) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(this.master!);
      osc.type = 'sine'; osc.frequency.value = f;
      const t = ctx.currentTime + i * 0.075;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.start(t); osc.stop(t + 0.2);
    });
  }

  deliver(): void {
    if (this._muted) return;
    const ctx = this.boot();
    [523, 659, 784, 1047].forEach((f, i) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(this.master!);
      osc.type = i === 3 ? 'sine' : 'triangle'; osc.frequency.value = f;
      const t = ctx.currentTime + i * 0.09;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
      osc.start(t); osc.stop(t + 0.35);
    });
  }

  combo(count: number): void {
    if (this._muted) return;
    const ctx = this.boot();
    const t = ctx.currentTime;
    const freq = Math.min(500 + count * 90, 1500);
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(this.master!);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 0.88, t);
    osc.frequency.linearRampToValueAtTime(freq, t + 0.04);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    osc.start(t); osc.stop(t + 0.16);
  }

  hit(): void {
    if (this._muted) return;
    const ctx = this.boot();
    const t = ctx.currentTime;
    const thump = ctx.createOscillator(), tg = ctx.createGain();
    thump.connect(tg); tg.connect(this.master!);
    thump.type = 'sine';
    thump.frequency.setValueAtTime(130, t);
    thump.frequency.exponentialRampToValueAtTime(38, t + 0.18);
    tg.gain.setValueAtTime(0.42, t);
    tg.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    thump.start(t); thump.stop(t + 0.24);

    const size = Math.floor(ctx.sampleRate * 0.12);
    const buf = ctx.createBuffer(1, size, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < size; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / size);
    const ns = ctx.createBufferSource(), filt = ctx.createBiquadFilter(), ng = ctx.createGain();
    ns.buffer = buf; filt.type = 'lowpass'; filt.frequency.value = 900;
    ns.connect(filt); filt.connect(ng); ng.connect(this.master!);
    ng.gain.setValueAtTime(0.28, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    ns.start(t);
  }

  gameOver(): void {
    if (this._muted) return;
    const ctx = this.boot();
    [392, 349, 311, 262].forEach((f, i) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(this.master!);
      osc.type = 'sawtooth'; osc.frequency.value = f;
      const t = ctx.currentTime + i * 0.22;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.start(t); osc.stop(t + 0.28);
    });
  }

  stageUp(): void {
    if (this._muted) return;
    const ctx = this.boot();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(this.master!);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(1400, t + 0.42);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.28, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.52);
    osc.start(t); osc.stop(t + 0.55);
    const a = ctx.createOscillator(), ag = ctx.createGain();
    a.connect(ag); ag.connect(this.master!);
    a.type = 'sine'; a.frequency.value = 1400;
    const t2 = t + 0.38;
    ag.gain.setValueAtTime(0, t2);
    ag.gain.linearRampToValueAtTime(0.18, t2 + 0.01);
    ag.gain.exponentialRampToValueAtTime(0.001, t2 + 0.18);
    a.start(t2); a.stop(t2 + 0.2);
  }

  honk(): void {
    if (this._muted) return;
    const ctx = this.boot();
    const t = ctx.currentTime;
    [220, 311].forEach(freq => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(this.master!);
      osc.type = 'sawtooth'; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.012);
      gain.gain.setValueAtTime(0.1, t + 0.16);
      gain.gain.linearRampToValueAtTime(0, t + 0.2);
      osc.start(t); osc.stop(t + 0.22);
    });
  }

  chaos(): void {
    if (this._muted) return;
    const ctx = this.boot();
    const t = ctx.currentTime;
    const size = Math.floor(ctx.sampleRate * 0.55);
    const buf = ctx.createBuffer(1, size, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < size; i++) d[i] = Math.random() * 2 - 1;
    const ns = ctx.createBufferSource(), filt = ctx.createBiquadFilter(), gain = ctx.createGain();
    ns.buffer = buf; filt.type = 'bandpass';
    filt.frequency.setValueAtTime(180, t);
    filt.frequency.exponentialRampToValueAtTime(4500, t + 0.38);
    filt.Q.value = 2.5;
    ns.connect(filt); filt.connect(gain); gain.connect(this.master!);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.32, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    ns.start(t);
  }

  private _step(): void {
    if (this._muted) return;
    const ctx = this.boot();
    const t = ctx.currentTime;
    const size = Math.floor(ctx.sampleRate * 0.028);
    const buf = ctx.createBuffer(1, size, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < size; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / size);
    const ns = ctx.createBufferSource(), filt = ctx.createBiquadFilter(), gain = ctx.createGain();
    ns.buffer = buf; filt.type = 'bandpass'; filt.frequency.value = 350; filt.Q.value = 0.6;
    ns.connect(filt); filt.connect(gain); gain.connect(this.master!);
    gain.gain.value = 0.055;
    ns.start(t);
  }
}

export const audioManager = new AudioManager();
