import '@fontsource/cormorant-garamond/300.css';
import '@fontsource/cormorant-garamond/300-italic.css';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import 'katex/dist/katex.min.css';
import './styles.css';

import { chapters, DIMENSIONS, ROMAN, RETURN_IMAGE } from './content/chapters.js';
import { Ambience } from './audio.js';
import { store } from './ui/store.js';
import { lawHTML, mirrorHTML, mirrorItemHTML, syncKeepButtons } from './ui/folio.js';
import { Orrery } from './ui/orrery.js';
import { renderConstellation, renderConstellationList, downloadConstellation } from './ui/constellation.js';
import { ease, clamp } from './engine/util.js';
import { LEVELS } from './engine/scenes/cosmicScale.js';

/* ════════════════════════════════════════════════════════════════
   Capability detection → quality tier
   ════════════════════════════════════════════════════════════════ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const body = document.body;
const params = new URLSearchParams(location.search);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches || params.has('calm');
const isMobile = () => innerWidth <= 820;

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

function pickTier() {
  if (params.get('tier')) return params.get('tier');
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;
  const touch = matchMedia('(pointer: coarse)').matches;
  if (navigator.connection?.saveData) return 'low';
  if (cores <= 4 || mem <= 3) return 'low';
  if (touch || innerWidth < 900) return 'mid';
  return 'high';
}

const tier = pickTier();
const wantLite = params.has('lite') || !hasWebGL();
if (reducedMotion) body.classList.add('reduced-motion');

let engine;
async function createEngine() {
  const canvas = $('#cosmos');
  if (!wantLite) {
    try {
      const { Engine } = await import('./engine/Engine.js');
      engine = new Engine(canvas, { tier, reducedMotion });
      return;
    } catch (err) {
      console.warn('WebGL engine unavailable, using the lite voyage.', err);
    }
  }
  const { FallbackEngine } = await import('./engine/FallbackEngine.js');
  engine = new FallbackEngine(canvas, { reducedMotion });
  body.classList.add('is-lite');
  const note = $('#lite-note');
  note.hidden = false;
  note.textContent = hasWebGL() ? 'Lite voyage · 3D models off' : 'Lite voyage · this device has no WebGL, so 3D models are replaced with text';
}

/* ════════════════════════════════════════════════════════════════
   State
   ════════════════════════════════════════════════════════════════ */
const audio = new Ambience();
audio.enabled = store.state.sound;
let index = -1;
let busy = false;
let journeyToken = 0; // bumps on every travel so delayed UI from an earlier arrival never shows late
let phase = 'landing'; // landing | voyage | return | here
let lastFocus = null;

/* atmosphere colouring per chapter: a darkened accent and a near-black navy */
function tintsFor(ch) {
  if (ch.id === 'unknown') return ['#0b0a09', '#07090e'];
  const c = parseInt(ch.accent.slice(1), 16);
  const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
  const dark = (k) => `#${[r, g, b].map((v) => Math.round(v * k).toString(16).padStart(2, '0')).join('')}`;
  return [dark(0.2), '#121a2b'];
}

/* ════════════════════════════════════════════════════════════════
   Chapter presentation
   ════════════════════════════════════════════════════════════════ */
function setTab(which) {
  const law = which === 'law';
  $('#tab-law').setAttribute('aria-selected', String(law));
  $('#tab-mirror').setAttribute('aria-selected', String(!law));
  $('#folio-law').hidden = !law;
  $('#folio-mirror').hidden = law;
  $('#folio-body').scrollTop = 0;
}

function renderFolio(i) {
  const ch = chapters[i];
  const nextLabel = i < chapters.length - 1 ? `Travel to ${chapters[i + 1].orbit}` : 'Return home';
  $('#folio-law').innerHTML = lawHTML(ch, i, chapters.length);
  $('#folio-mirror').innerHTML = mirrorHTML(ch, i, chapters.length, nextLabel);
  document.documentElement.style.setProperty('--accent', ch.accent);
  setTab('law');
}

