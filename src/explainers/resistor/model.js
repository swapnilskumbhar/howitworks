import * as THREE from 'three';
import { materials, disc } from '../../framework/parts.js';
import { tubeAlong } from '../../framework/geometry.js';
import { callout } from '../../framework/labels.js';
import { label } from '../../framework/parts.js';

// An axial through-hole fixed resistor, product-shot staged on a charcoal
// plinth — plus a cutaway "core" view and a side-by-side "compare" schematic
// used to visualize the invisible physics.
//
// Reference facts (validated against Wikipedia's Resistor article):
//  - Construction: an insulating ceramic rod is coated with a thin resistive
//    film (carbon, or metal/NiCr for tighter-tolerance parts), then a HELIX
//    is cut through that coating (laser or grinding wheel) so current must
//    travel a long, narrow spiral path instead of a short fat one. Cutting
//    the helix is literally how the manufacturer dials in R = ρL/A: a finer,
//    tighter-pitched spiral lengthens the path (L) and narrows it (A),
//    raising resistance, on an otherwise identical ceramic blank.
//  - Four painted bands read, starting from the end nearer the bands:
//    1st significant digit, 2nd significant digit, ×multiplier (power of
//    ten), tolerance. This build renders Brown-Black-Red-Gold =
//    1, 0, ×10² (×100), ±5% -> (10)×100 = 1000 Ω = 1 kΩ ±5%, one of the most
//    common resistor values on any board.
//  - Ohm's law, V = IR: at a fixed voltage, a longer/thinner resistive path
//    (higher R) throttles current harder than a shorter/thicker one — same
//    idea as a long thin straw vs. a short fat one restricting a flow.
//  - Power dissipated as heat: P = I²R. A resistor does no mechanical work —
//    every watt it drops leaves as heat through the body, which is why body
//    size (surface area) tracks power rating, not resistance value.

const BODY_LEN = 1.0;
const BODY_R = 0.19;
const BODY_HALF = BODY_LEN / 2;
const BODY_Y = 1.05;
const DISC_TOP = 0.12;
const LEAD_TIP_X = 0.85;

const CORE_COLOR = 0xe6ddc6; // bare ceramic, exposed where the groove cuts through
const FILM_COLOR = 0x33220f; // dark resistive film coating (carbon/metal)

// A helix wrapped around the +X axis, sampled as plain [x,y,z] points —
// consumable directly by tubeAlong() (visual groove) and chainPath()
// (electron path) so both ride the exact same geometry.
function helixPoints(len, rad, turns, yCenter, segs = 220) {
  const pts = [];
  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    const x = -len / 2 + u * len;
    const ang = u * turns * Math.PI * 2;
    pts.push([x, yCenter + Math.cos(ang) * rad, Math.sin(ang) * rad]);
  }
  return pts;
}

// Ceramic core + resistive-film sleeve + cut helical groove — the real
// internal construction, reused for the main resistor's cutaway AND the two
// schematic comparison elements.
function buildElementCore({ len, rad, turns, yCenter }) {
  const group = new THREE.Group();

  const coreMat = new THREE.MeshPhysicalMaterial({ color: CORE_COLOR, roughness: 0.85, metalness: 0 });
  const core = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.78, rad * 0.78, len, 32), coreMat);
  core.rotation.z = Math.PI / 2;
  core.position.y = yCenter;
  core.castShadow = true;
  const capGeo = new THREE.SphereGeometry(rad * 0.78, 24, 12);
  const capL = new THREE.Mesh(capGeo, coreMat);
  capL.scale.x = 0.5;
  capL.position.set(-len / 2, yCenter, 0);
  const capR = new THREE.Mesh(capGeo, coreMat);
  capR.scale.x = 0.5;
  capR.position.set(len / 2, yCenter, 0);
  group.add(core, capL, capR);

  const filmMat = new THREE.MeshPhysicalMaterial({
    color: FILM_COLOR,
    roughness: 0.55,
    metalness: 0.25,
    emissive: 0x000000,
    emissiveIntensity: 0,
  });
  const film = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, len * 0.92, 40, 1, true), filmMat);
  film.rotation.z = Math.PI / 2;
  film.position.y = yCenter;
  group.add(film);

  // Inset from the film sleeve's open rim so the tube's raw terminal
  // cross-section tucks inside the body instead of poking past the dome —
  // capped with small spheres for good measure (no flat cut faces).
  const pts = helixPoints(len * 0.82, rad, turns, yCenter);
  const grooveMat = new THREE.MeshPhysicalMaterial({
    color: CORE_COLOR,
    roughness: 0.7,
    metalness: 0,
    emissive: 0x000000,
    emissiveIntensity: 0,
  });
  const grooveR = Math.max(0.012, rad * 0.09);
  const helixMesh = tubeAlong(pts, grooveR, grooveMat, {
    tubularSegments: 220,
    radialSegments: 6,
  });
  group.add(helixMesh);
  const grooveCapGeo = new THREE.SphereGeometry(grooveR, 12, 8);
  const grooveCapA = new THREE.Mesh(grooveCapGeo, grooveMat);
  grooveCapA.position.set(...pts[0]);
  const grooveCapB = new THREE.Mesh(grooveCapGeo, grooveMat);
  grooveCapB.position.set(...pts[pts.length - 1]);
  group.add(grooveCapA, grooveCapB);

  return { group, filmMat, grooveMat, helixPts: pts };
}

