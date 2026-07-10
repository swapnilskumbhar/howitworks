// steps: 0 anatomy · 1 one pin two rods · 2 four strokes two cylinders
//        3 offbeat heartbeat · 4 the 90° secret · 5 run
export default {
  hook: 'Two pistons. One pin.\nThat’s the V-twin rumble.',

  short: {
    dolly: 1.7,
    shots: [
      { step: 0, seconds: 4, dolly: 1.8, caption: 'A V-twin: two cylinders in a V',
        narration: 'A V-twin engine: two cylinders splayed into a V, sharing one crankshaft below.' },
      { step: 1, seconds: 5, caption: 'Both rods grab the SAME crankpin',
        narration: 'The trick is here. Both connecting rods grab the exact same pin on the crank.' },
      { step: 2, seconds: 5, caption: 'Each cylinder fires on its own cycle',
        narration: 'Each cylinder runs its own four strokes, taking turns pushing that shared pin around.' },
      { step: 3, seconds: 6, caption: 'Fire… fire… then a long wait',
        narration: 'Because they share a pin, the bangs come uneven. Fire, fire, then a gap. That lopsided rhythm is the rumble.' },
      { step: 4, seconds: 5, caption: 'The 90° angle balances the shake',
        narration: 'Set the V to ninety degrees and the two pistons cancel each other’s shake. Smooth, but still lumpy-sounding.' },
      { step: 5, seconds: 5, caption: 'Potato-potato, at speed',
        narration: 'Put it together and you get that unmistakable off-beat pulse, hundreds of times a second.' },
    ],
  },

  long: {
    shots: [
      { step: 0, seconds: 9, narration: 'This is a V-twin, the engine behind that unmistakable motorcycle sound. Two cylinders leaning into a V, both feeding down to a single crankshaft. Its whole character comes from one design choice we’re about to see.' },
      { step: 1, seconds: 9, narration: 'Here’s that choice. Instead of two separate crankpins, both connecting rods share one. Two pistons, two rods, gripping the very same point on the crank. Cheap, compact — and the reason it sounds the way it does.' },
      { step: 2, seconds: 10, narration: 'Each cylinder still runs the normal four strokes: intake, compression, power, exhaust. But they can’t fire at the same time. They hand the shared pin back and forth, one bang, then the other.' },
      { step: 3, seconds: 10, narration: 'And the bangs aren’t evenly spaced. One cylinder fires, then the other fires soon after, then there’s a long quiet stretch before it comes around again. That uneven galloping rhythm is the potato-potato sound people love.' },
      { step: 4, seconds: 10, narration: 'The ninety-degree angle isn’t random either. With the cylinders that far apart, as one piston lunges the other counters it, cancelling much of the vibration. You get a smoother engine that still keeps its lumpy, distinctive beat.' },
      { step: 5, seconds: 9, narration: 'Two pistons, one pin, ninety degrees apart, trading explosions hundreds of times a second. A clever compromise you can hear from a block away.' },
    ],
  },
};
