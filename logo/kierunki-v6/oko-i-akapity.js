'use strict';

const FAR = 200;

/** Akapit z 3 wersów: środek motywów tekstowych (3 lekcje rozrusznika). */
function paragraphLine(pos, { half, step, width, lastEnd }) {
  const y = fmt((pos - 1) * step);
  const end = pos === STARTER_LESSONS - 1 ? lastEnd : half;
  return stroked(`M${-half},${y}L${end},${y}`, width, 'round');
}

// 1. Oko (dawniej 11): źrenica, tęczówka, obrys oka
const EYE = { halfWidth: 82, halfHeight: 56, lidWidth: 11, iris: [27, 43], pupil: 18, pupilGap: 3, gapRadius: 70 };
const EYE_GAPS = { starter: 0, module: 7, lesson: 3, simpleModule: OVERLAP };

function eyeLidPath() {
  const { halfWidth: w, halfHeight: h } = EYE;
  const radius = fmt((w * w + h * h) / (2 * h));
  return `M${-w},0A${radius},${radius} 0 0 1 ${w},0A${radius},${radius} 0 0 1 ${-w},0Z`;
}

function pupilStripe(pos, gap, clipId) {
  const height = (2 * EYE.pupil - (STARTER_LESSONS - 1) * gap) / STARTER_LESSONS;
  const y = -EYE.pupil + pos * (height + gap);
  return `<rect x="${-EYE.pupil}" y="${fmt(y)}" width="${2 * EYE.pupil}" height="${fmt(height)}" fill="currentColor" clip-path="url(#${clipId})"/>`;
}

function wedgePath(span) {
  const from = span.a0 + span.g0 / (2 * EYE.gapRadius);
  const to = span.a1 - span.g1 / (2 * EYE.gapRadius);
  return toPath([[0, 0], polar(0, 0, FAR, from), polar(0, 0, FAR, (from + to) / 2), polar(0, 0, FAR, to)]);
}

function drawEye(lessons, { simple, uid }) {
  const lid = stroked(eyeLidPath(), EYE.lidWidth);
  const clips = [`<clipPath id="${uid}"><circle r="${EYE.pupil}"/></clipPath>`];
  const shapes = [];
  lessons.forEach((lesson) => {
    const span = slot(lesson, PILLAR_START, gapsFor(lesson, simple, EYE_GAPS));
    if (lesson.ring === 1) {
      shapes.push(shape(lesson, pupilStripe(lesson.pos, simple ? OVERLAP : EYE.pupilGap, uid)));
    } else if (lesson.ring === 2) {
      shapes.push(shape(lesson, filled(sectorD(EYE.iris[0], EYE.iris[1], span))));
    } else if (!simple) {
      clips.push(`<clipPath id="${uid}w${lesson.i}"><path d="${wedgePath(span)}"/></clipPath>`);
      shapes.push(shape(lesson, `<g clip-path="url(#${uid}w${lesson.i})">${lid}</g>`));
    }
  });
  if (simple) shapes.push({ i: ALWAYS_ON, ring: 3, svg: lid });
  return { defs: clips.join(''), shapes };
}

// 2. Akapity (dawniej 13): każdy filar to blok tekstu z 5 wersów, czytany od środka na zewnątrz
const BLOCKS = { core: { half: 16, step: 10, width: 6, lastEnd: 2 }, firstRadius: 35, step: 12.5, width: 7.5, zoneShift: 3.5, sideGap: 9 };
const BLOCK_RAGGED = [1, 0.84, 1, 0.7, 0.9, 0.78];

function blockRadius(lesson, split, pos) {
  const band = lesson.ring === 2 ? pos : split + pos;
  return BLOCKS.firstRadius + band * BLOCKS.step + (lesson.ring === 3 ? BLOCKS.zoneShift : 0);
}

function blockLine(lesson, split) {
  const radius = blockRadius(lesson, split, lesson.pos);
  const band = lesson.ring === 2 ? lesson.pos : split + lesson.pos;
  const module = TAU / MODULES;
  const trim = (BLOCKS.sideGap + BLOCKS.width) / (2 * radius);
  const from = PILLAR_START + lesson.module * module + trim;
  const length = (module - 2 * trim) * BLOCK_RAGGED[(lesson.module * 2 + band) % BLOCK_RAGGED.length];
  return stroked(arcD(0, 0, radius, from, from + length), BLOCKS.width, 'round');
}

function blockZone(lesson, split) {
  const inner = blockRadius(lesson, split, 0) - BLOCKS.width / 2;
  const outer = blockRadius(lesson, split, lesson.count - 1) + BLOCKS.width / 2;
  const from = PILLAR_START + (lesson.module * TAU) / MODULES;
  return filled(sectorD(inner, outer, { a0: from, a1: from + TAU / MODULES, g0: BLOCKS.sideGap, g1: BLOCKS.sideGap }));
}

function drawBlocks(lessons, { simple, split }) {
  const shapes = lessons
    .filter((lesson) => !simple || lesson.ring === 1 || lesson.pos === 0)
    .map((lesson) => {
      if (lesson.ring === 1) return shape(lesson, paragraphLine(lesson.pos, BLOCKS.core));
      return shape(lesson, simple ? blockZone(lesson, split) : blockLine(lesson, split));
    });
  return { defs: '', shapes };
}

const EYE_DIRECTION = {
  name: 'Oko',
  former: 11,
  draw: drawEye,
  note: 'Oko czytelnika. Źrenica z 3 wersów to rozrusznik, tęczówka to krąg 2, obrys oka to krąg 3. Filary leżą w tych samych wycinkach w obu kręgach.',
};

const BLOCKS_DIRECTION = {
  name: 'Akapity',
  former: 13,
  draw: drawBlocks,
  note: 'Każdy filar to akapit z 5 wersów czytany od środka: bliższe wersy to krąg 2, dalsze to krąg 3. Jedna lekcja to jeden przeczytany wers. W środku akapit z 3 wersów (rozrusznik).',
};
