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

/** Środek: źrenica z 3 poziomych pasków (3 lekcje rozrusznika). */
function pupilCore(radius, gap) {
  const stripe = (pos, simple, clipId) => {
    const between = simple ? OVERLAP : gap;
    const height = (2 * radius - (STARTER_LESSONS - 1) * between) / STARTER_LESSONS;
    const y = -radius + pos * (height + between);
    return `<rect x="${-radius}" y="${fmt(y)}" width="${2 * radius}" height="${fmt(height)}" fill="currentColor" clip-path="url(#${clipId})"/>`;
  };
  return { defs: (clipId) => `<clipPath id="${clipId}"><circle r="${radius}"/></clipPath>`, core: stripe };
}
