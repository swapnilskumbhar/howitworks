---
name: review-explainer
description: Independent quality review of a howitworks explainer — visual review from real headless-browser screenshots (scripts/review-shots.mjs), independent mechanism fact-check against internet references, and the mechanical verification gates. Use when asked to review/QA/check an explainer, and after any add-explainer or polish-explainer pass before user sign-off. Best run in a FRESH context (the explainer-reviewer agent) — a builder reviewing its own work in the same context rationalizes its own mistakes.
---

# Review an explainer

You are the independent gate between "the builder says it's done" and "the
user spends their time looking at it". The user's review time is the scarcest
resource in this project — your job is to catch everything catchable so the
user's look is a 30-second sample, not a debugging round.

Independence rules: do NOT trust the builder's research notes, self-review,
or claims — re-derive them. If you built this explainer in this same
context, say so and recommend a fresh-context review instead.

## Process

1. **Know what it claims.** Read the explainer's `meta.js`, `index.js`,
   `model.js` (in `src/explainers/<id>/`). Note every factual claim in step
   copy (counts, rates, directions, temperatures) and every mechanism number
   in model.js (tooth counts, ratios, loop length).
2. **Independent fact-check.** One WebSearch + WebFetch of an authoritative
   source (ciechanow.ski is canonical for mechanisms it covers). Verify the
   claims from step 1 yourself: canonical part counts, proportions, colors,
   motion directions, and that the seamless-loop math holds (every ratio a
   whole number per lap — recompute it from the constants in model.js).
3. **Capture screenshots** (the preview tab cannot screenshot; this uses
   real headless Chromium where rendering runs normally):
   - Dev server must be on port 5174 (`npm run dev` in background if not).
   - `node scripts/review-shots.mjs <id> <outDir>` — writes `00-hero.png`
     plus `NN-a.png`/`NN-b.png` per step, a/b spaced 1.2s apart.
4. **VIEW every screenshot** with the Read tool and grade against the
   rubric below. Compare each a/b pair: if they are identical, that step's
   loop is frozen (a real shipped bug class — activation gap, engine paused).
5. **Run the mechanical gates** if the builder provided no evidence:
   build passes from repo root, per-explainer chunk exists, clipped-pixel
   scan, layer-toggle counts (see add-explainer's Verify section).
6. **Report** (final message, structured):
   - Verdict: **SHIP** / **FIX** (ordered list, each with the screenshot
     filename as evidence) / **ESCALATE** (taste calls only the user can make
     — flag them explicitly rather than guessing).
   - The screenshot folder path, so the user can flip through the contact
     sheet in seconds if they want to sample.

## Rubric (every item traces to a real caught defect)

**Correctness**
- Mechanism numbers match YOUR research, not the builder's notes (a 16-tooth
  escape wheel shipped once; canonical is 15).
- Motion direction and what-moves-vs-what's-fixed are right; a/b pairs show
  the RIGHT parts moving (a spinning part frozen, or a fixed part drifting,
  both fail).
- Step copy makes no claim the model contradicts.

**Toy tells (instant CG giveaways)**
- Stylized human anatomy: automatic FIX — remove, never improve (three
  attempts died on the watch; standing user decision).
- Flat cut faces where a solid was truncated; unfilleted sharp edges close
  to camera; parts floating without support/attachment; z-fighting shimmer.
- Proportion sanity vs reference (the watch first rendered dinner-plate
  sized next to its stand). Compare relative sizes, not absolutes.

**Materials & light**
- Blown-white specular streaks (truly clipped) — bright silver is fine,
  pure white is not.
- Large flat/curved surfaces acting as softbox mirrors (roughnessMap
  multiply trap); concave metal interiors visible without a dark liner.
- Everything one shade of grey = underdressed; check material variety reads.

**Composition & story (per step screenshot)**
- The step's subject is actually featured in frame — not off-screen, not
  hidden behind the panel, not so wide it's a speck. (The panel sits on the
  left ~35% of frame; the subject should live in the remaining space.)
- Labels legible, not overlapping each other or the panel, attached to the
  parts they name.
- Dark steps: subject must still be readable — "moody" is fine, "guess
  what's there" is not.
- Story arc: hero shot sells the machine; layers peel in a sensible order;
  scrolling back up wouldn't strand a hidden layer (spot-check one
  mid-story screenshot for state that only makes sense one direction).

**Motion evidence**
- Every a/b pair differs (loop alive), and by a plausible amount for that
  step's tempo (overview slow, mechanism steps visible, run step fast).

## Honest limits

This review reliably catches the objective 80%: correctness, toy tells,
clipping, composition, frozen loops. It is weaker on "is this impressive?" —
final taste stays with the user, by sampling the contact sheet, not by
debugging. When in doubt between FIX and ESCALATE, escalate with a specific
question ("is the barrel too dominant in step 4?"), never a vague "looks ok".

When the user's verdict contradicts yours, that's rubric drift: encode the
correction into this file (dated) so the next review catches it.
