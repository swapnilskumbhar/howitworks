import { defineExplainer } from '../../framework/index.js';
import meta from './meta.js';
import { buildJetEngine } from './model.js';

// Every step runs the engine as a loop while active — the spool spins a
// WHOLE number of turns per lap and the airflow advances a whole number of
// cycles, so the wrap is invisible. Steps differ in speed (spool-up story),
// fuel and thrust; the camera provides the focus.
function running({ turns, laps, fuel = 0, thrust = 0, duration = 3000 }) {
  return ({ tl, handles }) => {
    const s = { t: 0 };
    tl.add(s, {
      t: 1,
      duration,
      ease: 'linear',
      onUpdate: () =>
        handles.set({
          spin: s.t * Math.PI * 2 * turns,
          flow: (s.t * laps) % 1,
          fuel,
          thrust,
        }),
    });
  };
}

export default defineExplainer({
  ...meta,

  buildScene({ scene }) {
    return buildJetEngine({ scene });
  },

  steps: [
    {
      id: 'overview',
      heading: 'The anatomy',
      body: 'A turbojet is one long air tunnel. At the front, a fan and rows of compressor discs on a single spinning shaft. In the middle, combustion cans where fuel burns. At the back, a turbine and a nozzle. Air enters on the left and leaves — much faster — on the right.',
      hint: 'Drag to orbit · scroll to spool it up.',
      camera: { position: [2.6, 2.8, 4.8], target: [0, 1.4, 0] },
      onEnter: ({ handles }) => handles.setLabels(true),
      timeline: running({ turns: 2, laps: 2, duration: 6000 }),
    },
    {
      id: 'suck',
      heading: '1 · Suck',
      body: 'The spool starts turning and the fan bites into the air, pulling a huge continuous stream (blue) into the intake. Unlike a piston engine gulping one cylinder at a time, this river of air never stops flowing.',
      camera: { position: [-4.4, 2.0, 3.0], target: [-1.1, 1.4, 0] },
      onEnter: ({ handles }) => handles.setLabels(false),
      timeline: running({ turns: 5, laps: 3, duration: 3200 }),
    },
    {
      id: 'squeeze',
      heading: '2 · Squeeze',
      body: 'The air is forced through ever-smaller compressor stages — each spinning disc shoves it into a tighter space. By the end it is squeezed to dozens of times atmospheric pressure and already scorching hot, before a drop of fuel is added.',
      camera: { position: [-1.6, 2.4, 2.8], target: [-0.3, 1.4, 0] },
      onEnter: ({ handles }) => handles.setLabels(false),
      timeline: running({ turns: 7, laps: 4, duration: 2800 }),
    },
    {
      id: 'bang',
      heading: '3 · Bang',
      body: 'Fuel sprays into the combustion cans and ignites — and keeps igniting, a continuous controlled blowtorch rather than separate explosions. The gas (orange) expands violently, desperate for somewhere to go. There is only one way out: backwards.',
      camera: { position: [0.6, 2.2, 2.6], target: [0.35, 1.4, 0] },
      onEnter: ({ handles }) => handles.setLabels(false),
      timeline: running({ turns: 9, laps: 5, fuel: 1, thrust: 0.3, duration: 2600 }),
    },
    {
      id: 'blow',
      heading: '4 · Blow',
      body: 'On its way out, the roaring gas spins the turbine — which drives the shaft that powers the fan and compressor at the front. The engine feeds itself. Whatever energy is left squeezes through the narrowing nozzle and leaves as a screaming jet: thrust.',
      camera: { position: [4.6, 1.9, 3.2], target: [1.2, 1.4, 0] },
      onEnter: ({ handles }) => handles.setLabels(false),
      timeline: running({ turns: 11, laps: 6, fuel: 1, thrust: 1, duration: 2400 }),
    },
    {
      id: 'run',
      heading: 'Run it',
      body: 'All four stages at once, forever: the front of the engine is sucking and squeezing at the very moment the back is banging and blowing. That continuity is why jets make such relentless, smooth power compared to a piston engine’s bang-pause-bang.',
      hint: 'Drag to orbit the running engine.',
      camera: { position: [3.4, 2.7, 5.2], target: [0, 1.4, 0] },
      freeOrbit: true,
      onEnter: ({ handles }) => handles.setLabels(false),
      timeline: running({ turns: 8, laps: 6, fuel: 1, thrust: 1, duration: 4000 }),
    },
  ],
});
