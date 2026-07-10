import * as THREE from 'three';
import { materials, rod, box, disc } from '../../framework/parts.js';
import { beveledBox, lathe, tubeAlong, chainPath } from '../../framework/geometry.js';
import { callout } from '../../framework/labels.js';

// "How the internet works" — one HTTPS page load, from tapping a URL on a
// phone over mobile data to the rendered page, traced end to end as a single
// continuous studio landscape running along +X:
//
//   phone -> cell tower -> mobile core / internet gateway
//         -> backbone routers -> undersea fibre -> more routers
//         -> CDN edge data centre  (and all the way back)
//
// with a DNS lookup hierarchy floating above the near shore. This is the
// COMPANION piece to the "phone-call" explainer and deliberately reuses its
// visual language: the same corridor-of-nodes staging, the same cell-tower and
// data-hall builds, the same blue "outbound" / warm "return" packet streams
// riding chainPath curves, and the same expanding radio-wave bursts at the
// antennas. Where the call carries a continuous full-duplex voice stream, the
// internet carries discrete PACKETS on a request/response round trip.
//
// Reference facts (standard TCP/IP + web stack, cross-checked against how DNS,
// TCP, TLS 1.3, BGP routing, CDNs and submarine cables actually work):
//  - Tapping a URL first needs the domain turned into an IP address. The phone
//    asks a RECURSIVE RESOLVER (usually your ISP's, inside the mobile core).
//    If it hasn't CACHED the answer it walks the hierarchy: a ROOT server
//    points it at the TLD server for ".com", which points it at the domain's
//    AUTHORITATIVE nameserver, which returns the IP. (13 root server
//    identities, anycast to hundreds of sites worldwide.)
//  - The request leaves the phone as ENCODED RADIO WAVES to the nearest cell
//    tower (LTE eNodeB / 5G gNB) — the same air interface a call uses, but now
//    carrying IP packets, not voice frames.
//  - BACKHAUL fibre carries it from the tower to the operator's MOBILE CORE
//    (the packet core / EPC / 5GC), whose INTERNET GATEWAY (PGW / UPF) is the
//    door onto the public internet.
//  - ROUTING: the packet hops ROUTER to ROUTER across the backbone. Each router
//    reads the destination IP and forwards it one hop closer, choosing paths
//    that BGP (the Border Gateway Protocol) has advertised between networks.
//    Long-haul legs are FIBRE-OPTIC cable — the request travels as PULSES OF
//    LIGHT at ~2/3 the speed of light in glass (~200,000 km/s) — including
//    SUBMARINE cables that carry ~99% of all intercontinental traffic.
//  - The destination is usually NOT the origin server but a nearby CDN EDGE
//    (content delivery network) node, cached close to you to cut the round trip.
//  - A TCP three-way HANDSHAKE (SYN -> SYN-ACK -> ACK) opens a reliable
//    connection, then a TLS handshake negotiates encryption keys (the padlock)
//    so the page can't be read or tampered with in flight.
//  - The data centre's web SERVER receives the HTTP request; an APPLICATION and
//    a DATABASE build the response (HTML, CSS, JavaScript, images).
//  - The response travels the whole path back: server -> fibre -> core -> tower
//    -> downlink radio -> phone.
//  - The browser PARSES the HTML into a DOM tree, applies the CSS, runs the
//    JavaScript, and paints pixels to the screen — the page appears. The entire
//    round trip is typically a few hundred milliseconds.

// ---------------------------------------------------------------------------
// world layout — one long corridor along +X, near shore on the left, an ocean
// gap in the middle crossed by submarine cable, far shore + data centre right.
// ---------------------------------------------------------------------------
const PHONE_X = -8.2;
const TOWER_X = -5.5;
const CORE_X = -2.9;
const BB1_X = -0.3; // near-shore backbone router (cable landing)
const BB2_X = 3.0; // far-shore backbone router (cable landing)
const DC_X = 5.8; // CDN edge / data centre

const SEA_L = BB1_X + 0.55; // ocean gap edges
const SEA_R = BB2_X - 0.55;

const GROUND_LEFT = PHONE_X - 1.2;
const GROUND_RIGHT = DC_X + 1.3;

const REQ_COLOR = 0x6ec8ff; // "your request" — outbound, the family accent
const RESP_COLOR = 0xffb066; // "the reply" — the returning page, warm
const DNS_COLOR = 0x7cf0c8; // DNS lookup packets — mint, distinct from both
const RF_COLOR = 0xd3f0ff; // radio-wave rings — bright, cool
const SIG_COLOR = 0x8fe6ff; // internal on-board signal dots

function tri(t) {
  return 1 - Math.abs(1 - 2 * t);
}

