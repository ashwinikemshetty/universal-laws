import { chapters, ROMAN } from '../content/chapters.js';
import { store } from './store.js';

/*
 * The Cosmic Orrery — an astronomical instrument as navigation. Twelve tilted orbits, one per
 * region; each carries a body moving at a Keplerian rate (inner orbits faster, T ∝ r^1.5).
 * Hover or focus an orbit to read it; click, tap or press Enter to travel.
 */
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  parent?.appendChild(e);
  return e;
};

export class Orrery {
  constructor({ svg, caption, onSelect }) {
    this.svg = svg;
    this.caption = caption;
    this.onSelect = onSelect;
    this.current = -1;
    this.rings = [];
    this.raf = 0;
    this._build();
  }

  _build() {
    const svg = this.svg;
    svg.innerHTML = '';
    const TILT = -14;
    const world = el('g', { transform: `rotate(${TILT})` }, svg);

    // degree scale on the outermost frame
    const scale = el('g', { class: 'scale' }, svg);
    for (let d = 0; d < 360; d += 5) {
      const a = (d * Math.PI) / 180;
      const r1 = 478, r2 = d % 30 === 0 ? 462 : 470;
      el('line', { x1: Math.cos(a) * r1, y1: Math.sin(a) * r1, x2: Math.cos(a) * r2, y2: Math.sin(a) * r2 }, scale);
      if (d % 30 === 0) {
        const t = el('text', { x: Math.cos(a) * 448, y: Math.sin(a) * 448 + 3, 'text-anchor': 'middle' }, scale);
        t.textContent = `${d}°`;
      }
    }
    el('circle', { cx: 0, cy: 0, r: 480, fill: 'none', stroke: 'rgba(239,230,210,0.08)' }, scale);

    // the centre: the observer
    el('circle', { cx: 0, cy: 0, r: 26, fill: 'rgba(201,163,95,0.08)' }, world);
    el('circle', { cx: 0, cy: 0, r: 5, class: 'sun' }, world);
    const sl = el('text', { x: 0, y: 46, class: 'sun-label', transform: `rotate(${-TILT} 0 46)` }, world);
    sl.textContent = 'you';

    const golden = Math.PI * (3 - Math.sqrt(5));
    chapters.forEach((ch, i) => {
      const rx = 64 + i * 32;
      const ry = rx * 0.5;
      const g = el('g', { class: 'ring-group', tabindex: 0, role: 'button', 'aria-label': `Travel to ${ch.orbit}: ${ch.scientificTitle} — ${ch.poeticTitle}` }, world);
      el('ellipse', { cx: 0, cy: 0, rx, ry, class: 'orbit' }, g);
      el('ellipse', { cx: 0, cy: 0, rx, ry, class: 'orbit-hit' }, g);
      const orb = el('g', { class: 'orb' }, g);
      el('circle', { r: 14, class: 'halo' }, orb);
      el('circle', { r: 3.2 + (i % 3) * 0.8, class: 'body' }, orb);
      const label = el('text', { x: 14, y: -12 }, orb);
      label.textContent = `${ROMAN[i]} · ${ch.orbit}`;
      const ring = { g, orb, label, rx, ry, phase: i * golden * 2.2, speed: 0.22 * Math.pow(64 / rx, 1.5), i };
      this.rings.push(ring);

      const hot = () => { g.classList.add('is-hot'); this._caption(i); };
      const cold = () => { g.classList.remove('is-hot'); this._caption(this.current); };
      g.addEventListener('pointerenter', hot);
      g.addEventListener('pointerleave', cold);
      g.addEventListener('focus', hot);
      g.addEventListener('blur', cold);
      g.addEventListener('click', () => this.onSelect(i));
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.onSelect(i); }
      });
    });
    this._place(0);
  }

  _caption(i) {
    if (i < 0) { this.caption.innerHTML = ''; return; }
    const ch = chapters[i];
    this.caption.innerHTML = `<p class="micro">Orbit ${ROMAN[i]} · ${ch.scientificTitle}</p><p>${ch.poeticTitle}</p>`;
  }

  _place(dt) {
    const TILT = 14 * (Math.PI / 180);
    for (const r of this.rings) {
      r.phase += dt * r.speed;
      const x = Math.cos(r.phase) * r.rx, y = Math.sin(r.phase) * r.ry;
      // counter-rotate the label so it stays level despite the tilted world
      r.orb.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${(TILT * 180) / Math.PI})`);
    }
  }

  setCurrent(i) {
    this.current = i;
    this.rings.forEach((r) => {
      r.g.classList.toggle('is-current', r.i === i);
      r.g.classList.toggle('is-visited', store.state.visited.includes(chapters[r.i].id));
    });
    this._caption(i);
  }

  start(reducedMotion) {
    cancelAnimationFrame(this.raf);
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      this._place(reducedMotion ? 0 : dt);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop() { cancelAnimationFrame(this.raf); }

  focusCurrent() {
    const r = this.rings[Math.max(0, this.current)];
    r?.g.focus({ preventScroll: true });
  }
}
