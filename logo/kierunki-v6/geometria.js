'use strict';

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const MIN_RADIUS_FOR_TRIM = 0.5;

const fmt = (value) => String(Math.round(value * 100) / 100);

const polar = (cx, cy, radius, angle) => [
  cx + radius * Math.cos(angle),
  cy + radius * Math.sin(angle),
];

const toPath = (points) => `M${points.map(([x, y]) => `${fmt(x)},${fmt(y)}`).join('L')}Z`;

/** Łuk od kąta a0 do a1, zgodnie z ruchem wskazówek zegara. */
function arcD(cx, cy, radius, a0, a1) {
  const [x0, y0] = polar(cx, cy, radius, a0);
  const [x1, y1] = polar(cx, cy, radius, a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${fmt(x0)},${fmt(y0)}A${fmt(radius)},${fmt(radius)} 0 ${large} 1 ${fmt(x1)},${fmt(y1)}`;
}

/** Łuk pierścienia przycięty o połowę przerwy z każdej strony (przerwa w jednostkach, nie w kątach). */
function ringArc(cx, radius, span) {
  const from = span.a0 + span.g0 / (2 * radius);
  const to = span.a1 - span.g1 / (2 * radius);
  return arcD(cx, 0, radius, from, to);
}

/** Wycinek pierścienia o środku w (0,0) z przerwami stałej szerokości. */
function sectorD(inner, outer, span) {
  const trim = (radius, gap) => (radius > MIN_RADIUS_FOR_TRIM ? gap / (2 * radius) : 0);
  const outerFrom = span.a0 + trim(outer, span.g0);
  const outerTo = span.a1 - trim(outer, span.g1);
  const innerFrom = span.a0 + trim(inner, span.g0);
  const innerTo = span.a1 - trim(inner, span.g1);
  const [x0, y0] = polar(0, 0, outer, outerFrom);
  const [x1, y1] = polar(0, 0, outer, outerTo);
  const [x2, y2] = polar(0, 0, inner, innerTo);
  const [x3, y3] = polar(0, 0, inner, innerFrom);
  const large = outerTo - outerFrom > Math.PI ? 1 : 0;
  return [
    `M${fmt(x0)},${fmt(y0)}`,
    `A${fmt(outer)},${fmt(outer)} 0 ${large} 1 ${fmt(x1)},${fmt(y1)}`,
    `L${fmt(x2)},${fmt(y2)}`,
    `A${fmt(inner)},${fmt(inner)} 0 ${large} 0 ${fmt(x3)},${fmt(y3)}Z`,
  ].join('');
}

const toOpenPath = (points) => `M${points.map(([x, y]) => `${fmt(x)},${fmt(y)}`).join('L')}`;
