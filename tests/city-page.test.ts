import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CITY_PAGE_FINE_EUROS, cityFaq, cityMetadata, summaryRows } from '../lib/city-page.ts';
import { CRITAIR_ORDER } from '../lib/critair.ts';
import { parseAires } from '../lib/zfe-areas.ts';
import type { ZfeArea } from '../lib/zfe-areas.ts';
import { loadAiresAtBuild } from '../lib/zfe-areas-server.ts';
import { ZFE_CITIES, areasForCity, findCityBySlug } from '../lib/zfe-cities.ts';

const TODAY = '2026-11-19';
const META_DESCRIPTION_MAX = 160;
const CITY_TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(CITY_TEST_DIR, '..');

function cityTestAreas(slug: string) {
  const city = findCityBySlug(slug);
  assert.ok(city, `falta la ciudad ${slug}`);
  return { city, areas: areasForCity(city, loadAiresAtBuild()) };
}

test('loadAiresAtBuild: lee el mismo fichero que public/datos/aires.geojson', () => {
  const file = path.join(PROJECT_ROOT, 'public', 'datos', 'aires.geojson');
  const expected = parseAires(JSON.parse(readFileSync(file, 'utf8')));
  assert.deepEqual(loadAiresAtBuild(), expected);
});

test('summaryRows: una fila por vignette en el orden de CRITAIR_ORDER', () => {
  const { areas } = cityTestAreas('grand-paris');
  assert.deepEqual(summaryRows(areas, TODAY).map((row) => row.critair), [...CRITAIR_ORDER]);
});

test('summaryRows Grand Paris: 2 autorisé y 4 interdit en voitures', () => {
  const { areas } = cityTestAreas('grand-paris');
  const rows = summaryRows(areas, TODAY);
  assert.equal(rows.find((row) => row.critair === '2')?.vp, 'allowed');
  assert.equal(rows.find((row) => row.critair === '3')?.vp, 'allowed');
  assert.equal(rows.find((row) => row.critair === '4')?.vp, 'restricted');
  assert.equal(rows.find((row) => row.critair === 'NC')?.vp, 'restricted');
});

test('summaryRows: Lyon prohíbe a partir de CritAir 3; sin áreas todo es no_rule', () => {
  const { areas } = cityTestAreas('lyon');
  assert.equal(summaryRows(areas, TODAY).find((row) => row.critair === '2')?.vp, 'allowed');
  assert.equal(summaryRows(areas, TODAY).find((row) => row.critair === '3')?.vp, 'restricted');
  assert.ok(summaryRows([], TODAY).every((row) => row.vp === 'no_rule' && row.vul === 'no_rule'));
});

test('cityFaq: próximas etapas presentes en ciudades con áreas futuras (ej. Strasbourg)', () => {
  for (const city of ZFE_CITIES) {
    const questions = cityFaq(city, cityTestAreas(city.slug).areas, TODAY).map((entry) => entry.question);
    const hasUpcoming = questions.some((question) => question.includes('prochaines étapes'));
    if (city.slug === 'strasbourg') {
      assert.equal(hasUpcoming, true, 'strasbourg');
    }
  }
});

test('cityFaq: contiene la amende de 68 €, certificat-air y la web oficial de la ciudad', () => {
  const { city, areas } = cityTestAreas('grand-paris');
  const text = cityFaq(city, areas, TODAY).map((entry) => entry.answer).join(' ');
  assert.equal(CITY_PAGE_FINE_EUROS, 68);
  assert.match(text, /68 €/);
  assert.match(text, /certificat-air\.gouv\.fr/);
  assert.ok(text.includes(city.infoUrl));
});

