'use strict';

const PUPIL = pupilCore(15, 2.5);

// 3. Oko z wersami (dawniej 18): masywny obrys oka z kierunku 1, w środku wersy jak w 2
const LID = { halfWidth: 90, halfHeight: 58, width: 11, gapRadius: 70, far: 200 };
const LID_GAPS = { starter: 0, module: 7, lesson: 3, simpleModule: OVERLAP };
const IRIS_STYLE = { contour: () => 64, shear: 0, ...PUPIL }; // wersy tęczówki co 9 jednostek od środka

function lidStroke() {
  const { halfWidth: w, halfHeight: h, width } = LID;
  const radius = fmt((w * w + h * h) / (2 * h));
  const d = `M${-w},0A${radius},${radius} 0 0 1 ${w},0A${radius},${radius} 0 0 1 ${-w},0Z`;
  return `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linejoin="round"/>`;
}

function lidWedge(span) {
  const from = span.a0 + span.g0 / (2 * LID.gapRadius);
  const to = span.a1 - span.g1 / (2 * LID.gapRadius);
  return toPath([[0, 0], polar(0, 0, LID.far, from), polar(0, 0, LID.far, (from + to) / 2), polar(0, 0, LID.far, to)]);
}

function drawLinedIris(lessons, options) {
  const { simple, uid } = options;
  const lid = lidStroke();
  const clips = [IRIS_STYLE.defs(uid)];
  const pupil = lessons
    .filter((lesson) => lesson.ring === 1)
    .map((lesson) => shape(lesson, IRIS_STYLE.core(lesson.pos, simple, uid)));
  const iris = contourFields(lessons.filter((lesson) => lesson.ring === 2), options, IRIS_STYLE);
  const lidFields = lessons
    .filter((lesson) => lesson.ring === 3)
    .map((lesson) => {
      const span = slot(lesson, PILLAR_START, gapsFor(lesson, simple, LID_GAPS));
      clips.push(`<clipPath id="${uid}w${lesson.i}"><path d="${lidWedge(span)}"/></clipPath>`);
      return shape(lesson, `<g clip-path="url(#${uid}w${lesson.i})">${lid}</g>`);
    });
  return { defs: clips.join(''), shapes: [...pupil, ...iris, ...lidFields] };
}

const LINED_EYE_DIRECTION = {
  name: 'Oko z wersami',
  former: 18,
  draw: drawLinedIris,
  note: 'Masywny obrys oka jak w 1, tęczówka z wersów jak w 2. Krąg 2 to wersy tęczówki, krąg 3 to pola na obrysie oka.',
};
