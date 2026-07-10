import * as THREE from 'three';
import { materials, rod, box, disc } from '../../framework/parts.js';
import { beveledBox, lathe, tubeAlong, chainPath } from '../../framework/geometry.js';
import { callout } from '../../framework/labels.js';

// "How a phone call works" — a mobile-to-mobile VoLTE call traced end to end,
// staged as one continuous studio landscape running along +X:
//   phone A  ->  cell tower A  ->  mobile core network  ->  cell tower B  ->  phone B
// Signal packets ride the whole relay both ways at once (full-duplex): your
// voice (blue) flows left->right, their voice (warm) flows right->left, and
// every stage is a real link in the chain a VoLTE call actually crosses.
//
// Reference facts (validated against 3GPP VoLTE architecture, the IMS core, and
// the LTE/NR air interface — cross-checked with Wikipedia "Voice over LTE",
// "IP Multimedia Subsystem" and operator VoLTE call-flow references):
//  - A phone's MICROPHONE turns air-pressure sound waves into a continuously
//    varying analog voltage (a diaphragm moving over a capacitor / MEMS plate).
//  - An ADC SAMPLES that voltage — VoLTE HD voice is captured at 16 kHz
//    (wideband), i.e. 16,000 numbers per second — turning the wave into a
//    stream of digital samples.
//  - A speech CODEC compresses it: modern VoLTE uses EVS (Enhanced Voice
//    Services, ~5.9-24.4 kbps typical) or AMR-WB, packing each 20 ms of audio
//    into a small frame — so ~50 voice frames leave the phone every second.
//  - The baseband/modem PACKETIZES those frames into RTP/IP packets, adds
//    CHANNEL CODING (forward error correction — LTE turbo codes, 5G NR LDPC)
//    so bit errors on the air can be repaired, and ENCRYPTS the payload
//    (128-bit ciphering, e.g. SNOW 3G / AES) so it can't be listened in on.
//  - The RF transceiver + power amplifier MODULATE those bits onto a radio
//    carrier (LTE uplink SC-FDMA, downlink OFDMA; symbols carried as QPSK up to
//    256-QAM) and the ANTENNA radiates it. FDD bands use a lower UPLINK
//    frequency and a higher DOWNLINK frequency (e.g. band 1: 1920-1980 MHz up,
//    2110-2170 MHz down) — separate frequencies is what lets both people talk
//    at the SAME time (full-duplex).
//  - The radio wave reaches the nearest CELL TOWER — the base station
//    (LTE eNodeB / 5G gNB) — whose sector panel antennas receive the uplink.
//  - BACKHAUL (fibre, or a microwave dish link) carries the data from the
//    tower to the operator's MOBILE CORE NETWORK.
//  - The core ROUTES the call: the packet core (EPC) plus the IMS handle it,
//    with SIP signalling through the CSCF servers setting up the session and
//    a subscriber database (HSS/HLR) locating the recipient and their serving
//    tower. Media flows as RTP; signalling as SIP.
//  - It all runs in reverse into the recipient's phone: their tower's DOWNLINK
//    radio -> their modem DEMODULATES, DECRYPTS and DECODES the frames -> a DAC
//    turns samples back into a voltage -> the SPEAKER pushes air -> their ear.
//  - End to end mouth-to-ear latency is only ~100-150 ms, and because uplink
//    and downlink run on their own frequencies it is genuinely full-duplex —
//    both directions, continuously, every moment of the call.

// ---------------------------------------------------------------------------
// world layout — one long corridor along +X, ground at y = 0
// ---------------------------------------------------------------------------
const PHONE_A_X = -6.6;
const TOWER_A_X = -3.3;
const CORE_X = 0.0;
const TOWER_B_X = 3.3;
const PHONE_B_X = 6.6;

const GROUND_LEFT = PHONE_A_X - 1.1;
const GROUND_RIGHT = PHONE_B_X + 1.1;
const GROUND_W = GROUND_RIGHT - GROUND_LEFT;
const GROUND_CX = (GROUND_LEFT + GROUND_RIGHT) / 2;

