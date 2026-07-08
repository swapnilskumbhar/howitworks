import * as THREE from 'three';
import { materials, rod, box, disc, arrow } from '../../framework/parts.js';
import { beveledBox, tubeAlong, bladeRing } from '../../framework/geometry.js';
import { callout } from '../../framework/labels.js';

// A turbojet on a display stand, axis along X: intake at -X, nozzle at +X.
// One spool: fan + 5-stage compressor + turbine share the shaft.
//
// v2: every stage is a bladeRing (instanced twisted airfoils — one draw call
// per stage), and the casings are SOLID metal cut open over a ~92° sector
// facing the camera, model-kit style, instead of the old all-glass look.
const AXIS_Y = 1.4;
const GAP = 1.6; // cutaway opening (radians), centered on +Z

const lerp = (a, b, t) => a + (b - a) * Math.min(1, Math.max(0, t));

// solid casing segment with a sector cut out; axis +X, opening toward +Z
// (rPlusX = radius at the +X end, so tapers work).
// side matters: a DoubleSide metal casing shows its CONCAVE inner wall
// through the cut, which acts as a curved mirror and blows out — metal
// casings should be FrontSide + a separate dark liner inside.
function sectorCase(rPlusX, rMinusX, length, mat, side = THREE.FrontSide) {
  const geo = new THREE.CylinderGeometry(
    rPlusX,
    rMinusX,
    length,
    48,
    1,
    true,
    GAP / 2,
    Math.PI * 2 - GAP,
  );
  geo.rotateZ(-Math.PI / 2);
  mat.side = side;
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  return mesh;
}