let readoutTimer = 0;
let syncers = [];
function renderInstrument(api) {
  const box = $('#controls');
  box.innerHTML = '';
  syncers = [];
  if (!api || api.fallback) {
    $('#readout').textContent = engine.isFallback ? 'The interactive model needs WebGL. Every word of the chapter is still here.' : '';
    return;
  }
  (api.controls || []).forEach((c, k) => {
    if (c.type === 'button') {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ctl-btn';
      b.textContent = c.label;
      b.addEventListener('click', () => c.onClick());
      box.appendChild(b);
    } else if (c.type === 'toggle') {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ctl-btn';
      b.textContent = c.label;
      let v = !!c.value;
      b.setAttribute('aria-pressed', String(v));
      b.addEventListener('click', () => { v = !v; b.setAttribute('aria-pressed', String(v)); c.onInput(v); });
      box.appendChild(b);
    } else if (c.type === 'range') {
      const id = `ctl-${k}`;
      const wrap = document.createElement('div');
      wrap.className = 'ctl-range';
      wrap.innerHTML = `<label for="${id}"><span>${c.label}</span><output></output></label><input id="${id}" type="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.value}" />`;
      const input = $('input', wrap), out = $('output', wrap);
      const show = (v) => (out.textContent = c.format ? c.format(+v) : v);
      show(c.value);
      let dragging = false;
      input.addEventListener('input', () => { show(input.value); c.onInput(+input.value); });
      input.addEventListener('pointerdown', () => (dragging = true));
      input.addEventListener('pointerup', () => (dragging = false));
      if (c.sync) syncers.push(() => { if (!dragging) { const v = c.sync(); input.value = v; show(v); } });
      box.appendChild(wrap);
    }
  });
  cancelAnimationFrame(readoutTimer);
  let last = 0;
  const tick = (now) => {
    if (now - last > 120 && engine.current?.api === api) {
      last = now;
      $('#readout').textContent = api.readout?.() || '';
      syncers.forEach((f) => f());
    }
    readoutTimer = requestAnimationFrame(tick);
  };
  readoutTimer = requestAnimationFrame(tick);
}

function setImagery(img) {
  const layer = $('#imagery');
  const el = $('img', layer);
  layer.classList.remove('is-on');
  if (!img) return;
  const src = img.src;
  setTimeout(() => {
    el.onload = () => {
      if (el.dataset.src !== src) return;
      layer.classList.add('is-on');
      $('[data-imagery-credit]')?.removeAttribute('hidden');
    };
    el.onerror = () => layer.classList.remove('is-on');
    el.dataset.src = src;
    el.src = src;
  }, 900);
}

function updateHud(i) {
  const ch = chapters[i];
  $('#hud-num').textContent = i >= 0 ? `${ROMAN[i]} / XII` : '';
  $('#hud-region').textContent = i >= 0 ? ch.region : '';
  $$('#ticks button').forEach((b) => {
    if (b.dataset.index === undefined) return;
    const n = +b.dataset.index;
    b.toggleAttribute('aria-current', false);
    if (n === i) b.setAttribute('aria-current', 'step');
    b.classList.toggle('is-visited', store.state.visited.includes(chapters[n].id));
  });
  $('[data-action="prev"]').disabled = i <= 0;
  orrery.setCurrent(i);
}

function showArrival(i, { ghosts = false } = {}) {
  const ch = chapters[i];
  $('#arrival-num').textContent = `Chapter ${ROMAN[i]} · ${ch.region}`;
  $('#arrival-sci').textContent = ch.scientificTitle;
  $('#arrival-poetic').textContent = ch.poeticTitle;
  const gh = $('.arrival-ghosts');
  gh.innerHTML = '';
  if (ghosts && !reducedMotion) {
    // quantum transition: several possible titles, one resolves
    const offs = [[-38, -18], [42, 12], [-20, 30], [30, -26]];
    offs.forEach(([x, y]) => {
      const s = document.createElement('span');
      s.textContent = ch.poeticTitle;
      s.style.transform = `translate(${x}px, ${y}px)`;
      gh.appendChild(s);
      requestAnimationFrame(() => requestAnimationFrame(() => { s.style.transform = 'translate(0,0)'; s.style.opacity = '0'; }));
    });
  }
  $('#arrival').classList.add('is-on');
}
const hideArrival = () => $('#arrival').classList.remove('is-on');

function showFolio(open = true) {
  body.classList.add('has-folio');
  body.classList.toggle('folio-closed', !open);
  if (!open) body.classList.remove('has-folio');
  if (!engine.isFallback) engine.setViewShift(open && !isMobile() ? $('#folio').offsetWidth / 2 : 0, 1.1);
}

function hideChapterUI() {
  body.classList.remove('has-folio', 'has-instrument', 'folio-open', 'folio-closed');
  hideArrival();
  closeNote();
  setImagery(null);
  if (engine && !engine.isFallback) engine.setViewShift(0, 0.9);
}

