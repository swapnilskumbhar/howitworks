// steps: 0 anatomy · 1 compressor · 2 condenser · 3 capillary tube
//        4 evaporator · 5 the cycle runs
export default {
  hook: 'An AC doesn’t make cold.\nIt moves heat outside.',

  short: {
    dolly: 1.6,
    shots: [
      { step: 0, seconds: 4, dolly: 1.7, caption: 'One loop, split in two',
        narration: 'An air conditioner never makes cold. It just carries heat from inside your room to outside.' },
      { step: 1, seconds: 5, caption: 'Compressor: squeeze the gas hot',
        narration: 'The compressor squeezes the refrigerant gas, and squeezing makes it scorching hot — hotter than outside.' },
      { step: 2, seconds: 5, caption: 'Condenser: dump the heat outdoors',
        narration: 'Outside, that hot gas flows through coils and dumps its heat to the air, condensing into liquid.' },
      { step: 3, seconds: 5, caption: 'A tiny nozzle drops the pressure',
        narration: 'It squeezes through a narrow tube. The pressure crashes, and the liquid turns bitterly cold.' },
      { step: 4, seconds: 6, caption: 'Evaporator: soak up your room’s heat',
        narration: 'That cold liquid runs through indoor coils, soaking up your room’s heat as a fan blows over it.' },
      { step: 5, seconds: 5, caption: 'Round and round, heat pumped out',
        narration: 'Then back to the compressor to start again — an endless loop pumping heat out of your home.' },
    ],
  },

  long: {
    shots: [
      { step: 0, seconds: 9, narration: 'Here’s the first surprise about air conditioning: it doesn’t create cold. There’s no such thing as cold, only heat. An AC is a pump that grabs heat from inside your room and dumps it outside, using a special fluid that goes round and round.' },
      { step: 1, seconds: 9, narration: 'The loop starts at the compressor. It takes the refrigerant as a gas and squeezes it hard. Just like a bike pump getting warm, compressing the gas makes it hot — deliberately hotter than the air outdoors.' },
      { step: 2, seconds: 9, narration: 'That super-hot gas flows into the outdoor condenser coils. Because it’s now hotter than outside, heat naturally flows out of it into the air, helped by a fan. As it cools, the gas condenses into a warm liquid.' },
      { step: 3, seconds: 9, narration: 'Next it’s forced through a very narrow tube. On the far side the pressure suddenly drops, and when pressure falls, temperature falls with it. The refrigerant comes out the other end as a freezing cold liquid.' },
      { step: 4, seconds: 10, narration: 'Now the payoff. That cold liquid runs through the indoor evaporator coils while a fan blows your warm room air across them. The refrigerant soaks up the heat and your room gets cooler. Absorbing that heat boils it back into a gas.' },
      { step: 5, seconds: 9, narration: 'And that gas returns to the compressor to begin again. Squeeze it hot, dump the heat outside, expand it cold, soak up heat inside. Round and round, quietly moving warmth out of your home.' },
    ],
  },
};
