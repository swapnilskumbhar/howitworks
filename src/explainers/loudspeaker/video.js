// steps: 0 anatomy · 1 voice coil · 2 magnet vs coil · 3 cone moves air
//        4 suspension keeps it honest · 5 music made of air
export default {
  hook: 'How does a magnet\nturn into music?',

  short: {
    shots: [
      { step: 0, seconds: 4, caption: 'A speaker: magnet, coil, cone',
        narration: 'Every speaker is the same three things: a magnet, a coil of wire, and a paper cone.' },
      { step: 1, seconds: 5, caption: 'The music is just current in a coil',
        narration: 'Your song arrives as electric current, wiggling back and forth through this coil of wire.' },
      { step: 2, seconds: 6, caption: 'Current + magnet = a push or pull',
        narration: 'The coil sits in a magnet’s field. Current one way pushes it out; the other way pulls it back.' },
      { step: 3, seconds: 6, caption: 'The cone punches the air',
        narration: 'The coil is glued to the cone, so it punches the air in and out, making the pressure waves we hear.' },
      { step: 4, seconds: 5, caption: 'Thousands of pushes per second',
        narration: 'Do that thousands of times a second, exactly matching the music, and you get sound.' },
    ],
  },

  long: {
    shots: [
      { step: 0, seconds: 8, narration: 'A loudspeaker is one of the simplest machines in your house, and one of the cleverest. Just three parts: a permanent magnet, a coil of wire, and a lightweight cone. Together they turn electricity into sound.' },
      { step: 1, seconds: 9, narration: 'It begins with the voice coil. Your music, from a phone or amplifier, arrives as an electric current that flickers back and forth, thousands of times a second, tracing the exact shape of the sound wave.' },
      { step: 2, seconds: 10, narration: 'That coil hangs inside the gap of a strong magnet. And any wire carrying current in a magnetic field feels a force. When the current flows one way, the coil is pushed out; reverse the current, and it’s pulled back in.' },
      { step: 3, seconds: 9, narration: 'The coil is attached to the cone. So as the coil jumps in and out, the cone moves with it, shoving air forward and pulling it back. Those pressure waves ripple out to your ears as sound.' },
      { step: 4, seconds: 9, narration: 'A flexible rim and a spider suspension hold the cone centered, letting it move freely forward and back but never sideways. That’s what keeps the sound clean instead of rattling or distorting.' },
      { step: 5, seconds: 9, narration: 'That’s all music really is: a coil, a magnet, and a cone, faithfully pushing air in exact step with the current. Electricity in, pressure waves out, the whole song rebuilt in the air in front of you.' },
    ],
  },
};
