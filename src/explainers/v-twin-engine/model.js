import * as THREE from 'three';
import { materials, rod, box, disc } from '../../framework/parts.js';
import { beveledBox, lathe, finStack, tubeAlong, boltCircle } from '../../framework/geometry.js';
import { callout } from '../../framework/labels.js';

// A 90° V-twin: two air-cooled cylinders at ±45° from vertical, both
// connecting rods riding ONE shared crankpin. Crank axis along Z.
//
// Kinematics: for a bank leaning α from vertical, the effective crank angle
// is θe = θ − α and the piston sits at d(θe) along the bank axis — the same
// slider-crank as the four-stroke, evaluated per bank.
//
// Firing: cylinder A's 720° cycle is offset −45° from crank angle, B's −315°.
// That drops B's TDCs 270° of crank after A's, which is exactly what a shared
// pin at 90° enforces — and yields the famous 270°/450° offbeat firing.

const CRANK_Y = 1.0;
const R = 0.32; // crank radius
const L = 0.95; // con-rod length
const BORE_R = 0.34;
const PISTON_R = 0.3;
const HEAD_D = 1.55; // head face distance from crank center, along bank axis
const VALVE_LIFT = 0.12;
const BANK_DEG = 45; // each bank leans 45° → 90° included angle

const deg = (d) => (d * Math.PI) / 180;
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const mod720 = (c) => ((c % 720) + 720) % 720;

// piston pin distance from crank center along the bank axis
function pistonD(thetaE) {
  const s = R * Math.sin(thetaE);
  return R * Math.cos(thetaE) + Math.sqrt(L * L - s * s);
}

// half-sine valve lift inside a [start, end] window of the cylinder's own cycle
function lift(cyc, start, end) {
  if (cyc < start || cyc > end) return 0;
  return VALVE_LIFT * Math.sin(Math.PI * ((cyc - start) / (end - start)));
}

const chargeColors = {
  intake: new THREE.Color(0x5ec1ff),
  compressed: new THREE.Color(0x9fe0ff),
  burn: new THREE.Color(0xff8a3d),
  exhaust: new THREE.Color(0x8d939c),
};
const flash = new THREE.Color(0xffe6b0);

