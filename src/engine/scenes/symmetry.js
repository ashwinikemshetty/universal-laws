import * as THREE from 'three';
import { lineMaterial, glowSprite } from '../util.js';

/*
 * An icosahedron and its ghost. A symmetry operation (rotation by 72° about a five-fold axis,
 * 120° about a three-fold axis, 180° about a two-fold axis) leaves the shape indistinguishable
 * from its ghost — invariance. A non-symmetry rotation (37°) visibly breaks the match.
 * Around it, a ring of points shows a continuous rotational symmetry: Noether's link to
 * conserved angular momentum.
 */
export default function symmetry() {
  const group = new THREE.Group();
  const ico = new THREE.IcosahedronGeometry(2.4, 0);
  const edges = new THREE.EdgesGeometry(ico);
  const solid = new THREE.LineSegments(edges, lineMaterial('#f0cf8a', 0.95));
  const ghost = new THREE.LineSegments(edges, lineMaterial('#9aa6b5', 0.35));
  const inner = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.DodecahedronGeometry(1.25, 0)), lineMaterial('#c9a35f', 0.5));
  const vertsGeo = new THREE.BufferGeometry();
  vertsGeo.setAttribute('position', ico.attributes.position);
  const verts = new THREE.Points(vertsGeo, new THREE.PointsMaterial({ size: 0.16, color: '#fff2d0', transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }));
  const body = new THREE.Group();
  body.add(solid, verts, inner);
  group.add(ghost, body);
  group.add(glowSprite('#f6dfae', 3, 0.18));

  // continuous symmetry ring
  const ringPts = [];
  const NR = 90;
  for (let i = 0; i < NR; i++) {
    const a = (i / NR) * Math.PI * 2;
    ringPts.push(new THREE.Vector3(Math.cos(a) * 4.6, 0, Math.sin(a) * 4.6));
  }
  const ringObj = new THREE.Points(new THREE.BufferGeometry().setFromPoints(ringPts), new THREE.PointsMaterial({ size: 0.07, color: '#d9c9a8', transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }));
  ringObj.rotation.x = 0.35;
  group.add(ringObj);
  [4.6, 5.2].forEach((rr, i) => {
    const pts = [];
    for (let k = 0; k <= 200; k++) { const a = (k / 200) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * rr, 0, Math.sin(a) * rr)); }
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMaterial('#8d7a58', 0.18 - i * 0.06));
    l.rotation.x = 0.35;
    group.add(l);
  });

  // icosahedron symmetry axes (vertex = five-fold, face centre = three-fold, edge midpoint = two-fold)
  const phi = (1 + Math.sqrt(5)) / 2;
  const AXES = [
    { axis: new THREE.Vector3(0, 1, phi).normalize(), angle: (2 * Math.PI) / 5, name: '72° about a five-fold axis' },
    { axis: new THREE.Vector3(1, 1, 1).normalize(), angle: (2 * Math.PI) / 3, name: '120° about a three-fold axis' },
    { axis: new THREE.Vector3(1, 0, 0), angle: Math.PI, name: '180° about a two-fold axis' },
  ];

  let anim = null;
  let status = 'Choose a transformation. If the gold figure lands exactly on its ghost (its pose before the change), the transformation is a symmetry.';
  let opIndex = 0;
  const run = (axis, angle, isSym, name) => {
    if (anim) return;
    const from = body.quaternion.clone();
    // rotate about the figure's own axis (post-multiply); the ghost keeps the "before" pose
    const to = from.clone().multiply(new THREE.Quaternion().setFromAxisAngle(axis, angle));
    ghost.quaternion.copy(from);
    anim = { from, to, t: 0, isSym, name };
    status = `Applying ${name}…`;
  };

  return {
    group,
    cameraDistance: 13,
    controls: [
      { type: 'button', label: 'Apply a symmetry', onClick: () => { const op = AXES[opIndex++ % AXES.length]; run(op.axis, op.angle, true, op.name); } },
      { type: 'button', label: 'Apply a non-symmetry', onClick: () => run(new THREE.Vector3(0.3, 1, 0.2).normalize(), (37 * Math.PI) / 180, false, 'a 37° rotation') },
      { type: 'button', label: 'Restore', onClick: () => { if (anim) return; body.quaternion.identity(); ghost.quaternion.identity(); status = 'Restored.'; } },
    ],
    readout() {
      return status;
    },
    update(dt) {
      ringObj.rotation.y += dt * 0.15; // continuous symmetry: the ring looks the same at every angle
      if (anim) {
        anim.t = Math.min(1, anim.t + dt * 0.55);
        const k = anim.t < 0.5 ? 4 * anim.t ** 3 : 1 - Math.pow(-2 * anim.t + 2, 3) / 2;
        body.quaternion.slerpQuaternions(anim.from, anim.to, k);
        if (anim.t >= 1) {
          status = anim.isSym
            ? `${anim.name[0].toUpperCase() + anim.name.slice(1)}: indistinguishable from the ghost — invariant. A symmetry.`
            : `${anim.name[0].toUpperCase() + anim.name.slice(1)}: no longer matches its ghost. Not a symmetry.`;
          anim = null;
        }
      }
    },
  };
}
