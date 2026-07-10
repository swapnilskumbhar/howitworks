// Generate narration audio for an explainer's video export.
//
//   node scripts/make-narration.mjs <explainer-id> [--format long|short] [--voice <id>]
//
// Engine: ElevenLabs when ELEVENLABS_API_KEY is set (premium, the channel
// voice); otherwise falls back to Microsoft Edge neural TTS via msedge-tts
// (free, no key, clearly good enough to ship while the channel is young).
//
// Writes renders/<id>/audio/<format>-shot-NN.mp3 — exactly the filenames
// export-video.mjs picks up for its audio mix. Run in either order with the
// render; re-running export-video.mjs re-mixes with the new audio.
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith('--'));
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : dflt;
};
if (!id) {
  console.error('usage: node scripts/make-narration.mjs <explainer-id> [--format long|short] [--voice <id>]');
  process.exit(1);
}
const format = opt('format', 'long');

const videoJsPath = resolve(`src/explainers/${id}/video.js`);
if (!existsSync(videoJsPath)) {
  console.error(`${videoJsPath} not found — write the editorial layer first.`);
  process.exit(1);
}
const editorial = (await import(pathToFileURL(videoJsPath))).default;
const shots = editorial?.[format]?.shots ?? [];

const outDir = resolve('renders', id, 'audio');
mkdirSync(outDir, { recursive: true });

const key = process.env.ELEVENLABS_API_KEY;

async function elevenlabs(text) {
  // "Adam" — deep, documentary-neutral default; swap once a channel voice is chosen
  const voice = opt('voice', 'pNInz6obpgDQGcFmaJgB');
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: { 'xi-api-key': key, 'content-type': 'application/json' },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    },
  );
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

let edge = null;
async function edgeTts(text) {
  if (!edge) {
    const { MsEdgeTTS, OUTPUT_FORMAT } = await import('msedge-tts');
    edge = new MsEdgeTTS();
    await edge.setMetadata(
      opt('voice', 'en-US-ChristopherNeural'),
      OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3,
    );
  }
  const { audioStream } = await edge.toStream(text);
  const chunks = [];
  for await (const c of audioStream) chunks.push(c);
  return Buffer.concat(chunks);
}

const synth = key ? elevenlabs : edgeTts;
console.log(`engine: ${key ? 'ElevenLabs' : 'Edge neural TTS (free fallback — set ELEVENLABS_API_KEY for the premium voice)'}`);

let made = 0;
for (const [si, shot] of shots.entries()) {
  if (!shot.narration) continue;
  const out = join(outDir, `${format}-shot-${String(si).padStart(2, '0')}.mp3`);
  writeFileSync(out, await synth(shot.narration));
  made++;
  console.log(`shot ${si}: ${out}`);
}
console.log(made ? `${made} narration segments -> ${outDir}` : 'no narration lines in video.js');