function wireMat() {
  return new THREE.MeshPhysicalMaterial({ color: 0x1b1d21, metalness: 0.75, roughness: 0.42 });
}
function fibreMat() {
  // buried/undersea fibre — a darker armoured jacket than the copper backhaul
  return new THREE.MeshPhysicalMaterial({ color: 0x14181d, metalness: 0.6, roughness: 0.5 });
}

// Midpoint of a->b lifted by `rise` (arcs radio hops up and over). Negative = sag.
function arc(a, b, rise) {
  return [(a[0] + b[0]) / 2, Math.max(a[1], b[1]) + rise, (a[2] + b[2]) / 2];
}

// One stream of packets riding one or more chained paths. Dots ride each path
// with a whole-number speed multiplier so one phase lap (0->1) returns every
// dot to an identical pose — seamless regardless of apparent speed. `wire`
// draws a thin physical tube (the link itself); pass wire:false for a wireless
// hop where only the packets show. `mat` overrides the default wire material.
function buildStream(paths, {
  radius = 0.012, count = 6, color = REQ_COLOR, size = 0.026, speedMul = 2,
  wire = true, arcRise = 0, mat = null,
} = {}) {
  const group = new THREE.Group();
  const wm = mat || wireMat();
  const chains = [];
  paths.forEach((pts) => {
    const segs = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      segs.push(arcRise !== 0 ? [a, arc(a, b, arcRise), b] : [a, b]);
    }
    const chain = chainPath(segs);
    if (wire) {
      chain.curves.forEach((curve) => {
        const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 44, radius, 10), wm);
        tube.castShadow = true;
        group.add(tube);
      });
    }
    chains.push(chain);
  });

  const dots = [];
  chains.forEach((chain) => {
    for (let i = 0; i < count; i++) {
      const dmat = materials.glow(color, 1.6);
      dmat.transparent = true;
      dmat.opacity = 0;
      dmat.depthWrite = false;
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(size, 10, 8), dmat);
      mesh.userData.seed = i / count;
      mesh.userData.chain = chain;
      group.add(mesh);
      dots.push(mesh);
    }
  });

  function update(phase, amount = 1) {
    dots.forEach((mesh) => {
      const t = (mesh.userData.seed + phase * speedMul) % 1;
      mesh.position.copy(mesh.userData.chain.getPointAt(t));
      const fade = Math.min(1, t * 8) * Math.min(1, (1 - t) * 8);
      mesh.material.opacity = fade * amount;
    });
  }

  return { group, update };
}

// Concentric radio wavefronts expanding from an antenna along `axis`.
function buildRadioBurst(origin, axis, { color = RF_COLOR, rings = 4, maxR = 1.0, tilt = 0 } = {}) {
  const group = new THREE.Group();
  group.position.set(...origin);
  const dir = new THREE.Vector3(...axis).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
  group.quaternion.copy(q);
  const meshes = [];
  for (let i = 0; i < rings; i++) {
    const m = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.012, 6, 40),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
    );
    m.rotation.x = tilt;
    m.userData.seed = i / rings;
    group.add(m);
    meshes.push(m);
  }
  function update(phase, amount = 1) {
    meshes.forEach((m) => {
      const t = (m.userData.seed + phase) % 1;
      const r = 0.04 + t * maxR;
      m.scale.set(r, r, r);
      m.position.z = t * maxR * 0.5;
      m.material.opacity = Math.min(1, t * 6) * (1 - t) * amount;
    });
  }
  return { group, update };
}

