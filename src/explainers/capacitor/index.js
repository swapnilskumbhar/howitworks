import { defineExplainer } from '../../framework/index.js';
import meta from './meta.js';
import { buildCapacitor } from './model.js';

// Every step loops while active. Seamlessness rule: each lap's scalar state
// (charge, unroll, flash) starts and ends at the same value, or completes a
// whole number of cycles, so the wrap is invisible.

export default defineExplainer({
  ...meta,

  buildScene({ scene }) {
    return buildCapacitor({ scene });
  },

  steps: [
    {
      id: 'anatomy',
      heading: '1 · The component',
      body: 'This is a 220 microfarad aluminum electrolytic capacitor — a can of rolled metal foil that stores electric charge instead of letting current flow straight through. The polarity stripe marks its negative lead (get it backwards and it can vent violently), and the scored top is a pressure-relief vent for exactly that failure mode.',
      hint: 'Drag to orbit · scroll to look inside.',
      camera: { position: [1.9, 1.65, 2.7], target: [0, 1.0, 0] },
      onEnter: ({ handles }) => {
        handles.setView('assembled');
        handles.setLabels(true);
      },
      timeline: ({ tl, handles }) => {
        const s = { t: 0 };
        tl.add(s, {
          t: 1,
          duration: 7000,
          ease: 'linear',
          onUpdate: () => handles.set({ charge: 0.15 + 0.15 * (1 + Math.sin(s.t * Math.PI * 2)) }),
        });
      },
    },
    {
      id: 'roll',
      heading: '2 · Inside: the rolled foil',
      body: 'Peel the can away and it is not two flat plates at all — it is one very long sandwich, rolled up tight: a strip of aluminum foil (the anode), a paper spacer soaked in a conductive electrolyte, and a second foil strip (the cathode), wound together like a scroll around a plastic mandrel.',
      camera: { position: [1.35, 1.35, 1.55], target: [0, 1.0, 0] },
      onEnter: ({ handles }) => {
        handles.setView('roll');
        handles.setLabels(true);
      },
      timeline: ({ tl, handles }) => {
        const s = { t: 0 };
        tl.add(s, {
          t: 1,
          duration: 4200,
          ease: 'linear',
          onUpdate: () => handles.set({ unroll: 0.16 * (1 + Math.sin(s.t * Math.PI * 2)) / 2 }),
        });
      },
    },
    {
      id: 'unroll',
      heading: '3 · Unrolling: the true length',
      body: 'Uncoil it and the foil is startlingly long — squeezing that much surface area into a small can is exactly how electrolytics pack so much capacitance into so little space. More surface area facing more surface area, separated by the same thin gap, is literally what capacitance is: C = εA / d.',
      camera: { position: [0.25, 1.4, 3.5], target: [0, 1.0, 0] },
      onEnter: ({ handles }) => {
        handles.setView('roll');
        handles.setLabels(false);
      },
      timeline: ({ tl, handles }) => {
        const s = { t: 0 };
        tl.add(s, {
          t: 1,
          duration: 6000,
          ease: 'linear',
          onUpdate: () => {
            const tri = 1 - Math.abs(1 - 2 * s.t);
            handles.set({ unroll: tri });
          },
        });
      },
    },
    {
      id: 'charging',
      heading: '4 · Charging: Q = CV',
      body: 'Simplify the roll to what it really is: two conductive plates facing each other across a gap. Wire them to a voltage source and electrons pile onto one plate while an equal number are pushed off the other — they can never cross the gap between. The charge that piles up, Q, is proportional to the voltage applied: Q = CV.',
      camera: { position: [1.15, 1.2, 1.3], target: [0, 1.0, 0] },
      onEnter: ({ handles }) => {
        handles.setView('plates');
        handles.setLabels(true);
      },
      timeline: ({ tl, handles }) => {
        const s = { t: 0 };
        tl.add(s, {
          t: 1,
          duration: 4200,
          ease: 'linear',
          onUpdate: () => {
            const tri = 1 - Math.abs(1 - 2 * s.t);
            handles.set({ charge: tri });
          },
        });
      },
    },
    {
      id: 'dielectric',
      heading: "5 · The dielectric's job",
      body: "That gap is not empty — it is filled with an insulator, the dielectric (here, the electrolyte-soaked paper). It never conducts, but its molecules are tiny dipoles that swivel to line up with the field as charge builds. That polarization partly cancels the field, which lets the plates hold MORE charge at the same voltage — raising the capacitance C well above what an air gap could manage.",
      camera: { position: [0.7, 1.05, 0.95], target: [0, 1.0, 0] },
      onEnter: ({ handles }) => {
        handles.setView('plates');
        handles.setLabels(true);
      },
      timeline: ({ tl, handles }) => {
        const s = { t: 0 };
        tl.add(s, {
          t: 1,
          duration: 4600,
          ease: 'linear',
          onUpdate: () => {
            const tri = 1 - Math.abs(1 - 2 * s.t);
            handles.set({ charge: tri });
          },
        });
      },
    },
    {
      id: 'discharge',
      heading: '6 · Discharge: a flash of energy',
      body: 'Unlike a battery, a capacitor gives its energy back instantly rather than trickling it out — that is exactly how a camera flash works. Charge it slowly, then hand it a low-resistance path and every stored electron leaves at once: the field collapses in a fraction of a second and the energy, W = ½CV², comes out as one bright pulse.',
      camera: { position: [1.55, 1.0, 1.15], target: [0.3, 1.0, 0] },
      onEnter: ({ handles }) => {
        handles.setView('plates');
        handles.setLabels(true);
      },
      timeline: ({ tl, handles }) => {
        const rise = { t: 0 };
        const drop = { t: 0 };
        tl.add(rise, {
          t: 1,
          duration: 2500,
          ease: 'inOutSine',
          onUpdate: () => handles.set({ charge: rise.t, flash: 0 }),
        });
        tl.add(drop, {
          t: 1,
          duration: 650,
          ease: 'linear',
          onUpdate: () =>
            handles.set({ charge: 1 - drop.t, flash: Math.sin(Math.PI * drop.t) }),
        });
      },
    },
    {
      id: 'run',
      heading: '7 · Smoothing the ripple',
      body: 'Reassembled, this is the same part you will find scattered across almost any circuit board — quietly charging on every voltage peak and discharging into the dips, ironing a bumpy, rectified AC ripple into something close to smooth DC. It never touches the signal directly; it just keeps borrowing and repaying charge, faster than you can see.',
      hint: 'Drag to orbit while it runs.',
      camera: { position: [2.1, 1.75, 2.9], target: [0, 1.0, 0.1] },
      freeOrbit: true,
      onEnter: ({ handles }) => {
        handles.setView('assembled');
        handles.setLabels(false);
      },
      timeline: ({ tl, handles }) => {
        const s = { t: 0 };
        tl.add(s, {
          t: 1,
          duration: 3000,
          ease: 'linear',
          onUpdate: () =>
            handles.set({ charge: 0.5 + 0.5 * Math.sin(s.t * Math.PI * 2 * 3) }),
        });
      },
    },
  ],
});
