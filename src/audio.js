/*
 * Generative ambience with the Web Audio API — no audio files.
 *   drone  : two detuned low oscillators through a slowly breathing low-pass filter
 *   air    : filtered noise, like wind in an observatory dome
 *   warp   : a rising noise sweep with a sub-bass swell
 *   chime  : a soft bell on arrival (pentatonic, gold-ish timbre)
 * The ambience can be muted at any time; preference persists.
 */
export class Ambience {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.level = 1; // mood volume (The Unknown lowers it)
  }

  start() {
    if (this.ctx) return this.ctx.resume?.();
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);

    // reverb-ish: a short feedback delay network
    this.wet = ctx.createGain();
    this.wet.gain.value = 0.35;
    const d1 = ctx.createDelay(); d1.delayTime.value = 0.37;
    const d2 = ctx.createDelay(); d2.delayTime.value = 0.53;
    const fb = ctx.createGain(); fb.gain.value = 0.45;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
    this.wet.connect(d1); d1.connect(d2); d2.connect(lp); lp.connect(fb); fb.connect(d1); lp.connect(this.master);

    // drone
    this.droneFilter = ctx.createBiquadFilter();
    this.droneFilter.type = 'lowpass';
    this.droneFilter.frequency.value = 380;
    this.droneFilter.Q.value = 0.7;
    this.droneGain = ctx.createGain();
    this.droneGain.gain.value = 0.16;
    this.droneFilter.connect(this.droneGain);
    this.droneGain.connect(this.master);
    this.droneGain.connect(this.wet);
    this.oscs = [55, 55.4, 82.4, 110.2].map((f, i) => {
      const o = ctx.createOscillator();
      o.type = i < 2 ? 'sawtooth' : 'sine';
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = i < 2 ? 0.18 : 0.22;
      o.connect(g); g.connect(this.droneFilter);
      o.start();
      return o;
    });
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.03;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 140;
    lfo.connect(lfoGain); lfoGain.connect(this.droneFilter.frequency);
    lfo.start();

    // air
    const noise = this._noiseBuffer();
    const src = ctx.createBufferSource();
    src.buffer = noise; src.loop = true;
    this.airFilter = ctx.createBiquadFilter();
    this.airFilter.type = 'bandpass';
    this.airFilter.frequency.value = 600;
    this.airFilter.Q.value = 0.6;
    this.airGain = ctx.createGain();
    this.airGain.gain.value = 0.025;
    src.connect(this.airFilter); this.airFilter.connect(this.airGain); this.airGain.connect(this.master);
    src.start();

    this._applyVolume(4);
  }

  _noiseBuffer() {
    const ctx = this.ctx;
    const b = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02; // brown-ish
      d[i] = last * 3.5;
    }
    return b;
  }

  _applyVolume(ramp = 1.5) {
    if (!this.ctx) return;
    const v = this.enabled ? 0.55 * this.level : 0;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(v, t + ramp);
  }

  setEnabled(on) {
    this.enabled = on;
    if (on) this.start();
    this._applyVolume(0.8);
  }

  /** 1 = normal, ~0.3 = The Unknown, 0 = silence before launch */
  setMood(level, ramp = 3) {
    this.level = level;
    this._applyVolume(ramp);
  }

  warp(duration = 3) {
    if (!this.ctx || !this.enabled) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this._noiseBuffer();
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass'; f.Q.value = 1.4;
    f.frequency.setValueAtTime(200, t);
    f.frequency.exponentialRampToValueAtTime(3200, t + duration * 0.7);
    f.frequency.exponentialRampToValueAtTime(300, t + duration);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.22, t + duration * 0.65);
    g.gain.linearRampToValueAtTime(0, t + duration);
    src.connect(f); f.connect(g); g.connect(this.master); g.connect(this.wet);
    src.start(t); src.stop(t + duration + 0.1);

    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(38, t);
    sub.frequency.exponentialRampToValueAtTime(70, t + duration * 0.7);
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0, t);
    sg.gain.linearRampToValueAtTime(0.25, t + duration * 0.6);
    sg.gain.linearRampToValueAtTime(0, t + duration);
    sub.connect(sg); sg.connect(this.master);
    sub.start(t); sub.stop(t + duration + 0.1);
  }

  chime(index = 0) {
    if (!this.ctx || !this.enabled) return;
    const ctx = this.ctx, t = ctx.currentTime + 0.05;
    const scale = [261.6, 293.7, 329.6, 392.0, 440.0, 523.3];
    const base = scale[index % scale.length];
    [1, 2.01, 3.0, 4.2].forEach((h, i) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = base * h;
      const g = ctx.createGain();
      const peak = 0.06 / (i + 1);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(peak, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 4.5 / (i * 0.6 + 1));
      o.connect(g); g.connect(this.master); g.connect(this.wet);
      o.start(t); o.stop(t + 5);
    });
  }
}
