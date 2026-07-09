import * as THREE from 'three';
import { materials, rod, disc, arrow } from '../../framework/parts.js';
import { coil, tubeAlong, chainPath } from '../../framework/geometry.js';
import { callout } from '../../framework/labels.js';
import { label } from '../../framework/parts.js';

// A wound-wire inductor, product-shot staged on a charcoal plinth — the real,
// assembled part is a FERRITE TOROID (donut-shaped core, wound with enamelled
// copper wire — the low-EMI-leakage shape almost every switching power supply
// uses); a second "schematic" rig — an enlarged solenoid on a ferrite rod —
// is used to visualize the invisible physics the toroid's closed magnetic
// circuit otherwise hides: the field threading and looping outside a coil,
// the back-EMF spark when that field is forced to collapse, and the energy
// stored in it.
//
// Reference facts (validated against Wikipedia's Inductor / Lenz's law
// articles):
//  - An inductor is a coil of (usually enamelled copper) wire, wound on air,
//    a ferrite rod, or a closed ferrite ring ("toroid"). The ring shape keeps
//    the magnetic field lines in closed loops entirely inside the core —
//    far less stray field/EMI than a rod or air-core coil, whose field must
//    loop back through open space outside the winding.
//  - Right-hand rule: curl the right hand's fingers in the direction
//    conventional current flows around a turn and the thumb points along the
//    field it creates through the coil's axis. Here current is drawn flowing
//    around the winding in the sense that (by that rule) drives the field UP
//    through the coil/ring — reverse the current and the field reverses too.
//  - The defining behaviour: an inductor OPPOSES a CHANGE in current, not the
//    current itself (Lenz's law / Faraday's law): V = L * dI/dt. Ramp current
//    up and a back-EMF appears that fights the rise, which is why current
//    through an inductor can only ramp, never jump. Yank the circuit open and
//    the collapsing field forces that current somewhere anyway — classically
//    across whatever small gap it can jump, the spark/arc that pits switch
//    and relay contacts and is the basis of an ignition coil's high-voltage
//    kick.
//  - Energy stored in the field: W = 1/2 * L * I^2 — released back in that
//    same collapse, not held forever like a battery's chemistry.
//  - A ferromagnetic (ferrite/iron) core multiplies inductance by up to a
//    few thousand times over an air core of the same winding, by
//    concentrating far more flux for the same current.

const DISC_TOP = 0.12;
const CENTER_Y = 1.05;

const WIRE_COLOR = 0xc9853f; // enamelled copper — warm amber-copper gloss
const FERRITE_COLOR = 0x1c1a1f; // dark grey-black ceramic ferrite
const FIELD_COLOR = 0x8fc4ff;
const SPARK_COLOR = 0xfff2c8;

function ferriteMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: FERRITE_COLOR,
    roughness: 0.55,
    metalness: 0.05,
    clearcoat: 0.35,
    clearcoatRoughness: 0.32,
  });
}

function wireMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: WIRE_COLOR,
    roughness: 0.32,
    metalness: 0.55,
    clearcoat: 0.55,
    clearcoatRoughness: 0.22,
  });
}

