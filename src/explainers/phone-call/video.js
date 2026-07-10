// steps: 0 whole call · 1 voice→electricity · 2 sampled & compressed
//        3 coded/encrypted onto radio · 4 up to tower · 5 core routes
//        6 down into their phone · 7 both ways at once
export default {
  hook: 'Your voice becomes radio,\nthen light, then voice again.',

  short: {
    dolly: 2.4,
    shots: [
      { step: 0, seconds: 4, dolly: 2.6, caption: 'One call, phone to phone',
        narration: 'When you make a call, your voice is torn apart, sent across the world, and rebuilt — in real time.' },
      { step: 1, seconds: 5, caption: 'Your voice becomes a wiggling current',
        narration: 'The microphone turns the pressure of your voice into a wiggling electric signal.' },
      { step: 3, seconds: 5, caption: 'Digitized, squeezed, and encrypted',
        narration: 'That signal is chopped into numbers, compressed, encrypted, and stamped onto a radio wave.' },
      { step: 4, seconds: 5, caption: 'Beamed up to the cell tower',
        narration: 'Your phone beams it to the nearest cell tower, the on-ramp to the whole network.' },
      { step: 5, seconds: 6, caption: 'The network routes it to them',
        narration: 'The core network finds the other person, wherever they are, and routes your voice to their tower.' },
      { step: 6, seconds: 5, caption: 'Rebuilt as sound in their ear',
        narration: 'Their phone decodes the numbers back into sound. Your voice, reborn, in their ear.' },
    ],
  },

  long: {
    shots: [
      { step: 0, seconds: 8, narration: 'A phone call feels effortless — you talk, they hear you. But behind that simplicity, your voice is converted, digitized, encrypted, beamed through the air, routed across the network, and rebuilt, all in a fraction of a second, both directions at once.' },
      { step: 1, seconds: 9, narration: 'It starts at the microphone. Sound is just moving air, and the mic turns the pressure of your voice into a matching electrical wiggle — an analog copy of the sound, in the form of a changing current.' },
      { step: 2, seconds: 9, narration: 'But the network is digital, so that wiggle is measured thousands of times a second and turned into numbers. Then it’s compressed, throwing away what your ear won’t miss, shrinking your voice to a thin stream of data.' },
      { step: 3, seconds: 9, narration: 'Those numbers are wrapped in error-correcting codes, encrypted for privacy, and modulated onto a radio wave. Your voice is now a scrambled, resilient signal ready to fly through the air.' },
      { step: 4, seconds: 8, narration: 'Your phone transmits it to the nearest cell tower. That tower is your on-ramp to the whole telephone system, catching your faint signal and passing it into the network.' },
      { step: 5, seconds: 9, narration: 'From the tower it enters the core network, the carrier’s high-speed backbone. The system looks up the other person, figures out which tower they’re under, anywhere in the world, and routes your voice toward them.' },
      { step: 6, seconds: 9, narration: 'It arrives at their tower, is beamed down to their phone, decrypted, decompressed, and converted from numbers back into an electrical wiggle that drives their speaker. The air moves, and they hear you.' },
      { step: 7, seconds: 8, narration: 'And the astonishing part: this whole chain runs both ways simultaneously, with such tiny delay that it feels like you’re simply talking. Two voices, rebuilt from data, meeting in the middle in real time.' },
    ],
  },
};
