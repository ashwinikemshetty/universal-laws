import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { Starfield } from './Starfield.js';
import { Atmosphere } from './Atmosphere.js';
import { glowSprite, disposeObject, setGroupOpacity, clamp, lerp, ease } from './util.js';
import { SCENES } from './scenes/index.js';

/*
 * The Engine owns the WebGL world. Conceptually:
 *   sky   — starfield + atmosphere, always surrounding the camera
 *   stage — the current chapter's environment, placed in front of the camera
 * Travel is choreographed by moving the stage (arrive from far away / fly past the camera),
 * warping the starfield, and nudging FOV — the camera itself stays on a gentle rig.
 */
export class Engine {
  constructor(canvas, { tier = 'high', reducedMotion = false } = {}) {
    this.canvas = canvas;
    this.tier = tier;
    this.reducedMotion = reducedMotion;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: tier !== 'low', powerPreference: 'high-performance', alpha: false });
    this.maxDpr = tier === 'high' ? 1.75 : tier === 'mid' ? 1.25 : 1;
    this.dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr);
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setClearColor(0x040405, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x040405, 0.0009);
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.05, 4000);
    this.baseFov = 55;
    this.camera.position.set(0, 0, 14);

    this.sky = new THREE.Group();
    this.scene.add(this.sky);
    this.starfield = new Starfield(tier === 'low' ? 2500 : tier === 'mid' ? 4500 : 7000, tier);
    this.atmosphere = new Atmosphere(tier);
    this.sky.add(this.atmosphere.group, this.starfield.group);

    this.stageRoot = new THREE.Group(); // receives drag rotation
    this.scene.add(this.stageRoot);
    this.current = null; // { id, api, holder }
    this.stageZ = 0;

    // the celestial object we fly through on launch / major warps
    this.beacon = this._makeBeacon();
    this.beacon.visible = false;
    this.scene.add(this.beacon);

    this.composer = null;
    if (tier !== 'low') {
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.75, 0.6, 0.12);
      this.composer.addPass(this.bloom);
      this.composer.addPass(new OutputPass());
    }

    this.clock = new THREE.Clock();
    this.time = 0;
    this.tweens = new Set();
    this.timeScale = 1;
    this.camDistance = 14;
    this.camTargetDistance = 14;
    this.camHeight = 0;
    this.drag = { active: false, x: 0, y: 0, rx: 0, ry: 0, vx: 0, vy: 0 };
    this.rot = { x: 0, y: 0 };
    this.pointer = new THREE.Vector2(-10, -10);
    this.raycaster = new THREE.Raycaster();
    this.raycaster.params.Points = { threshold: 0.2 };
    this.hovered = null;
    this.listeners = {};
    this.shake = 0;
    this.paused = false;
    this.frameTimes = [];

    this._bindInput();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    document.addEventListener('visibilitychange', () => {
      this.paused = document.hidden;
      if (!this.paused) this.clock.getDelta();
    });
    this.renderer.setAnimationLoop(() => this._frame());
  }

  on(evt, fn) { (this.listeners[evt] ||= []).push(fn); }
  emit(evt, ...a) { (this.listeners[evt] || []).forEach((f) => f(...a)); }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // keep scenes framed on portrait screens
    this.portraitBoost = w < h ? clamp(h / w, 1, 2) * 0.75 + 0.25 : 1;
    this._applyViewShift();
    this.camera.updateProjectionMatrix();
    if (this.composer) {
      this.composer.setPixelRatio(this.dpr);
      this.composer.setSize(w, h);
    }
    this.starfield.uniforms.uPixelRatio.value = this.dpr;
  }

  /* ───────────── tweens ───────────── */
  tween({ from = 0, to = 1, duration = 1, easing = ease.inOut, onUpdate, delay = 0 }) {
    if (this.reducedMotion) duration = Math.min(duration, 0.35);
    return new Promise((resolve) => {
      const tw = { t: -delay, duration: Math.max(0.0001, duration), from, to, easing, onUpdate, resolve };
      this.tweens.add(tw);
    });
  }
  wait(seconds) { return this.tween({ duration: seconds, onUpdate: () => {} }); }

  setWarp(to, duration = 1.5, easing = ease.inOut) {
    const from = this.starfield.uniforms.uWarp.value;
    return this.tween({ duration, easing, onUpdate: (k) => (this.starfield.uniforms.uWarp.value = lerp(from, to, k)) });
  }
  setFov(to, duration = 1.5, easing = ease.inOut) {
    const from = this.camera.fov;
    return this.tween({ duration, easing, onUpdate: (k) => { this.camera.fov = lerp(from, to, k); this.camera.updateProjectionMatrix(); } });
  }

  /** Shift the rendered image horizontally (px) so the stage stays centred beside an open side panel. */
  setViewShift(px, duration = 0.9) {
    const from = this.viewShift || 0;
    return this.tween({
      duration,
      onUpdate: (k) => {
        this.viewShift = lerp(from, px, k);
        this._applyViewShift();
      },
    });
  }
  _applyViewShift() {
    const w = window.innerWidth, h = window.innerHeight;
    if (Math.abs(this.viewShift || 0) < 0.5) this.camera.clearViewOffset();
    else this.camera.setViewOffset(w, h, this.viewShift, 0, w, h);
  }

  /* ───────────── stage ───────────── */
  /** Build a scene by id and place it far ahead, invisible. Returns the api. */
  prepare(id, opts = {}) {
    const factory = SCENES[id];
    const api = factory({ tier: this.tier, reducedMotion: this.reducedMotion }, opts);
    const holder = new THREE.Group();
    holder.add(api.group);
    api.markers = [];
    (opts.notes || []).forEach((n, i) => {
      const m = glowSprite('#f6e6c0', 0.5, 0.9);
      m.position.set(...n.pos);
      m.userData.note = n;
      m.userData.phase = i * 1.3;
      m.renderOrder = 10;
      api.group.add(m);
      api.markers.push(m);
    });
    holder.position.z = -420;
    holder.visible = false;
    const entry = { id, api, holder };
    this._fade(entry, 0);
    return entry;
  }

  /** Swap the prepared scene in as current (the old one is removed). */
  commit(next) {
    if (this.current) this._remove(this.current);
    this.current = next;
    this.stageRoot.add(next.holder);
    next.holder.visible = true;
    this.rot.x = 0; this.rot.y = 0;
    this.stageRoot.rotation.set(0, 0, 0);
    const d = (next.api.cameraDistance || 14) * this.portraitBoost;
    this.camTargetDistance = d;
    this.camHeight = next.api.cameraHeight || 0;
  }

  _remove(entry) {
    this.stageRoot.remove(entry.holder);
    disposeObject(entry.holder);
  }

  /** Bring the current stage in from the distance and settle it. */
  async arrive(duration = 2.6) {
    const h = this.current.holder;
    const z0 = this.reducedMotion ? -6 : -320;
    await this.tween({
      duration,
      easing: ease.expoOut,
      onUpdate: (k) => {
        h.position.z = lerp(z0, 0, k);
        this._fade(this.current, clamp(k * 1.6));
      },
    });
  }

  /** Fly the current stage past the camera and fade it. */
  async depart(duration = 1.4) {
    if (!this.current) return;
    const entry = this.current;
    const h = entry.holder;
    const z0 = h.position.z;
    await this.tween({
      duration,
      easing: ease.in,
      onUpdate: (k) => {
        h.position.z = lerp(z0, this.reducedMotion ? 4 : this.camDistance + 40, k);
        this._fade(entry, 1 - clamp(k * 1.3));
      },
    });
    if (this.current === entry) {
      this._remove(entry);
      this.current = null;
    }
  }

  /** Scenes that manage their own per-object opacity expose setOpacity(k); others are faded wholesale. */
  _fade(entry, k) {
    if (entry.api.setOpacity) {
      entry.api.setOpacity(k);
      entry.api.markers.forEach((m) => setGroupOpacity(m, k));
    } else setGroupOpacity(entry.holder, k);
  }

  setStageOpacity(k) { if (this.current) this._fade(this.current, k); }

  /* ───────────── beacon (fly-through object) ───────────── */
  _makeBeacon() {
    const g = new THREE.Group();
    const core = glowSprite('#fff1cf', 6, 1);
    const halo = glowSprite('#e0b872', 28, 0.45);
    const ringGeo = new THREE.TorusGeometry(9, 0.05, 8, 160);
    const ringMat = new THREE.MeshBasicMaterial({ color: '#e8c98b', transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false });
    const r1 = new THREE.Mesh(ringGeo, ringMat);
    const r2 = r1.clone();
    r2.material = ringMat.clone();
    r2.scale.setScalar(1.35);
    r2.material.opacity = 0.25;
    g.add(halo, core, r1, r2);
    g.userData = { core, halo, r1, r2 };
    return g;
  }

  /** The distant celestial object approaches and the camera passes through it. */
  async flyThroughBeacon(duration = 2.4, tint = '#e0b872') {
    if (this.reducedMotion) return;
    const b = this.beacon;
    b.userData.halo.material.color.set(tint);
    b.visible = true;
    await this.tween({
      duration,
      easing: ease.in,
      onUpdate: (k) => {
        b.position.set(0, 0, lerp(-900, this.camera.position.z + 30, k));
        const s = lerp(0.2, 1.4, k);
        b.scale.setScalar(s);
        b.userData.r1.rotation.z += 0.02;
        b.userData.r2.rotation.z -= 0.015;
        const flash = clamp((k - 0.82) / 0.18);
        this.emit('flash', flash);
      },
    });
    b.visible = false;
    this.emit('flash', 0);
  }

  /**
   * Entropy transition: a perfectly ordered lattice hangs in front of the camera, then its
   * particles scatter outward — statistically, irreversibly — until they become the starfield.
   */
  async latticeScatter(duration = 3.4) {
    const side = this.tier === 'low' ? 9 : 14;
    const n = side * side * side;
    const pos = new Float32Array(n * 3);
    const dir = new Float32Array(n * 3);
    let k = 0;
    for (let x = 0; x < side; x++)
      for (let y = 0; y < side; y++)
        for (let z = 0; z < side; z++) {
          const px = (x / (side - 1) - 0.5) * 5, py = (y / (side - 1) - 0.5) * 5, pz = (z / (side - 1) - 0.5) * 5;
          pos.set([px, py, pz], k * 3);
          const v = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
          dir.set([v.x, v.y, v.z + 0.6], k * 3);
          k++;
        }
    const base = pos.slice();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ size: 0.07, color: '#ecd3a0', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const pts = new THREE.Points(geo, mat);
    pts.position.set(0, 0, this.camera.position.z - 12);
    pts.rotation.set(0.5, 0.7, 0);
    this.scene.add(pts);
    await this.tween({ duration: 0.9, onUpdate: (v) => { mat.opacity = v; pts.rotation.y += 0.004; } });
    await this.tween({
      duration,
      easing: ease.in,
      onUpdate: (v) => {
        const spread = v * v * 140;
        const jitter = v * 0.6;
        for (let i = 0; i < n * 3; i++) pos[i] = base[i] + dir[i] * spread * (0.6 + ((i * 7919) % 97) / 97) + (Math.random() - 0.5) * jitter;
        geo.attributes.position.needsUpdate = true;
        mat.size = 0.07 + v * 0.05;
        mat.opacity = 1 - clamp((v - 0.65) / 0.35);
        pts.rotation.y += 0.002;
      },
    });
    this.scene.remove(pts);
    geo.dispose();
    mat.dispose();
  }

  /* ───────────── input ───────────── */
  _bindInput() {
    const c = this.canvas;
    c.addEventListener('pointerdown', (e) => {
      this.drag.active = true;
      this.drag.moved = 0;
      this.drag.x = e.clientX; this.drag.y = e.clientY;
      c.setPointerCapture?.(e.pointerId);
    });
    c.addEventListener('pointermove', (e) => {
      this.pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
      if (!this.drag.active) return;
      const dx = e.clientX - this.drag.x, dy = e.clientY - this.drag.y;
      this.drag.moved += Math.abs(dx) + Math.abs(dy);
      this.drag.x = e.clientX; this.drag.y = e.clientY;
      this.drag.vy = dx * 0.005;
      this.drag.vx = dy * 0.005;
      this.rot.y += dx * 0.005;
      this.rot.x = clamp(this.rot.x + dy * 0.004, -0.9, 0.9);
    });
    const up = (e) => {
      if (this.drag.active && this.drag.moved < 6) this._click(e);
      this.drag.active = false;
    };
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', () => (this.drag.active = false));
    c.addEventListener('pointerleave', () => this.pointer.set(-10, -10));
    c.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.camTargetDistance = clamp(this.camTargetDistance * (1 + Math.sign(e.deltaY) * 0.08), 4, 40);
    }, { passive: false });
  }

  _pickables() {
    if (!this.current) return [];
    return [...(this.current.api.markers || []), ...(this.current.api.pickables || [])];
  }

  _click(e) {
    const p = new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    this.raycaster.setFromCamera(p, this.camera);
    const hits = this.raycaster.intersectObjects(this._pickables(), false);
    if (!hits.length) return;
    const obj = hits[0].object;
    if (obj.userData.note) this.emit('note', obj.userData.note);
    else if (this.current.api.onPick) this.current.api.onPick(obj);
  }

  /* ───────────── frame ───────────── */
  _frame() {
    if (this.paused) return;
    const dt = Math.min(this.clock.getDelta(), 0.1);
    this.time += dt;
    const t = this.time;

    for (const tw of this.tweens) {
      tw.t += dt;
      if (tw.t < 0) continue;
      const k = clamp(tw.t / tw.duration);
      tw.onUpdate?.(lerp(tw.from, tw.to, tw.easing(k)));
      if (k >= 1) { this.tweens.delete(tw); tw.resolve(); }
    }

    // camera rig: gentle breathing drift, distance easing, optional shake
    this.camDistance += (this.camTargetDistance - this.camDistance) * Math.min(1, dt * 2.5);
    const drift = this.reducedMotion ? 0 : 1;
    const sh = this.shake;
    this.camera.position.set(
      Math.sin(t * 0.07) * 0.35 * drift + (Math.random() - 0.5) * sh,
      this.camHeight + Math.sin(t * 0.05) * 0.2 * drift + (Math.random() - 0.5) * sh,
      this.camDistance
    );
    this.camera.lookAt(0, this.camHeight * 0.25, 0);
    this.sky.position.copy(this.camera.position);

    // drag inertia
    if (!this.drag.active) {
      this.rot.y += this.drag.vy * 0.9;
      this.drag.vy *= 0.92;
      this.drag.vx *= 0.92;
    }
    this.stageRoot.rotation.y += (this.rot.y - this.stageRoot.rotation.y) * Math.min(1, dt * 6);
    this.stageRoot.rotation.x += (this.rot.x - this.stageRoot.rotation.x) * Math.min(1, dt * 6);

    this.starfield.update(dt, t);
    this.atmosphere.update(dt, t, this.starfield.speed);

    if (this.current) {
      const api = this.current.api;
      api.update?.(dt * this.timeScale, t, { timeScale: this.timeScale });
      api.markers?.forEach((m) => {
        const pulse = 0.65 + 0.35 * Math.sin(t * 1.6 + m.userData.phase);
        m.scale.setScalar((m === this.hovered ? 0.8 : 0.5) * pulse);
      });
      // hover
      if (!this.drag.active && this.pointer.x > -2) {
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const hit = this.raycaster.intersectObjects(this._pickables(), false)[0];
        const obj = hit?.object || null;
        if (obj !== this.hovered) {
          this.hovered = obj;
          this.canvas.style.cursor = obj ? 'pointer' : 'grab';
          this.emit('hover', obj?.userData.note || null);
        }
      }
    }

    if (this.composer) this.composer.render(dt);
    else this.renderer.render(this.scene, this.camera);

    this._adapt(dt);
  }

  /** Adaptive resolution: if frames are slow for a sustained period, lower the pixel ratio. */
  _adapt(dt) {
    this.frameTimes.push(dt);
    if (this.frameTimes.length < 90) return;
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.frameTimes.length = 0;
    if (avg > 1 / 40 && this.dpr > 0.75) {
      this.dpr = Math.max(0.75, this.dpr - 0.25);
      this.renderer.setPixelRatio(this.dpr);
      this.resize();
    } else if (avg < 1 / 58 && this.dpr < Math.min(window.devicePixelRatio || 1, this.maxDpr)) {
      this.dpr = Math.min(this.maxDpr, this.dpr + 0.25);
      this.renderer.setPixelRatio(this.dpr);
      this.resize();
    }
  }
}
