import * as THREE from 'three';
import { shadedSphere, lineMaterial, glowSprite } from '../util.js';

/*
 * Spacetime curvature as a deformed grid (two masses), plus special relativity:
 * a "moving" rod contracts by 1/γ and its clock runs slow by 1/γ relative to the rest clock.
 */
export default function relativity({ tier }) {
  const group = new THREE.Group();
  group.rotation.x = 0.42;

  const N = tier === 'low' ? 36 : 64, SIZE = 26;
  const verts = [];
  for (let i = 0; i <= N; i++)
    for (let j = 0; j < N; j++) {
      const a = -SIZE / 2 + (SIZE * j) / N, b = -SIZE / 2 + (SIZE * (j + 1)) / N, c = -SIZE / 2 + (SIZE * i) / N;
      verts.push(a, 0, c, b, 0, c, c, 0, a, c, 0, b);
    }
  const base = new Float32Array(verts);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
  const grid = new THREE.LineSegments(geo, lineMaterial('#a68d62', 0.32));
  grid.position.y = -1.5;
  group.add(grid);

  const big = shadedSphere({ radius: 1.1, color: '#c69a55', rim: '#ffe6b0', emissive: 0.1 });
  const small = shadedSphere({ radius: 0.45, color: '#9ea6b0', rim: '#ffffff' });
  group.add(big, small);
  big.add(glowSprite('#f3cf8a', 5, 0.25));

  // "light ray" whose path is deflected near the big mass (illustrative geodesic)
  const rayGeo = new THREE.BufferGeometry();
  rayGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(200 * 3), 3));
  const ray = new THREE.Line(rayGeo, lineMaterial('#f6ead0', 0.7));
  group.add(ray);

  // moving rod for length contraction
  const rod = new THREE.Mesh(new THREE.BoxGeometry(4, 0.12, 0.12), new THREE.MeshBasicMaterial({ color: '#e8c987', transparent: true, opacity: 0.9 }));
  const rodRest = new THREE.Mesh(new THREE.BoxGeometry(4, 0.12, 0.12), new THREE.MeshBasicMaterial({ color: '#7f7a70', transparent: true, opacity: 0.6 }));
  const rodGroup = new THREE.Group();
  rodRest.position.y = 0;
  rod.position.y = 0.5;
  rodGroup.add(rod, rodRest);
  rodGroup.position.set(0, 4.2, -2);
  rodGroup.rotation.x = -0.42;
  group.add(rodGroup);

  let beta = 0.6;
  let restClock = 0, movingClock = 0;
  const gamma = () => 1 / Math.sqrt(1 - beta * beta);

  const height = (x, z, bx, bz, sx, sz) => {
    const d1 = Math.hypot(x - bx, z - bz), d2 = Math.hypot(x - sx, z - sz);
    return -2.6 / Math.sqrt(d1 * d1 * 0.5 + 1) - 0.8 / Math.sqrt(d2 * d2 * 0.9 + 0.6);
  };

  let phase = 0;
  return {
    group,
    cameraDistance: 18,
    cameraHeight: 2.5,
    controls: [
      { type: 'range', label: 'Speed of moving clock (v/c)', min: 0, max: 0.995, step: 0.005, value: 0.6, format: (v) => `${v.toFixed(3)} c`, onInput: (v) => (beta = v) },
      { type: 'button', label: 'Reset clocks', onClick: () => { restClock = 0; movingClock = 0; } },
    ],
    readout() {
      return `γ = ${gamma().toFixed(3)} · rest clock ${restClock.toFixed(1)} s · moving clock ${movingClock.toFixed(1)} s · moving rod length ${(4 / gamma()).toFixed(2)} (rest: 4.00)`;
    },
    update(dt, t, env) {
      const slow = env?.timeScale ?? 1;
      phase += dt * 0.25 * slow;
      restClock += dt;
      movingClock += dt / gamma();
      const bx = 0, bz = 0;
      const sx = Math.cos(phase) * 5.2, sz = Math.sin(phase) * 5.2;
      big.position.set(bx, height(bx, bz, bx, bz, sx, sz) - 1.5 + 1.1, bz);
      small.position.set(sx, height(sx, sz, bx, bz, sx, sz) - 1.5 + 0.45, sz);
      const p = geo.attributes.position.array;
      for (let k = 0; k < p.length; k += 3) p[k + 1] = height(base[k], base[k + 2], bx, bz, sx, sz);
      geo.attributes.position.needsUpdate = true;
      // light ray: comes in along x at impact parameter b, bends toward the mass (deflection ∝ 1/b)
      const rp = rayGeo.attributes.position.array;
      const b0 = 2.4;
      const y = 0.2;
      let z = b0, vz = 0;
      for (let i = 0; i < 200; i++) {
        const x = -12 + (24 * i) / 199;
        const d = Math.hypot(x, z);
        vz += (-z / (d * d * d + 0.5)) * 0.12 * 1.2;
        z += vz * 0.12;
        rp.set([x, y + height(x, z, bx, bz, sx, sz) * 0.15 - 1.5 + 0.2, z], i * 3);
      }
      rayGeo.attributes.position.needsUpdate = true;
      rod.scale.x = 1 / gamma();
      big.material.uniforms.uTime.value = t;
    },
  };
}
