// FIREARM — long-form (16:9) ONLY. Do NOT export a short: age-restriction and
// demonetization risk on short-form platforms. Educational mechanism only.
// steps: 0 the pistol · 1 inside · 2 trigger · 3 primer→powder · 4 down the barrel
//        5 cycling the action · 6 bullet in flight · 7 how fast · 8 run
export default {
  hook: 'One trigger pull sets off a\nchain reaction in milliseconds.',

  long: {
    shots: [
      { step: 0, seconds: 8, narration: 'This is a semi-automatic pistol. What makes it semi-automatic is that a single trigger pull does a whole sequence of work: it fires one round, then uses that shot’s own energy to reload itself, ready for the next.' },
      { step: 1, seconds: 9, narration: 'Let’s look inside. The key parts are the barrel, the slide that rides on top, a spring that resists it, and the firing mechanism at the rear. A magazine of cartridges feeds up from the grip.' },
      { step: 2, seconds: 9, narration: 'It begins with the trigger. Pulling it releases a spring-loaded striker that’s been held back under tension. The striker snaps forward toward the waiting cartridge at the back of the barrel.' },
      { step: 3, seconds: 9, narration: 'The striker hits the primer, a tiny sensitive cap at the base of the cartridge. That impact makes it spark, and the spark ignites the main charge of powder packed behind the bullet.' },
      { step: 4, seconds: 9, narration: 'The powder doesn’t explode so much as burn extremely fast, generating a huge volume of gas. That pressure has only one way out: it drives the bullet down the barrel, faster and faster, until it leaves the muzzle.' },
      { step: 5, seconds: 10, narration: 'Here’s the clever part. The same pressure also shoves the slide backward. As it recoils, it ejects the empty case, cocks the striker again, and a spring snaps it forward, stripping a fresh round from the magazine into the chamber. Reloaded, automatically.' },
      { step: 6, seconds: 9, narration: 'Meanwhile the bullet is in flight. Spiral grooves cut inside the barrel, called rifling, spin it like a thrown football. That spin keeps it stable and pointed straight, so it flies true instead of tumbling.' },
      { step: 7, seconds: 9, narration: 'And it all happens astonishingly fast. From trigger to muzzle is just a couple of thousandths of a second, and the bullet leaves at hundreds of meters per second — faster than sound.' },
      { step: 8, seconds: 9, narration: 'Fire, unlock, eject, cock, reload — one pull of the trigger drives the entire cycle, using the shot’s own energy to prepare the next. That self-loading loop is what puts the automatic in semi-automatic.' },
    ],
  },
};