async function presentChapter(i, { delayFolio = 2.6, ghosts = false } = {}) {
  const ch = chapters[i];
  const token = journeyToken;
  index = i;
  store.visit(ch.id);
  renderFolio(i);
  updateHud(i);
  renderInstrument(engine.current?.api);
  setImagery(ch.imagery);
  audio.chime(i);
  $('#sr-live').textContent = `Arrived: chapter ${i + 1}, ${ch.scientificTitle} — ${ch.poeticTitle}`;
  const [a, b] = tintsFor(ch);
  engine.atmosphere.setTint(a, b);
  body.classList.toggle('is-quiet', ch.id === 'unknown');
  showArrival(i, { ghosts });
  await engine.wait(reducedMotion ? 0.8 : delayFolio);
  if (token !== journeyToken || busy) return;
  hideArrival();
  const api = engine.current?.api;
  if (api && (api.controls?.length || api.fallback)) body.classList.add('has-instrument');
  showFolio(!body.classList.contains('prefers-folio-closed'));
}

/* ════════════════════════════════════════════════════════════════
   Transitions — the heart of the voyage
   ════════════════════════════════════════════════════════════════ */
const par = (...ps) => Promise.all(ps);

function restoreSky() {
  const u = engine.starfield.uniforms;
  u.uAniso.value = 0;
  if (u.uOpacity.value !== 1) engine.tween({ from: u.uOpacity.value, to: 1, duration: 2, onUpdate: (v) => (u.uOpacity.value = v) });
  engine.atmosphere.setOpacity(1);
  audio.setMood(1, 3);
}