export function buildJetEngine({ scene }) {
  const group = new THREE.Group();
  scene.add(group);

  const core = new THREE.Group();
  core.position.y = AXIS_Y;
  group.add(core);

  const alum = materials.aluminum(0x9ba3ad);
  const brushed = materials.brushedSteel();
  const steel = materials.steel();

  // --- stand ----------------------------------------------------------------
  const base = beveledBox(3.0, 0.14, 1.3, materials.grimyAluminum(0x2e333b), 0.03);
  base.position.y = 0.07;
  group.add(base);
  for (const x of [-0.7, 0.7]) {
    const pylon = rod(0.07, AXIS_Y - 0.72, materials.steel(0x6d747f));
    pylon.position.set(x, 0.14, 0);
    group.add(pylon);
  }

  // --- casings: solid metal, sector-cut open toward the viewer ---------------
  const fanCaseMat = materials.aluminum(0x8f97a2);
  fanCaseMat.roughness = 0.7; // (× castMap ≈ 0.35 effective — soft sheen, no hot streak)
  const fanCase = sectorCase(0.85, 0.85, 0.62, fanCaseMat);
  fanCase.position.x = -1.0;
  const coreCaseMat = materials.aluminum(0x878f9a);
  coreCaseMat.roughness = 0.7;
  const coreCase = sectorCase(0.46, 0.78, 1.6, coreCaseMat);
  coreCase.position.x = 0.1;
  core.add(fanCase, coreCase);

  // dark acoustic liners just inside each casing — real engines have them,
  // and they stop the concave inner wall acting as a mirror
  const linerMat = new THREE.MeshStandardMaterial({
    color: 0x23262b,
    roughness: 0.92,
    metalness: 0.15,
  });
  const fanLiner = sectorCase(0.828, 0.828, 0.61, linerMat, THREE.DoubleSide);
  fanLiner.position.x = -1.0;
  const coreLiner = sectorCase(0.44, 0.758, 1.59, linerMat, THREE.DoubleSide);
  coreLiner.position.x = 0.1;
  core.add(fanLiner, coreLiner);

  // flange bands at the casing joints (same sector cut, slightly proud)
  const flangeMat = materials.brushedSteel(0x7b838e);
  const flanges = [
    [0.87, 0.87, 0.07, -1.31], // intake lip
    [0.82, 0.82, 0.08, -0.66], // fan/core joint
    [0.5, 0.5, 0.07, 0.92], // core/nozzle joint
  ];
  for (const [r1, r0, len, x] of flanges) {
    const band = sectorCase(r1 + 0.035, r0 + 0.035, len, flangeMat, THREE.DoubleSide);
    band.position.x = x;
    core.add(band);
    // radial bolt studs across the flange arc
    const n = 12;
    for (let i = 0; i <= n; i++) {
      const phi = GAP / 2 + 0.18 + (i / n) * (Math.PI * 2 - GAP - 0.36);
      const stud = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.05, 6), steel);
      const R = r1 + 0.05;
      stud.position.set(x, Math.sin(phi) * R, Math.cos(phi) * R);
      stud.rotation.x = Math.PI / 2 - phi;
      core.add(stud);
    }
  }

  // accessory gearbox under the fan case + fuel/oil lines hugging the casing
  const gearbox = beveledBox(0.55, 0.24, 0.32, materials.grimyAluminum(0x565e69), 0.04);
  gearbox.position.set(-0.95, -1.0, 0);
  core.add(gearbox);
  for (const [phi, colr] of [
    [2.35, 0xc07a3c],
    [-2.35, 0x8b929c],
  ]) {
    const rOf = (x) => lerp(0.84, 0.52, (x + 0.65) / 1.5) + 0.06;
    const pts = [];
    for (const x of [-0.75, -0.4, 0.0, 0.4, 0.78]) {
      const R = rOf(x);
      pts.push([x, Math.sin(phi) * R, Math.cos(phi) * R]);
    }
    const pipe = tubeAlong(pts, 0.028, materials.brushedSteel(colr), { tubularSegments: 40 });
    core.add(pipe);
  }
  const feedPipe = tubeAlong(
    [
      [-0.95, -0.86, 0.1],
      [-0.85, -0.6, 0.35],
      [-0.7, -0.2, 0.62],
      [-0.6, 0.2, 0.72],
    ],
    0.026,
    materials.brushedSteel(0xc07a3c),
    { tubularSegments: 30 },
  );
  core.add(feedPipe);

  // --- rotor: everything on the spool ---------------------------------------
  const rotor = new THREE.Group();
  core.add(rotor);

  const shaftGeo = new THREE.CylinderGeometry(0.07, 0.07, 2.5, 20);
  shaftGeo.rotateX(Math.PI / 2);
  shaftGeo.rotateY(Math.PI / 2);
  const shaft = new THREE.Mesh(shaftGeo, steel);
  shaft.position.x = -0.15;
  rotor.add(shaft);

  const spinnerMat = materials.brushedSteel();
  spinnerMat.roughness = 0.6;
  const spinner = new THREE.Mesh(
    new THREE.ConeGeometry(0.2, 0.45, 24).rotateZ(Math.PI / 2),
    spinnerMat,
  );
  spinner.position.x = -1.55;
  rotor.add(spinner);

  // fan: 18 wide-chord swept blades.
  // NOTE on blade roughness: brushedSteel's roughnessMap MULTIPLIES the base
  // value (map texels average ~0.5), so 0.85 here lands at ~0.45 effective —
  // matte titanium. The preset default (0.3 → ~0.15 effective) is near-chrome,
  // and 322 curved plates at near-chrome always find an angle that mirrors
  // the studio softbox straight into the camera.
  const fanBladeMat = materials.brushedSteel(0xb8c2d0);
  fanBladeMat.roughness = 0.85;
  const fan = bladeRing(
    {
      blades: 18,
      hubR: 0.18,
      span: 0.63,
      chord: 0.26,
      chordTip: 0.3,
      camber: 0.1,
      twist: 0.95,
      twistTip: 0.4,
      hubDepth: 0.16,
      hubMaterial: brushed,
    },
    fanBladeMat,
  );
  fan.group.rotation.y = Math.PI / 2; // ring axis +Z → +X
  fan.group.position.x = -1.0;
  rotor.add(fan.group);

  // compressor: 5 rotor stages of shrinking bladed discs on a tapering drum
  const compBladeMat = materials.brushedSteel(0xaab3bf);
  compBladeMat.roughness = 0.85;
  const compTip = [0.56, 0.515, 0.47, 0.425, 0.38];
  compTip.forEach((tipR, i) => {
    const hubR = 0.17 + i * 0.02;
    const stage = bladeRing(
      {
        blades: 28,
        hubR,
        span: tipR - hubR,
        chord: 0.085,
        camber: 0.07,
        twist: 0.8,
        twistTip: 0.35,
        hubDepth: 0.1,
      },
      compBladeMat,
    );
    stage.group.rotation.y = Math.PI / 2;
    stage.group.position.x = -0.55 + i * 0.17;
    rotor.add(stage.group);
  });
  // rotor drum connecting the stage hubs
  const drumGeo = new THREE.CylinderGeometry(0.24, 0.16, 0.8, 28);
  drumGeo.rotateZ(-Math.PI / 2);
  const drum = new THREE.Mesh(drumGeo, brushed);
  drum.castShadow = true;
  drum.position.x = -0.16;
  rotor.add(drum);

  // stator vane rings fixed to the casing between rotor stages
  const statorMat = materials.steel(0x6f7784);
  statorMat.roughness = 0.6;
  for (let i = 0; i < 4; i++) {
    const tipR = compTip[i] - 0.03;
    const hubR = 0.19 + i * 0.02;
    const vanes = bladeRing(
      { blades: 24, hubR, span: tipR - hubR, chord: 0.07, camber: 0.06, twist: -0.7, twistTip: -0.3 },
      statorMat,
    );
    vanes.group.rotation.y = Math.PI / 2;
    vanes.group.position.x = -0.465 + i * 0.17;
    core.add(vanes.group);
  }

  // turbine: two hot-section stages behind the combustor
  const turbMat = materials.brushedSteel(0x8a6a52);
  turbMat.roughness = 0.9;
  [0.44, 0.4].forEach((tipR, i) => {
    const stage = bladeRing(
      {
        blades: 34,
        hubR: 0.18,
        span: tipR - 0.18,
        chord: 0.075,
        camber: 0.07,
        twist: -0.85,
        twistTip: -0.4,
        hubDepth: 0.09,
      },
      turbMat,
    );
    stage.group.rotation.y = Math.PI / 2;
    stage.group.position.x = 0.66 + i * 0.18;
    rotor.add(stage.group);
  });

  // --- combustor: ring of cans + circular fuel manifold ---------------------
  const canMat = materials.brushedSteel(0xc98f56);
  const canGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.34, 16).rotateZ(-Math.PI / 2);
  for (let i = 0; i < 6; i++) {
    const a = (i * 2 * Math.PI) / 6;
    const can = new THREE.Mesh(canGeo, canMat);
    can.castShadow = true;
    can.position.set(0.32, Math.cos(a) * 0.26, Math.sin(a) * 0.26);
    core.add(can);
    // injector stub from the manifold down to each can
    const stub = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.14, 8), steel);
    stub.position.set(0.16, Math.cos(a) * 0.34, Math.sin(a) * 0.34);
    stub.rotation.x = Math.PI / 2 - Math.atan2(Math.cos(a), Math.sin(a));
    core.add(stub);
  }
  const manifoldPts = [];
  for (let i = 0; i < 10; i++) {
    const a = (i * 2 * Math.PI) / 10;
    manifoldPts.push([0.16, Math.cos(a) * 0.42, Math.sin(a) * 0.42]);
  }
  const manifold = tubeAlong(manifoldPts, 0.024, materials.brushedSteel(0xc07a3c), {
    closed: true,
    tubularSegments: 48,
  });
  core.add(manifold);

  const flame = new THREE.Mesh(
    new THREE.SphereGeometry(1, 20, 16),
    new THREE.MeshBasicMaterial({
      color: 0xffa14d,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  );
  flame.scale.set(0.34, 0.24, 0.24);
  flame.position.x = 0.42;
  core.add(flame);

  // NOTE: this light now lives inside a closed metal casing full of blades —
  // it must run far dimmer than the old glass-housing version did
  const flameLight = new THREE.PointLight(0xff9a4d, 0, 3.5);
  flameLight.position.set(0.42, 0, 0);
  core.add(flameLight);

  // --- nozzle: heat-blued cone + tail plug -----------------------------------
  const nozzleGeo = new THREE.CylinderGeometry(0.3, 0.46, 0.55, 40, 1, true);
  nozzleGeo.rotateZ(-Math.PI / 2);
  const nozzle = new THREE.Mesh(nozzleGeo, materials.heatBluedSteel('v'));
  nozzle.castShadow = true;
  nozzle.position.x = 1.18;
  core.add(nozzle);
  // sooty inner surface — stops the concave interior mirroring the env
  const nozzleLinerGeo = new THREE.CylinderGeometry(0.285, 0.445, 0.55, 40, 1, true);
  nozzleLinerGeo.rotateZ(-Math.PI / 2);
  const nozzleLiner = new THREE.Mesh(
    nozzleLinerGeo,
    new THREE.MeshStandardMaterial({
      color: 0x2b2622,
      roughness: 0.9,
      metalness: 0.2,
      side: THREE.DoubleSide,
    }),
  );
  nozzleLiner.position.x = 1.18;
  core.add(nozzleLiner);
  const tailCone = new THREE.Mesh(
    new THREE.ConeGeometry(0.14, 0.5, 20).rotateZ(-Math.PI / 2),
    materials.darkMetal(0x3a3228),
  );
  tailCone.position.x = 1.15;
  core.add(tailCone);

  // --- exhaust jet ------------------------------------------------------------
  const jet = new THREE.Mesh(
    new THREE.ConeGeometry(0.26, 1.6, 24, 1, true).rotateZ(Math.PI / 2),
    new THREE.MeshBasicMaterial({
      color: 0xffb36b,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  jet.position.x = 2.25;
  core.add(jet);

  // --- airflow arrows ---------------------------------------------------------
  const airflow = new THREE.Group();
  airflow.userData.arrows = [];
  for (let i = 0; i < 18; i++) {
    const a = arrow(0x5ec1ff, 0.13);
    a.rotation.z = -Math.PI / 2; // point along +X
    a.userData.seed = i / 18;
    a.userData.clock = (i % 6) * (Math.PI / 3) + 0.3;
    airflow.userData.arrows.push(a);
    airflow.add(a);
  }
  core.add(airflow);

  const cold = new THREE.Color(0x5ec1ff);
  const squeezed = new THREE.Color(0xbfe9ff);
  const hot = new THREE.Color(0xffa14d);

  // path radius through the engine for progress p (0 intake → 1 jet)
  function pathRadius(p) {
    if (p < 0.18) return 0.6;
    if (p < 0.45) return lerp(0.6, 0.2, (p - 0.18) / 0.27);
    if (p < 0.62) return 0.24;
    if (p < 0.78) return lerp(0.24, 0.3, (p - 0.62) / 0.16);
    return lerp(0.3, 0.42, (p - 0.78) / 0.22);
  }

  // --- callout labels ---------------------------------------------------------
  const callouts = [];
  const addCallout = (text, pos, dir, len) => {
    const c = callout(text, { dir, len });
    c.position.set(...pos);
    c.visible = false;
    group.add(c);
    callouts.push(c);
  };
  addCallout('Fan', [-1.0, 2.26, 0], 115, 56);
  addCallout('Compressor', [-0.28, 1.98, 0], 80, 66);
  addCallout('Combustor', [0.32, 1.72, 0.25], 55, 80);
  addCallout('Turbine', [0.76, 1.86, 0], 40, 62);
  addCallout('Nozzle', [1.32, 1.86, 0], 20, 52);

  // spin: shaft angle (rad) · flow: arrow phase · fuel/thrust: 0–1
  const state = { spin: 0, flow: 0, fuel: 0, thrust: 0 };

  function apply() {
    rotor.rotation.x = -state.spin;

    flame.material.opacity = state.fuel * 0.65;
    flameLight.intensity = state.fuel * 3;
    const jetPulse = 1 + Math.sin(state.flow * 21) * 0.06 * state.thrust;
    jet.material.opacity = state.thrust * 0.55;
    jet.scale.set(state.thrust * jetPulse, jetPulse, jetPulse);

    airflow.userData.arrows.forEach((a) => {
      const p = (state.flow + a.userData.seed) % 1;
      const r = pathRadius(p);
      const x = lerp(-1.95, 2.45, p);
      a.position.set(x, Math.cos(a.userData.clock) * r, Math.sin(a.userData.clock) * r);
      if (p < 0.2) {
        a.material.color.copy(cold);
      } else if (p < 0.5) {
        a.material.color.lerpColors(cold, squeezed, (p - 0.2) / 0.3);
      } else {
        a.material.color.lerpColors(squeezed, hot, Math.min(1, state.fuel * 2));
      }
      // fade in at the intake lip / out at the jet tail, and past the
      // combustor only fly with fuel/thrust
      let op = 0.9 * Math.min(1, p * 5) * Math.min(1, (1 - p) * 5);
      if (p > 0.55) op *= 0.25 + 0.75 * Math.max(state.fuel, state.thrust);
      a.material.opacity = op;
      const boost = p > 0.78 ? 1 + state.thrust * 0.8 : 1;
      a.scale.setScalar(boost);
    });
  }
  apply();

  return {
    group,
    state,
    set(partial) {
      Object.assign(state, partial);
      apply();
    },
    setLabels(visible) {
      for (const c of callouts) c.visible = visible;
    },
  };
}
