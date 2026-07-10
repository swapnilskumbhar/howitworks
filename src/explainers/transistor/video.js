// steps: 0 component · 1 silicon die · 2 two junctions · 3 injection
//        4 current gain · 5 switch · 6 amplifier · 7 quietly
export default {
  hook: 'The tiny switch that\nbuilt the modern world.',

  short: {
    shots: [
      { step: 0, seconds: 4, caption: 'A transistor: a valve for electricity',
        narration: 'A transistor is an electric valve — a tiny knob where one small signal controls a much larger flow.' },
      { step: 1, seconds: 5, caption: 'Inside: a sliver of silicon',
        narration: 'Inside its case is a speck of silicon, deliberately layered into three regions.' },
      { step: 2, seconds: 5, caption: 'Three layers, two junctions',
        narration: 'Those three layers form two junctions. One is nudged open, the other held closed — the key to the trick.' },
      { step: 3, seconds: 6, caption: 'A tiny base current opens the gate',
        narration: 'A tiny current into the thin middle layer floods it, opening the gate for a huge current to pour through.' },
      { step: 4, seconds: 5, caption: 'Small current controls large',
        narration: 'A whisper at the base commands a flood at the output. That’s amplification, and switching.' },
      { step: 5, seconds: 5, caption: 'Billions of them make a chip think',
        narration: 'Pack billions onto a chip, flicking on and off, and you get a computer.' },
    ],
  },

  long: {
    shots: [
      { step: 0, seconds: 8, narration: 'This is a transistor, arguably the most important invention of the last century. At its heart it’s an electrically-controlled valve: a small signal at one terminal controls a much bigger current through the other two.' },
      { step: 1, seconds: 9, narration: 'Open the case and there’s barely anything there — a tiny sliver of silicon. But that silicon has been carefully doped with impurities into three distinct regions, and the boundaries between them are where everything happens.' },
      { step: 2, seconds: 10, narration: 'Those three regions make two junctions back to back. In normal use one junction is forward biased, nudged open, while the other is reverse biased, held shut. On its own, that reverse junction blocks the main current cold.' },
      { step: 3, seconds: 10, narration: 'Now the clever part: injection. Push a small current into the thin middle layer, the base, and it floods with charge carriers. The base is so thin that most of them shoot straight across and get swept through the blocked junction.' },
      { step: 4, seconds: 9, narration: 'That’s current gain. A tiny trickle into the base releases a flood, often a hundred times larger, through the main path. A small change in the little current makes a big change in the big one.' },
      { step: 5, seconds: 9, narration: 'Drive it hard and it acts as a switch: fully off, or fully on, a clean one or zero. This is the on-off decision, repeated billions of times, that every line of code ultimately runs on.' },
      { step: 6, seconds: 9, narration: 'Drive it gently and it’s an amplifier instead: a faint wiggle at the base comes out as a powerful copy at the output. That’s how a whisper into a microphone can fill a stadium.' },
      { step: 7, seconds: 8, narration: 'Switch or amplifier, it’s the same little valve. And with billions of them etched onto a fingernail of silicon, it quietly runs every phone, every computer, every chip on Earth.' },
    ],
  },
};
