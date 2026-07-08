// Capture per-step screenshots of an explainer for visual review.
// The Claude preview tab is compositor-throttled and cannot screenshot;
// this drives a real headless Chromium instead, where rAF runs normally.
//
//   node scripts/review-shots.mjs <explainer-id> [outDir] [port]
//
// Takes TWO shots per step ~1.2s apart (a/b): if a and b are pixel-identical
// the step's loop is frozen — that bug class has shipped before.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const id = process.argv[2];
if (!id) {
  console.error('usage: node scripts/review-shots.mjs <explainer-id> [outDir] [port]');
  process.exit(1);
}
const outDir = resolve(process.argv[3] ?? `review-shots/${id}`);
const port = process.argv[4] ?? '5174';
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('console', (m) => {
  if (m.type() === 'error') console.error(`[page error] ${m.text()}`);
});

await page.goto(`http://localhost:${port}/#/${id}`);
await page.waitForFunction(() => window.__hiw?.stepRuntimes?.length > 0, null, {
  timeout: 20000,
});
// let the env map, first loop and entry animations settle
await page.waitForTimeout(1500);

const steps = await page.evaluate(() =>
  [...document.querySelectorAll('.step')].length,
);
console.log(`${id}: ${steps} steps -> ${outDir}`);

// hero first (step panels come after it)
await page.screenshot({ path: `${outDir}/00-hero.png` });

for (let i = 0; i < steps; i++) {
  await page.evaluate((n) => {
    document.querySelectorAll('.step')[n].scrollIntoView({ block: 'center' });
  }, i);
  await page.waitForTimeout(1900); // camera fly-to + panel fade
  const tag = String(i + 1).padStart(2, '0');
  await page.screenshot({ path: `${outDir}/${tag}-a.png` });
  await page.waitForTimeout(1200); // loop advances between a and b
  await page.screenshot({ path: `${outDir}/${tag}-b.png` });
  console.log(`  step ${i + 1}/${steps} captured`);
}

await browser.close();
console.log('done');
