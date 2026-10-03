import * as THREE from 'three';
import { shadedSphere, lineMaterial, rng, glowSprite } from '../util.js';

/*
 * Newton's laws: bodies drift in straight lines (first law). A deliberate force changes
 * the probe's momentum (second law). "Push apart" shows equal and opposite impulses (third law).
 */
export default function motion() {
  const group = new THREE.Group();
  const r = rng(11);
  const BOUND = 9;
  const TRAIL = 90;
  const bodies = [];

  const make = (radius, color, mass, pos, vel, isProbe = false) => {
    const mesh = shadedSphere({ radius, color, rim: '#f4e6c4', segments: 40 });
    mesh.position.copy(pos);
    const trailGeo = new THREE.BufferGeometry();
    const arr = new Float32Array(TRAIL * 3);
    for (let i = 0; i < TRAIL; i++) arr.set([pos.x, pos.y, pos.z], i * 3);
    trailGeo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const trail = new THREE.Line(trailGeo, lineMaterial(isProbe ? '#e7c27a' : '#8f8676', isProbe ? 0.55 : 0.22));
    group.add(mesh, trail);
    const b = { mesh, trail, vel, mass, radius, isProbe, tick: 0 };
    bodies.push(b);
    return b;
  };

  for (let i = 0; i < 8; i++) {
    const pos = new THREE.Vector3((r() - 0.5) * 16, (r() - 0.5) * 8, (r() - 0.5) * 6);
    const vel = new THREE.Vector3((r() - 0.5) * 1.1, (r() - 0.5) * 0.5, (r() - 0.5) * 0.3);
    const rad = 0.15 + r() * 0.35;
    make(rad, ['#6f6658', '#8a7a62', '#5c5f66', '#7d6a55'][i % 4], rad ** 3 * 30, pos, vel);
  }
  const probe = make(0.42, '#c9a35f', 3, new THREE.Vector3(-6, -0.6, 0), new THREE.Vector3(1.0, 0.12, 0), true);
  const probeGlow = glowSprite('#f0d398', 2.2, 0.35);
  probe.mesh.add(probeGlow);

  // force arrow (appears briefly when a force is applied)
  const arrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 2, 0xf0d398, 0.45, 0.25);
  arrow.line.material.transparent = true;
  arrow.cone.material.transparent = true;
  arrow.visible = false;
  group.add(arrow);
  let arrowLife = 0;

  const applyImpulse = (body, impulse) => {
    body.vel.addScaledVector(impulse, 1 / body.mass);
  };

  const pushApart = () => {
    // two bodies receive equal and opposite impulses; the lighter one changes velocity more
    const a = probe;
    const b = bodies.filter((x) => !x.isProbe).sort((x, y) => x.mesh.position.distanceTo(a.mesh.position) - y.mesh.position.distanceTo(a.mesh.position))[0];
    const dir = b.mesh.position.clone().sub(a.mesh.position).normalize();
    const J = 2.2;
    applyImpulse(a, dir.clone().multiplyScalar(-J));
    applyImpulse(b, dir.clone().multiplyScalar(J));
    showArrow(a.mesh.position, dir.clone().negate());
    lastEvent = `Equal and opposite impulse: Δv(probe) = ${(J / a.mass).toFixed(2)}, Δv(rock) = ${(J / b.mass).toFixed(2)}`;
    eventLife = 5;
  };

  const showArrow = (origin, dir) => {
    arrow.position.copy(origin);
    arrow.setDirection(dir.normalize());
    arrow.visible = true;
    arrowLife = 1.6;
  };

  const deliberateForce = () => {
    // perpendicular nudge: turn the probe's path
    const v = probe.vel.clone();
    const perp = new THREE.Vector3(-v.y, v.x, 0.25).normalize();
    const impulse = perp.multiplyScalar(2.6);
    applyImpulse(probe, impulse);
    showArrow(probe.mesh.position, impulse.clone());
    lastEvent = 'A deliberate force changed the momentum — and therefore the path.';
    eventLife = 5;
  };

  let lastEvent = '';
  let eventLife = 0;

  return {
    group,
    cameraDistance: 15,
    controls: [
      { type: 'button', label: 'Apply a deliberate force', onClick: deliberateForce },
      { type: 'button', label: 'Push apart (third law)', onClick: pushApart },
    ],
    readout() {
      const p = probe.vel.length() * probe.mass;
      return eventLife > 0 ? lastEvent : `Probe momentum |p| = ${p.toFixed(2)} · net force = 0 · velocity unchanged`;
    },
    update(dt, t) {
      dt = Math.min(dt, 0.05);
      eventLife -= dt;
      for (const b of bodies) {
        b.mesh.position.addScaledVector(b.vel, dt);
        // wrap around softly inside a box (the box is not a force — it is just the camera's window)
        let wrapped = false;
        for (const ax of ['x', 'y', 'z']) {
          const lim = ax === 'x' ? BOUND : ax === 'y' ? BOUND * 0.6 : BOUND * 0.5;
          if (b.mesh.position[ax] > lim) { b.mesh.position[ax] = -lim; wrapped = true; }
          if (b.mesh.position[ax] < -lim) { b.mesh.position[ax] = lim; wrapped = true; }
        }
        const arr = b.trail.geometry.attributes.position.array;
        if (wrapped) {
          for (let i = 0; i < TRAIL; i++) arr.set([b.mesh.position.x, b.mesh.position.y, b.mesh.position.z], i * 3);
        } else if ((b.tick += dt) > 0.04) {
          b.tick = 0;
          arr.copyWithin(3, 0, (TRAIL - 1) * 3);
          arr[0] = b.mesh.position.x; arr[1] = b.mesh.position.y; arr[2] = b.mesh.position.z;
        }
        b.trail.geometry.attributes.position.needsUpdate = true;
        b.mesh.rotation.y += dt * 0.2;
        b.mesh.material.uniforms.uTime.value = t;
      }
      if (arrow.visible) {
        arrowLife -= dt;
        arrow.position.copy(probe.mesh.position);
        const o = Math.max(0, Math.min(1, arrowLife));
        arrow.line.material.opacity = o;
        arrow.cone.material.opacity = o;
        if (arrowLife <= 0) arrow.visible = false;
      }
      probeGlow.material.opacity = 0.25 + 0.1 * Math.sin(t * 2);
    },
  };
}