// ---------------------------------------------------------------------------
// The phone: a product-shot handset whose SCREEN is the star — it shows the
// browser (a URL bar and the page painting in). A light x-ray reveal ghosts the
// shell to expose the modem + RF + antenna that put the request on the air.
// Built facing +Z, standing on a small plinth.
// ---------------------------------------------------------------------------
function buildPhone() {
  const g = new THREE.Group();
  const W = 0.56;
  const H = 1.14;
  const D = 0.1;
  const PB = 0.08;
  const cy = PB + H / 2;

  const plinth = beveledBox(0.42, 0.06, 0.34, materials.paintedMetal(0x24262b), 0.02);
  plinth.position.y = 0.03;
  g.add(plinth);
  g.add(rod(0.02, PB, materials.chrome(0xbfc4cc), 12));

  const shellMats = [];
  function shell(base) { base.transparent = true; base.depthWrite = true; shellMats.push(base); return base; }

  const frameMat = shell(materials.aluminum(0x2b2e33));
  const railT = 0.055;
  const railV = box(railT, H, D, frameMat);
  const railTop = box(W, railT, D, frameMat);
  [[-W / 2 + railT / 2, cy, 0], [W / 2 - railT / 2, cy, 0]].forEach((p) => { const r = railV.clone(); r.position.set(...p); g.add(r); });
  [[0, cy + H / 2 - railT / 2, 0], [0, cy - H / 2 + railT / 2, 0]].forEach((p) => { const r = railTop.clone(); r.position.set(...p); g.add(r); });

  const back = beveledBox(W - 0.01, H - 0.01, 0.02, shell(materials.paintedMetal(0x1a1c20)), 0.02);
  back.position.set(0, cy, -D / 2 + 0.01);
  g.add(back);

  const glassMat = shell(new THREE.MeshPhysicalMaterial({ color: 0x0a0c10, metalness: 0, roughness: 0.06, clearcoat: 1, transparent: true, opacity: 1 }));
  const glass = beveledBox(W - 0.02, H - 0.02, 0.014, glassMat, 0.02);
  glass.position.set(0, cy, D / 2 - 0.006);
  g.add(glass);

  // ---- screen content: browser chrome + a page that paints in ------------
  // Sits JUST IN FRONT of the (opaque, dark) front glass so the emissive
  // display always reads, instead of being buried behind the glass.
  const screenZ = D / 2 + 0.004;
  const sW = W - 0.08;
  const sTop = cy + H / 2 - 0.1;
  const sBot = cy - H / 2 + 0.09;
  const screen = new THREE.Group();
  g.add(screen);

  // dim backlight panel (always faintly on)
  const bgMat = materials.glow(0x0d1a24, 0.5);
  bgMat.transparent = true;
  const bg = box(sW, H - 0.16, 0.002, bgMat);
  bg.position.set(0, cy, screenZ - 0.001);
  screen.add(bg);

  // URL / address bar with a padlock pip
  const barMat = materials.glow(0x2c4d72, 1.5);
  barMat.transparent = true;
  const bar = beveledBox(sW - 0.02, 0.09, 0.004, barMat, 0.02);
  bar.position.set(0, sTop - 0.02, screenZ);
  screen.add(bar);
  const lockPip = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), materials.glow(0x7cf0c8, 1.6));
  lockPip.position.set(-sW / 2 + 0.06, sTop - 0.02, screenZ + 0.004);
  screen.add(lockPip);
  const urlLine = box(sW - 0.16, 0.016, 0.003, materials.glow(0xbfe4ff, 1.3));
  urlLine.position.set(0.02, sTop - 0.02, screenZ + 0.004);
  screen.add(urlLine);

  // page content blocks (paint in as `paint` -> 1)
  const pageMats = [];
  function pageBlock(y, w, h, color, order) {
    const m = materials.glow(color, 1.3);
    m.transparent = true;
    m.opacity = 0;
    m.userData.order = order;
    pageMats.push(m);
    const b = box(w, h, 0.003, m);
    b.position.set(0, y, screenZ + 0.003);
    screen.add(b);
    return b;
  }
  const py = sTop - 0.14;
  pageBlock(py, sW - 0.04, 0.16, 0x2a6fae, 0.0); // hero image
  pageBlock(py - 0.16, sW - 0.06, 0.02, 0xcfe6ff, 0.25); // title line
  pageBlock(py - 0.21, sW - 0.16, 0.014, 0x9fc6e6, 0.4);
  pageBlock(py - 0.25, sW - 0.1, 0.014, 0x9fc6e6, 0.5);
  pageBlock(py - 0.34, (sW - 0.08) / 2 - 0.01, 0.12, 0x2f7f6a, 0.65); // two cards
  const card2 = pageBlock(py - 0.34, (sW - 0.08) / 2 - 0.01, 0.12, 0x8a5db0, 0.8);
  card2.position.x = (sW - 0.08) / 4 + 0.02;
  screen.children[screen.children.length - 2].position.x = -((sW - 0.08) / 4 + 0.02);
  pageBlock(py - 0.46, sW - 0.06, 0.014, 0x9fc6e6, 0.92);

  // ---- internal board (revealed on x-ray) --------------------------------
  const board = new THREE.Group();
  g.add(board);
  const pcb = beveledBox(W - 0.11, H - 0.18, 0.012, new THREE.MeshPhysicalMaterial({ color: 0x0c3b2c, metalness: 0.2, roughness: 0.55 }), 0.01);
  pcb.position.set(0, cy, -0.01);
  board.add(pcb);
  const chipMat = () => materials.paintedMetal(0x101216);
  function chip(y, w, h, m) {
    const c = beveledBox(w, h, 0.03, m, 0.006);
    c.position.set(0, cy - H / 2 + y, 0.0);
    board.add(c);
    return [c.position.x, c.position.y, 0.03];
  }
  const cpuPt = chip(0.5, 0.2, 0.14, chipMat()); // SoC (browser runs here)
  const modemPt = chip(0.72, 0.18, 0.11, chipMat());
  const rfPt = chip(0.88, 0.12, 0.08, new THREE.MeshPhysicalMaterial({ color: 0xcaa24a, metalness: 1, roughness: 0.35 }));
  const antStrip = box(0.02, 0.2, 0.02, materials.chrome(0xd0d5db));
  antStrip.position.set(W / 2 - 0.055, cy + H / 2 - 0.13, 0.0);
  board.add(antStrip);
  const antTipLocal = [W / 2 - 0.055, cy + H / 2 - 0.02, 0.0];
  const antNub = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), materials.chrome(0xd0d5db));
  antNub.position.set(...antTipLocal);
  board.add(antNub);
  const trace = tubeAlong([cpuPt, modemPt, rfPt, antTipLocal], 0.006, new THREE.MeshBasicMaterial({ color: 0x2f6f5a }), { tubularSegments: 40 });
  board.add(trace);

  return {
    group: g, cy, antTipLocal, cpuPt, modemPt, rfPt, board,
    setReveal(t) {
      const op = 1 - (1 - 0.16) * t;
      for (const m of shellMats) { m.opacity = op; m.depthWrite = t < 0.05; }
      board.visible = t > 0.08;
    },
    // paint: 0 = blank page (URL bar only), 1 = fully rendered page
    setScreen(paint) {
      for (const m of pageMats) {
        const o = m.userData.order;
        m.opacity = Math.max(0, Math.min(1, (paint - o) * 4));
      }
    },
  };
}