const TRANSITIONS = {
  async fade(ch, entry) {
    await engine.depart(0.35);
    engine.commit(entry);
    await engine.arrive(0.4);
  },

  async warp(ch, entry) {
    audio.warp(3.8);
    body.classList.add('is-warping');
    await par(engine.depart(1.3), engine.setWarp(1, 1.7, ease.in), engine.setFov(80, 1.7, ease.in));
    body.classList.add('is-stretch');
    await engine.flyThroughBeacon(1.25, ch.accent);
    engine.commit(entry);
    body.classList.remove('is-stretch', 'is-warping');
    await par(engine.setWarp(0, 2.6, ease.out), engine.setFov(engine.baseFov, 2.6, ease.out), engine.arrive(3));
  },

  async gravity(ch, entry) {
    audio.warp(4);
    body.classList.add('is-bending');
    await par(engine.depart(1.8), engine.setWarp(0.55, 1.8), engine.setFov(68, 1.8));
    await engine.wait(0.3);
    engine.commit(entry);
    // enter orbit: the system swings around us as we fall in
    if (!engine.isFallback) {
      engine.stageRoot.rotation.set(0.5, -2.2, 0);
      engine.rot.x = 0.5; engine.rot.y = -2.2;
      engine.tween({ duration: 4.2, easing: ease.out, onUpdate: (k) => { engine.rot.y = -2.2 * (1 - k); engine.rot.x = 0.5 * (1 - k); } });
    }
    body.classList.remove('is-bending');
    await par(engine.setWarp(0, 2.8, ease.out), engine.setFov(engine.baseFov, 3), engine.arrive(3.4));
  },

  async entropy(ch, entry) {
    audio.warp(4.6);
    const leaving = engine.depart(1.0);
    await engine.latticeScatter(3.2);
    await leaving;
    engine.starfield.uniforms.uWarp.value = 0.15;
    engine.commit(entry);
    await par(engine.setWarp(0, 2), engine.arrive(2.8));
  },

  async relativity(ch, entry) {
    audio.warp(5);
    body.classList.add('is-slowtime');
    const u = engine.starfield.uniforms;
    engine.tween({ from: engine.timeScale, to: 0.08, duration: 1.4, onUpdate: (v) => (engine.timeScale = v) });
    engine.tween({ from: 0, to: 1, duration: 2, onUpdate: (v) => (u.uAniso.value = v) });
    await par(engine.depart(2.4), engine.setWarp(0.75, 2.4), engine.setFov(70, 2.4));
    engine.commit(entry);
    engine.timeScale = 0.1;
    await par(engine.setWarp(0, 3.4, ease.out), engine.setFov(engine.baseFov, 3.4), engine.arrive(3.6));
    engine.tween({ from: 1, to: 0, duration: 2.5, onUpdate: (v) => (u.uAniso.value = v) });
    engine.tween({ from: 0.1, to: 1, duration: 3.5, onUpdate: (v) => (engine.timeScale = v) });
    setTimeout(() => body.classList.remove('is-slowtime'), 4500);
  },

  async quantum(ch, entry) {
    audio.warp(3.4);
    const svg = $('#quantum-branches');
    svg.innerHTML = '';
    const paths = [];
    // possible paths fan out and fork; only one will be realised
    const mkPath = (d, w) => {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', d);
      p.setAttribute('pathLength', '1');
      p.style.strokeWidth = w;
      p.style.strokeDasharray = '1';
      p.style.strokeDashoffset = '1';
      p.style.opacity = '0.4';
      p.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(.22,.61,.36,1), opacity 1.2s';
      svg.appendChild(p);
      paths.push(p);
    };
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      const pt = (r, da = 0) => `${(Math.cos(a + da) * r).toFixed(1)} ${(Math.sin(a + da) * r * 0.62).toFixed(1)}`;
      const bend = (i % 2 ? 1 : -1) * 0.18;
      mkPath(`M0 0 C${pt(10, bend)} ${pt(18, -bend)} ${pt(26)} S${pt(40, bend * 1.5)} ${pt(52, 0.22)}`, 0.09);
      mkPath(`M${pt(26)} C${pt(34, -bend)} ${pt(42, -0.1)} ${pt(54, -0.26)}`, 0.06);
    }
    svg.classList.add('is-on');
    requestAnimationFrame(() => paths.forEach((p, i) => setTimeout(() => (p.style.strokeDashoffset = '0'), i * 60)));
    if (!engine.isFallback) engine.shake = 0.03;
    await par(engine.depart(1.2), engine.setWarp(0.5, 1.2));
    engine.commit(entry);
    // one possibility resolves
    const keep = (Math.random() * paths.length) | 0;
    paths.forEach((p, i) => { p.style.opacity = i === keep ? '1' : '0'; });
    const api = entry.api;
    if (api.setBranch) engine.tween({ from: 1, to: 0, duration: 2.4, easing: ease.out, onUpdate: (v) => api.setBranch(v) });
    engine.shake = 0;
    await par(engine.setWarp(0, 2.2, ease.out), engine.arrive(2.6));
    svg.classList.remove('is-on');
  },

  async scale(ch, entry) {
    audio.warp(3);
    body.classList.add('is-warping');
    await par(engine.depart(1.1), engine.setWarp(1, 1.4, ease.in), engine.setFov(78, 1.4, ease.in));
    engine.commit(entry);
    body.classList.remove('is-warping');
    await par(engine.setWarp(0, 2.2, ease.out), engine.setFov(engine.baseFov, 2.2, ease.out), engine.arrive(2.4));
  },

  async silence(ch, entry) {
    audio.setMood(0.28, 6);
    body.classList.add('is-quiet');
    const u = engine.starfield.uniforms;
    engine.tween({ from: u.uOpacity.value, to: 0.45, duration: 5, onUpdate: (v) => (u.uOpacity.value = v) });
    engine.atmosphere.setOpacity(0.25);
    await par(engine.depart(3), engine.setWarp(0, 3));
    const e1 = $('#edge .edge-1'), e2 = $('#edge .edge-2');
    e1.textContent = ch.lede;
    e2.textContent = ch.edgeLine;
    e1.classList.add('is-on');
    await engine.wait(reducedMotion ? 1.5 : 3.2);
    e2.classList.add('is-on');
    await engine.wait(reducedMotion ? 1.5 : 3.6);
    e1.classList.remove('is-on');
    e2.classList.remove('is-on');
    await engine.wait(1.2);
    engine.commit(entry);
    await engine.arrive(5);
  },
};

async function travel(i) {
  if (busy || i === index || i < 0 || i >= chapters.length) return;
  busy = true;
  journeyToken++;
  body.classList.add('is-traveling');
  hideChapterUI();
  const ch = chapters[i];
  const leaving = index >= 0 ? chapters[index] : null;

  // leaving entropy: the disordered particles stream past and become the next scene's stars
  if (leaving?.id === 'entropy' && engine.current?.api.setScatter && !reducedMotion) {
    const api = engine.current.api;
    engine.setWarp(0.35, 1.8);
    await engine.tween({ duration: 1.8, easing: ease.in, onUpdate: (v) => api.setScatter(v) });
  }
  if (leaving?.id === 'unknown') { restoreSky(); body.classList.remove('is-quiet'); }

  const entry = engine.prepare(ch.id, { notes: ch.notes });
  const type = reducedMotion ? 'fade' : ch.transition;
  await (TRANSITIONS[type] || TRANSITIONS.warp)(ch, entry);
  body.classList.remove('is-traveling');
  busy = false;
  await presentChapter(i, { ghosts: type === 'quantum', delayFolio: ch.id === 'expansion' ? 7 : ch.id === 'unknown' ? 1.2 : 2.6 });
}

