// Render an explainer to video by driving a virtualized clock frame-by-frame.
//
//   node scripts/export-video.mjs <explainer-id> [--format short|long] [--port 5199]
//                                 [--fps 30] [--out renders] [--keep-frames]
//
// How it works: every animation in the app (anime.js engine, three's
// setAnimationLoop, camera fly-tos) is driven by requestAnimationFrame +
// performance.now. We stub both in the page with a manual clock, advance it
// exactly 1000/fps ms per captured frame, and screenshot each frame — the
// result is deterministic and perfectly smooth regardless of render cost.
//
// The shot list comes from src/explainers/<id>/video.js (editorial layer:
// which steps, how long, captions, narration). Falls back to "every step,
// 8s each" when video.js doesn't exist yet.
//
// Output (renders/<id>/):
//   <format>-master.mp4    silent, no captions — the reusable master
//   <format>-captioned.mp4 captions burned in (skipped if no captions)
//   <format>-final.mp4     captioned + narration/sfx mixed (skipped if no audio)
//   <format>-timeline.json shot → [start,end] seconds, for audio/caption sync
import { chromium } from 'playwright';
import { mkdirSync, rmSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ffmpeg = require('ffmpeg-static');

// --- args --------------------------------------------------------------
const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith('--'));
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : dflt;
};
if (!id) {
  console.error('usage: node scripts/export-video.mjs <explainer-id> [--format short|long] [--port 5199] [--fps 30]');
  process.exit(1);
}
const format = opt('format', 'long'); // short = 9:16 vertical, long = 16:9
const port = opt('port', '5199');
const fps = Number(opt('fps', '24')); // 24 = cinematic and 20% fewer frames
const outRoot = resolve(opt('out', 'renders'), id);
const keepFrames = args.includes('--keep-frames');

const viewport =
  format === 'short'
    ? { width: 1080, height: 1920 }
    : { width: 1920, height: 1080 };

// --- editorial layer (video.js) -----------------------------------------
const videoJsPath = resolve(`src/explainers/${id}/video.js`);
let editorial = null;
if (existsSync(videoJsPath)) {
  editorial = (await import(pathToFileURL(videoJsPath))).default;
  console.log(`editorial: ${videoJsPath}`);
} else {
  console.log('editorial: none (video.js missing) — rendering every step, 8s each');
}

// --- launch page with virtual clock --------------------------------------
const framesDir = join(outRoot, `${format}-frames`);
rmSync(framesDir, { recursive: true, force: true });
mkdirSync(framesDir, { recursive: true });

// Real GPU in headless: without these flags Chromium renders WebGL on
// SwiftShader (CPU) and frames cost ~1s each; with the GPU they're ~5-10x faster.
const browser = await chromium.launch({
  args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-webgl'],
});
const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
page.on('console', (m) => {
  if (m.type() === 'error') console.error(`[page error] ${m.text()}`);
});

// Must be installed before any page script runs: replace the clock the whole
// app animates on. Real timers (setTimeout/Interval) stay real — they only
// gate boot/loading, not animation.
await page.addInitScript(() => {
  let now = 0;
  let cbs = [];
  let nextId = 1;
  const t0 = Date.now();
  performance.now = () => now;
  Date.now = () => t0 + now;
  window.requestAnimationFrame = (cb) => {
    const id = nextId++;
    cbs.push({ id, cb });
    return id;
  };
  window.cancelAnimationFrame = (id) => {
    cbs = cbs.filter((e) => e.id !== id);
  };
  window.__vt = {
    advance(ms) {
      now += ms;
      const due = cbs;
      cbs = [];
      for (const e of due) e.cb(now);
    },
    now: () => now,
  };
});

// The first shot's dolly must exist BEFORE the player boots: boot flies to
// the first step immediately, and re-activating the same step is a no-op.
const baseDolly = format === 'short' ? Number(editorial?.short?.dolly ?? 1.35) : 1;
const firstDolly = editorial?.[format]?.shots?.[0]?.dolly ?? baseDolly;
await page.addInitScript((v) => { window.__hiwCameraScale = v; }, firstDolly);

await page.goto(`http://localhost:${port}/#/${id}`);
// generous: a cold vite server compiles three.js + the explainer chunk on first hit
await page.waitForFunction(() => window.__hiw?.stepRuntimes?.length > 0, null, { timeout: 90000 });
// real-time wait: HDRI env map + lazy chunks arrive over the network
await page.waitForTimeout(2000);

// video mode: pure 3D — hide every piece of page chrome (CSS2D part labels
// live inside .canvas-holder and stay visible; they're content, not chrome)
await page.addStyleTag({
  content: `
    .player-hero, .steps, .rail, .back-link, .scroll-hint { display: none !important; }
    body { overflow: hidden; }
  `,
});