const UP_COLOR = 0x6ec8ff; // "your voice" — uplink A -> B, the family accent
const DOWN_COLOR = 0xffb066; // "their voice" — downlink B -> A, warm
const RF_COLOR = 0xd3f0ff; // radio-wave rings — bright, cool
const SIG_COLOR = 0x8fe6ff; // internal on-board signal dots

function tri(t) {
  return 1 - Math.abs(1 - 2 * t);
}

function wireMat() {
  return new THREE.MeshPhysicalMaterial({ color: 0x1b1d21, metalness: 0.75, roughness: 0.42 });
}

// Midpoint of a->b lifted by `rise` (arcs radio hops UP and over, the mirror of
// power-transmission's catenary sag). Negative rise = sag.
function arc(a, b, rise) {
  return [(a[0] + b[0]) / 2, Math.max(a[1], b[1]) + rise, (a[2] + b[2]) / 2];
}

// One stream of packets riding one or more paths. `paths` is an array of
// point-lists (each a chainPath of straight legs). Dots ride each path with a
// whole-number speed multiplier so one phase lap (0->1) returns every dot to an
// identical pose — seamless regardless of apparent speed. `wire` draws a thin
// physical tube under the dots (the link itself); pass wire:false for a pure
// wireless hop where only the packets should show.
function buildStream(paths, {
  radius = 0.012, count = 6, color = UP_COLOR, size = 0.026, speedMul = 2, wire = true, arcRise = 0,
} = {}) {
  const group = new THREE.Group();
  const wm = wireMat();
  const chains = [];
  paths.forEach((pts) => {
    const segs = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      segs.push(arcRise !== 0 ? [a, arc(a, b, arcRise), b] : [a, b]);
    }
    const chain = chainPath(segs);
    if (wire) {
      chain.curves.forEach((curve) => {
        const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, radius, 10), wm);
        tube.castShadow = true;
        group.add(tube);
      });
    }
    chains.push(chain);
  });

  const dots = [];
  chains.forEach((chain) => {
    for (let i = 0; i < count; i++) {
      const mat = materials.glow(color, 1.6);
      mat.transparent = true;
      mat.opacity = 0;
      mat.depthWrite = false;
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(size, 10, 8), mat);
      mesh.userData.seed = i / count;
      mesh.userData.chain = chain;
      group.add(mesh);
      dots.push(mesh);
    }
  });

  function update(phase, amount = 1) {
    dots.forEach((mesh) => {
      const t = (mesh.userData.seed + phase * speedMul) % 1;
      mesh.position.copy(mesh.userData.chain.getPointAt(t));
      const fade = Math.min(1, t * 8) * Math.min(1, (1 - t) * 8);
      mesh.material.opacity = fade * amount;
    });
  }

  return { group, update };
}

// Concentric radio wavefronts expanding from an antenna toward the link — a set
// of thin rings that grow from 0 to maxR and fade, facing along the hop axis.
// Seamless: each ring's radius is ((seed + phase) % 1) * maxR, one lap resets.
function buildRadioBurst(origin, axis, { color = RF_COLOR, rings = 4, maxR = 0.9, tilt = 0 } = {}) {
  const group = new THREE.Group();
  group.position.set(...origin);
  // orient local +Z along `axis`
  const dir = new THREE.Vector3(...axis).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
  group.quaternion.copy(q);
  const meshes = [];
  for (let i = 0; i < rings; i++) {
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
    const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.012, 6, 40), mat);
    m.rotation.x = tilt;
    m.userData.seed = i / rings;
    group.add(m);
    meshes.push(m);
  }
  function update(phase, amount = 1) {
    meshes.forEach((m) => {
      const t = (m.userData.seed + phase) % 1;
      const r = 0.04 + t * maxR;
      m.scale.set(r, r, r);
      m.position.z = t * maxR * 0.5; // drift outward along the axis too
      m.material.opacity = Math.min(1, t * 6) * (1 - t) * amount;
    });
  }
  return { group, update };
}

