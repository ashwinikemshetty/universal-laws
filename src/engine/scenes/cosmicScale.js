import * as THREE from 'three';
import { glowSprite, lineMaterial, ring, rng, gauss, shadedSphere, clamp } from '../util.js';

/*
 * Powers of ten. Six nested levels — Earth, Earth–Moon, Solar System, Milky Way, Local Group,
 * cosmic web — each drawn at scale R^(i − s), where s is a continuous "zoom" parameter.
 * Each level knows where its child sits (offset oᵢ), so the levels stay nested as you zoom.
 * Distances between levels are compressed so they can share a screen; labels give real scales.
 *
 * Used twice: outward for COSMIC EXPANSION, and in reverse for the RETURN TO EARTH.
 */

export const LEVELS = [
  { name: 'Earth', scale: '12,742 km across' },
  { name: 'Earth & Moon', scale: '384,400 km · light takes 1.3 seconds' },
  { name: 'The Solar System', scale: 'Sun to Neptune ≈ 4.5 billion km · 4.2 light-hours' },
  { name: 'The Milky Way', scale: '≈ 100,000 light-years across · 100–400 billion stars' },
  { name: 'The Local Group', scale: '≈ 10 million light-years · more than 80 galaxies' },
  { name: 'The Cosmic Web', scale: 'filaments hundreds of millions of light-years long' },
];

const R = 10;

function earthMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uLight: { value: new THREE.Vector3(-0.8, 0.35, 0.6).normalize() }, uOpacity: { value: 1 } },
    transparent: true,
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vP; varying vec3 vV;
      void main(){ vN = normalize(normalMatrix*normal); vP = position; vec4 mv = modelViewMatrix*vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform vec3 uLight; uniform float uOpacity;
      varying vec3 vN; varying vec3 vP; varying vec3 vV;
      float h(vec3 p){ return fract(sin(dot(p, vec3(17.1,113.7,41.3)))*43758.5453); }
      float n3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
        return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
                   mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }
      float fbm(vec3 p){ float v=0.0,a=0.5; for(int i=0;i<5;i++){ v+=a*n3(p); p*=2.07; a*=0.5;} return v; }
      void main(){
        vec3 p = normalize(vP);
        float land = smoothstep(0.52, 0.56, fbm(p*2.2 + 3.0));
        float clouds = smoothstep(0.55, 0.8, fbm(p*3.5 + vec3(uTime*0.01,0.0,0.0)));
        float d = dot(vN, uLight);
        float day = smoothstep(-0.15, 0.25, d);
        vec3 ocean = vec3(0.02,0.05,0.09);
        vec3 ground = mix(vec3(0.22,0.19,0.13), vec3(0.42,0.36,0.24), fbm(p*8.0));
        vec3 col = mix(ocean, ground, land) * (0.05 + 1.0*max(d,0.0));
        vec3 r = reflect(-uLight, vN);
        col += (1.0-land) * pow(max(dot(r, vV),0.0), 40.0) * 0.5 * day;
        col = mix(col, vec3(0.9,0.88,0.82)*max(d,0.0)+0.02, clouds*0.7);
        float lights = step(0.86, h(floor(p*180.0))) * land * (1.0-day) * (1.0-clouds);
        col += vec3(1.0,0.78,0.42) * lights * 0.9;
        float fres = pow(1.0 - max(dot(vN, vV), 0.0), 2.5);
        col += vec3(0.55,0.68,0.85) * fres * (0.15 + 0.75*day);
        gl_FragColor = vec4(col, uOpacity);
      }`,
  });
}

function buildEarth() {
  const g = new THREE.Group();
  const earth = new THREE.Mesh(new THREE.SphereGeometry(1.2, 96, 64), earthMaterial());
  earth.rotation.z = 0.41;
  g.add(earth);
  const atmo = glowSprite('#9fb6d6', 3.4, 0.22);
  g.add(atmo);
  g.userData.earth = earth;
  return g;
}

function buildMoon() {
  const g = new THREE.Group();
  g.add(ring(3.8, '#b9c0c9', 0.3));
  const moon = shadedSphere({ radius: 0.33, color: '#a7a399', rim: '#ffffff', segments: 40 });
  moon.position.set(3.8, 0, 0);
  g.add(moon);
  g.userData.moon = moon;
  return g;
}

function buildSolar(r) {
  const g = new THREE.Group();
  const sun = glowSprite('#ffd890', 1.4, 1);
  g.add(sun, glowSprite('#f6b860', 4.5, 0.25));
  const radii = [0.55, 0.85, 1.2, 1.65, 2.25, 2.85, 3.4, 3.95];
  const planets = [];
  radii.forEach((rad, i) => {
    g.add(ring(rad, '#c9a35f', i === 2 ? 0.45 : 0.18, 160));
    const p = glowSprite(i === 2 ? '#9ec3ff' : '#e9dcc0', i === 2 ? 0.22 : 0.15, 0.95);
    const a = r() * Math.PI * 2;
    p.position.set(Math.cos(a) * rad, 0, Math.sin(a) * rad);
    p.userData.a = a; p.userData.r = rad;
    g.add(p);
    planets.push(p);
  });
  // Earth's position (index 2) is where the inner levels live
  g.userData.childOffset = planets[2].position.clone();
  // fix earth angle so it never moves (keeps nesting exact); others drift slowly
  planets[2].userData.fixed = true;
  g.userData.planets = planets;
  g.rotation.x = 0.35;
  return g;
}

function buildGalaxy(r, tier) {
  const g = new THREE.Group();
  const N = tier === 'low' ? 7000 : 18000;
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const core = new THREE.Color('#f7e2b4'), arm = new THREE.Color('#aeb8c8'), dust = new THREE.Color('#b08a5c');
  for (let i = 0; i < N; i++) {
    let x, y, z, c;
    if (i < N * 0.22) {
      const rr = Math.abs(gauss()) * 0.55;
      const d = new THREE.Vector3(gauss(), gauss() * 0.55, gauss()).normalize().multiplyScalar(rr);
      x = d.x; y = d.y; z = d.z; c = core;
    } else {
      const armIdx = i % 4;
      const rad = 0.4 + Math.pow(r(), 0.8) * 3.8;
      const twist = Math.log(rad + 0.2) * 2.6;
      const base = (armIdx / 4) * Math.PI * 2 + (armIdx % 2 ? 0.25 : 0);
      const a = base + twist + gauss() * (armIdx % 2 ? 0.3 : 0.18);
      x = Math.cos(a) * rad; z = Math.sin(a) * rad; y = gauss() * 0.06;
      c = r() < 0.12 ? dust : arm.clone().lerp(core, Math.max(0, 1 - rad / 2.5));
    }
    pos.set([x, y, z], i * 3);
    col.set([c.r, c.g, c.b], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.035, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
  g.add(pts, glowSprite('#f5d9a0', 2.2, 0.4));
  const sunAt = new THREE.Vector3(2.1, 0, 0.9);
  const marker = glowSprite('#ffffff', 0.12, 1);
  marker.position.copy(sunAt);
  g.add(marker);
  g.userData.childOffset = sunAt;
  g.rotation.x = 0.55;
  return g;
}

function buildGroup(r) {
  const g = new THREE.Group();
  const home = new THREE.Vector3(1.3, 0.1, 0.7);
  for (let i = 0; i < 70; i++) {
    const p = i === 0 ? home : new THREE.Vector3(gauss() * 1.9, gauss() * 0.9, gauss() * 1.9);
    if (i > 0 && p.distanceTo(home) < 0.4) continue;
    const s = glowSprite(r() < 0.3 ? '#e8d6b0' : '#c9cdd4', 0.1 + r() * 0.25, 0.5 + r() * 0.4);
    s.material.rotation = r() * Math.PI;
    s.scale.set(s.scale.x * (1 + r()), s.scale.y, 1);
    s.position.copy(p);
    g.add(s);
  }
  // Andromeda — the largest neighbour
  const andro = glowSprite('#f0dfbd', 0.6, 0.7);
  andro.scale.set(0.9, 0.35, 1);
  andro.position.set(-0.6, 0.4, -0.5);
  g.add(andro);
  g.userData.childOffset = home;
  return g;
}

function buildWeb(r, tier) {
  const g = new THREE.Group();
  const nodes = [];
  for (let i = 0; i < 46; i++) nodes.push(new THREE.Vector3((r() - 0.5) * 9, (r() - 0.5) * 6, (r() - 0.5) * 9));
  const pts = [];
  const N = tier === 'low' ? 9000 : 22000;
  const edges = [];
  nodes.forEach((n, i) => {
    const near = nodes.map((m, j) => [m.distanceTo(n), j]).filter(([, j]) => j !== i).sort((a, b) => a[0] - b[0]).slice(0, 3);
    near.forEach(([, j]) => edges.push([i, j]));
  });
  for (let k = 0; k < N; k++) {
    if (k % 5 === 0) {
      const n = nodes[(r() * nodes.length) | 0];
      pts.push(n.x + gauss() * 0.18, n.y + gauss() * 0.18, n.z + gauss() * 0.18);
    } else {
      const [a, b] = edges[(r() * edges.length) | 0];
      const t = r();
      const p = nodes[a].clone().lerp(nodes[b], t);
      const w = 0.07 + 0.05 * Math.sin(t * Math.PI);
      pts.push(p.x + gauss() * w, p.y + gauss() * w, p.z + gauss() * w);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const cloud = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.028, color: '#d9c9a8', transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }));
  g.add(cloud);
  g.userData.childOffset = nodes[0].clone();
  g.userData.nodes = nodes;
  return g;
}

export default function cosmicScale({ tier, reducedMotion }, { mode = 'outward' } = {}) {
  const root = new THREE.Group();
  const r = rng(42);
  const levels = [buildEarth(), buildMoon(), buildSolar(r), buildGalaxy(r, tier), buildGroup(r), buildWeb(r, tier)];
  levels.forEach((l) => root.add(l));
  const offsets = levels.map((l) => l.userData.childOffset || new THREE.Vector3());

  // Hubble flow overlay for the top level: recession vectors from a chosen "home" galaxy
  const flow = new THREE.Group();
  const flowGeo = new THREE.BufferGeometry();
  const nodes = levels[5].userData.nodes;
  flowGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nodes.length * 6), 3));
  const flowLines = new THREE.LineSegments(flowGeo, lineMaterial('#f0cf8a', 0.0));
  const homeMarker = glowSprite('#fff3d6', 0.6, 0);
  flow.add(flowLines, homeMarker);
  levels[5].add(flow);
  let homeIdx = 0;
  let expanding = false;
  let aFactor = 1;

  let s = mode === 'return' ? 5 : 0;
  let master = 1; // overall fade, driven by the engine during arrival / departure
  let target = s;
  let autoplay = !reducedMotion;
  let speed = 0.32;

  const layout = () => {
    const c = clamp(Math.ceil(s), 0, 5);
    const f = c === 0 ? 1 : clamp(s - (c - 1));
    const scales = levels.map((_, i) => Math.pow(R, i - s));
    const pos = new Array(6);
    // levels may carry a rotation; account for it when nesting children
    const childWorld = (i) => offsets[i].clone().applyEuler(levels[i].rotation).multiplyScalar(scales[i]);
    pos[c] = childWorld(c).multiplyScalar(-(1 - f));
    for (let j = c - 1; j >= 0; j--) pos[j] = pos[j + 1].clone().add(childWorld(j + 1));
    for (let j = c + 1; j < 6; j++) pos[j] = pos[j - 1].clone().sub(childWorld(j));
    levels.forEach((l, i) => {
      const sc = scales[i] * (i === 5 ? aFactor : 1);
      l.scale.setScalar(sc);
      l.position.copy(pos[i]);
      // visible when the level is roughly screen-sized
      const fadeIn = clamp((Math.log10(R * 1.0) - Math.log10(scales[i])) / 0.6); // 0 when scale ≥ 10
      const fadeOut = clamp((Math.log10(scales[i]) + 1.6) / 0.5); // 0 when scale ≤ 0.025
      const k = (i === 0 ? fadeOut : fadeIn * fadeOut) * master;
      l.visible = k > 0.01;
      l.traverse((o) => {
        const m = o.material;
        if (!m) return;
        if (m.userData.base === undefined) m.userData.base = m.uniforms?.uOpacity ? m.uniforms.uOpacity.value : m.opacity;
        if (m.uniforms?.uOpacity) m.uniforms.uOpacity.value = m.userData.base * k;
        else m.opacity = m.userData.base * k;
      });
    });
  };

  const setHome = (i) => {
    homeIdx = i;
    const home = nodes[i];
    homeMarker.position.copy(home);
    const arr = flowGeo.attributes.position.array;
    nodes.forEach((n, j) => {
      const d = n.clone().sub(home);
      const v = d.clone().multiplyScalar(0.18); // v = H₀ d
      arr.set([n.x, n.y, n.z, n.x + v.x, n.y + v.y, n.z + v.z], j * 6);
    });
    flowGeo.attributes.position.needsUpdate = true;
  };
  setHome(0);

  const levelIndex = () => clamp(Math.round(s), 0, 5);

  const api = {
    group: root,
    cameraDistance: 9,
    mode,
    controls: mode === 'return' ? [] : [
      {
        type: 'range', label: 'Scale', min: 0, max: 5, step: 0.01, value: 0,
        format: (v) => LEVELS[clamp(Math.round(v), 0, 5)].name,
        onInput: (v) => { autoplay = false; target = v; },
        sync: () => s,
      },
      { type: 'toggle', label: 'Expand space', value: false, onInput: (v) => { expanding = v; if (v) { autoplay = false; target = 5; } } },
      { type: 'button', label: 'Choose another home galaxy', onClick: () => { setHome((homeIdx + 7) % nodes.length); expanding = true; target = 5; autoplay = false; } },
    ],
    readout() {
      const L = LEVELS[levelIndex()];
      if (expanding && s > 4.6) return 'Space stretches: every galaxy recedes from every other, faster with distance — v = H₀d. Any galaxy can be "home"; there is no centre.';
      return `${L.name} — ${L.scale}  ·  distances between levels compressed for display`;
    },
    get s() { return s; },
    setOpacity(k) { master = k; layout(); },
    /** Drive the zoom from outside (return-to-Earth sequence). */
    setTarget(v, sp = 0.32) { target = v; speed = sp; autoplay = false; },
    setImmediate(v) { s = target = v; layout(); },
    level: () => LEVELS[levelIndex()],
    update(dt, t) {
      if (autoplay) {
        target = Math.min(5, target + dt * 0.3);
        if (target >= 5) autoplay = false;
      }
      const ds = target - s;
      s += Math.sign(ds) * Math.min(Math.abs(ds), dt * Math.max(speed, Math.abs(ds) * 1.5));
      if (expanding && s > 4.6) {
        aFactor += dt * 0.045;
        if (aFactor > 1.7) aFactor = 1;
        flowLines.material.userData.base = 0.6;
        homeMarker.material.userData.base = 0.9;
      } else {
        aFactor += (1 - aFactor) * Math.min(1, dt * 2);
        flowLines.material.userData.base = 0;
        homeMarker.material.userData.base = 0;
      }
      layout();
      const earth = levels[0].userData.earth;
      earth.rotation.y += dt * 0.04;
      earth.material.uniforms.uTime.value = t;
      const moon = levels[1].userData.moon;
      const ma = t * 0.12;
      moon.position.set(Math.cos(ma) * 3.8, 0, Math.sin(ma) * 3.8);
      levels[2].userData.planets.forEach((p) => {
        if (p.userData.fixed) return;
        p.userData.a += dt * 0.08 / Math.pow(p.userData.r, 1.5);
        p.position.set(Math.cos(p.userData.a) * p.userData.r, 0, Math.sin(p.userData.a) * p.userData.r);
      });
      levels[3].rotation.y += dt * 0.01;
      levels[5].rotation.y += dt * 0.008;
    },
  };
  layout();
  return api;
}