const stepCount = await page.evaluate(() => window.__hiw.stepRuntimes.length);

// resolve the shot list
const shots =
  editorial?.[format]?.shots ??
  Array.from({ length: stepCount }, (_, i) => ({ step: i, seconds: 8 }));
for (const s of shots) {
  if (s.step >= stepCount) {
    console.error(`shot references step ${s.step}, but ${id} has only ${stepCount} steps`);
    process.exit(1);
  }
}

// Narration is authoritative for pacing: when a shot's narration file exists,
// extend the shot to fit the spoken audio plus a breath of air. (TTS engines
// differ in speaking rate — never trust the seconds written in video.js.)
const audioSeconds = (file) => {
  const r = spawnSync(ffmpeg, ['-i', file, '-f', 'null', '-'], { encoding: 'utf8' });
  const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(r.stderr ?? '');
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : 0;
};
for (const [si, shot] of shots.entries()) {
  const seg = join(outRoot, 'audio', `${format}-shot-${String(si).padStart(2, '0')}.mp3`);
  if (!existsSync(seg)) continue;
  const need = audioSeconds(seg) + 0.8;
  if (need > (shot.seconds ?? 8)) {
    console.log(`  shot ${si}: extended ${shot.seconds ?? 8}s -> ${need.toFixed(1)}s to fit narration`);
    shot.seconds = need;
  }
}

const FLY_SECONDS = 1.6; // camera fly-to between steps, captured as transition
const frameMs = 1000 / fps;

const advance = (ms) => page.evaluate((m) => window.__vt.advance(m), ms);

// portrait crops the sides of landscape-framed shots — dolly out to compensate
// (per-shot override: { dolly: 1.5 } in video.js; first shot's is set pre-boot)
const setDolly = (d) => page.evaluate((v) => { window.__hiwCameraScale = v; }, d);

// warm up: run the virtual clock ~2s so entry animations and the first loop
// settle before frame 0
await page.evaluate((n) => window.__hiw.activate(n), shots[0]?.step ?? 0);
for (let i = 0; i < fps * 2; i++) await advance(frameMs);

console.log(`${id} [${format}] ${viewport.width}x${viewport.height}@${fps} — ${shots.length} shots -> ${outRoot}`);

let frame = 0;
let clock = 0; // seconds on the output timeline
const timeline = [];
const t0 = Date.now();

for (const [si, shot] of shots.entries()) {
  const isFirst = si === 0;
  await setDolly(shot.dolly ?? baseDolly);
  await page.evaluate((n) => window.__hiw.activate(n), shot.step);

  // capture the fly-to as a transition (except into the very first shot,
  // which was already framed during warm-up)
  const flyFrames = isFirst ? 0 : Math.round(FLY_SECONDS * fps);
  const holdFrames = Math.round((shot.seconds ?? 8) * fps);
  const start = clock;

  for (let f = 0; f < flyFrames + holdFrames; f++) {
    await advance(frameMs);
    // JPEG q92: ~3x faster than PNG per frame; invisible after x264 crf 18
    await page.screenshot({
      path: join(framesDir, `${String(frame).padStart(5, '0')}.jpg`),
      quality: 92,
    });
    frame++;
    clock += 1 / fps;
  }

  timeline.push({
    shot: si,
    step: shot.step,
    start: Number(start.toFixed(3)),
    contentStart: Number((start + flyFrames / fps).toFixed(3)),
    end: Number(clock.toFixed(3)),
    caption: shot.caption ?? null,
    narration: shot.narration ?? null,
    sfx: shot.sfx ?? null,
  });
  console.log(`  shot ${si + 1}/${shots.length} (step ${shot.step + 1}) — ${frame} frames, ${((Date.now() - t0) / 1000).toFixed(0)}s elapsed`);
}

await browser.close();
writeFileSync(join(outRoot, `${format}-timeline.json`), JSON.stringify(timeline, null, 2));

