import * as THREE from 'three';
import { materials, rod, disc, box, label } from '../../framework/parts.js';
import { beveledBox, radialLoft } from '../../framework/geometry.js';
import { callout } from '../../framework/labels.js';

// An NPN bipolar junction transistor in a TO-92 package, product-shot staged
// on a charcoal plinth — plus a "die" cutaway (the real, true-proportioned
// silicon internals) and an enlarged idealized "schematic" block used to
// visualize the invisible physics (biasing, carrier injection, gain,
// switching, amplification).
//
// Reference facts (validated against Wikipedia's Bipolar junction transistor
// article):
//  - Three regions, three terminals: heavily-doped N emitter, a very THIN
//    and LIGHTLY doped P base sandwiched under it, and a wider, moderately
//    doped N collector underneath that. The base is thin/light on purpose:
//    thin so injected electrons diffuse across it before they can recombine,
//    lightly doped so there are few holes available to recombine them with.
//  - Forward-biasing the base-emitter junction collapses its depletion zone
//    and injects a flood of electrons from the emitter into the base, where
//    they are now minority carriers. Most diffuse straight across the thin
//    base before recombining; the reverse-biased base-collector junction's
//    field then sweeps them into the collector. Only a small fraction
//    recombine in the base — that recombination current IS the base current.
//  - Current gain: Ic = beta * Ib (beta, common-emitter current gain,
//    typically 50-a few hundred for small-signal parts). Because almost
//    every injected electron crosses, a tiny base current sets a much larger
//    collector current.
//  - Switch: base below the turn-on threshold (~0.6 V) -> cutoff, no
//    collector current (open switch). Base pushed on -> saturation, current
//    flows collector-to-emitter almost unrestricted (closed switch) — the
//    basis of every logic gate.
//  - Amplifier: biased in between, in the "active" region, collector current
//    tracks base current smoothly (not snapping between states) scaled by
//    beta — a small wiggle in becomes a big wiggle out.
//  - Electrons (the carriers we animate) physically flow emitter -> base ->
//    collector; conventional current direction is the reverse of that.
//  - Package: TO-92 — black epoxy, roughly a half-cylinder with one flat
//    face and a rounded back/top, three legs (Emitter / Base / Collector)
//    exiting the bottom in a row and splaying out.

const DISC_TOP = 0.12;
const LEG_LEN = 0.42;
const PKG_R = 0.22;
const PKG_STRAIGHT_H = 0.46;
const PKG_DOME_H = 0.22;
const PKG_BOTTOM_Y = DISC_TOP + LEG_LEN;
const PKG_TOP_Y = PKG_BOTTOM_Y + PKG_STRAIGHT_H + PKG_DOME_H;
const CENTER_Y = PKG_BOTTOM_Y + (PKG_STRAIGHT_H + PKG_DOME_H) / 2;

const N_COLOR = 0x3d6bff; // heavily-doped N emitter — deep, saturated blue
const N_LIGHT_COLOR = 0x8fb0ff; // moderately-doped N collector — paler blue, bigger volume
const P_COLOR = 0xff6f91; // thin P base — warm pink, reads instantly against the blues
const ELECTRON_COLOR = 0x8fd3ff;
const BASE_CURRENT_COLOR = 0xffab5e;

// D-shaped ring (flat chord z=0 closing the loop, rounded bulge toward -z so
// the flat face's outward normal points toward +z / the default camera) —
// exactly a TO-92 cross-section. Feeds radialLoft() for the epoxy body.
function dShapeRing(r, segments = 20) {
  const pts = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / (segments - 1)) * Math.PI;
    pts.push([Math.cos(a) * r, -Math.sin(a) * r]);
  }
  return pts;
}