function buildFlowDots(count, color, size = 0.02) {
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

// Orient a +Y-pointing mesh (a cone from arrow()) along an arbitrary direction.
function orientAlong(mesh, dir) {
  const up = new THREE.Vector3(0, 1, 0);
  const d = dir.clone().normalize();
  mesh.quaternion.setFromUnitVectors(up, d);
}

// A half-ellipse "field line" loop in the vertical plane at azimuth `rot`:
// starts on-axis above the coil, bulges out to radius `rOut`, returns on-axis
// below the coil — exactly how a solenoid/bar-magnet's external field arcs
// from one pole, out and around, into the other.
function fieldArcPoints(halfLen, rOut, rot, segs = 24) {
  const pts = [];
  for (let i = 0; i <= segs; i++) {
    const s = i / segs;
    const r = rOut * Math.sin(Math.PI * s);
    const y = halfLen * Math.cos(Math.PI * s);
    pts.push([Math.cos(rot) * r, y, Math.sin(rot) * r]);
  }
  return pts;
}

export function buildInductor({ scene }) {
  const group = new THREE.Group();
  scene.add(group);

  // --- display plinth ---------------------------------------------------
  const baseDisc = disc(1.0, 0.14, materials.paintedMetal(0x24262b));
  baseDisc.position.y = 0.07;
  group.add(baseDisc);

  const leadMat = materials.chrome(0xd6dae0);
  const rig = new THREE.Group();
  rig.position.y = CENTER_Y;
  group.add(rig);

  // =======================================================================
  // TOROID — the real, assembled component: a ferrite ring wound with wire.
  // =======================================================================
  const toroidGroup = new THREE.Group();
  rig.add(toroidGroup);

  const TOROID_MAJOR_R = 0.5;
  const TOROID_CORE_R = 0.19;
  const TOROID_TURNS = 15;
  const TOROID_WIRE_R = 0.021;
  const TOROID_WINDING_R = TOROID_CORE_R + TOROID_WIRE_R * 1.3;
  const TOROID_SPAN = Math.PI * 2 * 0.93; // small unwound gap keeps both leads apart

  const ferriteRing = new THREE.Mesh(
    new THREE.TorusGeometry(TOROID_MAJOR_R, TOROID_CORE_R, 28, 72),
    ferriteMaterial(),
  );
  ferriteRing.rotation.x = Math.PI / 2;
  ferriteRing.castShadow = true;
  toroidGroup.add(ferriteRing);

  const toroidWinding = coil(
    {
      toroidal: true,
      turns: TOROID_TURNS,
      radius: TOROID_WINDING_R,
      majorRadius: TOROID_MAJOR_R,
      majorSpan: TOROID_SPAN,
      phase: Math.PI / 2 - TOROID_SPAN / 2,
      wireRadius: TOROID_WIRE_R,
      segmentsPerTurn: 18,
    },
    wireMaterial(),
  );
  toroidGroup.add(toroidWinding.mesh);
  // small dome caps so the exposed wire ends read as rounded wire, not a
  // sliced-off tube (no flat cut faces).
  const toroidCapMat = wireMaterial();
  const toroidCapA = new THREE.Mesh(new THREE.SphereGeometry(TOROID_WIRE_R, 10, 8), toroidCapMat);
  toroidCapA.position.set(...toroidWinding.points[0]);
  const toroidCapB = new THREE.Mesh(new THREE.SphereGeometry(TOROID_WIRE_R, 10, 8), toroidCapMat.clone());
  toroidCapB.position.set(...toroidWinding.points[toroidWinding.points.length - 1]);
  toroidGroup.add(toroidCapA, toroidCapB);

  // leads: from the winding's two exposed ends, bowing down to the plinth
  const toroidLeadTipY = DISC_TOP - CENTER_Y;
  function toroidLeadPts(p0) {
    const stanceX = p0[0] * 1.25;
    const stanceZ = p0[2] * 1.25;
    return [
      p0,
      [p0[0] * 1.12, (p0[1] + toroidLeadTipY) * 0.55, p0[2] * 1.12],
      [stanceX, toroidLeadTipY, stanceZ],
    ];
  }
  const toroidLeadInPts = toroidLeadPts(toroidWinding.points[0]);
  const toroidLeadOutPts = toroidLeadPts(toroidWinding.points[toroidWinding.points.length - 1]);
  const toroidLeadIn = tubeAlong(toroidLeadInPts, 0.02, leadMat, { tubularSegments: 20 });
  const toroidLeadOut = tubeAlong(toroidLeadOutPts, 0.02, leadMat.clone(), { tubularSegments: 20 });
  toroidGroup.add(toroidLeadIn, toroidLeadOut);

  // closed internal flux loop — a slim glowing ring buried inside the
  // ferrite, representing the field staying entirely inside the core.
  const closedFluxMat = new THREE.MeshBasicMaterial({
    color: FIELD_COLOR,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const closedFluxRing = new THREE.Mesh(
    new THREE.TorusGeometry(TOROID_MAJOR_R, TOROID_CORE_R * 0.42, 12, 72),
    closedFluxMat,
  );
  closedFluxRing.rotation.x = Math.PI / 2;
  toroidGroup.add(closedFluxRing);
  // three small arrows around the ring tangent to the loop, showing the
  // field's circulation direction inside the core.
  const closedFluxArrows = [];
  for (let i = 0; i < 3; i++) {
    const theta = (i / 3) * Math.PI * 2 + 0.3;
    const p = new THREE.Vector3(Math.cos(theta) * TOROID_MAJOR_R, 0, Math.sin(theta) * TOROID_MAJOR_R);
    const tangent = new THREE.Vector3(-Math.sin(theta), 0, Math.cos(theta));
    const a = arrow(FIELD_COLOR, 0.09);
    a.position.copy(p);
    orientAlong(a, tangent);
    a.material.transparent = true;
    a.material.opacity = 0;
    closedFluxArrows.push(a);
    toroidGroup.add(a);
  }

  const toroidChain = chainPath([toroidLeadInPts.slice().reverse(), toroidWinding.points, toroidLeadOutPts]);
  const toroidDots = buildFlowDots(30, 0xbcd8ff);
  toroidDots.forEach((d) => toroidGroup.add(d));

  // =======================================================================
  // SCHEMATIC — an enlarged solenoid on a ferrite rod, used to visualize the
  // physics a toroid's closed loop otherwise hides: external field, back-EMF,
  // stored energy, and the core's effect on all three.
  // =======================================================================
  const schematicGroup = new THREE.Group();
  rig.add(schematicGroup);

  const SOL_LEN = 0.85;
  const SOL_R = 0.24;
  const SOL_TURNS = 11;
  const SOL_WIRE_R = 0.026;
  const CORE_ROD_R = 0.13;
  const CORE_ROD_LEN = SOL_LEN * 1.2;

  const coreRodMat = ferriteMaterial();
  coreRodMat.transparent = true;
  coreRodMat.depthWrite = false;
  const coreRod = new THREE.Mesh(new THREE.CylinderGeometry(CORE_ROD_R, CORE_ROD_R, CORE_ROD_LEN, 28), coreRodMat);
  const coreRodCapA = new THREE.Mesh(new THREE.SphereGeometry(CORE_ROD_R, 20, 12), coreRodMat);
  coreRodCapA.position.y = CORE_ROD_LEN / 2;
  const coreRodCapB = new THREE.Mesh(new THREE.SphereGeometry(CORE_ROD_R, 20, 12), coreRodMat);
  coreRodCapB.position.y = -CORE_ROD_LEN / 2;
  schematicGroup.add(coreRod, coreRodCapA, coreRodCapB);

  const solenoid = coil(
    { turns: SOL_TURNS, radius: SOL_R, length: SOL_LEN, wireRadius: SOL_WIRE_R, segmentsPerTurn: 22 },
    wireMaterial(),
  );
  schematicGroup.add(solenoid.mesh);
  const solCapMat = wireMaterial();
  const solCapA = new THREE.Mesh(new THREE.SphereGeometry(SOL_WIRE_R, 10, 8), solCapMat);
  solCapA.position.set(...solenoid.points[0]);
  const solCapB = new THREE.Mesh(new THREE.SphereGeometry(SOL_WIRE_R, 10, 8), solCapMat.clone());
  solCapB.position.set(...solenoid.points[solenoid.points.length - 1]);
  schematicGroup.add(solCapA, solCapB);

  const solLeadTipY = DISC_TOP - CENTER_Y;
  function solLeadPts(p0, outward) {
    return [
      p0,
      [p0[0] + outward[0] * 0.35, (p0[1] + solLeadTipY) * 0.55, p0[2] + outward[2] * 0.35],
      [outward[0], solLeadTipY, outward[2]],
    ];
  }
  const solLeadInPts = solLeadPts(solenoid.points[0], [-0.55, 0, -0.15]);
  const solLeadOutPts = solLeadPts(solenoid.points[solenoid.points.length - 1], [0.55, 0, -0.15]);
  const solLeadIn = tubeAlong(solLeadInPts, 0.021, leadMat.clone(), { tubularSegments: 20 });
  const solLeadOut = tubeAlong(solLeadOutPts, 0.021, leadMat.clone(), { tubularSegments: 20 });
  schematicGroup.add(solLeadIn, solLeadOut);

  const solChain = chainPath([solLeadInPts.slice().reverse(), solenoid.points, solLeadOutPts]);
  const solDots = buildFlowDots(26, 0xbcd8ff, 0.024);
  solDots.forEach((d) => schematicGroup.add(d));

  // --- external field arcs: several loops around the azimuth --------------
  const ARC_COUNT = 6;
  const ARC_HALF_LEN = SOL_LEN / 2 + 0.1;
  const ARC_ROUT = SOL_R + 0.36;
  const fieldMat = new THREE.MeshBasicMaterial({
    color: FIELD_COLOR,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const fieldArcs = [];
  const fieldArrows = [];
  for (let i = 0; i < ARC_COUNT; i++) {
    const rot = (i / ARC_COUNT) * Math.PI * 2;
    const pts = fieldArcPoints(ARC_HALF_LEN, ARC_ROUT, rot);
    const arcMesh = tubeAlong(pts, 0.006, fieldMat.clone(), { tubularSegments: 24, radialSegments: 6 });
    schematicGroup.add(arcMesh);
    fieldArcs.push(arcMesh);
    // arrowhead at the arc's outer bulge (s=0.5), tangent to the arc, showing
    // the field looping from the top pole around to the bottom.
    const mid = new THREE.Vector3(...pts[12]);
    const before = new THREE.Vector3(...pts[10]);
    const dir = mid.clone().sub(before);
    const a = arrow(FIELD_COLOR, 0.04);
    a.position.copy(mid);
    orientAlong(a, dir);
    a.material.transparent = true;
    a.material.opacity = 0;
    fieldArrows.push(a);
    schematicGroup.add(a);
  }
  // axial arrow through the coil core: the field direction the right-hand
  // rule predicts from the winding sense / current direction drawn above.
  const axialArrow = arrow(FIELD_COLOR, 0.09);
  axialArrow.position.set(0, 0, 0);
  axialArrow.material.transparent = true;
  axialArrow.material.opacity = 0;
  schematicGroup.add(axialArrow);

  // energy halo: a soft glowing envelope around the coil, sized to read as
  // "stored field energy" — driven non-linearly (current^2) in apply().
  const haloMat = new THREE.MeshBasicMaterial({
    color: FIELD_COLOR,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.BackSide,
  });
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.62, 24, 16), haloMat);
  halo.scale.set(1, SOL_LEN / 1.1, 1);
  schematicGroup.add(halo);

  const energyLabel = label('E = ½ L I²', { color: '#f2eefc', size: 0.16 });
  energyLabel.position.set(0, ARC_HALF_LEN - 0.05, 0);
  energyLabel.material.opacity = 0;
  schematicGroup.add(energyLabel);

  // --- spark-gap fixture: a small demo prop tapped off the top lead -------
  const gapBaseX = 0.46;
  const gapBaseZ = 0.34;
  const gapY0 = SOL_LEN / 2 - 0.02;
  const contactMat = materials.chrome(0xcfd4da);
  const postA = rod(0.02, 0.18, contactMat.clone());
  postA.position.set(gapBaseX, gapY0, gapBaseZ);
  const postB = rod(0.02, 0.18, contactMat.clone());
  postB.position.set(gapBaseX, gapY0 + 0.24, gapBaseZ);
  postB.rotation.x = Math.PI;
  schematicGroup.add(postA, postB);
  const tapWire = tubeAlong(
    [
      solenoid.points[solenoid.points.length - 1],
      [gapBaseX * 0.5, (solenoid.points[solenoid.points.length - 1][1] + gapY0 + 0.18) * 0.5, -0.02],
      [gapBaseX, gapY0 + 0.19, gapBaseZ],
    ],
    0.012,
    leadMat.clone(),
    { tubularSegments: 16 },
  );
  schematicGroup.add(tapWire);
  const sparkMat = materials.glow(SPARK_COLOR, 0);
  sparkMat.transparent = true;
  sparkMat.opacity = 0;
  sparkMat.depthWrite = false;
  const sparkMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.06, 6), sparkMat);
  sparkMesh.position.set(gapBaseX, gapY0 + 0.18, gapBaseZ);
  schematicGroup.add(sparkMesh);
  const sparkLight = new THREE.PointLight(SPARK_COLOR, 0, 1.6);
  sparkLight.position.copy(sparkMesh.position);
  schematicGroup.add(sparkLight);

  // --- callouts (grouped per step, same pattern as transistor's) ----------
  const calloutGroups = {
    anatomy: [],
    field: [],
    back: [],
    energy: [],
    core: [],
    closed: [],
  };
  function tag(which, parent, text, pos, dir, len = 60) {
    const c = callout(text, { dir, len });
    c.position.set(...pos);
    c.visible = false;
    parent.add(c);
    calloutGroups[which].push(c);
    return c;
  }
  tag('anatomy', ferriteRing, 'Ferrite ring core', [0, TOROID_CORE_R + 0.05, TOROID_MAJOR_R * 0.5], 55, 78);
  tag('anatomy', toroidWinding.mesh, 'Enamelled copper winding', [TOROID_MAJOR_R * 0.55, TOROID_CORE_R * 0.6, TOROID_MAJOR_R * 0.55], 30, 100);
  tag('anatomy', toroidLeadOut, 'Leads', [0.05, -0.3, 0], -60, 60);

  tag('field', solenoid.mesh, 'Current in the winding', [SOL_R + 0.05, 0.1, 0], 20, 90);
  tag('field', axialArrow, 'Field through the coil (right-hand rule)', [0.1, 0.28, 0], 75, 120);
  tag('field', fieldArcs[1], 'Field loops back outside', [0, ARC_HALF_LEN * 0.6, ARC_ROUT * 0.6], 45, 120);

  tag('back', sparkMesh, 'Back-EMF: the collapsing field arcs the gap', [0.12, 0.05, 0], 40, 130);
  tag('back', solenoid.mesh, 'Current fights to keep flowing', [0, -0.15, SOL_R + 0.05], -30, 110);

  tag('energy', halo, 'Energy stored in the field, W = ½LI²', [0, 0.35, ARC_ROUT * 0.5], 55, 130);

  tag('core', coreRod, 'Ferrite core multiplies the field', [0, 0.1, CORE_ROD_R + 0.03], 25, 120);

  tag('closed', closedFluxRing, 'Flux stays looped inside the ring', [0, TOROID_CORE_R * 0.5, TOROID_MAJOR_R * 0.7], 50, 120);

  // =======================================================================
  // pose / state
  // =======================================================================
  const state = {
    view: 'toroid',
    current: 0,
    flow: 0,
    coreIn: 1,
    fieldViz: 0,
    spark: 0,
    closedViz: 0,
    showEnergy: false,
  };

  function styleDots(dots, chain, phase, current, color) {
    dots.forEach((dot) => {
      const t = (dot.userData.seed + phase) % 1;
      dot.position.copy(chain.getPointAt(t));
      dot.material.color.set(color);
      dot.material.emissive.set(color);
      dot.material.opacity = Math.max(0, current) * 0.9;
    });
  }

  function apply() {
    toroidGroup.visible = state.view === 'toroid';
    schematicGroup.visible = state.view === 'schematic';

    styleDots(toroidDots, toroidChain, state.flow, state.current, 0xbcd8ff);
    styleDots(solDots, solChain, state.flow, state.current, 0xbcd8ff);

    const coreMul = 0.35 + state.coreIn * 1.4;
    const fieldStrength = Math.max(0, state.current) * coreMul;

    // closed internal flux ring (toroid)
    closedFluxMat.opacity = state.closedViz * (0.15 + 0.7 * fieldStrength);
    closedFluxArrows.forEach((a) => {
      a.material.opacity = state.closedViz * fieldStrength * 0.8;
    });

    // external field arcs / axial arrow (schematic)
    fieldArcs.forEach((m) => {
      m.material.opacity = state.fieldViz * (0.1 + 0.65 * fieldStrength);
    });
    fieldArrows.forEach((a) => {
      a.material.opacity = state.fieldViz * fieldStrength * 0.85;
    });
    axialArrow.material.opacity = state.fieldViz * fieldStrength * 0.9;
    axialArrow.scale.setScalar(0.7 + fieldStrength * 0.5);

    // core rod visibility (air core vs ferrite core)
    coreRodMat.opacity = 0.12 + state.coreIn * 0.85;

    // energy halo — non-linear in current (W = 1/2 L I^2)
    const energy = Math.max(0, state.current) * Math.max(0, state.current) * coreMul;
    haloMat.opacity = state.showEnergy ? Math.min(0.4, 0.03 + energy * 0.5) : 0;
    energyLabel.material.opacity = state.showEnergy ? Math.min(1, energy * 3) : 0;

    // spark
    sparkMat.emissiveIntensity = 0.1 + state.spark * 9;
    sparkMat.opacity = state.spark * 0.95;
    sparkLight.intensity = state.spark * 5;
  }
  apply();

  return {
    group,
    setLabels(which, v = true) {
      for (const [name, list] of Object.entries(calloutGroups)) {
        const show = v && name === which;
        for (const c of list) c.visible = show;
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