// ---------------------------------------------------------------------------
// A phone: a real product-shot handset (solid glass slab) whose shell ghosts to
// x-ray on setReveal(), exposing the internal signal chain board — microphone,
// ADC, codec/DSP, baseband modem, RF transceiver, up to the antenna.
// Built facing +Z (screen toward viewer) standing upright on a small plinth.
// ---------------------------------------------------------------------------
function buildPhone(accentScreen = 0x123b2e) {
  const g = new THREE.Group();
  const W = 0.52;
  const H = 1.06;
  const D = 0.1;
  const PB = 0.08; // body bottom y (plinth sits below)
  const cy = PB + H / 2;

  // plinth
  const plinth = beveledBox(0.4, 0.06, 0.34, materials.paintedMetal(0x24262b), 0.02);
  plinth.position.y = 0.03;
  g.add(plinth);
  const neck = rod(0.02, PB, materials.chrome(0xbfc4cc), 12);
  g.add(neck);

  const shellMats = [];
  function shellMaterial(base) {
    const m = base;
    m.transparent = true;
    m.depthWrite = true;
    shellMats.push(m);
    return m;
  }

  // frame rails (4) — the aluminium band around the phone
  const frameMat = shellMaterial(materials.aluminum(0x2b2e33));
  const railT = 0.055;
  const railV = box(railT, H, D, frameMat);
  const railTop = box(W, railT, D, frameMat);
  [[-W / 2 + railT / 2, cy, 0], [W / 2 - railT / 2, cy, 0]].forEach((p) => {
    const r = railV.clone(); r.position.set(...p); g.add(r);
  });
  [[0, cy + H / 2 - railT / 2, 0], [0, cy - H / 2 + railT / 2, 0]].forEach((p) => {
    const r = railTop.clone(); r.position.set(...p); g.add(r);
  });

  // back cover
  const backMat = shellMaterial(materials.paintedMetal(0x1a1c20));
  const back = beveledBox(W - 0.01, H - 0.01, 0.02, backMat, 0.02);
  back.position.set(0, cy, -D / 2 + 0.01);
  g.add(back);

  // front glass + emissive "call in progress" screen
  const glassMat = shellMaterial(new THREE.MeshPhysicalMaterial({
    color: 0x0a0c10, metalness: 0, roughness: 0.06, clearcoat: 1, transparent: true, opacity: 1,
  }));
  const glass = beveledBox(W - 0.02, H - 0.02, 0.014, glassMat, 0.02);
  glass.position.set(0, cy, D / 2 - 0.006);
  g.add(glass);
  const screenMat = materials.glow(accentScreen, 0.55);
  screenMat.transparent = true;
  shellMats.push(screenMat);
  const screen = box(W - 0.07, H - 0.14, 0.004, screenMat);
  screen.position.set(0, cy, D / 2 - 0.016);
  g.add(screen);

  // ---- internal board (revealed on x-ray) -------------------------------
  const board = new THREE.Group();
  g.add(board);
  const pcbMat = new THREE.MeshPhysicalMaterial({ color: 0x0c3b2c, metalness: 0.2, roughness: 0.55 });
  const pcb = beveledBox(W - 0.09, H - 0.16, 0.012, pcbMat, 0.01);
  pcb.position.set(0, cy, 0);
  board.add(pcb);

  const chipMat = () => materials.paintedMetal(0x101216);
  const goldMat = new THREE.MeshPhysicalMaterial({ color: 0xcaa24a, metalness: 1, roughness: 0.35 });

  // signal-chain components bottom -> top (uplink order)
  function chip(y, w, h, mat) {
    const c = beveledBox(w, h, 0.03, mat, 0.006);
    c.position.set(0, cy - H / 2 + y, 0.02);
    board.add(c);
    return [c.position.x, c.position.y, 0.05];
  }
  // microphone — a little acoustic port grille near the bottom edge
  const micGrille = disc(0.045, 0.02, materials.paintedMetal(0x2a2d33), 20);
  micGrille.rotation.x = Math.PI / 2;
  micGrille.position.set(0, cy - H / 2 + 0.12, 0.05);
  board.add(micGrille);
  for (let i = 0; i < 5; i++) {
    const hole = disc(0.006, 0.03, materials.paintedMetal(0x07080a), 8);
    hole.rotation.x = Math.PI / 2;
    const a = (i / 5) * Math.PI * 2;
    hole.position.set(Math.cos(a) * 0.022, cy - H / 2 + 0.12 + Math.sin(a) * 0.022, 0.055);
    board.add(hole);
  }
  const micPt = [0, cy - H / 2 + 0.12, 0.06];

  const adcPt = chip(0.30, 0.14, 0.1, chipMat());
  const codecPt = chip(0.48, 0.2, 0.13, chipMat()); // the big DSP/codec die
  const modemPt = chip(0.68, 0.18, 0.11, chipMat());
  const rfPt = chip(0.85, 0.12, 0.08, goldMat.clone()); // RF/PA — gold shield

  // antenna — a slim strip up the right edge with a nub tip
  const antStrip = box(0.02, 0.2, 0.02, materials.chrome(0xd0d5db));
  antStrip.position.set(W / 2 - 0.05, cy + H / 2 - 0.12, 0.02);
  board.add(antStrip);
  const antTipLocal = [W / 2 - 0.05, cy + H / 2 - 0.01, 0.02];
  const antNub = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), materials.chrome(0xd0d5db));
  antNub.position.set(...antTipLocal);
  board.add(antNub);

  // earpiece speaker near the top (downlink output)
  const spk = disc(0.05, 0.02, materials.paintedMetal(0x2a2d33), 20);
  spk.rotation.x = Math.PI / 2;
  spk.position.set(0, cy + H / 2 - 0.05, 0.05);
  board.add(spk);
  const spkPt = [0, cy + H / 2 - 0.05, 0.06];

  // internal trace: mic -> adc -> codec -> modem -> rf -> antenna tip
  const traceMat = new THREE.MeshBasicMaterial({ color: 0x2f6f5a });
  const tracePts = [micPt, adcPt, codecPt, modemPt, rfPt, antTipLocal];
  const trace = tubeAlong(tracePts, 0.006, traceMat, { tubularSegments: 60 });
  board.add(trace);

  return {
    group: g,
    cy,
    micPt, adcPt, codecPt, modemPt, rfPt, spkPt,
    antTipLocal,
    board,
    setReveal(t) {
      const op = 1 - (1 - 0.16) * t;
      for (const m of shellMats) {
        m.opacity = op;
        m.depthWrite = t < 0.05;
      }
      screenMat.emissiveIntensity = 0.55 * (1 - t);
      board.visible = t > 0.08;
    },
  };
}

