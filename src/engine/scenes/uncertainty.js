import * as THREE from 'three';
import { lineMaterial } from '../util.js';

/*
 * A minimum-uncertainty Gaussian wave packet ψ(x) = exp(−x²/4σₓ²) e^{ik₀x}, drawn as a helix
 * (x, Re ψ, Im ψ) with its gold envelope. Below it, the silver momentum distribution |φ(p)|²,
 * a Gaussian of width σₚ = ħ / 2σₓ. Narrow one, the other widens: σₓσₚ = ħ/2 (units with ħ = 1).
 */
export default function uncertainty() {
  const group = new THREE.Group();
  group.rotation.set(0.15, -0.35, 0);
  const S = 360;
  let sx = 1.2;
  const k0 = 3.2;

  const mk = (color, op, n = S) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    return new THREE.Line(g, lineMaterial(color, op));
  };
  const helix = mk('#f2d9a2', 0.9);
  const envTop = mk('#c9a35f', 0.6);
  const envBot = mk('#c9a35f', 0.35);
  const momDist = mk('#c3ccd8', 0.9);

  const axisX = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-8, 0, 0), new THREE.Vector3(8, 0, 0)]), lineMaterial('#6d6352', 0.5));
  const momGroup = new THREE.Group();
  momGroup.position.set(0, -3.6, 0);
  const axisP = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-8, 0, 0), new THREE.Vector3(8, 0, 0)]), lineMaterial('#5d6470', 0.5));
  momGroup.add(axisP, momDist);
  const posGroup = new THREE.Group();
  posGroup.position.set(0, 1.0, 0);
  posGroup.add(axisX, helix, envTop, envBot);
  group.add(posGroup, momGroup);

  const draw = (t) => {
    const h = helix.geometry.attributes.position.array;
    const et = envTop.geometry.attributes.position.array;
    const eb = envBot.geometry.attributes.position.array;
    const md = momDist.geometry.attributes.position.array;
    const A = 1.9;
    const sp = 1 / (2 * sx);
    for (let i = 0; i < S; i++) {
      const x = -8 + (16 * i) / (S - 1);
      const env = Math.exp(-(x * x) / (4 * sx * sx));
      const ph = k0 * x - t * 2.0;
      h.set([x, env * Math.cos(ph) * A, env * Math.sin(ph) * A], i * 3);
      et.set([x, env * A, 0], i * 3);
      eb.set([x, -env * A, 0], i * 3);
      // momentum: p maps to the same horizontal axis; centred on k₀ (drawn at 0 for clarity)
      const p = x * 0.75;
      const mom = Math.exp(-(p * p) / (2 * sp * sp));
      md.set([x, mom * 2.2, 0], i * 3);
    }
    [helix, envTop, envBot, momDist].forEach((l) => (l.geometry.attributes.position.needsUpdate = true));
  };

  return {
    group,
    cameraDistance: 15,
    controls: [
      { type: 'range', label: 'Position spread σₓ', min: 0.35, max: 3, step: 0.01, value: 1.2, format: (v) => v.toFixed(2), onInput: (v) => (sx = v) },
    ],
    readout() {
      const sp = 1 / (2 * sx);
      return `σₓ = ${sx.toFixed(2)} · σₚ = ${sp.toFixed(2)} · σₓσₚ = ${(sx * sp).toFixed(2)} ħ — a Gaussian packet sits exactly at the limit ħ/2 (units with ħ = 1)`;
    },
    update(dt, t) {
      draw(t);
    },
  };
}