test("cityFaq: la respuesta de vignettes interdites de Grand Paris lista las viñetas prohibidas", () => {
  const { city, areas } = cityTestAreas('grand-paris');
  const [banned] = cityFaq(city, areas, TODAY);
  assert.match(banned.answer, /Crit'Air 4 et 5 et les véhicules non classés/);
});

test('cityFaq: sin áreas vigentes no inventa restricciones', () => {
  const city = findCityBySlug('lyon');
  assert.ok(city);
  const [banned, hours] = cityFaq(city, [], TODAY);
  assert.match(banned.answer, /aucune restriction/);
  assert.match(hours.answer, /aucune restriction/);
});

test('cityMetadata: títulos y descripciones únicos en las 10 ciudades; descripción de 160 como máximo', () => {
  const metadata = ZFE_CITIES.map((city) => cityMetadata(city, cityTestAreas(city.slug).areas, TODAY));
  assert.equal(new Set(metadata.map((item) => item.title)).size, ZFE_CITIES.length);
  assert.equal(new Set(metadata.map((item) => item.description)).size, ZFE_CITIES.length);
  assert.ok(metadata.every((item) => item.description.length <= META_DESCRIPTION_MAX));
});

test("cityMetadata: título con ciudad y año; la descripción nombra la vignette prohibida", () => {
  const { city, areas } = cityTestAreas('lyon');
  const metadata = cityMetadata(city, areas, TODAY);
  assert.match(metadata.title, /^ZFE Lyon \d{4} : Crit'Air interdits, horaires$/);
  assert.match(metadata.description, /Crit'Air 3/);
});

test('cityFaq: la primera respuesta es una frase completa con verbo', () => {
  const { city, areas } = cityTestAreas('lyon');
  const [banned] = cityFaq(city, areas, TODAY);
  assert.match(banned.answer, /^Au \d{1,2} [a-zéû]+ \d{4}, dans la ZFE de Lyon : /);
  assert.match(banned.answer, /sont interdits les véhicules/);
});

test('cityFaq: el horario va en minúscula tras « : »', () => {
  const { city, areas } = cityTestAreas('grand-paris');
  const hours = cityFaq(city, areas, TODAY)[1].answer;
  assert.match(hours, /Voitures : du lundi au vendredi/);
  assert.doesNotMatch(hours, /: [A-ZÉ]/);
});

const NC_AREA_START = '2028-01-01';

function cityTestNcArea(): ZfeArea {
  return {
    id: '200046977-ZFE-NC',
    startDate: NC_AREA_START,
    endDate: null,
    rules: { vp: { threshold: 'NC', openingHours: 'Mo-Su 00:00-24:00' } },
    decreeUrl: null,
    infoUrl: null,
    geometry: { type: 'Polygon', coordinates: [] },
  };
}

test('umbral NC: « à partir des véhicules non classés » en description y prochaines étapes', () => {
  const city = findCityBySlug('lyon');
  assert.ok(city);
  const area = cityTestNcArea();
  const upcoming = cityFaq(city, [area], TODAY).find((entry) => entry.question.includes('prochaines étapes'));
  assert.ok(upcoming);
  assert.match(upcoming.answer, /interdits à partir des véhicules non classés/);
  const description = cityMetadata(city, [{ ...area, startDate: '2020-01-01' }], TODAY).description;
  assert.match(description, /interdites à partir des véhicules non classés/);
  assert.doesNotMatch(description, /de les/);
});

test('cityMetadata: el año del título sale de isoDate', () => {
  const { city, areas } = cityTestAreas('lyon');
  assert.match(cityMetadata(city, areas, '2031-05-01').title, /^ZFE Lyon 2031 /);
});

const GRAND_PARIS_OF_NAME = 'du Grand Paris';
const TITLE_SUFFIX = ' | Ododex';
const TITLE_MAX = 60;

test('ofName: cada ciudad lo tiene y Grand Paris usa « du »', () => {
  for (const city of ZFE_CITIES) assert.match(city.ofName, /^(du|de) /, city.slug);
  assert.equal(findCityBySlug('grand-paris')?.ofName, GRAND_PARIS_OF_NAME);
  assert.equal(findCityBySlug('lyon')?.ofName, 'de Lyon');
});

test('ninguna frase de Grand Paris dice « de Grand Paris » y el título cabe en 60 caracteres', () => {
  const { city, areas } = cityTestAreas('grand-paris');
  const metadata = cityMetadata(city, areas, TODAY);
  const faq = cityFaq(city, areas, TODAY).map((entry) => `${entry.question} ${entry.answer}`);
  const text = [metadata.title, metadata.description, ...faq].join(' ');
  assert.doesNotMatch(text, /de Grand Paris/);
  assert.match(text, /ZFE du Grand Paris/);
  assert.ok(`${metadata.title}${TITLE_SUFFIX}`.length <= TITLE_MAX, metadata.title);
});
