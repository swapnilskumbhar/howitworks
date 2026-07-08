import * as THREE from 'three';
import { materials, rod, disc, box, chargeQueue, label } from '../../framework/parts.js';
import { beveledBox, lathe, windableRibbon } from '../../framework/geometry.js';
import { callout } from '../../framework/labels.js';

// An aluminum electrolytic capacitor, product-shot staged on a charcoal
// plinth — plus two "peeled" views the steps switch between: the real rolled
// foil inside the can, and an idealized parallel-plate schematic used to
// visualize the invisible physics (Q = CV, the field, the dielectric).
//
// Reference facts (validated against Wikipedia's Capacitor / Aluminum
// electrolytic capacitor articles):
//  - C = εA/d for an ideal parallel plate pair; the dielectric raises C by
//    letting the plates hold more charge at the same voltage (polarization).
//  - A real electrolytic is a long anode foil / paper separator (soaked in
//    electrolyte) / cathode foil sandwich, rolled into a cylinder ("jelly
//    roll") and sealed in an aluminum can with a scored pressure-relief vent
//    on top and a printed polarity stripe (a column of "–") on the sleeve.
//  - Energy stored: W = ½CV² — released in a fast pulse on discharge (the
//    classic camera-flash capacitor use case), unlike a battery's slow drain.
//
// Only ONE of shell / roll / plates is visible at a time (setView), all
// three centered on the same stand so camera moves stay small between steps.

const CAN_R = 0.42;
const DISC_TOP = 0.12;
const LEAD_LEN = 0.22;
const CAN_H = 1.15;
const CAN_BOTTOM_Y = DISC_TOP + LEAD_LEN;
const CAN_TOP_Y = CAN_BOTTOM_Y + CAN_H;
const CENTER_Y = (CAN_BOTTOM_Y + CAN_TOP_Y) / 2;

function sleeveTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#111116';
  ctx.fillRect(0, 0, 512, 320);
  // polarity stripe: a lighter band with a repeating column of minus signs —
  // the standard way electrolytics mark their negative lead.
  const stripeX = 30;
  const stripeW = 74;
  ctx.fillStyle = '#3c3f47';
  ctx.fillRect(stripeX, 0, stripeW, 320);
  ctx.fillStyle = '#eceef2';
  ctx.font = '700 40px sans-serif';
  ctx.textAlign = 'center';
  for (let y = 30; y < 320; y += 44) ctx.fillText('–', stripeX + stripeW / 2, y);
  // printed rating text
  ctx.textAlign = 'left';
  ctx.fillStyle = '#d7dae0';
  ctx.font = '700 46px sans-serif';
  ctx.fillText('220 µF', 168, 140);
  ctx.font = '400 30px sans-serif';
  ctx.fillStyle = '#aeb2ba';
  ctx.fillText('25 V   105°C', 168, 182);
  ctx.font = '400 20px sans-serif';
  ctx.fillStyle = '#787c85';
  ctx.fillText('ALUMINUM ELECTROLYTIC', 168, 214);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildCapacitor({ scene }) {
  const group = new THREE.Group();
  scene.add(group);

  // --- display plinth ---------------------------------------------------
  const baseDisc = disc(0.85, 0.14, materials.paintedMetal(0x24262b));
  baseDisc.position.y = 0.07;
  group.add(baseDisc);

  // =======================================================================
  // SHELL — the real, assembled component
  // =======================================================================
  const shell = new THREE.Group();
  group.add(shell);

  const alum = materials.aluminum(0xc7cdd4);
  // chrome, not the cast-aluminum preset: a real electrolytic's exposed can
  // is drawn sheet aluminum (smooth, shiny), not a blotchy cast-metal finish
  const canMat = materials.chrome(0xc9ced4);
  const sleeveMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: sleeveTexture(),
    roughness: 0.55,
    metalness: 0.0,
    clearcoat: 0.3,
    clearcoatRoughness: 0.4,
  });

  // exposed aluminum can body (sleeve wraps most of it, leaving top/bottom
  // rims bare — exactly how a real electrolytic looks).
  const canBody = new THREE.Mesh(
    new THREE.CylinderGeometry(CAN_R, CAN_R, CAN_H, 48),
    canMat,
  );
  canBody.position.y = CAN_BOTTOM_Y + CAN_H / 2;
  canBody.castShadow = true;
  // dome the top very slightly instead of a hard flat disc edge
  const canCap = new THREE.Mesh(new THREE.SphereGeometry(CAN_R, 48, 12, 0, Math.PI * 2, 0, Math.PI / 2), canMat);
  canCap.scale.y = 0.06;
  canCap.position.y = CAN_TOP_Y;
  shell.add(canBody, canCap);

  const sleeveTopMargin = 0.13;
  const sleeveBottomMargin = 0.11;
  const sleeveH = CAN_H - sleeveTopMargin - sleeveBottomMargin;
  const sleeve = new THREE.Mesh(
    new THREE.CylinderGeometry(CAN_R + 0.004, CAN_R + 0.004, sleeveH, 48, 1, true),
    sleeveMat,
  );
  sleeve.position.y = CAN_BOTTOM_Y + sleeveBottomMargin + sleeveH / 2;
  shell.add(sleeve);

  // scored pressure-relief vent: a shallow "K" groove pressed into the top
  const ventMat = materials.darkMetal(0x2a2d33);
  const groove1 = box(CAN_R * 1.5, 0.012, 0.03, ventMat);
  groove1.position.set(0, CAN_TOP_Y + 0.001, 0);
  const groove2 = groove1.clone();
  groove2.rotation.y = Math.PI / 3;
  const groove3 = groove1.clone();
  groove3.rotation.y = -Math.PI / 3;
  shell.add(groove1, groove2, groove3);

  // status indicator ring near the vent — a subtle "charged" glow used by
  // the resting/ripple steps, not a real capacitor feature.
  const statusMat = new THREE.MeshStandardMaterial({
    color: 0x6ea8ff,
    emissive: 0x6ea8ff,
    emissiveIntensity: 0,
    roughness: 0.4,
  });
  const statusRing = new THREE.Mesh(new THREE.TorusGeometry(CAN_R * 0.4, 0.012, 10, 32), statusMat);
  statusRing.rotation.x = Math.PI / 2;
  statusRing.position.y = CAN_TOP_Y + 0.002;
  shell.add(statusRing);

  // two radial leads, gently bowed outward then straight down to the stand
  const leadMat = materials.chrome(0xd6dae0);
  const leadCurves = [];
  for (const sign of [-1, 1]) {
    const x0 = sign * 0.16;
    const pts = [
      [x0, CAN_BOTTOM_Y, 0],
      [x0 * 1.3, CAN_BOTTOM_Y - LEAD_LEN * 0.55, 0],
      [x0 * 1.35, DISC_TOP, 0],
    ];
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
    const leadMesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.022, 10, false), leadMat);
    leadMesh.castShadow = true;
    shell.add(leadMesh);
    leadCurves.push(curve);
  }

  // --- shell callouts -----------------------------------------------------
  const callouts = [];
  function tag(parent, text, pos, dir, len = 60) {
    const c = callout(text, { dir, len });
    c.position.set(...pos);
    c.visible = false;
    parent.add(c);
    callouts.push(c);
    return c;
  }
  tag(canBody, 'Aluminum can', [CAN_R, CAN_TOP_Y - CAN_BOTTOM_Y - 0.15, 0], 35, 70);
  tag(sleeve, 'Insulating sleeve', [CAN_R, 0.1, 0], 15, 80);
  tag(sleeve, 'Polarity stripe (–)', [CAN_R * 0.3, -0.15, CAN_R * 0.97], -60, 90);
  tag(canCap, 'Pressure-relief vent', [0.1, 0.02, 0], 70, 70);
  tag(shell, 'Leads', [0.22, DISC_TOP + 0.05, 0], -60, 60);

  // =======================================================================
  // ROLL — the real internal construction: anode foil / separator / cathode
  // foil, wound together into the classic "jelly roll".
  // =======================================================================
  const roll = new THREE.Group();
  roll.position.y = CENTER_Y;
  group.add(roll);

  const anodeMat = new THREE.MeshPhysicalMaterial({ color: 0xaeb3ba, metalness: 0.85, roughness: 0.55 });
  const separatorMat = new THREE.MeshPhysicalMaterial({ color: 0xd9c9a0, metalness: 0, roughness: 0.9 });
  const cathodeMat = new THREE.MeshPhysicalMaterial({ color: 0x8b8f96, metalness: 0.8, roughness: 0.5 });

  const ribbonWidth = CAN_H * 0.62;
  const ribbonOpts = { length: 4.6, width: ribbonWidth, turns: 3.4, pitch: 0.1, lengthSegments: 140 };
  const cathodeRibbon = windableRibbon({ ...ribbonOpts, radiusStart: 0.05 }, cathodeMat);
  const sepRibbon1 = windableRibbon({ ...ribbonOpts, radiusStart: 0.065 }, separatorMat);
  const anodeRibbon = windableRibbon({ ...ribbonOpts, radiusStart: 0.08 }, anodeMat);
  const sepRibbon2 = windableRibbon({ ...ribbonOpts, radiusStart: 0.095 }, separatorMat.clone());
  const ribbons = [cathodeRibbon, sepRibbon1, anodeRibbon, sepRibbon2];
  // stagger flat-pose height slightly so unrolled layers don't fully overlap
  ribbons.forEach((r, i) => {
    r.position.y = (i - 1.5) * 0.05;
    roll.add(r);
  });

  // a slim center mandrel the foil winds around, always visible
  const mandrel = rod(0.045, ribbonWidth, materials.darkMetal(0x1c1e22));
  mandrel.position.y = -ribbonWidth / 2;
  roll.add(mandrel);

  tag(anodeRibbon, 'Anode foil (+)', [0.5, ribbonWidth * 0.3, 0], 40, 70);
  tag(cathodeRibbon, 'Cathode foil (–)', [0.5, -ribbonWidth * 0.32, 0], -40, 70);
  tag(sepRibbon1, 'Paper separator + electrolyte', [0.5, 0, 0], 10, 100);

  // =======================================================================
  // PLATES — idealized schematic used to visualize the invisible physics
  // =======================================================================
  const plates = new THREE.Group();
  plates.position.y = CENTER_Y;
  group.add(plates);

  const GAP = 0.34;
  const PLATE_SIZE = 0.68;
  const PLATE_T = 0.045;
  const plateMat = materials.brushedSteel(0xc3cad2);
  const plateTop = beveledBox(PLATE_SIZE, PLATE_T, PLATE_SIZE, plateMat, 0.008);
  plateTop.position.y = GAP / 2 + PLATE_T / 2;
  const plateBottom = beveledBox(PLATE_SIZE, PLATE_T, PLATE_SIZE, plateMat.clone(), 0.008);
  plateBottom.position.y = -GAP / 2 - PLATE_T / 2;
  plates.add(plateTop, plateBottom);

  const dielectricMat = new THREE.MeshPhysicalMaterial({
    color: 0x8fc4ff,
    transparent: true,
    opacity: 0.28,
    roughness: 0.25,
    metalness: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const dielectric = beveledBox(PLATE_SIZE * 0.92, GAP - 0.02, PLATE_SIZE * 0.92, dielectricMat, 0.01);
  plates.add(dielectric);

  // field lines: a grid of thin glowing rods between the plates
  const fieldMat = new THREE.MeshBasicMaterial({
    color: 0x6ea8ff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const fieldLines = [];
  const gridPos = [-0.22, 0, 0.22];
  for (const gx of gridPos) {
    for (const gz of gridPos) {
      const line = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, GAP - 0.03, 6), fieldMat);
      line.position.set(gx, 0, gz);
      fieldLines.push(line);
      plates.add(line);
    }
  }

  // dipole indicators embedded in the dielectric: a tiny red/blue rod pair
  // that tilts randomly at rest and swings upright (aligned with the field)
  // as charge builds — the actual mechanism of dielectric polarization.
  const dipoleGroups = [];
  const dipolePos = [-0.18, 0.18];
  let seed = 1;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (const dx of dipolePos) {
    for (const dz of dipolePos) {
      const dg = new THREE.Group();
      dg.position.set(dx, 0, dz);
      const posEnd = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), materials.glow(0xff6a6a, 0.6));
      posEnd.position.y = 0.055;
      const negEnd = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), materials.glow(0x6ea8ff, 0.6));
      negEnd.position.y = -0.055;
      const stick = rod(0.006, 0.11, materials.darkMetal(0x555a63));
      stick.position.y = -0.055;
      dg.add(stick, posEnd, negEnd);
      dg.userData.rest = (rand() - 0.5) * 1.3;
      plates.add(dg);
      dipoleGroups.push(dg);
    }
  }

  // charge-queue electrons on the external leads feeding the plates
  const plateLeadTopCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.5, GAP / 2 + 0.35, 0),
    new THREE.Vector3(0.2, GAP / 2 + 0.1, 0),
    new THREE.Vector3(0, GAP / 2 + PLATE_T, 0),
  ]);
  const plateLeadBottomCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.5, -GAP / 2 - 0.35, 0),
    new THREE.Vector3(0.2, -GAP / 2 - 0.1, 0),
    new THREE.Vector3(0, -GAP / 2 - PLATE_T, 0),
  ]);
  const leadTopMesh = new THREE.Mesh(
    new THREE.TubeGeometry(plateLeadTopCurve, 20, 0.02, 8),
    leadMat.clone(),
  );
  const leadBottomMesh = new THREE.Mesh(
    new THREE.TubeGeometry(plateLeadBottomCurve, 20, 0.02, 8),
    leadMat.clone(),
  );
  plates.add(leadTopMesh, leadBottomMesh);
  const queueTop = chargeQueue(plateLeadTopCurve, 5, 0x6ea8ff);
  const queueBottom = chargeQueue(plateLeadBottomCurve, 5, 0xff9a5e);
  plates.add(queueTop.group, queueBottom.group);

  // polarity sprite labels that fade in with charge — small, tucked at a
  // back plate corner (label()'s default size reads huge at this schematic's
  // 0.68-unit plate scale; 0.09 keeps it a compact annotation, not a blob)
  const plusLabel = label('+', { color: '#ff6a4a', size: 0.09 });
  plusLabel.position.set(0.26, GAP / 2 + PLATE_T + 0.03, -0.26);
  plusLabel.material.opacity = 0;
  plusLabel.userData.baseScale = plusLabel.scale.clone();
  const minusLabel = label('–', { color: '#5ec8ff', size: 0.09 });
  minusLabel.position.set(0.26, -GAP / 2 - PLATE_T - 0.03, -0.26);
  minusLabel.material.opacity = 0;
  minusLabel.userData.baseScale = minusLabel.scale.clone();
  plates.add(plusLabel, minusLabel);

  // discharge "flash" prop: a tiny bulb wired across the plates for step 6
  const bulbMat = materials.glow(0xfff2c8, 0);
  bulbMat.transparent = true;
  bulbMat.opacity = 0.85;
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), bulbMat);
  bulb.position.set(0.85, 0, 0);
  const bulbLight = new THREE.PointLight(0xfff2c8, 0, 2.4);
  bulbLight.position.copy(bulb.position);
  const wireA = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, GAP / 2 + PLATE_T, 0),
        new THREE.Vector3(0.5, 0.3, 0),
        new THREE.Vector3(0.85, 0.06, 0),
      ]),
      16,
      0.012,
      8,
    ),
    materials.darkMetal(0x2a2d33),
  );
  const wireB = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -GAP / 2 - PLATE_T, 0),
        new THREE.Vector3(0.5, -0.3, 0),
        new THREE.Vector3(0.85, -0.06, 0),
      ]),
      16,
      0.012,
      8,
    ),
    materials.darkMetal(0x2a2d33),
  );
  plates.add(bulb, bulbLight, wireA, wireB);

  tag(plateTop, '+ plate', [PLATE_SIZE / 2, 0, 0], 30, 60);
  tag(plateBottom, '– plate', [PLATE_SIZE / 2, 0, 0], -30, 60);
  tag(dielectric, 'Dielectric', [PLATE_SIZE * 0.4, 0, PLATE_SIZE * 0.4], 45, 80);
  tag(bulb, 'Stored energy, released', [0.08, 0.1, 0], 60, 70);

  // =======================================================================
  // pose / state
  // =======================================================================
  const state = { view: 'assembled', charge: 0, unroll: 0, flash: 0 };

  function apply() {
    shell.visible = state.view === 'assembled';
    roll.visible = state.view === 'roll';
    plates.visible = state.view === 'plates';

    ribbons.forEach((r) => {
      r.morphTargetInfluences[0] = state.unroll;
    });

    const c = state.charge;
    statusMat.emissiveIntensity = 0.15 + 0.85 * c;

    fieldMat.opacity = 0.08 + 0.75 * c;
    queueTop.setFront(c);
    queueBottom.setFront(c);
    plusLabel.material.opacity = Math.max(0, c - 0.05);
    minusLabel.material.opacity = Math.max(0, c - 0.05);
    const signScale = 0.9 + 0.2 * c;
    plusLabel.scale.copy(plusLabel.userData.baseScale).multiplyScalar(signScale);
    minusLabel.scale.copy(minusLabel.userData.baseScale).multiplyScalar(signScale);

    dipoleGroups.forEach((dg) => {
      dg.rotation.z = dg.userData.rest * (1 - c);
    });

    const f = state.flash;
    bulbMat.emissiveIntensity = 0.05 + f * 9;
    bulbMat.opacity = 0.25 + f * 0.6;
    bulbLight.intensity = f * 6;
  }
  apply();

  return {
    group,
    setLabels(v) {
      for (const cc of callouts) cc.visible = v;
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
