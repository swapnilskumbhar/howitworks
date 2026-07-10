// steps: 0 component · 1 film on ceramic core · 2 power becomes heat
//        3 reading the color code · 4 doing its job
export default {
  hook: 'Four colored stripes\nare a secret number.',

  short: {
    shots: [
      { step: 0, seconds: 4, caption: 'A resistor: it slows electricity',
        narration: 'A resistor does one job: it pushes back on electric current, slowing the flow on purpose.' },
      { step: 1, seconds: 5, caption: 'Inside: a thin film on ceramic',
        narration: 'Inside is just a thin film wrapped in a spiral around a ceramic rod — a long, narrow path.' },
      { step: 2, seconds: 6, caption: 'The resistance becomes heat',
        narration: 'Electrons bump through that narrow path and lose energy as heat. Push harder, and it gets hotter.' },
      { step: 3, seconds: 6, caption: 'The stripes spell out its value',
        narration: 'Those colored bands are a code. Each color is a digit, spelling out exactly how much it resists.' },
      { step: 4, seconds: 5, caption: 'Setting currents all over your gadgets',
        narration: 'Billions of them quietly set the right current in every circuit you own.' },
    ],
  },

  long: {
    shots: [
      { step: 0, seconds: 8, narration: 'This little striped cylinder is a resistor, probably the most common component in electronics. Its job sounds boring but it’s essential: it resists the flow of electric current, setting how much gets through.' },
      { step: 1, seconds: 9, narration: 'Inside the coating is a ceramic rod with a thin film of carbon or metal cut into a long spiral around it. Forcing the current down that long, narrow track is what creates the resistance.' },
      { step: 2, seconds: 10, narration: 'As electrons squeeze through, they collide and give up energy, and that energy comes out as heat. The power turned to heat grows with the current squared, which is why an overloaded resistor can scorch.' },
      { step: 3, seconds: 10, narration: 'You can read its value right off the body. Those colored bands are a numbering code — each color stands for a digit, and together they tell you the resistance in ohms, without any label or measurement.' },
      { step: 4, seconds: 9, narration: 'On its own it does nothing exciting. But placed by the billions, resistors divide voltages, limit currents, and protect delicate parts. Every gadget you own is full of these quiet little traffic controllers.' },
    ],
  },
};