// A pair of tinned leads bowing from the body ends down to the plinth.
function buildLeadPts(half, tipX, yCenter, bottomY) {
  const inPts = [
    [-tipX, bottomY, 0],
    [-(tipX + half) / 2, yCenter - (yCenter - bottomY) * 0.5, 0],
    [-half, yCenter, 0],
  ];
  const outPts = [
    [half, yCenter, 0],
    [(tipX + half) / 2, yCenter - (yCenter - bottomY) * 0.5, 0],
    [tipX, bottomY, 0],
  ];
  return { inPts, outPts };
}

function makeLeadMesh(pts, material) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.017, 10, false), material);
  mesh.castShadow = true;
  return mesh;
}

// Chain three point-lists (lead in / helix / lead out) into one 0..1 path,
// returning both the sampler and the fraction where each segment ends —
// exactly what deciding "is this electron still inside the opaque body"
// needs.
function chainSegments(segments) {
  const curves = segments.map(
    (pts) => new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))),
  );
  const lengths = curves.map((c) => c.getLength());
  const total = lengths.reduce((a, b) => a + b, 0);
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

// Small glowing spheres riding a chain path, distributed by seed i/count and
// advanced by a single phase scalar — a continuous flowing stream rather
// than chargeQueue's single arriving pulse (see air-conditioner's refrigerant
// loop / loudspeaker's sound rings for the same pattern).
function buildFlowDots(count, color) {
  const geo = new THREE.SphereGeometry(0.02, 10, 8);
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

const LEAD_BLUE = new THREE.Color(0x9fd0ff);
const HOT_ORANGE = new THREE.Color(0xff5a30);
const WARM_TAN = new THREE.Color(0xffcf8f);

export function buildResistor({ scene }) {
  const group = new THREE.Group();
  scene.add(group);

  // --- display plinth -------------------------------------------------------
  const baseDisc = disc(0.95, 0.14, materials.paintedMetal(0x24262b));
  baseDisc.position.y = 0.07;
  group.add(baseDisc);

  const leadMat = materials.chrome(0xd6dae0);

  // =========================================================================
  // SHARED FRAME — leads (identical in "assembled" and "core" views)
  // =========================================================================
  const sharedFrame = new THREE.Group();
  group.add(sharedFrame);

  const { inPts: mainLeadIn, outPts: mainLeadOut } = buildLeadPts(BODY_HALF, LEAD_TIP_X, BODY_Y, DISC_TOP);
  sharedFrame.add(makeLeadMesh(mainLeadIn, leadMat), makeLeadMesh(mainLeadOut, leadMat.clone()));

  const mainHelixPts = helixPoints(BODY_LEN * 0.82, BODY_R, 16, BODY_Y);
  const mainChain = chainSegments([mainLeadIn, mainHelixPts, mainLeadOut]);
  const mainDots = buildFlowDots(26, 0x9fd0ff);
  mainDots.forEach((d) => sharedFrame.add(d));

  // =========================================================================
  // ASSEMBLED SKIN — tan ceramic body with the painted 4-band color code
  // =========================================================================
  const bandedBody = new THREE.Group();
  sharedFrame.add(bandedBody);

  const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0xdcc8a0, roughness: 0.6, metalness: 0 });
  const bodyCyl = new THREE.Mesh(new THREE.CylinderGeometry(BODY_R, BODY_R, BODY_LEN * 0.94, 40), bodyMat);
  bodyCyl.rotation.z = Math.PI / 2;
  bodyCyl.position.y = BODY_Y;
  bodyCyl.castShadow = true;
  const bodyCapGeo = new THREE.SphereGeometry(BODY_R, 32, 16);
  const bodyCapL = new THREE.Mesh(bodyCapGeo, bodyMat);
  bodyCapL.scale.x = 0.55;
  bodyCapL.position.set(-BODY_LEN * 0.47, BODY_Y, 0);
  const bodyCapR = new THREE.Mesh(bodyCapGeo, bodyMat);
  bodyCapR.scale.x = 0.55;
  bodyCapR.position.set(BODY_LEN * 0.47, BODY_Y, 0);
  bandedBody.add(bodyCyl, bodyCapL, bodyCapR);

  // Brown-Black-Red-Gold = 1, 0, x100, +/-5% -> 1000 ohm (1 k ohm) +/-5%.
  const BAND_DATA = [
    { color: 0x6b4526, x: -0.3, text: 'Brown = 1st digit (1)' },
    { color: 0x161616, x: -0.18, text: 'Black = 2nd digit (0)' },
    { color: 0xc82a2a, x: -0.06, text: 'Red = multiplier (x100)' },
    { color: 0xcda434, x: 0.28, text: 'Gold = tolerance (+/-5%)' },
  ];
  const bandMeshes = [];
  for (const b of BAND_DATA) {
    const bandMat = new THREE.MeshPhysicalMaterial({
      color: b.color,
      roughness: 0.45,
      metalness: 0,
      emissive: b.color,
      emissiveIntensity: 0,
    });
    const bandMesh = new THREE.Mesh(new THREE.TorusGeometry(BODY_R + 0.003, 0.045, 12, 32), bandMat);
    bandMesh.rotation.y = Math.PI / 2;
    bandMesh.position.set(b.x, BODY_Y, 0);
    bandedBody.add(bandMesh);
    bandMeshes.push(bandMesh);
  }

  // =========================================================================
  // CORE — cutaway: ceramic rod, resistive film, and the cut helical groove
  // =========================================================================
  const mainCore = buildElementCore({ len: BODY_LEN, rad: BODY_R, turns: 16, yCenter: BODY_Y });
  sharedFrame.add(mainCore.group);

  // Sparse "scattering" glints along the helix: electrons colliding with the
  // resistive film's lattice, the microscopic source of both R and heat.
  const glintCount = 7;
  const glints = [];
  for (let i = 0; i < glintCount; i++) {
    const t = 0.5 - 0.5 * Math.cos((i / (glintCount - 1)) * Math.PI); // easing toward mid-body
    const p = new THREE.Vector3(
      -BODY_LEN * 0.42 + t * BODY_LEN * 0.84,
      BODY_Y + BODY_R * 0.55,
      0,
    );
    const glintMat = materials.glow(0xffb060, 0);
    glintMat.transparent = true;
    glintMat.opacity = 0;
    glintMat.depthWrite = false;
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), glintMat);
    glint.position.copy(p);
    glint.userData.seed = i / glintCount;
    mainCore.group.add(glint);
    glints.push(glint);
  }

  // --- callouts --------------------------------------------------------------
  const calloutsGeneral = [];
  const calloutsBand = [];
  function tag(parent, text, pos, dir, len, list) {
    const c = callout(text, { dir, len });
    c.position.set(...pos);
    c.visible = false;
    parent.add(c);
    list.push(c);
    return c;
  }
  tag(bandedBody, 'Ceramic body', [0, BODY_R + 0.02, BODY_R * 0.9], 60, 60, calloutsGeneral);
  tag(sharedFrame, 'Tinned copper lead', [LEAD_TIP_X * 0.55, BODY_Y - 0.35, 0], -55, 66, calloutsGeneral);
  tag(bandedBody, 'Color code bands', [-0.18, BODY_R + 0.05, 0], 100, 60, calloutsGeneral);

  tag(mainCore.group, 'Ceramic core (insulator)', [BODY_LEN * 0.42, BODY_Y - BODY_R * 0.3, BODY_R * 0.3], -70, 62, calloutsGeneral);
  tag(mainCore.group, 'Resistive film (carbon/metal)', [0.35, BODY_Y + BODY_R + 0.03, 0], 55, 78, calloutsGeneral);
  tag(mainCore.group, 'Helical trim groove sets R', [-0.3, BODY_Y + BODY_R + 0.05, 0.05], 105, 88, calloutsGeneral);

  for (const [i, b] of BAND_DATA.entries()) {
    tag(bandMeshes[i], b.text, [0, BODY_R + 0.05, 0], 90, 54, calloutsBand);
  }
  const decodeLabel = label('1 kΩ ±5%', { color: '#f2eefc', size: 0.16 });
  decodeLabel.position.set(-0.03, BODY_Y + BODY_R + 0.22, 0);
  decodeLabel.material.opacity = 0;
  bandedBody.add(decodeLabel);
  calloutsBand.push({ get visible() { return decodeLabel.material.opacity > 0; }, set visible(v) { decodeLabel.material.opacity = v ? 1 : 0; } });

  // =========================================================================
  // COMPARE — Ohm's law schematic: long/thin (higher R) vs short/thick (lower R)
  // =========================================================================
  const compareGroup = new THREE.Group();
  group.add(compareGroup);

  function buildCompareElement({ len, rad, turns, offsetX, dotColor }) {
    const wrap = new THREE.Group();
    wrap.rotation.y = Math.PI / 2;
    wrap.position.set(offsetX, 0, 0);
    compareGroup.add(wrap);

    const half = len / 2;
    const tipX = half + 0.34;
    const core = buildElementCore({ len, rad, turns, yCenter: BODY_Y });
    wrap.add(core.group);

    const { inPts, outPts } = buildLeadPts(half, tipX, BODY_Y, DISC_TOP);
    wrap.add(makeLeadMesh(inPts, leadMat.clone()), makeLeadMesh(outPts, leadMat.clone()));

    const helixPts = helixPoints(len * 0.82, rad, turns, BODY_Y);
    const chain = chainSegments([inPts, helixPts, outPts]);
    const dots = buildFlowDots(16, dotColor);
    dots.forEach((d) => wrap.add(d));

    return { wrap, chain, dots, filmMat: core.filmMat };
  }

  const compareA = buildCompareElement({ len: 1.3, rad: 0.1, turns: 9, offsetX: -0.95, dotColor: 0x9fd0ff });
  const compareB = buildCompareElement({ len: 0.5, rad: 0.3, turns: 4, offsetX: 0.95, dotColor: 0xffd08a });

  tag(compareA.wrap, 'Long & thin path -> higher R -> less current', [0, BODY_Y + 0.16, -0.35], 40, 120, calloutsGeneral);
  tag(compareB.wrap, 'Short & thick path -> lower R -> more current', [0, BODY_Y + 0.34, 0.2], 80, 100, calloutsGeneral);

  // =========================================================================
  // pose / state
  // =========================================================================
  const state = { view: 'assembled', flow: 0, heat: 0, bandPos: -1, compareFlow: 0 };

  function styleDot(dot, t, bounds, hideMiddle, heat) {
    const inHelix = t > bounds[0] && t <= bounds[1];
    let visible = true;
    if (hideMiddle && inHelix) visible = false;
    if (!visible) {
      dot.material.opacity = 0;
      return;
    }
    const base = inHelix ? LEAD_BLUE.clone().lerp(HOT_ORANGE, 0.15 + 0.85 * heat) : LEAD_BLUE;
    dot.material.color.copy(base);
    dot.material.emissive.copy(base);
    dot.material.opacity = inHelix ? 0.7 + 0.3 * heat : 0.85;
  }

  function apply() {
    sharedFrame.visible = state.view !== 'compare';
    compareGroup.visible = state.view === 'compare';
    bandedBody.visible = state.view === 'assembled';
    mainCore.group.visible = state.view === 'core';

    const hideMiddle = state.view !== 'core';
    mainDots.forEach((dot) => {
      const t = (dot.userData.seed + state.flow) % 1;
      dot.position.copy(mainChain.getPointAt(t));
      styleDot(dot, t, mainChain.bounds, hideMiddle, state.heat);
    });

    mainCore.filmMat.emissiveIntensity = state.heat * 1.7;
    mainCore.filmMat.emissive.copy(HOT_ORANGE);
    mainCore.grooveMat.emissiveIntensity = state.heat * 0.8;
    mainCore.grooveMat.emissive.copy(HOT_ORANGE);

    glints.forEach((g) => {
      const phase = (state.flow * 9 - g.userData.seed) % 1;
      const pulse = Math.max(0, Math.sin(Math.PI * ((phase + 1) % 1)));
      g.material.opacity = state.heat * pulse * 0.9;
      g.material.emissiveIntensity = state.heat * pulse * 3.5;
    });

    bandMeshes.forEach((m, i) => {
      const d = Math.abs(i - state.bandPos);
      m.material.emissiveIntensity = Math.max(0, 1 - d * 1.6) * 1.3;
    });

    [compareA, compareB].forEach((el, idx) => {
      const speedMul = idx === 0 ? 1 : 3; // short/thick path: lower R, more current
      el.dots.forEach((dot) => {
        const t = (dot.userData.seed + state.compareFlow * speedMul) % 1;
        dot.position.copy(el.chain.getPointAt(t));
        const inHelix = t > el.chain.bounds[0] && t <= el.chain.bounds[1];
        const base = inHelix ? WARM_TAN.clone().lerp(LEAD_BLUE, 0.4) : LEAD_BLUE;
        dot.material.color.copy(base);
        dot.material.emissive.copy(base);
        dot.material.opacity = 0.7 + 0.3 * (idx === 1 ? 1 : 0);
      });
    });
  }
  apply();

  return {
    group,
    setLabels(v) {
      for (const c of calloutsGeneral) c.visible = v;
    },
    setBandLabels(v) {
      for (const c of calloutsBand) c.visible = v;
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
