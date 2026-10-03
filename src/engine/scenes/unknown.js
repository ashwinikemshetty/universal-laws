import * as THREE from 'three';
import { lineMaterial, rng } from '../util.js';

/*
 * Almost nothing. A map's last ring dissolving into dashes; a faint field of particles that
 * drift without a known cause — a quiet visual for what we have names for but do not understand.
 */
export default function unknown({ tier }) {
  const group = new THREE.Group();
  const r = rng(99);

  // the edge of the map: an orrery ring that fragments as it goes around
  const segs = new THREE.Group();
  const R0 = 5.5;
  for (let i = 0; i < 120; i++) {
    const a0 = (i / 120) * Math.PI * 2;
    const frag = i / 120;
    if (frag > 0.45 && r() < (frag - 0.45) * 1.8) continue;
    const len = (Math.PI * 2) / 120 * (1 - Math.max(0, frag - 0.45) * 1.3);
    const pts = [];
    for (let k = 0; k <= 4; k++) {
      const a = a0 + (len * k) / 4;
      pts.push(new THREE.Vector3(Math.cos(a) * R0, Math.sin(a) * R0, 0));
    }
    segs.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMaterial('#a99a7c', 0.4 * (1 - Math.max(0, frag - 0.45)))));
  }
  segs.rotation.x = 1.2;
  group.add(segs);

  const N = tier === 'low' ? 400 : 1200;
  const pos = new Float32Array(N * 3);
  const vel = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pos.set([(r() - 0.5) * 22, (r() - 0.5) * 14, (r() - 0.5) * 14], i * 3);
    vel.set([(r() - 0.5) * 0.06, (r() - 0.5) * 0.06, (r() - 0.5) * 0.06], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.05, color: '#9b937f', transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending }));
  group.add(dust);

  return {
    group,
    cameraDistance: 15,
    quiet: true,
    controls: [],
    readout() { return ''; },
    update(dt, t) {
      for (let i = 0; i < N * 3; i++) pos[i] += vel[i] * dt * (1 + 0.5 * Math.sin(t * 0.1 + i));
      geo.attributes.position.needsUpdate = true;
      segs.rotation.z += dt * 0.01;
    },
  };
}
