import * as THREE from 'three';
import { lineMaterial, glowSprite } from '../util.js';

/*
 * A plane electromagnetic wave travelling along +x: E oscillates in y (gold),
 * B oscillates in z (silver), in phase and mutually perpendicular. The wavelength slider
 * maps to visible light, 380–750 nm, with frequency f = c / λ shown in the readout.
 */
export default function em() {
  const group = new THREE.Group();
  group.rotation.set(0.25, -0.55, 0);
  const X0 = -8, X1 = 8, SAMPLES = 260, STICKS = 64;
  const C = 299792458;
  let lambdaNm = 550;
  let k = (2 * Math.PI) / 3.2;
  const amp = 1.6;

  const axis = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(X0, 0, 0), new THREE.Vector3(X1 + 0.6, 0, 0)]), lineMaterial('#7a6d58', 0.6));

  const mkCurve = (color, op) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SAMPLES * 3), 3));
    return new THREE.Line(g, lineMaterial(color, op));
  };
  const eCurve = mkCurve('#f0cf8a', 0.95);
  const bCurve = mkCurve('#c3ccd8', 0.85);
  const mkSticks = (color, op) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(STICKS * 6), 3));
    return new THREE.LineSegments(g, lineMaterial(color, op));
  };
  const eSticks = mkSticks('#d8b36c', 0.35);
  const bSticks = mkSticks('#9ea9b8', 0.3);

  // a faint dipole source at the origin of the wave
  const source = glowSprite('#ffe1a0', 1.6, 0.7);
  source.position.x = X0;

  // field lines of a static dipole, drawn faintly behind the wave
  const dipole = new THREE.Group();
  for (let i = 1; i <= 6; i++) {
    const pts = [];
    const Rm = i * 1.1;
    for (let a = 0.08; a < Math.PI - 0.08; a += 0.03) {
      const rr = Rm * Math.sin(a) ** 2;
      pts.push(new THREE.Vector3(rr * Math.sin(a), rr * Math.cos(a), 0));
    }
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMaterial('#6b6150', 0.18));
    const l2 = l.clone();
    l2.scale.x = -1;
    dipole.add(l, l2);
  }
  dipole.position.set(X0, 0, -0.01);
  dipole.rotation.y = Math.PI / 2;

  group.add(axis, eCurve, bCurve, eSticks, bSticks, source, dipole);

  const setLambda = (nm) => {
    lambdaNm = nm;
    // map 380–750 nm to 1.8–4.4 scene units (illustrative scale)
    const sceneL = 1.8 + ((nm - 380) / 370) * 2.6;
    k = (2 * Math.PI) / sceneL;
  };
  setLambda(550);

  return {
    group,
    cameraDistance: 15,
    controls: [
      { type: 'range', label: 'Wavelength (visible light)', min: 380, max: 750, step: 1, value: 550, format: (v) => `${v} nm`, onInput: setLambda },
    ],
    readout() {
      const f = C / (lambdaNm * 1e-9);
      return `λ = ${lambdaNm} nm · f = c/λ = ${(f / 1e12).toFixed(0)} THz · speed = c in every case`;
    },
    update(dt, t) {
      const w = 2.4; // visual angular frequency
      const e = eCurve.geometry.attributes.position.array;
      const b = bCurve.geometry.attributes.position.array;
      for (let i = 0; i < SAMPLES; i++) {
        const x = X0 + ((X1 - X0) * i) / (SAMPLES - 1);
        const front = Math.min(1, Math.max(0, (x - X0) / 1.5));
        const v = Math.sin(k * x - w * t) * amp * front;
        e[i * 3] = x; e[i * 3 + 1] = v; e[i * 3 + 2] = 0;
        b[i * 3] = x; b[i * 3 + 1] = 0; b[i * 3 + 2] = v * 0.8;
      }
      eCurve.geometry.attributes.position.needsUpdate = true;
      bCurve.geometry.attributes.position.needsUpdate = true;
      const es = eSticks.geometry.attributes.position.array;
      const bs = bSticks.geometry.attributes.position.array;
      for (let i = 0; i < STICKS; i++) {
        const x = X0 + ((X1 - X0) * i) / (STICKS - 1);
        const front = Math.min(1, Math.max(0, (x - X0) / 1.5));
        const v = Math.sin(k * x - w * t) * amp * front;
        es.set([x, 0, 0, x, v, 0], i * 6);
        bs.set([x, 0, 0, x, 0, v * 0.8], i * 6);
      }
      eSticks.geometry.attributes.position.needsUpdate = true;
      bSticks.geometry.attributes.position.needsUpdate = true;
      source.material.opacity = 0.5 + 0.25 * Math.sin(w * t);
    },
  };
}
