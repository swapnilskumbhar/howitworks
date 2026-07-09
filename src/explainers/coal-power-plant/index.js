import { defineExplainer } from '../../framework/index.js';
import meta from './meta.js';
import { buildCoalPlant } from './model.js';

// Every step runs the plant as a seamless loop while active: the water/steam
// phase advances a whole number of laps around the closed Rankine loop, and
// the turbine/generator shaft turns a whole number of turns per lap, so the
// wrap is invisible. The camera supplies each step's focus; the plant just
// keeps running underneath it.
function cycleRun({ gridOn = 0, turns = 6, duration = 5000 }) {
  return ({ tl, handles }) => {
    const s = { t: 0 };
    tl.add(s, {
      t: 1,
      duration,
      ease: 'linear',
      onUpdate: () =>
        handles.set({
          flow: s.t,
          spin: s.t * Math.PI * 2 * turns,
          gridOn,
        }),
    });
  };
}

export default defineExplainer({
  ...meta,

  buildScene({ scene }) {
    return buildCoalPlant({ scene });
  },

  steps: [
    {
      id: 'overview',
      heading: 'The anatomy',
      body: "A coal plant is a heat engine: burn coal to boil water into steam, let that steam spin a turbine, and use the turbine to spin a generator. Everything else — the boiler, the condenser, the cooling tower — exists to make that one conversion (heat to spin) as efficient as possible, and to get the water back so it can be boiled again.",
      hint: 'Drag to orbit · scroll to follow the energy chain.',
      camera: { position: [1.2, 3.6, 7.4], target: [0.2, 1.4, 0] },
      onEnter: ({ handles }) => handles.setLabels('anatomy'),
      timeline: cycleRun({ duration: 8000 }),
    },
    {
      id: 'coal',
      heading: '1 · Coal to heat',
      body: 'Coal is crushed to a fine powder in a pulverizer — about as fine as flour — so it burns almost instantly when blown into the furnace. That combustion is the plant\'s only energy input: chemical energy stored in the coal becomes heat, released fast enough to keep an enormous furnace running white-hot around the clock.',
      camera: { position: [-3.3, 1.5, 2.6], target: [-2.7, 0.8, 0.15] },
      onEnter: ({ handles }) => handles.setLabels('coal'),
      timeline: cycleRun({ duration: 4000 }),
    },
    {
      id: 'boiler',
      heading: '2 · The boiler makes steam',
      body: "The furnace's walls are lined with waterwall tubes — water flowing through them is boiled by the radiant heat and rises to a steam drum at the top. A superheater then drives that steam far past its boiling point, to roughly 540°C at 16-18 MPa, before it's allowed to leave for the turbine: hotter, higher-pressure steam carries more usable energy per kilogram.",
      camera: { position: [-1.1, 2.3, 2.2], target: [-1.75, 1.9, -0.15] },
      onEnter: ({ handles }) => handles.setLabels('boiler'),
      timeline: cycleRun({ duration: 4200 }),
    },
    {
      id: 'turbine',
      heading: '3 · Steam spins the turbine',
      body: 'The steam blasts through a high-pressure stage first, then is piped back to the boiler\'s reheater to be resuperheated before continuing through intermediate- and low-pressure stages — all three share one shaft. As pressure keeps dropping, the same mass of steam takes up far more volume, which is why the blades visibly lengthen toward the low-pressure end.',
      camera: { position: [0.25, 1.7, 2.7], target: [0.2, 1.2, 0] },
      onEnter: ({ handles }) => handles.setLabels('turbine'),
      timeline: cycleRun({ duration: 3400 }),
    },
    {
      id: 'generator',
      heading: '4 · The generator induces current',
      body: "The same shaft carries that spin straight into the generator, where a rotor of magnetic poles turns inside a ring of fixed stator windings. Each time a pole sweeps past a winding, the changing field induces a voltage in it — Faraday's law, the same electromagnetic induction a hydro plant or a transformer uses, just driven here by a steam turbine instead of falling water.",
      camera: { position: [1.9, 1.7, 1.6], target: [1.35, 1.15, 0] },
      onEnter: ({ handles }) => handles.setLabels('generator'),
      timeline: cycleRun({ duration: 3200 }),
    },
    {
      id: 'condenser',
      heading: '5 · Closing the loop',
      body: "Spent low-pressure steam leaves the turbine and is condensed straight back into water in the condenser — dropping its volume roughly a thousandfold, which is what pulls steam through the turbine so effectively. The heat that steam gives up is carried away by a SEPARATE circuit of cooling water to the plant's hyperboloid cooling tower, which releases it as a plume of ordinary water vapor, not smoke. A feed pump then returns the condensed water to the boiler, closing the primary loop.",
      camera: { position: [1.35, 1.0, 2.5], target: [0.95, 0.5, 0] },
      onEnter: ({ handles }) => handles.setLabels('condenser'),
      timeline: cycleRun({ duration: 4400 }),
    },
    {
      id: 'grid',
      heading: '6 · Step-up & the grid',
      body: "Current straight off the generator is still at a modest voltage — far too low to travel long distances without huge resistive losses. A step-up transformer raises it dramatically before it heads out on transmission lines, trading current for voltage so the wires can carry the same power at a fraction of the loss. From here it's substations and towers all the way to a wall socket.",
      camera: { position: [3.6, 2.4, 3.0], target: [2.4, 1.7, 0.1] },
      onEnter: ({ handles }) => handles.setLabels('grid'),
      timeline: cycleRun({ gridOn: 1, duration: 3400 }),
    },
    {
      id: 'run',
      heading: 'The plant runs',
      body: 'Coal, boiler, turbine, generator, condenser, cooling tower, transformer — one continuous energy chain, chemical to electrical, with the same water endlessly reused in between. Every coal plant on Earth is this same Rankine cycle at a different scale.',
      hint: 'Drag to orbit the running plant.',
      camera: { position: [1.0, 3.8, 7.8], target: [0.3, 1.4, 0] },
      freeOrbit: true,
      onEnter: ({ handles }) => handles.setLabels(null),
      timeline: cycleRun({ gridOn: 1, duration: 4600, turns: 8 }),
    },
  ],
});
