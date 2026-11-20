'use strict';

const PLAY_STEP_MS = 220;
const VARIANT_SIZES = { detailed: 112, small: [48, 24] };
const COLOR_COUNTS = [
  { theme: 'k3', label: '3 kolory' },
  { theme: 'k2', label: '2 kolory' },
  { theme: 'k1', label: '1 kolor' },
];
const BACKGROUNDS = [
  { theme: 'jasne', label: 'jasne tło' },
  { theme: 'ciemne', label: 'ciemne tło' },
];
// Układy kolorów z palety strony, w kolejności: jądro / krąg 2 / krąg 3.
const COLOR_NAMES = { wine: 'burgund', navy: 'granat', yellow: 'żółty', green: 'zieleń', plum: 'śliwka', cream: 'krem', pale: 'blady' };
const LIGHT_LAYOUTS = [
  ['wine', 'navy', 'yellow'],
  ['yellow', 'navy', 'wine'],
  ['navy', 'wine', 'yellow'],
  ['yellow', 'wine', 'navy'],
  ['wine', 'yellow', 'navy'],
  ['navy', 'yellow', 'wine'],
  ['yellow', 'navy', 'green'],
  ['wine', 'green', 'yellow'],
];
// Na ciemnym tle paleta ma tylko dwa wyraźnie różne jasne kolory (krem i żółty), więc kręgi rozdziela ich przeplot.
const DARK_LAYOUTS = [
  ['yellow', 'cream', 'yellow'],
  ['cream', 'yellow', 'cream'],
  ['yellow', 'cream', 'cream'],
  ['cream', 'cream', 'yellow'],
  ['pale', 'cream', 'yellow'],
  // z burgundem: na ciemnych tłach palety ma kontrast ok. 1,0–1,3 : 1, zostawione do oceny na żywo
  ['wine', 'cream', 'yellow'],
  ['wine', 'yellow', 'cream'],
  ['yellow', 'cream', 'wine'],
  ['cream', 'yellow', 'wine'],
  ['yellow', 'wine', 'cream'],
  ['cream', 'wine', 'yellow'],
];
const DARK_BACKGROUNDS = [['navy'], ['wine'], ['green'], ['plum']];
const LAYOUT_CONTROLS = [
  { id: 'uklad-jasny', options: LIGHT_LAYOUTS, properties: ['--l1', '--l2', '--l3'] },
  { id: 'uklad-ciemny', options: DARK_LAYOUTS, properties: ['--d1', '--d2', '--d3'] },
  { id: 'tlo-ciemne', options: DARK_BACKGROUNDS, properties: ['--dark-bg'] },
];
// Numery 1–6 z poprzedniej stykówki zostają; 3 (oko z wersami) i 6 (sowa) odpadły.
const PREVIEW = [
  { number: 1, direction: EYE_DIRECTION },
  { number: 2, direction: BLOCKS_DIRECTION },
  { number: 4, direction: EYE_BOOK_DIRECTION },
  { number: 5, direction: RUSH_DIRECTION },
];
const LETTERS = 'abcdefghijkl';

const state = { done: TOTAL_LESSONS, split: 2, colors: 'k3', timer: null };

const elements = {
  list: document.getElementById('kierunki'),
  range: document.getElementById('postep'),
  counter: document.getElementById('licznik'),
  play: document.getElementById('odtworz'),
  form: document.getElementById('ster'),
};

function stagesFor(split) {
  const afterRingTwo = STARTER_LESSONS + MODULES * split;
  return [
    { done: 0, label: 'start, nic nie ukończone' },
    { done: STARTER_LESSONS, label: `po rozruszniku (${STARTER_LESSONS} lekcje)` },
    { done: afterRingTwo, label: `po kręgu 2 (${afterRingTwo} lekcji)` },
    { done: TOTAL_LESSONS, label: `pełne logo (${TOTAL_LESSONS} lekcji)` },
  ];
}

const figure = (pole, content, caption, isLive = false) =>
  `<figure><div class="pole ${pole}"${isLive ? ' data-live' : ''}>${content}</div><figcaption>${caption}</figcaption></figure>`;

const sized = (svg, size) => svg.replace('<svg ', `<svg width="${size}" height="${size}" `);

