import { test } from 'node:test';
import assert from 'node:assert/strict';
import sitemap, { dynamic } from '../app/sitemap.ts';
import { absoluteUrl } from '../lib/site.ts';
import { ZFE_CITIES } from '../lib/zfe-cities.ts';

test('sitemap: portada y las 10 ciudades, y nada más', () => {
  const urls = sitemap().map((entry) => entry.url);
  assert.equal(urls.length, ZFE_CITIES.length + 1);
  assert.equal(urls[0], absoluteUrl('/'));
  for (const city of ZFE_CITIES) assert.ok(urls.includes(absoluteUrl(`/${city.slug}`)), city.slug);
});

test('sitemap: sin páginas legales y exportación estática', () => {
  const urls = sitemap().map((entry) => entry.url);
  for (const legal of ['/mentions-legales', '/confidentialite', '/cookies']) {
    assert.ok(!urls.includes(absoluteUrl(legal)), legal);
  }
  assert.equal(dynamic, 'force-static');
});
