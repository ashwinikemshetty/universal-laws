import * as THREE from 'three';
import { glowSprite, gauss } from '../util.js';

/*
 * A hydrogen-like electron in an equal superposition of the 1s and 2p_z states.
 * Points are sampled from ½|ψ₁ₛ|² + ½|ψ₂ₚ|²; each point's brightness is weighted by
 * ρ(x,t)/q(x) = 1 + ψ₁ψ₂ cos(ΔE t) / q, so the cloud's density sloshes up and down exactly as
 * the time-dependent Schrödinger equation predicts for this superposition.
 * "Measure" draws one position with the Born-rule probability and records it.
 */

const psi1s = (r) => Math.exp(-r) / Math.sqrt(Math.PI);
const psi2pz = (r, z) => (z * Math.exp(-r / 2)) / (4 * Math.sqrt(2 * Math.PI));

function gammaInt(k, theta) { // sum of k exponentials
  let s = 0;
  for (let i = 0; i < k; i++) s += -Math.log(1 - Math.random());
  return s * theta;
}
function randDir() {
  const v = new THREE.Vector3(gauss(), gauss(), gauss());
  return v.normalize();
}

export default function superposition({ tier }) {
  const group = new THREE.Group();
  const N = tier === 'low' ? 6000 : 16000;
  const SCALE = 0.5;
  const pos = new Float32Array(N * 3);
  const p1 = new Float32Array(N);
  const p2 = new Float32Array(N);
  const q = new Float32Array(N);

  for (let i = 0; i < N; i++) {
    let x, y, z, r;
    if (i % 2 === 0) {
      r = gammaInt(3, 0.5); // radial density r² e^{-2r}
      const d = randDir();
      x = d.x * r; y = d.y * r; z = d.z * r;
    } else {
      r = gammaInt(5, 1); // radial density r⁴ e^{-r}
      // angular density ∝ cos²θ
      const u = Math.sign(Math.random() - 0.5) * Math.cbrt(Math.random());
      const ph = Math.random() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      x = s * Math.cos(ph) * r; y = s * Math.sin(ph) * r; z = u * r;
    }
    const a = psi1s(r), b = psi2pz(r, z);
    p1[i] = a; p2[i] = b;
    q[i] = 0.5 * a * a + 0.5 * b * b;
    // display: quantisation axis z → screen up (y)
    pos.set([x * SCALE, z * SCALE, y * SCALE], i * 3);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aP1', new THREE.BufferAttribute(p1, 1));
  geo.setAttribute('aP2', new THREE.BufferAttribute(p2, 1));
  geo.setAttribute('aQ', new THREE.BufferAttribute(q, 1));
  const uniforms = { uPhase: { value: 0 }, uDim: { value: 1 }, uPR: { value: Math.min(devicePixelRatio, 2) }, uBranch: { value: 0 } };
  const cloud = new THREE.Points(
    geo,
    new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        uniform float uPhase; uniform float uPR; uniform float uBranch;
        attribute float aP1; attribute float aP2; attribute float aQ;
        varying float vW; varying float vUp;
        void main(){
          // equal amplitudes 1/√2: ρ = ½ψ₁² + ½ψ₂² + ψ₁ψ₂ cos φ
          float rho = 0.5*aP1*aP1 + 0.5*aP2*aP2 + aP1*aP2*cos(uPhase);
          vW = clamp(rho / max(aQ, 1e-6), 0.0, 2.0);
          vec3 p = position;
          p.x += uBranch * sin(position.y * 3.0 + float(gl_VertexID % 5)) * 0.6;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uPR * (30.0 / -mv.z) * (0.6 + vW * 0.6);
          vUp = position.y;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uDim; varying float vW; varying float vUp;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d) * vW * 0.55 * uDim;
          vec3 col = mix(vec3(0.78,0.82,0.9), vec3(0.95,0.82,0.55), smoothstep(-1.5, 1.5, vUp));
          gl_FragColor = vec4(col * a, a);
        }`,
    })
  );
  group.add(cloud);
  const nucleus = glowSprite('#fff3d6', 0.35, 0.9);
  group.add(nucleus);

  // detections
  const MAXD = 600;
  const dpos = new Float32Array(MAXD * 3).fill(999);
  const dgeo = new THREE.BufferGeometry();
  dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dets = new THREE.Points(dgeo, new THREE.PointsMaterial({ size: 0.09, color: '#f6e2b0', transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }));
  group.add(dets);
  let nd = 0;
  const flash = glowSprite('#fff5dc', 1.4, 0);
  group.add(flash);
  let flashLife = 0;
  let collapseLife = 0;
  let upCount = 0;

  const measure = (times = 1) => {
    const phase = uniforms.uPhase.value;
    for (let n = 0; n < times; n++) {
      // rejection-sample an index with probability ∝ ρ/q (≤ 2)
      let i = 0;
      for (let tries = 0; tries < 50; tries++) {
        i = (Math.random() * N) | 0;
        const w = (0.5 * p1[i] ** 2 + 0.5 * p2[i] ** 2 + p1[i] * p2[i] * Math.cos(phase)) / q[i];
        if (Math.random() * 2 < w) break;
      }
      const k = nd++ % MAXD;
      dpos.set([pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]], k * 3);
      if (pos[i * 3 + 1] > 0) upCount++;
      flash.position.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
    }
    dgeo.attributes.position.needsUpdate = true;
    flashLife = 1;
    collapseLife = times === 1 ? 1.2 : 0.4;
  };

  return {
    group,
    cameraDistance: 9,
    controls: [
      { type: 'button', label: 'Measure position', onClick: () => measure(1) },
      { type: 'button', label: 'Measure 100 times', onClick: () => measure(100) },
      { type: 'button', label: 'Clear detections', onClick: () => { dpos.fill(999); dgeo.attributes.position.needsUpdate = true; nd = 0; upCount = 0; } },
    ],
    readout() {
      const total = Math.min(nd, MAXD);
      return total
        ? `${nd} measurements · ${((upCount / nd) * 100).toFixed(0)}% found in the upper half · each measurement records one outcome; the state is re-prepared afterwards`
        : 'Equal superposition of 1s and 2p states · the cloud oscillates at a frequency set by their energy difference';
    },
    setBranch(v) { uniforms.uBranch.value = v; },
    update(dt) {
      uniforms.uPhase.value += dt * 1.1;
      if (collapseLife > 0) {
        collapseLife -= dt;
        uniforms.uDim.value = 0.15 + 0.85 * (1 - Math.max(0, collapseLife) / 1.2);
      } else uniforms.uDim.value = 1;
      if (flashLife > 0) {
        flashLife -= dt;
        flash.material.opacity = Math.max(0, flashLife);
      }
      group.rotation.y += dt * 0.06;
    },
  };
}
