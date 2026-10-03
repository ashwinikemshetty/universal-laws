import motion from './motion.js';
import gravity from './gravity.js';
import energy from './energy.js';
import entropy from './entropy.js';
import em from './em.js';
import relativity from './relativity.js';
import superposition from './superposition.js';
import uncertainty from './uncertainty.js';
import causality from './causality.js';
import cosmicScale from './cosmicScale.js';
import symmetry from './symmetry.js';
import unknown from './unknown.js';

/** Chapter id → scene factory. `return` reuses the cosmic-scale scene, running in reverse. */
export const SCENES = {
  motion,
  gravity,
  energy,
  entropy,
  em,
  relativity,
  superposition,
  uncertainty,
  causality,
  expansion: cosmicScale,
  symmetry,
  unknown,
  return: (ctx) => cosmicScale(ctx, { mode: 'return' }),
};
