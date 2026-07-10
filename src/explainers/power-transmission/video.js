// steps: 0 whole journey · 1 why voltage up · 2 towers · 3 substation down
//        4 distribution poles · 5 into your house · 6 one relay
export default {
  hook: 'Your outlet is the end of a\n500,000-volt relay.',

  short: {
    dolly: 2.6,
    shots: [
      { step: 0, seconds: 4, dolly: 2.8, caption: 'Power plant to your wall',
        narration: 'The electricity in your wall may have traveled hundreds of miles. Here’s the whole relay.' },
      { step: 1, seconds: 6, caption: 'Voltage goes WAY up to travel far',
        narration: 'First the voltage is cranked up to hundreds of thousands of volts. High voltage means low loss over distance.' },
      { step: 2, seconds: 5, caption: 'Towers carry it across the country',
        narration: 'Tall towers carry those humming lines across the landscape, far above your head for safety.' },
      { step: 3, seconds: 5, caption: 'Substations step it back down',
        narration: 'Near your town, a substation steps the voltage back down to something more manageable.' },
      { step: 4, seconds: 5, caption: 'Local poles split it street to street',
        narration: 'Distribution poles fan it out street by street, dropping it lower at each stage.' },
      { step: 5, seconds: 5, caption: 'Into your home at last',
        narration: 'A final transformer near you drops it to the safe voltage that powers your home.' },
    ],
  },

  long: {
    shots: [
      { step: 0, seconds: 8, narration: 'When you flip a switch, the power answering you may have started hundreds of miles away. Getting it to your wall safely and without wasting most of it is a carefully staged relay. Let’s follow it.' },
      { step: 1, seconds: 10, narration: 'The first thing that happens at the plant is surprising: the voltage is pushed way up, often to hundreds of thousands of volts. Wires lose energy to heat based on their current, and raising voltage lets the same power travel at far lower current. High voltage is how you send power a long way without wasting it.' },
      { step: 2, seconds: 9, narration: 'Now it rides the transmission lines. Those tall lattice towers hold the conductors high in the air, spaced well apart, because at these voltages electricity would happily jump across any shortcut it could find.' },
      { step: 3, seconds: 9, narration: 'As the lines approach a city, they reach a substation. Here big transformers step the voltage down from those dangerous transmission levels to the medium voltage used to distribute power around a region.' },
      { step: 4, seconds: 9, narration: 'From there it runs along the distribution poles you see on ordinary streets. The network branches out, neighborhood by neighborhood, with smaller transformers trimming the voltage down further at each step.' },
      { step: 5, seconds: 9, narration: 'The last transformer, often the can on the pole outside, drops it to the safe household voltage. Only then does it enter your home, run through your meter, and reach the outlet.' },
      { step: 6, seconds: 9, narration: 'Step up, travel far, step down, branch out, step down again. One continuous relay of transformers and wires, delivering power the instant you ask for it, every single time.' },
    ],
  },
};
