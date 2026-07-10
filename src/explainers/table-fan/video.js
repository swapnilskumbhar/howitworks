// steps: 0 anatomy · 1 the motor spins · 2 blades push the air · 3 the sweep
export default {
  hook: 'How does a fan throw air\nclear across the room?',

  short: {
    shots: [
      { step: 0, seconds: 4, caption: 'A desk fan: four simple systems',
        narration: 'A desk fan is just four parts: a base, a motor, some tilted blades, and a guard.' },
      { step: 1, seconds: 5, caption: 'A magnetic field spins the motor',
        narration: 'Inside the head, a rotating magnetic field drags the motor around about twenty times a second.' },
      { step: 2, seconds: 6, caption: 'Each blade is tilted like a propeller',
        narration: 'Each blade is angled like a boat propeller. Spinning, its slanted face scoops air and throws it forward.' },
      { step: 3, seconds: 6, caption: 'A tiny gearbox sweeps it side to side',
        narration: 'A little gearbox on the back nods the whole head left and right, sweeping that breeze across the room.' },
    ],
  },

  long: {
    shots: [
      { step: 0, seconds: 8, narration: 'A desk fan looks simple, and it is. Four systems: a weighted base to keep it upright, an electric motor in the head, three tilted blades, and a wire guard so you keep your fingers.' },
      { step: 1, seconds: 9, narration: 'It starts with the motor. Alternating current in the coils creates a magnetic field that spins around the inside. The rotor chases that field, dragging the shaft and blades with it, around twenty times every second.' },
      { step: 2, seconds: 10, narration: 'Now the blades. Each one is tilted, like a propeller. As it sweeps around, that angled face pushes against the air and shoves it from behind the fan to in front of it, carving out a moving column of breeze. More tilt or more speed means more wind.' },
      { step: 3, seconds: 9, narration: 'And the sweep. A small gearbox on the back turns the fast spin into a slow nod, swinging the whole head side to side. That’s why one fan can cool a whole room instead of just one spot. Flip the knob and it stares straight ahead.' },
    ],
  },
};
