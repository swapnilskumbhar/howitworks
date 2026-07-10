// steps: 0 component · 1 changing flux · 2 induces secondary · 3 turns ratio
//        4 only AC works · 5 laminated core · 6 runs the grid · 7 quietly
export default {
  hook: 'It changes voltage with\nzero moving parts.',

  short: {
    shots: [
      { step: 0, seconds: 4, caption: 'A transformer: two coils, one core',
        narration: 'A transformer changes voltage up or down with no moving parts — just two coils on an iron ring.' },
      { step: 1, seconds: 5, caption: 'AC in the first coil makes flux',
        narration: 'Alternating current in the first coil creates a magnetic flux that surges back and forth in the core.' },
      { step: 2, seconds: 5, caption: 'That changing flux powers coil two',
        narration: 'That changing flux sweeps through the second coil and pushes its own voltage into life.' },
      { step: 3, seconds: 6, caption: 'The turns ratio sets the trade',
        narration: 'Count the turns. Twice as many on the output means twice the voltage — but half the current.' },
      { step: 4, seconds: 5, caption: 'Only AC works — it must change',
        narration: 'It only works on AC. Steady current makes a steady field, and a still field induces nothing.' },
      { step: 6, seconds: 5, caption: 'This trick runs the entire grid',
        narration: 'This exact trick steps power up for long journeys and back down for your home.' },
    ],
  },

  long: {
    shots: [
      { step: 0, seconds: 8, narration: 'A transformer looks like nothing much — two coils of wire wound on a shared iron core. But it does something remarkable: it changes the voltage of electricity, up or down, with no moving parts at all.' },
      { step: 1, seconds: 9, narration: 'It starts with alternating current in the first coil, the primary. Because that current constantly reverses, it creates a magnetic flux in the iron core that also surges back and forth, growing and collapsing many times a second.' },
      { step: 2, seconds: 9, narration: 'The core carries that changing flux around to the second coil, the secondary. And a changing magnetic field through a coil induces a voltage. So the second coil comes alive, powered across a gap by magnetism alone.' },
      { step: 3, seconds: 10, narration: 'The magic number is the turns ratio. If the secondary has twice as many loops as the primary, it makes twice the voltage. But there’s no free lunch — that doubled voltage comes with half the current. Power in equals power out.' },
      { step: 4, seconds: 9, narration: 'This is why the grid uses alternating current. A transformer needs a changing field. Feed it steady direct current and the flux just sits there; nothing changes, so nothing is induced, and the second coil stays dead.' },
      { step: 5, seconds: 9, narration: 'The core isn’t solid iron, either. That changing flux would drive wasteful swirling currents inside it, so the core is built from thin insulated sheets stacked together, breaking up those loops and saving energy.' },
      { step: 6, seconds: 9, narration: 'Scale it up and this is the backbone of the power grid. Transformers step voltage way up to shove power across hundreds of miles with little loss, then step it back down for your town and your wall.' },
      { step: 7, seconds: 8, narration: 'From the hum of a substation to the brick on your laptop charger, it’s all the same silent trick: two coils, one core, trading voltage for current on nothing but a changing magnetic field.' },
    ],
  },
};
