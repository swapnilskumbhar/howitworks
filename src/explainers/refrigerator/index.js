import { defineExplainer } from '../../framework/index.js';
import meta from './meta.js';
import { buildRefrigerator } from './model.js';

// Every step loops the running cycle: the refrigerant advances exactly one
// lap per timeline lap and the evaporator fan a whole number of turns, so the
// wrap is invisible. The camera provides each step's focus.
function cycleRun({ heatOut = 0, coldAir = 0, duration = 5000 }) {
  return ({ tl, handles }) => {
    const s = { t: 0 };
    tl.add(s, {
      t: 1,
      duration,
      ease: 'linear',
      onUpdate: () =>
        handles.set({
          flow: s.t,
          spin: s.t * Math.PI * 12, // 6 whole turns per lap
          heatOut,
          coldAir,
        }),
    });
  };
}

// Pin the full reveal/label state on entering a step, so scrolling either way
// lands on a consistent scene. reveal 0 = solid finished fridge, 1 = x-ray.
const view = (reveal, labels) => ({ handles }) => {
  handles.setReveal(reveal);
  handles.setLabels(labels);
};

export default defineExplainer({
  ...meta,

  buildScene({ scene }) {
    return buildRefrigerator({ scene });
  },

  steps: [
    {
      id: 'complete',
      heading: 'The refrigerator',
      body: "The most reliable machine in your home: a steel box that hums a few times an hour and keeps food cold for twenty years. Here is its secret — it doesn't make cold at all. Cold isn't a thing you can make; it's just the absence of heat. A refrigerator is a heat pump: it grabs heat from inside the box and throws it into your kitchen. Let's open it up and watch it work.",
      hint: 'Drag to orbit · scroll to look inside.',
      camera: { position: [2.6, 2.3, 4.4], target: [0, 1.25, 0] },
      onEnter: view(0, false),
      timeline: cycleRun({ duration: 8000 }),
    },
    {
      id: 'inside',
      heading: 'Inside the box',
      body: 'Doors off, shell to glass. One sealed loop of copper tube threads through the whole machine, charged with a refrigerant that boils at −26 °C. Four stations sit on the loop: a compressor humming in the bottom recess, the black grid of condenser coils on the back, a hair-thin capillary tube, and a finned evaporator hidden behind the freezer wall. The refrigerant laps the circuit and carries heat with it — always inward to outward.',
      hint: 'Drag to orbit · scroll to follow the loop.',
      camera: { position: [3.0, 2.4, 3.6], target: [0, 1.4, -0.2] },
      onEnter: view(1, true),
      timeline: cycleRun({ heatOut: 1, duration: 8000 }),
    },
    {
      id: 'compressor',
      heading: '1 · The compressor',
      body: "That hum when the fridge 'switches on' is this: a black hermetic dome in the bottom recess, a piston pump and its motor sealed inside with the refrigerant. It squeezes cool low-pressure vapour into hot high-pressure vapour — hotter than your kitchen. That matters, because heat only ever flows from hot to cold: to dump heat into the room, the refrigerant first has to be made hotter than the room.",
      camera: { position: [1.5, 0.75, -1.9], target: [0.2, 0.45, -0.4] },
      onEnter: view(1, false),
      timeline: cycleRun({ duration: 4000 }),
    },
    {
      id: 'condenser',
      heading: '2 · The condenser',
      body: "The hot vapour rises up the back and snakes down through the black grid you've felt behind every fridge — tube weaving through wire fins. Warmer than the kitchen air, it sheds its heat by simple convection (no fan needed; that's why the back of a fridge is always warm) and condenses into a warm high-pressure liquid. A small filter drier at the bottom strains out moisture and grit.",
      camera: { position: [-1.0, 1.7, -3.0], target: [0, 1.5, -0.55] },
      onEnter: view(1, false),
      timeline: cycleRun({ heatOut: 1, duration: 5000 }),
    },
    {
      id: 'capillary',
      heading: '3 · The capillary tube',
      body: 'Now the trick. The warm liquid is forced through several metres of tube barely wider than a hair, coiled up near the compressor. Fighting through costs it nearly all its pressure — and a liquid that suddenly loses pressure boils, and boiling drinks in heat. Part of it flashes to vapour instantly, chilling the whole stream to around −25 °C before it re-enters the cabinet.',
      camera: { position: [1.7, 0.7, -1.4], target: [0.55, 0.4, -0.45] },
      onEnter: view(1, false),
      timeline: cycleRun({ duration: 6000 }),
    },
    {
      id: 'evaporator',
      heading: '4 · The evaporator',
      body: 'The icy mixture weaves up through the finned evaporator hidden behind the freezer wall. Being far colder than the food, it soaks up heat and boils fully back into a gas, while a small fan washes the chilled air down through the freezer and fridge shelves. The gas then rides the fat suction line back down to the compressor, and the lap begins again. Your food never touches anything cold — it just keeps having its heat stolen.',
      camera: { position: [1.9, 3.1, 2.6], target: [0, 2.1, -0.3] },
      onEnter: view(1, false),
      timeline: cycleRun({ coldAir: 1, duration: 5000 }),
    },
    {
      id: 'run',
      heading: 'The cycle runs',
      body: 'Shell closed, the whole machine again. Compress, condense, choke, evaporate — the same few grams of refrigerant lapping the loop, pumping heat from the food to the kitchen a trickle at a time. A thermostat just switches the compressor on when the box drifts warm and off when it is cold enough. That gentle hum, a few times an hour, for twenty years — that is all a refrigerator ever does.',
      hint: 'Drag to orbit the running machine.',
      camera: { position: [3.4, 2.6, 4.6], target: [0, 1.3, 0] },
      freeOrbit: true,
      onEnter: view(0, false),
      timeline: cycleRun({ duration: 4600 }),
    },
  ],
});
