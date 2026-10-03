import { chapters, DIMENSIONS, ROMAN } from '../content/chapters.js';
import { store } from './store.js';
import { rng } from '../engine/util.js';

/*
 * The personal constellation: every reflection kept during the voyage becomes a star.
 * Angle = chapter (12 sectors), radius = dimension (feeling → belief, inner → outer).
 * The name is generated from the pattern of choices — a poetic artifact, explicitly not a
 * description of personality.
 */
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  parent?.appendChild(e);
  return e;
};

const ARCHETYPE = { feeling: 'The Witness', thought: 'The Observer', action: 'The Wayfinder', belief: 'The Keeper' };
const EPITHET = {
  motion: 'the Turning Path', gravity: 'the Steady Orbit', energy: 'the Unspent Fire', entropy: 'the Kept Garden',
  em: 'the Unseen Light', relativity: 'Many Frames', superposition: 'the Open Cloud', uncertainty: 'the Gentle Limit',
  causality: 'the Long Consequence', expansion: 'the Widening Dark', symmetry: 'the Enduring Form', unknown: 'the Uncharted Edge',
};
const RADIUS = { feeling: 110, thought: 175, action: 240, belief: 305 };

export function constellationName(kept) {
  if (!kept.length) return null;
  const byDim = {};
  const byCh = {};
  kept.forEach((k) => {
    byDim[k.dim] = (byDim[k.dim] || 0) + 1;
    byCh[k.chapterId] = (byCh[k.chapterId] || 0) + 1;
  });
  const dims = Object.entries(byDim).sort((a, b) => b[1] - a[1]);
  const balanced = dims.length === 4 && dims[0][1] - dims[3][1] <= 1 && kept.length >= 4;
  let title;
  if (kept.some((k) => k.chapterId === 'unknown') && kept.length <= 4) title = 'The Seeker';
  else if (balanced) title = 'The Navigator';
  else title = ARCHETYPE[dims[0][0]];
  // epithet: the most-kept chapter; ties go to the later chapter in the voyage
  const order = chapters.map((c) => c.id);
  const topCh = Object.entries(byCh).sort((a, b) => b[1] - a[1] || order.indexOf(b[0]) - order.indexOf(a[0]))[0][0];
  return { title, epithet: `of ${EPITHET[topCh]}` };
}

export function starPositions(kept) {
  const order = chapters.map((c) => c.id);
  const dimOrder = DIMENSIONS.map((d) => d.key);
  return [...kept]
    .sort((a, b) => order.indexOf(a.chapterId) - order.indexOf(b.chapterId) || dimOrder.indexOf(a.dim) - dimOrder.indexOf(b.dim))
    .map((k) => {
      const ci = order.indexOf(k.chapterId);
      const r = rng(ci * 7 + dimOrder.indexOf(k.dim) * 131 + 3);
      const a = -Math.PI / 2 + (ci / 12) * Math.PI * 2 + (r() - 0.5) * 0.28;
      const rad = RADIUS[k.dim] + (r() - 0.5) * 34;
      return { ...k, x: Math.cos(a) * rad * 1.35, y: Math.sin(a) * rad * 0.95, size: 2.4 + r() * 2.2, ci };
    });
}

