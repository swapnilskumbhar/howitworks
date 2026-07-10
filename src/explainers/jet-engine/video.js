// steps: 0 anatomy · 1 suck · 2 squeeze · 3 bang · 4 blow · 5 run
export default {
  hook: 'A hurricane, set on fire,\naimed backwards.',

  short: {
    dolly: 2.2,
    shots: [
      { step: 0, seconds: 4, dolly: 2.4, caption: 'A jet engine, front to back',
        narration: 'A jet engine is really just four jobs in a row: suck, squeeze, bang, blow.' },
      { step: 1, seconds: 5, caption: 'Suck: the fan inhales tons of air',
        narration: 'The giant front fan inhales enormous amounts of air, pulling it into the engine.' },
      { step: 2, seconds: 5, caption: 'Squeeze: blades pack it tight',
        narration: 'Row after row of spinning blades squeeze that air into a fraction of its volume.' },
      { step: 3, seconds: 6, caption: 'Bang: fuel ignites, gas expands',
        narration: 'Fuel sprays in and ignites. The burning gas expands violently and blasts out the back.' },
      { step: 4, seconds: 5, caption: 'Blow: the jet shoves the plane forward',
        narration: 'That rearward blast spins a turbine and shoves the plane forward. Action, reaction.' },
      { step: 5, seconds: 5, caption: 'One continuous, roaring push',
        narration: 'Unlike a piston engine, it never stops. One continuous river of fire and thrust.' },
    ],
  },

  long: {
    shots: [
      { step: 0, seconds: 9, narration: 'This is a jet engine, and it works on the same four steps as a car engine — suck, squeeze, bang, blow — but it does them all at once, in a continuous stream, instead of one at a time.' },
      { step: 1, seconds: 9, narration: 'Suck. The huge fan at the front pulls in a torrent of air, more than the engine could ever swallow through pistons. Most of it is just shoved backward for thrust; the rest goes into the core.' },
      { step: 2, seconds: 10, narration: 'Squeeze. The core air passes through stage after stage of spinning and fixed blades, each one packing it tighter and hotter, until it’s crushed to a small fraction of its original volume.' },
      { step: 3, seconds: 10, narration: 'Bang. In the combustion chamber, fuel is sprayed into that dense hot air and lit. The mixture erupts, and the gas expands and races toward the back at tremendous speed.' },
      { step: 4, seconds: 9, narration: 'Blow. On the way out, the rushing gas spins a turbine, which drives the fan and compressor up front — so the engine feeds itself. What’s left roars out the nozzle and pushes the plane forward.' },
      { step: 5, seconds: 9, narration: 'Suck, squeeze, bang, blow, all happening continuously, thousands of times faster than you can blink. A controlled hurricane of fire that carries hundreds of tons into the sky.' },
    ],
  },
};
