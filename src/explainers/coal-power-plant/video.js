// Editorial layer for video export (scripts/export-video.mjs).
// steps: 0 anatomy · 1 coal to heat · 2 boiler · 3 turbine · 4 generator
//        5 condenser · 6 step-up & grid · 7 the plant runs
export default {
  hook: 'Coal doesn’t make electricity.\nSpinning does.',

  // 9:16, ~38s, narrated (user wants voiced shorts) + captions
  short: {
    shots: [
      {
        step: 0,
        seconds: 6,
        dolly: 2.2, // plant is a wide composition — pull way back in portrait
        caption: 'A coal plant is really a giant kettle',
        narration:
          'A coal power plant is really just a giant kettle. Burn coal, boil water, and use the steam to spin something.',
      },
      {
        step: 2,
        seconds: 6,
        caption: 'Steam leaves at 540°C — hot enough to glow',
        narration:
          'The boiler pushes steam to five hundred forty degrees, at a hundred and sixty times atmospheric pressure.',
      },
      {
        step: 3,
        seconds: 7,
        caption: 'The blades grow because steam EXPANDS',
        narration:
          'That steam blasts through a turbine. See the blades getting longer? Steam expands as it loses pressure, so each stage needs bigger blades.',
      },
      {
        step: 4,
        seconds: 6,
        caption: 'Magnets sweeping past copper = electricity',
        narration:
          'The spinning shaft turns magnets inside a ring of copper windings — and that alone is what makes the electricity.',
      },
      {
        step: 5,
        seconds: 7,
        caption: 'That white plume isn’t smoke. It’s water vapor.',
        narration:
          'And the giant tower everyone thinks is pumping out smoke? That’s just water vapor. The same water loops back to be boiled again, forever.',
      },
      {
        step: 7,
        seconds: 6,
        dolly: 2.2,
        caption: 'Chemical → heat → spin → electricity',
        narration:
          'Coal to heat, heat to spin, spin to electricity. Every coal plant on Earth is this exact machine.',
      },
    ],
  },

  // 16:9, full story, narrated
  long: {
    shots: [
      {
        step: 0,
        seconds: 10,
        narration:
          'A coal plant is a heat engine. Burn coal to boil water, let the steam spin a turbine, and let the turbine spin a generator. Everything else you see here exists to make that one conversion — heat into spin — as efficient as possible.',
      },
      {
        step: 1,
        seconds: 9,
        narration:
          'It starts in the pulverizer, where coal is crushed as fine as flour. Blown into the furnace, it burns almost instantly — the only energy input the whole plant gets.',
      },
      {
        step: 2,
        seconds: 10,
        narration:
          'The furnace walls are lined with water tubes. Radiant heat boils the water inside them, and a superheater then drives that steam to around five hundred forty degrees Celsius — far past boiling, because hotter steam carries more usable energy per kilogram.',
      },
      {
        step: 3,
        seconds: 10,
        narration:
          'The steam blasts through three turbine stages on one shaft — high, intermediate, and low pressure. Watch the blades lengthen along the shaft: as pressure drops, the same steam takes up far more room, so the blades have to grow to catch it.',
      },
      {
        step: 4,
        seconds: 9,
        narration:
          'The same shaft runs straight into the generator, where magnetic poles sweep past fixed copper windings. Every sweep induces a voltage — Faraday’s law, the same trick a hydro plant uses, just driven by steam instead of falling water.',
      },
      {
        step: 5,
        seconds: 10,
        narration:
          'Spent steam is condensed back into water, shrinking about a thousand times in volume — and that collapse is what keeps pulling fresh steam through the turbine. The waste heat leaves through the cooling tower as a plume of plain water vapor. Not smoke.',
      },
      {
        step: 6,
        seconds: 9,
        narration:
          'Electricity leaves the generator at too low a voltage to travel far. A step-up transformer trades current for voltage, so the transmission lines can carry the same power with a fraction of the loss.',
      },
      {
        step: 7,
        seconds: 9,
        narration:
          'Coal, boiler, turbine, generator, condenser, tower, transformer. One continuous energy chain, chemical to electrical, with the same water reused endlessly in between. Every coal plant on Earth is this same cycle at a different scale.',
      },
    ],
  },
};
