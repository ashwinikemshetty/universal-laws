import * as THREE from 'three';

export const PALETTE = {
  obsidian: new THREE.Color('#050506'),
  charcoal: new THREE.Color('#14141a'),
  navy: new THREE.Color('#0a0e18'),
  ivory: new THREE.Color('#efe6d2'),
  gold: new THREE.Color('#c9a35f'),
  bronze: new THREE.Color('#a8774a'),
  silver: new THREE.Color('#b9c0c9'),
};

let _glowTex = null;
export function glowTexture() {
  if (_glowTex) return _glowTex;
  const s = 128;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.18, 'rgba(255,255,255,0.55)');
  grd.addColorStop(0.45, 'rgba(255,255,255,0.12)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, s, s);
  _glowTex = new THREE.CanvasTexture(c);
  _glowTex.colorSpace = THREE.SRGBColorSpace;
  return _glowTex;
}

export function glowSprite(color = '#e8d3a2', size = 1, opacity = 1) {
  const m = new THREE.SpriteMaterial({
    map: glowTexture(),
    color: new THREE.Color(color),
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const s = new THREE.Sprite(m);
  s.scale.setScalar(size);
  return s;
}

/** Soft additive point cloud material with per-vertex colour and size attenuation. */
export function pointsMaterial({ size = 0.06, opacity = 1, color = null } = {}) {
  return new THREE.PointsMaterial({
    size,
    map: glowTexture(),
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: !color,
    color: color ? new THREE.Color(color) : 0xffffff,
    sizeAttenuation: true,
  });
}

export function lineMaterial(color = '#c9a35f', opacity = 0.5) {
  return new THREE.LineBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

export function circlePoints(r, n = 128, y = 0) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
  }
  return pts;
}

export function ring(r, color, opacity = 0.4, n = 160) {
  const g = new THREE.BufferGeometry().setFromPoints(circlePoints(r, n));
  return new THREE.Line(g, lineMaterial(color, opacity));
}

/** Physically-flavoured shaded sphere with a soft rim — used for planets, masses, moons. */
export function shadedSphere({ radius = 1, color = '#c9a35f', rim = '#f2e2bb', emissive = 0.0, segments = 64 } = {}) {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uRim: { value: new THREE.Color(rim) },
      uLight: { value: new THREE.Vector3(-0.6, 0.5, 0.8).normalize() },
      uEmissive: { value: emissive },
      uOpacity: { value: 1 },
      uTime: { value: 0 },
    },
    transparent: true,
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main(){
        vN = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position,1.0);
        vV = normalize(-mv.xyz);
        vP = position;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform vec3 uRim; uniform vec3 uLight; uniform float uEmissive; uniform float uOpacity; uniform float uTime;
      varying vec3 vN; varying vec3 vV; varying vec3 vP;
      float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719))) * 43758.5453); }
      void main(){
        float diff = max(dot(vN, uLight), 0.0);
        float fres = pow(1.0 - max(dot(vN, vV), 0.0), 3.0);
        float bands = 0.04 * sin(vP.y * 9.0 + sin(vP.x * 3.0 + uTime * 0.1) * 1.5);
        vec3 base = uColor * (0.06 + diff * 0.9 + bands);
        vec3 col = base + uRim * fres * 0.85 + uColor * uEmissive;
        col += (hash(vP * 40.0) - 0.5) * 0.015;
        gl_FragColor = vec4(col, uOpacity);
      }`,
  });
  return new THREE.Mesh(new THREE.SphereGeometry(radius, segments, segments / 2), mat);
}

export function disposeObject(obj) {
  obj.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => {
        if (m.map && m.map !== _glowTex) m.map.dispose();
        m.dispose();
      });
    }
  });
}

/** Set opacity on every material in a subtree, remembering each material's own base opacity. */
export function setGroupOpacity(obj, k) {
  obj.traverse((o) => {
    const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    mats.forEach((m) => {
      if (m.userData.baseOpacity === undefined) {
        m.userData.baseOpacity = m.uniforms?.uOpacity ? m.uniforms.uOpacity.value : m.opacity;
      }
      const v = m.userData.baseOpacity * k;
      if (m.uniforms?.uOpacity) m.uniforms.uOpacity.value = v;
      else {
        m.opacity = v;
        m.transparent = true;
      }
    });
  });
}

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const ease = {
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out: (t) => 1 - Math.pow(1 - t, 3),
  in: (t) => t * t * t,
  expoOut: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
};

/** Gaussian random (Box–Muller). */
export function gauss() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Seeded RNG so scenes look the same on every visit. */
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
