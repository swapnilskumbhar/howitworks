import * as THREE from 'three';
import { materials, rod, disc } from '../../framework/parts.js';
import { lathe, beveledBox, boltCircle } from '../../framework/geometry.js';
import { callout } from '../../framework/labels.js';

// An electrodynamic loudspeaker driver, product-shot staged on a charcoal
// plinth, cone facing the viewer. Axis is built along +Y (lathe-friendly) then
// the whole driver is tipped to face +Z. The moving assembly — cone, dust cap,
// former, voice coil and the inner spider — pistons back and forth along the
// axis; the magnet, plates, pole piece and basket stay put.
//
// Reference proportions (electrodynamic driver): ferrite ring magnet is the
// heaviest, fixed part; the light voice coil sits in the narrow gap between the
// centre pole piece and the top plate; the spider + surround centre the coil
// and force its travel to stay linear.
export function buildSpeaker({ scene, stage }) {
  const group = new THREE.Group();
  scene.add(group);

  // Cutaway: a world-space clipping plane that removes the near (+X) half of
  // the driver so the buried voice coil / gap / magnet cross-section shows.
  const clipPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0.0);
  if (stage?.renderer) stage.renderer.localClippingEnabled = true;

  // --- display plinth --------------------------------------------------------
  const base = disc(0.7, 0.14, materials.paintedMetal(0x24262b));
  base.position.y = 0.07;
  group.add(base);
  const column = beveledBox(0.5, 1.5, 0.34, materials.paintedMetal(0x2b2e34), 0.04);
  column.position.set(0, 0.9, -0.62);
  column.castShadow = true;
  group.add(column);

  // Everything below is built around +Y, then tipped so the cone faces +Z.
  const driver = new THREE.Group();
  driver.rotation.x = Math.PI / 2; // +Y axis -> +Z (toward viewer)
  driver.position.set(0, 1.4, -0.44);
  group.add(driver);

  // materials -----------------------------------------------------------------
  const coneMat = new THREE.MeshPhysicalMaterial({
    color: 0x2a2d33,
    roughness: 0.92,
    metalness: 0.0,
    sheen: 0.5,
    sheenColor: new THREE.Color(0x6b7076),
    side: THREE.DoubleSide,
  });
  const surroundMat = materials.rubber(0x141518);
  const spiderMat = new THREE.MeshPhysicalMaterial({
    color: 0xb07a2e,
    roughness: 0.95,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });
  const magnetMat = new THREE.MeshPhysicalMaterial({
    color: 0x17181c,
    roughness: 0.78,
    metalness: 0.15,
  });
  const plateMat = materials.brushedSteel(0x9aa1ab);
  const basketMat = materials.aluminum(0x60656d);
  const formerMat = new THREE.MeshStandardMaterial({
    color: 0xb99a63,
    roughness: 0.7,
    metalness: 0.1,
  });
  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xc87e33,
    roughness: 0.45,
    metalness: 0.85,
    emissive: 0xc85a14,
    emissiveIntensity: 0,
  });

  // --- fixed magnet motor structure -----------------------------------------
  // Ferrite ring magnet (big, heavy, fixed).
  const magnetGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.34, 48, 1, false);
  const magnet = new THREE.Mesh(magnetGeo, magnetMat);
  magnet.position.y = 0.17;
  magnet.castShadow = true;
  // punch the centre hole with a dark liner instead of an open bore
  const magHole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 0.35, 32).rotateX(0),
    materials.rubber(0x0d0e10),
  );
  magHole.position.y = 0.17;
  driver.add(magnet, magHole);

  // Back plate + centre pole piece (one steel U-yoke).
  const backPlate = disc(0.96, 0.1, plateMat, 48);
  backPlate.position.y = 0.05;
  const poleGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.62, 40);
  poleGeo.translate(0, 0.31, 0);
  const pole = new THREE.Mesh(poleGeo, plateMat);
  pole.castShadow = true;
  // rounded cap on the pole so it never shows a flat cut face
  const poleCap = new THREE.Mesh(new THREE.SphereGeometry(0.28, 32, 16), plateMat);
  poleCap.scale.y = 0.4;
  poleCap.position.y = 0.62;
  driver.add(backPlate, pole, poleCap);

  // Top plate: the front steel washer. The magnetic gap is the slot between
  // the pole (r 0.28) and this plate's inner bore (r 0.33).
  const topPlate = new THREE.Mesh(
    new THREE.CylinderGeometry(0.96, 0.96, 0.12, 48),
    plateMat,
  );
  topPlate.position.y = 0.45;
  topPlate.castShadow = true;
  const topBore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.33, 0.33, 0.13, 32),
    materials.rubber(0x0d0e10),
  );
  topBore.position.y = 0.45;
  driver.add(topPlate, topBore);

  // --- basket / chassis (fixed) ---------------------------------------------
  // Six struts flaring from the top plate up to the front mounting ring.
  const basket = new THREE.Group();
  const rimY = 1.5;
  const rimR = 1.45;
  for (let i = 0; i < 6; i++) {
    const a = (i * 2 * Math.PI) / 6;
    const strut = beveledBox(0.12, 1.12, 0.05, basketMat, 0.02);
    // place at mid-height, tilt outward from plate rim (0.9) to rim (1.45)
    const midR = (0.9 + rimR) / 2;
    strut.position.set(Math.cos(a) * midR, 1.0, Math.sin(a) * midR);
    strut.lookAt(Math.cos(a) * 0.9, 0.5, Math.sin(a) * 0.9);
    strut.rotateX(Math.PI / 2);
    basket.add(strut);
  }
  // front mounting ring + bolt flange
  const rim = new THREE.Mesh(new THREE.TorusGeometry(rimR, 0.09, 16, 64), basketMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = rimY;
  rim.castShadow = true;
  const flange = boltCircle(8, rimR + 0.02, 0.05, plateMat, 0.05);
  flange.position.y = rimY;
  basket.add(rim, flange);
  driver.add(basket);

  // --- moving assembly -------------------------------------------------------
  const moving = new THREE.Group();
  driver.add(moving);

  // Voice-coil former (bobbin) rising out of the gap up to the cone neck.
  const former = new THREE.Mesh(
    new THREE.CylinderGeometry(0.31, 0.31, 0.78, 40, 1, true),
    formerMat,
  );
  former.position.y = 0.72;
  former.material.side = THREE.DoubleSide;
  moving.add(former);

  // Voice coil: copper winding wrapped around the base of the former, sitting
  // in the magnetic gap.
  const coil = new THREE.Mesh(
    new THREE.CylinderGeometry(0.325, 0.325, 0.2, 40),
    copperMat,
  );
  coil.position.y = 0.42;
  moving.add(coil);

  // Cone: open lathe funnel from the former neck out to the surround.
  const coneProfile = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    coneProfile.push([0.31 + t * (1.32 - 0.31), 1.02 + t * (1.5 - 1.02)]);
  }
  const cone = lathe(coneProfile, coneMat, 64);
  moving.add(cone);

  // Dust cap: dome sealing the top of the former.
  const dustCap = new THREE.Mesh(new THREE.SphereGeometry(0.31, 40, 20), coneMat);
  dustCap.scale.y = 0.55;
  dustCap.position.y = 1.02;
  moving.add(dustCap);

  // Surround: half-torus roll joining the cone lip to the rim.
  const surround = new THREE.Mesh(
    new THREE.TorusGeometry(1.36, 0.1, 20, 64),
    surroundMat,
  );
  surround.rotation.x = Math.PI / 2;
  surround.position.y = 1.5;
  moving.add(surround);

  // Spider: corrugated cloth ring, inner edge on the former, centring the coil.
  const spiderProfile = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const r = 0.32 + t * (0.82 - 0.32);
    const y = 0.6 + Math.sin(t * Math.PI * 5) * 0.03; // corrugations
    spiderProfile.push([r, y]);
  }
  const spider = lathe(spiderProfile, spiderMat, 48);
  moving.add(spider);

  // --- sound waves (radiate along +Y local = +Z world) ----------------------
  const waves = new THREE.Group();
  waves.userData.rings = [];
  const waveMat = new THREE.MeshBasicMaterial({
    color: 0xe0a86a,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  for (let i = 0; i < 4; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.018, 8, 64), waveMat.clone());
    ring.rotation.x = Math.PI / 2;
    ring.userData.seed = i / 4;
    waves.userData.rings.push(ring);
    waves.add(ring);
  }
  driver.add(waves);

  // Cutaway toggle: clip every driver mesh except the sound-wave rings.
  function setCut(v) {
    driver.traverse((o) => {
      if (!o.isMesh || o.parent === waves) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => {
        m.clippingPlanes = v ? [clipPlane] : null;
      });
    });
  }
  setCut(false);

  // --- callouts --------------------------------------------------------------
  const callouts = [];
  function tag(parent, text, pos, dir, len = 60) {
    const c = callout(text, { dir, len });
    c.position.set(...pos);
    c.visible = false;
    parent.add(c);
    callouts.push(c);
    return c;
  }
  tag(cone, 'Cone', [1.0, 1.28, 0], 60, 70);
  tag(dustCap, 'Dust cap', [0, 1.14, 0], 90, 64);
  tag(surround, 'Surround', [1.36, 1.5, 0], 20, 70);
  tag(coil, 'Voice coil', [0.33, 0.42, 0], -10, 90);
  tag(spider, 'Spider', [0.7, 0.6, 0], -35, 64);
  tag(magnet, 'Magnet', [0.9, 0.17, 0], -50, 80);
  tag(basket, 'Basket', [1.2, 1.0, 0], -20, 64);

  const state = { drive: 0, wave: 0, on: false, amp: 0.13 };

  function apply() {
    const exc = Math.sin(state.drive) * state.amp;
    moving.position.y = exc;
    // current in the coil peaks with force (mass-controlled: current ∝ position)
    coil.material.emissiveIntensity = state.on ? 0.2 + Math.abs(Math.sin(state.drive)) * 1.6 : 0;
    waves.userData.rings.forEach((ring) => {
      const t = (state.wave + ring.userData.seed) % 1;
      const R = 0.5 + t * 1.7;
      ring.scale.set(R, R, 1);
      ring.position.y = 1.55 + t * 1.9;
      ring.material.opacity = state.on ? 0.32 * Math.sin(Math.PI * t) : 0;
    });
  }
  apply();

  return {
    group,
    state,
    setLabels(v) {
      for (const c of callouts) c.visible = v;
    },
    setCut,
    // drive: phase in radians (excursion = sin(drive)); wave: 0–1 emit phase
    set(partial) {
      Object.assign(state, partial);
      apply();
    },
  };
}
