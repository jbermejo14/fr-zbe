import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { airesErrorMessage, airesFetch } from '../lib/use-aires';
import type { AiresFetchImpl } from '../lib/use-aires';

const SAMPLE_URL = new URL('../public/datos/aires.geojson', import.meta.url);
const TEST_URL = '/fr/zfe/datos/aires.geojson';
const HTTP_OK = 200;
const HTTP_NOT_FOUND = 404;

function respondWith(body: string, status = HTTP_OK): AiresFetchImpl {
  return async () => new Response(body, { status });
}

describe('airesFetch', () => {
  it('respuesta ok: devuelve las áreas', async () => {
    const areas = await airesFetch(respondWith(readFileSync(SAMPLE_URL, 'utf8')), TEST_URL);
    assert.ok(areas.length > 0);
  });

  it('pasa la URL y la señal a fetch', async () => {
    const controller = new AbortController();
    const received: { url: string; signal?: AbortSignal }[] = [];
    const spy: AiresFetchImpl = async (url, init) => {
      received.push({ url, signal: init?.signal });
      return new Response(readFileSync(SAMPLE_URL, 'utf8'));
    };
    await airesFetch(spy, TEST_URL, controller.signal);
    assert.deepEqual(received, [{ url: TEST_URL, signal: controller.signal }]);
  });

  it('respuesta no ok: el error incluye el código HTTP', async () => {
    await assert.rejects(airesFetch(respondWith('', HTTP_NOT_FOUND), TEST_URL), /404/);
  });

  it('JSON inválido para parseAires: rechaza', async () => {
    await assert.rejects(airesFetch(respondWith('{"no":"geojson"}'), TEST_URL));
  });
});

describe('airesErrorMessage', () => {
  it('prefijo en francés con el detalle', () => {
    assert.equal(airesErrorMessage(new Error('red caída')), 'Impossible de charger les zones : red caída');
  });
});
