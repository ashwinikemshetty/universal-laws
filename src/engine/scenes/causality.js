import * as THREE from 'three';
import { lineMaterial, glowSprite, rng } from '../util.js';

/*
 * A spacetime diagram with two spatial dimensions (x, z) and time vertical (y), in units where c = 1.
 * The central event's future and past light cones are 45° cones. Clicking an event classifies the
 * interval to the centre: timelike (inside), lightlike (on), or spacelike (outside — no causal link).
 * A cause→effect chain propagates through the future cone at sub-light speed.
 */
export default function causality() {
  const group = new THREE.Group();
  group.rotation.set(0.18, 0.5, 0);
  const H = 4.2;

  const coneMat = (color, op) =>
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
  const future = new THREE.Mesh(new THREE.ConeGeometry(H, H, 64, 1, true), coneMat('#c9a35f', 0.07));
  future.rotation.x = Math.PI;
  future.position.y = H / 2;
  const past = new THREE.Mesh(new THREE.ConeGeometry(H, H, 64, 1, true), coneMat('#8e9aa8', 0.06));
  past.position.y = -H / 2;
  group.add(future, past);

  // cone generators (edge lines) and rims
  const lines = new THREE.Group();
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const x = Math.cos(a) * H, z = Math.sin(a) * H;
    lines.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-x, -H, -z), new THREE.Vector3(x, H, z)]), lineMaterial('#b39462', 0.12)));
  }
  const rim = (y, c) => {
    const pts = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * H, y, Math.sin(a) * H));
    }
    lines.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMaterial(c, 0.45)));
  };
  rim(H, '#d8b36c');
  rim(-H, '#9aa6b5');
  // time axis
  lines.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -H - 0.8, 0), new THREE.Vector3(0, H + 0.8, 0)]), lineMaterial('#efe2c2', 0.35)));
  // "now" plane outline
  const nowPts = [];
  for (let i = 0; i <= 128; i++) {
    const a = (i / 128) * Math.PI * 2;
    nowPts.push(new THREE.Vector3(Math.cos(a) * 6, 0, Math.sin(a) * 6));
  }
  lines.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(nowPts), lineMaterial('#6c6458', 0.25)));
  group.add(lines);

  const origin = glowSprite('#fff2d0', 0.9, 1);
  group.add(origin);

  // events scattered through spacetime
  const r = rng(21);
  const events = [];
  for (let i = 0; i < 26; i++) {
    const t = (r() - 0.5) * 2 * H * 0.95;
    const rad = r() * 5.6;
    const a = r() * Math.PI * 2;
    const p = new THREE.Vector3(Math.cos(a) * rad, t, Math.sin(a) * rad);
    const s = glowSprite('#d9cdb4', 0.45, 0.75);
    s.position.copy(p);
    s.userData.event = p;
    group.add(s);
    events.push(s);
  }

  // link line from centre to the selected event
  const linkGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
  const link = new THREE.Line(linkGeo, new THREE.LineDashedMaterial({ color: '#f0d398', dashSize: 0.2, gapSize: 0.12, transparent: true, opacity: 0 }));
  group.add(link);
  let selected = null;
  let verdict = 'Click any event to test whether the central event could influence it.';

  // a cause → effect chain moving through the future cone at 0.6 c
  const chain = glowSprite('#ffe1a0', 0.55, 0.9);
  group.add(chain);
  const chainTrailGeo = new THREE.BufferGeometry();
  chainTrailGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(60 * 3), 3));
  const chainTrail = new THREE.Line(chainTrailGeo, lineMaterial('#e8c27a', 0.5));
  group.add(chainTrail);
  let chainT = 0;

  const classify = (p) => {
    const ds2 = -p.y * p.y + p.x * p.x + p.z * p.z; // c = 1
    if (Math.abs(ds2) < 0.15) return ['lightlike', 'On the light cone: only a light-speed signal could connect them.', '#fff2d0'];
    if (ds2 < 0) {
      return p.y > 0
        ? ['timelike', 'Inside the future cone: the centre CAN influence this event. Every observer agrees on the order.', '#f0cf8a']
        : ['timelike', 'Inside the past cone: this event CAN have influenced the centre.', '#b9c4d2'];
    }
    return ['spacelike', 'Outside both cones: no signal can connect them. Observers may even disagree on which came first.', '#9a6b5a'];
  };

  return {
    group,
    cameraDistance: 16,
    cameraHeight: 1.5,
    pickables: events,
    onPick(sprite) {
      if (selected) selected.material.color.set('#d9cdb4');
      selected = sprite;
      const p = sprite.userData.event;
      const [kind, text, color] = classify(p);
      sprite.material.color.set(color);
      linkGeo.setFromPoints([new THREE.Vector3(), p.clone()]);
      link.computeLineDistances();
      link.material.color.set(color);
      link.material.opacity = 0.9;
      link.material.dashSize = kind === 'spacelike' ? 0.08 : 10;
      link.material.gapSize = kind === 'spacelike' ? 0.16 : 0;
      const ds2 = -p.y * p.y + p.x * p.x + p.z * p.z;
      verdict = `Δs² = ${ds2.toFixed(2)} → ${kind}. ${text}`;
      return true;
    },
    readout() {
      return verdict;
    },
    update(dt, t) {
      chainT += dt * 0.35;
      if (chainT > 1) chainT = 0;
      // world line of a slower-than-light signal: dx/dt = 0.6
      const tt = chainT * H;
      const a = 0.9;
      const pos = new THREE.Vector3(Math.cos(a) * 0.6 * tt, tt, Math.sin(a) * 0.6 * tt);
      chain.position.copy(pos);
      const tr = chainTrailGeo.attributes.position.array;
      for (let i = 0; i < 60; i++) {
        const k = (i / 59) * tt;
        tr.set([Math.cos(a) * 0.6 * k, k, Math.sin(a) * 0.6 * k], i * 3);
      }
      chainTrailGeo.attributes.position.needsUpdate = true;
      origin.material.opacity = 0.75 + 0.25 * Math.sin(t * 2);
    },
  };
}
