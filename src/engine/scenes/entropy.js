import * as THREE from 'three';
import { lineMaterial, rng } from '../util.js';

/*
 * Particles start in a perfect lattice in one corner of a box and random-walk.
 * The readout is a coarse-grained entropy: S = −Σ pᵢ ln pᵢ over a 4×4×4 grid of cells,
 * normalised by its maximum (ln 64). "Maintain" pulls particles back into order — and
 * counts the work spent doing it.
 */
export default function entropy({ tier }) {
  const group = new THREE.Group();
  group.rotation.set(0.35, -0.5, 0);
  const SIDE = tier === 'low' ? 8 : 11;
  const N = SIDE * SIDE * SIDE;
  const BOX = 4.5;
  const r = rng(3);

  const pos = new Float32Array(N * 3);
  const home = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const gold = new THREE.Color('#e6c584'), silver = new THREE.Color('#aab4c0');
  let k = 0;
  for (let x = 0; x < SIDE; x++)
    for (let y = 0; y < SIDE; y++)
      for (let z = 0; z < SIDE; z++) {
        const hx = -BOX + 0.3 + x * 0.36, hy = -BOX + 0.3 + y * 0.36, hz = -BOX + 0.3 + z * 0.36;
        home.set([hx, hy, hz], k * 3);
        pos.set([hx, hy, hz], k * 3);
        const c = gold.clone().lerp(silver, (x + y + z) / (3 * SIDE));
        col.set([c.r, c.g, c.b], k * 3);
        k++;
      }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({ size: 0.075, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending });
  const points = new THREE.Points(geo, mat);
  const box = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(BOX * 2, BOX * 2, BOX * 2)), lineMaterial('#8a7756', 0.35));
  group.add(points, box);

  let mode = 'diffuse'; // or 'maintain'
  let work = 0;
  let scatter = 0; // used by the entropy transition: particles fly outward to become stars
  let S = 0;
  const counts = new Float32Array(64);

  const computeS = () => {
    counts.fill(0);
    for (let i = 0; i < N; i++) {
      const cx = Math.min(3, Math.max(0, Math.floor(((pos[i * 3] + BOX) / (2 * BOX)) * 4)));
      const cy = Math.min(3, Math.max(0, Math.floor(((pos[i * 3 + 1] + BOX) / (2 * BOX)) * 4)));
      const cz = Math.min(3, Math.max(0, Math.floor(((pos[i * 3 + 2] + BOX) / (2 * BOX)) * 4)));
      counts[cx * 16 + cy * 4 + cz]++;
    }
    let s = 0;
    for (let i = 0; i < 64; i++) if (counts[i]) { const p = counts[i] / N; s -= p * Math.log(p); }
    return s / Math.log(64);
  };

  let frame = 0;
  return {
    group,
    cameraDistance: 16,
    controls: [
      { type: 'button', label: 'Maintain order', onClick: () => (mode = 'maintain') },
      { type: 'button', label: 'Let it drift', onClick: () => (mode = 'diffuse') },
    ],
    readout() {
      return `Coarse-grained entropy S/S_max = ${S.toFixed(3)} · work spent maintaining order: ${work.toFixed(0)} units`;
    },
    /** 0..1 — used by the entropy transition to blow the lattice outward into a starfield */
    setScatter(v) { scatter = v; },
    update(dt) {
      dt = Math.min(dt, 0.05);
      const step = 0.9 * Math.sqrt(dt);
      for (let i = 0; i < N; i++) {
        const j = i * 3;
        if (scatter > 0) {
          const dx = pos[j], dy = pos[j + 1], dz = pos[j + 2];
          const l = Math.hypot(dx, dy, dz) + 0.01;
          const s = scatter * scatter * 60 * dt;
          pos[j] += (dx / l) * s; pos[j + 1] += (dy / l) * s; pos[j + 2] += (dz / l) * s + s * 0.5;
          continue;
        }
        if (mode === 'maintain') {
          const ex = home[j] - pos[j], ey = home[j + 1] - pos[j + 1], ez = home[j + 2] - pos[j + 2];
          const pull = Math.min(1, dt * 2.2);
          pos[j] += ex * pull; pos[j + 1] += ey * pull; pos[j + 2] += ez * pull;
          work += Math.hypot(ex, ey, ez) * pull * 0.6;
        }
        // thermal jiggle always present
        pos[j] += (r() - 0.5) * step * (mode === 'maintain' ? 0.25 : 1);
        pos[j + 1] += (r() - 0.5) * step * (mode === 'maintain' ? 0.25 : 1);
        pos[j + 2] += (r() - 0.5) * step * (mode === 'maintain' ? 0.25 : 1);
        for (let a = 0; a < 3; a++) {
          if (pos[j + a] > BOX) pos[j + a] = 2 * BOX - pos[j + a];
          if (pos[j + a] < -BOX) pos[j + a] = -2 * BOX - pos[j + a];
        }
      }
      geo.attributes.position.needsUpdate = true;
      if (frame++ % 6 === 0) S = computeS();
      box.material.opacity = 0.35 * (1 - scatter);
    },
  };
}
