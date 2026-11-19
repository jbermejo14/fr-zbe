import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CityAccessList } from '../components/CityAccessList.tsx';
import { CityRulesCard } from '../components/CityRulesCard.tsx';
import { CitySelector } from '../components/CitySelector.tsx';
import { CritairCalculator } from '../components/CritairCalculator.tsx';
import { CritairResultCard } from '../components/CritairResultCard.tsx';
import { SampleDataNotice } from '../components/SampleDataNotice.tsx';
import { airesErrorMessage } from '../lib/use-aires.ts';
import { mapAreaState } from '../lib/map-config.ts';
import { parseAires } from '../lib/zfe-areas.ts';
import type { ZfeArea } from '../lib/zfe-areas.ts';
import { ZFE_CITIES, cityForAreaId, findCityBySlug } from '../lib/zfe-cities.ts';
import { evaluateCities } from '../lib/zfe-rules.ts';
import type { CityAccess } from '../lib/zfe-rules.ts';

const TODAY = '2026-11-19';
const NOOP = () => undefined;
const HOME_TEST_DIR = path.dirname(fileURLToPath(import.meta.url));

function homeLoadAreas(): ZfeArea[] {
  const file = path.join(HOME_TEST_DIR, '..', 'public', 'datos', 'aires.geojson');
  return parseAires(JSON.parse(readFileSync(file, 'utf8')));
}

function homeCity(slug: string) {
  const city = findCityBySlug(slug);
  assert.ok(city, `falta la ciudad ${slug}`);
  return city;
}