// ---------------------------------------------------------------------------
// A cell tower — identical build to the phone-call explainer for family
// consistency: tapered monopole, triangular head with three sector panels, a
// microwave backhaul drum and a base-station cabinet.
// ---------------------------------------------------------------------------
function buildTower() {
  const g = new THREE.Group();
  const mastMat = materials.brushedSteel(0xaab1ba);
  mastMat.roughness = 0.5;
  const H = 2.5;
  g.add(lathe([[0.07, 0], [0.05, H * 0.6], [0.035, H], [0.03, H]], mastMat, 20));
  const headY = H - 0.15;
  const armMat = materials.darkMetal(0x33383f);
  const panelMat = materials.paintedMetal(0xd6dae0);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
    const px = Math.cos(a) * 0.32;
    const pz = Math.sin(a) * 0.32;
    g.add(tubeAlong([[0, headY, 0], [px, headY + 0.05, pz]], 0.02, armMat, { tubularSegments: 4 }));
    const panel = beveledBox(0.09, 0.34, 0.05, panelMat, 0.01);
    panel.position.set(px, headY + 0.05, pz);
    panel.lookAt(px * 3, headY + 0.05, pz * 3);
    g.add(panel);
  }
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), materials.glow(0xff4436, 1.4));
  beacon.position.set(0, H + 0.05, 0);
  g.add(beacon);
  const drum = lathe([[0.001, 0], [0.12, 0.01], [0.13, 0.1], [0.1, 0.14]], materials.paintedMetal(0xc9ced4), 24);
  drum.rotation.z = Math.PI / 2;
  drum.position.set(0.08, H * 0.62, 0);
  g.add(drum);
  const cab = beveledBox(0.36, 0.5, 0.28, materials.paintedMetal(0x3a4048), 0.02);
  cab.position.set(0.36, 0.25, 0.2);
  g.add(cab);
  for (let i = 0; i < 4; i++) {
    const vent = box(0.28, 0.015, 0.005, materials.glow(0x3aa0d0, 0.7));
    vent.position.set(0.36, 0.12 + i * 0.09, 0.34);
    g.add(vent);
  }
  return {
    group: g, height: H, headY,
    antWorld(x, sign) { return [x + sign * 0.34, headY + 0.05, 0]; },
    baseWorld(x) { return [x + 0.36, 0.42, 0.2]; },
  };
}

// ---------------------------------------------------------------------------
// A data hall on a plinth — used for the mobile core AND (scaled up) the CDN
// data centre. `w` sets the width, `racks` the rack count, `accent` the LED
// hue. Returns node-marker world points for callouts.
// ---------------------------------------------------------------------------
function buildHall({ w = 1.8, depth = 1.1, racks = 5, accent = 0x2fb0e0, height = 0.7 } = {}) {
  const g = new THREE.Group();
  const base = beveledBox(w + 0.2, 0.1, depth + 0.2, materials.paintedMetal(0x24262b), 0.03);
  base.position.y = 0.05;
  g.add(base);
  const hall = beveledBox(w, height, depth, materials.paintedMetal(0x2b3038), 0.03);
  hall.position.y = 0.1 + height / 2;
  g.add(hall);
  const cols = [0x2fb0e0, 0x39c07a, 0x2fb0e0, 0xe0b34a, 0x39c07a, accent, 0x39c07a];
  const rackW = 0.28;
  const span = (racks - 1) * (rackW + 0.08);
  for (let r = 0; r < racks; r++) {
    const rx = -span / 2 + r * (rackW + 0.08);
    const rack = beveledBox(rackW, height * 0.8, 0.04, materials.paintedMetal(0x14161a), 0.01);
    rack.position.set(rx, 0.1 + height / 2, depth / 2 + 0.005);
    g.add(rack);
    for (let k = 0; k < 6; k++) {
      const led = box(rackW - 0.08, 0.02, 0.01, materials.glow(cols[r % cols.length], 0.9));
      led.position.set(rx, 0.1 + height * 0.16 + k * (height * 0.11), depth / 2 + 0.03);
      g.add(led);
    }
  }
  return { group: g, topY: 0.1 + height, w, depth };
}

