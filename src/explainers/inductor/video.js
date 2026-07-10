// steps: 0 component · 1 current makes a field · 2 opposing the change
//        3 energy stored in the field · 4 why a ring · 5 quietly running
export default {
  hook: 'A coil that fights any\nchange in current.',

  short: {
    shots: [
      { step: 0, seconds: 4, caption: 'An inductor: just a coil of wire',
        narration: 'An inductor is almost nothing — just a coil of wire. But that shape gives it a strange power.' },
      { step: 1, seconds: 5, caption: 'Current makes a magnetic field',
        narration: 'Run current through the coil and it wraps itself in a magnetic field, concentrated down the middle.' },
      { step: 2, seconds: 6, caption: 'It resists any sudden change',
        narration: 'Try to change that current and the field fights back, resisting the change. It hates being interrupted.' },
      { step: 3, seconds: 5, caption: 'Energy lives in the field itself',
        narration: 'While current flows, energy is stored invisibly in that magnetic field around the coil.' },
      { step: 4, seconds: 5, caption: 'A ring traps the field inside',
        narration: 'Bend the coil into a ring and the field loops inside, tidy and contained. That’s a real inductor.' },
    ],
  },

  long: {
    shots: [
      { step: 0, seconds: 8, narration: 'This is an inductor, and it might be the simplest component there is: a coil of wire, and that’s basically it. Yet the geometry alone gives it a genuinely useful and slightly stubborn behavior.' },
      { step: 1, seconds: 9, narration: 'Send a current through any wire and it creates a magnetic field around it. Coil the wire up, and all those little fields stack and reinforce, making a strong, concentrated field running straight through the center.' },
      { step: 2, seconds: 10, narration: 'Here’s the stubborn part. If you try to change the current — speed it up or cut it off — the collapsing or growing field pushes back to oppose you. An inductor resists change in current, the way mass resists change in motion.' },
      { step: 3, seconds: 9, narration: 'And while the current flows steadily, energy is quietly stored in that magnetic field itself, ready to be given back the instant the current tries to drop.' },
      { step: 4, seconds: 9, narration: 'Bend the coil into a closed ring and the field has nowhere to leak; it loops around inside the core, contained and efficient. That’s why so many real inductors are little doughnut shapes, smoothing currents and filtering signals all over your electronics.' },
    ],
  },
};