// --- encode master --------------------------------------------------------
const master = join(outRoot, `${format}-master.mp4`);
const run = (fargs, label) => {
  const r = spawnSync(ffmpeg, ['-y', ...fargs], { stdio: ['ignore', 'ignore', 'pipe'] });
  if (r.status !== 0) {
    console.error(`ffmpeg ${label} failed:\n${r.stderr.toString().slice(-2000)}`);
    process.exit(1);
  }
};
run(
  [
    '-framerate', String(fps),
    '-i', join(framesDir, '%05d.jpg'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    master,
  ],
  'encode',
);
console.log(`master: ${master} (${(frame / fps).toFixed(1)}s)`);

// --- captions --------------------------------------------------------------
// ASS burned via libass: auto-wraps, real outline, positioned per format.
// Hook (editorial.hook) overlays the first 3s on shorts.
const hasCaptions = timeline.some((t) => t.caption) || (format === 'short' && editorial?.hook);
let captioned = master;
if (hasCaptions) {
  const short = format === 'short';
  const fontSize = short ? 72 : 54;
  const marginV = short ? Math.round(viewport.height * 0.16) : 60;
  const ts = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = (s % 60).toFixed(2).padStart(5, '0');
    return `${h}:${String(m).padStart(2, '0')}:${sec}`;
  };
  const esc = (t) => t.replace(/\n/g, '\\N');
  const lines = [];
  // shorts: hook on top-third for the first 3 seconds
  if (short && editorial?.hook) {
    lines.push(`Dialogue: 1,${ts(0)},${ts(3)},Hook,,0,0,0,,${esc(editorial.hook)}`);
  }
  for (const t of timeline) {
    if (!t.caption) continue;
    lines.push(`Dialogue: 0,${ts(t.contentStart)},${ts(t.end)},Cap,,0,0,0,,${esc(t.caption)}`);
  }
  const ass = `[Script Info]
ScriptType: v4.00+
PlayResX: ${viewport.width}
PlayResY: ${viewport.height}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,Arial,${fontSize},&H00FFFFFF,&H00FFFFFF,&H00000000,&H7F000000,-1,0,0,0,100,100,0,0,1,4,1,2,80,80,${marginV},1
Style: Hook,Arial,${Math.round(fontSize * 1.2)},&H00FFFFFF,&H00FFFFFF,&H00000000,&H7F000000,-1,0,0,0,100,100,0,0,1,5,1,8,80,80,${Math.round(viewport.height * 0.14)},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${lines.join('\n')}
`;
  const assName = `${format}-captions.ass`;
  writeFileSync(join(outRoot, assName), ass);
  captioned = join(outRoot, `${format}-captioned.mp4`);
  // run with cwd = outRoot so the subtitles filter gets a plain relative
  // filename (Windows drive-letter paths break libass filter escaping)
  const r = spawnSync(
    ffmpeg,
    [
      '-y', '-i', `${format}-master.mp4`,
      '-vf', `subtitles=${assName}:fontsdir='C\\:/Windows/Fonts'`,
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
      '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
      `${format}-captioned.mp4`,
    ],
    { cwd: outRoot, stdio: ['ignore', 'ignore', 'pipe'] },
  );
  if (r.status !== 0) {
    console.error(`caption burn failed (master still usable):\n${r.stderr.toString().slice(-2000)}`);
    captioned = master;
  } else {
    console.log(`captioned: ${captioned}`);
  }
}

// --- audio mix --------------------------------------------------------------
// Narration segments come from make-narration.mjs (renders/<id>/audio/
// <format>-shot-NN.mp3); sfx cues reference assets/sfx/<name>.mp3.
// Everything is optional — missing files are skipped, silent video still ships.
const audioDir = join(outRoot, 'audio');
const inputs = [];
const delays = [];
for (const [si, t] of timeline.entries()) {
  const seg = join(audioDir, `${format}-shot-${String(si).padStart(2, '0')}.mp3`);
  if (existsSync(seg)) {
    inputs.push(seg);
    delays.push(Math.round(t.contentStart * 1000));
  }
  for (const cue of t.sfx ?? []) {
    const f = resolve('assets/sfx', `${cue.file}.mp3`);
    if (existsSync(f)) {
      inputs.push(f);
      delays.push(Math.round((t.contentStart + (cue.at ?? 0)) * 1000));
    }
  }
}
if (inputs.length) {
  const final = join(outRoot, `${format}-final.mp4`);
  const fin = ['-i', captioned];
  for (const f of inputs) fin.push('-i', f);
  const chains = inputs.map(
    (_, i) => `[${i + 1}:a]adelay=${delays[i]}|${delays[i]}[a${i}]`,
  );
  const mix = `${chains.join(';')};${inputs.map((_, i) => `[a${i}]`).join('')}amix=inputs=${inputs.length}:normalize=0[out]`;
  run(
    [
      ...fin,
      '-filter_complex', mix,
      '-map', '0:v', '-map', '[out]',
      '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest',
      final,
    ],
    'audio mix',
  );
  console.log(`final (with audio): ${final}`);
} else {
  console.log('audio: no narration/sfx files found — skipped (run make-narration.mjs first for voiced output)');
}

if (!keepFrames) rmSync(framesDir, { recursive: true, force: true });
console.log('done');
