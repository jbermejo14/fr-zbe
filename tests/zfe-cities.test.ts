import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { isAreaActive, parseAires } from '../lib/zfe-areas';
import { ZFE_CITIES, areasForCity, findCityBySlug } from '../lib/zfe-cities';

const REFERENCE_DATE = '2026-11-19';
const EXPECTED_CITY_COUNT = 10;
const SAMPLE_PATH = new URL('../public/datos/aires.geojson', import.meta.url);

function loadSampleAreas() {
  return parseAires(JSON.parse(readFileSync(SAMPLE_PATH, 'utf8')));
}

describe('ZFE_CITIES', () => {
  it('tiene las 10 ciudades en el orden del selector', () => {
    assert.deepEqual(
      ZFE_CITIES.map((city) => city.slug),
      ['grand-paris', 'lyon', 'marseille', 'toulouse', 'nice', 'strasbourg', 'grenoble', 'montpellier', 'rouen', 'reims'],
    );
    assert.equal(ZFE_CITIES.length, EXPECTED_CITY_COUNT);
  });

  it('slugs y SIREN únicos, con 9 cifras', () => {
    assert.equal(new Set(ZFE_CITIES.map((city) => city.slug)).size, EXPECTED_CITY_COUNT);
    assert.equal(new Set(ZFE_CITIES.map((city) => city.siren)).size, EXPECTED_CITY_COUNT);
    for (const city of ZFE_CITIES) assert.match(city.siren, /^\d{9}$/);
  });

  it('centros dentro de Francia metropolitana y zoom 11-12', () => {
    for (const city of ZFE_CITIES) {
      const [lat, lon] = city.center;
      assert.ok(lat > 41 && lat < 51.5, city.slug);
      assert.ok(lon > -5.5 && lon < 10, city.slug);
      assert.ok(city.zoom === 11 || city.zoom === 12, city.slug);
      assert.match(city.infoUrl, /^https:\/\//);
    }
  });
});

describe('findCityBySlug', () => {
  it('encuentra o devuelve null', () => {
    assert.equal(findCityBySlug('lyon')?.name, 'Lyon');
    assert.equal(findCityBySlug('atlantis'), null);
  });
});

describe('areasForCity con aires.geojson de ejemplo', () => {
  const areas = loadSampleAreas();

  it('cada ciudad tiene al menos un área vigente el 2026-11-19', () => {
    for (const city of ZFE_CITIES) {
      const active = areasForCity(city, areas).filter((area) => isAreaActive(area, REFERENCE_DATE));
      assert.ok(active.length >= 1, `${city.slug} (${city.siren}) sin área vigente`);
    }
  });

  it('Lyon tiene dos áreas y el resto una', () => {
    for (const city of ZFE_CITIES) {
      const expected = city.slug === 'lyon' ? 2 : 1;
      assert.equal(areasForCity(city, areas).length, expected, city.slug);
    }
  });
});
