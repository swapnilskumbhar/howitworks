// steps: 0 anatomy · 1 reservoir · 2 penstock · 3 turbine · 4 generator
//        5 step-up & grid · 6 tailrace · 7 plant runs
export default {
  hook: 'Falling water in.\nCity-grid power out.',

  short: {
    dolly: 2.3,
    shots: [
      { step: 0, seconds: 4, dolly: 2.5, caption: 'A hydro plant, top to bottom',
        narration: 'A hydro plant turns nothing but falling water into electricity for a whole city.' },
      { step: 1, seconds: 5, caption: 'The reservoir stores raw energy',
        narration: 'It starts with a reservoir held high behind a dam. All that trapped water is stored energy.' },
      { step: 2, seconds: 5, caption: 'The penstock drops it hard',
        narration: 'A giant pipe called the penstock drops the water far down, trading height for pressure and speed.' },
      { step: 3, seconds: 6, caption: 'The turbine spins from the blast',
        narration: 'At the bottom, the rushing water slams into a turbine and spins it with tremendous force.' },
      { step: 4, seconds: 5, caption: 'The generator makes electricity',
        narration: 'The turbine turns a generator, and spinning magnets inside conjure electric current.' },
      { step: 5, seconds: 5, caption: 'Stepped up and sent to the grid',
        narration: 'A transformer boosts the voltage, and the power races off across the grid to your home.' },
    ],
  },

  long: {
    shots: [
      { step: 0, seconds: 8, narration: 'This is a hydroelectric power plant. It’s one of the oldest and cleanest ways we make electricity, and the whole thing runs on a simple idea: let water fall, and catch the energy on the way down.' },
      { step: 1, seconds: 9, narration: 'It begins with the reservoir, a huge lake of water held high behind a dam. Sitting up there, the water carries potential energy, just waiting. The higher it sits and the more there is, the more power the plant can make.' },
      { step: 2, seconds: 9, narration: 'When power is needed, gates open and water pours into the penstock, a massive steel pipe running down the dam. As it falls, that stored height converts into pressure and tremendous speed.' },
      { step: 3, seconds: 9, narration: 'At the bottom, the jet of water strikes the blades of a turbine and spins it. This is the heart of the plant, where the raw motion of the water becomes spinning mechanical power.' },
      { step: 4, seconds: 9, narration: 'The turbine shaft drives a generator. Inside, powerful electromagnets spin past coils of wire, and that moving magnetic field pushes electrons through the wire. Motion in, electricity out.' },
      { step: 5, seconds: 9, narration: 'That electricity leaves at a modest voltage, no good for long trips. So a step-up transformer boosts it to hundreds of thousands of volts, letting it travel across the country with barely any loss.' },
      { step: 6, seconds: 8, narration: 'And the water? Its job done, it flows out the tailrace back into the river below, continuing downstream as if nothing happened. Nothing is burned, nothing used up.' },
      { step: 7, seconds: 9, narration: 'Reservoir, penstock, turbine, generator, grid. A continuous chain that turns the simple fall of water into power for millions, as long as the river keeps flowing.' },
    ],
  },
};
