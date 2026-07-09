import { defineExplainer } from '../../framework/index.js';
import meta from './meta.js';
import { buildInductor } from './model.js';

// Every step loops while active. Seamlessness rule: each lap's scalar state
// (current, flow, coreIn, spark) starts and ends at the same value, or
// completes a whole number of cycles, so the wrap is invisible.

function tri(t) {
  return 1 - Math.abs(1 - 2 * t);
}

export default defineExplainer({
  ...meta,

  buildScene({ scene }) {
    return buildInductor({ scene });
  },

  steps: [
    {
      id: 'anatomy',
      heading: '1 · The component',
      body: 'This is a toroidal inductor — a ferrite ring wound with enamelled copper wire. Push current through the winding and it builds a magnetic field; the donut shape keeps that field looped entirely inside the ring instead of leaking into the space around it, which is why toroids are everywhere inside switching power supplies.',
      hint: 'Drag to orbit.',
      camera: { position: [1.75, 1.55, 2.25], target: [0, 1.05, 0] },
      onEnter: ({ handles }) => {
        handles.setView('toroid');
        handles.set({ closedViz: 0, fieldViz: 0, spark: 0, showEnergy: false, coreIn: 1 });
        handles.setLabels('anatomy', true);
      },
      timeline: ({ tl, handles }) => {
        const s = { t: 0 };
        tl.add(s, {
          t: 1,
          duration: 6000,
          ease: 'linear',
          onUpdate: () =>
            handles.set({
              current: 0.25 + 0.2 * (1 + Math.sin(s.t * Math.PI * 2)),
              flow: s.t * 4,
            }),
        });
      },
    },
    {
      id: 'field',
      heading: '2 · Current makes a field',
      body: "Blow this winding up into a straight coil on a rod and the invisible part becomes visible: current flowing around each turn builds a magnetic field straight through the coil's axis, looping back outside through open space. Curl your right hand's fingers the way the current circles the winding and your thumb points the way the field runs — the right-hand rule.",
      camera: { position: [1.3, 1.35, 1.6], target: [0, 1.1, 0] },
      onEnter: ({ handles }) => {
        handles.setView('schematic');
        handles.set({ fieldViz: 1, closedViz: 0, spark: 0, showEnergy: false, coreIn: 1 });
        handles.setLabels('field', true);
      },
      timeline: ({ tl, handles }) => {
        const s = { t: 0 };
        tl.add(s, {
          t: 1,
          duration: 4200,
          ease: 'linear',
          onUpdate: () => handles.set({ current: tri(s.t), flow: s.t * 5 }),
        });
      },
    },
    {
      id: 'back-emf',
      heading: '3 · Opposing the change',
      body: "An inductor doesn't resist current — it resists a CHANGE in current. Ramp the current up and a back-EMF appears that fights the rise, exactly like inertia in a moving mass (Lenz's law: V = L·dI/dt). Now cut the circuit: the collapsing field forces that current to keep going somewhere, and it jumps as a spark across the nearest gap — the same reason switch contacts arc and pit.",
      camera: { position: [1.55, 1.75, 2.0], target: [0.15, 1.35, 0.1] },
      onEnter: ({ handles }) => {
        handles.setView('schematic');
        handles.set({ fieldViz: 1, closedViz: 0, showEnergy: false, coreIn: 1 });
        handles.setLabels('back', true);
      },
      timeline: ({ tl, handles }) => {
        const s = { t: 0 };
        tl.add(s, {
          t: 1,
          duration: 4400,
          ease: 'linear',
          onUpdate: () => {
            const t = s.t;
            let current = 0;
            let spark = 0;
            if (t < 0.55) {
              const u = t / 0.55;
              current = 1 - Math.exp(-6 * u);
            } else if (t < 0.63) {
              const u = (t - 0.55) / 0.08;
              current = (1 - Math.exp(-6)) * (1 - u);
              spark = Math.sin(Math.PI * u);
            } else {
              current = 0;
              spark = 0;
            }
            handles.set({ current, spark, flow: t * 5 });
          },
        });
      },
    },
    {
      id: 'energy',
      heading: '4 · Energy stored in the field',
      body: "That field is not free — building it costs energy, and it comes right back out of the source, stored as W = ½LI². Double the current and the stored energy quadruples, not doubles: the glow around the coil brightens far faster than the current itself, because it tracks I², not I.",
      camera: { position: [1.35, 1.3, 1.55], target: [0, 1.05, 0] },
      onEnter: ({ handles }) => {
        handles.setView('schematic');
        handles.set({ fieldViz: 1, closedViz: 0, spark: 0, showEnergy: true, coreIn: 1 });
        handles.setLabels('energy', true);
      },
      timeline: ({ tl, handles }) => {
        const s = { t: 0 };
        tl.add(s, {
          t: 1,
          duration: 4600,
          ease: 'linear',
          onUpdate: () => handles.set({ current: tri(s.t), flow: s.t * 5 }),
        });
      },
    },
    {
      id: 'core',
      heading: "5 · The core's role",
      body: 'Slide a ferromagnetic core into the coil and the same current produces a dramatically stronger field — a ferrite or iron core can multiply a coil\'s inductance by a factor of thousands over an identical air-core winding, simply by concentrating far more flux for the same amp through the wire.',
      camera: { position: [1.3, 1.25, 1.5], target: [0, 1.05, 0] },
      onEnter: ({ handles }) => {
        handles.setView('schematic');
        handles.set({ fieldViz: 1, closedViz: 0, spark: 0, showEnergy: false, current: 0.7 });
        handles.setLabels('core', true);
      },
      timeline: ({ tl, handles }) => {
        const s = { t: 0 };
        tl.add(s, {
          t: 1,
          duration: 5000,
          ease: 'linear',
          onUpdate: () => handles.set({ coreIn: tri(s.t), flow: s.t * 5, current: 0.7 }),
        });
      },
    },
    {
      id: 'closed-loop',
      heading: '6 · Why a ring',
      body: 'Back to the real part: wound around a closed ring instead of an open rod, the field never has to loop through open air at all — it stays circulating inside the ferrite the whole way round. Less stray field means less interference with everything else on the board, which is exactly why toroids dominate real power supplies.',
      camera: { position: [1.6, 1.5, 2.0], target: [0, 1.05, 0] },
      onEnter: ({ handles }) => {
        handles.setView('toroid');
        handles.set({ closedViz: 1, coreIn: 1 });
        handles.setLabels('closed', true);
      },
      timeline: ({ tl, handles }) => {
        const s = { t: 0 };
        tl.add(s, {
          t: 1,
          duration: 5000,
          ease: 'linear',
          onUpdate: () =>
            handles.set({
              current: 0.35 + 0.25 * (1 + Math.sin(s.t * Math.PI * 2)),
              flow: s.t * 4,
            }),
        });
      },
    },
    {
      id: 'run',
      heading: '7 · Quietly running',
      body: 'Reassembled, this is the same small ring you will find in almost every power supply and filter circuit — smoothing switching current, storing and releasing a burst of energy every cycle, and always, always resisting the change rather than the flow.',
      hint: 'Drag to orbit while it runs.',
      camera: { position: [1.9, 1.7, 2.4], target: [0, 1.05, 0.1] },
      freeOrbit: true,
      onEnter: ({ handles }) => {
        handles.setView('toroid');
        handles.set({ closedViz: 0, spark: 0 });
        handles.setLabels('run', false);
      },
      timeline: ({ tl, handles }) => {
        const s = { t: 0 };
        tl.add(s, {
          t: 1,
          duration: 3000,
          ease: 'linear',
          onUpdate: () =>
            handles.set({
              current: Math.abs(Math.sin(s.t * Math.PI * 2 * 3)),
              flow: s.t * 6,
            }),
        });
      },
    },
  ],
});
