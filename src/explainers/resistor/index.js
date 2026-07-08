import { defineExplainer } from '../../framework/index.js';
import meta from './meta.js';
import { buildResistor } from './model.js';

// Every step loops while active. Seamlessness rule: each lap's scalar state
// (flow, heat, bandPos, compareFlow) starts and ends at the same value, or
// completes a whole number of cycles, so the wrap is invisible.

export default defineExplainer({
  ...meta,

  buildScene({ scene }) {
    return buildResistor({ scene });
  },

  steps: [
    {
      id: 'anatomy',
      heading: '1 · The component',
      body: 'This is a 1 kΩ fixed resistor — a tan ceramic rod with tinned leads, doing one job: throttling current in a predictable, fixed amount. It never stores energy like a capacitor and never switches like a transistor; it just resists, converting a precise fraction of the circuit\'s energy into heat every moment current flows through it.',
      hint: 'Drag to orbit · scroll to look inside.',
      camera: { position: [2.0, 1.7, 2.6], target: [0, 1.05, 0] },
      onEnter: ({ handles }) => {
        handles.setView('assembled');
        handles.setLabels(true);
        handles.setBandLabels(false);
      },
      timeline: ({ tl, handles }) => {
        const s = { t: 0 };
        tl.add(s, {
          t: 1,
          duration: 6000,
          ease: 'linear',
          onUpdate: () => handles.set({ flow: s.t * 2, heat: 0.05 }),
        });
      },
    },
    {
      id: 'core',
      heading: '2 · Inside: film on a ceramic core',
      body: 'Peel the painted skin away and the resistor is a plain ceramic rod coated in a hair-thin resistive film — carbon or a metal alloy like nichrome. A helix is then cut straight through that coating, forcing current down one long, narrow spiral track instead of a short fat one. That cut groove IS the resistor: its length and width set the value.',
      camera: { position: [1.05, 1.35, 1.3], target: [0, 1.05, 0] },
      onEnter: ({ handles }) => {
        handles.setView('core');
        handles.setLabels(true);
        handles.setBandLabels(false);
      },
      timeline: ({ tl, handles }) => {
        const s = { t: 0 };
        tl.add(s, {
          t: 1,
          duration: 4500,
          ease: 'linear',
          onUpdate: () => handles.set({ flow: s.t * 3, heat: 0.12 }),
        });
      },
    },
    {
      id: 'ohms-law',
      heading: "3 · Ohm's law: geometry sets R",
      body: "R = ρL / A — resistance rises with the path's length and falls with its cross-sectional area. Cut a long, thin spiral (left) and the same voltage pushes only a trickle of current through; cut a short, thick one (right) and far more current gets through. Same ceramic, same film — the geometry of the cut alone is what separates a 10 Ω resistor from a 1 MΩ one.",
      camera: { position: [0.25, 2.35, 8.6], target: [0.27, 1.15, 0] },
      onEnter: ({ handles }) => {
        handles.setView('compare');
        handles.setLabels(true);
        handles.setBandLabels(false);
      },
      timeline: ({ tl, handles }) => {
        const s = { t: 0 };
        tl.add(s, {
          t: 1,
          duration: 4200,
          ease: 'linear',
          onUpdate: () => handles.set({ compareFlow: s.t * 2 }),
        });
      },
    },
    {
      id: 'heat',
      heading: '4 · Power becomes heat: P = I²R',
      body: 'Every electron that scatters off the resistive film while forcing its way down the spiral gives up a little energy — and that energy has nowhere to go but out as heat. Push more current through (P = I²R, not just IR) and the film glows hotter fast; this is exactly why power resistors are built big: more surface area to shed the same joules before the film overheats.',
      camera: { position: [0.9, 1.25, 1.15], target: [0, 1.05, 0] },
      onEnter: ({ handles }) => {
        handles.setView('core');
        handles.setLabels(false);
        handles.setBandLabels(false);
      },
      timeline: ({ tl, handles }) => {
        const s = { t: 0 };
        tl.add(s, {
          t: 1,
          duration: 4000,
          ease: 'linear',
          onUpdate: () => {
            const tri = 1 - Math.abs(1 - 2 * s.t);
            handles.set({ heat: tri, flow: s.t * 2 });
          },
        });
      },
    },
    {
      id: 'color-code',
      heading: '5 · Reading the code: four bands',
      body: 'No multimeter needed — the four painted bands spell out the value directly. First two bands are significant digits, the third is a power-of-ten multiplier, the fourth is tolerance. Brown-Black-Red-Gold reads 1, 0, ×100, ±5%: (10) × 100 = 1000 Ω — a 1 kΩ resistor, guaranteed within 5% of that value.',
      camera: { position: [0.55, 1.55, 1.3], target: [-0.05, 1.2, 0] },
      onEnter: ({ handles }) => {
        handles.setView('assembled');
        handles.setLabels(false);
        handles.setBandLabels(true);
      },
      timeline: ({ tl, handles }) => {
        const s = { t: 0 };
        tl.add(s, {
          t: 1,
          duration: 5200,
          ease: 'linear',
          onUpdate: () => {
            handles.set({
              bandPos: 1.5 + 1.5 * Math.sin(s.t * Math.PI * 2),
              flow: s.t * 2,
              heat: 0.05,
            });
          },
        });
      },
    },
    {
      id: 'run',
      heading: '6 · Doing its job, quietly',
      body: 'Reassembled, this is the same unglamorous part scattered by the hundred across almost any circuit board — biasing a transistor, setting an LED\'s current, defining a filter\'s cutoff. No moving parts, no stored charge, nothing to wear out: just a fixed, dependable brake on current, warming a fraction of a degree and doing exactly what its four bands promise.',
      hint: 'Drag to orbit while it runs.',
      camera: { position: [2.3, 1.9, 2.9], target: [0, 1.05, 0.1] },
      freeOrbit: true,
      onEnter: ({ handles }) => {
        handles.setView('assembled');
        handles.setLabels(false);
        handles.setBandLabels(false);
      },
      timeline: ({ tl, handles }) => {
        const s = { t: 0 };
        tl.add(s, {
          t: 1,
          duration: 3200,
          ease: 'linear',
          onUpdate: () =>
            handles.set({ flow: s.t * 4, heat: 0.15 + 0.1 * Math.sin(s.t * Math.PI * 2 * 3) }),
        });
      },
    },
  ],
});
