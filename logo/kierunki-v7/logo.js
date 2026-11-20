'use strict';

const STARTER_LESSONS = 3;
const MODULES = 5;
const LESSONS_PER_MODULE = 5;
const TOTAL_LESSONS = STARTER_LESSONS + MODULES * LESSONS_PER_MODULE;
const VIEWBOX = '-100 -100 200 200';

let logoCounter = 0;

/**
 * Kolejność lekcji w kursie: rozrusznik, potem krąg 2 (po `split` lekcji z każdego filaru),
 * potem krąg 3 (reszta lekcji każdego filaru).
 */
function buildPlan(split) {
  if (!Number.isInteger(split) || split < 1 || split >= LESSONS_PER_MODULE) {
    throw new RangeError(`split musi być liczbą całkowitą 1-${LESSONS_PER_MODULE - 1}, jest: ${split}`);
  }
  const lessons = [];
  const add = (ring, module, pos, count) => {
    lessons.push({ i: lessons.length, ring, module, pos, count });
  };
  for (let pos = 0; pos < STARTER_LESSONS; pos += 1) add(1, 0, pos, STARTER_LESSONS);
  [[2, split], [3, LESSONS_PER_MODULE - split]].forEach(([ring, count]) => {
    for (let module = 0; module < MODULES; module += 1) {
      for (let pos = 0; pos < count; pos += 1) add(ring, module, pos, count);
    }
  });
  return lessons;
}

/** Zakres kątowy lekcji na swoim kręgu oraz przerwy po obu stronach. */
function slot(lesson, start, gaps) {
  const isStarter = lesson.ring === 1;
  const moduleSpan = isStarter ? TAU : TAU / MODULES;
  const step = moduleSpan / lesson.count;
  const from = start + lesson.module * moduleSpan + lesson.pos * step;
  const isFirst = isStarter || lesson.pos === 0;
  const isLast = isStarter || lesson.pos === lesson.count - 1;
  return {
    a0: from,
    a1: from + step,
    g0: isFirst ? gaps.module : gaps.lesson,
    g1: isLast ? gaps.module : gaps.lesson,
  };
}

/** Składa SVG kierunku. `simple` = wersja do małych rozmiarów, bez podziału na lekcje. */
function logoSvg(direction, { done, split, simple = false }) {
  logoCounter += 1;
  const lessons = buildPlan(split);
  const { defs, shapes } = direction.draw(lessons, { simple, split, uid: `logo${logoCounter}` });
  const body = shapes
    .map((item) => `<g class="s r${item.ring}${item.i < done ? ' on' : ''}" data-i="${item.i}">${item.svg}</g>`)
    .join('');
  const label = `${direction.name}, ukończone lekcje: ${done} z ${TOTAL_LESSONS}`;
  return `<svg viewBox="${VIEWBOX}" role="img" aria-label="${label}"><defs>${defs}</defs>${body}</svg>`;
}