test('SampleDataNotice: aviso con role="note" y texto oficial si los datos son de ejemplo', () => {
  const html = renderToStaticMarkup(<SampleDataNotice isSample />);
  assert.match(html, /role="note"/);
  assert.match(html, /Données d(?:'|&#x27;)exemple/);
  assert.match(html, /Base nationale des ZFE/);
});

test('SampleDataNotice: no pinta nada si los datos no son de ejemplo', () => {
  assert.equal(renderToStaticMarkup(<SampleDataNotice isSample={false} />), '');
});

test('SampleDataNotice: por defecto sigue AIRES_DATA_IS_SAMPLE (true en esta fase)', () => {
  assert.match(renderToStaticMarkup(<SampleDataNotice />), /role="note"/);
});

test('CityAccessList: los tres estados llevan texto, icono y enlace a la ciudad', () => {
  const [first, second, third] = ZFE_CITIES;
  const accesses: CityAccess[] = [
    { city: first, status: 'allowed', rule: { threshold: 'V3', openingHours: '24/7' }, hoursText: 'Tous les jours, 24 h/24' },
    { city: second, status: 'restricted', rule: { threshold: 'V3', openingHours: '24/7' }, hoursText: 'Tous les jours, 24 h/24' },
    { city: third, status: 'no_rule', rule: null, hoursText: null },
  ];
  const html = renderToStaticMarkup(<CityAccessList accesses={accesses} />);
  assert.match(html, /Autorisé/);
  assert.match(html, /Interdit/);
  assert.match(html, /Pas de restriction/);
  assert.match(html, /tag-green/);
  assert.match(html, /tag-red/);
  assert.equal((html.match(/<svg/g) ?? []).length, 3);
  assert.match(html, new RegExp(`href="/${first.slug}"`));
  assert.match(html, /Tous les jours, 24 h\/24/);
});

test('CityAccessList: el horario solo aparece en las ciudades con restricción', () => {
  const [first] = ZFE_CITIES;
  const html = renderToStaticMarkup(
    <CityAccessList
      accesses={[{ city: first, status: 'allowed', rule: { threshold: 'V3', openingHours: '24/7' }, hoursText: 'Tous les jours, 24 h/24' }]}
    />,
  );
  assert.doesNotMatch(html, /24 h\/24/);
});

test('CitySelector: una píldora por ciudad con aria-pressed y objetivo táctil', () => {
  const html = renderToStaticMarkup(<CitySelector selectedSlug="lyon" onSelect={NOOP} />);
  assert.equal((html.match(/<button/g) ?? []).length, ZFE_CITIES.length);
  assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 1);
  assert.match(html, /min-h-11/);
  assert.match(html, /overflow-x-auto/);
  assert.match(html, /sm:flex-wrap/);
});

test('CritairCalculator: tres botones de tipo, select de energía y nota de hybride', () => {
  const html = renderToStaticMarkup(<CritairCalculator onResult={NOOP} />);
  assert.match(html, /Type de véhicule/);
  assert.match(html, /Voiture/);
  assert.match(html, /Utilitaire léger/);
  assert.match(html, /Deux-roues motorisé/);
  assert.match(html, /aria-pressed="true"/);
  assert.match(html, /Énergie/);
  assert.match(html, /Hybride non rechargeable : choisissez Essence ou Diesel/);
  assert.match(html, /<legend[^>]*>Je connais :<\/legend>/);
  assert.match(html, /Norme Euro/);
  assert.doesNotMatch(html, /role="alert"/);
});

test('CritairResultCard: vignette, enlace oficial seguro y lista de ciudades', () => {
  const areas = homeLoadAreas();
  const accesses = evaluateCities('3', 'car', areas, TODAY);
  const html = renderToStaticMarkup(
    <CritairResultCard
      result={{ critair: '3', ruleLabel: 'Diesel Euro 4 (2006-2010)', borderlineNote: null }}
      accesses={accesses}
      airesStatus="ready"
    />,
  );
  assert.match(html, /aria-label="Vignette Crit(?:'|&#x27;)Air 3"/);
  assert.match(html, /Diesel Euro 4/);
  assert.match(html, /href="https:\/\/www\.certificat-air\.gouv\.fr\/"/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.match(html, /target="_blank"/);
  assert.match(html, /Commander la vignette sur certificat-air\.gouv\.fr/);
  assert.match(html, /Méfiez-vous des sites non officiels/);
  assert.match(html, /Interdit/);
  assert.match(html, /Autorisé|Pas de restriction/);
  assert.match(html, /aria-live="polite"/);
});

test('CritairResultCard: muestra la nota fronteriza y un texto neutro (sin alerta) si las zonas no cargan', () => {
  const html = renderToStaticMarkup(
    <CritairResultCard
      result={{ critair: 'NC', ruleLabel: 'x', borderlineNote: 'Nota de frontera' }}
      accesses={[]}
      airesStatus="error"
    />,
  );
  assert.match(html, /Nota de frontera/);
  assert.doesNotMatch(html, /role="alert"/);
  assert.match(html, /Les zones ne sont pas disponibles/);
});

test('CityRulesCard (Grand Paris): categorías, horario, enlaces y sin etapas futuras', () => {
  const areas = homeLoadAreas();
  const html = renderToStaticMarkup(<CityRulesCard city={homeCity('grand-paris')} areas={areas} isoDate={TODAY} />);
  assert.match(html, /ZFE-m du Grand Paris/);
  assert.match(html, /Voitures/);
  assert.match(html, /Utilitaires/);
  assert.match(html, /Deux-roues/);
  assert.match(html, /Interdit à partir de/);
  assert.match(html, /Du lundi au vendredi/);
  assert.match(html, /Site officiel/);
  assert.match(html, /href="\/grand-paris"/);
  assert.doesNotMatch(html, /Prochaines étapes/);
});

test('CityRulesCard (Lyon): « Aucune restriction » para deux-roues y próximas etapas con fecha fr-FR', () => {
  const areas = homeLoadAreas();
  const html = renderToStaticMarkup(<CityRulesCard city={homeCity('lyon')} areas={areas} isoDate={TODAY} />);
  assert.match(html, /Aucune restriction/);
  assert.match(html, /Prochaines étapes/);
  assert.match(html, /1er janvier 2028/);
  assert.match(html, /aria-labelledby="rules-upcoming-lyon"/);
  assert.doesNotMatch(html, /aria-label="Prochaines étapes"/);
  assert.match(html, /interdit à partir de Crit(?:'|&#x27;)Air \d/);
});

test('mapAreaState: gris sin vignette o sin regla, verde si puede circular, rojo si no', () => {
  const areas = homeLoadAreas();
  const parisArea = areas.find((area) => area.id.startsWith('200054781-'));
  const lyonArea = areas.find((area) => area.id === '200046977-ZFE-001');
  assert.ok(parisArea && lyonArea);
  assert.equal(mapAreaState(parisArea, null, 'car'), 'neutral');
  assert.equal(mapAreaState(parisArea, '2', 'car'), 'allowed');
  assert.equal(mapAreaState(parisArea, '3', 'car'), 'restricted');
  assert.equal(mapAreaState(lyonArea, '5', 'motorcycle'), 'neutral');
});

test('cityForAreaId: asigna cada área a su ciudad por SIREN', () => {
  const area = homeLoadAreas().find((candidate) => candidate.id.startsWith('200046977-'));
  assert.ok(area);
  assert.equal(cityForAreaId(area.id)?.slug, 'lyon');
});

test('airesErrorMessage: prefijo en francés con el detalle', () => {
  assert.equal(airesErrorMessage(new Error('red caída')), 'Impossible de charger les zones : red caída');
  assert.equal(airesErrorMessage('texto'), 'Impossible de charger les zones : texto');
});
