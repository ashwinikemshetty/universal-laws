import * as THREE from 'three';

/*
 * A GPU-driven star tunnel. All motion is in the vertex shader: the CPU only advances
 * `uTravel` (distance flown) and `uWarp` (0 = resting stars, 1 = full light-speed streaks).
 *
 * Each star is drawn twice: as a soft point (resting) and as a line segment whose tail
 * stretches backward with warp. Stars recycle through a fixed-depth tube, so the field is endless.
 */

const DEPTH = 1400;

const commonVert = /* glsl */ `
  uniform float uTravel;
  uniform float uWarp;
  uniform float uAniso;   // relativity transition: stretch depends on screen position
  uniform float uTime;
  attribute vec3 aSeed;   // x,y position in tube, z = base depth
  attribute float aMag;
  varying float vMag;
  varying float vFade;
  float depthOf(float base){ return mod(base + uTravel, ${DEPTH.toFixed(1)}) - ${DEPTH.toFixed(1)}; }
`;

export class Starfield {
  constructor(count = 6000, tier = 'high') {
    this.group = new THREE.Group();
    this.uniforms = {
      uTravel: { value: 0 },
      uWarp: { value: 0 },
      uAniso: { value: 0 },
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    };

    const seeds = new Float32Array(count * 3);
    const mags = new Float32Array(count);
    const tints = new Float32Array(count * 3);
    const palette = [
      new THREE.Color('#f3ead6'), // aged ivory
      new THREE.Color('#e7cf9a'), // muted gold
      new THREE.Color('#cdb48a'), // bronze-ish
      new THREE.Color('#c9d1dc'), // faint silver-blue
      new THREE.Color('#ffffff'),
    ];
    for (let i = 0; i < count; i++) {
      // distribute in a tube that leaves a quiet corridor down the middle
      const r = 40 + Math.pow(Math.random(), 0.7) * 520;
      const a = Math.random() * Math.PI * 2;
      seeds[i * 3] = Math.cos(a) * r;
      seeds[i * 3 + 1] = Math.sin(a) * r;
      seeds[i * 3 + 2] = Math.random() * DEPTH;
      mags[i] = Math.pow(Math.random(), 3.2);
      const c = palette[(Math.random() * palette.length) | 0];
      tints.set([c.r, c.g, c.b], i * 3);
    }

    /* Points */
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    pg.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3));
    pg.setAttribute('aMag', new THREE.BufferAttribute(mags, 1));
    pg.setAttribute('aTint', new THREE.BufferAttribute(tints, 3));
    pg.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);

    this.points = new THREE.Points(
      pg,
      new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */ `
          ${commonVert}
          uniform float uPixelRatio;
          attribute vec3 aTint;
          varying vec3 vTint;
          void main(){
            vec3 p = vec3(aSeed.xy, depthOf(aSeed.z));
            vec4 mv = modelViewMatrix * vec4(p,1.0);
            gl_Position = projectionMatrix * mv;
            float twinkle = 0.75 + 0.25 * sin(uTime * (0.6 + aMag * 2.0) + aSeed.z);
            gl_PointSize = (1.0 + aMag * 3.2) * uPixelRatio * (260.0 / -mv.z) * twinkle;
            gl_PointSize = clamp(gl_PointSize, 0.0, 9.0 * uPixelRatio);
            vMag = aMag; vTint = aTint;
            vFade = smoothstep(${DEPTH.toFixed(1)}, ${(DEPTH * 0.55).toFixed(1)}, -p.z) * smoothstep(0.0, 30.0, -p.z);
          }`,
        fragmentShader: /* glsl */ `
          uniform float uOpacity; uniform float uWarp;
          varying float vMag; varying float vFade; varying vec3 vTint;
          void main(){
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c);
            float core = smoothstep(0.5, 0.0, d);
            core = pow(core, 2.2);
            float a = core * (0.35 + vMag * 0.9) * vFade * uOpacity * (1.0 - uWarp * 0.65);
            gl_FragColor = vec4(vTint * a, a);
          }`,
      })
    );

    /* Streaks */
    const lg = new THREE.BufferGeometry();
    const lSeeds = new Float32Array(count * 6);
    const lMags = new Float32Array(count * 2);
    const lEnd = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      for (let k = 0; k < 2; k++) {
        lSeeds.set([seeds[i * 3], seeds[i * 3 + 1], seeds[i * 3 + 2]], (i * 2 + k) * 3);
        lMags[i * 2 + k] = mags[i];
        lEnd[i * 2 + k] = k;
      }
    }
    lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 6), 3));
    lg.setAttribute('aSeed', new THREE.BufferAttribute(lSeeds, 3));
    lg.setAttribute('aMag', new THREE.BufferAttribute(lMags, 1));
    lg.setAttribute('aEnd', new THREE.BufferAttribute(lEnd, 1));
    lg.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);

    this.streaks = new THREE.LineSegments(
      lg,
      new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */ `
          ${commonVert}
          attribute float aEnd;
          varying float vEnd;
          void main(){
            float z = depthOf(aSeed.z);
            vec2 dir = normalize(aSeed.xy + 0.0001);
            float side = dot(dir, vec2(1.0, 0.0));
            float stretch = uWarp * uWarp * (60.0 + aMag * 140.0) * (1.0 + uAniso * side * 1.4);
            vec3 p = vec3(aSeed.xy, z - aEnd * stretch);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
            vMag = aMag; vEnd = aEnd;
            vFade = smoothstep(${DEPTH.toFixed(1)}, ${(DEPTH * 0.5).toFixed(1)}, -z);
          }`,
        fragmentShader: /* glsl */ `
          uniform float uWarp; uniform float uOpacity;
          varying float vMag; varying float vFade; varying float vEnd;
          void main(){
            float a = (1.0 - vEnd) * smoothstep(0.05, 0.6, uWarp) * (0.25 + vMag) * vFade * uOpacity;
            vec3 col = mix(vec3(0.95,0.88,0.72), vec3(0.85,0.9,1.0), vEnd);
            gl_FragColor = vec4(col * a, a);
          }`,
      })
    );

    this.group.add(this.points, this.streaks);
    this.speed = 0; // units per second (cruise)
    this.targetSpeed = 6;
  }

  update(dt, t) {
    const u = this.uniforms;
    // speed follows warp quadratically so it feels like acceleration
    const desired = this.targetSpeed + u.uWarp.value * u.uWarp.value * 1600;
    this.speed += (desired - this.speed) * Math.min(1, dt * 2.2);
    u.uTravel.value += this.speed * dt;
    u.uTime.value = t;
  }

  dispose() {
    this.points.geometry.dispose();
    this.points.material.dispose();
    this.streaks.geometry.dispose();
    this.streaks.material.dispose();
  }
}
