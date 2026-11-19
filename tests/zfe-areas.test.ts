import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { AiresFormatError, categoryFor, isAreaActive, parseAires } from '../lib/zfe-areas';

const FIXTURE_URL = new URL('./fixtures/aires-mini.geojson', import.meta.url);

function loadMini(): { type: string; features: Array<{ properties: Record<string, unknown>; geometry: unknown }> } {
  return JSON.parse(readFileSync(FIXTURE_URL, 'utf8'));
}

function parseWithProps(changes: Record<string, unknown>) {
  const json = loadMini();
  Object.assign(json.features[0].properties, changes);
  return parseAires(json);
}

describe('parseAires: datos válidos', () => {
  const areas = parseAires(loadMini());

  it('lee las tres áreas', () => {
    assert.equal(areas.length, 3);
    assert.deepEqual(areas.map((area) => area.id), ['111111111-ZFE-001', '111111111-ZFE-002', '222222222-ZFE-001']);
  });

  it('convierte reglas, fechas y enlaces', () => {
    assert.equal(areas[0].endDate, '2024-12-31');
    assert.deepEqual(areas[0].rules, { vp: { threshold: 'V3', openingHours: '24/7' } });
    assert.equal(areas[0].decreeUrl, null);
    assert.equal(areas[1].endDate, null);
    assert.equal(areas[1].rules.vul?.threshold, 'V2');
    assert.equal(areas[1].decreeUrl, 'https://example.org/arrete');
    assert.equal(areas[1].infoUrl, 'https://example.org/info');
    assert.equal(areas[2].rules.vp?.threshold, 'EL');
  });

  it('ignora propiedades desconocidas y conserva la geometría', () => {
    assert.deepEqual(Object.keys(areas[0].rules), ['vp']);
    assert.equal(areas[0].geometry.type, 'Polygon');
    assert.equal(areas[1].geometry.type, 'MultiPolygon');
  });
});

describe('parseAires: errores', () => {
  it('no es FeatureCollection', () => {
    assert.throws(() => parseAires({ type: 'Feature' }), AiresFormatError);
    assert.throws(() => parseAires(null), AiresFormatError);
    assert.throws(() => parseAires({ type: 'FeatureCollection' }), AiresFormatError);
  });

  it('falta id', () => {
    assert.throws(() => parseWithProps({ id: undefined }), /feature 0.*"id"/);
  });

  it('falta date_debut', () => {
    assert.throws(() => parseWithProps({ date_debut: undefined }), /feature 0.*"date_debut"/);
  });

  it('fecha mal formada o inexistente', () => {
    assert.throws(() => parseWithProps({ date_debut: '01/01/2020' }), /date_debut/);
    assert.throws(() => parseWithProps({ date_fin: '2024-02-30' }), /date_fin/);
  });

  it('date_fin mal formada no nula', () => {
    assert.throws(() => parseWithProps({ date_fin: 20241231 }), /feature 0.*"date_fin"/);
    assert.throws(() => parseWithProps({ date_fin: '' }), /feature 0.*"date_fin"/);
  });

  it('feature que no es objeto', () => {
    const json = loadMini();
    (json.features as unknown[])[1] = 'texto';
    assert.throws(() => parseAires(json), /feature 1.*no es un objeto/);
  });

  it('feature sin properties', () => {
    const json = loadMini();
    delete (json.features[0] as { properties?: unknown }).properties;
    assert.throws(() => parseAires(json), /feature 0.*"properties"/);
  });

  it('geometría sin coordinates', () => {
    const json = loadMini();
    json.features[0].geometry = { type: 'Polygon' };
    assert.throws(() => parseAires(json), /feature 0.*"geometry"/);
  });

  it('critair fuera del enum', () => {
    assert.throws(() => parseWithProps({ vp_critair: 'V9' }), /vp_critair/);
  });

  it('critair sin horaires y al revés', () => {
    assert.throws(() => parseWithProps({ vp_horaires: null }), /vp_horaires/);
    assert.throws(() => parseWithProps({ vul_horaires: '24/7' }), /vul_critair/);
  });

  it('geometría no poligonal', () => {
    const json = loadMini();
    json.features[1].geometry = { type: 'Point', coordinates: [2, 48] };
    assert.throws(() => parseAires(json), /feature 1.*geometry/);
  });
});

describe('isAreaActive', () => {
  const [closed, open, future] = parseAires(loadMini());

  it('respeta el inicio y el fin incluidos', () => {
    assert.equal(isAreaActive(closed, '2019-12-31'), false);
    assert.equal(isAreaActive(closed, '2020-01-01'), true);
    assert.equal(isAreaActive(closed, '2024-12-31'), true);
    assert.equal(isAreaActive(closed, '2025-01-01'), false);
  });

  it('sin fecha de fin sigue vigente', () => {
    assert.equal(isAreaActive(open, '2025-01-01'), true);
    assert.equal(isAreaActive(open, '2099-01-01'), true);
    assert.equal(isAreaActive(future, '2026-11-19'), false);
  });
});

describe('categoryFor', () => {
  it('mapea tipos de vehículo', () => {
    assert.equal(categoryFor('car'), 'vp');
    assert.equal(categoryFor('van'), 'vul');
    assert.equal(categoryFor('motorcycle'), 'deux_rm');
  });
});