/* Landing → first chapter (or any chapter chosen from the map). */
async function launch(target = 0) {
  if (busy) return;
  busy = true;
  journeyToken++;
  phase = 'voyage';
  if (store.state.sound) audio.setEnabled(true);
  audio.setMood(0, 0.4); // the interface becomes silent for a moment
  body.classList.remove('is-landing');
  body.classList.add('is-traveling');
  await engine.wait(reducedMotion ? 0.3 : 1.5);
  audio.setMood(1, 5);
  const ch = chapters[target];
  const entry = engine.prepare(ch.id, { notes: ch.notes });
  if (reducedMotion) {
    engine.commit(entry);
    await engine.arrive(0.4);
  } else {
    engine.starfield.targetSpeed = 40; // stars begin moving
    await engine.wait(1.3);
    audio.warp(5.2);
    await par(engine.setWarp(0.3, 1.4, ease.in), engine.setFov(64, 1.4));
    body.classList.add('is-warping');
    await par(engine.setWarp(1, 1.5, ease.in), engine.setFov(84, 1.5, ease.in)); // particles stretch into light
    body.classList.add('is-stretch');
    await engine.flyThroughBeacon(2.3, ch.accent); // a distant object approaches; we pass through it
    engine.commit(entry);
    body.classList.remove('is-stretch', 'is-warping');
    engine.starfield.targetSpeed = 6;
    await par(engine.setWarp(0, 2.8, ease.out), engine.setFov(engine.baseFov, 2.8, ease.out), engine.arrive(3.2));
  }
  body.classList.add('is-voyage');
  body.classList.remove('is-traveling');
  busy = false;
  await presentChapter(target);
}

/* ════════════════════════════════════════════════════════════════
   The return to Earth
   ════════════════════════════════════════════════════════════════ */
function drawCity(canvas) {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const w = (canvas.width = innerWidth * dpr), h = (canvas.height = innerHeight * dpr);
  const g = canvas.getContext('2d');
  g.clearRect(0, 0, w, h);
  const horizon = h * 0.62;
  let x = 0;
  // skyline silhouettes with scattered warm windows
  while (x < w) {
    const bw = (18 + Math.random() * 60) * dpr;
    const bh = (20 + Math.random() ** 2 * 170) * dpr * (1 - Math.abs(x / w - 0.5) * 0.9);
    g.fillStyle = '#06070a';
    g.fillRect(x, horizon - bh, bw, bh);
    for (let wy = horizon - bh + 6 * dpr; wy < horizon - 4 * dpr; wy += 7 * dpr)
      for (let wx = x + 4 * dpr; wx < x + bw - 4 * dpr; wx += 6 * dpr)
        if (Math.random() < 0.22) {
          g.fillStyle = `rgba(${230 + Math.random() * 25},${180 + Math.random() * 40},${110 + Math.random() * 40},${0.35 + Math.random() * 0.5})`;
          g.fillRect(wx, wy, 1.6 * dpr, 2.2 * dpr);
        }
    x += bw + Math.random() * 6 * dpr;
  }
  // reflections in the water
  const grd = g.createLinearGradient(0, horizon, 0, h);
  grd.addColorStop(0, 'rgba(230,190,120,0.18)');
  grd.addColorStop(1, 'rgba(230,190,120,0)');
  g.fillStyle = grd;
  for (let i = 0; i < 160; i++) g.fillRect(Math.random() * w, horizon + Math.random() * (h - horizon) * 0.6, (4 + Math.random() * 30) * dpr, 1 * dpr);
}

