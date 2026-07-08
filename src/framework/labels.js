import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// DOM callout label: anchor dot + hairline leader line + text pill, rendered
// by the stage's CSS2DRenderer — crisp at any DPI, styled by site CSS.
//
// `dir` is the leader direction in screen degrees (0 = right, 90 = up),
// `len` its length in px. Attach to any Object3D — including moving parts;
// the label follows the part's world position.
export function callout(text, { dir = 45, len = 48 } = {}) {
  const root = document.createElement('div');
  root.className = 'callout';
  root.style.pointerEvents = 'none';

  const line = document.createElement('span');
  line.className = 'callout-line';
  line.style.width = `${len}px`;
  line.style.transform = `rotate(${-dir}deg)`;

  const tx = document.createElement('span');
  tx.className = 'callout-text';
  tx.textContent = text;
  const rad = (dir * Math.PI) / 180;
  tx.style.left = `${Math.cos(rad) * len}px`;
  tx.style.top = `${-Math.sin(rad) * len}px`;
  // hang the pill off the line's far end, on whichever side the line points
  tx.style.transform =
    Math.cos(rad) >= 0 ? 'translate(4px, -50%)' : 'translate(calc(-100% - 4px), -50%)';

  root.append(line, tx);
  return new CSS2DObject(root);
}
