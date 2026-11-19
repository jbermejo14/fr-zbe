import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { CRITAIR_ORDER } from '../lib/critair';
import { parseAires, type ZfeArea } from '../lib/zfe-areas';
import { ZFE_CITIES, areasForCity, findCityBySlug } from '../lib/zfe-cities';
import { evaluateCities, isAllowed, strictestRule, upcomingAreas } from '../lib/zfe-rules';

const REFERENCE_DATE = '2026-11-19';
const FIXTURE_URL = new URL('./fixtures/aires-mini.geojson', import.meta.url);
const SAMPLE_URL = new URL('../public/datos/aires.geojson', import.meta.url);

function loadAreas(url: URL): ZfeArea[] {
  return parseAires(JSON.parse(readFileSync(url, 'utf8')));
}

describe('isAllowed', () => {
  it('V3 permite 2 y prohíbe 3, 4, 5 y NC', () => {
    assert.equal(isAllowed('2', 'V3'), true);
    assert.equal(isAllowed('3', 'V3'), false);
    assert.equal(isAllowed('5', 'V3'), false);
    assert.equal(isAllowed('NC', 'V3'), false);
  });

  it('EL prohíbe incluso el 0', () => {
    for (const critair of CRITAIR_ORDER) assert.equal(isAllowed(critair, 'EL'), false);
  });

  it('NC solo prohíbe NC', () => {
    assert.equal(isAllowed('5', 'NC'), true);
    assert.equal(isAllowed('NC', 'NC'), false);
  });

  it('V1 solo permite 0', () => {
    assert.equal(isAllowed('0', 'V1'), true);
    assert.equal(isAllowed('1', 'V1'), false);
  });
});

describe('strictestRule', () => {
  const [closed, open] = loadAreas(FIXTURE_URL);

  it('elige el umbral más estricto entre áreas vigentes', () => {
    const both = { ...open, id: 'x', rules: { vp: { threshold: 'V2' as const, openingHours: '24/7' } } };
    assert.equal(strictestRule([closed, open, both], 'vp', '2024-06-01')?.threshold, 'V3');
    assert.equal(strictestRule([open, both], 'vp', '2025-06-01')?.threshold, 'V2');
  });

  it('ignora áreas no vigentes y categorías sin regla', () => {
    assert.equal(strictestRule([closed], 'vp', '2025-06-01'), null);
    assert.equal(strictestRule([open], 'deux_rm', '2025-06-01'), null);
  });
});

describe('upcomingAreas', () => {
  const areas = loadAreas(FIXTURE_URL);

  it('devuelve solo las futuras ordenadas por fecha', () => {
    const upcoming = upcomingAreas([areas[2], areas[1], areas[0]], '2024-06-01');
    assert.deepEqual(upcoming.map((area) => area.id), ['111111111-ZFE-002', '222222222-ZFE-001']);
  });

  it('un área que empieza hoy no es futura', () => {
    assert.deepEqual(upcomingAreas(areas, '2025-01-01').map((area) => area.id), ['222222222-ZFE-001']);
  });
});

describe('evaluateCities con aires.geojson de ejemplo', () => {
  const areas = loadAreas(SAMPLE_URL);

  it('devuelve una entrada por ciudad en el orden de ZFE_CITIES', () => {
    const accesses = evaluateCities('2', 'car', areas, REFERENCE_DATE);
    assert.deepEqual(accesses.map((access) => access.city.slug), ZFE_CITIES.map((city) => city.slug));
  });

  it('Grand Paris: 2 autorisado y 3 prohibido, con horario descrito', () => {
    const allowed = evaluateCities('2', 'car', areas, REFERENCE_DATE)[0];
    const restricted = evaluateCities('3', 'car', areas, REFERENCE_DATE)[0];
    assert.equal(allowed.status, 'allowed');
    assert.equal(restricted.status, 'restricted');
    assert.equal(restricted.hoursText, 'Du lundi au vendredi, de 8 h à 20 h, sauf jours fériés');
  });

  it('deux-roues sin regla fuera de Grand Paris', () => {
    const accesses = evaluateCities('NC', 'motorcycle', areas, REFERENCE_DATE);
    assert.equal(accesses[0].status, 'restricted');
    for (const access of accesses.slice(1)) {
      assert.equal(access.status, 'no_rule');
      assert.equal(access.rule, null);
      assert.equal(access.hoursText, null);
    }
  });

  it('Lyon pasa a V2 cuando entra la segunda etapa', () => {
    const lyon = findCityBySlug('lyon');
    assert.ok(lyon);
    assert.equal(strictestRule(areasForCity(lyon, areas), 'vp', REFERENCE_DATE)?.threshold, 'V3');
    assert.equal(strictestRule(areasForCity(lyon, areas), 'vp', '2028-01-01')?.threshold, 'V2');
    assert.equal(upcomingAreas(areasForCity(lyon, areas), REFERENCE_DATE).length, 1);
  });
});
