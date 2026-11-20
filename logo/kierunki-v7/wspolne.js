'use strict';

const OVERLAP = -0.6; // ujemna przerwa: sąsiednie pola zachodzą na siebie i zlewają się w jedną formę
const TOP = -90 * DEG;
const ALWAYS_ON = -1; // pole poza numeracją lekcji: zawsze zapełnione (tylko małe rozmiary)
const PILLAR_START = TOP - TAU / MODULES / 2; // filar wyśrodkowany u góry, granica filarów u dołu

const filled = (d) => `<path d="${d}" fill="currentColor"/>`;
const stroked = (d, width, cap = 'butt') =>
  `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="${cap}"/>`;
const shape = (lesson, svg) => ({ i: lesson.i, ring: lesson.ring, svg });

function gapsFor(lesson, simple, sizes) {
  if (lesson.ring === 1) return { module: simple ? OVERLAP : sizes.starter, lesson: OVERLAP };
  return {
    module: simple ? sizes.simpleModule : sizes.module,
    lesson: simple ? OVERLAP : sizes.lesson,
  };
}
