import * as THREE from 'three';
import { materials, rod, box, disc, arrow } from '../../framework/parts.js';
import { callout } from '../../framework/labels.js';

// A desk fan: weighted base, stand, motor head that can yaw (oscillate),
// rotor shaft spinning three tilted blades inside a wire guard.
export function buildFan({ scene }) {
  const group = new THREE.Group();
  scene.add(group);

  const base = disc(0.85, 0.16, materials.paintedMetal(0x2e3440));
  base.position.y = 0.08;
  const stand = rod(0.09, 1.3, materials.brushedSteel(0x9aa2ad));
  stand.position.y = 0.16;
  group.add(base, stand);

  // --- head (everything that oscillates) -----------------------------------
  const head = new THREE.Group();
  head.position.y = 1.5;
  group.add(head);

  const motorGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.62, 32);
  motorGeo.rotateX(Math.PI / 2);
  const motor = new THREE.Mesh(motorGeo, materials.paintedMetal(0x3b4252));
  motor.castShadow = true;
  motor.position.z = -0.28;
  head.add(motor);

  // stator: copper ring hint inside the housing
  const statorGeo = new THREE.TorusGeometry(0.24, 0.05, 12, 32);
  const stator = new THREE.Mesh(statorGeo, materials.brushedSteel(0xd08d4a));
  stator.position.z = -0.28;
  head.add(stator);

  // --- rotor: shaft + hub + 3 blades ----------------------------------------
  const rotor = new THREE.Group();
  head.add(rotor);
  const shaftGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.7, 16);
  shaftGeo.rotateX(Math.PI / 2);
  const shaft = new THREE.Mesh(shaftGeo, materials.steel());
  shaft.position.z = -0.1;
  rotor.add(shaft);
  const hubGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.14, 24);
  hubGeo.rotateX(Math.PI / 2);
  const hub = new THREE.Mesh(hubGeo, materials.paintedMetal(0xd8dee9));
  hub.position.z = 0.26;
  rotor.add(hub);

  const bladeMat = materials.paintedMetal(0x88c0d0);
  for (let i = 0; i < 3; i++) {
    const blade = box(0.16, 0.62, 0.02, bladeMat);
    blade.geometry.translate(0, 0.42, 0);
    const holder = new THREE.Group();
    holder.rotation.z = (i * 2 * Math.PI) / 3;
    blade.rotation.y = 0.5; // pitch: this tilt is what pushes air forward
    holder.add(blade);
    holder.position.z = 0.26;
    rotor.add(holder);
  }

  // --- guard cage -------------------------------------------------------------
  const guard = new THREE.Group();
  guard.position.z = 0.26;
  const ringMat = materials.chrome(0xcfd6e0); // fan guards are chromed wire
  for (const [r, z] of [
    [0.82, 0],
    [0.6, 0.16],
    [0.3, 0.26],
  ]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.012, 8, 48), ringMat);
    ring.position.z = z;
    guard.add(ring);
  }
  for (let i = 0; i < 12; i++) {
    const a = (i * 2 * Math.PI) / 12;
    const spoke = rod(0.008, 0.82, ringMat, 6);
    spoke.position.set(0, 0, 0.02);
    spoke.rotation.z = a - Math.PI / 2;
    spoke.rotation.x = -0.18; // slight dome
    guard.add(spoke);
  }
  head.add(guard);

  // oscillation crank peeking out the back of the motor
  const oscCrank = rod(0.035, 0.3, materials.brushedSteel(0xd08d4a));
  oscCrank.position.set(0, -0.05, -0.62);
  oscCrank.rotation.x = Math.PI; // hangs downward, links to the stand
  head.add(oscCrank);

  // --- airflow arrows ------------------------------------------------------
  const airflow = new THREE.Group();
  airflow.userData.arrows = [];
  for (let i = 0; i < 14; i++) {
    const a = arrow(0x8fd3ff, 0.14);
    a.rotation.x = Math.PI / 2; // point along +z (out of the fan)
    a.userData.seed = Math.random();
    a.material.opacity = 0;
    airflow.userData.arrows.push(a);
    airflow.add(a);
  }
  head.add(airflow);

  // --- callout labels ---------------------------------------------------------
  // Static ones live in a group parented to the head so they ride the yaw; the
  // blade label hangs off the rotor hub so its dot rides the spinning rotor.
  const callouts = [];
  const addCallout = (parent, text, pos, dir, len) => {
    const c = callout(text, { dir, len });
    c.position.set(...pos);
    c.visible = false;
    parent.add(c);
    callouts.push(c);
    return c;
  };
  addCallout(head, 'Motor housing', [0, 0.36, -0.28], 120, 66);
  addCallout(head, 'Wire guard', [0.82, 0, 0.28], 20, 56);
  addCallout(hub, 'Pitched blades', [0, 0.42, 0], 60, 60);
  addCallout(head, 'Oscillating head', [0.2, -0.2, -0.1], -45, 72);
  addCallout(group, 'Weighted base', [0.85, 0.1, 0], -25, 60);

  const state = { spin: 0, flow: 0, yaw: 0, airOn: false };

  function apply() {
    rotor.rotation.z = -state.spin;
    head.rotation.y = state.yaw;
    airflow.userData.arrows.forEach((a, i) => {
      const t = (state.flow + a.userData.seed) % 1;
      const ring = 0.15 + 0.55 * ((i % 4) / 3);
      const ang = a.userData.seed * Math.PI * 2 + i;
      a.position.set(Math.cos(ang) * ring, Math.sin(ang) * ring, 0.4 + t * 2.4);
      a.material.opacity = state.airOn ? 0.85 * Math.sin(Math.PI * t) : 0;
    });
  }
  apply();

  return {
    group,
    state,
    // spin in radians, flow phase 0–1, yaw in radians
    set(partial) {
      Object.assign(state, partial);
      apply();
    },
    setLabels(visible) {
      for (const c of callouts) c.visible = visible;
    },
  };
}
