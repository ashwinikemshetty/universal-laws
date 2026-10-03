import * as THREE from 'three';
import { glowSprite, glowTexture, rng } from './util.js';

/*
 * The ambient universe around the traveller: nebula veils, near dust and a distant galaxy.
 * Everything is subtle by design.
 */

const nebulaFrag = /* glsl */ `
  uniform float uTime; uniform vec3 uTintA; uniform vec3 uTintB; uniform float uOpacity; uniform float uSeed;
  varying vec2 vUv;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    float a = hash(i), b = hash(i+vec2(1,0)), c = hash(i+vec2(0,1)), d = hash(i+vec2(1,1));
    vec2 u = f*f*(3.0-2.0*f);
    return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
  }
  float fbm(vec2 p){
    float v = 0.0, a = 0.5;
    for(int i=0;i<5;i++){ v += a*noise(p); p = p*2.03 + vec2(1.7,9.2); a *= 0.5; }
    return v;
  }
  void main(){
    vec2 p = vUv * 3.0 + uSeed;
    float t = uTime * 0.012;
    vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2,1.3) - t));
    float n = fbm(p + 2.4*q);
    float mask = smoothstep(0.5, 0.0, length(vUv - 0.5));
    float dens = smoothstep(0.35, 0.95, n) * mask;
    vec3 col = mix(uTintA, uTintB, smoothstep(0.3, 0.9, q.x));
    float a = dens * uOpacity;
    // colours are authored in display (sRGB) space; linearise so the output encoding doesn't lift them into grey haze
    gl_FragColor = vec4(pow(col * a, vec3(2.2)), a);
  }`;

export class Atmosphere {
  constructor(tier = 'high') {
    this.group = new THREE.Group();
    this.tier = tier;
    this.tintA = new THREE.Color('#2a2016');
    this.tintB = new THREE.Color('#141a28');
    this.targetA = this.tintA.clone();
    this.targetB = this.tintB.clone();
    this.veils = [];

    const r = rng(7);
    const veilCount = tier === 'low' ? 2 : 4;
    for (let i = 0; i < veilCount; i++) {
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uTintA: { value: this.tintA },
          uTintB: { value: this.tintB },
          uOpacity: { value: 0.6 - i * 0.1 },
          uSeed: { value: r() * 50 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: nebulaFrag,
      });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), mat);
      m.position.set((r() - 0.5) * 500, (r() - 0.5) * 260, -700 - i * 160);
      m.rotation.z = r() * Math.PI;
      m.userData.baseOpacity = mat.uniforms.uOpacity.value;
      this.veils.push(m);
      this.group.add(m);
    }

    // a far galaxy: soft elliptical glow with a core
    this.galaxy = new THREE.Group();
    const halo = glowSprite('#d8c7a0', 220, 0.18);
    halo.scale.set(260, 90, 1);
    const core = glowSprite('#fff1cf', 40, 0.5);
    this.galaxy.add(halo, core);
    this.galaxy.position.set(-260, 130, -1100);
    this.galaxy.rotation.z = 0.4;
    this.group.add(this.galaxy);

    // near dust (gives parallax and the sense of moving through a medium)
    const dustCount = tier === 'low' ? 300 : 900;
    const pos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      pos[i * 3] = (r() - 0.5) * 80;
      pos[i * 3 + 1] = (r() - 0.5) * 50;
      pos[i * 3 + 2] = -r() * 120;
    }
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.dust = new THREE.Points(
      dg,
      new THREE.PointsMaterial({
        size: 0.22,
        map: glowTexture(),
        color: new THREE.Color('#c9b48d'),
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    this.group.add(this.dust);

  }

  setTint(a, b) {
    this.targetA.set(a);
    this.targetB.set(b);
  }

  setOpacity(k) {
    this.veils.forEach((v) => (v.material.uniforms.uOpacity.value = v.userData.baseOpacity * k));
  }

  update(dt, t, speed) {
    this.tintA.lerp(this.targetA, Math.min(1, dt * 0.8));
    this.tintB.lerp(this.targetB, Math.min(1, dt * 0.8));
    this.veils.forEach((v) => (v.material.uniforms.uTime.value = t));
    // dust drifts toward the camera with travel speed and recycles
    const p = this.dust.geometry.attributes.position;
    const dz = Math.min(speed, 400) * dt * 0.35 + dt * 0.4;
    for (let i = 0; i < p.count; i++) {
      let z = p.getZ(i) + dz;
      if (z > 2) z -= 120;
      p.setZ(i, z);
    }
    p.needsUpdate = true;
    this.galaxy.rotation.z += dt * 0.002;
  }
}
