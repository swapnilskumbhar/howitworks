---
name: export-content
description: Export a howitworks explainer as publishable video content — a 9:16 captioned short and a 16:9 narrated long-form video. Use when the user asks to export/render/make a video, short, reel, or YouTube version of an explainer. Covers writing the editorial layer (hooks, captions, narration in video.js), the deterministic render pipeline (export-video.mjs), TTS narration, and quality review of the output.
---

# Export an explainer as video content

Turns `src/explainers/<id>/` into publishable MP4s. The render is free and
repeatable — **the editorial layer (hook, captions, narration) is where views
are won or lost.** Spend your effort there.

## Pipeline overview

1. `src/explainers/<id>/video.js` — editorial layer (you write this)
2. `node scripts/make-narration.mjs <id>` — ElevenLabs TTS (needs `ELEVENLABS_API_KEY`; skip if unset)
3. `node scripts/export-video.mjs <id> --format short|long` — deterministic frame render + ffmpeg
4. Review the output frames, fix, re-render

Outputs land in `renders/<id>/`: `*-master.mp4` (silent, clean),
`*-captioned.mp4` (captions burned), `*-final.mp4` (audio mixed, only if
narration/sfx files exist), `*-timeline.json` (shot timings).

The render needs a dev server: start the `video-export` launch config
(port 5199) or pass `--port`. The page clock is virtualized (rAF +
performance.now stubs), so frames are deterministic and smooth no matter how
slow the machine is. Headless Chromium launches with GPU flags
(`--enable-gpu --use-angle=d3d11`) — without them WebGL falls back to
SwiftShader (CPU) and frames cost ~1s instead of ~0.1-0.2s. Default 24fps.
Different explainers can render in parallel (independent browser instances).

## Step 1 — write video.js

Copy the shape from `src/explainers/mechanical-watch/video.js`. Rules:

- **hook** (shorts, first 3s, top of frame): the counterintuitive fact in
  under 12 words. Not the topic — the *tension*. "No battery. So what keeps
  this ticking?" beats "How a mechanical watch works". Use `\n` for line breaks.
- **short.shots**: 5–7 shots, 30–40s total. **The first shot must show the
  ENTIRE model in frame** (user directive — establish the whole machine, then
  zoom into the mechanisms). Wide/horizontal models need a per-shot `dolly`
  (2.0+) to fit portrait. Then pick the *reveal* steps and the single most
  mesmerizing close-up. One caption per shot, one line, no jargon, concrete
  numbers ("releases ONE tooth per tick"). Shorts are narrated too (user
  directive) — the silent `short-captioned.mp4` variant remains for posting
  with trending audio instead.
- **long.shots**: usually every step, 8–12s each. `narration` is spoken prose —
  contractions, short sentences, second person. Never paste the step body
  copy; it's written for reading, not listening. Read it aloud mentally:
  ~2.5 words/second, so a 9s shot fits ~22 words of narration.
- Optional per shot: `dolly` (portrait camera pull-back override, default 1.35
  for shorts — raise it if the subject crops out of frame), `sfx: [{ file, at }]`
  referencing `assets/sfx/<file>.mp3`.
- Shorts get NO narration and NO music burned in — trending audio is added
  natively in each platform's app when posting (algorithmic reach).

## Step 2 — narration (long-form only)

```
node scripts/make-narration.mjs <id> --format long
```

Requires `ELEVENLABS_API_KEY`. Writes `renders/<id>/audio/long-shot-NN.mp3`.
If the key is missing, proceed without — the export still produces the
captioned master; narration can be added later by re-running the export.

## Step 3 — render

```
node scripts/export-video.mjs <id> --format short --fps 30
node scripts/export-video.mjs <id> --format long  --fps 30
```

Smoke-test new editorial at `--fps 10` first (renders ~3x faster) before
committing to a 30fps run.

## Step 4 — review before shipping (mandatory)

Extract spot-check frames from the captioned output and LOOK at them:

```
node -e "const f=require('ffmpeg-static');const{execFileSync}=require('child_process');execFileSync(f,['-y','-i','renders/<id>/short-captioned.mp4','-vf','fps=1/5,scale=540:-1','renders/<id>/check-%02d.jpg'])"
```

Check every frame for:
- **Framing**: subject fully in frame (portrait crops sides — fix with `dolly`)
- **Caption legibility**: readable at phone size, not covering the subject,
  hook not colliding with a caption
- **Motion**: mechanism visibly moving in every shot (compare consecutive
  frames if unsure — frozen loops have shipped before)
- **Long-form audio**: narration must not overrun its shot — if a segment
  feels rushed, lengthen `seconds` or cut words

Fix in video.js, re-render. Ship only what you would post.

## Facts that matter

- Firearm explainers (semi-auto-pistol): do NOT export for short-form
  platforms — age-restriction/demonetization risk. Long-form YouTube only,
  and flag it to the user first.
- `flyTo` in player.js honors `window.__hiw.cameraScale`; the export script
  drives it via `dolly`. `window.__hiw.activate(i)` is the deterministic step
  driver — keep both when refactoring the player.
- Captions burn via libass ASS subtitles with `fontsdir=C:/Windows/Fonts`;
  ffmpeg runs with cwd = renders dir to dodge Windows path escaping.
- Audio mix picks up `renders/<id>/audio/<format>-shot-NN.mp3` +
  `assets/sfx/*.mp3` cues; anything missing is skipped gracefully.