// ---------------------------------------------------------------------------
// A cell tower: a tapered monopole mast with a triangular head carrying three
// sector panel antennas, a microwave backhaul drum, and an equipment cabinet
// (the base-station radio) at the foot.
// ---------------------------------------------------------------------------
function buildTower() {
  const g = new THREE.Group();
  const mastMat = materials.brushedSteel(0xaab1ba);
  mastMat.roughness = 0.5;
  const H = 2.5;
  const mast = lathe([[0.07, 0], [0.05, H * 0.6], [0.035, H], [0.03, H]], mastMat, 20);
  g.add(mast);

  // triangular antenna head
  const headY = H - 0.15;
  const armMat = materials.darkMetal(0x33383f);
  const panelMat = materials.paintedMetal(0xd6dae0);
  const panelPts = [];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
    const px = Math.cos(a) * 0.32;
    const pz = Math.sin(a) * 0.32;
    g.add(tubeAlong([[0, headY, 0], [px, headY + 0.05, pz]], 0.02, armMat, { tubularSegments: 4 }));
    const panel = beveledBox(0.09, 0.34, 0.05, panelMat, 0.01);
    panel.position.set(px, headY + 0.05, pz);
    panel.lookAt(px * 3, headY + 0.05, pz * 3);
    g.add(panel);
    panelPts.push([px * 1.15, headY + 0.05, pz * 1.15]);
  }
  // top beacon
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), materials.glow(0xff4436, 1.4));
  beacon.position.set(0, H + 0.05, 0);
  g.add(beacon);

  // microwave backhaul drum, mid-mast
  const drum = lathe([[0.001, 0], [0.12, 0.01], [0.13, 0.1], [0.1, 0.14]], materials.paintedMetal(0xc9ced4), 24);
  drum.rotation.z = Math.PI / 2;
  drum.position.set(0.08, H * 0.62, 0);
  g.add(drum);

  // equipment cabinet at the base (the base-station radio / BBU)
  const cab = beveledBox(0.36, 0.5, 0.28, materials.paintedMetal(0x3a4048), 0.02);
  cab.position.set(0.36, 0.25, 0.2);
  g.add(cab);
  for (let i = 0; i < 4; i++) {
    const vent = box(0.28, 0.015, 0.005, materials.glow(0x3aa0d0, 0.7));
    vent.position.set(0.36, 0.12 + i * 0.09, 0.34);
    g.add(vent);
  }

  return {
    group: g,
    height: H,
    // an antenna reference point facing +X and -X (both sectors), plus the base
    antWorld(x, sign) { return [x + sign * 0.34, headY + 0.05, 0]; },
    baseWorld(x) { return [x + 0.36, 0.42, 0.2]; },
    headY,
  };
}