function buildPackageBody(material) {
  const levels = [];
  levels.push({ y: PKG_BOTTOM_Y, points: dShapeRing(PKG_R) });
  levels.push({ y: PKG_BOTTOM_Y + PKG_STRAIGHT_H, points: dShapeRing(PKG_R) });
  const domeSteps = 12;
  for (let i = 1; i <= domeSteps; i++) {
    const t = i / domeSteps;
    const theta = (t * Math.PI) / 2;
    // true hemisphere parametrization (both radius and height ease with the
    // same angle) — easing height linearly while radius eased with cosine
    // made the tip converge like a cone instead of a blunt dome.
    const r = Math.max(PKG_R * Math.cos(theta), 0.002);
    const y = PKG_BOTTOM_Y + PKG_STRAIGHT_H + PKG_DOME_H * Math.sin(theta);
    levels.push({ y, points: dShapeRing(r) });
  }
  return radialLoft(levels, material, { capBottom: true, capTop: false });
}

// A single splayed leg: near-vertical at the package, curving outward to the
// plinth. x0 < 0 = emitter (left), 0 = base (center), > 0 = collector (right).
function buildLeg(x0, material) {
  const pts = [
    [x0, PKG_BOTTOM_Y, 0],
    [x0 * 1.9, PKG_BOTTOM_Y - LEG_LEN * 0.45, 0.05],
    [x0 * 2.7, DISC_TOP + 0.04, 0.055],
    [x0 * 2.7, DISC_TOP, 0.055],
  ];
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.019, 10, false), material);
  mesh.castShadow = true;
  mesh.userData.curve = curve;
  return mesh;
}

// Chain several point-list curves into one 0..1 sampler + segment bounds —
// same small helper pattern used by the resistor/capacitor builds.
function chainSegments(segments) {
  const curves = segments.map((pts) =>
    pts.length === 2
      ? new THREE.LineCurve3(new THREE.Vector3(...pts[0]), new THREE.Vector3(...pts[1]))
      : new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))),
  );
  const lengths = curves.map((c) => c.getLength());
  const total = lengths.reduce((a, b) => a + b, 0) || 1;
  const bounds = [];
  let acc = 0;
  for (const L of lengths) {
    acc += L;
    bounds.push(acc / total);
  }
  function locate(t) {
    t = ((t % 1) + 1) % 1;
    let i = 0;
    while (i < bounds.length - 1 && t > bounds[i]) i++;
    const t0 = i === 0 ? 0 : bounds[i - 1];
    const lt = (t - t0) / (bounds[i] - t0 || 1);
    return [i, Math.min(1, Math.max(0, lt))];
  }
  return {
    bounds,
    getPointAt(t) {
      const [i, lt] = locate(t);
      return curves[i].getPointAt(lt);
    },
  };
}

function buildFlowDots(count, color, size = 0.022) {
  const geo = new THREE.SphereGeometry(size, 10, 8);
  const dots = [];
  for (let i = 0; i < count; i++) {
    const mat = materials.glow(color, 1.4);
    mat.transparent = true;
    mat.opacity = 0;
    mat.depthWrite = false;
    const dot = new THREE.Mesh(geo, mat);
    dot.userData.seed = i / count;
    dots.push(dot);
  }
  return dots;
}

