// steps: 0 component · 1 rolled foil · 2 unrolling true length
//        3 charging Q=CV · 4 discharge flash · 5 smoothing ripple
export default {
  hook: 'It can dump its energy\nin a millisecond.',

  short: {
    shots: [
      { step: 0, seconds: 4, caption: 'A capacitor: a tiny energy tank',
        narration: 'A capacitor is a tiny electrical tank. It stores charge fast, and releases it even faster.' },
      { step: 1, seconds: 5, caption: 'Inside: two foils, rolled up',
        narration: 'Inside is a surprise: two long strips of metal foil, rolled up tight like a jelly roll.' },
      { step: 2, seconds: 5, caption: 'Unrolled, the foil runs for meters',
        narration: 'Unroll it and the foil stretches for meters. All that area is what lets it hold charge.' },
      { step: 3, seconds: 6, caption: 'Charging: electrons pile on one plate',
        narration: 'Connect a battery and electrons pile onto one foil. More voltage, more charge. That’s the whole law.' },
      { step: 4, seconds: 5, caption: 'Discharge: all of it, at once',
        narration: 'Give it a path and it empties in an instant — the flash that fires a camera comes from this.' },
      { step: 5, seconds: 5, caption: 'Smoothing bumpy power into steady',
        narration: 'And by filling and draining constantly, it smooths bumpy power into a steady flow.' },
    ],
  },

  long: {
    shots: [
      { step: 0, seconds: 8, narration: 'This is a capacitor, one of the most common parts in all of electronics. Think of it as a very small, very fast battery — but instead of chemistry, it stores energy as raw electric charge.' },
      { step: 1, seconds: 9, narration: 'Crack one open and you find two long ribbons of metal foil, separated by a thin insulator, and wound into a tight roll. Rolling it packs a huge amount of foil into a tiny can.' },
      { step: 2, seconds: 9, narration: 'Unrolled, you can see the trick. The two foils run side by side for meters, never touching. The more surface area facing each other, the more charge the capacitor can hold.' },
      { step: 3, seconds: 10, narration: 'Connect a voltage and electrons rush onto one foil and off the other, until the capacitor pushes back just as hard. The charge it holds equals its capacitance times the voltage. Bigger plates or higher voltage, more stored energy.' },
      { step: 4, seconds: 9, narration: 'Now give that charge a path to flow, and it doesn’t trickle — it dumps, almost instantly. That sudden burst is how a camera flash fires, or how a defibrillator delivers its jolt.' },
      { step: 5, seconds: 9, narration: 'Its quiet everyday job is smoothing. Power supplies deliver electricity in bumps; the capacitor charges on the peaks and discharges in the dips, ironing those ripples into the steady voltage your chips need.' },
    ],
  },
};