// ---------------------------------------------------------------------------
// The mobile core network — a low data-hall on a plinth: a cluster of server
// racks with glowing status strips, plus three floating node markers (IMS,
// HSS, packet core) that the call passes through.
// ---------------------------------------------------------------------------
function buildCore() {
  const g = new THREE.Group();
  const base = beveledBox(2.0, 0.1, 1.3, materials.paintedMetal(0x24262b), 0.03);
  base.position.y = 0.05;
  g.add(base);
  const hall = beveledBox(1.8, 0.7, 1.1, materials.paintedMetal(0x2b3038), 0.03);
  hall.position.y = 0.45;
  g.add(hall);

  // rack faces on the front (+Z) with glowing LED columns
  const rackColors = [0x2fb0e0, 0x39c07a, 0x2fb0e0, 0xe0b34a, 0x39c07a];
  for (let r = 0; r < 5; r++) {
    const rack = beveledBox(0.28, 0.56, 0.04, materials.paintedMetal(0x14161a), 0.01);
    const rx = -0.72 + r * 0.36;
    rack.position.set(rx, 0.45, 0.56);
    g.add(rack);
    for (let k = 0; k < 6; k++) {
      const led = box(0.2, 0.02, 0.01, materials.glow(rackColors[r], 0.9));
      led.position.set(rx, 0.25 + k * 0.08, 0.585);
      g.add(led);
    }
  }

  // rooftop node markers (labels attach here)
  const nodeY = 0.9;
  const imsPt = [-0.55, nodeY, 0];
  const corePt = [0, nodeY, 0];
  const hssPt = [0.55, nodeY, 0];
  [[imsPt, 0x6ec8ff], [corePt, 0x8fe6ff], [hssPt, 0xffb066]].forEach(([p, c]) => {
    const node = new THREE.Mesh(new THREE.OctahedronGeometry(0.07), materials.glow(c, 1.2));
    node.position.set(...p);
    g.add(node);
    const stalk = rod(0.006, nodeY - 0.8, materials.chrome(0x9aa0a8), 8);
    stalk.position.set(p[0], 0.8, p[2]);
    g.add(stalk);
  });

  return {
    group: g,
    inWorld(sign) { return [sign * 0.9, 0.55, 0.3]; },
    imsPt, corePt, hssPt, nodeY,
  };
}

