// Editorial layer for video export (scripts/export-video.mjs).
// steps: 0 anatomy (solid) · 1 intake · 2 compression · 3 power · 4 exhaust · 5 run
export default {
  hook: 'Your car runs on\ncontrolled explosions.',

  short: {
    shots: [
      {
        step: 0,
        seconds: 4,
        caption: 'One cylinder, cut open',
        narration: 'This little engine turns fuel into motion using one piston and a controlled explosion.',
      },
      {
        step: 1,
        seconds: 5,
        caption: 'Intake: it inhales fuel and air',
        narration: 'First it inhales. The piston drops and a valve opens, pulling in a mist of fuel and air.',
      },
      {
        step: 2,
        seconds: 5,
        caption: 'Compression: squeezed to a fraction',
        narration: 'Both valves shut and the piston squeezes that mixture into a tiny, tense space.',
      },
      {
        step: 3,
        seconds: 6,
        caption: 'Power: the spark, the bang',
        narration: 'The spark plug fires. The mixture explodes and slams the piston down. That is the power stroke.',
      },
      {
        step: 4,
        seconds: 5,
        caption: 'Exhaust: the burnt gas is pushed out',
        narration: 'The piston rises again and shoves the burnt gas out the exhaust valve. Then it all repeats.',
      },
      {
        step: 5,
        seconds: 5,
        caption: 'Suck, squeeze, bang, blow — 30× a second',
        narration: 'Suck, squeeze, bang, blow. Thousands of times a minute, and the flywheel smooths it into spin.',
      },
    ],
  },

  long: {
    shots: [
      {
        step: 0,
        seconds: 9,
        narration:
          'This is a single-cylinder engine, the same idea running under the hood of almost every car. One piston slides in a cylinder, a crankshaft turns that sliding into spinning, and valves up top let the engine breathe. Watch how four simple strokes turn a drop of fuel into motion.',
      },
      {
        step: 1,
        seconds: 9,
        narration:
          'Stroke one: intake. The piston travels down and the intake valve opens. Just like pulling back a syringe, the growing space sucks in a fresh mix of air and fuel through the port.',
      },
      {
        step: 2,
        seconds: 9,
        narration:
          'Stroke two: compression. Both valves seal shut and the piston drives back up, squeezing the mixture into a fraction of its size. The tighter you squeeze it, the harder the coming explosion hits.',
      },
      {
        step: 3,
        seconds: 10,
        narration:
          'Stroke three: power. At the top, the spark plug fires. The compressed mixture ignites and expands violently, hammering the piston down. This is the only stroke that makes power — and the crankshaft stores it as spin.',
      },
      {
        step: 4,
        seconds: 9,
        narration:
          'Stroke four: exhaust. The exhaust valve opens and the rising piston pushes the burnt gas out. Now the cylinder is empty and ready to breathe in again. Intake, compression, power, exhaust.',
      },
      {
        step: 5,
        seconds: 9,
        narration:
          'Put it all together and it never stops. Each explosion fires only every other turn, so the heavy flywheel carries the engine through the quiet strokes — turning a rhythm of tiny bangs into smooth, usable power.',
      },
    ],
  },
};