export function buildTransistor({ scene }) {
  const group = new THREE.Group();
  scene.add(group);

  // --- display plinth -------------------------------------------------------
  const baseDisc = disc(0.85, 0.14, materials.paintedMetal(0x24262b));
  baseDisc.position.y = 0.07;
  group.add(baseDisc);

  const legMat = materials.chrome(0xd2d7dd);

  // =========================================================================
  // SHARED — the three legs (present in both "assembled" and "die" views;
  // real leadframe fingers stay attached to the die once the epoxy is peeled)
  // =========================================================================
  const legsGroup = new THREE.Group();
  group.add(legsGroup);
  const legE = buildLeg(-0.1, legMat);
  const legB = buildLeg(0, legMat.clone());
  const legC = buildLeg(0.1, legMat.clone());
  legsGroup.add(legE, legB, legC);

  // =========================================================================
  // ASSEMBLED — black epoxy TO-92 body
  // =========================================================================
  const epoxyGroup = new THREE.Group();
  group.add(epoxyGroup);
  const epoxyMat = new THREE.MeshPhysicalMaterial({ color: 0x18181b, roughness: 0.55, metalness: 0.02, clearcoat: 0.25, clearcoatRoughness: 0.5 });
  const epoxyBody = buildPackageBody(epoxyMat);
  epoxyGroup.add(epoxyBody);
  // faint embossed part-family text on the flat face
  const faceCanvas = document.createElement('canvas');
  faceCanvas.width = 256;
  faceCanvas.height = 128;
  const fctx = faceCanvas.getContext('2d');
  fctx.fillStyle = '#18181b';
  fctx.fillRect(0, 0, 256, 128);
  fctx.fillStyle = '#3a3a40';
  fctx.font = '700 34px sans-serif';
  fctx.textAlign = 'center';
  fctx.fillText('NPN', 128, 58);
  fctx.font = '400 20px sans-serif';
  fctx.fillText('2N-series', 128, 88);
  const faceTex = new THREE.CanvasTexture(faceCanvas);
  faceTex.colorSpace = THREE.SRGBColorSpace;
  const facePlate = new THREE.Mesh(
    new THREE.PlaneGeometry(PKG_R * 1.3, PKG_R * 1.3 * 0.5),
    new THREE.MeshPhysicalMaterial({ map: faceTex, roughness: 0.6, metalness: 0 }),
  );
  facePlate.position.set(0, PKG_BOTTOM_Y + PKG_STRAIGHT_H * 0.62, 0.001);
  epoxyGroup.add(facePlate);

  // =========================================================================
  // DIE — peel the epoxy away: the real, true-proportion silicon internals.
  // Planar construction: a wide collector slab, a hair-thin base layer on
  // top of it, and a SMALL emitter region diffused into part of the base's
  // top surface (not a full-width layer) — the actual layout of a planar
  // epitaxial transistor, not just an idealised three-layer sandwich.
  // =========================================================================
  const dieGroup = new THREE.Group();
  dieGroup.position.set(0, CENTER_Y - 0.32, 0);
  group.add(dieGroup);

  const paddleMat = materials.chrome(0xb8bec5);
  const paddle = beveledBox(0.26, 0.02, 0.2, paddleMat, 0.006);
  paddle.position.y = 0.01;
  dieGroup.add(paddle);

  const collectorMat = new THREE.MeshPhysicalMaterial({ color: N_LIGHT_COLOR, roughness: 0.35, metalness: 0.1 });
  const collectorSlab = beveledBox(0.2, 0.05, 0.15, collectorMat, 0.006);
  collectorSlab.position.y = 0.02 + 0.025;
  dieGroup.add(collectorSlab);

  const baseMat = new THREE.MeshPhysicalMaterial({ color: P_COLOR, roughness: 0.4, metalness: 0.1 });
  const BASE_THICK = 0.012;
  const baseSlab = beveledBox(0.17, BASE_THICK, 0.13, baseMat, 0.003);
  baseSlab.position.y = collectorSlab.position.y + 0.025 + BASE_THICK / 2;
  dieGroup.add(baseSlab);

  const emitterMat = new THREE.MeshPhysicalMaterial({ color: N_COLOR, roughness: 0.3, metalness: 0.2 });
  const emitterBlock = beveledBox(0.06, 0.02, 0.05, emitterMat, 0.004);
  const emitterX = -0.04;
  emitterBlock.position.set(emitterX, baseSlab.position.y + BASE_THICK / 2 + 0.01, 0);
  dieGroup.add(emitterBlock);

  // base contact pad — a small exposed patch of the base surface beside the
  // emitter, where the base wire bond actually lands
  const baseContactMat = new THREE.MeshPhysicalMaterial({ color: 0xd8dde3, roughness: 0.3, metalness: 0.8 });
  const baseContact = disc(0.014, 0.004, baseContactMat, 16);
  const baseContactX = 0.05;
  baseContact.position.set(baseContactX, baseSlab.position.y + BASE_THICK / 2 + 0.002, 0);
  dieGroup.add(baseContact);

  // gold wire bonds: emitter pad -> emitter leg root, base contact -> base
  // leg root. Collector is contacted through the paddle to the collector leg.
  const goldMat = materials.chrome(0xd9b25a);
  goldMat.metalness = 1;
  goldMat.roughness = 0.3;
  function wireBond(fromPos, toLeg) {
    const to = new THREE.Vector3(toLeg, PKG_BOTTOM_Y, 0).sub(dieGroup.position);
    const mid = fromPos.clone().add(to).multiplyScalar(0.5).add(new THREE.Vector3(0, 0.09, 0));
    const curve = new THREE.CatmullRomCurve3([fromPos, mid, to]);
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.0035, 8, false), goldMat);
    mesh.castShadow = true;
    dieGroup.add(mesh);
    return curve;
  }
  wireBond(emitterBlock.position.clone().add(new THREE.Vector3(0, 0.01, 0)), -0.1);
  wireBond(baseContact.position.clone().add(new THREE.Vector3(0, 0.002, 0)), 0);
  wireBond(new THREE.Vector3(0.08, 0.02, 0), 0.1);

  // a faint stream of electrons crossing emitter -> base -> collector at
  // true die scale, just enough to feel "live" without competing with the
  // enlarged schematic's clearer version of the same idea
  const dieChain = chainSegments([
    [
      [emitterX, emitterBlock.position.y, 0],
      [emitterX, baseSlab.position.y, 0],
    ],
    [
      [emitterX, baseSlab.position.y, 0],
      [0.06, collectorSlab.position.y + 0.02, 0],
    ],
  ]);
  const dieDots = buildFlowDots(10, ELECTRON_COLOR, 0.008);
  dieDots.forEach((d) => dieGroup.add(d));

  // =========================================================================
  // SCHEMATIC — enlarged idealised N-P-N block for teaching the physics:
  // biasing, injection/diffusion, current gain, switching, amplification.
  // =========================================================================
  const schematic = new THREE.Group();
  schematic.position.set(0, CENTER_Y, 0);
  group.add(schematic);

  const EW = 0.5;
  const BW = 0.15;
  const CW = 0.95;
  const H = 0.46;
  const D = 0.46;
  const xEmitterLeft = -1.02;
  const xBaseLeft = xEmitterLeft + EW;
  const xCollectorLeft = xBaseLeft + BW;
  const emitterCx = xEmitterLeft + EW / 2;
  const baseCx = xBaseLeft + BW / 2;
  const collectorCx = xCollectorLeft + CW / 2;

  const schEmitterMat = new THREE.MeshPhysicalMaterial({ color: N_COLOR, roughness: 0.32, metalness: 0.15 });
  const schBaseMat = new THREE.MeshPhysicalMaterial({ color: P_COLOR, roughness: 0.4, metalness: 0.1 });
  const schCollectorMat = new THREE.MeshPhysicalMaterial({ color: N_LIGHT_COLOR, roughness: 0.32, metalness: 0.15 });
  const schEmitter = beveledBox(EW, H, D, schEmitterMat, 0.02);
  schEmitter.position.set(emitterCx, 0, 0);
  const schBase = beveledBox(BW, H * 0.94, D, schBaseMat, 0.012);
  schBase.position.set(baseCx, 0, 0);
  const schCollector = beveledBox(CW, H, D, schCollectorMat, 0.02);
  schCollector.position.set(collectorCx, 0, 0);
  schematic.add(schEmitter, schBase, schCollector);

  // depletion "zones": translucent bands at each junction, width/opacity
  // driven by bias state (forward BE = thin, reverse BC = wide)
  const depletionMatBE = new THREE.MeshPhysicalMaterial({
    color: 0xdfeeff, transparent: true, opacity: 0.3, roughness: 0.2, metalness: 0, side: THREE.DoubleSide, depthWrite: false,
  });
  const depletionMatBC = new THREE.MeshPhysicalMaterial({
    color: 0x8fc4ff, transparent: true, opacity: 0.35, roughness: 0.2, metalness: 0, side: THREE.DoubleSide, depthWrite: false,
  });
  const depletionBE = new THREE.Mesh(new THREE.BoxGeometry(0.02, H * 0.99, D * 0.99), depletionMatBE);
  depletionBE.position.set(xBaseLeft, 0, 0);
  const depletionBC = new THREE.Mesh(new THREE.BoxGeometry(0.02, H * 0.99, D * 0.99), depletionMatBC);
  depletionBC.position.set(xCollectorLeft, 0, 0);
  schematic.add(depletionBE, depletionBC);

  // terminal leads + pads — thin tubes with raised roughness so the direct
  // key light spreads into a soft highlight instead of clipping to pure white
  const schLeadMat = materials.chrome(0xd6dae0);
  schLeadMat.roughness = 0.32;
  function schLead(x0, x1, y = 0, z = 0) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x0, y, z),
      new THREE.Vector3((x0 + x1) / 2, y, z),
      new THREE.Vector3(x1, y, z),
    ]);
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.018, 10, false), schLeadMat.clone());
    schematic.add(mesh);
    return curve;
  }
  const eLeadCurve = schLead(emitterCx - EW / 2, emitterCx - EW / 2 - 0.35);
  const cLeadCurve = schLead(collectorCx + CW / 2, collectorCx + CW / 2 + 0.35);
  const bLeadA = new THREE.Vector3(baseCx, -H / 2, 0);
  const bLeadB = new THREE.Vector3(baseCx, -H / 2 - 0.4, 0);
  const bLeadCurve = new THREE.CatmullRomCurve3([bLeadA, bLeadA.clone().lerp(bLeadB, 0.5), bLeadB]);
  const bLeadMesh = new THREE.Mesh(new THREE.TubeGeometry(bLeadCurve, 16, 0.012, 10, false), schLeadMat.clone());
  schematic.add(bLeadMesh);

  // terminal end caps, colour-coded to the bias polarity that will drive them
  const capE = new THREE.Mesh(new THREE.SphereGeometry(0.03, 14, 10), materials.glow(0x6ea8ff, 0.4));
  capE.position.copy(eLeadCurve.getPointAt(1));
  const capC = new THREE.Mesh(new THREE.SphereGeometry(0.03, 14, 10), materials.glow(0xff6a4a, 0.4));
  capC.position.copy(cLeadCurve.getPointAt(1));
  const capB = new THREE.Mesh(new THREE.SphereGeometry(0.024, 14, 10), materials.glow(0xffab5e, 0.4));
  capB.position.copy(bLeadB);
  schematic.add(capE, capC, capB);

  // main carrier chain: emitter terminal -> through emitter block -> across
  // the thin base -> through collector block -> collector terminal
  const midY = 0.02;
  const mainChain = chainSegments([
    [eLeadCurve.getPointAt(0).toArray(), eLeadCurve.getPointAt(1).toArray()].reverse(),
    [
      [emitterCx - EW / 2 + 0.02, midY, 0],
      [emitterCx + EW / 2 - 0.02, midY, 0],
    ],
    [
      [baseCx - BW / 2, midY, 0],
      [baseCx + BW / 2, midY, 0],
    ],
    [
      [collectorCx - CW / 2 + 0.02, midY, 0],
      [collectorCx + CW / 2 - 0.02, midY, 0],
    ],
    [cLeadCurve.getPointAt(0).toArray(), cLeadCurve.getPointAt(1).toArray()],
  ]);
  const mainDots = buildFlowDots(28, ELECTRON_COLOR, 0.018);
  mainDots.forEach((d) => schematic.add(d));

  // base (recombination) current: a small trickle branching off mid-base
  // down the base lead to its terminal
  const baseChain = chainSegments([
    [
      [baseCx, midY, 0],
      [baseCx, -H / 2, 0],
    ],
    [bLeadA.toArray(), bLeadB.toArray()],
  ]);
  const baseDots = buildFlowDots(6, BASE_CURRENT_COLOR, 0.016);
  baseDots.forEach((d) => schematic.add(d));

  // small "LED" prop for the switch step: lights up when the collector is on
  const ledMat = materials.glow(0xffcf6a, 0);
  ledMat.transparent = true;
  ledMat.opacity = 0.5;
  const ledBulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), ledMat);
  ledBulb.position.copy(cLeadCurve.getPointAt(1)).add(new THREE.Vector3(0.1, 0.04, 0));
  const ledLight = new THREE.PointLight(0xffcf6a, 0, 1.6);
  ledLight.position.copy(ledBulb.position);
  const ledWire = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([cLeadCurve.getPointAt(1), ledBulb.position.clone()]),
      8,
      0.008,
      8,
    ),
    materials.darkMetal(0x2a2d33),
  );
  schematic.add(ledBulb, ledLight, ledWire);

  // gain readout label
  const gainLabel = label('Ic = β · Ib', { color: '#f2eefc', size: 0.16 });
  gainLabel.position.set(collectorCx - 0.1, H / 2 + 0.16, 0);
  gainLabel.material.opacity = 0;
  schematic.add(gainLabel);

  // --- callouts ----------------------------------------------------------
  // Grouped per-step (not one giant list) so each mechanism step shows only
  // the labels relevant to IT — otherwise biasing/injection/gain captions
  // pile up on top of each other in the same schematic camera framing.
  const calloutsPackage = [];
  const calloutsDie = [];
  const calloutsBias = [];
  const calloutsInjection = [];
  const calloutsGain = [];
  function tag(list, parent, text, pos, dir, len = 60) {
    const c = callout(text, { dir, len });
    c.position.set(...pos);
    c.visible = false;
    parent.add(c);
    list.push(c);
    return c;
  }
  tag(calloutsPackage, epoxyBody, 'Black epoxy package (TO-92)', [PKG_R * 0.5, PKG_STRAIGHT_H + PKG_DOME_H * 0.6, -PKG_R * 0.4], 60, 78);
  tag(calloutsPackage, legE, 'Emitter lead', [0, -0.05, 0.02], -140, 70);
  tag(calloutsPackage, legB, 'Base lead', [0, -0.18, 0.04], -90, 60);
  tag(calloutsPackage, legC, 'Collector lead', [0, -0.05, 0.02], -40, 70);

  tag(calloutsDie, collectorSlab, 'Collector (N, wide, moderate doping)', [0.09, 0.02, 0.08], -35, 96);
  tag(calloutsDie, emitterBlock, 'Emitter (N+, heavily doped)', [0, 0.02, 0], 70, 70);
  tag(calloutsDie, baseContact, 'Base — a hair-thin P layer', [0, 0.03, 0], 55, 92);
  tag(calloutsDie, dieGroup, 'Gold wire bonds', [0.1, 0.08, 0.06], 30, 70);

  tag(calloutsBias, depletionBE, 'Base-emitter: forward biased (thin barrier)', [0, H * 0.42, 0.1], 60, 90);
  tag(calloutsBias, depletionBC, 'Base-collector: reverse biased (wide barrier)', [0, H * 0.3, -0.1], 40, 130);

  tag(calloutsInjection, schEmitter, 'Emitter injects electrons', [-0.15, -H * 0.3, 0.15], -110, 90);
  tag(calloutsInjection, schBase, 'Thin base: most carriers cross', [0, H * 0.5, 0], 90, 70);
  tag(calloutsInjection, schCollector, 'Swept into the collector', [0.2, -H * 0.25, 0.15], -60, 90);

  tag(calloutsGain, capB, 'Ib — the small controlling trickle', [0, -0.08, 0], -100, 100);
  tag(calloutsGain, capC, 'Ic — the large controlled current', [0.05, 0.05, 0], 40, 100);

  // =========================================================================
  // pose / state
  // =========================================================================
  const state = {
    view: 'assembled',
    bias: 0, // 0 = cutoff/unbiased, 1 = forward-active
    colFlow: 0,
    baseFlow: 0,
    dieFlow: 0,
    sigMod: 1, // instantaneous signal multiplier for the amplifier step
    showGain: false,
  };

  function styleFlowDot(dot, chain, t, colorBase, colorHot, brightness) {
    const p = chain.getPointAt(t);
    dot.position.copy(p);
    dot.material.color.copy(colorBase);
    dot.material.emissive.copy(colorHot);
    dot.material.opacity = brightness;
  }

  const COOL = new THREE.Color(ELECTRON_COLOR);
  const HOT = new THREE.Color(0xffffff);
  const BASE_COOL = new THREE.Color(BASE_CURRENT_COLOR);

  function apply() {
    epoxyGroup.visible = state.view === 'assembled';
    legsGroup.visible = state.view === 'assembled' || state.view === 'die';
    dieGroup.visible = state.view === 'die';
    schematic.visible = state.view === 'schematic';

    // gating factor: how "on" the transistor is, given the base bias —
    // a smooth threshold near the real ~0.6V turn-on point (bias is 0..1)
    const onFactor = THREE.MathUtils.smoothstep(state.bias, 0.32, 0.55);

    // depletion zones: BE narrows as bias rises (forward bias), BC widens
    // slightly (reverse bias strengthens the field)
    const beW = THREE.MathUtils.lerp(0.085, 0.018, state.bias);
    const bcW = THREE.MathUtils.lerp(0.075, 0.15, state.bias);
    depletionBE.scale.x = beW / 0.02;
    depletionBC.scale.x = bcW / 0.02;
    depletionMatBE.opacity = THREE.MathUtils.lerp(0.4, 0.15, state.bias);
    depletionMatBC.opacity = THREE.MathUtils.lerp(0.2, 0.5, state.bias);
    capE.material.emissiveIntensity = 0.3 + state.bias * 1.2;
    capC.material.emissiveIntensity = 0.3 + onFactor * 1.4;
    capB.material.emissiveIntensity = 0.3 + state.bias * 0.9;

    // main collector-current stream, gated by onFactor and modulated by sigMod
    mainDots.forEach((dot) => {
      const t = (dot.userData.seed + state.colFlow) % 1;
      const brightness = onFactor * (0.35 + 0.65 * state.sigMod);
      styleFlowDot(dot, mainChain, t, COOL, HOT, Math.max(0, brightness));
    });

    // base recombination trickle — small, present whenever biased at all
    baseDots.forEach((dot) => {
      const t = (dot.userData.seed + state.baseFlow) % 1;
      const brightness = THREE.MathUtils.lerp(0.05, 0.85, state.bias);
      styleFlowDot(dot, baseChain, t, BASE_COOL, BASE_COOL, brightness);
    });

    // die-scale ambient stream (only meaningful in the die view)
    dieDots.forEach((dot) => {
      const t = (dot.userData.seed + state.dieFlow) % 1;
      const p = dieChain.getPointAt(t);
      dot.position.copy(p);
      dot.material.opacity = 0.55;
    });

    // LED payoff for the switch step
    ledMat.emissiveIntensity = 0.1 + onFactor * 3.2;
    ledMat.opacity = 0.35 + onFactor * 0.6;
    ledLight.intensity = onFactor * 1.4;

    gainLabel.material.opacity = state.showGain ? 1 : 0;
  }
  apply();

  const labelGroups = {
    package: calloutsPackage,
    die: calloutsDie,
    bias: calloutsBias,
    injection: calloutsInjection,
    gain: calloutsGain,
  };

  return {
    group,
    // v truthy shows exactly that named group and hides all others; v falsy
    // hides everything. Keeps each mechanism step's captions from piling up
    // on top of the next step's in the same schematic camera framing.
    setLabels(which, v = true) {
      for (const [name, list] of Object.entries(labelGroups)) {
        const show = v && name === which;
        for (const c of list) c.visible = show;
      }
      if (which === 'gain') {
        state.showGain = v;
        apply();
      }
    },
    setView(v) {
      state.view = v;
      apply();
    },
    set(partial) {
      Object.assign(state, partial);
      apply();
    },
  };
}