// ===========================================================================
export function buildPhoneCall({ scene }) {
  const group = new THREE.Group();
  scene.add(group);

  // GROUND — one long neutral studio plinth
  const ground = beveledBox(GROUND_W, 0.16, 2.6, new THREE.MeshStandardMaterial({ color: 0x1c1e22, roughness: 0.9 }), 0.03);
  ground.position.set(GROUND_CX, -0.08, 0);
  group.add(ground);
  const groundAccent = box(GROUND_W - 0.1, 0.005, 0.02, materials.glow(0x2c3440, 0.4));
  groundAccent.position.set(GROUND_CX, 0.003, 0);
  group.add(groundAccent);

  // --- PHONES ---------------------------------------------------------------
  const phoneA = buildPhone(0x123b2e);
  phoneA.group.position.set(PHONE_A_X, 0, 0);
  group.add(phoneA.group);
  phoneA.setReveal(0);

  const phoneB = buildPhone(0x3a2410);
  phoneB.group.position.set(PHONE_B_X, 0, 0);
  phoneB.group.rotation.y = Math.PI; // faces the network on its -X side
  group.add(phoneB.group);
  phoneB.setReveal(0);

  // phone A antenna faces +X (toward tower A on its right); rotation.y=0
  const antAWorld = [PHONE_A_X + phoneA.antTipLocal[0], phoneA.antTipLocal[1], phoneA.antTipLocal[2]];
  const spkAWorld = [PHONE_A_X + phoneA.spkPt[0], phoneA.spkPt[1], phoneA.spkPt[2]];
  // phone B rotated PI about Y: local (x,y,z) -> world (ox - x, y, -z)
  const antBWorld = [PHONE_B_X - phoneB.antTipLocal[0], phoneB.antTipLocal[1], -phoneB.antTipLocal[2]];
  const spkBWorld = [PHONE_B_X - phoneB.spkPt[0], phoneB.spkPt[1], -phoneB.spkPt[2]];

  // --- TOWERS ---------------------------------------------------------------
  const towerA = buildTower();
  towerA.group.position.set(TOWER_A_X, 0, 0);
  group.add(towerA.group);
  const towerB = buildTower();
  towerB.group.position.set(TOWER_B_X, 0, 0);
  group.add(towerB.group);

  const towerA_toA = towerA.antWorld(TOWER_A_X, -1); // faces phone A
  const towerA_toCore = towerA.antWorld(TOWER_A_X, 1);
  const towerA_base = towerA.baseWorld(TOWER_A_X);
  const towerB_toB = towerB.antWorld(TOWER_B_X, 1); // faces phone B
  const towerB_toCore = towerB.antWorld(TOWER_B_X, -1);
  const towerB_base = towerB.baseWorld(TOWER_B_X);

  // --- CORE -----------------------------------------------------------------
  const core = buildCore();
  core.group.position.set(CORE_X, 0, 0);
  group.add(core.group);
  const coreInA = [CORE_X + core.inWorld(-1)[0], core.inWorld(-1)[1], core.inWorld(-1)[2]];
  const coreInB = [CORE_X + core.inWorld(1)[0], core.inWorld(1)[1], core.inWorld(1)[2]];
  const imsWorld = [CORE_X + core.imsPt[0], core.imsPt[1], core.imsPt[2]];
  const hssWorld = [CORE_X + core.hssPt[0], core.hssPt[1], core.hssPt[2]];

  // ==========================================================================
  // STREAMS — the packets crossing every leg. Uplink (blue) A->B and downlink
  // (warm) B->A, both live at once. Radio hops draw no wire (wireless); tower
  // and backhaul legs draw their physical link.
  // ==========================================================================
  const streams = [];
  function stream(paths, opts) { const s = buildStream(paths, opts); group.add(s.group); streams.push(s); return s; }

  // radio hop phone A <-> tower A (arched, wireless)
  const rfUpA = stream([[antAWorld, towerA_toA]], { color: UP_COLOR, count: 4, size: 0.03, speedMul: 3, wire: false, arcRise: 0.5 });
  const rfDownA = stream([[towerA_toA, spkAWorld]], { color: DOWN_COLOR, count: 4, size: 0.03, speedMul: 3, wire: false, arcRise: 0.62 });

  // backhaul tower A <-> core (fibre near the ground)
  const bhUpA = stream([[towerA_base, [TOWER_A_X + 0.9, 0.14, 0.35], [CORE_X - 1.2, 0.14, 0.35], coreInA]], { color: UP_COLOR, count: 6, size: 0.024, speedMul: 4, radius: 0.014 });
  const bhDownA = stream([[coreInA, [CORE_X - 1.2, 0.1, 0.5], [TOWER_A_X + 0.9, 0.1, 0.5], towerA_base]], { color: DOWN_COLOR, count: 6, size: 0.024, speedMul: 4, radius: 0.014 });

  // through the core (in A side <-> in B side, up over the node markers)
  const coreUp = stream([[coreInA, [CORE_X - 0.3, 0.75, 0.2], [CORE_X + 0.3, 0.75, 0.2], coreInB]], { color: UP_COLOR, count: 5, size: 0.024, speedMul: 3, radius: 0.012 });
  const coreDown = stream([[coreInB, [CORE_X + 0.3, 0.62, 0.4], [CORE_X - 0.3, 0.62, 0.4], coreInA]], { color: DOWN_COLOR, count: 5, size: 0.024, speedMul: 3, radius: 0.012 });

  // backhaul core <-> tower B
  const bhUpB = stream([[coreInB, [CORE_X + 1.2, 0.14, 0.35], [TOWER_B_X - 0.9, 0.14, 0.35], towerB_base]], { color: UP_COLOR, count: 6, size: 0.024, speedMul: 4, radius: 0.014 });
  const bhDownB = stream([[towerB_base, [TOWER_B_X - 0.9, 0.1, 0.5], [CORE_X + 1.2, 0.1, 0.5], coreInB]], { color: DOWN_COLOR, count: 6, size: 0.024, speedMul: 4, radius: 0.014 });

  // radio hop tower B <-> phone B
  const rfUpB = stream([[towerB_toB, spkBWorld]], { color: UP_COLOR, count: 4, size: 0.03, speedMul: 3, wire: false, arcRise: 0.62 });
  const rfDownB = stream([[antBWorld, towerB_toB]], { color: DOWN_COLOR, count: 4, size: 0.03, speedMul: 3, wire: false, arcRise: 0.5 });

  // internal on-board signal (mic -> antenna) for whichever phone is revealed
  const innerA = buildStream([[phoneA.micPt, phoneA.adcPt, phoneA.codecPt, phoneA.modemPt, phoneA.rfPt, phoneA.antTipLocal]], { color: SIG_COLOR, count: 5, size: 0.02, speedMul: 2, wire: false });
  phoneA.group.add(innerA.group);
  // phone B's internal downlink chain (antenna -> decode chips -> speaker),
  // reversed direction, warm colour. Parented to the flipped phone group so its
  // dots ride the chip side that the step-7 camera looks at.
  const innerB = buildStream([[phoneB.antTipLocal, phoneB.rfPt, phoneB.modemPt, phoneB.codecPt, phoneB.adcPt, phoneB.spkPt]], { color: DOWN_COLOR, count: 5, size: 0.02, speedMul: 2, wire: false });
  phoneB.group.add(innerB.group);

  // radio wavefront bursts at the four antennas
  const burstA = buildRadioBurst(antAWorld, [1, 0.4, 0], { color: UP_COLOR, maxR: 1.0 });
  group.add(burstA.group);
  const burstTA = buildRadioBurst(towerA_toA, [-1, -0.2, 0], { color: DOWN_COLOR, maxR: 1.0 });
  group.add(burstTA.group);
  const burstTB = buildRadioBurst(towerB_toB, [1, -0.2, 0], { color: UP_COLOR, maxR: 1.0 });
  group.add(burstTB.group);
  const burstB = buildRadioBurst(antBWorld, [-1, 0.4, 0], { color: DOWN_COLOR, maxR: 1.0 });
  group.add(burstB.group);

  // ==========================================================================
  // CALLOUTS
  // ==========================================================================
  const calloutGroups = { overview: [], mic: [], digitize: [], rf: [], uplink: [], core: [], downlink: [] };
  function tag(which, parent, text, pos, dir, len = 80) {
    const c = callout(text, { dir, len });
    c.position.set(...pos);
    c.visible = false;
    parent.add(c);
    calloutGroups[which].push(c);
    return c;
  }

  tag('overview', phoneA.group, 'Your phone', [0, 1.25, 0.3], 90, 60);
  tag('overview', towerA.group, 'Cell tower (base station)', [0, 2.7, 0], 90, 80);
  tag('overview', core.group, 'Mobile core network', [0, 1.15, 0.3], 90, 80);
  tag('overview', towerB.group, 'Their tower', [0, 2.7, 0], 90, 60);
  tag('overview', phoneB.group, 'Their phone', [0, 1.25, -0.3], 90, 60);

  tag('mic', phoneA.group, 'Microphone: air pressure to a wiggling voltage', phoneA.micPt, -40, 150);
  tag('mic', phoneA.group, 'Sound waves in', [-0.1, 0.2, 0.3], 140, 90);

  tag('digitize', phoneA.group, 'ADC samples the voltage 16,000×/sec', phoneA.adcPt, 30, 140);
  tag('digitize', phoneA.group, 'EVS codec compresses 20 ms frames', phoneA.codecPt, -35, 140);

  tag('rf', phoneA.group, 'Modem: packetize, error-code, encrypt', phoneA.modemPt, 30, 150);
  tag('rf', phoneA.group, 'RF + PA modulate onto the carrier', phoneA.rfPt, -35, 140);
  tag('rf', phoneA.group, 'Antenna radiates the radio wave', phoneA.antTipLocal, 40, 110);

  tag('uplink', towerA.group, 'Uplink radio (SC-FDMA, e.g. ~1.9 GHz)', [towerA_toA[0] - TOWER_A_X, towerA_toA[1], 0], 130, 130);
  tag('uplink', towerA.group, 'eNodeB / gNB base station', [0, 2.35, 0], 90, 90);
  tag('uplink', towerA.group, 'Backhaul: fibre or microwave to the core', towerA.baseWorld(TOWER_A_X).map((v, i) => (i === 0 ? v - TOWER_A_X : v)), -30, 150);

  tag('core', core.group, 'IMS: SIP sets up the session', core.imsPt, 120, 110);
  tag('core', core.group, 'Packet core routes the media (RTP)', core.corePt, 90, 120);
  tag('core', core.group, 'HSS locates the recipient', core.hssPt, 40, 100);

  tag('downlink', phoneB.group, 'Downlink radio (OFDMA, higher freq)', phoneB.antTipLocal, 40, 130);
  tag('downlink', phoneB.group, 'Demodulate, decrypt, decode, DAC', phoneB.codecPt, -35, 150);
  tag('downlink', phoneB.group, 'Speaker pushes air to their ear', phoneB.spkPt, 150, 120);

  // ==========================================================================
  // pose / state
  // ==========================================================================
  const state = { phase: 0, revealA: 0, revealB: 0, waves: 1, uplinkAmt: 1, downlinkAmt: 1, innerAmt: 0, innerBAmt: 0 };

  function apply() {
    const ph = state.phase;
    const up = state.uplinkAmt;
    const dn = state.downlinkAmt;
    rfUpA.update(ph, up); bhUpA.update(ph, up); coreUp.update(ph, up); bhUpB.update(ph, up); rfUpB.update(ph, up);
    rfDownA.update(ph, dn); bhDownA.update(ph, dn); coreDown.update(ph, dn); bhDownB.update(ph, dn); rfDownB.update(ph, dn);
    innerA.update(ph, state.innerAmt);
    innerB.update(ph, state.innerBAmt);
    const w = state.waves;
    burstA.update(ph, w * up); burstTA.update(ph, w * dn); burstTB.update(ph, w * up); burstB.update(ph, w * dn);
    phoneA.setReveal(state.revealA);
    phoneB.setReveal(state.revealB);
  }
  apply();

  return {
    group,
    set(partial) { Object.assign(state, partial); apply(); },
    setLabels(which, v = true) {
      for (const [name, list] of Object.entries(calloutGroups)) {
        const show = v && name === which;
        for (const c of list) c.visible = show;
      }
    },
    // world anchors for camera aiming
    anchors: {
      phoneA: PHONE_A_X, towerA: TOWER_A_X, core: CORE_X, towerB: TOWER_B_X, phoneB: PHONE_B_X,
    },
  };
}
