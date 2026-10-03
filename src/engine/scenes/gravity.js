import * as THREE from 'three';
import { shadedSphere, ring, glowSprite, lineMaterial } from '../util.js';

/*
 * A massive body with moons on Keplerian orbits (ω ∝ r^-3/2), and beneath it a grid
 * curved by the mass — a visual aid for general relativity's spacetime curvature.
 */
export default function gravity({ tier }) {
  const group = new THREE.Group();
  group.rotation.x = 0.32;

  const mass = shadedSphere({ radius: 1.5, color: '#b88b4a', rim: '#ffe2a6', emissive: 0.08, segments: 72 });
  group.add(mass);
  const halo = glowSprite('#f1c983', 7, 0.35);
  group.add(halo);

  const orbits = [];
  const radii = [2.8, 4.1, 5.6, 7.4];
  radii.forEach((rad, i) => {
    const g = new THREE.Group();
    g.rotation.x = (i - 1.5) * 0.06;
    g.rotation.z = (i % 2 ? 1 : -1) * 0.04;
    const orbitLine = ring(rad, '#c9a35f', 0.22 - i * 0.03, 200);
    const moon = shadedSphere({ radius: 0.12 + (i % 3) * 0.07, color: ['#9aa1a9', '#c9b48d', '#8c7a63', '#b0b6bd'][i], rim: '#ffffff', segments: 32 });
    g.add(orbitLine, moon);
    group.add(g);
    orbits.push({ g, moon, rad, phase: i * 1.9, orbitLine });
  });

  // curvature grid
  const N = tier === 'low' ? 34 : 56;
  const SIZE = 20;
  const gridGeo = new THREE.BufferGeometry();
  const verts = [];
  for (let i = 0; i <= N; i++) {
    for (let j = 0; j < N; j++) {
      const a = -SIZE / 2 + (SIZE * j) / N, b = -SIZE / 2 + (SIZE * (j + 1)) / N, c = -SIZE / 2 + (SIZE * i) / N;
      verts.push(a, 0, c, b, 0, c); // lines along x
      verts.push(c, 0, a, c, 0, b); // lines along z
    }
  }
  const base = new Float32Array(verts);
  gridGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
  const grid = new THREE.LineSegments(gridGeo, lineMaterial('#8d7a58', 0.28));
  grid.position.y = -2.2;
  group.add(grid);

  let M = 1;
  const deform = () => {
    const p = gridGeo.attributes.position.array;
    for (let k = 0; k < p.length; k += 3) {
      const x = base[k], z = base[k + 2];
      const r2 = x * x + z * z;
      p[k + 1] = (-3.2 * M) / Math.sqrt(r2 * 0.45 + 1.2) + 0.9 * M;
    }
    gridGeo.attributes.position.needsUpdate = true;
  };
  deform();

  return {
    group,
    cameraDistance: 17,
    cameraHeight: 2.2,
    controls: [
      {
        type: 'range', label: 'Central mass', min: 0.4, max: 2, step: 0.01, value: 1,
        format: (v) => `${v.toFixed(2)} M`,
        onInput: (v) => {
          M = v;
          deform();
          mass.scale.setScalar(0.7 + v * 0.3);
          halo.scale.setScalar(5 + v * 2.5);
        },
      },
    ],
    readout() {
      // T ∝ r^(3/2) / sqrt(M); normalised so the inner moon has T = 1
      const t0 = Math.pow(radii[0], 1.5);
      return 'Orbital periods (inner = 1): ' + radii.map((r) => (Math.pow(r, 1.5) / t0).toFixed(2)).join(' · ') + '  — Kepler: T² ∝ r³ / M';
    },
    update(dt, t) {
      mass.rotation.y += dt * 0.05;
      mass.material.uniforms.uTime.value = t;
      for (const o of orbits) {
        const w = 0.9 * Math.sqrt(M) * Math.pow(o.rad, -1.5) * 2.5;
        o.phase += w * dt;
        o.moon.position.set(Math.cos(o.phase) * o.rad, 0, Math.sin(o.phase) * o.rad);
      }
      halo.material.opacity = 0.3 + 0.05 * Math.sin(t * 0.7);
    },
  };
}