async function startReturn() {
  if (busy) return;
  busy = true;
  journeyToken++;
  phase = 'return';
  hideChapterUI();
  body.classList.add('is-traveling');
  body.classList.remove('is-voyage', 'is-quiet');
  restoreSky();
  audio.setMood(0.7, 4);
  const cap = $('.return-caption');
  const R = $('#return');
  R.classList.remove('is-dark');
  R.setAttribute('aria-hidden', 'false');
  $('#sr-live').textContent = 'Returning home.';

  if (!engine.isFallback) {
    await par(engine.depart(1.6), engine.setWarp(0.4, 1.6));
    const entry = engine.prepare('return');
    entry.api.setImmediate(5);
    engine.commit(entry);
    await par(engine.setWarp(0, 2), engine.arrive(2));
    const api = entry.api;
    api.setTarget(0, reducedMotion ? 2 : 0.42); // travelling backward: web → galaxies → Milky Way → Sun → Earth
    let lastName = '';
    while (api.s > 0.03) {
      const L = LEVELS[clamp(Math.round(api.s), 0, 5)];
      if (L.name !== lastName) { cap.textContent = L.name; lastName = L.name; }
      await engine.wait(0.1);
    }
    cap.textContent = 'Earth';
    await engine.wait(1.2);
    api.setTarget(-0.7, 0.18); // fall toward the planet until it fills the view
    await engine.wait(reducedMotion ? 0.6 : 3.4);
  } else {
    for (const L of [...LEVELS].reverse()) { cap.textContent = L.name; await engine.wait(1.1); }
  }

  const step = async (sel, text, secs) => {
    if (sel) $(sel, R).classList.add('is-on');
    cap.textContent = text;
    await engine.wait(reducedMotion ? 1 : secs);
  };
  await step('.sky-layer', 'Atmosphere', 2.6);
  engine.setStageOpacity?.(0);
  engine.starfield.uniforms.uOpacity.value = 0.2;
  await step('.ocean-layer', 'Ocean', 2.4);
  drawCity($('.city-layer', R));
  await step('.city-layer', 'A city', 2.6);
  await step('.human-layer', 'A person', 3);
  cap.textContent = '';
  R.classList.add('is-dark');
  audio.setMood(0.35, 3);
  await engine.wait(reducedMotion ? 0.8 : 3.4);
  showHere();
  busy = false;
}

/* ════════════════════════════════════════════════════════════════
   You are here
   ════════════════════════════════════════════════════════════════ */
function showHere() {
  phase = 'here';
  const H = $('#here');
  body.classList.remove('is-traveling');
  H.hidden = false;
  $('#return').setAttribute('aria-hidden', 'true');
  const fig = $('.pale-dot', H);
  const img = $('img', fig);
  img.onload = () => (fig.hidden = false);
  img.onerror = () => (fig.hidden = true);
  img.src = RETURN_IMAGE.src;
  $('figcaption', fig).textContent = `${RETURN_IMAGE.caption} · ${RETURN_IMAGE.credit}`;
  const choices = $('.choices', H);
  choices.innerHTML = DIMENSIONS.map((d) => `<button type="button" class="choice" data-dim="${d.key}" aria-pressed="false"><span class="g" aria-hidden="true">${d.glyph}</span><span class="v">${d.verb}</span><span class="n">${countDim(d.key)} kept</span></button>`).join('');
  $('#here-detail').innerHTML = '';
  setTimeout(() => $('#here-title').focus?.(), 600);
  $('#here-title').setAttribute('tabindex', '-1');
  audio.setMood(0.6, 6);
}
const countDim = (k) => store.state.kept.filter((x) => x.dim === k).length;

function showDimension(key) {
  const dim = DIMENSIONS.find((d) => d.key === key);
  $$('.choice').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.dim === key)));
  const kept = store.state.kept.filter((k) => k.dim === key);
  const list = kept.length ? chapters.filter((c) => kept.some((k) => k.chapterId === c.id)) : chapters;
  $('#here-detail').innerHTML = `
    <p class="micro" style="text-align:center;margin-bottom:10px">${kept.length ? `The ${dim.name.toLowerCase()}s you kept` : `Twelve ${dim.name.toLowerCase()}s the voyage offered — keep any that matter`}</p>
    <p class="mirror-disclaimer" style="text-align:center">Reflections inspired by the science — not scientific claims.</p>
    ${list.map((c) => mirrorItemHTML(c, dim, { showChapter: true })).join('')}`;
}

/* ════════════════════════════════════════════════════════════════
   Overlays: orrery, constellation, notes
   ════════════════════════════════════════════════════════════════ */
const orrery = new Orrery({
  svg: $('#orrery-svg'),
  caption: $('#orrery-caption'),
  onSelect: (i) => {
    closeOverlay();
    if (phase === 'landing') launch(i);
    else if (phase === 'here' || phase === 'return') restart(i);
    else travel(i);
  },
});