/** Pełne logo w danej liczbie kolorów: duże z podziałem na lekcje i dwa małe bez podziału. */
function variantFigure(direction, number, letter, background, count) {
  const full = { done: TOTAL_LESSONS, split: state.split };
  const detailed = sized(logoSvg(direction, full), VARIANT_SIZES.detailed);
  const simple = logoSvg(direction, { ...full, simple: true });
  const small = VARIANT_SIZES.small.map((size) => sized(simple, size)).join('');
  const caption = `${number}${letter} · ${count.label}, ${background.label}`;
  return figure(`pole-wariant ${background.theme} ${count.theme}`, detailed + small, caption);
}

function variantsHtml(direction, number) {
  const firstLetter = 6;
  return BACKGROUNDS.flatMap((background, row) =>
    COLOR_COUNTS.map((count, column) => {
      const letter = LETTERS[firstLetter + row * COLOR_COUNTS.length + column];
      return variantFigure(direction, number, letter, background, count);
    }),
  ).join('');
}

function referenceFigure(direction, number) {
  if (!direction.reference) return '';
  const { src, alt } = direction.reference;
  const image = `<img src="${src}" width="1024" height="1024" alt="${alt}">`;
  return `<figure class="zrodlo"><div class="pole pole-zrodlo">${image}</div><figcaption>${number}m · oryginalna generacja, do porównania</figcaption></figure>`;
}

function cardHtml({ number, direction }) {
  const live = () => logoSvg(direction, { done: state.done, split: state.split });
  const colors = COLOR_COUNTS.find((count) => count.theme === state.colors);
  const stages = stagesFor(state.split)
    .map((stage, at) => {
      const svg = logoSvg(direction, { done: stage.done, split: state.split });
      return figure(`pole-etap jasne ${colors.theme}`, svg, `${number}${LETTERS[at + 2]} · ${stage.label}`);
    })
    .join('');
  return `<article class="kierunek">
    <h2>${number}. ${direction.name} <small>dawniej ${direction.former}</small></h2>
    <p class="opis">${direction.note}</p>
    <div class="uklad">
      ${figure(`pole-duze jasne ${colors.theme}`, live(), `${number}a · sterowane suwakiem, ${colors.label}, jasne tło`, true)}
      ${figure(`pole-duze ciemne ${colors.theme}`, live(), `${number}b · sterowane suwakiem, ${colors.label}, ciemne tło`, true)}
      <div class="etapy">${stages}</div>
      <div class="warianty">${variantsHtml(direction, number)}</div>
      ${referenceFigure(direction, number)}
    </div>
  </article>`;
}

function showProgress() {
  elements.range.value = String(state.done);
  elements.counter.textContent = `${state.done} / ${TOTAL_LESSONS}`;
  elements.list.querySelectorAll('[data-live] .s').forEach((node) => {
    node.classList.toggle('on', Number(node.dataset.i) < state.done);
  });
}

function renderAll() {
  elements.list.innerHTML = PREVIEW.map(cardHtml).join('');
  showProgress();
}

function stopPlaying() {
  if (state.timer === null) return;
  clearInterval(state.timer);
  state.timer = null;
}

function handlePlayClick() {
  stopPlaying();
  state.done = 0;
  showProgress();
  state.timer = setInterval(() => {
    state.done += 1;
    showProgress();
    if (state.done >= TOTAL_LESSONS) stopPlaying();
  }, PLAY_STEP_MS);
}

function handleRangeInput() {
  stopPlaying();
  state.done = Number(elements.range.value);
  showProgress();
}

/** Przepisuje wybrany układ na zmienne CSS; znaki przebarwiają się bez przerysowania. */
function applyLayouts() {
  LAYOUT_CONTROLS.forEach(({ id, options, properties }) => {
    const colors = options[Number(document.getElementById(id).value)];
    properties.forEach((property, index) => document.body.style.setProperty(property, `var(--${colors[index]})`));
  });
}

function fillLayoutControls() {
  LAYOUT_CONTROLS.forEach(({ id, options }) => {
    document.getElementById(id).innerHTML = options
      .map((colors, index) => `<option value="${index}">${colors.map((color) => COLOR_NAMES[color]).join(' / ')}</option>`)
      .join('');
  });
}

function handleFormChange(event) {
  const { name, value } = event.target;
  if (LAYOUT_CONTROLS.some((control) => control.id === name)) {
    applyLayouts();
    return;
  }
  if (name === 'podzial') state.split = Number(value);
  else if (name === 'kolory') state.colors = value;
  else return;
  renderAll();
}

elements.range.addEventListener('input', handleRangeInput);
elements.play.addEventListener('click', handlePlayClick);
elements.form.addEventListener('change', handleFormChange);
fillLayoutControls();
applyLayouts();
renderAll();
