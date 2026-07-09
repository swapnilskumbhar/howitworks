import * as THREE from 'three';
import { materials, rod, box, arrow } from '../../framework/parts.js';
import { beveledBox, tubeAlong, bladeRing, coil, chainPath } from '../../framework/geometry.js';
import { callout } from '../../framework/labels.js';

// A coal-fired thermal power station, product-shot staged left-to-right along
// the process: coal yard -> boiler/furnace (with stack) -> turbine hall
// (HP/IP/LP turbine + generator on one shaft) -> condenser -> cooling tower
// -> step-up transformer & transmission lines.
//
// Energy chain (validated against Wikipedia's Thermal power station / Fossil
// fuel power station / Rankine cycle / Cooling tower articles): coal is
// ground to a fine powder in a pulverizer and blown into the furnace, where
// it burns (chemical -> heat). That heat boils water running through
// waterwall tubes lining the furnace into steam, which is superheated to
// roughly 540 C at ~16-18 MPa (heat -> stored energy in high-pressure steam).
// The steam expands through a high-pressure turbine stage, is piped BACK to
// the boiler's reheater to be resuperheated to ~540 C at lower pressure (the
// standard "reheat" most real coal units use), then continues through the
// intermediate- and low-pressure stages on the SAME shaft (heat -> rotation).
// That shaft carries straight into a generator, where a rotor of magnetic
// poles spinning inside fixed stator windings induces an alternating current
// (rotation -> electricity, Faraday's law — the same induction the hydro
// plant and transformer/inductor explainers show). A step-up transformer
// raises the voltage before it heads out on transmission lines. Meanwhile the
// spent low-pressure steam is condensed back to water in a condenser, cooled
// by a SEPARATE, open circuit of cooling water that carries the rejected heat
// to the plant's hyperboloid natural-draft cooling tower and releases it as a
// rising plume of water vapor (not smoke); a feed pump returns the condensed
// water to the boiler, closing the primary Rankine loop. Flue (combustion)
// gas, separately, leaves up the tall chimney/stack.

const AXIS_Y = 1.15; // turbine/generator shaft height
const GAP = 1.6; // sector-cutaway opening (radians), centered on +Z (camera side)

const lerp = (a, b, t) => a + (b - a) * Math.min(1, Math.max(0, t));

// solid casing segment with a sector cut out; axis +X (shaft direction),
// opening toward +Z. DoubleSide on a metal casing shows its concave inner
// wall through the cut (a curved mirror) — solid casings stay FrontSide with
// a separate dark liner mesh just inside (see jet-engine).
function sectorCase(rPlusX, rMinusX, length, mat, side = THREE.FrontSide) {
  const geo = new THREE.CylinderGeometry(rPlusX, rMinusX, length, 44, 1, true, GAP / 2, Math.PI * 2 - GAP);
  geo.rotateZ(-Math.PI / 2);
  mat.side = side;
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  return mesh;
}

// soft, fading, upward-drifting plume — many overlapping translucent puffs,
// growing and fading as they rise, laterally jittered so it reads as a soft
// cloud rather than a stack of distinct balls. depthWrite:false so the fade
// never punches a hole through anything behind it.
function buildPlume(color, baseR, levels, riseY) {
  const g = new THREE.Group();
  const meshes = [];
  for (let i = 0; i < levels; i++) {
    const t = i / (levels - 1);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(baseR * (0.7 + t * 1.9), 12, 9), mat);
    const jitter = Math.sin(i * 2.4) * baseR * 0.6 * t;
    const jitterZ = Math.cos(i * 1.7) * baseR * 0.6 * t;
    mesh.position.set(jitter, t * riseY, jitterZ);
    mesh.userData.baseOpacity = 0.22 * (1 - t * 0.7);
    mesh.userData.jitter = jitter;
    mesh.userData.jitterZ = jitterZ;
    g.add(mesh);
    meshes.push(mesh);
  }
  return { group: g, meshes };
}

