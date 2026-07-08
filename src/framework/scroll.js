import { createTimeline, onScroll } from 'animejs';

// A timeline whose progress is bound to the section's travel across the
// viewport CENTER (0 when its top reaches center, 1 when its bottom does).
// Anchoring on the center makes consecutive sections' scrub windows exactly
// contiguous — two steps never scrub shared state at the same time, so a
// value carried across steps (like a crank angle) stays continuous.
export function scrubTimeline(section) {
  return createTimeline({
    defaults: { ease: 'linear' },
    autoplay: onScroll({
      target: section,
      enter: 'center top',
      leave: 'center bottom',
      sync: true,
    }),
  });
}

// A self-playing looping timeline; the player starts/stops it when its
// step becomes active/inactive.
export function loopTimeline() {
  return createTimeline({ loop: true, autoplay: false });
}
