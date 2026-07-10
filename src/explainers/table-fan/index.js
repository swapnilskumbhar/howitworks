import { defineExplainer } from '../../framework/index.js';
import meta from './meta.js';
import { buildFan } from './model.js';

// Every step loops while active. Seamlessness rule: spin advances a WHOLE
// number of turns per lap and flow a whole number of cycles, so the loop
// wrap lands on an identical pose.

export default defineExplainer({
  ...meta,

  buildScene({ scene }) {
    return buildFan({ scene });
  },

  steps: [
    {
      id: 'overview',
      heading: 'The anatomy',
      body: 'A desk fan is just four systems: a weighted base, an electric motor in the head, three pitched blades on the motor shaft, and a wire guard so you keep your fingers. The copper ring inside the housing is the stator — the electromagnet that does all the work.',
      hint: 'Drag to orbit · scroll to dig in.',
      camera: { position: [2.6, 2.2, 4.2], target: [0, 1.3, 0] },
      onEnter: ({ handles }) => handles.setLabels(true),
      timeline: ({ tl, handles }) => {
        const s = { t: 0 };
        tl.add(s, {
          t: 1,
          duration: 5000,
          ease: 'linear',
          onUpdate: () =>
            handles.set({ spin: s.t * Math.PI * 4, airOn: false, yaw: 0 }),
        });
      },
    },
    {
      id: 'motor',
      heading: 'The motor spins',
      body: 'Alternating current in the stator coils creates a rotating magnetic field. The rotor chases that field, dragging the shaft — and the blades bolted to it — around with it, about 20 times every second.',
      camera: { position: [1.6, 1.8, -3.6], target: [0, 1.5, -0.2] },
      onEnter: ({ handles }) => handles.setLabels(false),
      timeline: ({ tl, handles }) => {
        const s = { t: 0 };
        tl.add(s, {
          t: 1,
          duration: 2500,
          ease: 'linear',
          onUpdate: () =>
            handles.set({ spin: s.t * Math.PI * 10, airOn: false, yaw: 0 }),
        });
      },
    },
    {
      id: 'blades',
      heading: 'Blades push the air',
      body: 'Each blade is tilted like a boat propeller. As it sweeps around, its angled face shoves air backward-to-forward, carving a moving column of air out in front of the fan. More tilt or more speed means more breeze.',
      camera: { position: [0.4, 1.6, 4.6], target: [0, 1.4, 0.6] },
      onEnter: ({ handles }) => handles.setLabels(false),
      timeline: ({ tl, handles }) => {
        const s = { t: 0 };
        tl.add(s, {
          t: 1,
          duration: 2400,
          ease: 'linear',
          onUpdate: () =>
            handles.set({
              spin: s.t * Math.PI * 14,
              flow: (s.t * 4) % 1,
              airOn: true,
              yaw: 0,
            }),
        });
      },
    },
    {
      id: 'oscillate',
      heading: 'The sweep',
      body: 'A small gearbox on the back of the motor turns the fast spin into a slow push-pull on a crank linked to the stand. That link swings the whole head left and right, sweeping the airflow across the room. Flip the knob and the crank disconnects — the fan stares straight ahead.',
      hint: 'Drag to orbit while it runs.',
      camera: { position: [3.4, 2.6, 4.4], target: [0, 1.4, 0] },
      freeOrbit: true,
      onEnter: ({ handles }) => handles.setLabels(false),
      timeline: ({ tl, handles }) => {
        const s = { t: 0 };
        tl.add(s, {
          t: 1,
          duration: 6000,
          ease: 'linear',
          onUpdate: () =>
            handles.set({
              spin: s.t * Math.PI * 40,
              flow: (s.t * 8) % 1,
              airOn: true,
              yaw: Math.sin(s.t * Math.PI * 2) * 0.7,
            }),
        });
      },
    },
  ],
});