function openOverlay(id) {
  const o = $(id);
  if (!o.hidden) return;
  $$('.overlay').forEach((x) => { if (x !== o) { x.hidden = true; x.classList.remove('is-on'); } });
  lastFocus = document.activeElement;
  o.hidden = false;
  requestAnimationFrame(() => o.classList.add('is-on'));
  if (id === '#orrery') {
    orrery.setCurrent(index);
    orrery.start(reducedMotion);
    setTimeout(() => orrery.focusCurrent(), 50);
  }
  if (id === '#constellation') {
    renderConstellationView();
    setTimeout(() => $('.close', o).focus(), 50);
  }
}
function closeOverlay() {
  $$('.overlay').forEach((o) => {
    if (o.hidden) return;
    o.classList.remove('is-on');
    setTimeout(() => (o.hidden = true), 500);
  });
  orrery.stop();
  lastFocus?.focus?.({ preventScroll: true });
}
const overlayOpen = () => $$('.overlay').some((o) => !o.hidden);

function renderConstellationView() {
  const { name } = renderConstellation($('#const-svg'));
  renderConstellationList($('#const-list'));
  $('#const-title').textContent = name ? name.title : 'Your Constellation';
  $('#const-sub').textContent = name
    ? `${name.epithet} · ${store.state.kept.length} star${store.state.kept.length === 1 ? '' : 's'}`
    : 'Each reflection you keep becomes a star.';
}

function updateStarCount(bump = false) {
  const c = $('#star-count');
  c.textContent = store.state.kept.length;
  if (bump) { c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
}

function showNote(n) {
  $('#note-title').textContent = n.title;
  $('#note-body').textContent = n.body;
  $('#note').classList.add('is-on');
}
function closeNote() { $('#note').classList.remove('is-on'); }

/* ════════════════════════════════════════════════════════════════
   Wiring
   ════════════════════════════════════════════════════════════════ */
function buildTicks() {
  const ol = $('#ticks');
  ol.innerHTML =
    chapters.map((c, i) => `<li><button type="button" data-index="${i}" aria-label="Chapter ${i + 1}: ${c.scientificTitle}" title="${ROMAN[i]} · ${c.orbit}"></button></li>`).join('') +
    `<li><button type="button" class="is-home" data-action="return" aria-label="Return to Earth" title="Earth · the return"></button></li>`;
}

function setSoundUI() {
  $$('[data-action="toggle-sound"]').forEach((b) => b.setAttribute('aria-pressed', String(store.state.sound)));
  $$('.sound-label').forEach((s) => (s.textContent = store.state.sound ? 'Sound on' : 'Sound off'));
}

async function restart(i = 0) {
  $('#here').hidden = true;
  $('#return').classList.remove('is-dark');
  $$('#return .layer').forEach((l) => l.classList.remove('is-on'));
  restoreSky();
  phase = 'voyage';
  index = -1;
  body.classList.add('is-voyage');
  busy = false;
  await travel(i);
}

function next() {
  if (phase !== 'voyage') return;
  if (index >= chapters.length - 1) startReturn();
  else travel(index + 1);
}
function prev() {
  if (phase !== 'voyage' || index <= 0) return;
  travel(index - 1);
}

document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-action], [data-keep], [data-unkeep], [data-index], [data-dim], [role="tab"]');
  if (!t) return;
  if (t.dataset.index !== undefined) return travel(+t.dataset.index);
  if (t.dataset.keep) {
    const [id, dim] = t.dataset.keep.split(':');
    const added = store.toggleKept(id, dim);
    syncKeepButtons();
    updateStarCount(added);
    if (added) audio.chime(5);
    if (phase === 'here') $$('.choice .n').forEach((n) => (n.textContent = `${countDim(n.closest('.choice').dataset.dim)} kept`));
    return;
  }
  if (t.dataset.unkeep) {
    const [id, dim] = t.dataset.unkeep.split(':');
    store.toggleKept(id, dim);
    renderConstellationView();
    syncKeepButtons();
    updateStarCount();
    return;
  }
  if (t.dataset.dim) return showDimension(t.dataset.dim);
  if (t.getAttribute('role') === 'tab') return setTab(t.id === 'tab-law' ? 'law' : 'mirror');
  switch (t.dataset.action) {
    case 'toggle-sound':
      store.setSound(!store.state.sound);
      audio.setEnabled(store.state.sound);
      setSoundUI();
      break;
    case 'skip-to-map':
      if (store.state.sound) audio.setEnabled(true);
      openOverlay('#orrery');
      break;
    case 'open-orrery': openOverlay('#orrery'); break;
    case 'open-constellation': openOverlay('#constellation'); break;
    case 'close-overlay': closeOverlay(); break;
    case 'close-note': closeNote(); break;
    case 'show-mirror': setTab('mirror'); break;
    case 'show-law': setTab('law'); break;
    case 'next': next(); break;
    case 'prev': prev(); break;
    case 'return': if (phase === 'voyage') startReturn(); break;
    case 'restart': restart(0); break;
    case 'download-constellation': downloadConstellation(); break;
    case 'clear-constellation':
      if (store.state.kept.length && confirm('Remove every star from your constellation?')) {
        store.clearKept();
        renderConstellationView();
        syncKeepButtons();
        updateStarCount();
      }
      break;
    case 'toggle-folio': {
      const open = !body.classList.contains('has-folio');
      body.classList.toggle('prefers-folio-closed', !open);
      showFolio(open);
      break;
    }
  }
});

