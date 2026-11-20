'use strict';

// Schemat z kierunku 2 (Akapity): filar = blok 5 wersów czytany od środka, lekcja = jeden wers.
// Różnica: wersy przy środku biegną po kole, a im dalej, tym bardziej przyjmują kształt obrysu znaku.

const LINES = { first: 22, step: 9.5, zoneShift: 3, width: 6, sideGap: 8, samples: 20 };
const LINES_SPAN = (LESSONS_PER_MODULE - 1) * LINES.step + LINES.zoneShift;
const RAGGED = [1, 0.84, 1, 0.7, 0.9, 0.78]; // nierówny prawy margines, jak w składzie tekstu

const bandOf = (lesson, split, pos) => (lesson.ring === 2 ? pos : split + pos);

function bandOffset(lesson, split, pos) {
  return bandOf(lesson, split, pos) * LINES.step + (lesson.ring === 3 ? LINES.zoneShift : 0);
}

/** Promień wersu w danym kierunku: od koła przy środku do pełnego obrysu na zewnątrz. */
function lineRadius(contour, offset, theta) {
  const outer = contour(theta) - LINES.width / 2;
  return LINES.first + (offset / LINES_SPAN) * (outer - LINES.first);
}

/** Zakres kątowy wersu w filarze, przycięty o przerwę między filarami. */
function pillarRange(lesson, offset, style, edgeGap) {
  const module = TAU / MODULES;
  const start = PILLAR_START + lesson.module * module + style.shear * offset;
  const radius = (theta) => lineRadius(style.contour, offset, theta);
  return {
    from: start + edgeGap / (2 * radius(start)),
    to: start + module - edgeGap / (2 * radius(start + module)),
    radius,
  };
}

function sampleRange({ from, to, radius }, shift) {
  return Array.from({ length: LINES.samples + 1 }, (_, step) => {
    const theta = from + ((to - from) * step) / LINES.samples;
    return polar(0, 0, radius(theta) + shift, theta);
  });
}

function contourLine(lesson, split, style) {
  const offset = bandOffset(lesson, split, lesson.pos);
  const range = pillarRange(lesson, offset, style, LINES.sideGap + LINES.width);
  const ragged = RAGGED[(lesson.module * 2 + bandOf(lesson, split, lesson.pos)) % RAGGED.length];
  const points = sampleRange({ ...range, to: range.from + (range.to - range.from) * ragged }, 0);
  return `<path d="${toOpenPath(points)}" fill="none" stroke="currentColor" stroke-width="${LINES.width}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

/** Małe rozmiary: wersy jednego kręgu w filarze zlane w jedno pole. */
function contourZone(lesson, split, style) {
  const inner = pillarRange(lesson, bandOffset(lesson, split, 0), style, LINES.sideGap);
  const outer = pillarRange(lesson, bandOffset(lesson, split, lesson.count - 1), style, LINES.sideGap);
  const half = LINES.width / 2;
  return filled(toPath([...sampleRange(outer, half), ...sampleRange(inner, -half).reverse()]));
}

/** Pola kręgu 2 i 3 dla danego stylu: pojedyncze wersy albo (małe rozmiary) zlane strefy. */
function contourFields(lessons, { simple, split }, style) {
  return lessons
    .filter((lesson) => lesson.ring !== 1 && (!simple || lesson.pos === 0))
    .map((lesson) => shape(lesson, simple ? contourZone(lesson, split, style) : contourLine(lesson, split, style)));
}
