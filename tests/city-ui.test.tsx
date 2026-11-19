import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CityFaq } from '../components/CityFaq.tsx';
import { CityRulesCard } from '../components/CityRulesCard.tsx';
import { CritairSummaryTable } from '../components/CritairSummaryTable.tsx';
import { OtherCities } from '../components/OtherCities.tsx';
import { cityFaq } from '../lib/city-page.ts';
import { CRITAIR_ORDER } from '../lib/critair.ts';
import { ZFE_CITIES, areasForCity, findCityBySlug } from '../lib/zfe-cities.ts';
import { loadAiresAtBuild } from '../lib/zfe-areas-server.ts';

const TODAY = '2026-11-19';

function cityUiCity(slug: string) {
  const city = findCityBySlug(slug);
  assert.ok(city, `falta la ciudad ${slug}`);
  return city;
}

test('CritairSummaryTable: una fila por vignette, textos Autorisé / Interdit y scroll propio', () => {
  const areas = areasForCity(cityUiCity('grand-paris'), loadAiresAtBuild());
  const html = renderToStaticMarkup(<CritairSummaryTable cityAreas={areas} isoDate={TODAY} />);
  const body = html.match(/<tbody>[\s\S]*<\/tbody>/)?.[0] ?? '';
  assert.equal(body.match(/<tr>/g)?.length, CRITAIR_ORDER.length);
  assert.match(html, /Autorisé/);
  assert.match(html, /Interdit/);
  assert.match(html, /overflow-x-auto/);
  assert.match(html, /Voitures/);
  assert.match(html, /Deux-roues/);
});

test('CritairSummaryTable: « Libre » cuando no hay regla', () => {
  const html = renderToStaticMarkup(<CritairSummaryTable cityAreas={[]} isoDate={TODAY} />);
  assert.match(html, /Libre/);
  assert.doesNotMatch(html, /Interdit/);
});

test('CityFaq: details/summary con cada pregunta y respuesta', () => {
  const city = cityUiCity('lyon');
  const entries = cityFaq(city, areasForCity(city, loadAiresAtBuild()), TODAY);
  const html = renderToStaticMarkup(<CityFaq entries={entries} />);
  assert.equal(html.match(/<details/g)?.length, entries.length);
  assert.equal(html.match(/<summary/g)?.length, entries.length);
  assert.match(html, /68 €/);
});

test('OtherCities: enlaces a las otras 9 ciudades, sin la actual', () => {
  const html = renderToStaticMarkup(<OtherCities currentSlug="lyon" />);
  assert.equal(html.match(/<a /g)?.length, ZFE_CITIES.length - 1);
  assert.doesNotMatch(html, /href="\/lyon"/);
  assert.match(html, /href="\/grand-paris"/);
});

test('CritairSummaryTable: caption accesible solo para lectores de pantalla', () => {
  const html = renderToStaticMarkup(<CritairSummaryTable cityAreas={[]} isoDate={TODAY} />);
  assert.match(html, /<caption class="sr-only">Vignettes Crit(?:'|&#x27;)Air autorisées par catégorie de véhicule<\/caption>/);
});

test('CityRulesCard: showFullPageLink=false oculta el enlace a la propia ficha', () => {
  const city = cityUiCity('lyon');
  const areas = areasForCity(city, loadAiresAtBuild());
  const withLink = renderToStaticMarkup(<CityRulesCard city={city} areas={areas} isoDate={TODAY} />);
  const withoutLink = renderToStaticMarkup(
    <CityRulesCard city={city} areas={areas} isoDate={TODAY} showFullPageLink={false} />,
  );
  assert.match(withLink, /Voir la fiche complète/);
  assert.doesNotMatch(withoutLink, /Voir la fiche complète/);
});