// A backbone router: a low rack box on the ground with a row of glowing port
// LEDs, and a floating octahedron node marker above it (labels attach here).
function buildRouter(accent = 0x6ec8ff) {
  const g = new THREE.Group();
  const body = beveledBox(0.7, 0.34, 0.5, materials.paintedMetal(0x2b3038), 0.02);
  body.position.y = 0.22;
  g.add(body);
  const strip = beveledBox(0.66, 0.14, 0.02, materials.paintedMetal(0x14161a), 0.01);
  strip.position.set(0, 0.22, 0.26);
  g.add(strip);
  for (let i = 0; i < 8; i++) {
    const led = box(0.045, 0.045, 0.01, materials.glow(i % 3 ? accent : 0x39c07a, 1.0));
    led.position.set(-0.28 + i * 0.08, 0.22, 0.28);
    g.add(led);
  }
  const nodeY = 0.85;
  const node = new THREE.Mesh(new THREE.OctahedronGeometry(0.09), materials.glow(accent, 1.3));
  node.position.set(0, nodeY, 0);
  g.add(node);
  g.add((() => { const s = rod(0.006, nodeY - 0.39, materials.chrome(0x9aa0a8), 8); s.position.y = 0.39; return s; })());
  return { group: g, nodeY, node };
}

// ===========================================================================
export function buildInternet({ scene }) {
  const group = new THREE.Group();
  scene.add(group);

  // GROUND — two landmasses (near + far shore) with an ocean gap between them.
  const landMat = new THREE.MeshStandardMaterial({ color: 0x1c1e22, roughness: 0.9 });
  const nearW = SEA_L - GROUND_LEFT;
  const near = beveledBox(nearW, 0.16, 2.8, landMat, 0.03);
  near.position.set(GROUND_LEFT + nearW / 2, -0.08, 0);
  group.add(near);
  const farW = GROUND_RIGHT - SEA_R;
  const far = beveledBox(farW, 0.16, 2.8, landMat.clone(), 0.03);
  far.position.set(SEA_R + farW / 2, -0.08, 0);
  group.add(far);

  // ocean — a translucent sheet filling the gap, its top at y≈0 so the cable
  // visibly plunges beneath it.
  const seaW = SEA_R - SEA_L;
  const seaMat = new THREE.MeshPhysicalMaterial({ color: 0x123a52, metalness: 0, roughness: 0.15, transmission: 0.6, transparent: true, opacity: 0.7, depthWrite: false });
  const sea = new THREE.Mesh(new THREE.BoxGeometry(seaW, 0.02, 2.8), seaMat);
  sea.position.set((SEA_L + SEA_R) / 2, -0.01, 0);
  sea.renderOrder = 2;
  group.add(sea);
  // sea floor
  const floor = box(seaW, 0.04, 2.8, new THREE.MeshStandardMaterial({ color: 0x0c1418, roughness: 1 }));
  floor.position.set((SEA_L + SEA_R) / 2, -0.82, 0);
  group.add(floor);

  // --- PHONE ---------------------------------------------------------------
  const phone = buildPhone();
  phone.group.position.set(PHONE_X, 0, 0);
  group.add(phone.group);
  phone.setReveal(0);
  const antWorld = [PHONE_X + phone.antTipLocal[0], phone.antTipLocal[1], phone.antTipLocal[2]];
  const screenWorld = [PHONE_X, phone.cy + 0.2, 0.1];

  // --- TOWER ---------------------------------------------------------------
  const tower = buildTower();
  tower.group.position.set(TOWER_X, 0, 0);
  group.add(tower.group);
  const towerToPhone = tower.antWorld(TOWER_X, -1);
  const towerBase = tower.baseWorld(TOWER_X);

  // --- MOBILE CORE / INTERNET GATEWAY --------------------------------------
  const core = buildHall({ w: 1.5, depth: 1.0, racks: 4, accent: 0x6ec8ff, height: 0.66 });
  core.group.position.set(CORE_X, 0, 0);
  group.add(core.group);
  const coreIn = [CORE_X - core.w / 2 - 0.1, 0.5, 0.3];
  const coreOut = [CORE_X + core.w / 2 + 0.1, 0.5, 0.3];
  const coreTop = [CORE_X, core.topY + 0.15, 0];
  // gateway node marker above the core
  const gwNode = new THREE.Mesh(new THREE.OctahedronGeometry(0.09), materials.glow(0x8fe6ff, 1.3));
  gwNode.position.set(CORE_X + 0.45, core.topY + 0.4, 0);
  group.add(gwNode);
  group.add((() => { const s = rod(0.006, 0.4, materials.chrome(0x9aa0a8), 8); s.position.set(CORE_X + 0.45, core.topY, 0); return s; })());

  // --- BACKBONE ROUTERS ----------------------------------------------------
  const r1 = buildRouter(0x6ec8ff);
  r1.group.position.set(BB1_X, 0, 0.3);
  group.add(r1.group);
  const r2 = buildRouter(0x8fe6ff);
  r2.group.position.set(BB2_X, 0, 0.3);
  group.add(r2.group);
  const bb1 = [BB1_X, r1.nodeY, 0.3];
  const bb2 = [BB2_X, r2.nodeY, 0.3];

  // cable landing points + the submarine dip
  const landA = [SEA_L, 0.02, 0.3];
  const seaDip = [(SEA_L + SEA_R) / 2, -0.62, 0.3];
  const landB = [SEA_R, 0.02, 0.3];
  // small landing-station cabinets at the coasts
  [SEA_L - 0.12, SEA_R + 0.12].forEach((x) => {
    const c = beveledBox(0.22, 0.28, 0.22, materials.paintedMetal(0x3a4048), 0.02);
    c.position.set(x, 0.14, 0.3);
    group.add(c);
  });

  // --- DATA CENTRE / CDN EDGE ---------------------------------------------
  const dc = buildHall({ w: 2.2, depth: 1.4, racks: 7, accent: 0xffb066, height: 0.95 });
  dc.group.position.set(DC_X, 0, 0);
  group.add(dc.group);
  const dcIn = [DC_X - dc.w / 2 - 0.1, 0.55, 0.3];
  const dcServer = [DC_X, dc.topY + 0.1, 0.3];
  // CDN-edge node marker (bright, near) + a dim origin marker behind (far)
  const edgeNode = new THREE.Mesh(new THREE.OctahedronGeometry(0.1), materials.glow(0x6ec8ff, 1.4));
  edgeNode.position.set(DC_X - 0.5, dc.topY + 0.42, 0.3);
  group.add(edgeNode);
  group.add((() => { const s = rod(0.006, 0.42, materials.chrome(0x9aa0a8), 8); s.position.set(DC_X - 0.5, dc.topY, 0.3); return s; })());
  const originNode = new THREE.Mesh(new THREE.OctahedronGeometry(0.07), materials.glow(0x556070, 0.7));
  originNode.position.set(DC_X + 0.7, dc.topY + 0.7, -0.6);
  group.add(originNode);
  const originLink = tubeAlong([[DC_X - 0.5, dc.topY + 0.42, 0.3], [DC_X + 0.7, dc.topY + 0.7, -0.6]], 0.006, new THREE.MeshBasicMaterial({ color: 0x3a4450 }), { tubularSegments: 8 });
  group.add(originLink);

  // TLS padlock hovering over the edge node (closes on the handshake step)
  const lock = new THREE.Group();
  const lockBody = beveledBox(0.14, 0.11, 0.05, materials.glow(0x7cf0c8, 0.9), 0.02);
  lock.add(lockBody);
  const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.014, 8, 20, Math.PI), materials.chrome(0xd8f5ea));
  shackle.position.y = 0.055;
  lock.add(shackle);
  lock.position.set(DC_X - 0.5, dc.topY + 0.75, 0.3);
  group.add(lock);

  // --- DNS HIERARCHY (floats above the near shore) -------------------------
  // resolver sits on the core; root -> TLD -> authoritative climb away over the
  // backbone. Mint nodes, distinct from the request/response streams.
  const resolver = [CORE_X + 0.1, core.topY + 0.9, -0.5];
  const rootN = [CORE_X + 1.4, 3.15, -0.7];
  const tldN = [CORE_X + 2.7, 3.45, -0.7];
  const authN = [CORE_X + 3.9, 3.2, -0.7];
  const dnsGroup = new THREE.Group();
  group.add(dnsGroup);
  // Same bright octahedron-marker style as the routers/gateway (those read
  // clearly; the earlier icosahedra rendered as dull grey gems against black).
  // Each node = a glowing solid core + a translucent halo so it reads as a
  // "server" even far out in the empty backbone airspace.
  [[resolver, 0.14], [rootN, 0.16], [tldN, 0.15], [authN, 0.15]].forEach(([p, r]) => {
    const n = new THREE.Mesh(new THREE.OctahedronGeometry(r), materials.glow(DNS_COLOR, 1.7));
    n.position.set(...p);
    dnsGroup.add(n);
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(r * 1.9, 16, 12),
      Object.assign(materials.glow(DNS_COLOR, 0.9), { transparent: true, opacity: 0.16, depthWrite: false }),
    );
    halo.position.set(...p);
    dnsGroup.add(halo);
  });

  // ==========================================================================
  // STREAMS — every leg of the round trip. Request (blue) outbound, response
  // (warm) back, both gated per step by reqAmt / respAmt.
  // ==========================================================================
  const streams = [];
  function stream(paths, opts) { const s = buildStream(paths, opts); group.add(s.group); streams.push(s); return s; }

  // radio hop phone <-> tower (wireless, arched)
  const rfReq = stream([[antWorld, towerToPhone]], { color: REQ_COLOR, count: 4, size: 0.03, speedMul: 3, wire: false, arcRise: 0.55 });
  const rfResp = stream([[towerToPhone, screenWorld]], { color: RESP_COLOR, count: 4, size: 0.03, speedMul: 3, wire: false, arcRise: 0.68 });

  // backhaul tower <-> core (copper/fibre near the ground)
  const bhReq = stream([[towerBase, [TOWER_X + 0.9, 0.16, 0.35], [CORE_X - 1.0, 0.16, 0.35], coreIn]], { color: REQ_COLOR, count: 6, size: 0.024, speedMul: 4, radius: 0.014 });
  const bhResp = stream([[coreIn, [CORE_X - 1.0, 0.1, 0.5], [TOWER_X + 0.9, 0.1, 0.5], towerBase]], { color: RESP_COLOR, count: 6, size: 0.024, speedMul: 4, radius: 0.014 });

  // backbone core -> router1 -> UNDERSEA cable -> router2 -> data centre.
  // Drawn as armoured fibre; the mid legs plunge under the sea as light pulses.
  const bbPath = [coreOut, [CORE_X + 1.1, 0.5, 0.3], bb1, landA, seaDip, landB, bb2, dcIn];
  const bbReq = stream([bbPath], { color: REQ_COLOR, count: 9, size: 0.026, speedMul: 4, radius: 0.014, mat: fibreMat() });
  const bbRespPath = [...bbPath].reverse().map((p) => [p[0], p[1] === 0.5 ? 0.42 : p[1], p[2] + 0.18]);
  const bbResp = stream([bbRespPath], { color: RESP_COLOR, count: 9, size: 0.026, speedMul: 4, radius: 0.012, mat: fibreMat() });

  // TCP/TLS handshake — packets shuttle out to the edge and back (out-and-back
  // chain, so one lap = one round trip). Local to the data-centre link.
  const hsPath = [[CORE_X + 1.1, 0.5, 0.3], bb1, landA, seaDip, landB, bb2, dcIn, bb2, landB, seaDip, landA, bb1, [CORE_X + 1.1, 0.5, 0.3]];
  const handshake = stream([hsPath], { color: 0x7cf0c8, count: 3, size: 0.03, speedMul: 1, wire: false });

  // DNS lookup — resolver climbs the hierarchy and returns the IP (out-and-back)
  const dnsPath = [[CORE_X, core.topY + 0.2, -0.2], resolver, rootN, tldN, authN, tldN, rootN, resolver, [CORE_X, core.topY + 0.2, -0.2]];
  const dns = stream([dnsPath], { color: DNS_COLOR, count: 4, size: 0.026, speedMul: 1, wire: false });

  // internal phone signal (SoC -> modem -> RF -> antenna), shown on reveal
  const inner = buildStream([[phone.cpuPt, phone.modemPt, phone.rfPt, phone.antTipLocal]], { color: SIG_COLOR, count: 4, size: 0.02, speedMul: 2, wire: false });
  phone.group.add(inner.group);

  // radio bursts
  const burstPhone = buildRadioBurst(antWorld, [1, 0.4, 0], { color: REQ_COLOR, maxR: 1.0 });
  group.add(burstPhone.group);
  const burstTower = buildRadioBurst(towerToPhone, [-1, 0.5, 0], { color: RESP_COLOR, maxR: 1.0 });
  group.add(burstTower.group);

  // ==========================================================================
  // CALLOUTS
  // ==========================================================================
  const calloutGroups = { overview: [], tap: [], dns: [], uplink: [], core: [], routing: [], handshake: [], server: [], back: [], render: [] };
  function tag(which, parent, text, pos, dir, len = 90) {
    const c = callout(text, { dir, len });
    c.position.set(...pos);
    c.visible = false;
    parent.add(c);
    calloutGroups[which].push(c);
  }
  const rel = (p, base) => [p[0] - base, p[1], p[2]]; // world->local for a group at (base,0,0)

  tag('overview', phone.group, 'Your phone', [0, 1.35, 0.3], 90, 60);
  tag('overview', tower.group, 'Cell tower', [0, 2.7, 0], 90, 70);
  tag('overview', core.group, 'Mobile core + internet gateway', [0, 1.35, 0.3], 90, 90);
  tag('overview', r1.group, 'Backbone routers', [0, 1.15, 0], 90, 80);
  tag('overview', group, 'Undersea fibre', [(SEA_L + SEA_R) / 2, 0.35, 0.3], 90, 80);
  tag('overview', dc.group, 'Data centre / CDN edge', [0, 1.7, 0.3], 90, 90);

  tag('tap', phone.group, 'You tap a URL into the browser', [0, 1.4, 0.3], 90, 110);
  tag('tap', phone.group, 'The address bar — the site you asked for', [0, phone.cy + 0.35, 0.3], -40, 130);

  tag('dns', dnsGroup, 'Recursive resolver (in the core)', [CORE_X + 0.5, core.topY + 1.15, -0.35], 25, 120);
  tag('dns', dnsGroup, 'Root -> .com TLD -> authoritative server', rel(tldN, 0), 90, 150);
  tag('dns', dnsGroup, 'Name -> IP address (then cached)', rel(rootN, 0), -120, 140);

  tag('uplink', tower.group, 'Uplink radio carries IP packets', [towerToPhone[0] - TOWER_X, towerToPhone[1], 0], 130, 130);
  tag('uplink', tower.group, 'eNodeB / gNB base station', [0, 2.35, 0], 90, 90);
  tag('uplink', tower.group, 'Panel antennas catch the uplink', [0.34, tower.headY + 0.05, 0], 20, 120);

  tag('core', core.group, 'Packet core (EPC / 5GC)', [0, core.topY + 0.25, 0.3], 90, 90);
  tag('core', core.group, 'Internet gateway: the door to the public internet', [0.45, core.topY + 0.55, 0], 40, 150);

  tag('routing', r2.group, 'Router: reads the destination IP, forwards one hop', [0, 1.1, 0], 118, 205);
  tag('routing', group, 'BGP advertises paths between networks', [BB1_X + 0.5, 0.95, 0.3], 42, 115);
  tag('routing', group, 'Undersea cable: the request as pulses of light', [(SEA_L + SEA_R) / 2, -0.3, 0.3], -90, 150);

  tag('handshake', dc.group, 'TCP: SYN -> SYN-ACK -> ACK opens the connection', [-0.5, dc.topY + 0.95, 0.3], 150, 150);
  tag('handshake', dc.group, 'TLS handshake encrypts it — the padlock', [-0.5, dc.topY + 0.5, 0.3], 133, 155);
  tag('handshake', dc.group, 'A nearby CDN edge, not the origin', [0.7, dc.topY + 0.7, -0.6], 168, 110);

  tag('server', dc.group, 'Web server receives the HTTP request', [0, dc.topY + 0.25, 0.3], 90, 130);
  tag('server', dc.group, 'App + database build the HTML, CSS, JS, images', [0, dc.topY + 0.6, 0.3], -35, 170);

  tag('back', tower.group, 'The response retraces the whole path back', [0, 2.7, 0], 90, 130);

  tag('render', phone.group, 'Parse HTML -> DOM, apply CSS, run JavaScript', [0, phone.cy + 0.35, 0.3], -40, 160);
  tag('render', phone.group, 'Pixels painted — the page appears', [0, 1.5, 0.3], 90, 130);

  // ==========================================================================
  // pose / state
  // ==========================================================================
  const state = {
    phase: 0, reqAmt: 1, respAmt: 1, dnsAmt: 0, hsAmt: 0,
    waves: 1, reveal: 0, screen: 0, innerAmt: 0, lock: 0, dnsShow: 0,
  };

  function apply() {
    const ph = state.phase;
    const rq = state.reqAmt;
    const rs = state.respAmt;
    rfReq.update(ph, rq); bhReq.update(ph, rq); bbReq.update(ph, rq);
    rfResp.update(ph, rs); bhResp.update(ph, rs); bbResp.update(ph, rs);
    handshake.update(ph, state.hsAmt);
    dns.update(ph, state.dnsAmt);
    inner.update(ph, state.innerAmt);
    const w = state.waves;
    burstPhone.update(ph, w * rq); burstTower.update(ph, w * rs);
    phone.setReveal(state.reveal);
    phone.setScreen(state.screen);
    // padlock: shackle rotates down/closed as lock -> 1, glow brightens
    shackle.rotation.z = (1 - state.lock) * 0.9;
    lockBody.material.emissiveIntensity = 0.4 + state.lock * 1.3;
    lock.visible = state.lock > 0.02;
    dnsGroup.visible = state.dnsShow > 0.5;
  }
  apply();

  return {
    group,
    set(partial) { Object.assign(state, partial); apply(); },
    setLabels(which, v = true) {
      for (const [name, list] of Object.entries(calloutGroups)) {
        const show = v && name === which;
        for (const c of list) c.visible = show;
      }
    },
    anchors: { phone: PHONE_X, tower: TOWER_X, core: CORE_X, bb1: BB1_X, bb2: BB2_X, dc: DC_X, seaMid: (SEA_L + SEA_R) / 2 },
  };
}
