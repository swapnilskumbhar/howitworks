import * as THREE from 'three';
import { materials, rod, box, disc, arrow, label } from '../../framework/parts.js';

// Slider-crank geometry (all lengths in scene units)
const CRANK_Y = 0.85; // crankshaft center height
const R = 0.34; // crank radius
const L = 0.95; // connecting rod length
const PISTON_R = 0.36;
const PISTON_H = 0.4;
const BORE_R = 0.4;
const HEAD_Y = 2.5; // bottom face of the cylinder head
const VALVE_LIFT = 0.15;

const clamp01 = (t) => Math.min(1, Math.max(0, t));
const deg = (d) => (d * Math.PI) / 180;

// piston wrist-pin height for crank angle θ (radians)
function pistonY(theta) {
  const s = R * Math.sin(theta);
  return CRANK_Y + R * Math.cos(theta) + Math.sqrt(L * L - s * s);
}

// half-sine valve lift inside a [start, end] crank-cycle window (degrees, 0–720)
function lift(cycle, start, end) {
  if (cycle < start || cycle > end) return 0;
  return VALVE_LIFT * Math.sin(Math.PI * ((cycle - start) / (end - start)));
}

export function buildEngine({ scene }) {
  const group = new THREE.Group();
  scene.add(group);

  // --- crankcase (open sides so the crank stays visible) ------------------
  const casing = materials.aluminum(0x30353d);
  const plateL = box(1.5, 1.5, 0.06, casing);
  plateL.position.set(0, 0.8, -0.55);
  const plateR = plateL.clone();
  plateR.position.z = 0.55;
  const base = box(1.9, 0.18, 1.4, materials.grimyAluminum(0x2e333b));
  base.position.y = 0.09;
  group.add(plateL, plateR, base);

  // --- crankshaft ----------------------------------------------------------
  const crank = new THREE.Group();
  crank.position.y = CRANK_Y;
  const steel = materials.brushedSteel(0x9aa2ad);
  const webGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.09, 36);
  webGeo.rotateX(Math.PI / 2);
  for (const z of [-0.16, 0.16]) {
    const web = new THREE.Mesh(webGeo, steel);
    web.castShadow = true;
    web.position.z = z;
    crank.add(web);
  }
  const pinGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.26, 20);
  pinGeo.rotateX(Math.PI / 2);
  const crankPin = new THREE.Mesh(pinGeo, steel);
  crankPin.castShadow = true;
  crankPin.position.y = R;
  crank.add(crankPin);
  const shaftGeo = new THREE.CylinderGeometry(0.11, 0.11, 1.6, 20);
  shaftGeo.rotateX(Math.PI / 2);
  const shaft = new THREE.Mesh(shaftGeo, steel);
  shaft.castShadow = true;
  crank.add(shaft);
  const flywheel = disc(0.55, 0.1, materials.aluminum(0x454b55));
  flywheel.rotation.x = Math.PI / 2;
  flywheel.position.z = 0.9;
  crank.add(flywheel);
  group.add(crank);

  // --- connecting rod ------------------------------------------------------
  const conRod = rod(0.075, L, materials.brushedSteel(0xb4bcc8), 14);
  group.add(conRod);

  // --- piston ---------------------------------------------------------------
  const piston = new THREE.Group();
  const crown = new THREE.Mesh(
    new THREE.CylinderGeometry(PISTON_R, PISTON_R, PISTON_H, 32),
    materials.brushedSteel(0xccd3dd),
  );
  crown.castShadow = true;
  crown.position.y = 0.08;
  const wristPinGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 14);
  wristPinGeo.rotateX(Math.PI / 2);
  const wristPin = new THREE.Mesh(wristPinGeo, steel);
  piston.add(crown, wristPin);
  group.add(piston);

  // --- cylinder (transparent so everything inside reads) -------------------
  const tube = new THREE.Mesh(
    new THREE.CylinderGeometry(BORE_R, BORE_R, 1.05, 40, 1, true),
    materials.glass(0xaac6e8, 0.14),
  );
  tube.position.y = HEAD_Y - 0.525;
  group.add(tube);

  // --- head + valves + spark plug -------------------------------------------
  const head = box(1.35, 0.5, 0.95, materials.aluminum(0x3a4048));
  head.position.y = HEAD_Y + 0.25;
  group.add(head);

  function makeValve(color) {
    const v = new THREE.Group();
    const stem = rod(0.035, 0.62, materials.steel());
    const headDisc = disc(0.13, 0.045, materials.steel(color));
    v.add(stem, headDisc);
    return v;
  }
  const intakeValve = makeValve(0x7fc4ff);
  intakeValve.position.set(-0.19, HEAD_Y, 0);
  const exhaustValve = makeValve(0xffab7a);
  exhaustValve.position.set(0.19, HEAD_Y, 0);
  group.add(intakeValve, exhaustValve);

  const plug = rod(0.045, 0.55, materials.steel(0xe8e2d2));
  plug.position.set(0, HEAD_Y - 0.02, 0);
  const plugTip = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 12, 12),
    materials.glow(0xffc266, 0),
  );
  plugTip.material.transparent = true;
  plugTip.material.opacity = 0;
  plugTip.position.set(0, HEAD_Y - 0.12, 0);
  group.add(plug, plugTip);

  const sparkLight = new THREE.PointLight(0xffb45e, 0, 4);
  sparkLight.position.set(0, HEAD_Y - 0.15, 0);
  group.add(sparkLight);

  // --- ports + flow arrows ---------------------------------------------------
  // ports are see-through so the flow arrows inside stay visible
  const intakePort = rod(0.14, 0.8, materials.glass(0x9fc8ff, 0.3));
  intakePort.position.set(-0.19, HEAD_Y + 0.3, 0);
  intakePort.rotation.z = deg(55);
  const exhaustPort = rod(0.14, 0.8, materials.glass(0xd9b39a, 0.3));
  exhaustPort.position.set(0.19, HEAD_Y + 0.3, 0);
  exhaustPort.rotation.z = deg(-55);
  group.add(intakePort, exhaustPort);

  function makeFlow(color, dir) {
    const flow = new THREE.Group();
    flow.userData.arrows = [];
    for (let i = 0; i < 3; i++) {
      const a = arrow(color, 0.13);
      a.rotation.z = dir > 0 ? deg(-125) : deg(-55);
      flow.userData.arrows.push(a);
      flow.add(a);
    }
    group.add(flow);
    return flow;
  }
  // intake arrows travel down the intake port toward the chamber
  const intakeFlow = makeFlow(0x5ec1ff, +1);
  // exhaust arrows travel up and out the exhaust port
  const exhaustFlow = makeFlow(0xb9b1a6, -1);

  // --- charge (gas volume between piston crown and head) --------------------
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
  group.add(charge);

  // --- labels ----------------------------------------------------------------
  const labels = new THREE.Group();
  const add = (text, x, y) => {
    const s = label(text);
    s.position.set(x, y, 0);
    labels.add(s);
  };
  add('Intake valve', -1.55, 2.85);
  add('Exhaust valve', 1.6, 2.85);
  add('Spark plug', 0, 3.45);
  add('Piston', 1.35, 1.95);
  add('Connecting rod', -1.5, 1.35);
  add('Crankshaft', 1.5, 0.6);
  group.add(labels);
  labels.visible = false;

  const chargeColors = {
    intake: new THREE.Color(0x5ec1ff),
    compressed: new THREE.Color(0x9fe0ff),
    burn: new THREE.Color(0xff8a3d),
    exhaust: new THREE.Color(0x8d939c),
  };

  // Positions every moving part for a crank-cycle angle (0–720°).
  function setCycle(cycleDeg) {
    const cycle = ((cycleDeg % 720) + 720) % 720;
    const theta = deg(cycle); // crank spins continuously

    crank.rotation.z = -theta;

    const pinYNow = pistonY(theta);
    piston.position.y = pinYNow;

    const px = R * Math.sin(theta);
    const py = CRANK_Y + R * Math.cos(theta);
    conRod.position.set(px, py, 0);
    conRod.rotation.z = Math.asin((R * Math.sin(theta)) / L);

    const intakeLift = lift(cycle, 0, 195);
    const exhaustLift = lift(cycle, 525, 720);
    intakeValve.position.y = HEAD_Y - intakeLift;
    exhaustValve.position.y = HEAD_Y - exhaustLift;

    // charge volume between piston crown and head
    const top = pinYNow + 0.28;
    charge.position.y = top;
    charge.scale.y = Math.max(HEAD_Y - top, 0.02);

    // charge appearance per phase
    const mat = charge.material;
    if (cycle < 180) {
      mat.color.copy(chargeColors.intake);
      mat.opacity = 0.5 * clamp01(cycle / 60);
    } else if (cycle < 345) {
      mat.color.lerpColors(chargeColors.intake, chargeColors.compressed, (cycle - 180) / 165);
      mat.opacity = 0.5 + 0.25 * ((cycle - 180) / 165);
    } else if (cycle < 540) {
      mat.color.copy(chargeColors.burn);
      mat.opacity = 0.85 - 0.4 * clamp01((cycle - 375) / 165);
    } else {
      mat.color.lerpColors(chargeColors.burn, chargeColors.exhaust, clamp01((cycle - 540) / 60));
      mat.opacity = 0.5 * (1 - clamp01((cycle - 560) / 160));
    }

    // spark + fireball from just before TDC through early expansion
    const spark = cycle > 345 && cycle < 430 ? Math.sin(Math.PI * ((cycle - 345) / 85)) : 0;
    sparkLight.intensity = spark * 60;
    plugTip.material.opacity = spark;
    plugTip.scale.setScalar(0.6 + spark * 3); // expanding fireball
    if (spark > 0.2) {
      mat.color.lerpColors(chargeColors.burn, new THREE.Color(0xffe6b0), spark);
      mat.opacity = Math.max(mat.opacity, 0.6 + spark * 0.35);
    }

    // flow arrows ride along their ports while the matching valve is open
    const sin55 = Math.sin(deg(55));
    const cos55 = Math.cos(deg(55));
    const flowT = (cycle * 2.2) % 100;
    intakeFlow.userData.arrows.forEach((a, i) => {
      const t = ((flowT + i * 33) % 100) / 100;
      // from the outer end of the intake port (t=0) down to the valve (t=1)
      a.position.set(
        -0.19 - sin55 * 0.75 * (1 - t),
        HEAD_Y + 0.3 + cos55 * 0.75 * (1 - t),
        0,
      );
      a.material.opacity = intakeLift > 0.01 ? 0.9 * Math.sin(Math.PI * t) : 0;
    });
    exhaustFlow.userData.arrows.forEach((a, i) => {
      const t = ((flowT + i * 33) % 100) / 100;
      // from the valve (t=0) up and out of the exhaust port (t=1)
      a.position.set(
        0.19 + sin55 * 0.75 * t,
        HEAD_Y + 0.3 + cos55 * 0.75 * t,
        0,
      );
      a.material.opacity = exhaustLift > 0.01 ? 0.9 * Math.sin(Math.PI * t) : 0;
    });
  }

  setCycle(0);

  return {
    group,
    setCycle,
    setLabels(visible) {
      labels.visible = visible;
    },
  };
}