export function buildVTwin({ scene }) {
  const group = new THREE.Group();
  scene.add(group);

  const alum = materials.aluminum();
  const darkAlum = materials.aluminum(0x767d87);
  const chrome = materials.chrome();
  const brushed = materials.brushedSteel();
  const steel = materials.steel();
  const heatBlued = materials.heatBluedSteel();

  // --- base -----------------------------------------------------------------
  const base = beveledBox(4.6, 0.14, 2.6, materials.darkMetal(0x23272e), 0.03);
  base.position.y = 0.07;
  group.add(base);

  // --- crankcase (glass so the crank gear stays visible) + sump -------------
  const caseBox = beveledBox(1.6, 1.0, 0.9, materials.glass(0xaac6e8, 0.12), 0.05);
  caseBox.castShadow = false;
  caseBox.position.y = 0.85;
  const sump = beveledBox(1.8, 0.32, 1.0, materials.grimyAluminum(0x767d87), 0.05);
  sump.position.y = 0.32;
  group.add(caseBox, sump);

  // side cover: turned aluminum dome with a bolt ring
  const cover = lathe(
    [
      [0.0, 0.0],
      [0.46, 0.0],
      [0.44, 0.1],
      [0.3, 0.18],
      [0.0, 0.2],
    ],
    alum,
  );
  cover.rotation.x = -Math.PI / 2; // face −Z
  cover.position.set(0, CRANK_Y, -0.45);
  const coverBolts = boltCircle(8, 0.38, 0.028, steel, 0.035);
  coverBolts.rotation.x = -Math.PI / 2;
  coverBolts.position.set(0, CRANK_Y, -0.47);
  group.add(cover, coverBolts);

  // --- crankshaft: webs + counterweights + ONE shared pin --------------------
  const crank = new THREE.Group();
  crank.position.y = CRANK_Y;
  group.add(crank);

  const webGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.08, 36);
  webGeo.rotateX(Math.PI / 2);
  const counterweights = [];
  for (const z of [-0.2, 0.2]) {
    const web = new THREE.Mesh(webGeo, brushed);
    web.castShadow = true;
    web.position.z = z;
    crank.add(web);
    // counterweight lobe opposite the pin — the balance-step hero
    const cw = beveledBox(0.42, 0.24, 0.11, brushed, 0.03);
    cw.position.set(0, -0.32, z);
    counterweights.push(cw);
    crank.add(cw);
  }
  const pinGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.34, 20);
  pinGeo.rotateX(Math.PI / 2);
  const crankPin = new THREE.Mesh(pinGeo, chrome);
  crankPin.castShadow = true;
  crankPin.position.y = R;
  crank.add(crankPin);
  const shaftGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.7, 20);
  shaftGeo.rotateX(Math.PI / 2);
  crank.add(new THREE.Mesh(shaftGeo, steel));

  // flywheel with bolt ring, outside the case
  const flywheel = disc(0.52, 0.11, brushed);
  flywheel.rotation.x = Math.PI / 2;
  flywheel.position.z = 0.72;
  const flyBolts = boltCircle(6, 0.3, 0.032, steel, 0.04);
  flyBolts.rotation.x = Math.PI / 2;
  flyBolts.position.z = -0.075;
  flywheel.add(flyBolts);
  crank.add(flywheel);

  // --- one bank = liner + fins + head + valves + piston + rod + charge ------
  function buildBank(sign) {
    // sign +1 leans toward +X, −1 toward −X
    const bank = new THREE.Group();
    bank.position.y = CRANK_Y;
    bank.rotation.z = -sign * deg(BANK_DEG);
    group.add(bank);

    // glass liner: piston stays visible between the fin rings
    const liner = new THREE.Mesh(
      new THREE.CylinderGeometry(BORE_R, BORE_R, 1.0, 40, 1, true),
      materials.glass(0xaac6e8, 0.14),
    );
    liner.position.y = HEAD_D - 0.5;
    bank.add(liner);

    // air-cooling fin rings, fattest at the hot head end
    const fins = finStack(
      { count: 9, size: 0.5, thickness: 0.022, gap: 0.062, shape: 'ring', taper: 0.28 },
      darkAlum,
    );
    fins.rotation.x = Math.PI; // taper toward the crank (fins grow toward head)
    fins.position.y = HEAD_D - 0.06;
    bank.add(fins);

    // head: core casting + its own square cooling fins + rocker cover on top
    const head = beveledBox(0.78, 0.18, 0.72, darkAlum, 0.04);
    head.position.y = HEAD_D + 0.09;
    const headFins = finStack(
      { count: 3, size: 0.36, thickness: 0.02, gap: 0.05, shape: 'square' },
      darkAlum,
    );
    headFins.position.y = HEAD_D + 0.2;
    const rocker = beveledBox(0.5, 0.16, 0.5, alum, 0.05);
    rocker.position.y = HEAD_D + 0.42;
    const headBolts = boltCircle(4, 0.17, 0.026, steel, 0.035);
    headBolts.position.y = HEAD_D + 0.5;
    bank.add(head, headFins, rocker, headBolts);

    // valves: intake toward the V (inner, blue), exhaust outboard (amber)
    function makeValve(color, x) {
      const v = new THREE.Group();
      const stem = rod(0.03, 0.5, steel);
      const face = disc(0.115, 0.04, materials.steel(color));
      v.add(stem, face);
      v.position.set(x, HEAD_D, 0);
      bank.add(v);
      return v;
    }
    const intakeValve = makeValve(0x7fc4ff, -sign * 0.15);
    const exhaustValve = makeValve(0xffab7a, sign * 0.15);

    // spark plug + fireball + light
    const plug = rod(0.035, 0.4, materials.steel(0xe8e2d2));
    plug.position.y = HEAD_D - 0.02;
    const plugTip = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 12, 12),
      materials.glow(0xffc266, 0),
    );
    plugTip.material.transparent = true;
    plugTip.material.opacity = 0;
    plugTip.material.depthWrite = false;
    plugTip.position.y = HEAD_D - 0.1;
    const sparkLight = new THREE.PointLight(0xffb45e, 0, 4);
    sparkLight.position.y = HEAD_D - 0.15;
    bank.add(plug, plugTip, sparkLight);

    // piston: crown + two dark compression-ring grooves + wrist pin
    const piston = new THREE.Group();
    const crown = new THREE.Mesh(
      new THREE.CylinderGeometry(PISTON_R, PISTON_R, 0.3, 32),
      materials.brushedSteel(0xccd3dd),
    );
    crown.castShadow = true;
    crown.position.y = 0.1;
    piston.add(crown);
    for (const ry of [0.16, 0.21]) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(PISTON_R + 0.004, 0.009, 8, 40),
        materials.darkMetal(0x22262c),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = ry;
      piston.add(ring);
    }
    const wristGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.42, 14);
    wristGeo.rotateX(Math.PI / 2);
    piston.add(new THREE.Mesh(wristGeo, steel));
    bank.add(piston);

    // con-rod: forged I-beam shank, big-end with cap bolts, small-end boss
    // (offset in Z so the two rods sit side by side on the shared pin)
    const rodMat = materials.brushedSteel(0xb4bcc8);
    const conRod = new THREE.Group();
    const shank = box(0.055, L - 0.32, 0.024, rodMat);
    shank.position.y = L / 2;
    conRod.add(shank);
    for (const fz of [0.026, -0.026]) {
      const flange = box(0.055, L - 0.32, 0.014, rodMat);
      flange.position.set(0, L / 2, fz);
      conRod.add(flange);
    }
    const bigGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.085, 24);
    bigGeo.rotateX(Math.PI / 2);
    conRod.add(new THREE.Mesh(bigGeo, rodMat));
    for (const bx of [-0.09, 0.09]) {
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.1, 6), steel);
      bolt.position.set(bx, 0, 0);
      conRod.add(bolt);
    }
    const smallGeo = new THREE.CylinderGeometry(0.072, 0.072, 0.07, 20);
    smallGeo.rotateX(Math.PI / 2);
    const smallEnd = new THREE.Mesh(smallGeo, rodMat);
    smallEnd.position.y = L;
    conRod.add(smallEnd);
    conRod.traverse((o) => (o.castShadow = true));
    conRod.position.z = -sign * 0.09;
    bank.add(conRod);

    // charge: unit cylinder, origin at bottom, stretched crown → head
    const chargeGeo = new THREE.CylinderGeometry(BORE_R * 0.9, BORE_R * 0.9, 1, 32);
    chargeGeo.translate(0, 0.5, 0);
    const charge = new THREE.Mesh(
      chargeGeo,
      new THREE.MeshBasicMaterial({
        color: 0x5ec1ff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    bank.add(charge);

    return { bank, sign, piston, conRod, intakeValve, exhaustValve, plugTip, sparkLight, charge };
  }

  // cylinder A fires at crank 405°, B at 675° → 270°/450° offbeat intervals
  const bankA = buildBank(+1);
  bankA.cycleOffset = 45;
  const bankB = buildBank(-1);
  bankB.cycleOffset = 315;

  // --- exhaust: flanged headers, mufflers, tips + scrub-driven smoke --------
  const puffGeo = new THREE.SphereGeometry(1, 10, 8);
  const puffsBySign = {};
  for (const sign of [+1, -1]) {
    const headerPts = [
      [sign * 1.28, 2.02, 0.1],
      [sign * 1.8, 1.72, 0.24],
      [sign * 2.0, 1.0, 0.1],
      [sign * 1.8, 0.5, -0.5],
      [sign * 1.5, 0.42, -1.0],
    ];
    // heat-blued near the port, fading to cold steel toward the muffler —
    // the gradient rides the tube's U coordinate (port = u0, muffler = u1)
    const header = tubeAlong(headerPts, 0.07, heatBlued);
    // exhaust-port flange collar, aligned with the header's first segment
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.098, 0.07, 20), steel);
    collar.castShadow = true;
    const dir = new THREE.Vector3(
      headerPts[1][0] - headerPts[0][0],
      headerPts[1][1] - headerPts[0][1],
      headerPts[1][2] - headerPts[0][2],
    ).normalize();
    collar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    collar.position.set(...headerPts[0]);
    const muffler = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.11, 0.55, 8, 20),
      brushed,
    );
    muffler.castShadow = true;
    muffler.rotation.x = Math.PI / 2;
    muffler.position.set(sign * 1.47, 0.42, -1.25);
    // dark exhaust tip poking out the rear
    const tipGeo = new THREE.CylinderGeometry(0.062, 0.07, 0.16, 20);
    tipGeo.rotateX(Math.PI / 2);
    const tip = new THREE.Mesh(tipGeo, materials.darkMetal(0x1d2126));
    tip.position.set(sign * 1.47, 0.42, -1.66);
    group.add(header, collar, muffler, tip);

    // smoke puffs — posed from the cylinder's own cycle so they scrub cleanly
    const puffs = [];
    for (let i = 0; i < 4; i++) {
      const p = new THREE.Mesh(
        puffGeo,
        new THREE.MeshBasicMaterial({
          color: 0x9aa0a8,
          transparent: true,
          opacity: 0,
          depthWrite: false,
        }),
      );
      puffs.push(p);
      group.add(p);
    }
    puffsBySign[sign] = puffs;
  }
  bankA.puffs = puffsBySign[1];
  bankB.puffs = puffsBySign[-1];

  // --- ignition: coil pack behind the case, HT leads arcing to each plug ----
  const coil = beveledBox(0.3, 0.18, 0.14, materials.paintedMetal(0x2b323d), 0.03);
  coil.position.set(0, 1.52, -0.52);
  group.add(coil);
  for (const sign of [+1, -1]) {
    const lead = tubeAlong(
      [
        [sign * 0.1, 1.6, -0.52],
        [sign * 0.5, 2.1, -0.5],
        [sign * 1.15, 2.55, -0.24],
        [sign * 1.37, 2.38, 0],
      ],
      0.024,
      materials.rubber(0x14161a),
      { tubularSegments: 40 },
    );
    lead.castShadow = false;
    group.add(lead);
  }

  // --- intake: air-filter drum nested in the V, runner to each head ---------
  const filter = lathe(
    [
      [0.0, -0.09],
      [0.3, -0.09],
      [0.31, 0.06],
      [0.24, 0.09],
      [0.0, 0.09],
    ],
    materials.paintedMetal(0x37404d),
  );
  filter.position.set(0, 2.32, 0);
  group.add(filter);
  for (const sign of [+1, -1]) {
    const runner = tubeAlong(
      [
        [sign * 0.24, 2.31, 0],
        [sign * 0.55, 2.31, 0],
        [sign * 0.88, 2.27, 0],
      ],
      0.055,
      darkAlum,
      { tubularSegments: 24 },
    );
    group.add(runner);
  }

  // --- callout labels ---------------------------------------------------------
  // Static ones live in a group; two are anchored to MOVING parts (the shared
  // pin and a counterweight) so their dots ride the mechanism.
  const callouts = [];
  const labels = new THREE.Group();
  const addCallout = (parent, text, pos, dir, len) => {
    const c = callout(text, { dir, len });
    c.position.set(...pos);
    c.visible = false;
    parent.add(c);
    callouts.push(c);
    return c;
  };
  addCallout(labels, 'Cylinder A', [1.3, 2.35, 0], 40, 64);
  addCallout(labels, 'Cylinder B', [-1.3, 2.35, 0], 140, 64);
  addCallout(labels, 'Air filter', [0, 2.44, 0], 90, 44);
  addCallout(labels, 'Flywheel', [0, 1.56, 0.72], 25, 56);
  addCallout(labels, 'Exhaust header', [1.98, 0.95, 0.1], -20, 56);
  addCallout(crankPin, 'Shared crankpin', [0, 0, 0.26], -30, 78);
  addCallout(counterweights[1], 'Counterweight', [0, -0.06, 0.1], -150, 62);
  group.add(labels);

  // charge look for one cylinder at its own cycle position
  function chargeAppearance(cyc, mat, spark) {
    if (cyc < 180) {
      mat.color.copy(chargeColors.intake);
      mat.opacity = 0.5 * clamp01(cyc / 60);
    } else if (cyc < 345) {
      mat.color.lerpColors(chargeColors.intake, chargeColors.compressed, (cyc - 180) / 165);
      mat.opacity = 0.5 + 0.25 * ((cyc - 180) / 165);
    } else if (cyc < 540) {
      mat.color.copy(chargeColors.burn);
      mat.opacity = 0.85 - 0.4 * clamp01((cyc - 375) / 165);
    } else {
      mat.color.lerpColors(chargeColors.burn, chargeColors.exhaust, clamp01((cyc - 540) / 60));
      mat.opacity = 0.5 * (1 - clamp01((cyc - 560) / 160));
    }
    if (spark > 0.2) {
      mat.color.lerpColors(chargeColors.burn, flash, spark);
      mat.opacity = Math.max(mat.opacity, 0.6 + spark * 0.35);
    }
  }

  function poseBank(b, cycleDeg) {
    const cyc = mod720(cycleDeg - b.cycleOffset);
    const thetaE = deg(cyc); // effective crank angle relative to this bank
    const d = pistonD(thetaE);

    b.piston.position.y = d;
    const px = R * Math.sin(thetaE);
    const py = R * Math.cos(thetaE);
    b.conRod.position.set(px, py, b.conRod.position.z);
    b.conRod.rotation.z = Math.asin((R * Math.sin(thetaE)) / L);

    const inLift = lift(cyc, 0, 195);
    const exLift = lift(cyc, 525, 720);
    b.intakeValve.position.y = HEAD_D - inLift;
    b.exhaustValve.position.y = HEAD_D - exLift;

    const top = d + 0.25;
    b.charge.position.y = top;
    b.charge.scale.y = Math.max(HEAD_D - top, 0.02);

    const spark = cyc > 345 && cyc < 430 ? Math.sin(Math.PI * ((cyc - 345) / 85)) : 0;
    b.sparkLight.intensity = spark * 32;
    b.plugTip.material.opacity = spark;
    b.plugTip.material.emissiveIntensity = 1 + spark * 2.2; // bloom pops the bang
    b.plugTip.scale.setScalar(0.6 + spark * 3);
    chargeAppearance(cyc, b.charge.material, spark);

    // smoke puffs drift out of the tip during (and just after) the exhaust
    // stroke — staggered ages, all derived from cyc so scrubbing stays clean
    if (b.puffs) {
      const tipX = b.sign * 1.47;
      b.puffs.forEach((p, i) => {
        const age = mod720(cyc - 525 - i * 45);
        if (age < 190) {
          const t = age / 190;
          p.position.set(
            tipX + Math.sin(i * 2.4 + t * 5) * 0.05,
            0.44 + t * 0.16,
            -1.74 - t * 0.75,
          );
          p.scale.setScalar(0.05 + t * 0.2);
          p.material.opacity = 0.3 * Math.sin(Math.PI * Math.min(1, t * 1.6));
        } else {
          p.material.opacity = 0;
        }
      });
    }
  }

  // Positions every moving part for a crank angle in degrees (continuous;
  // the four-stroke cycle repeats every 720°).
  function setCycle(cycleDeg) {
    crank.rotation.z = -deg(cycleDeg);
    poseBank(bankA, cycleDeg);
    poseBank(bankB, cycleDeg);
  }
  // initial pose: a calm angle — no cylinder mid-bang under the anatomy labels
  setCycle(140);

  return {
    group,
    setCycle,
    setLabels(visible) {
      for (const c of callouts) c.visible = visible;
    },
  };
}
