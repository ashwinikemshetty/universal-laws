# Cosmic Codex

*A voyage through reality.* Cosmic Codex is a cinematic 3D website that travels through twelve laws of the universe and asks what each one might teach us about being human.

> Travel through the universe. Discover the laws that govern reality. Then discover what those laws can teach us about being human.

**The voyage:** The Void → Matter & Motion → Gravity → Energy → Entropy → Fields → Spacetime → Quantum (×2) → Causality → Cosmos → Symmetry → The Unknown → Earth → You

## Running it

```bash
npm install
npm run dev       # local development
npm run build     # static site in dist/ (relative paths, so it can be hosted from any folder)
npm run preview   # serve the build
npm run check     # validate chapter content and check that every equation parses
```

URL options: `?lite` forces the 2D fallback, `?calm` forces reduced motion, `?tier=low|mid|high` overrides the quality tier, and `#map` opens the orrery straight away.

## What's inside

| Area | Where |
| --- | --- |
| All scientific and reflective content | `src/content/chapters.js` |
| WebGL engine: camera rig, stage, warp, picking, adaptive resolution | `src/engine/Engine.js` |
| GPU star tunnel (stars stretch into light trails) | `src/engine/Starfield.js` |
| Nebula veils, dust, distant galaxy | `src/engine/Atmosphere.js` |
| One interactive 3D model per chapter | `src/engine/scenes/*.js` |
| Canvas 2D fallback (no WebGL or lite mode) | `src/engine/FallbackEngine.js` |
| Transitions, the return to Earth, wiring | `src/main.js` |
| Chapter panel, orrery, constellation, storage | `src/ui/` |
| Generative ambient sound (Web Audio, no files) | `src/audio.js` |

### Every chapter has two layers that are kept apart
1. **The Law**: the scientific and poetic titles, what the law says, the equations with every variable explained, how we know it (experiments, history, scientists), its limitations, where it applies and where it does **not** directly apply.
2. **The Human Mirror**: Feeling, Thought, Action and Belief. These are labelled everywhere as reflections inspired by the science, not as scientific claims. The quantum chapters say explicitly that quantum mechanics is not evidence that thoughts create reality.

### The 3D models are meant to explain something
The models compute what they show:
- **Motion**: inertial drift, a deliberate impulse, equal and opposite forces.
- **Gravity**: Keplerian orbits and a curvature grid.
- **Energy**: a pendulum with its kinetic, potential and heat energy accounted for.
- **Entropy**: a lattice diffusing, with a live coarse-grained entropy reading and the work needed to maintain order.
- **Fields**: an EM wave with E ⟂ B and f = c/λ for visible light.
- **Spacetime**: a curved grid, γ, a moving clock that runs slow and a rod that contracts.
- **Superposition**: a hydrogen 1s + 2p superposition whose density oscillates, plus Born-rule measurements.
- **Uncertainty**: a Gaussian wave packet with σₓσₚ = ħ/2.
- **Causality**: light cones; click an event to classify the interval between it and the centre.
- **Cosmos**: a powers-of-ten zoom from Earth to the cosmic web, with Hubble flow from any chosen "home" galaxy.
- **Symmetry**: icosahedral symmetry operations compared with a non-symmetry.
- **The Unknown**: almost nothing, on purpose.

### Transitions
Each kind of travel has its own transition:
- **Warp**: the stars stretch, a warp point appears, the screen stretches and you fly through a celestial object.
- **Gravity**: the interface bends toward a central mass, then the scene swings you into orbit.
- **Entropy**: an ordered lattice scatters into the starfield. On the way out, the entropy particles become the next scene's stars.
- **Relativity**: time slows, and stars stretch by different amounts depending on where they are.
- **Quantum**: probability paths branch out, one resolves, and ghost titles collapse into one.
- **Cosmic scale**: a continuous zoom out from Earth.
- **Silence**: used for The Unknown.

### Navigation and interaction
- **Orrery:** twelve tilted orbits with bodies moving at Keplerian rates. Click or tap an orbit to travel; the keyboard works too.
- **Personal constellation:** "Keep as a star" on any reflection adds a star. The constellation gets a generated name (The Seeker, The Wayfinder, …) and can be saved as a PNG. It is stored only in this browser's `localStorage`.
- **Controls:** ← / → move between chapters, `M` opens the map, `C` opens the constellation and `Esc` closes overlays. Drag to rotate the model and scroll to change distance. Tap a glowing point to open a scientific note.

### Performance and accessibility
- A quality tier is chosen from the CPU core count, device memory, touch input and data-saver setting.
- Resolution adapts when frames run slow, and rendering pauses in hidden tabs.
- Bloom is only used on the higher tiers.
- With `prefers-reduced-motion`, warps become short fades and the drift is turned off.
- Without WebGL there is a 2D star tunnel, and all of the text is still available.
- Overlays manage focus, live regions announce arrivals, and the chapter panel becomes a bottom sheet on phones.

## Imagery
Chapters that have a real astronomical image load it from Wikimedia Commons copies of NASA, ESA, Hubble and EHT images. Credits appear in the chapter panel. Images are blended into the environment rather than shown as thumbnails. If one can't load, the scene runs without it.
