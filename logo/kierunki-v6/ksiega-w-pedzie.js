'use strict';

// 5. Księga w pędzie (dawniej 22), rozłożona ze szkicu logo-ai-runda-2/ai/22-ksiega-w-pedzie.
// Książka z 3 części = rozrusznik. 5 smug = 5 filarów, każda cięta skośnie na 5 lekcji:
// odcinki przy książce to krąg 2, końcówki to krąg 3.
const RUSH = {
  board: [[-67.5, -57.5], [-31.9, -39.1], [-58.7, 54], [-95, 25.7]],
  spine: [[-29.4, -37.9], [-18, -32], [-44.6, 65], [-56.2, 56]],
  page: 'M-47.4,-65.3Q-18,-50 -13,-31Q-24,-42 -50.8,-55.5Z',
  streak: { top: -47, pitch: 19, thickness: 12, firstEnd: 95, endStep: 19, lean: 0.83, rise: 17, edgeGap: 6, outerRun: 44, innerRun: 34 },
  cuts: [0, 0.3, 0.47, 0.64, 0.82, 1], // gdzie smuga dzieli się na lekcje (ułamek długości)
  gaps: { lesson: 2.5, zone: 5.5 },
  margin: 6,
  reach: 90,
};

/** Smuga k (0 = górna, najdłuższa): zaczyna się ostrzem przy grzbiecie, kończy skośnym cięciem. */
function streakGeometry(k) {
  const { top: firstTop, pitch, thickness, firstEnd, endStep, lean, rise, edgeGap, outerRun, innerRun } = RUSH.streak;
  const [[edgeX, edgeY], [tipX, tipY]] = [RUSH.spine[1], RUSH.spine[2]];
  const top = firstTop + k * pitch;
  const bottom = top + thickness;
  const startY = bottom + rise;
  const startX = edgeX + ((tipX - edgeX) * (startY - edgeY)) / (tipY - edgeY) + edgeGap;
  const end = firstEnd - k * endStep;
  const d = [
    `M${fmt(startX)},${fmt(startY)}`,
    `Q${fmt(startX + 5)},${top} ${fmt(startX + outerRun)},${top}`,
    `L${end},${top}L${fmt(end - lean * thickness)},${bottom}L${fmt(startX + innerRun)},${bottom}`,
    `Q${fmt(startX + 12)},${bottom} ${fmt(startX)},${fmt(startY)}Z`,
  ].join('');
  return { d, startX, end, middle: top + thickness / 2 };
}

/** Skośny pas wycinający ze smugi jedną lekcję. */
function streakStrip(lesson, split, simple, geometry) {
  const band = lesson.ring === 2 ? lesson.pos : split + lesson.pos;
  const length = geometry.end - geometry.startX;
  const gapAt = (boundary) => {
    if (boundary === 0 || boundary === LESSONS_PER_MODULE) return -RUSH.margin;
    if (simple && boundary !== split) return OVERLAP;
    return boundary === split ? RUSH.gaps.zone : RUSH.gaps.lesson;
  };
  const from = geometry.startX + RUSH.cuts[band] * length + gapAt(band) / 2;
  const to = geometry.startX + RUSH.cuts[band + 1] * length - gapAt(band + 1) / 2;
  const shift = RUSH.streak.lean * RUSH.reach;
  const [up, down] = [geometry.middle - RUSH.reach, geometry.middle + RUSH.reach];
  return toPath([[from + shift, up], [to + shift, up], [to - shift, down], [from - shift, down]]);
}

function drawRush(lessons, { simple, split, uid }) {
  const core = [filled(toPath(RUSH.board)), filled(toPath(RUSH.spine)), filled(RUSH.page)];
  const clips = [];
  const shapes = lessons.map((lesson) => {
    if (lesson.ring === 1) return shape(lesson, core[lesson.pos]);
    const geometry = streakGeometry(lesson.module);
    const clipId = `${uid}s${lesson.i}`;
    clips.push(`<clipPath id="${clipId}"><path d="${streakStrip(lesson, split, simple, geometry)}"/></clipPath>`);
    return shape(lesson, `<g clip-path="url(#${clipId})">${filled(geometry.d)}</g>`);
  });
  return { defs: clips.join(''), shapes };
}

const RUSH_DIRECTION = {
  name: 'Księga w pędzie',
  former: 22,
  draw: drawRush,
  note: 'Książka z 3 części (okładka, grzbiet, strona) to rozrusznik. W szkicu były 3 smugi, tu jest 5: każda to jeden filar, cięta skośnie na 5 lekcji. Odcinki przy książce to krąg 2, końcówki to krąg 3, więc skrzydło rośnie od książki na zewnątrz.',
};
