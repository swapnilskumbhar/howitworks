// Editorial layer for video export (scripts/export-video.mjs).
// This file is where views are won: hooks and captions matter more than the
// render. Rules of thumb — hook states the counterintuitive fact in <12 words;
// captions are one line, mobile-readable, no jargon; narration is spoken
// prose (contractions, short sentences), NOT the step body copy.
//
// steps: 0 face · 1 inside the case · 2 mainspring · 3 gear train
//        4 escapement · 5 balance wheel · 6 back to the hands · 7 whole watch
export default {
  hook: 'No battery. No electricity.\nSo what keeps this ticking?',

  // 9:16, narrated + captions. (short-captioned.mp4 stays silent — post that
  // variant with a trending sound instead whenever preferred.)
  short: {
    shots: [
      {
        step: 0,
        seconds: 4,
        caption: 'This watch has no battery',
        narration: 'This watch has no battery. Nothing electronic at all. So what keeps it ticking?',
      },
      {
        step: 1,
        seconds: 5,
        caption: 'Inside: a machine with ~130 parts',
        narration: 'Under the dial: a machine of about a hundred and thirty parts, all powered by one coiled spring.',
      },
      {
        step: 2,
        seconds: 5,
        caption: 'The fuel tank is a coiled steel ribbon',
        narration: 'Winding the crown coils this steel ribbon tighter. That’s the fuel tank — two days of energy.',
      },
      {
        step: 4,
        seconds: 6,
        caption: 'These two rubies release ONE tooth per tick',
        narration: 'These two rubies are the gatekeepers. They release exactly one tooth per beat. That’s the tick you hear.',
      },
      {
        step: 5,
        seconds: 6,
        caption: 'And this wheel beats 8 times a second — the heartbeat',
        narration: 'And this wheel is the heartbeat — swinging eight times every second, telling the whole machine how fast time goes.',
      },
      {
        step: 7,
        seconds: 5,
        caption: 'A spring and a swinging wheel. That’s all time needs.',
        narration: 'A spring and a swinging wheel. That’s all it takes to keep time on your wrist.',
      },
    ],
  },

  // 16:9, full story, narrated
  long: {
    shots: [
      {
        step: 0,
        seconds: 9,
        narration:
          'This is one of the smallest machines you will ever own. Three hands, twelve marks, one knob — and no battery anywhere. Watch the seconds hand. It doesn’t jump like a quartz watch. It sweeps. That sweep is a mechanical heartbeat, and we’re about to find it.',
      },
      {
        step: 1,
        seconds: 10,
        narration:
          'Lift off the dial, and here’s the machine. It’s a chain: a wound spring pushes a train of gears, the last gear is held back by a tiny fork, and the fork answers to that swinging wheel. Power at one end, timekeeping at the other.',
      },
      {
        step: 2,
        seconds: 9,
        narration:
          'The fuel tank. Winding the crown coils a flat ribbon of spring steel tighter and tighter inside this barrel. A few turns store enough energy to run the watch for two days.',
      },
      {
        step: 3,
        seconds: 8,
        narration:
          'The gear train trades force for speed. Each wheel spins the next one faster, until the fourth wheel turns exactly once per minute. That’s why the seconds hand rides on it.',
      },
      {
        step: 4,
        seconds: 10,
        narration:
          'Now the clever part. Left alone, the spring would unwind in seconds. This fork’s two ruby jewels lock the escape wheel completely — and release exactly one tooth per beat. Tick. That sound a watch makes? It’s this.',
      },
      {
        step: 5,
        seconds: 10,
        narration:
          'And this is the heartbeat itself. The balance wheel swings on a hair-thin spiral spring, eight beats every second — a pendulum that works in any position. It decides the speed. Everything else in the watch just obeys.',
      },
      {
        step: 6,
        seconds: 9,
        narration:
          'Put the dial back, and the whole chain hides behind three pointers. A small side train slows the same rotation down sixty times for the minute hand, and seven hundred twenty times for the hour hand.',
      },
      {
        step: 7,
        seconds: 9,
        narration:
          'Spring, barrel, train, fork, balance — a conversation between a spring and a swinging wheel, repeated half a million times a day, on a machine small enough to forget you’re wearing it.',
      },
    ],
  },
};
