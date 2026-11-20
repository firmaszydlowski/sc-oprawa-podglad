'use strict';

// 4. Oko i księga (dawniej 21), przerysowane z logo-ai-runda-2/ai/21-oko-ksiega/image-01.png.
// Wymiary zdjęte ze szkicu: 1 jednostka = 3,3 px szkicu, środek znaku w punkcie (512, 511) px.
// Rozrusznik = błysk, źrenica, tęczówka (3 lekcje). Łuk powieki = krąg 2. Książka = krąg 3: warstwy stron to lekcje filaru.
const EYE_BOOK = {
  lid: { y: 24.4, radius: 81.4, width: 14, half: 60.6 * DEG },
  eye: { y: -12.4, pupil: 16, iris: 29.6, ringGap: 2.5, clearance: 10 },
  glint: { x: 8.7, y: -22.6, radius: 7, gap: 2.5 },
  gaps: { module: 2.2, lesson: 1.2, book: 1.6 }, // cienkie cięcia: znak ma zostać książką i okiem, nie mozaiką
  cuts: [-1, -0.6, -0.2, 0.2, 0.6, 1], // granice filarów wzdłuż strony, jako ułamek jej półszerokości
  samples: 10,
  mask: 100,
  // krawędzie warstw książki: [półszerokość, wysokość na zewnętrznym końcu, wysokość przy grzbiecie]
  layers: {
    3: [
      { upper: [80.5, -10.9, 26.2], lower: [85, 0, 39] },
      { upper: [88.7, 8.1, 44], lower: [88.7, 19, 48.5] },
      { upper: [95, 27.1, 53.5], lower: [95, 37.5, 63] },
    ],
    2: [
      { upper: [80.5, -10.9, 26.2], lower: [85, 0, 39] },
      { upper: [90, 10, 45], lower: [95, 37.5, 63] },
    ],
  },
};

/** Punkt krawędzi strony: płasko przy zewnętrznym końcu, coraz stromiej w stronę grzbietu. */
function pageEdgePoint([halfWidth, endY, spineY], u) {
  const fromSpine = 1 - (1 - Math.abs(u)) ** 2;
  return [u * halfWidth, spineY - (spineY - endY) * fromSpine];
}

function sampleEdge(edge, from, to) {
  return Array.from({ length: EYE_BOOK.samples + 1 }, (_, step) =>
    pageEdgePoint(edge, from + ((to - from) * step) / EYE_BOOK.samples),
  );
}

/** Pole książki: odcinek jednej warstwy stron należący do filaru. */
function bookField(lesson, simple) {
  const layer = EYE_BOOK.layers[lesson.count][lesson.pos];
  const gap = simple ? OVERLAP : EYE_BOOK.gaps.book;
  const trim = (boundary) => (Math.abs(boundary) === 1 ? 0 : gap / (2 * layer.upper[0]));
  const from = EYE_BOOK.cuts[lesson.module] + trim(EYE_BOOK.cuts[lesson.module]);
  const to = EYE_BOOK.cuts[lesson.module + 1] - trim(EYE_BOOK.cuts[lesson.module + 1]);
  return filled(toPath([...sampleEdge(layer.upper, from, to), ...sampleEdge(layer.lower, from, to).reverse()]));
}

function lidSegment(lesson, simple) {
  const { y, radius, width, half } = EYE_BOOK.lid;
  const moduleSweep = (2 * half) / MODULES;
  const step = moduleSweep / lesson.count;
  const start = TOP - half + lesson.module * moduleSweep + lesson.pos * step;
  const gap = (isEdge) => {
    if (simple) return OVERLAP;
    return isEdge ? EYE_BOOK.gaps.module : EYE_BOOK.gaps.lesson;
  };
  const span = { a0: start, a1: start + step, g0: gap(lesson.pos === 0), g1: gap(lesson.pos === lesson.count - 1) };
  return `<g transform="translate(0,${y})">${stroked(ringArc(0, radius, span), width)}</g>`;
}

/** Wycięcia oka: od dołu równolegle do górnej krawędzi stron, wokół błysku wolne pole. */
function eyeDefs(uid) {
  const { y, iris, clearance } = EYE_BOOK.eye;
  const { x: glintX, y: glintY, radius, gap } = EYE_BOOK.glint;
  const size = EYE_BOOK.mask;
  const pageTop = sampleEdge(EYE_BOOK.layers[3][0].upper, -0.6, 0.6).map(([px, py]) => [px, py - clearance]);
  const [first, last] = [pageTop[0], pageTop[pageTop.length - 1]];
  const above = toPath([...pageTop, [last[0], y - iris], [first[0], y - iris]]);
  const frame = `x="${-size}" y="${-size}" width="${2 * size}" height="${2 * size}"`;
  return [
    `<clipPath id="${uid}v"><path d="${above}"/></clipPath>`,
    `<mask id="${uid}m" maskUnits="userSpaceOnUse" ${frame}><rect ${frame} fill="#fff"/><circle cx="${glintX}" cy="${glintY}" r="${radius + gap}" fill="#000"/></mask>`,
  ].join('');
}

/** Rozrusznik: 0 = błysk, 1 = źrenica, 2 = tęczówka. */
function eyeField(pos, simple, uid) {
  const { y, pupil, iris, ringGap } = EYE_BOOK.eye;
  const { x: glintX, y: glintY, radius } = EYE_BOOK.glint;
  if (pos === 0) return `<circle cx="${glintX}" cy="${glintY}" r="${radius}" fill="currentColor"/>`;
  const circle = (r) => `M${-r},${y}a${r},${r} 0 1 0 ${2 * r},0a${r},${r} 0 1 0 ${-2 * r},0Z`;
  const inner = pupil + (simple ? OVERLAP : ringGap);
  const d = pos === 1 ? circle(pupil) : circle(iris) + circle(inner);
  return `<g clip-path="url(#${uid}v)" mask="url(#${uid}m)"><path d="${d}" fill="currentColor" fill-rule="evenodd"/></g>`;
}

function drawEyeBook(lessons, { simple, uid }) {
  const shapes = lessons.map((lesson) => {
    if (lesson.ring === 1) return shape(lesson, eyeField(lesson.pos, simple, uid));
    if (lesson.ring === 2) return shape(lesson, lidSegment(lesson, simple));
    return shape(lesson, bookField(lesson, simple));
  });
  return { defs: eyeDefs(uid), shapes };
}

const EYE_BOOK_DIRECTION = {
  name: 'Oko i księga',
  former: 21,
  draw: drawEyeBook,
  note: 'Przerysowane od nowa z wymiarów szkicu: szeroki płaski łuk powieki, duże oko z błyskiem przycięte od dołu grzbietem, łukowate strony zbiegające się w grzbiecie. Rozrusznik to trzy części oka: błysk, źrenica, tęczówka. Powieka to krąg 2: 5 odcinków od lewej do prawej. Książka to krąg 3: 5 odcinków wzdłuż stron, a warstwy stron to kolejne lekcje filaru. Cięcia między polami są cienkie, żeby znak został okiem i książką.',
  reference: { src: '../logo-ai-runda-2/ai/21-oko-ksiega/image-01.png', alt: 'Oryginalna generacja: oko nad otwartą książką' },
};
