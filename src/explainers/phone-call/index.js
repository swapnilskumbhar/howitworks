import { defineExplainer } from '../../framework/index.js';
import meta from './meta.js';
import { buildPhoneCall } from './model.js';

// Every step loops while active: `phase` sweeps 0->1 once per lap and every
// packet stream's speed multiplier is a whole number, so a dot always returns
// to an identical position at the wrap — seamless no matter how fast the
// segment looks. Radio-wave rings reset each lap too.
function run({ duration }) {
  return ({ tl, handles }) => {
    const s = { t: 0 };
    tl.add(s, {
      t: 1,
      duration,
      ease: 'linear',
      onUpdate: () => handles.set({ phase: s.t }),
    });
  };
}

export default defineExplainer({
  ...meta,

  buildScene({ scene }) {
    return buildPhoneCall({ scene });
  },

  steps: [
    {
      id: 'overview',
      heading: '1 · The whole call',
      body: 'A mobile call never jumps straight from one phone to another. Your voice is turned into a radio signal, thrown to the nearest cell tower, carried by fibre to your operator\'s core network, routed across to the other person\'s tower, and beamed down to their phone — and the same thing happens in reverse for their voice, at the very same time. The whole relay takes only about a tenth of a second. A note on scale: this scene is a schematic, not to scale. In reality a phone is about 15 cm tall while a cell tower stands 15–60 m — 100 to 400 times bigger — the phone sits anywhere from a few hundred metres to a couple of kilometres from that tower (up to ~35 km at the very edge of range), and the two callers can be thousands of kilometres apart. We\'ve shrunk those gaps and enlarged the phones so every stage stays readable.',
      hint: 'Drag to orbit. Blue is your voice; warm is theirs.',
      camera: { position: [-1.4, 4.4, 15.8], target: [-1.0, 1.3, 0] },
      onEnter: ({ handles }) => {
        handles.set({ revealA: 0, revealB: 0, uplinkAmt: 1, downlinkAmt: 1, innerAmt: 0, innerBAmt: 0, waves: 1 });
        handles.setLabels('overview', true);
      },
      timeline: run({ duration: 8000 }),
    },
    {
      id: 'mic',
      heading: '2 · Your voice becomes electricity',
      body: 'Sound is nothing but air pressure rippling back and forth. Inside your phone a tiny microphone holds a membrane that those pressure ripples push on; as it moves it changes an electrical value, tracing out a smooth analog voltage that is a copy of the sound wave. This x-ray view ghosts the phone\'s shell so you can watch the signal travel up the board.',
      camera: { position: [-6.6, 1.0, 2.6], target: [-6.6, 0.55, 0] },
      onEnter: ({ handles }) => {
        handles.set({ revealA: 1, revealB: 0, uplinkAmt: 0, downlinkAmt: 0, innerAmt: 1, innerBAmt: 0, waves: 0 });
        handles.setLabels('mic', true);
      },
      timeline: run({ duration: 4500 }),
    },
    {
      id: 'digitize',
      heading: '3 · Sampled and compressed',
      body: 'A raw analog wave can\'t travel far cleanly, so an analog-to-digital converter measures the voltage tens of thousands of times a second — HD voice is sampled at 16 kHz — turning it into a stream of numbers. A speech codec (modern phones use EVS, or AMR-WB) then compresses each 20 milliseconds of audio into a tiny frame, throwing away what your ear can\'t hear — so only about 50 small frames leave the phone each second.',
      camera: { position: [-6.6, 0.75, 2.0], target: [-6.6, 0.55, 0] },
      onEnter: ({ handles }) => {
        handles.set({ revealA: 1, revealB: 0, uplinkAmt: 0, downlinkAmt: 0, innerAmt: 1, innerBAmt: 0, waves: 0 });
        handles.setLabels('digitize', true);
      },
      timeline: run({ duration: 4500 }),
    },
    {
      id: 'rf',
      heading: '4 · Coded, encrypted, put on a radio wave',
      body: 'The modem wraps those frames into IP packets, adds forward error correction (extra bits that let the receiver repair damage — LTE uses turbo codes, 5G uses LDPC) and encrypts the payload so nobody can eavesdrop. The RF transceiver and power amplifier then modulate the bits onto a radio carrier, and the antenna radiates them outward as an electromagnetic wave.',
      camera: { position: [-6.6, 1.05, 1.9], target: [-6.5, 0.85, 0] },
      onEnter: ({ handles }) => {
        handles.set({ revealA: 1, revealB: 0, uplinkAmt: 0, downlinkAmt: 0, innerAmt: 1, innerBAmt: 0, waves: 0 });
        handles.setLabels('rf', true);
      },
      timeline: run({ duration: 4000 }),
    },
    {
      id: 'uplink',
      heading: '5 · Up to the cell tower',
      body: 'The radio wave races to the nearest cell tower — the base station, called an eNodeB on 4G or a gNB on 5G — whose panel antennas catch your uplink signal. (Uplink and downlink use separate frequencies, e.g. around 1.9 GHz up and 2.1 GHz down, which is exactly what lets both people talk at once.) In scale terms this is the biggest jump in the whole scene: the tower here is drawn barely larger than the phone, but a real mast is 15–60 m tall and typically half a kilometre to a few kilometres away — the radio wave covers that whole distance at the speed of light in well under a hundredth of a millisecond. From the tower, the call is handed to buried fibre — or a microwave dish link — that carries it as data toward the operator\'s core network, often tens of kilometres away.',
      camera: { position: [-3.3, 2.2, 3.2], target: [-3.3, 1.6, 0] },
      onEnter: ({ handles }) => {
        handles.set({ revealA: 0, revealB: 0, uplinkAmt: 1, downlinkAmt: 0.2, innerAmt: 0, innerBAmt: 0, waves: 1 });
        handles.setLabels('uplink', true);
      },
      timeline: run({ duration: 4200 }),
    },
    {
      id: 'core',
      heading: '6 · The core network routes the call',
      body: 'The operator\'s core does the real work of connecting two strangers\' phones. Signalling servers (the IMS, using the SIP protocol) set up the session; a subscriber database (the HSS/HLR) looks up who you\'re calling and which tower is currently serving them; and the packet core forwards the actual voice data (as RTP media). In a few hundredths of a second it has stitched a path across the network to the far side.',
      camera: { position: [0, 1.7, 3.2], target: [0, 0.8, 0] },
      onEnter: ({ handles }) => {
        handles.set({ revealA: 0, revealB: 0, uplinkAmt: 1, downlinkAmt: 1, innerAmt: 0, innerBAmt: 0, waves: 0.4 });
        handles.setLabels('core', true);
      },
      timeline: run({ duration: 4600 }),
    },
    {
      id: 'downlink',
      heading: '7 · Down into their phone',
      body: 'From the recipient\'s serving tower the data is beamed down as a downlink radio wave to their phone, and everything runs in reverse: the modem demodulates the carrier, decrypts and decodes the frames, error-correcting any damage, and a digital-to-analog converter rebuilds a smooth voltage. That voltage drives the earpiece speaker, which pushes the air — and the sound wave that left your mouth arrives, remade, at their ear.',
      camera: { position: [6.6, 1.0, -2.6], target: [6.6, 0.7, -0.05] },
      onEnter: ({ handles }) => {
        handles.set({ revealA: 0, revealB: 1, uplinkAmt: 0, downlinkAmt: 0, innerAmt: 0, innerBAmt: 1, waves: 0 });
        handles.setLabels('downlink', true);
      },
      timeline: run({ duration: 4500 }),
    },
    {
      id: 'run',
      heading: '8 · Both ways, all at once',
      body: 'Microphone, converter, codec, modem, antenna, tower, fibre, core, and all the way back down — every stage runs continuously in both directions at the same time. Because your voice and theirs travel on separate frequencies, the call is genuinely full-duplex: you can interrupt, laugh over each other, talk at once, and the whole invisible relay keeps rebuilding both voices, tens of times a second, in a fraction of a heartbeat.',
      hint: 'Drag to orbit while the call runs.',
      camera: { position: [-1.2, 4.0, 15.0], target: [-0.9, 1.3, 0] },
      freeOrbit: true,
      onEnter: ({ handles }) => {
        handles.set({ revealA: 0, revealB: 0, uplinkAmt: 1, downlinkAmt: 1, innerAmt: 0, innerBAmt: 0, waves: 1 });
        handles.setLabels(null, false);
      },
      timeline: run({ duration: 3400 }),
    },
  ],
});
