import { defineExplainer } from '../../framework/index.js';
import meta from './meta.js';
import { buildTransistor } from './model.js';

// Every step loops while active. Seamlessness rule: each lap's scalar state
// (bias, colFlow, baseFlow, dieFlow, sigMod) starts and ends at the same
// value, or completes a whole number of cycles, so the wrap is invisible.

export default defineExplainer({
  ...meta,

  buildScene({ scene }) {
    return buildTransistor({ scene });
  },

  steps: [
    {
      id: 'anatomy',
      heading: '1 · The component',
      body: 'This is an NPN bipolar junction transistor in a TO-92 package — three legs (Emitter, Base, Collector) sealed in black epoxy around a sliver of silicon. It has no moving parts and stores no charge; its entire job is letting a whisper of current at one terminal control a flood of current between the other two.',
      hint: 'Drag to orbit · scroll to look inside.',
      camera: { position: [1.7, 1.55, 2.3], target: [0, 0.85, 0] },
      onEnter: ({ handles }) => {
        handles.setView('assembled');
        handles.setLabels('package', true);
      },
      timeline: ({ tl, handles }) => {
        const s = { t: 0 };
        tl.add(s, {
          t: 1,
          duration: 6000,
          ease: 'linear',
          onUpdate: () => handles.set({ bias: 0.55, colFlow: s.t * 2, baseFlow: s.t * 2 }),
        });
      },
    },
    {
      id: 'die',
      heading: '2 · Inside: the silicon die',
      body: 'Peel away the epoxy and the whole transistor is barely a couple of millimeters of silicon on a metal paddle. It is grown in layers: a wide N collector at the bottom, an almost paper-thin P base on top of that, and a small, heavily-doped N emitter diffused into just part of the base surface. Two gold wires the width of a hair carry the emitter and base connections out to the leads.',
      camera: { position: [0.55, 1.15, 0.85], target: [0, 0.65, 0] },
      onEnter: ({ handles }) => {
        handles.setView('die');
        handles.setLabels('die', true);
      },
      timeline: ({ tl, handles }) => {
        const s = { t: 0 };
        tl.add(s, {
          t: 1,
          duration: 4000,
          ease: 'linear',
          onUpdate: () => handles.set({ dieFlow: s.t * 3 }),
        });
      },
    },
    {
      id: 'biasing',
      heading: '3 · Two junctions, two different biases',
      body: 'Blow the die up to see the two junctions clearly. The base-emitter junction is forward-biased: that collapses its depletion zone to almost nothing, so current can cross easily. The base-collector junction is reverse-biased instead — its depletion zone stays wide, held apart by a strong internal field rather than conducting current the normal way. Watch both zones breathe as the bias sweeps on and off.',
      camera: { position: [0.2, 1.55, 3.4], target: [-0.35, 0.95, 0] },
      onEnter: ({ handles }) => {
        handles.setView('schematic');
        handles.setLabels('bias', true);
      },
      timeline: ({ tl, handles }) => {
        const s = { t: 0 };
        tl.add(s, {
          t: 1,
          duration: 5000,
          ease: 'inOutSine',
          onUpdate: () => {
            const tri = 1 - Math.abs(1 - 2 * s.t);
            handles.set({ bias: tri, colFlow: s.t * 2, baseFlow: s.t * 2, sigMod: 1 });
          },
        });
      },
    },
    {
      id: 'injection',
      heading: '4 · Injection: flooding the thin base',
      body: "Forward bias floods the base with electrons injected from the heavily-doped emitter. They're now minority carriers in a p-type base too thin to recombine them all — most simply diffuse straight across before that can happen, and the reverse-biased base-collector junction's field sweeps them into the collector the instant they arrive. Only a small fraction recombine in the base; that trickle IS the base current.",
      camera: { position: [0.3, 1.5, 3.8], target: [-0.15, 0.9, 0] },
      onEnter: ({ handles }) => {
        handles.setView('schematic');
        handles.setLabels('injection', true);
      },
      timeline: ({ tl, handles }) => {
        const s = { t: 0 };
        tl.add(s, {
          t: 1,
          duration: 3200,
          ease: 'linear',
          onUpdate: () =>
            handles.set({ bias: 1, colFlow: s.t * 3, baseFlow: s.t * 3, sigMod: 1 }),
        });
      },
    },
    {
      id: 'gain',
      heading: '5 · Current gain: small controls large',
      body: 'Because almost every electron the emitter injects makes it across, a tiny base current sets the collector current almost entirely. The ratio is the current gain, β = Ic / Ib — commonly 50 to a few hundred for a small-signal part. Watch the base trickle complete one lazy lap for every several the collector stream races through: that speed difference IS β made visible.',
      camera: { position: [0.3, 1.5, 4.6], target: [-0.05, 0.85, 0] },
      onEnter: ({ handles }) => {
        handles.setView('schematic');
        handles.setLabels('gain', true);
      },
      timeline: ({ tl, handles }) => {
        const s = { t: 0 };
        tl.add(s, {
          t: 1,
          duration: 4200,
          ease: 'linear',
          onUpdate: () =>
            handles.set({ bias: 1, colFlow: s.t * 6, baseFlow: s.t * 1, sigMod: 1 }),
        });
      },
    },
    {
      id: 'switch',
      heading: '6 · The switch: cutoff vs. saturation',
      body: 'Drop the base voltage below roughly 0.6 V and the base-emitter junction never turns on — cutoff, no collector current, an open switch. Push it above that threshold and the transistor saturates: current gushes from collector to emitter almost unrestricted, a closed switch, lighting the lamp. Every logic gate in every computer ever built is transistors flipping between exactly these two states, billions of times a second.',
      camera: { position: [0.4, 1.4, 4.8], target: [0.2, 0.85, 0] },
      onEnter: ({ handles }) => {
        handles.setView('schematic');
        handles.setLabels(null, false);
      },
      timeline: ({ tl, handles }) => {
        const s = { t: 0 };
        tl.add(s, {
          t: 1,
          duration: 3600,
          ease: 'linear',
          onUpdate: () => {
            // off -> on -> off within one lap, so the wrap point (both ends
            // at bias 0) is seamless — a real switch flips abruptly, but the
            // LOOP itself must not pop.
            const sq = s.t < 0.22 || s.t > 0.78 ? 0 : 1;
            handles.set({ bias: sq, colFlow: s.t * 3, baseFlow: s.t * 3, sigMod: 1 });
          },
        });
      },
    },
    {
      id: 'amplifier',
      heading: '7 · The amplifier: a small wiggle, magnified',
      body: 'Bias it in between those extremes instead and the transistor stays in its "active" region, where collector current tracks base current smoothly rather than snapping between two states. A small wiggle riding on the base current comes out the collector as the same wiggle, scaled up by β — the mechanism behind every microphone preamp and radio receiver since the transistor was invented in 1947.',
      camera: { position: [0.25, 1.5, 4.3], target: [-0.05, 0.85, 0] },
      onEnter: ({ handles }) => {
        handles.setView('schematic');
        handles.setLabels(null, false);
      },
      timeline: ({ tl, handles }) => {
        const s = { t: 0 };
        tl.add(s, {
          t: 1,
          duration: 4000,
          ease: 'linear',
          onUpdate: () => {
            const wiggle = Math.sin(s.t * Math.PI * 2 * 3);
            handles.set({
              bias: 0.75 + 0.12 * wiggle,
              colFlow: s.t * 5,
              baseFlow: s.t * 2,
              sigMod: 0.55 + 0.45 * wiggle,
            });
          },
        });
      },
    },
    {
      id: 'run',
      heading: '8 · Doing its job, quietly',
      body: 'Reassembled, this is the same three-legged part scattered by the thousand across almost any circuit board — switching, amplifying, gating logic, never once touching a moving mechanical part. Just a whisper of base current, endlessly steering a flood of collector current.',
      hint: 'Drag to orbit while it runs.',
      camera: { position: [2.0, 1.75, 2.6], target: [0, 0.9, 0.1] },
      freeOrbit: true,
      onEnter: ({ handles }) => {
        handles.setView('assembled');
        handles.setLabels(null, false);
      },
      timeline: ({ tl, handles }) => {
        const s = { t: 0 };
        tl.add(s, {
          t: 1,
          duration: 3000,
          ease: 'linear',
          onUpdate: () =>
            handles.set({ bias: 0.6 + 0.1 * Math.sin(s.t * Math.PI * 2 * 3), colFlow: s.t * 4, baseFlow: s.t * 4 }),
        });
      },
    },
  ],
});