export function buildCoalPlant({ scene }) {
  const group = new THREE.Group();
  scene.add(group);

  // ---- shared materials ------------------------------------------------------
  const concrete = new THREE.MeshStandardMaterial({ color: 0x9fa3a8, roughness: 0.9, metalness: 0.03 });
  const concreteDark = new THREE.MeshStandardMaterial({ color: 0x7a7d82, roughness: 0.92, metalness: 0.03 });
  const casingMat = materials.aluminum(0x8c94a0);
  casingMat.roughness = 0.7;
  const linerMat = new THREE.MeshStandardMaterial({ color: 0x232529, roughness: 0.92, metalness: 0.15 });
  const bladeMat = materials.brushedSteel(0xb9c2cc);
  bladeMat.roughness = 0.85;
  const pipeMat = materials.paintedMetal(0x3d4a52);
  const pipeMatBig = materials.paintedMetal(0x445560);
  pipeMatBig.clearcoatRoughness = 0.4; // this duct passes close to the generator's light — soften the coat so it doesn't spike
  const coalMat = new THREE.MeshStandardMaterial({ color: 0x1c1a19, roughness: 0.95, metalness: 0.05 });
  const wireColor = 0xc9853f;

  const HOT_N = 0xd23c2e;
  const COOL_S = 0x2e6bd2;
  const POS_COLOR = 0x6ea8ff;
  const NEG_COLOR = 0xffa860;
  const FLUE_GREY = 0x9aa0a6;
  const VAPOR_WHITE = 0xf2f6fa;

  // =========================================================================
  // GROUND
  // =========================================================================
  const plinth = beveledBox(6.6, 0.16, 2.3, new THREE.MeshStandardMaterial({ color: 0x1e2024, roughness: 0.85 }), 0.03);
  plinth.position.set(0.15, 0.06, 0);
  group.add(plinth);

  // =========================================================================
  // COAL YARD — bunker, pulverizer, feed pipe to the burners
  // =========================================================================
  const COAL_X = -2.75;
  const bunker = new THREE.Group();
  bunker.position.set(COAL_X, 0, 0.15);
  group.add(bunker);
  const hopperShape = new THREE.Shape();
  hopperShape.moveTo(-0.34, 0);
  hopperShape.lineTo(0.34, 0);
  hopperShape.lineTo(0.16, -0.42);
  hopperShape.lineTo(-0.16, -0.42);
  hopperShape.closePath();
  const hopperGeo = new THREE.ExtrudeGeometry(hopperShape, { depth: 0.5, bevelEnabled: false, curveSegments: 1 });
  hopperGeo.rotateX(Math.PI / 2);
  hopperGeo.translate(0, 0, -0.25);
  const hopper = new THREE.Mesh(hopperGeo, materials.darkMetal(0x3a3f47));
  hopper.position.y = 1.15;
  hopper.castShadow = true;
  bunker.add(hopper);
  const bunkerBody = beveledBox(0.68, 0.55, 0.5, materials.paintedMetal(0x5a626c), 0.02);
  bunkerBody.position.y = 1.45;
  bunker.add(bunkerBody);
  // coal lumps piled in the open hopper mouth
  const lumpGeo = new THREE.IcosahedronGeometry(0.045, 0);
  for (let i = 0; i < 22; i++) {
    const lump = new THREE.Mesh(lumpGeo, coalMat);
    lump.position.set((Math.random() - 0.5) * 0.5, 1.68 + Math.random() * 0.05, (Math.random() - 0.5) * 0.36);
    lump.rotation.set(Math.random(), Math.random(), Math.random());
    lump.castShadow = true;
    bunker.add(lump);
  }
  // pulverizer: squat drum on legs below the bunker
  const pulv = new THREE.Group();
  pulv.position.set(COAL_X + 0.05, 0, 0.15);
  group.add(pulv);
  const pulvDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.32, 28), materials.grimyAluminum(0x565e69));
  pulvDrum.position.y = 0.55;
  pulvDrum.castShadow = true;
  pulv.add(pulvDrum);
  for (const [lx, lz] of [[-0.16, -0.16], [0.16, -0.16], [-0.16, 0.16], [0.16, 0.16]]) {
    const leg = rod(0.025, 0.4, materials.darkMetal(0x2b3037));
    leg.position.set(lx, 0.14, lz);
    pulv.add(leg);
  }
  const chuteGeo = new THREE.CylinderGeometry(0.1, 0.14, 0.32, 16);
  const chute = new THREE.Mesh(chuteGeo, materials.darkMetal(0x2b3037));
  chute.position.set(0, 0.95, 0);
  pulv.add(chute);

  // pulverized-coal feed pipe: pulverizer -> burner nozzles low on the furnace
  // front face. Dust "packets" (small dark glowing dots) ride it.
  const FUR_X0 = -2.05;
  const FUR_X1 = -1.35;
  const FUR_Z = 0.5;
  const burnerA = [FUR_X0 - 0.05, 0.55, FUR_Z - 0.05];
  const burnerB = [FUR_X0 + 0.35, 0.5, FUR_Z - 0.05];
  const coalFeedCurve = new THREE.CatmullRomCurve3(
    [[COAL_X + 0.05, 0.72, 0.15], [COAL_X + 0.5, 0.62, 0.3], [FUR_X0 - 0.35, 0.58, 0.4], burnerA].map(
      (p) => new THREE.Vector3(...p),
    ),
    false,
    'catmullrom',
    0.3,
  );
  const coalFeedPipe = new THREE.Mesh(new THREE.TubeGeometry(coalFeedCurve, 40, 0.045, 12), materials.darkMetal(0x2b3037));
  group.add(coalFeedPipe);
  const dustDots = [];
  const dustGeo = new THREE.SphereGeometry(0.02, 8, 6);
  for (let i = 0; i < 10; i++) {
    const m = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9, transparent: true, depthWrite: false });
    const d = new THREE.Mesh(dustGeo, m);
    d.userData.seed = i / 10;
    dustDots.push(d);
    group.add(d);
  }

  // =========================================================================
  // FURNACE / BOILER — open-front tower: waterwalls, burners, drum, superheater
  // =========================================================================
  const FUR_ROOF_Y = 3.05;
  const furnaceGroup = new THREE.Group();
  group.add(furnaceGroup);

  const furnaceMat = materials.paintedMetal(0xc7ccd1);
  const furnaceRoofMat = materials.paintedMetal(0x565e69);
  const furFloor = beveledBox(FUR_X1 - FUR_X0 + 0.1, 0.12, FUR_Z * 2, concreteDark, 0.02);
  furFloor.position.set((FUR_X0 + FUR_X1) / 2, 0.14, 0);
  const furBack = beveledBox(FUR_X1 - FUR_X0, FUR_ROOF_Y - 0.14, 0.06, furnaceMat, 0.02);
  furBack.position.set((FUR_X0 + FUR_X1) / 2, (FUR_ROOF_Y + 0.14) / 2, -FUR_Z + 0.03);
  const furRoof = beveledBox(FUR_X1 - FUR_X0 + 0.14, 0.1, FUR_Z * 2 + 0.1, furnaceRoofMat, 0.02);
  furRoof.position.set((FUR_X0 + FUR_X1) / 2, FUR_ROOF_Y, 0);
  // matte, not the clearcoat furnaceMat — this return wall sits right beside
  // the burner point lights, and a clearcoat surface that close to a light
  // turns into a mirror-bright specular hotspot at point-blank range.
  const furSideLMat = materials.paintedMetal(0xc7ccd1);
  furSideLMat.clearcoat = 0;
  furSideLMat.roughness = 0.75;
  const furSideL = beveledBox(0.06, FUR_ROOF_Y - 0.14, FUR_Z * 2, furSideLMat, 0.02);
  furSideL.position.set(FUR_X0, (FUR_ROOF_Y + 0.14) / 2, 0);
  furnaceGroup.add(furFloor, furBack, furRoof, furSideL);

  // waterwall tubes: vertical rods lining the back wall, cool blue-grey lower
  // down, glowing hotter red-orange near the burner zone
  const waterwallTubes = [];
  const WW_N = 11;
  for (let i = 0; i < WW_N; i++) {
    const x = FUR_X0 + 0.08 + (i / (WW_N - 1)) * (FUR_X1 - FUR_X0 - 0.16);
    const mat = new THREE.MeshStandardMaterial({ color: 0x8b929c, roughness: 0.55, metalness: 0.7, emissive: 0x000000 });
    const tube = rod(0.018, 2.4, mat);
    tube.position.set(x, 0.3, -FUR_Z + 0.09);
    furnaceGroup.add(tube);
    waterwallTubes.push({ mesh: tube, mat });
  }

  // steam drum near the roof, spanning the tower's width
  const drumMat = materials.brushedSteel(0xb0b8c2);
  const drumLen = FUR_X1 - FUR_X0 - 0.1;
  const drumGeo = new THREE.CylinderGeometry(0.14, 0.14, drumLen, 24);
  drumGeo.rotateZ(Math.PI / 2);
  const drum = new THREE.Mesh(drumGeo, drumMat);
  drum.castShadow = true;
  drum.position.set((FUR_X0 + FUR_X1) / 2, 2.82, -FUR_Z + 0.14);
  furnaceGroup.add(drum);

  // superheater: a compact coil bundle just below the drum
  const superheater = coil(
    { turns: 5, radius: 0.1, length: 0.34, wireRadius: 0.016, segmentsPerTurn: 16 },
    materials.brushedSteel(0xd8dde3),
  );
  superheater.mesh.rotation.z = Math.PI / 2;
  superheater.mesh.position.set(FUR_X0 + 0.42, 2.6, -FUR_Z + 0.16);
  furnaceGroup.add(superheater.mesh);

  // burner nozzles + flame + low-intensity glow (point lights inside closed
  // geometry clip fast at point-blank range — keep intensity low, ~3)
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xff8a3d, transparent: true, opacity: 0, depthWrite: false });
  // nozzles sit almost on top of the burner point light — a shiny metal there
  // would blow into a mirror-bright specular hotspot at point-blank range, so
  // this one stays matte (high roughness, low metalness) rather than using
  // the shared darkMetal chrome-adjacent preset.
  const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x2b3037, roughness: 0.92, metalness: 0.25 });
  const flames = [];
  for (const pos of [burnerA, burnerB]) {
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.14, 14), nozzleMat.clone());
    nozzle.rotation.x = Math.PI / 2;
    nozzle.position.set(pos[0], pos[1], pos[2]);
    furnaceGroup.add(nozzle);
    // a flame reads as an odd flat disc from side-on angles if it's one
    // sphere squashed on one axis — cluster a few overlapping spheres of
    // shrinking size instead, so it holds up from any camera angle.
    const flameLobes = [
      [0, 0.1, 0, 0.11],
      [0.02, 0.22, -0.03, 0.09],
      [-0.02, 0.34, -0.05, 0.06],
      [0.01, 0.44, -0.07, 0.035],
    ];
    for (const [lx, ly, lz, lr] of flameLobes) {
      const flame = new THREE.Mesh(new THREE.SphereGeometry(lr, 12, 10), flameMat.clone());
      flame.position.set(pos[0] + lx, pos[1] + ly, pos[2] + lz);
      furnaceGroup.add(flame);
      flames.push(flame);
    }
    const flameLight = new THREE.PointLight(0xff9a4d, 0, 0.9);
    flameLight.position.set(pos[0], pos[1] + 0.3, pos[2] - 0.2);
    furnaceGroup.add(flameLight);
    flames.push(flameLight);
  }

  // =========================================================================
  // CHIMNEY / STACK — flue gas, separate from the boiler's steam/water loop
  // =========================================================================
  const STACK_X = FUR_X0 - 0.2;
  const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 1.35, 24), materials.paintedMetal(0x565e69));
  stack.castShadow = true;
  stack.position.set(STACK_X, FUR_ROOF_Y + 0.68, -0.15);
  group.add(stack);
  const fluePlume = buildPlume(FLUE_GREY, 0.1, 8, 1.0);
  fluePlume.group.position.set(STACK_X, FUR_ROOF_Y + 1.36, -0.15);
  group.add(fluePlume.group);

  // =========================================================================
  // MAIN STEAM / REHEAT / CONDENSATE LOOP — one closed Rankine chain
  // =========================================================================
  const PH_OFF_X = 0.25; // powerhouse core offset (shaft world position)
  const econIn = [FUR_X0 - 0.02, 0.32, FUR_Z - 0.32];
  const drumPt = [(FUR_X0 + FUR_X1) / 2 - 0.05, 2.82, -FUR_Z + 0.16];
  const superheaterPt = [FUR_X0 + 0.42, 2.62, -FUR_Z + 0.2];
  const hpInlet = [PH_OFF_X - 0.62, AXIS_Y + 0.02, 0.02];
  const hpOutlet = [PH_OFF_X - 0.3, AXIS_Y, 0];
  const reheaterPt = [FUR_X0 + 0.5, 2.55, FUR_Z - 0.1];
  const ipInlet = [PH_OFF_X - 0.18, AXIS_Y + 0.02, -0.02];
  const ipOutlet = [PH_OFF_X + 0.18, AXIS_Y, 0];
  const lpInlet = [PH_OFF_X + 0.3, AXIS_Y + 0.02, 0.02];
  const lpOutlet = [PH_OFF_X + 0.82, AXIS_Y, 0];
  const condIn = [0.95, 0.66, 0.05];
  const condOut = [0.68, 0.36, -0.1];
  const feedPumpPt = [0.32, 0.26, -0.15];

  const segments = [
    // A · economizer/waterwalls -> drum -> superheater -> main steam line -> HP inlet
    [econIn, [FUR_X0 - 0.1, 1.4, FUR_Z - 0.2], drumPt, superheaterPt, [FUR_X0 + 0.55, 2.3, 0.1], [PH_OFF_X - 0.5, 1.75, 0.05], hpInlet],
    // B · through the HP turbine (no visible pipe — flows through the blades)
    [hpInlet, hpOutlet],
    // C · reheat: HP exhaust back up to the boiler reheater, then down to IP inlet
    [hpOutlet, [PH_OFF_X - 0.35, 2.0, 0.15], reheaterPt, [FUR_X0 + 0.65, 1.95, 0.1], [PH_OFF_X - 0.3, 1.6, -0.05], ipInlet],
    // D · through the IP turbine
    [ipInlet, ipOutlet],
    // E · crossover: IP exhaust -> LP inlet (short, big-diameter duct)
    [ipOutlet, [PH_OFF_X + 0.24, AXIS_Y + 0.1, 0.08], lpInlet],
    // F · through the LP turbine
    [lpInlet, lpOutlet],
    // G · LP exhaust -> condenser inlet (huge low-pressure duct, steam condensing)
    [lpOutlet, [PH_OFF_X + 0.95, 0.95, 0.05], condIn],
    // H · condenser hotwell -> feed pump -> back to the economizer inlet
    [condIn, condOut, feedPumpPt, [-0.4, 0.24, -0.28], [FUR_X0 + 0.4, 0.28, -0.2], econIn],
  ];
  const chain = chainPath(segments);
  const b = chain.bounds;
  const boilPoint = b[0] * 0.42; // liquid -> steam transition within segment A

  const pipeRadii = [0.038, null, 0.042, null, 0.07, null, 0.095, 0.04];
  chain.curves.forEach((curve, i) => {
    if (pipeRadii[i] == null) return;
    const mat = i === 6 ? pipeMatBig : pipeMat;
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 70, pipeRadii[i], 14), mat);
    tube.castShadow = true;
    group.add(tube);
  });

  const liquidColor = new THREE.Color(0x2f7fc4);
  const steamColor = new THREE.Color(0xfbeede);
  const tmpColor = new THREE.Color();
  function colorAt(t, out) {
    t = ((t % 1) + 1) % 1;
    if (t < boilPoint) out.copy(liquidColor);
    else if (t < b[0]) out.lerpColors(liquidColor, steamColor, (t - boilPoint) / (b[0] - boilPoint));
    else if (t < b[5]) out.copy(steamColor);
    else if (t < b[6]) out.lerpColors(steamColor, liquidColor, (t - b[5]) / (b[6] - b[5]));
    else out.copy(liquidColor);
    return out;
  }

  const packets = new THREE.Group();
  const packetArrows = [];
  const UP = new THREE.Vector3(0, 1, 0);
  const tangent = new THREE.Vector3();
  for (let i = 0; i < 44; i++) {
    const a = arrow(0xffffff, 0.075);
    a.userData.seed = i / 44;
    packetArrows.push(a);
    packets.add(a);
  }
  group.add(packets);

  // =========================================================================
  // TURBINE HALL — open-front building housing HP/IP/LP turbine + generator
  // =========================================================================
  const TH_X0 = PH_OFF_X - 0.95;
  const TH_X1 = PH_OFF_X + 1.85;
  const TH_ROOF_Y = 2.0;
  const thMat = materials.paintedMetal(0xd7dadd);
  const thRoofMat = materials.paintedMetal(0x565e69);
  const thFloor = beveledBox(TH_X1 - TH_X0 + 0.1, 0.12, FUR_Z * 2, concreteDark, 0.02);
  thFloor.position.set((TH_X0 + TH_X1) / 2, 0.14, 0);
  const thBack = beveledBox(TH_X1 - TH_X0, TH_ROOF_Y - 0.14, 0.06, thMat, 0.02);
  thBack.position.set((TH_X0 + TH_X1) / 2, (TH_ROOF_Y + 0.14) / 2, -FUR_Z + 0.03);
  const thRoof = beveledBox(TH_X1 - TH_X0 + 0.14, 0.1, FUR_Z * 2 + 0.1, thRoofMat, 0.02);
  thRoof.position.set((TH_X0 + TH_X1) / 2, TH_ROOF_Y, 0);
  group.add(thFloor, thBack, thRoof);

  const phCore = new THREE.Group();
  phCore.position.set(PH_OFF_X, AXIS_Y, 0);
  group.add(phCore);
  const rotor = new THREE.Group();
  phCore.add(rotor);

  // HP stage (small diameter — high pressure, low specific volume)
  const hpCase = sectorCase(0.24, 0.24, 0.42, casingMat.clone());
  hpCase.position.x = -0.46;
  const hpLiner = sectorCase(0.218, 0.218, 0.41, linerMat, THREE.DoubleSide);
  hpLiner.position.x = -0.46;
  phCore.add(hpCase, hpLiner);
  [-0.56, -0.4].forEach((x) => {
    const stage = bladeRing(
      { blades: 26, hubR: 0.13, span: 0.09, chord: 0.05, camber: 0.06, twist: 0.8, twistTip: 0.35, hubDepth: 0.06 },
      bladeMat,
    );
    stage.group.rotation.y = Math.PI / 2;
    stage.group.position.x = x;
    rotor.add(stage.group);
  });

  // IP stage (medium diameter)
  const ipCase = sectorCase(0.34, 0.32, 0.42, casingMat.clone());
  ipCase.position.x = 0.0;
  const ipLiner = sectorCase(0.308, 0.288, 0.41, linerMat, THREE.DoubleSide);
  ipLiner.position.x = 0.0;
  phCore.add(ipCase, ipLiner);
  [-0.1, 0.08].forEach((x) => {
    const stage = bladeRing(
      { blades: 24, hubR: 0.15, span: 0.15, chord: 0.07, camber: 0.08, twist: 0.85, twistTip: 0.35, hubDepth: 0.07 },
      bladeMat,
    );
    stage.group.rotation.y = Math.PI / 2;
    stage.group.position.x = x;
    rotor.add(stage.group);
  });

  // LP stage (blades grow toward the exhaust — steam's specific volume rises
  // enormously as pressure drops, so the annulus flares to match)
  const lpTip = [0.36, 0.44, 0.52];
  const lpCase = sectorCase(0.58, 0.4, 0.56, casingMat.clone());
  lpCase.position.x = 0.56;
  const lpLiner = sectorCase(0.548, 0.368, 0.55, linerMat, THREE.DoubleSide);
  lpLiner.position.x = 0.56;
  phCore.add(lpCase, lpLiner);
  lpTip.forEach((tipR, i) => {
    const hubR = 0.16 + i * 0.01;
    const stage = bladeRing(
      { blades: 20, hubR, span: tipR - hubR, chord: 0.09, camber: 0.09, twist: 0.9, twistTip: 0.35, hubDepth: 0.08 },
      bladeMat,
    );
    stage.group.rotation.y = Math.PI / 2;
    stage.group.position.x = 0.32 + i * 0.2;
    rotor.add(stage.group);
  });

  // shaft running the full length, HP through generator
  const shaft = rod(0.045, 2.35, materials.steel(0x8b929c));
  shaft.rotation.z = Math.PI / 2;
  shaft.position.x = -0.62;
  rotor.add(shaft);

  // =========================================================================
  // GENERATOR — rotor poles inside fixed stator windings (Faraday induction)
  // =========================================================================
  const GEN_X = 1.35;
  const GEN_R = 0.42;
  const GEN_LEN = 0.62;
  const genCase = sectorCase(GEN_R, GEN_R, GEN_LEN, casingMat.clone());
  genCase.position.x = GEN_X;
  const genLiner = sectorCase(GEN_R - 0.02, GEN_R - 0.02, GEN_LEN - 0.01, linerMat, THREE.DoubleSide);
  genLiner.position.x = GEN_X;
  phCore.add(genCase, genLiner);
  const capMat = materials.paintedMetal(0x565e69);
  const genCap = new THREE.Mesh(new THREE.CylinderGeometry(GEN_R + 0.02, GEN_R + 0.02, 0.05, 44).rotateZ(Math.PI / 2), capMat);
  genCap.position.x = GEN_X + GEN_LEN / 2;
  phCore.add(genCap);

  const STATOR_COILS = 6;
  const statorCoils = [];
  for (let i = 0; i < STATOR_COILS; i++) {
    const theta = (i / STATOR_COILS) * Math.PI * 2;
    const wound = coil(
      { turns: 5, radius: 0.07, length: GEN_LEN * 0.7, wireRadius: 0.014, segmentsPerTurn: 16 },
      materials.brushedSteel(wireColor),
    );
    wound.mesh.rotation.z = Math.PI / 2;
    wound.mesh.position.set(GEN_X, Math.cos(theta) * (GEN_R - 0.09), Math.sin(theta) * (GEN_R - 0.09));
    phCore.add(wound.mesh);
    const dotMat = materials.glow(POS_COLOR, 0);
    dotMat.transparent = true;
    dotMat.opacity = 0;
    dotMat.depthWrite = false;
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), dotMat);
    dot.position.copy(wound.mesh.position);
    phCore.add(dot);
    statorCoils.push({ theta, dot });
  }

  const rotorCoreMat = materials.brushedSteel(0x9aa2ad);
  rotorCoreMat.roughness = 0.7; // this cylinder is viewed nearly end-on from some steps — near-mirror default clips
  const rotorCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, GEN_LEN * 0.75, 28).rotateZ(Math.PI / 2),
    rotorCoreMat,
  );
  rotorCore.position.x = GEN_X;
  rotor.add(rotorCore);
  const poleN = beveledBox(GEN_LEN * 0.65, 0.11, 0.16, materials.paintedMetal(HOT_N), 0.015);
  poleN.position.set(GEN_X, 0.22, 0);
  const poleS = beveledBox(GEN_LEN * 0.65, 0.11, 0.16, materials.paintedMetal(COOL_S), 0.015);
  poleS.position.set(GEN_X, -0.22, 0);
  rotor.add(poleN, poleS);

  // =========================================================================
  // CONDENSER — shell condenses spent LP steam back to water
  // =========================================================================
  const condenserGroup = new THREE.Group();
  condenserGroup.position.set(1.05, 0.55, 0);
  group.add(condenserGroup);
  const condShell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.26, 0.7, 28).rotateZ(Math.PI / 2),
    materials.paintedMetal(0x3d434b),
  );
  condShell.castShadow = true;
  condenserGroup.add(condShell);
  // tube-bundle end cap: a grid of small dots, cutaway-style
  const tubeEndMat = materials.brushedSteel(0xaab3bf);
  const tubeEndGroup = new THREE.Group();
  for (let ty = -0.16; ty <= 0.16; ty += 0.045) {
    for (let tz = -0.16; tz <= 0.16; tz += 0.045) {
      if (ty * ty + tz * tz > 0.16 * 0.16) continue;
      const d = new THREE.Mesh(new THREE.CircleGeometry(0.012, 8), tubeEndMat);
      d.rotation.y = Math.PI / 2;
      d.position.set(0.351, ty, tz);
      tubeEndGroup.add(d);
    }
  }
  condenserGroup.add(tubeEndGroup);
  for (const fx of [-0.24, 0.24]) {
    const foot = beveledBox(0.08, 0.24, 0.22, concreteDark, 0.01);
    foot.position.set(fx, -0.36, 0);
    condenserGroup.add(foot);
  }

  // feed pump: small pump body between the condenser hotwell and the boiler
  const feedPump = new THREE.Group();
  feedPump.position.set(feedPumpPt[0], feedPumpPt[1], feedPumpPt[2]);
  group.add(feedPump);
  const pumpBody = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.16, 18).rotateZ(Math.PI / 2), materials.paintedMetal(0x445560));
  feedPump.add(pumpBody);
  const pumpMotor = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.14, 16).rotateZ(Math.PI / 2), materials.darkMetal(0x2b3037));
  pumpMotor.position.x = -0.16;
  feedPump.add(pumpMotor);

  // =========================================================================
  // COOLING WATER LOOP — a SEPARATE open circuit, condenser <-> cooling tower
  // =========================================================================
  const CT_X = 2.55;
  const coolOutPt = [1.28, 0.45, -0.12];
  const coolTowerInPt = [CT_X - 0.55, 0.24, -0.08];
  const coolTowerOutPt = [CT_X - 0.55, 0.2, 0.12];
  const coolInPt = [1.28, 0.35, 0.15];
  const coolSegments = [
    [coolOutPt, [1.9, 0.5, -0.15], [2.25, 0.32, -0.1], coolTowerInPt],
    [coolTowerOutPt, [2.25, 0.28, 0.15], [1.9, 0.3, 0.2], coolInPt],
  ];
  const coolChain = chainPath(coolSegments);
  const coolMat = materials.aluminum(0x8fa4ae);
  coolChain.curves.forEach((curve) => {
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.03, 12), coolMat);
    tube.castShadow = true;
    group.add(tube);
  });
  const coolDots = [];
  const coolDotGeo = new THREE.SphereGeometry(0.02, 8, 6);
  const warmCool = new THREE.Color(0x5fb0d8);
  const coldCool = new THREE.Color(0x3f8fc4);
  for (let i = 0; i < 14; i++) {
    const m = materials.glow(0x5fb0d8, 1.1);
    m.transparent = true;
    m.opacity = 0;
    m.depthWrite = false;
    const d = new THREE.Mesh(coolDotGeo, m);
    d.userData.seed = i / 14;
    coolDots.push(d);
    group.add(d);
  }

  // =========================================================================
  // COOLING TOWER — hyperboloid natural-draft shell + rising vapor plume
  // =========================================================================
  const towerProfile = [
    [0.9, 0], [0.78, 0.35], [0.58, 0.95], [0.46, 1.5], [0.42, 1.85], [0.44, 2.1],
    [0.55, 2.55], [0.7, 2.95], [0.82, 3.2],
  ];
  const towerPts = towerProfile.map(([r, y]) => new THREE.Vector2(r, y));
  const towerMesh = new THREE.Mesh(new THREE.LatheGeometry(towerPts, 48), concrete);
  towerMesh.castShadow = true;
  towerMesh.receiveShadow = true;
  towerMesh.position.set(CT_X, 0.14, 0);
  group.add(towerMesh);
  // dark interior liner so the concave shell doesn't mirror the env through the top opening
  const towerLinerPts = towerProfile.map(([r, y]) => new THREE.Vector2(r - 0.03, y));
  const towerLiner = new THREE.Mesh(new THREE.LatheGeometry(towerLinerPts, 48), new THREE.MeshStandardMaterial({ color: 0x1c1e22, roughness: 0.95, side: THREE.BackSide }));
  towerLiner.position.copy(towerMesh.position);
  group.add(towerLiner);

  const vaporPlume = buildPlume(VAPOR_WHITE, 0.3, 10, 1.5);
  vaporPlume.group.position.set(CT_X, 0.14 + 3.2, 0);
  group.add(vaporPlume.group);

  // =========================================================================
  // STEP-UP TRANSFORMER + TRANSMISSION LINES
  // =========================================================================
  const xfmr = new THREE.Group();
  xfmr.position.set(TH_X1 + 0.3, TH_ROOF_Y + 0.12, 0.25);
  group.add(xfmr);
  const tank = beveledBox(0.36, 0.28, 0.24, materials.paintedMetal(0x3d434b), 0.02);
  tank.position.y = 0.14;
  xfmr.add(tank);
  for (let i = -3; i <= 3; i++) {
    const fin = box(0.02, 0.24, 0.03, materials.aluminum(0x9aa2ad));
    fin.position.set(0.2, 0.14, i * 0.035);
    xfmr.add(fin);
  }
  const bushings = [];
  for (const bx of [-0.1, 0.1]) {
    const bushing = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.22, 14), materials.chrome(0xdce6ee));
    bushing.position.set(bx, 0.29 + 0.11, -0.05);
    xfmr.add(bushing);
    bushings.push(bushing);
  }
  const postMat = materials.darkMetal(0x2b3037);
  const postA = rod(0.02, 0.5, postMat);
  postA.position.set(TH_X1 + 0.8, TH_ROOF_Y + 0.12, 0.1);
  const postB = rod(0.02, 0.5, postMat.clone());
  postB.position.set(TH_X1 + 0.8, TH_ROOF_Y + 0.12, -0.15);
  group.add(postA, postB);

  const wireMat = materials.darkMetal(0x1c1e22);
  const wireIn = tubeAlong(
    [
      [TH_X1 - 0.1, TH_ROOF_Y + 0.02, 0.1],
      [TH_X1 + 0.15, TH_ROOF_Y + 0.35, 0.15],
      [bushings[0].position.x + xfmr.position.x, xfmr.position.y + 0.4, xfmr.position.z],
    ],
    0.012,
    wireMat.clone(),
    { tubularSegments: 20 },
  );
  group.add(wireIn);
  const wireOut = tubeAlong(
    [
      [bushings[1].position.x + xfmr.position.x, xfmr.position.y + 0.4, xfmr.position.z],
      [postA.position.x, postA.position.y + 0.5, postA.position.z],
    ],
    0.012,
    wireMat.clone(),
    { tubularSegments: 12 },
  );
  group.add(wireOut);
  const gridLineMat = new THREE.MeshBasicMaterial({ color: 0x8fc4ff, transparent: true, opacity: 0, depthWrite: false });
  const gridLinesGroup = new THREE.Group();
  for (const dz of [0.1, -0.15]) {
    const p0 = dz > 0 ? postA.position : postB.position;
    const line = tubeAlong(
      [
        [p0.x, p0.y + 0.48, p0.z],
        [p0.x + 0.5, p0.y + 0.3, p0.z],
        [3.35, p0.y - 0.1, p0.z],
      ],
      0.008,
      gridLineMat.clone(),
      { tubularSegments: 20 },
    );
    gridLinesGroup.add(line);
  }
  group.add(gridLinesGroup);
  const gridDots = [];
  const gridDotCurve = wireOut.userData.curve;
  for (let i = 0; i < 6; i++) {
    const m = materials.glow(0x8fc4ff, 1.4);
    m.transparent = true;
    m.opacity = 0;
    m.depthWrite = false;
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), m);
    d.userData.seed = i / 6;
    gridDots.push(d);
    group.add(d);
  }

  // =========================================================================
  // CALLOUTS (grouped per step)
  // =========================================================================
  const calloutGroups = { anatomy: [], coal: [], boiler: [], turbine: [], generator: [], condenser: [], grid: [] };
  function tag(which, parent, text, pos, dir, len = 60) {
    const c = callout(text, { dir, len });
    c.position.set(...pos);
    c.visible = false;
    parent.add(c);
    calloutGroups[which].push(c);
    return c;
  }
  tag('anatomy', group, 'Coal yard', [COAL_X, 1.9, 0.15], 100, 56);
  tag('anatomy', group, 'Boiler & stack', [FUR_X0 - 0.1, 3.2, -0.1], 80, 60);
  tag('anatomy', group, 'Turbine hall', [PH_OFF_X, 2.1, 0], 70, 60);
  tag('anatomy', group, 'Condenser', [1.05, 0.9, 0], -40, 70);
  tag('anatomy', group, 'Cooling tower', [CT_X, 2.6, 0], 90, 60);
  tag('anatomy', group, 'Transformer & grid', [xfmr.position.x, xfmr.position.y + 0.5, xfmr.position.z], 50, 60);

  tag('coal', bunker, 'Pulverizer grinds coal to powder', [0, 0.55, 0.1], -30, 100);
  tag('coal', furnaceGroup, 'Burners — chemical energy becomes heat', [burnerA[0] - FUR_X0 + 0.2, 0.5, burnerA[2]], 40, 100);

  tag('boiler', furnaceGroup, 'Waterwall tubes turn water to steam', [FUR_X0 + 0.1, 1.3, -FUR_Z + 0.09], 100, 90);
  tag('boiler', furnaceGroup, 'Steam drum', [(FUR_X0 + FUR_X1) / 2, 2.82, -FUR_Z + 0.14], 60, 70);
  tag('boiler', furnaceGroup, 'Superheater — steam to ~540°C', [FUR_X0 + 0.42, 2.6, -FUR_Z + 0.16], -40, 90);
  tag('boiler', stack, 'Stack — flue gas leaves here', [0, 0.6, -0.1], 60, 60);

  tag('turbine', hpCase, 'High-pressure stage', [0, 0.1, 0.24], -50, 80);
  tag('turbine', ipCase, 'Intermediate-pressure stage', [0, 0.1, 0.34], -30, 90);
  tag('turbine', lpCase, 'Low-pressure stage — blades lengthen as steam expands', [0, 0.1, 0.5], 40, 120);
  tag('turbine', furnaceGroup, 'Reheat: steam returns to the boiler between stages', [FUR_X0 + 0.65, 1.95, FUR_Z - 0.05], 60, 100);

  tag('generator', rotorCore, 'Rotor — spinning magnetic poles', [0, 0.1, 0.15], 30, 100);
  tag('generator', statorCoils[0].dot, 'Stator — induced AC current', [0, 0.15, 0.1], -40, 110);

  tag('condenser', condenserGroup, 'Condenser — steam becomes water again', [-0.1, 0.24, 0.2], -60, 90);
  tag('condenser', towerMesh, 'Cooling tower — a separate water circuit', [0, 2.0, 0.5], 70, 100);
  tag('condenser', feedPump, 'Feed pump returns water to the boiler', [0, 0.2, -0.15], -40, 100);

  tag('grid', tank, 'Step-up transformer', [0.05, 0.3, 0.15], 40, 100);
  tag('grid', postA, 'Transmission lines', [0.1, 0.4, 0], 60, 90);

  // =========================================================================
  // pose / state
  // =========================================================================
  const state = { flow: 0, spin: 0, gridOn: 0 };

  function apply() {
    // main Rankine loop packets
    packetArrows.forEach((a) => {
      const t = (a.userData.seed + state.flow) % 1;
      a.position.copy(chain.getPointAt(t));
      tangent.copy(chain.getTangentAt(t));
      a.quaternion.setFromUnitVectors(UP, tangent);
      colorAt(t, tmpColor);
      a.material.color.copy(tmpColor);
      a.material.emissive.copy(tmpColor);
      a.material.opacity = 0.9;
      const inTurbine = t > b[0] && t < b[6];
      a.scale.setScalar(inTurbine ? 1.1 : 0.85);
    });

    // pulverized coal dust riding the feed pipe
    dustDots.forEach((d) => {
      const t = (d.userData.seed + state.flow * 3) % 1;
      d.position.copy(coalFeedCurve.getPointAt(t));
      d.material.opacity = 0.85 * Math.sin(Math.PI * t);
    });

    // furnace glow: always lit, gently flickering
    const flicker = 0.9 + Math.sin(state.flow * Math.PI * 2 * 9) * 0.1;
    flames.forEach((f) => {
      if (f.isPointLight) f.intensity = 1.2 * flicker;
      else f.material.opacity = 0.55 * flicker;
    });
    waterwallTubes.forEach(({ mat }, i) => {
      const hot = 1 - i / (waterwallTubes.length - 1);
      mat.emissive.setRGB(0.9 * hot, 0.25 * hot, 0.03 * hot);
      mat.emissiveIntensity = 0.8 * hot * flicker;
    });

    // turbine + generator shaft
    rotor.rotation.x = -state.spin;
    statorCoils.forEach(({ theta, dot }) => {
      const rel = Math.cos(theta - state.spin);
      const mag = Math.abs(rel);
      const col = rel >= 0 ? POS_COLOR : NEG_COLOR;
      dot.material.color.set(col);
      dot.material.emissive.set(col);
      dot.material.emissiveIntensity = 0.6 + mag * 1.6;
      dot.material.opacity = 0.25 + mag * 0.7;
    });

    // cooling water loop
    coolDots.forEach((d) => {
      const t = (d.userData.seed + state.flow) % 1;
      d.position.copy(coolChain.getPointAt(t));
      tmpColor.lerpColors(warmCool, coldCool, t < 0.5 ? t * 0.6 : 1 - (t - 0.5) * 0.6);
      d.material.color.copy(tmpColor);
      d.material.emissive.copy(tmpColor);
      d.material.opacity = 0.85;
    });

    // plumes: always present, gentle sway for a sense of life
    fluePlume.meshes.forEach((m, i) => {
      m.material.opacity = m.userData.baseOpacity * 0.85;
      m.position.x = m.userData.jitter + Math.sin(state.flow * Math.PI * 2 * 3 + i) * 0.03;
    });
    vaporPlume.meshes.forEach((m, i) => {
      m.material.opacity = m.userData.baseOpacity;
      m.position.x = m.userData.jitter + Math.sin(state.flow * Math.PI * 2 * 2 + i * 1.3) * (0.04 + i * 0.01);
    });

    gridLineMat.opacity = state.gridOn * 0.7;
    gridDots.forEach((d) => {
      const t = (d.userData.seed + state.flow * 2) % 1;
      d.position.copy(gridDotCurve.getPointAt(t)).add(wireOut.position);
      d.material.opacity = state.gridOn * Math.min(1, t * 6) * Math.min(1, (1 - t) * 6);
    });
  }
  apply();

  return {
    group,
    phases: {
      hpEnd: b[0], hpPass: b[1], reheatEnd: b[2], ipPass: b[3], crossoverEnd: b[4], lpPass: b[5], condenserEnd: b[6],
    },
    set(partial) {
      Object.assign(state, partial);
      apply();
    },
    setLabels(which, v = true) {
      for (const [name, list] of Object.entries(calloutGroups)) {
        const show = v && name === which;
        for (const c of list) c.visible = show;
      }
    },
  };
}
