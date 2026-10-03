/*
 * COSMIC CODEX — chapter content.
 *
 * Every chapter has two layers that are kept deliberately separate:
 *   1. THE LAW          — the science: what it says, how we know, where it holds, where it doesn't.
 *   2. THE HUMAN MIRROR — a reflection *inspired by* the science. It is philosophy, not physics,
 *                         and the interface labels it that way everywhere it appears.
 *
 * Equations are KaTeX strings. Each one is followed by a legend so nothing is decorative.
 * Imagery points at Wikimedia Commons copies of NASA / ESA / EHT images; if an image cannot load
 * the scene simply runs without it.
 */

const commons = (file, width = 1600) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;

export const JOURNEY = [
  'The Void', 'Matter', 'Motion', 'Gravity', 'Energy', 'Entropy', 'Fields',
  'Spacetime', 'Quantum', 'Causality', 'Cosmos', 'The Unknown', 'Earth', 'You',
];

export const chapters = [
  /* ───────────────────────────── 01 ───────────────────────────── */
  {
    id: 'motion',
    region: 'Matter & Motion',
    orbit: 'Matter',
    scientificTitle: "Newton's Laws of Motion",
    poeticTitle: 'The Persistence of Things',
    transition: 'warp',
    accent: '#c8a35f',
    lede: 'Left alone, a thing keeps doing what it is already doing. Change requires a force.',
    meaning: [
      'Isaac Newton condensed the mechanics of everyday objects into three statements. <em>First</em>: a body stays at rest, or keeps moving in a straight line at constant speed, unless a net force acts on it. This tendency is called inertia. <em>Second</em>: a net force changes a body\'s momentum, and the rate of that change equals the force. <em>Third</em>: forces come in pairs — when one body pushes on another, the second pushes back equally hard in the opposite direction.',
      'Together they turn motion from something mysterious into something predictable. Given the forces on an object and its starting state, its future path can be calculated — which is how we aim spacecraft across billions of kilometres.',
    ],
    equations: [
      {
        tex: String.raw`\vec{F}_{\text{net}} = \frac{d\vec{p}}{dt} = m\,\vec{a}`,
        caption: 'Second law (the familiar form holds when mass is constant).',
        vars: [
          ['\\vec{F}_{\\text{net}}', 'the vector sum of all forces on the body (newtons)'],
          ['\\vec{p} = m\\vec{v}', 'momentum: mass times velocity'],
          ['m', 'inertial mass — how strongly the body resists changes in motion (kg)'],
          ['\\vec{a}', 'acceleration: the rate of change of velocity (m/s²)'],
        ],
      },
      {
        tex: String.raw`\vec{F}_{A\to B} = -\,\vec{F}_{B\to A}`,
        caption: 'Third law: equal in size, opposite in direction, acting on different bodies.',
        vars: [['\\vec{F}_{A\\to B}', 'the force body A exerts on body B']],
      },
    ],
    evidence: [
      'Galileo\'s rolling-ball experiments (early 1600s) showed that motion on a smooth horizontal surface barely decays — friction, not nature, brings things to rest. Newton generalised this in the <em>Principia</em> (1687) and showed the same laws, together with gravity, reproduce Kepler\'s planetary orbits.',
      'Today the laws are tested continuously: in air-track and collision experiments, in the trajectories of every satellite and interplanetary probe, and in engineering of every bridge, car and aircraft.',
    ],
    history: [
      ['c. 1600', 'Galileo Galilei', 'Inclined planes; the idea of inertia'],
      ['1644', 'René Descartes', 'Straight-line persistence of motion'],
      ['1687', 'Isaac Newton', 'Philosophiæ Naturalis Principia Mathematica'],
      ['1788', 'J.-L. Lagrange', 'Reformulates mechanics in terms of energy'],
    ],
    limitations:
      'Newton\'s laws are an approximation. They fail at speeds approaching light (special relativity takes over), in strong gravity (general relativity), and at atomic scales (quantum mechanics). The first law also only holds in <em>inertial</em> frames — in a rotating or accelerating frame, "fictitious" forces appear.',
    applies: [
      'Everyday objects, vehicles, machines, sport',
      'Planetary and satellite motion (to very high precision)',
      'Fluids and solids, when treated as many small parts',
    ],
    notApplies: [
      'Speeds comparable to the speed of light',
      'Electrons in atoms, or any system where quantum effects dominate',
      'Near black holes or where precise timing in gravity matters (e.g. GPS needs relativity)',
      'Non-inertial frames, unless fictitious forces are added',
    ],
    imagery: null,
    notes: [
      { pos: [-3.2, 1.4, -1], title: 'Inertia', body: 'The drifting bodies here have no net force on them, so their velocity never changes. No "push" is needed to keep them moving — only to change how they move.' },
      { pos: [2.6, -1.2, 0.5], title: 'Momentum', body: 'Momentum is mass × velocity. A heavy body moving slowly can carry as much momentum as a light one moving fast — and requires the same impulse to stop.' },
    ],
    mirror: {
      feeling: { label: 'Notice resistance', text: 'Inertia is not stubbornness; it is simply what things do. Noticing where your life resists change can be met with curiosity rather than blame.' },
      thought: { label: 'Unexamined momentum', text: 'Where am I continuing simply because nothing has interrupted my momentum?' },
      action: { label: 'Introduce one deliberate force', text: 'Choose one trajectory you want to change and apply a small, specific, repeated push — a calendar block, a conversation, a new default.' },
      belief: { label: 'Momentum is not destiny', text: 'Momentum is not destiny.' },
    },
  },

  /* ───────────────────────────── 02 ───────────────────────────── */
  {
    id: 'gravity',
    region: 'Gravity',
    orbit: 'Gravity',
    scientificTitle: 'Universal Gravitation & General Relativity',
    poeticTitle: 'The Shape of Attraction',
    transition: 'gravity',
    accent: '#d1a965',
    lede: 'Every mass attracts every other mass. Einstein showed that this attraction is the curvature of spacetime itself.',
    meaning: [
      '<em>Newton\'s picture (1687)</em>: every mass pulls on every other mass with a force proportional to both masses and inversely proportional to the square of the distance between them. The same law that drops an apple keeps the Moon in orbit.',
      '<em>Einstein\'s picture (1915)</em>: gravity is not a force transmitted across space but the geometry of spacetime. Mass and energy curve spacetime; free-falling objects follow the straightest possible paths (geodesics) through that curved geometry. "Matter tells spacetime how to curve; spacetime tells matter how to move."',
      'The two are not rivals at everyday scales — Newton\'s law is what general relativity becomes when gravity is weak and speeds are low. They differ measurably near massive, compact objects and wherever precise timing matters.',
    ],
    equations: [
      {
        tex: String.raw`F = G\,\frac{m_1 m_2}{r^2}`,
        caption: 'Newtonian gravitation — the force between two point masses.',
        vars: [
          ['G', 'gravitational constant, ≈ 6.674 × 10⁻¹¹ N·m²/kg²'],
          ['m_1, m_2', 'the two masses'],
          ['r', 'distance between their centres'],
        ],
      },
      {
        tex: String.raw`G_{\mu\nu} + \Lambda g_{\mu\nu} = \frac{8\pi G}{c^4}\,T_{\mu\nu}`,
        caption: "Einstein's field equations — geometry on the left, matter and energy on the right.",
        vars: [
          ['G_{\\mu\\nu}', 'Einstein tensor: how spacetime is curved'],
          ['g_{\\mu\\nu}', 'the metric: distances and durations in spacetime'],
          ['\\Lambda', 'cosmological constant (linked to dark energy)'],
          ['T_{\\mu\\nu}', 'stress–energy tensor: density and flow of mass, energy, momentum'],
          ['c', 'speed of light'],
        ],
      },
    ],
    evidence: [
      'Newtonian gravity predicted the existence and position of Neptune (1846) from wobbles in Uranus\'s orbit, and still guides most spaceflight.',
      'General relativity explained the anomalous precession of Mercury\'s orbit (43″ per century), predicted the bending of starlight measured during the 1919 solar eclipse, gravitational redshift (Pound–Rebka, 1959), gravitational lensing of distant galaxies, the timing of binary pulsars, gravitational waves detected by LIGO (2015) and the shadow of black hole M87* imaged by the Event Horizon Telescope (2019). GPS satellites would drift by kilometres a day without relativistic clock corrections.',
    ],
    history: [
      ['1609–19', 'Johannes Kepler', 'Laws of planetary orbits'],
      ['1687', 'Isaac Newton', 'Inverse-square law of gravitation'],
      ['1915', 'Albert Einstein', 'General theory of relativity'],
      ['1919', 'Dyson, Eddington & Davidson', 'Eclipse measurement of light bending'],
      ['2015', 'LIGO / Virgo', 'First direct detection of gravitational waves'],
    ],
    limitations:
      'General relativity has passed every precision test so far, but it is a classical (non-quantum) theory. It predicts its own breakdown at singularities — the centres of black holes and the earliest instant of the Big Bang — where a quantum theory of gravity is expected to be needed. Galaxy rotation curves and cosmic structure also require either unseen "dark matter" or modified gravity; the evidence currently favours dark matter.',
    applies: [
      'Falling objects, tides, orbits, planetary systems',
      'Galaxies, clusters and the large-scale universe (with dark matter and dark energy)',
      'Black holes, neutron stars, gravitational waves (general relativity)',
    ],
    notApplies: [
      'Newton\'s version is not accurate near very compact masses or for precise timekeeping',
      'Neither version is tested at the Planck scale (~10⁻³⁵ m), where quantum gravity is expected to matter',
      'Gravity is extremely weak between small objects — it is not a significant force within atoms',
    ],
    imagery: {
      src: commons('A_Horseshoe_Einstein_Ring_from_Hubble.JPG'),
      caption: 'A "horseshoe" Einstein ring — a distant galaxy\'s light bent by a foreground galaxy\'s mass.',
      credit: 'ESA/Hubble & NASA',
    },
    notes: [
      { pos: [0, 2.6, 0], title: 'Inverse square', body: 'Double the distance and the gravitational pull falls to one quarter. Orbital speed therefore drops for more distant bodies — watch the outer moons move more slowly.' },
      { pos: [5.4, 0.3, 1.5], title: 'An orbit is a fall', body: 'An orbiting body is falling toward the central mass the whole time. It simply moves sideways fast enough to keep missing it.' },
      { pos: [-4.2, -1.8, 2], title: 'Curvature', body: 'In general relativity the grid beneath the mass represents spacetime curvature. It is a visual aid: real curvature is in four dimensions, including time.' },
    ],
    mirror: {
      feeling: { label: 'Groundedness', text: 'Gravity is what lets anything stay anywhere. Being held in place by what is important can feel less like confinement and more like ground.' },
      thought: { label: 'Repeated orbits', text: 'What am I repeatedly orbiting — which person, worry, screen or ambition is quietly bending my path?' },
      action: { label: 'Choose a healthy centre', text: 'Name one healthy centre of gravity (a practice, a relationship, a value) and deliberately spend more time in its orbit this week.' },
      belief: { label: 'What I orbit shapes me', text: 'What I repeatedly orbit shapes my path.' },
    },
  },

  /* ───────────────────────────── 03 ───────────────────────────── */
  {
    id: 'energy',
    region: 'Energy',
    orbit: 'Energy',
    scientificTitle: 'Conservation of Energy',
    poeticTitle: 'Nothing Is Lost, Only Changed',
    transition: 'warp',
    accent: '#d9b46a',
    lede: 'In an isolated system the total energy never changes. It only moves and changes form.',
    meaning: [
      'Energy is the capacity of a system to do work or produce heat. It appears in many forms — motion (kinetic), position in a field (potential), heat, chemical bonds, electromagnetic radiation, and mass itself (E = mc²).',
      'The law of conservation of energy states that in an isolated system the total amount never increases or decreases. A swinging pendulum trades potential energy for kinetic energy and back; friction converts some of it into heat, which is still energy, just less useful.',
      'The first law of thermodynamics is the same principle written for heat engines: the change in a system\'s internal energy equals the heat added minus the work done by the system.',
    ],
    equations: [
      {
        tex: String.raw`E_{\text{total}} = E_k + E_p + E_{\text{thermal}} + \dots = \text{constant}`,
        caption: 'For an isolated system.',
        vars: [
          ['E_k = \\tfrac12 m v^2', 'kinetic energy of motion'],
          ['E_p = m g h', 'gravitational potential energy near Earth\'s surface'],
          ['E_{\\text{thermal}}', 'energy of microscopic random motion (heat)'],
        ],
      },
      {
        tex: String.raw`\Delta U = Q - W`,
        caption: 'First law of thermodynamics.',
        vars: [
          ['\\Delta U', 'change in internal energy of the system'],
          ['Q', 'heat added to the system'],
          ['W', 'work done by the system on its surroundings'],
        ],
      },
    ],
    evidence: [
      'James Joule\'s paddle-wheel experiments (1840s) showed that a fixed amount of mechanical work always produces the same amount of heat — establishing heat as a form of energy. Calorimetry, engines, power stations and particle collisions have confirmed the bookkeeping ever since.',
      'In 1930 beta decay appeared to violate energy conservation. Rather than abandon the law, Wolfgang Pauli proposed an unseen particle carrying the missing energy — the neutrino, detected in 1956.',
    ],
    history: [
      ['1840s', 'Mayer, Joule, Helmholtz', 'Mechanical equivalent of heat; general principle'],
      ['1850', 'Rudolf Clausius', 'First law of thermodynamics'],
      ['1905', 'Albert Einstein', 'Mass–energy equivalence, E = mc²'],
      ['1918', 'Emmy Noether', 'Energy conservation follows from time symmetry'],
    ],
    limitations:
      'Conservation holds for <em>isolated</em> systems — a system exchanging energy with its surroundings can gain or lose it. On cosmological scales, where spacetime itself expands, there is no single agreed global definition of total energy: light from distant galaxies loses energy to redshift, and the energy in dark energy grows with volume. Locally, energy is always conserved.',
    applies: [
      'Mechanical, chemical, electrical, nuclear and thermal processes',
      'Every experiment ever performed in a laboratory',
      'Local physics everywhere in the universe',
    ],
    notApplies: [
      'It does not say energy is always <em>useful</em> — that is the job of entropy',
      'Non-isolated systems: energy can flow in or out',
      'The whole expanding universe, where "total energy" is not straightforwardly defined',
    ],
    imagery: {
      src: commons("The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA's_Solar_Dynamics_Observatory_-_20100819.jpg"),
      caption: 'The Sun converts about four million tonnes of mass into energy every second through nuclear fusion.',
      credit: 'NASA / SDO (AIA)',
    },
    notes: [
      { pos: [0, 3.2, 0], title: 'Highest point', body: 'At the top of its swing the pendulum is momentarily still: nearly all of its energy is potential.' },
      { pos: [0, -2.6, 1], title: 'Lowest point', body: 'At the bottom it moves fastest: potential energy has become kinetic. The total is unchanged.' },
      { pos: [3.8, -0.5, -1.5], title: 'Where does it go?', body: 'Real pendulums slow down. Their energy is not destroyed — it leaks into air and the pivot as heat and sound.' },
    ],
    mirror: {
      feeling: { label: 'Respect for limits', text: 'Energy is never created from nothing. Respecting that your own attention and stamina are finite can be a form of honesty rather than weakness.' },
      thought: { label: 'Energy accounting', text: 'Where is my energy actually going — and which transformations leave me with something, and which leave only heat?' },
      action: { label: 'Redirect one drain', text: 'Find one recurring drain (a meeting, an app, a habit) and redirect that energy to something you would rather build.' },
      belief: { label: 'Transformation', text: 'Transformation is more fundamental than disappearance.' },
    },
  },

  /* ───────────────────────────── 04 ───────────────────────────── */
  {
    id: 'entropy',
    region: 'Entropy',
    orbit: 'Entropy',
    scientificTitle: 'The Second Law of Thermodynamics',
    poeticTitle: 'The Arrow of Time',
    transition: 'entropy',
    accent: '#b9895a',
    lede: 'Left to itself, an isolated system drifts toward its most probable arrangement. Order needs a supply of energy to persist.',
    meaning: [
      'Entropy measures how many microscopic arrangements are consistent with what we see at large scale. A neatly stacked set of particles has few arrangements; the same particles spread randomly through a box have astronomically many.',
      'The second law states that the total entropy of an isolated system never decreases. This is not because disorder is "preferred" by some force, but because disordered states vastly outnumber ordered ones — random motion is overwhelmingly likely to land in one of them.',
      'Local order is perfectly possible: refrigerators, crystals, living cells and cities all create order. But each does so by consuming energy and exporting more entropy (usually as heat) to its surroundings, so the total still rises.',
    ],
    equations: [
      {
        tex: String.raw`\Delta S_{\text{isolated}} \ge 0`,
        caption: 'The second law: total entropy of an isolated system does not decrease.',
        vars: [['\\Delta S', 'change in entropy (joules per kelvin)']],
      },
      {
        tex: String.raw`S = k_B \ln \Omega`,
        caption: "Boltzmann's entropy formula, engraved on his tombstone in Vienna.",
        vars: [
          ['k_B', 'Boltzmann constant, ≈ 1.381 × 10⁻²³ J/K'],
          ['\\Omega', 'number of microscopic states compatible with the macroscopic state'],
        ],
      },
    ],
    evidence: [
      'Sadi Carnot\'s analysis of steam engines (1824) showed no heat engine can turn heat completely into work. Clausius and Kelvin formalised this as the second law; Boltzmann and Gibbs explained it statistically.',
      'Every refrigerator, engine efficiency limit, chemical equilibrium and the fact that heat flows from hot to cold are everyday confirmations. Modern experiments with tiny systems even measure the brief, rare entropy decreases the statistical law permits (fluctuation theorems).',
    ],
    history: [
      ['1824', 'Sadi Carnot', 'Limits of heat engines'],
      ['1850–65', 'Rudolf Clausius', 'Second law; coins "entropy"'],
      ['1877', 'Ludwig Boltzmann', 'Statistical meaning of entropy'],
      ['1948', 'Claude Shannon', 'Information entropy'],
    ],
    limitations:
      'The second law is statistical: for systems of a few particles, short-lived decreases in entropy occur and have been measured. Why the universe began in such a low-entropy state — the ultimate source of the "arrow of time" — remains an open question in cosmology.',
    applies: [
      'Heat engines, refrigerators, chemistry, weather',
      'Stars, which shine by exporting entropy into space',
      'Large systems of many particles — the larger, the more absolute the law',
    ],
    notApplies: [
      'It does not forbid local order: life, crystals and civilisations exist',
      'It is not strictly absolute for very small systems over short times',
      'It does not by itself explain why the early universe had low entropy',
    ],
    imagery: {
      src: commons('Pillars_of_creation_2014_HST_WFC3-UVIS_full-res_denoised.jpg'),
      caption: 'The Pillars of Creation: young stars build local order while radiating entropy into space.',
      credit: 'NASA, ESA & the Hubble Heritage Team (STScI/AURA)',
    },
    notes: [
      { pos: [-3, 2.4, 0], title: 'Microstates', body: 'There is only one way to arrange the particles in a perfect lattice — but trillions of ways to scatter them. Random motion almost always finds a scattered arrangement.' },
      { pos: [3.4, -2, 0.5], title: 'Maintenance', body: 'Press "Maintain" and the order returns — but only because the scene spends energy doing it. Order is possible; it is never free.' },
    ],
    mirror: {
      feeling: { label: 'Acceptance of impermanence', text: 'Things fall apart not because we failed but because there are more ways to be apart than together. That can soften blame and invite steadiness.' },
      thought: { label: 'Unmaintained order', text: 'What in my life becomes disordered unless it is regularly maintained?' },
      action: { label: 'A maintenance ritual', text: 'Create one small, recurring maintenance ritual — for a friendship, a body, a home, a codebase — and put it somewhere you will see it.' },
      belief: { label: 'Care is active', text: 'Care is an active practice.' },
    },
  },

  /* ───────────────────────────── 05 ───────────────────────────── */
  {
    id: 'em',
    region: 'Fields',
    orbit: 'Fields',
    scientificTitle: "Maxwell's Equations",
    poeticTitle: 'The Invisible Weave',
    transition: 'warp',
    accent: '#c7b07a',
    lede: 'Electric and magnetic fields fill space, push on charges, and can carry themselves away as light.',
    meaning: [
      'Electric charges create electric fields; moving charges (currents) create magnetic fields. A changing magnetic field creates an electric field — the principle behind every generator — and a changing electric field creates a magnetic field.',
      'James Clerk Maxwell combined these relationships into four equations (1865) and found that they predict self-sustaining waves of electric and magnetic fields travelling at one particular speed. That speed matched the measured speed of light. Light is an electromagnetic wave; so are radio, microwaves, X-rays and gamma rays.',
    ],
    equations: [
      {
        tex: String.raw`\begin{aligned}
\nabla\cdot\vec{E} &= \rho/\varepsilon_0 & \nabla\cdot\vec{B} &= 0\\
\nabla\times\vec{E} &= -\,\partial_t\vec{B} & \nabla\times\vec{B} &= \mu_0\vec{J} + \mu_0\varepsilon_0\,\partial_t\vec{E}
\end{aligned}`,
        caption: "Maxwell's equations in differential form (SI units).",
        vars: [
          ['\\vec{E},\\ \\vec{B}', 'electric field and magnetic field'],
          ['\\rho,\\ \\vec{J}', 'charge density and current density'],
          ['\\varepsilon_0,\\ \\mu_0', 'permittivity and permeability of free space'],
          ['\\nabla\\cdot,\\ \\nabla\\times', 'divergence ("spreading out") and curl ("circulation")'],
        ],
      },
      {
        tex: String.raw`c = \frac{1}{\sqrt{\mu_0\varepsilon_0}} \approx 2.998\times 10^{8}\ \text{m/s}`,
        caption: 'The speed of electromagnetic waves follows from the equations themselves.',
        vars: [['c', 'speed of light in vacuum']],
      },
    ],
    evidence: [
      'Coulomb measured electric force with a torsion balance (1785); Ørsted saw a current deflect a compass needle (1820); Faraday discovered electromagnetic induction (1831). Maxwell unified them, and Heinrich Hertz generated and detected radio waves in 1887, confirming the prediction.',
      'Every radio, phone, electric motor, MRI scanner and fibre-optic cable is a working test of these equations.',
    ],
    history: [
      ['1785', 'Charles-Augustin de Coulomb', 'Inverse-square law of electric force'],
      ['1831', 'Michael Faraday', 'Electromagnetic induction; field lines'],
      ['1865', 'James Clerk Maxwell', 'A Dynamical Theory of the Electromagnetic Field'],
      ['1887', 'Heinrich Hertz', 'Radio waves produced and detected'],
    ],
    limitations:
      'Maxwell\'s equations are classical. At very small scales and low light levels, light behaves as discrete photons, described by quantum electrodynamics (QED) — one of the most precisely tested theories in science. Inside materials the equations hold, but are usually used in averaged forms that depend on the material.',
    applies: [
      'Light, radio, electronics, magnets, chemistry\'s underlying forces',
      'Auroras, solar storms, the magnetic fields of planets and galaxies',
      'Any scale where photons are numerous enough to treat light as a wave',
    ],
    notApplies: [
      'Single-photon behaviour and atomic spectra in detail (requires QED)',
      'Gravity — electromagnetism is a separate interaction',
      'The strong and weak nuclear forces',
    ],
    imagery: {
      src: commons('Polarlicht_2.jpg'),
      caption: 'Aurora: charged solar particles guided by Earth\'s magnetic field make the upper atmosphere glow.',
      credit: 'Wikimedia Commons (public domain, U.S. Air Force photo)',
    },
    notes: [
      { pos: [-4.5, 1.8, 0], title: 'Electric field', body: 'The gold wave is the electric field. It oscillates in one plane, perpendicular to the direction the wave travels.' },
      { pos: [-1, -2.2, 1.5], title: 'Magnetic field', body: 'The silver wave is the magnetic field — always perpendicular to the electric field and in step with it. Each one, by changing, sustains the other.' },
      { pos: [4.2, 1.2, 0], title: 'Speed', body: 'Nothing pushes the wave along. Its speed follows from two constants of nature measured on a lab bench.' },
    ],
    mirror: {
      feeling: { label: 'Connection', text: 'We are surrounded by fields we cannot see, quietly linking distant things. That can invite a feeling of connectedness.' },
      thought: { label: 'Invisible signals', text: 'What invisible signals — tone, timing, silence — am I sending and receiving without noticing?' },
      action: { label: 'Improve communication', text: 'In one important conversation this week, say the thing you assumed was obvious, and ask what the other person heard.' },
      belief: { label: 'Invisible is real', text: 'Invisible does not mean unreal.' },
    },
  },

  /* ───────────────────────────── 06 ───────────────────────────── */
  {
    id: 'relativity',
    region: 'Spacetime',
    orbit: 'Spacetime',
    scientificTitle: 'Special & General Relativity',
    poeticTitle: 'The Fabric of When and Where',
    transition: 'relativity',
    accent: '#bfa776',
    lede: 'Space and time are not a fixed stage. Measurements of length and duration depend on how you move — and on where gravity is.',
    meaning: [
      '<em>Special relativity (1905)</em> starts from two principles: the laws of physics are the same in every inertial frame, and light in vacuum travels at the same speed for every observer. The consequences are surprising but measured daily: a moving clock ticks more slowly (time dilation), a moving object is shorter along its direction of motion (length contraction), and observers in relative motion can disagree about whether two distant events happened at the same time.',
      'Space and time combine into a single four-dimensional <em>spacetime</em>. Observers slice it into "space" and "time" differently, but all agree on the spacetime interval between events.',
      '<em>General relativity (1915)</em> extends this to gravity: mass and energy curve spacetime, and clocks deeper in a gravitational well tick more slowly than clocks higher up.',
    ],
    equations: [
      {
        tex: String.raw`\Delta t = \gamma\,\Delta\tau,\qquad \gamma = \frac{1}{\sqrt{1 - v^2/c^2}}`,
        caption: 'Time dilation: a moving clock\'s ticks are stretched.',
        vars: [
          ['\\Delta\\tau', 'proper time measured by the moving clock'],
          ['\\Delta t', 'time between the same ticks measured by a stationary observer'],
          ['v', 'relative speed'],
          ['\\gamma', 'Lorentz factor; ≈ 1 at everyday speeds'],
        ],
      },
      {
        tex: String.raw`L = \frac{L_0}{\gamma}\qquad ds^2 = -c^2 dt^2 + dx^2 + dy^2 + dz^2`,
        caption: 'Length contraction, and the invariant spacetime interval (flat spacetime).',
        vars: [
          ['L_0', 'length measured at rest relative to the object'],
          ['ds^2', 'spacetime interval — the same for all inertial observers'],
        ],
      },
    ],
    evidence: [
      'Muons created by cosmic rays high in the atmosphere live long enough to reach the ground only because of time dilation. Particle accelerators routinely keep unstable particles alive many times longer than their rest lifetime.',
      'In 1971 Hafele and Keating flew atomic clocks around the world and measured the predicted shifts. GPS satellites correct for both effects: their clocks gain about 38 microseconds per day relative to the ground. Optical clocks now detect gravitational time dilation over a height difference of less than a millimetre.',
    ],
    history: [
      ['1887', 'Michelson & Morley', 'No detectable "ether wind"'],
      ['1905', 'Albert Einstein', 'Special relativity'],
      ['1908', 'Hermann Minkowski', 'Spacetime geometry'],
      ['1971', 'Hafele & Keating', 'Atomic clocks flown around the world'],
    ],
    limitations:
      'Relativity does not say "everything is relative". It identifies what is <em>invariant</em> — the speed of light, the spacetime interval, the laws themselves — and explains precisely how frame-dependent quantities transform. General relativity has not yet been reconciled with quantum mechanics.',
    applies: [
      'Anything moving at a significant fraction of light speed',
      'Precise timing: GPS, particle physics, astronomy',
      'Strong gravity: neutron stars, black holes, the expanding universe',
    ],
    notApplies: [
      'It does not mean all viewpoints or opinions are equally valid — it is a precise theory of measurement',
      'Effects are negligible at walking or driving speeds (but not zero)',
      'Quantum-scale gravity is beyond it',
    ],
    imagery: {
      src: commons('Black_hole_-_Messier_87_crop_max_res.jpg'),
      caption: 'The shadow of the black hole M87*, imaged by the Event Horizon Telescope.',
      credit: 'Event Horizon Telescope Collaboration (CC BY 4.0)',
    },
    notes: [
      { pos: [-3.5, 1.5, 1], title: 'Curved grid', body: 'The grid is space bent by the masses. In reality, time is warped too: clocks near a mass tick more slowly.' },
      { pos: [2.8, 4.6, -2], title: 'Two rods, two clocks', body: 'The gold bar is a rod moving at the speed you choose; the grey bar is the same rod at rest. The instrument also runs two clocks. Increase the speed: the moving rod shortens and the moving clock falls behind — both by the factor γ.' },
    ],
    mirror: {
      feeling: { label: 'Humility', text: 'Two careful observers can measure different durations and both be right. That can make us humbler about the certainty of our own vantage point.' },
      thought: { label: 'Which frame?', text: 'From what frame am I seeing this — and what would it look like from theirs?' },
      action: { label: 'Seek another frame', text: 'Before a decision that affects others, deliberately ask someone with a different vantage point to describe what they see.' },
      belief: { label: 'Perspective and reality', text: 'Perspective can change measurement without making reality meaningless.' },
    },
  },

  /* ───────────────────────────── 07 ───────────────────────────── */
  {
    id: 'superposition',
    region: 'Quantum',
    orbit: 'Quantum',
    scientificTitle: 'Quantum States & Superposition',
    poeticTitle: 'The Cloud of the Possible',
    transition: 'quantum',
    accent: '#c3b28a',
    lede: 'Before measurement, a quantum system is described by a combination of possible outcomes — each with a calculable probability.',
    meaning: [
      'In quantum mechanics a system is described by a <em>state</em> (or wavefunction). If two states are possible, any weighted combination of them — a <em>superposition</em> — is also a valid state. An electron in an atom is not a tiny ball at an unknown spot; its state is spread out, and the square of the wavefunction gives the probability of finding it at each place.',
      'When a measurement is made, one definite outcome is recorded, with probability given by the Born rule. What exactly happens during measurement is still debated (the "measurement problem"), and several interpretations make identical predictions.',
      'Superposition is a precise mathematical feature with testable consequences — interference patterns, quantum computing, chemical bonding. It is not a claim that observers create reality with their thoughts: "measurement" means any physical interaction that records information, such as with a detector, and needs no human mind.',
    ],
    equations: [
      {
        tex: String.raw`|\psi\rangle = \alpha\,|0\rangle + \beta\,|1\rangle,\qquad |\alpha|^2 + |\beta|^2 = 1`,
        caption: 'A two-state superposition (for example, a qubit).',
        vars: [
          ['|\\psi\\rangle', 'the quantum state'],
          ['|0\\rangle, |1\\rangle', 'two basis states, e.g. spin up / spin down'],
          ['\\alpha, \\beta', 'complex amplitudes; |α|² and |β|² are the outcome probabilities (Born rule)'],
        ],
      },
      {
        tex: String.raw`i\hbar\,\frac{\partial}{\partial t}\,|\psi(t)\rangle = \hat{H}\,|\psi(t)\rangle`,
        caption: 'The Schrödinger equation — how a quantum state evolves between measurements.',
        vars: [
          ['\\hbar', 'reduced Planck constant, ≈ 1.055 × 10⁻³⁴ J·s'],
          ['\\hat{H}', 'Hamiltonian: the operator for the system\'s total energy'],
        ],
      },
    ],
    evidence: [
      'The double-slit experiment, performed with single electrons (Tonomura, 1989) and even with large molecules of 2,000 atoms (2019), builds an interference pattern one particle at a time — impossible unless each particle\'s state passes through both slits.',
      'Atomic spectra, the periodic table, semiconductors, lasers and MRI all depend on quantum states. Superconducting and trapped-ion quantum processors manipulate superpositions directly.',
    ],
    history: [
      ['1900', 'Max Planck', 'Energy comes in quanta'],
      ['1925–26', 'Heisenberg, Schrödinger, Born', 'Quantum mechanics and the probability rule'],
      ['1935', 'Schrödinger', 'The "cat" thought experiment criticising naive readings'],
      ['1989', 'Akira Tonomura', 'Single-electron double-slit build-up'],
    ],
    limitations:
      'Superposition of large, warm, everyday objects is not observed because interactions with the environment rapidly suppress interference (decoherence). Quantum mechanics predicts probabilities superbly, but its interpretation — Copenhagen, many-worlds, pilot-wave, objective collapse and others — is not settled by experiment.',
    applies: [
      'Atoms, molecules, light, electrons in materials',
      'Lasers, transistors, LEDs, quantum computers',
      'In principle everything — but effects are usually only visible when systems are isolated',
    ],
    notApplies: [
      'It is <strong>not</strong> evidence that thoughts or intentions create reality',
      'It does not mean "anything is possible": probabilities are precise and calculable',
      'Everyday objects do not display observable superposition, because of decoherence',
    ],
    imagery: null,
    notes: [
      { pos: [0, 2.8, 0], title: 'A probability cloud', body: 'Each point is a place where the electron might be found if measured. The density of points follows the square of the wavefunction.' },
      { pos: [3.2, -1.6, 1], title: 'Measure', body: 'Press "Measure" to record one outcome. The cloud is replaced by a single result; repeat it many times and the results rebuild the cloud\'s statistics.' },
    ],
    mirror: {
      feeling: { label: 'Comfort with uncertainty', text: 'Physics itself works with probabilities and does extraordinarily well. Not knowing an outcome in advance can be held calmly.' },
      thought: { label: 'What do I know?', text: 'What do I actually know here — and what am I assuming because it would be convenient?' },
      action: { label: 'Separate assumption from evidence', text: 'Write a two-column list for one decision: what you have evidence for, and what you are assuming. Act on the first; test the second.' },
      belief: { label: 'Uncertainty as information', text: 'Uncertainty is information about the limits of my knowledge.' },
    },
  },

  /* ───────────────────────────── 08 ───────────────────────────── */
  {
    id: 'uncertainty',
    region: 'Quantum',
    orbit: 'Uncertainty',
    scientificTitle: 'The Heisenberg Uncertainty Principle',
    poeticTitle: 'The Limits of Sharpness',
    transition: 'quantum',
    accent: '#bca983',
    lede: 'Some pairs of quantities cannot both be sharply defined at once. This is a property of nature, not a flaw in our instruments.',
    meaning: [
      'Position and momentum are linked in quantum mechanics: a state that is tightly localised in space must be built from a wide spread of wavelengths, and wavelength corresponds to momentum. Squeeze one distribution and the other must spread.',
      'The uncertainty principle sets a lower bound on the product of the two spreads. It is not merely that measuring disturbs the particle (though it can); even perfectly prepared states cannot have both quantities sharp at once.',
      'Similar trade-offs exist for other pairs of quantities, and for waves of every kind — a short musical note cannot have a perfectly defined pitch.',
    ],
    equations: [
      {
        tex: String.raw`\sigma_x\,\sigma_p \;\ge\; \frac{\hbar}{2}`,
        caption: 'Position–momentum uncertainty relation (Kennard, 1927).',
        vars: [
          ['\\sigma_x', 'standard deviation (spread) of position outcomes'],
          ['\\sigma_p', 'standard deviation of momentum outcomes'],
          ['\\hbar', 'reduced Planck constant, ≈ 1.055 × 10⁻³⁴ J·s'],
        ],
      },
    ],
    evidence: [
      'Single-slit diffraction: narrowing a slit (pinning down position) makes the transmitted beam spread more widely (broader momentum distribution), exactly as predicted.',
      'The principle sets the "zero-point energy" that keeps atoms from collapsing and helium liquid even near absolute zero. Gravitational-wave detectors like LIGO operate at quantum limits and use "squeezed light" — redistributing uncertainty between quantities — to improve sensitivity.',
    ],
    history: [
      ['1927', 'Werner Heisenberg', 'Formulates the uncertainty relation'],
      ['1927', 'Earle Kennard', 'Precise form σₓσₚ ≥ ħ/2'],
      ['1929', 'Howard Robertson', 'Generalises to any pair of observables'],
      ['2016–', 'LIGO', 'Squeezed light in gravitational-wave detection'],
    ],
    limitations:
      'The relation is negligible for everyday objects because ħ is so small. The often-quoted energy–time version has a different status — time is not an operator in standard quantum mechanics — and must be stated with care.',
    applies: [
      'Electrons, photons, atoms — any quantum system',
      'Precision measurement, spectroscopy, quantum optics',
      'Wave phenomena in general (as a bandwidth–duration trade-off)',
    ],
    notApplies: [
      'It does not make everything uncertain: many quantities can be known very precisely',
      'It is not a statement about human ignorance or psychology',
      'Not noticeable at macroscopic scales',
    ],
    imagery: null,
    notes: [
      { pos: [-3.5, 2, 0], title: 'Position spread', body: 'The gold envelope shows where the particle may be found. Narrow it with the slider…' },
      { pos: [3.5, -2, 0], title: 'Momentum spread', body: '…and the silver distribution of momenta must widen. Their product never falls below ħ/2.' },
    ],
    mirror: {
      feeling: { label: 'Releasing perfect certainty', text: 'If nature itself does not offer infinite precision, demanding it from ourselves may be a burden we can set down.' },
      thought: { label: 'Impossible precision', text: 'Where am I demanding a precision that reality cannot provide before I am willing to act?' },
      action: { label: 'Set an uncertainty threshold', text: 'For one stalled decision, define "good enough" in advance: what level of confidence will you accept, and by when?' },
      belief: { label: 'Decisions without omniscience', text: 'Good decisions do not require omniscience.' },
    },
  },

  /* ───────────────────────────── 09 ───────────────────────────── */
  {
    id: 'causality',
    region: 'Causality',
    orbit: 'Causality',
    scientificTitle: 'Relativistic Causal Structure',
    poeticTitle: 'The Cone of Consequence',
    transition: 'relativity',
    accent: '#c9a467',
    lede: 'No cause can affect anything faster than light can travel. Every event has a past it can be influenced by, and a future it can influence.',
    meaning: [
      'Because nothing — no matter, signal or information — travels faster than light in vacuum, each event in spacetime has a <em>light cone</em>. Its future cone contains every event it could possibly influence; its past cone contains every event that could have influenced it.',
      'Events outside each other\'s light cones are "spacelike separated": neither can cause the other, and different observers may even disagree about which happened first. For events inside the cones (timelike separated), every observer agrees on the order — causes always come before effects.',
      'This structure is why relativity and causality coexist: the speed of light is less a speed limit on objects than a limit on how fast cause can reach effect.',
    ],
    equations: [
      {
        tex: String.raw`\Delta s^2 = -c^2\Delta t^2 + \Delta x^2 + \Delta y^2 + \Delta z^2`,
        caption: 'The sign of the interval classifies the relationship between two events.',
        vars: [
          ['\\Delta s^2 < 0', 'timelike: one event can cause the other'],
          ['\\Delta s^2 = 0', 'lightlike: connected only by a light signal'],
          ['\\Delta s^2 > 0', 'spacelike: no causal connection possible'],
        ],
      },
    ],
    evidence: [
      'Every test of special relativity supports the invariance of light speed. No experiment has transmitted information faster than light. Quantum entanglement produces correlations between distant measurements, but the no-communication theorem shows these cannot be used to send signals.',
      'Astronomy is causality made visible: we see the Sun as it was eight minutes ago and distant galaxies as they were billions of years ago. Light from beyond a certain distance has not had time to reach us at all — the edge of the observable universe.',
    ],
    history: [
      ['1676', 'Ole Rømer', 'Light has a finite speed (Io\'s eclipses)'],
      ['1905', 'Albert Einstein', 'Light speed is invariant'],
      ['1908', 'Hermann Minkowski', 'Light cones in spacetime'],
      ['1980s', 'Aspect and others', 'Entanglement tests consistent with no signalling'],
    ],
    limitations:
      'In general relativity, curved spacetime tilts and distorts light cones; inside a black hole every future-directed path leads inward. Some solutions of Einstein\'s equations contain closed timelike curves, but no physically realistic way to create them is known, and quantum gravity may forbid them.',
    applies: [
      'All known physical interactions and signals',
      'Astronomy, telecommunications latency, GPS',
      'The large-scale structure of spacetime',
    ],
    notApplies: [
      'It does not determine which cause, among many possible, produced an effect — that requires evidence',
      'It does not rule out correlation without causation (entanglement)',
      'It says nothing about moral or legal responsibility on its own',
    ],
    imagery: null,
    notes: [
      { pos: [0, 3.3, 0], title: 'Future cone', body: 'Every event in the upper cone can be influenced by the central event. Click any glowing event to test whether a signal could connect it to the centre.' },
      { pos: [0, -3.3, 0], title: 'Past cone', body: 'Everything that could have influenced the central event lies in this lower cone.' },
      { pos: [4.6, 0, 0], title: 'Elsewhere', body: 'Events outside both cones are causally disconnected from the centre — neither can affect the other.' },
    ],
    mirror: {
      feeling: { label: 'Responsibility', text: 'Every action has a future cone. Recognising the reach of what we do can feel weighty — and empowering.' },
      thought: { label: 'Find the mechanism', text: 'What is the actual mechanism between my action and the result I want?' },
      action: { label: 'Map the chain', text: 'Write it out: Action → Mechanism → Intermediate result → Outcome. Where the chain is vague, that is where to investigate.', chain: ['Action', 'Mechanism', 'Intermediate result', 'Outcome'] },
      belief: { label: 'Understand the mechanism', text: 'If I want a different effect, I should understand the mechanism.' },
    },
  },

  /* ───────────────────────────── 10 ───────────────────────────── */
  {
    id: 'expansion',
    region: 'Cosmos',
    orbit: 'Cosmology',
    scientificTitle: 'The Expansion of the Universe',
    poeticTitle: 'The Widening Dark',
    transition: 'scale',
    accent: '#d0ab6c',
    lede: 'Distant galaxies recede from us — and from each other — because space itself is stretching. The farther away, the faster.',
    meaning: [
      'In the 1920s astronomers found that light from distant galaxies is redshifted, and that the redshift grows in proportion to distance. The explanation, now called the <em>Hubble–Lemaître law</em>, is that the universe is expanding: the distance between galaxies not bound together by gravity is increasing.',
      'This is not galaxies flying through space away from a central point. Space itself stretches, everywhere at once, so every observer in every galaxy sees the same pattern. Gravitationally bound systems — atoms, people, planets, galaxies, galaxy clusters — do not expand.',
      'In 1998 two teams measuring distant supernovae found that the expansion is accelerating. The cause is called dark energy, consistent with Einstein\'s cosmological constant, though its nature is unknown.',
      'Scale, for orientation: Earth–Moon ≈ 1.3 light-seconds. Sun–Earth ≈ 8.3 light-minutes. The Milky Way ≈ 100,000 light-years across. The observable universe ≈ 93 billion light-years across.',
    ],
    equations: [
      {
        tex: String.raw`v = H_0\, d`,
        caption: 'Hubble–Lemaître law (valid for not-too-distant galaxies).',
        vars: [
          ['v', 'recession velocity inferred from redshift'],
          ['d', 'proper distance to the galaxy'],
          ['H_0', 'Hubble constant ≈ 67–73 km/s per megaparsec; the spread is the unresolved "Hubble tension"'],
        ],
      },
      {
        tex: String.raw`\left(\frac{\dot a}{a}\right)^2 = \frac{8\pi G}{3}\rho - \frac{k c^2}{a^2} + \frac{\Lambda c^2}{3},\qquad 1+z = \frac{a_{\text{now}}}{a_{\text{then}}}`,
        caption: 'The Friedmann equation, and cosmological redshift as stretched light.',
        vars: [
          ['a(t)', 'scale factor: the relative size of the universe over time'],
          ['\\rho', 'density of matter and radiation'],
          ['k', 'spatial curvature (measured to be close to zero)'],
          ['z', 'redshift: how much light has been stretched in transit'],
        ],
      },
    ],
    evidence: [
      'Vesto Slipher measured galaxy redshifts (1912–1917); Henrietta Leavitt\'s period–luminosity law for Cepheid stars (1912) made distances measurable; Georges Lemaître (1927) and Edwin Hubble (1929) connected the two.',
      'The cosmic microwave background — the cooled afterglow of the hot early universe — was discovered in 1965 and mapped in detail by COBE, WMAP and Planck. Type Ia supernova surveys (1998) revealed acceleration. Baryon acoustic oscillations in the galaxy distribution give an independent ruler.',
    ],
    history: [
      ['1912', 'Henrietta Swan Leavitt', 'Cepheid period–luminosity relation'],
      ['1927', 'Georges Lemaître', 'Expanding-universe solution and the redshift–distance link'],
      ['1929', 'Edwin Hubble', 'Velocity–distance relation from observations'],
      ['1965', 'Penzias & Wilson', 'Cosmic microwave background'],
      ['1998', 'Perlmutter, Schmidt, Riess', 'Accelerating expansion'],
    ],
    limitations:
      'Measurements of the present expansion rate disagree: the early-universe value (~67 km/s/Mpc) and local distance-ladder value (~73 km/s/Mpc) differ beyond their stated errors. Whether this signals new physics or unknown systematic errors is an active question. The nature of dark energy is unknown.',
    applies: [
      'The large-scale universe, between galaxy groups and clusters',
      'The redshift of light from distant objects',
      'The history of the universe from a hot, dense early state',
    ],
    notApplies: [
      'Atoms, planets, the Solar System, the Milky Way — bound systems do not expand',
      'It is not an explosion from a centre into empty space',
      'It does not describe what, if anything, came "before" the hot Big Bang',
    ],
    imagery: {
      src: commons('Hubble_ultra_deep_field.jpg'),
      caption: 'The Hubble Ultra Deep Field: nearly 10,000 galaxies in a patch of sky smaller than a grain of sand held at arm\'s length.',
      credit: 'NASA, ESA, S. Beckwith (STScI) & the HUDF Team',
    },
    notes: [
      { pos: [0, 2.5, 0], title: 'Same view everywhere', body: 'Pick any galaxy as "home": all the others still recede from it, faster with distance. There is no centre.' },
      { pos: [4, -1.5, 0], title: 'Cosmic web', body: 'On the largest scales galaxies gather along filaments and walls around vast voids — a structure grown by gravity from tiny early ripples.' },
    ],
    mirror: {
      feeling: { label: 'Smallness without insignificance', text: 'We are tiny in this picture, and yet we are the part of the universe that can draw the picture. Small is not the same as meaningless.' },
      thought: { label: 'Cosmic time', text: 'What changes when I look at my present worry on cosmic time — and what still matters?' },
      action: { label: 'Zoom out, then return', text: 'Zoom out for a minute — then come back and choose one concrete action you can take today.' },
      belief: { label: 'A finite life', text: 'A finite life can still contain immense meaning.' },
    },
  },

  /* ───────────────────────────── 11 ───────────────────────────── */
  {
    id: 'symmetry',
    region: 'Symmetry',
    orbit: 'Symmetry',
    scientificTitle: "Symmetry & Noether's Theorem",
    poeticTitle: 'What Remains Unchanged',
    transition: 'warp',
    accent: '#d3b779',
    lede: 'Every continuous symmetry of the laws of physics corresponds to something that is conserved.',
    meaning: [
      'A <em>symmetry</em> is a change you can make that leaves something unchanged. Rotate a sphere and it looks the same. Run an experiment today or tomorrow, here or across the room, and — if the laws of physics are the same — you get the same result.',
      'In 1918 Emmy Noether proved that each continuous symmetry of a physical system\'s laws implies a conserved quantity. If the laws do not change with time, energy is conserved. If they do not change from place to place, momentum is conserved. If they do not depend on direction, angular momentum is conserved. A symmetry in the quantum description of charged particles yields conservation of electric charge.',
      'Symmetry → invariance → conservation. Conservation laws are not separate decrees; they are the fingerprints of sameness.',
    ],
    equations: [
      {
        tex: String.raw`\frac{\partial L}{\partial q} = 0 \;\;\Longrightarrow\;\; \frac{d}{dt}\!\left(\frac{\partial L}{\partial \dot q}\right) = 0`,
        caption: 'The simplest case: if the Lagrangian does not depend on a coordinate, its conjugate momentum is conserved.',
        vars: [
          ['L = T - V', 'Lagrangian: kinetic minus potential energy'],
          ['q', 'a coordinate (position, angle…)'],
          ['\\partial L / \\partial \\dot q', 'the momentum conjugate to that coordinate'],
        ],
      },
      {
        tex: String.raw`\begin{aligned}
t \to t + \epsilon &\;\Rightarrow\; \text{energy}\\
\vec x \to \vec x + \vec\epsilon &\;\Rightarrow\; \text{linear momentum}\\
\text{rotation} &\;\Rightarrow\; \text{angular momentum}
\end{aligned}`,
        caption: 'Symmetry (left) and the conserved quantity it implies (right).',
        vars: [['\\epsilon', 'an arbitrarily small shift']],
      },
    ],
    evidence: [
      'Noether\'s theorem is a mathematical result, so it is proved rather than measured — but the conservation laws it explains are among the best-tested facts in physics. Symmetry arguments predicted new particles: the Ω⁻ baryon (1964) was found where symmetry patterns said a gap should be filled.',
      'Physicists also learn from broken symmetries: the weak interaction violates mirror symmetry (Wu experiment, 1957), and slight violations of charge–parity symmetry may help explain why the universe contains matter at all.',
    ],
    history: [
      ['1918', 'Emmy Noether', 'Invariant Variation Problems'],
      ['1954', 'Yang & Mills', 'Gauge symmetry as a source of forces'],
      ['1957', 'Chien-Shiung Wu', 'Parity violation in beta decay'],
      ['1964', 'Gell-Mann & Ne\'eman', 'Symmetry predicts the Ω⁻ particle'],
    ],
    limitations:
      'The theorem applies to <em>continuous</em> symmetries of systems describable by a Lagrangian (action principle). Discrete symmetries (like mirror reflection) do not give conservation laws in the same way. Where a symmetry is absent — for example, time symmetry in an expanding universe — the corresponding conservation law need not hold globally.',
    applies: [
      'Classical mechanics, field theory, particle physics',
      'The foundations of the Standard Model (gauge symmetries)',
      'Crystallography, chemistry and engineering via symmetry analysis',
    ],
    notApplies: [
      'Discrete symmetries do not yield Noether conservation laws directly',
      'Systems without the relevant symmetry (e.g. friction breaks time-reversal symmetry at the macroscopic level)',
      'It does not say which symmetries nature has — that must be discovered experimentally',
    ],
    imagery: null,
    notes: [
      { pos: [0, 2.7, 0], title: 'Invariance', body: 'The figure is rotated by symmetry operations that leave it looking identical. What stays the same under a transformation is what physicists call invariant.' },
      { pos: [3.6, -1.6, 0], title: 'Noether pairs', body: 'Time symmetry ↔ energy. Space symmetry ↔ momentum. Rotational symmetry ↔ angular momentum.' },
    ],
    mirror: {
      feeling: { label: 'Order beneath complexity', text: 'Beneath enormous complexity there are deep regularities. That can feel steadying when the surface of life is turbulent.' },
      thought: { label: 'What remains', text: 'What remains true about me when everything else changes?' },
      action: { label: 'Identify enduring principles', text: 'Write down three principles you would keep through a change of job, city or circumstance. Use them as constants when deciding.' },
      belief: { label: 'Constants in adaptation', text: 'Adaptation does not require abandoning every constant.' },
    },
  },

  /* ───────────────────────────── 12 ───────────────────────────── */
  {
    id: 'unknown',
    region: 'The Unknown',
    orbit: 'Unknown',
    scientificTitle: 'The Open Questions',
    poeticTitle: 'The Unknown',
    transition: 'silence',
    accent: '#a99a7c',
    lede: 'Every map has an edge.',
    edgeLine: 'Beyond this point, we investigate.',
    meaning: [
      'The laws in this codex are among the most reliable knowledge humanity has. They are also incomplete. Honest science is precise about what it does not know.',
    ],
    openQuestions: [
      ['Quantum gravity', 'General relativity and quantum mechanics are each extraordinarily successful, but they are mathematically incompatible in regimes where both matter — black hole interiors, the first moment of the universe. String theory, loop quantum gravity and other approaches exist; none is experimentally confirmed.'],
      ['Dark matter', 'Galaxy rotation, gravitational lensing, cluster dynamics and the cosmic microwave background all indicate roughly five times more matter than we can see. No dark-matter particle has been detected directly.'],
      ['Dark energy', 'About 68% of the universe\'s energy content drives accelerating expansion. Whether it is a cosmological constant, a changing field, or a sign that gravity needs revising is unknown; recent surveys hint it may evolve over time.'],
      ['Matter–antimatter asymmetry', 'The Big Bang should have produced matter and antimatter equally, which would have annihilated. Something tipped the balance by about one part in a billion. Known symmetry violations are too small to explain it.'],
      ['The origin of the universe', 'We can trace cosmic history back to a hot, dense state about 13.8 billion years ago. Whether there was an "inflationary" epoch, what preceded it, and whether "before" even has meaning remain open.'],
      ['The nature of spacetime', 'Is spacetime fundamental, or does it emerge from something deeper — such as quantum entanglement? Several research programmes suggest the latter; none is established.'],
      ['Tensions between measurements', 'The Hubble tension, the precise mass of neutrinos, and anomalies in particle measurements may be errors — or the first threads of new physics.'],
      ['Consciousness', 'Why and how physical processes give rise to subjective experience is unresolved. This lies <strong>outside established fundamental physics</strong>: it is studied by neuroscience, psychology and philosophy, and no law in this codex explains it.'],
    ],
    equations: [
      {
        tex: String.raw`\Omega_{\text{ordinary}} \approx 0.05\qquad \Omega_{\text{dark matter}} \approx 0.27\qquad \Omega_{\Lambda} \approx 0.68`,
        caption: 'The measured energy budget of the universe (Planck 2018). About 95% is of unknown nature.',
        vars: [
          ['\\Omega', 'fraction of the total energy density of the universe'],
          ['\\Omega_{\\text{ordinary}}', 'atoms: stars, planets, gas, people'],
          ['\\Omega_{\\Lambda}', 'dark energy'],
        ],
      },
    ],
    evidence: [
      'The open questions are not gaps in effort but frontiers of evidence: underground dark-matter detectors, the Large Hadron Collider, gravitational-wave observatories, the Euclid, Rubin and DESI surveys, and the James Webb Space Telescope are all gathering data aimed at them.',
    ],
    history: [
      ['1933', 'Fritz Zwicky', 'Missing mass in the Coma cluster'],
      ['1970s', 'Vera Rubin & Kent Ford', 'Flat galaxy rotation curves'],
      ['1998', 'Supernova teams', 'Accelerating expansion — dark energy'],
      ['Now', 'You, perhaps', 'The questions remain open'],
    ],
    limitations: 'This chapter is, by definition, about limitations.',
    applies: ['Wherever our best theories meet each other, or meet the data, and disagree'],
    notApplies: ['Not knowing is not the same as anything being possible — answers must still fit everything we already know'],
    imagery: {
      src: commons('1e0657_scale.jpg'),
      caption: 'The Bullet Cluster: the mass (blue, from lensing) has separated from the hot gas (pink) — strong evidence for dark matter.',
      credit: 'NASA / CXC / CfA / STScI / ESO WFI / Magellan',
    },
    notes: [
      { pos: [0, 1.5, -2], title: 'The edge of the map', body: 'Most of the universe\'s content is dark matter and dark energy — names for things we can measure the effects of but do not understand.' },
    ],
    mirror: {
      feeling: { label: 'Wonder', text: 'Standing at the edge of what is known, wonder is a fitting response — not because science has failed, but because there is still more to find.' },
      thought: { label: 'Investigate, not pretend', text: 'What would I investigate rather than pretend to know?' },
      action: { label: 'Stay curious', text: 'Pick one question you have been answering by habit. Look up how it is actually known — or whether it is known at all.' },
      belief: { label: 'An invitation', text: 'Not knowing is not failure. It is an invitation to investigate.' },
    },
  },
];

export const RETURN_IMAGE = {
  src: commons('Pale_Blue_Dot.png', 900),
  caption: 'Earth from 6 billion km — the "Pale Blue Dot", Voyager 1, 1990.',
  credit: 'NASA / JPL-Caltech',
};

export const DIMENSIONS = [
  { key: 'feeling', name: 'Feeling', verb: 'FEEL', glyph: '◐' },
  { key: 'thought', name: 'Thought', verb: 'THINK', glyph: '◇' },
  { key: 'action', name: 'Action', verb: 'ACT', glyph: '△' },
  { key: 'belief', name: 'Belief', verb: 'BELIEVE', glyph: '✧' },
];

export const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