$('#enter').addEventListener('click', () => launch(0));

// mobile bottom sheet
$('.folio-handle').addEventListener('click', () => {
  const open = !body.classList.contains('folio-open');
  body.classList.toggle('folio-open', open);
  $('.folio-handle').setAttribute('aria-expanded', String(open));
});
$('.folio-tabs').addEventListener('click', () => { if (isMobile()) body.classList.add('folio-open'); });

document.addEventListener('keydown', (e) => {
  const tag = (e.target.tagName || '').toLowerCase();
  const inField = tag === 'input' || tag === 'textarea';
  if (e.key === 'Escape') {
    if (overlayOpen()) return closeOverlay();
    if ($('#note').classList.contains('is-on')) return closeNote();
    if (body.classList.contains('folio-open')) return body.classList.remove('folio-open');
    return;
  }
  if (inField || overlayOpen()) {
    // arrow keys inside the orrery cycle between orbits
    if (overlayOpen() && !$('#orrery').hidden && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      const rings = $$('#orrery-svg .ring-group');
      const k = rings.indexOf(document.activeElement);
      rings[(k + (e.key === 'ArrowRight' ? 1 : -1) + rings.length) % rings.length].focus();
      e.preventDefault();
    }
    return;
  }
  if (phase === 'landing' && (e.key === 'Enter') && document.activeElement === document.body) return launch(0);
  if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  if (e.key.toLowerCase() === 'm' && phase !== 'landing') openOverlay('#orrery');
  if (e.key.toLowerCase() === 'c' && phase !== 'landing') openOverlay('#constellation');
});

// clicking empty space on the canvas closes a note
$('#cosmos').addEventListener('pointerdown', () => closeNote());

const tooltip = $('#tooltip');
addEventListener('pointermove', (e) => {
  tooltip.style.left = `${e.clientX}px`;
  tooltip.style.top = `${e.clientY}px`;
});
addEventListener('resize', () => {
  body.classList.toggle('is-mobile', isMobile());
  if (body.classList.contains('has-folio') && engine && !engine.isFallback) engine.setViewShift(isMobile() ? 0 : $('#folio').offsetWidth / 2, 0.3);
});

/* ════════════════════════════════════════════════════════════════
   Boot
   ════════════════════════════════════════════════════════════════ */
function drawLandingTicks() {
  const g = $('.landing-lines .ticks');
  let html = '';
  for (let d = 0; d < 360; d += 3) {
    const a = (d * Math.PI) / 180, r1 = 560, r2 = d % 30 === 0 ? 540 : 552;
    html += `<line x1="${(Math.cos(a) * r1).toFixed(1)}" y1="${(Math.sin(a) * r1).toFixed(1)}" x2="${(Math.cos(a) * r2).toFixed(1)}" y2="${(Math.sin(a) * r2).toFixed(1)}" />`;
  }
  g.innerHTML = html;
}

(async function boot() {
  body.classList.toggle('is-mobile', isMobile());
  drawLandingTicks();
  buildTicks();
  setSoundUI();
  updateStarCount();
  await createEngine();
  engine.on?.('note', showNote);
  engine.on?.('hover', (n) => {
    tooltip.textContent = n ? n.title : '';
    tooltip.classList.toggle('is-on', !!n);
  });
  engine.on?.('flash', (k) => ($('#flash').style.opacity = String(k)));
  if (location.hash === '#map') openOverlay('#orrery');
})();

store.subscribe(() => updateStarCount());
