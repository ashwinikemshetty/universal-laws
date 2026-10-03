import * as THREE from 'three';
import { shadedSphere, lineMaterial, glowSprite } from '../util.js';

/*
 * A pendulum integrates θ'' = −(g/L) sin θ − b θ'. Kinetic and potential energy trade places;
 * with friction on, the "lost" energy is tracked as heat, so the total stays constant.
 */
export default function energy() {
  const group = new THREE.Group();
  const L = 4.6, g = 9.81, m = 1;
  const pivot = new THREE.Vector3(0, 3.2, 0);
  let theta = 1.05, omega = 0, damping = 0, heat = 0;
  const E0 = () => m * g * L * (1 - Math.cos(1.05));

  const pivotDot = glowSprite('#efe2c2', 0.6, 0.8);
  pivotDot.position.copy(pivot);
  const rodGeo = new THREE.BufferGeometry().setFromPoints([pivot, pivot.clone()]);
  const rod = new THREE.Line(rodGeo, lineMaterial('#d8c49a', 0.7));
  const bob = shadedSphere({ radius: 0.45, color: '#c9a35f', rim: '#fff0c8', segments: 48 });
  const bobGlow = glowSprite('#ffd98f', 3, 0.0);
  bob.add(bobGlow);

  // arc of possible positions
  const arcPts = [];
  for (let i = 0; i <= 80; i++) {
    const a = -1.1 + (2.2 * i) / 80;
    arcPts.push(new THREE.Vector3(pivot.x + Math.sin(a) * L, pivot.y - Math.cos(a) * L, 0));
  }
  const arc = new THREE.Line(new THREE.BufferGeometry().setFromPoints(arcPts), lineMaterial('#7c6c52', 0.35));

  // heat particles drifting from the pivot / air when friction is on
  const HP = 260;
  const hp = new Float32Array(HP * 3);
  const hv = new Float32Array(HP * 3);
  const hlife = new Float32Array(HP);
  for (let i = 0; i < HP; i++) hp[i * 3 + 1] = 999;
  const heatGeo = new THREE.BufferGeometry();
  heatGeo.setAttribute('position', new THREE.BufferAttribute(hp, 3));
  const heatPts = new THREE.Points(heatGeo, new THREE.PointsMaterial({ size: 0.08, color: '#c56f3c', transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
  let hpIndex = 0;

  // energy bars as thin pillars
  const barGroup = new THREE.Group();
  barGroup.position.set(6.2, -2.6, 0);
  const mkBar = (x, color) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1, 0.32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 }));
    mesh.position.x = x;
    barGroup.add(mesh);
    return mesh;
  };
  const barK = mkBar(0, '#f0d398');
  const barP = mkBar(0.6, '#a9b3bf');
  const barH = mkBar(1.2, '#c56f3c');
  const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.0, 5.2, 0.6)), lineMaterial('#6f6450', 0.4));
  frame.position.set(0.6, 2.6, 0);
  barGroup.add(frame);

  group.add(pivotDot, rod, bob, arc, heatPts, barGroup);

  let K = 0, P = 0;
  return {
    group,
    cameraDistance: 15,
    controls: [
      { type: 'toggle', label: 'Friction', value: false, onInput: (v) => (damping = v ? 0.22 : 0) },
      { type: 'button', label: 'Release again', onClick: () => { theta = 1.05; omega = 0; heat = 0; } },
    ],
    readout() {
      const tot = K + P + heat || 1;
      return `Kinetic ${((K / tot) * 100).toFixed(0)}% · Potential ${((P / tot) * 100).toFixed(0)}% · Heat ${((heat / tot) * 100).toFixed(0)}% · Total ${(tot / E0() * 100).toFixed(1)}%`;
    },
    update(dt) {
      dt = Math.min(dt, 0.05);
      const sub = 6;
      for (let s = 0; s < sub; s++) {
        const h = dt / sub;
        const alpha = -(g / L) * Math.sin(theta) - damping * omega;
        omega += alpha * h;
        theta += omega * h;
        // energy removed by friction this substep becomes heat
        heat += damping * omega * omega * m * L * L * h;
      }
      K = 0.5 * m * (L * omega) ** 2;
      P = m * g * L * (1 - Math.cos(theta));
      const pos = new THREE.Vector3(pivot.x + Math.sin(theta) * L, pivot.y - Math.cos(theta) * L, 0);
      bob.position.copy(pos);
      const rp = rodGeo.attributes.position;
      rp.setXYZ(1, pos.x, pos.y, pos.z);
      rp.needsUpdate = true;
      const tot = E0();
      bobGlow.material.opacity = Math.min(0.75, (K / tot) * 0.8);
      const setBar = (bar, v) => {
        const h = Math.max(0.001, (v / tot) * 5);
        bar.scale.y = h;
        bar.position.y = h / 2;
      };
      setBar(barK, K);
      setBar(barP, P);
      setBar(barH, heat);

      // emit heat motes proportional to dissipation
      if (damping > 0 && Math.random() < Math.min(1, Math.abs(omega) * 0.8)) {
        const i = hpIndex++ % HP;
        hp.set([pos.x + (Math.random() - 0.5) * 0.6, pos.y + (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6], i * 3);
        hv.set([(Math.random() - 0.5) * 0.6, 0.4 + Math.random() * 0.6, (Math.random() - 0.5) * 0.6], i * 3);
        hlife[i] = 2.5;
      }
      for (let i = 0; i < HP; i++) {
        if (hlife[i] > 0) {
          hlife[i] -= dt;
          hp[i * 3] += hv[i * 3] * dt;
          hp[i * 3 + 1] += hv[i * 3 + 1] * dt;
          hp[i * 3 + 2] += hv[i * 3 + 2] * dt;
          if (hlife[i] <= 0) hp[i * 3 + 1] = 999;
        }
      }
      heatGeo.attributes.position.needsUpdate = true;
    },
  };
}
