'use strict';

// 6. Sowa (dawniej 28), rozłożona ze szkicu logo-ai-runda-2/ai/28-sowa.
// Dwie źrenice i dziób = rozrusznik (3 lekcje). Oczy mają po dwa pierścienie cięte na 5 wycinków:
// wewnętrzne (tęczówki) to krąg 2, zewnętrzne to krąg 3. Wycinek k w obu oczach należy do filaru k.
// Brew-książka ma 5 części, po jednej na filar; trafia do tego kręgu, w którym filar ma 3 lekcje.
const OWL = {
  eye: { x: 43, y: 14, pupil: 9, gap: 4, rings: { 2: [14, 24], 3: [29, 40] } },
  beak: [[-11, 44], [11, 44], [0, 72]],
  brow: {
    arc: 46,
    endAngle: -35 * DEG,
    outline: [[0, -36], [26, -56], [60, -58], [94, -76]], // od wcięcia nad dziobem do czubka ucha
    cuts: [-96, -58, -22, 22, 58, 96],
    gap: 4,
    top: -80,
    height: 86,
  },
};
const EYE_SIDES = [-1, 1]; // lewe i prawe oko; prawe jest lustrem lewego

function browPath() {
  const { x, y } = OWL.eye;
  const { arc, endAngle, outline } = OWL.brow;
  const end = polar(x, y, arc, endAngle);
  const meetY = fmt(y - Math.sqrt(arc * arc - x * x));
  const at = ([px, py]) => `${fmt(px)},${fmt(py)}`;
  const mirror = ([px, py]) => [-px, py];
  const right = [...outline, end].map(at).join('L');
  const left = [...outline.slice(1)].reverse().map(mirror).map(at).join('L');
  return `M${right}A${arc},${arc} 0 0 0 0,${meetY}A${arc},${arc} 0 0 0 ${at(mirror(end))}L${left}Z`;
}

function browClip(module, simple, clipId) {
  const { cuts, gap, top, height } = OWL.brow;
  const between = simple ? OVERLAP : gap;
  const from = cuts[module] + between / 2;
  const width = cuts[module + 1] - cuts[module] - between;
  return `<clipPath id="${clipId}"><rect x="${from}" y="${top}" width="${width}" height="${height}"/></clipPath>`;
}

function eyeSector(lesson, side, simple) {
  const [inner, outer] = OWL.eye.rings[lesson.ring];
  const gap = simple ? OVERLAP : OWL.eye.gap;
  const start = TOP + (lesson.module * TAU) / MODULES;
  const d = sectorD(inner, outer, { a0: start, a1: start + TAU / MODULES, g0: gap, g1: gap });
  return `<g transform="translate(${side * OWL.eye.x},${OWL.eye.y}) scale(${-side},1)">${filled(d)}</g>`;
}

function coreField(pos) {
  if (pos === STARTER_LESSONS - 1) return filled(toPath(OWL.beak));
  return `<circle cx="${EYE_SIDES[pos] * OWL.eye.x}" cy="${OWL.eye.y}" r="${OWL.eye.pupil}" fill="currentColor"/>`;
}

function drawOwl(lessons, { simple, uid }) {
  const brow = filled(browPath());
  const clips = [];
  const shapes = lessons.map((lesson) => {
    if (lesson.ring === 1) return shape(lesson, coreField(lesson.pos));
    if (lesson.pos < EYE_SIDES.length) return shape(lesson, eyeSector(lesson, EYE_SIDES[lesson.pos], simple));
    const clipId = `${uid}b${lesson.module}`;
    clips.push(browClip(lesson.module, simple, clipId));
    return shape(lesson, `<g clip-path="url(#${clipId})">${brow}</g>`);
  });
  return { defs: clips.join(''), shapes };
}

const OWL_DIRECTION = {
  name: 'Sowa',
  former: 28,
  draw: drawOwl,
  note: 'Dwie źrenice i dziób to rozrusznik. Oczy mają po dwa pierścienie cięte na 5 wycinków: tęczówki to krąg 2, pierścienie zewnętrzne to krąg 3, a ten sam wycinek w obu oczach to jeden filar. Brew z książki ma 5 części, po jednej na filar, w kręgu, w którym filar ma 3 lekcje.',
};
