import { defineExplainer } from '../../framework/index.js';
import meta from './meta.js';
import { buildVTwin } from './model.js';

// Every step runs the engine as a loop while active: 1440° per lap — two
// complete 720° four-stroke cycles, the true period of the twin's firing
// pattern — so the wrap is invisible. Each timeline owns its LOCAL state
// object (sharing one across timelines makes anime.js cancel the earlier
// tween and the animation silently dies).
function crankLoop(duration = 3600) {
  return ({ tl, handles }) => {
    const s = { angle: 0 };
    tl.add(s, {
      angle: 1440,
      duration,
      ease: 'linear',
      onUpdate: () => handles.setCycle(s.angle),
    });
  };
}

export default defineExplainer({
  ...meta,

  buildScene({ scene }) {
    return buildVTwin({ scene });
  },

  steps: [
    {
      id: 'overview',
      heading: 'The anatomy',
      body: 'Two air-cooled cylinders splayed 90° apart in a V, sharing one crankcase. Cylinder A leans right, cylinder B leans left, and down in the case both connecting rods grip the very same crankpin. One carburetor feeds both through the valley; each bank breathes out through its own swept exhaust header.',
      hint: 'Drag to orbit · scroll for the mechanism.',
      camera: { position: [4.2, 2.6, 6.0], target: [0, 1.5, 0] },
      onEnter: ({ handles }) => handles.setLabels(true),
      timeline: crankLoop(7200),
    },
    {
      id: 'crankpin',
      heading: '1 · One pin, two rods',
      body: 'Here is the V-twin\'s defining trick: both con-rods ride the same crankpin, side by side. As the crank turns, the pin drags both rods around one shared circle — but because the cylinders point 90° apart, each piston reads that circle differently. When A is at the top of its bore, B is only halfway up its own.',
      camera: { position: [1.4, 1.0, 3.2], target: [0, 1.05, 0] },
      onEnter: ({ handles }) => handles.setLabels(false),
      timeline: crankLoop(4800),
    },
    {
      id: 'strokes',
      heading: '2 · Four strokes, two cylinders',
      body: 'Each cylinder runs the classic four-stroke recipe — intake (blue), compression, power (orange), exhaust (grey) — over two full crank turns. Watch both bores: they perform the same play, just never on the same line at the same time. The shared pin keeps them exactly 270° of crank apart.',
      camera: { position: [2.8, 2.4, 4.6], target: [0, 1.7, 0] },
      onEnter: ({ handles }) => handles.setLabels(false),
      timeline: crankLoop(),
    },
    {
      id: 'firing',
      heading: '3 · The offbeat heartbeat',
      body: 'Count the sparks: bang, 270° later bang — then a long 450° pause before the next pair. A 90° V-twin cannot fire evenly, and that lopsided 270/450 rhythm is the exact sound you know from a big twin at idle: po-tato, po-tato. The flywheel carries the crank through the long silence.',
      camera: { position: [0.2, 1.9, 5.4], target: [0, 1.6, 0] },
      onEnter: ({ handles }) => handles.setLabels(false),
      timeline: crankLoop(),
    },
    {
      id: 'balance',
      heading: '4 · The 90° secret',
      body: 'Why 90° and not 60 or 80? Balance. The crank\'s counterweight is sized to cancel one piston — which overcorrects, flinging its leftover force at right angles to the bore. With the second cylinder mounted exactly 90° around, that leftover lands squarely along ITS bore, cancelling that piston\'s shake too. One counterweight, two pistons, perfect primary balance — no balance shaft needed.',
      camera: { position: [-2.6, 1.3, 4.2], target: [0, 1.1, 0] },
      onEnter: ({ handles }) => handles.setLabels(false),
      timeline: crankLoop(),
    },
    {
      id: 'run',
      heading: 'Run it',
      body: 'Both cylinders working the shared pin, the offbeat pulses smoothed by the flywheel, the whole engine standing dead still while thousands of explosions a minute hammer through it. That is a V-twin: maximum character per cylinder.',
      hint: 'Drag to orbit the running engine.',
      camera: { position: [4.6, 2.8, 6.2], target: [0, 1.5, 0] },
      freeOrbit: true,
      onEnter: ({ handles }) => handles.setLabels(false),
      timeline: crankLoop(3000),
    },
  ],
});