export function renderConstellation(svg, { forExport = false } = {}) {
  svg.innerHTML = '';
  const kept = store.state.kept;
  const name = constellationName(kept);
  if (forExport) {
    el('rect', { x: -500, y: -360, width: 1000, height: 720, fill: '#050506' }, svg);
  }
  // guides: faint dimension rings + chapter spokes
  Object.values(RADIUS).forEach((rad) => el('ellipse', { cx: 0, cy: 0, rx: rad * 1.35, ry: rad * 0.95, fill: 'none', stroke: 'rgba(239,230,210,0.06)' }, svg));
  for (let i = 0; i < 12; i++) {
    const a = -Math.PI / 2 + (i / 12) * Math.PI * 2;
    const t = el('text', { x: Math.cos(a) * 340 * 1.35, y: Math.sin(a) * 340 * 0.95 + 3, 'text-anchor': 'middle', fill: 'rgba(239,230,210,0.22)', 'font-family': 'Inter, sans-serif', 'font-size': 10, 'letter-spacing': 2 }, svg);
    t.textContent = ROMAN[i];
  }

  if (!kept.length) {
    const t = el('text', { x: 0, y: 0, 'text-anchor': 'middle', fill: 'rgba(239,230,210,0.5)', 'font-family': 'Cormorant Garamond, serif', 'font-style': 'italic', 'font-size': 26 }, svg);
    t.textContent = 'No stars yet. Keep a reflection in any Human Mirror.';
    return { name: null, stars: [] };
  }

  const stars = starPositions(kept);
  // a path through the stars in voyage order, plus links between same-dimension neighbours
  const d = stars.map((s, i) => `${i ? 'L' : 'M'}${s.x.toFixed(1)} ${s.y.toFixed(1)}`).join(' ');
  if (stars.length > 1) el('path', { d, fill: 'none', stroke: 'rgba(201,163,95,0.42)', 'stroke-width': 1 }, svg);
  DIMENSIONS.forEach((dim) => {
    const same = stars.filter((s) => s.dim === dim.key);
    for (let i = 1; i < same.length; i++) {
      if (same[i].ci - same[i - 1].ci <= 3) {
        el('line', { x1: same[i - 1].x, y1: same[i - 1].y, x2: same[i].x, y2: same[i].y, stroke: 'rgba(239,230,210,0.14)', 'stroke-dasharray': '2 4' }, svg);
      }
    }
  });
  stars.forEach((s, i) => {
    const g = el('g', { transform: `translate(${s.x.toFixed(1)} ${s.y.toFixed(1)})` }, svg);
    el('circle', { r: s.size * 4.5, fill: 'rgba(201,163,95,0.12)' }, g);
    el('circle', { r: s.size, fill: '#fff3d6' }, g);
    if (!forExport) {
      const anim = el('animate', { attributeName: 'opacity', values: '1;0.55;1', dur: `${3 + (i % 4)}s`, repeatCount: 'indefinite' });
      g.appendChild(anim);
    }
    const ch = chapters.find((c) => c.id === s.chapterId);
    const dim = DIMENSIONS.find((x) => x.key === s.dim);
    const label = el('text', { x: 10, y: -8, fill: 'rgba(239,230,210,0.5)', 'font-family': 'Inter, sans-serif', 'font-size': 9, 'letter-spacing': 1.6 }, g);
    label.textContent = `${dim.name.toUpperCase()} · ${ch.mirror[s.dim].label}`;
    const title = el('title', {}, g);
    title.textContent = `${dim.name} — ${ch.mirror[s.dim].text}`;
  });
  if (forExport && name) {
    const t1 = el('text', { x: 0, y: -318, 'text-anchor': 'middle', fill: '#efe6d2', 'font-family': 'Cormorant Garamond, Georgia, serif', 'font-size': 34, 'letter-spacing': 8 }, svg);
    t1.textContent = name.title.toUpperCase();
    const t2 = el('text', { x: 0, y: -290, 'text-anchor': 'middle', fill: '#c9a35f', 'font-family': 'Cormorant Garamond, Georgia, serif', 'font-style': 'italic', 'font-size': 18 }, svg);
    t2.textContent = name.epithet;
    const t3 = el('text', { x: 0, y: 345, 'text-anchor': 'middle', fill: 'rgba(239,230,210,0.4)', 'font-family': 'Inter, sans-serif', 'font-size': 9, 'letter-spacing': 3 }, svg);
    t3.textContent = 'COSMIC CODEX · A REFLECTION ARTIFACT, NOT A PERSONALITY DESCRIPTION';
  }
  return { name, stars };
}

export function renderConstellationList(list) {
  const stars = starPositions(store.state.kept);
  list.innerHTML = stars
    .map((s) => {
      const ch = chapters.find((c) => c.id === s.chapterId);
      const dim = DIMENSIONS.find((d) => d.key === s.dim);
      return `<li><span class="micro">${dim.name} · ${ROMAN[s.ci]} ${ch.orbit}</span><p>${ch.mirror[s.dim].text}</p>
        <button type="button" data-unkeep="${s.chapterId}:${s.dim}" aria-label="Remove this star">×</button></li>`;
    })
    .join('');
}

export async function downloadConstellation() {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('xmlns', NS);
  svg.setAttribute('viewBox', '-500 -360 1000 720');
  svg.setAttribute('width', '2000');
  svg.setAttribute('height', '1440');
  renderConstellation(svg, { forExport: true });
  const data = new XMLSerializer().serializeToString(svg);
  const url = URL.createObjectURL(new Blob([data], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
    const c = document.createElement('canvas');
    c.width = 2000; c.height = 1440;
    c.getContext('2d').drawImage(img, 0, 0);
    const a = document.createElement('a');
    a.download = 'my-cosmic-constellation.png';
    a.href = c.toDataURL('image/png');
    a.click();
  } catch {
    // fall back to the vector file
    const a = document.createElement('a');
    a.download = 'my-cosmic-constellation.svg';
    a.href = url;
    a.click();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
}
