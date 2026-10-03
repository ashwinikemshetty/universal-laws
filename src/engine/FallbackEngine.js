/*
 * Used when WebGL is unavailable or "lite" mode is chosen. A Canvas 2D star tunnel that can
 * still warp (stars become streaks), so the voyage keeps its sense of travel. Interactive
 * 3D models are replaced by a short notice; all chapter content remains fully available.
 * Exposes the subset of the Engine API the director uses.
 */
import { clamp, lerp, ease } from './util.js';

export class FallbackEngine {
  constructor(canvas, { reducedMotion = false } = {}) {
    this.isFallback = true;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.reducedMotion = reducedMotion;
    this.warp = 0;
    this.speed = 0.6;
    this.tweens = new Set();
    this.listeners = {};
    this.current = null;
    this.timeScale = 1;
    this.stars = Array.from({ length: 700 }, () => this._star(true));
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.1, (now - this.last) / 1000);
      this.last = now;
      this._frame(dt);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  _star(randomZ = false) {
    return { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2, z: randomZ ? Math.random() : 1, m: Math.random() ** 3 };
  }

  on(evt, fn) { (this.listeners[evt] ||= []).push(fn); }
  emit(evt, ...a) { (this.listeners[evt] || []).forEach((f) => f(...a)); }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.w = innerWidth; this.h = innerHeight;
    this.canvas.width = this.w * dpr;
    this.canvas.height = this.h * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  tween({ from = 0, to = 1, duration = 1, easing = ease.inOut, onUpdate, delay = 0 }) {
    if (this.reducedMotion) duration = Math.min(duration, 0.35);
    return new Promise((resolve) => this.tweens.add({ t: -delay, duration: Math.max(0.0001, duration), from, to, easing, onUpdate, resolve }));
  }
  wait(s) { return this.tween({ duration: s, onUpdate: () => {} }); }
  setWarp(to, duration = 1.5, easing = ease.inOut) {
    const from = this.warp;
    return this.tween({ duration, easing, onUpdate: (k) => (this.warp = lerp(from, to, k)) });
  }
  setFov() { return Promise.resolve(); }
  setViewShift() { return Promise.resolve(); }
  prepare(id) { return { id, api: { controls: [], readout: () => '', fallback: true } }; }
  commit(next) { this.current = next; }
  arrive() { return this.wait(0.6); }
  depart() { this.current = null; return this.wait(0.4); }
  flyThroughBeacon() { return this.wait(0.8); }
  latticeScatter() { return this.setWarp(0.5, 1.2); }
  setStageOpacity() {}
  get starfield() { return { targetSpeed: 0, uniforms: { uAniso: { value: 0 }, uOpacity: { value: 1 } } }; }
  get atmosphere() { return { setTint() {}, setOpacity() {} }; }

  _frame(dt) {
    for (const tw of this.tweens) {
      tw.t += dt;
      if (tw.t < 0) continue;
      const k = clamp(tw.t / tw.duration);
      tw.onUpdate?.(lerp(tw.from, tw.to, tw.easing(k)));
      if (k >= 1) { this.tweens.delete(tw); tw.resolve(); }
    }
    const { ctx, w, h } = this;
    ctx.fillStyle = `rgba(4,4,5,${0.35 + (1 - this.warp) * 0.65})`;
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, f = Math.max(w, h) * 0.5;
    const v = (this.reducedMotion ? 0.02 : 0.03) + this.warp * this.warp * 1.6;
    ctx.lineCap = 'round';
    for (const s of this.stars) {
      const pz = s.z;
      s.z -= v * dt;
      if (s.z <= 0.02) Object.assign(s, this._star());
      const x = cx + (s.x / s.z) * f * 0.5, y = cy + (s.y / s.z) * f * 0.5;
      const px = cx + (s.x / pz) * f * 0.5, py = cy + (s.y / pz) * f * 0.5;
      const a = clamp((1 - s.z) * 1.2) * (0.3 + s.m);
      ctx.strokeStyle = `rgba(239,226,196,${a})`;
      ctx.lineWidth = 0.6 + s.m * 1.6 * (1 - s.z);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(this.warp > 0.05 ? x : px + 0.1, this.warp > 0.05 ? y : py + 0.1);
      ctx.stroke();
    }
  }
}
