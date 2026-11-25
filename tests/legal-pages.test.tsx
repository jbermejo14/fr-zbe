import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import MentionsLegalesPage, { metadata as mentionsMetadata } from '../app/mentions-legales/page.tsx';
import ConfidentialitePage, { metadata as confidentialiteMetadata } from '../app/confidentialite/page.tsx';
import CookiesPage, { metadata as cookiesMetadata } from '../app/cookies/page.tsx';
import { AdSenseScript } from '../components/AdSenseScript.tsx';
import { AdSlot } from '../components/AdSlot.tsx';
import { Footer } from '../components/Footer.tsx';
import { getTitular } from '../lib/legal.ts';
import { legalHolderValue, legalMetadata, legalReviewDate } from '../lib/legal-text.ts';
import { absoluteUrl } from '../lib/site.ts';

const TEST_ADSENSE_CLIENT = 'ca-pub-0000000000000000';
const TEST_ADSENSE_SLOT = '0000000000';
const LEGAL_ROUTES = ['/mentions-legales', '/confidentialite', '/cookies'];
// renderToStaticMarkup escapa el apóstrofo recto como &#x27;.
const APOSTROPHE = "(?:'|&#x27;)";

function legalWithEnv(name: string, value: string | undefined, check: () => void): void {
  const previous = process.env[name];
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
  try {
    check();
  } finally {
    if (previous === undefined) delete process.env[name];
    else process.env[name] = previous;
  }
}

const legalWithAdSense = (value: string | undefined, check: () => void) =>
  legalWithEnv('NEXT_PUBLIC_ADSENSE_CLIENT', value, check);

test('mentions légales: titular o marcador, fuente de datos, licencia y no afiliación', () => {
  const html = renderToStaticMarkup(<MentionsLegalesPage />);
  assert.ok(html.includes(legalHolderValue(getTitular(), 'nombre')));
  assert.match(html, /LCEN/);
  assert.match(html, /Base nationale des ZFE/);
  assert.match(html, /Licence Ouverte/);
  assert.match(html, /certificat-air\.gouv\.fr/);
  assert.match(html, new RegExp(`n${APOSTROPHE}est pas affilié`));
});

test('confidentialité: titular, calculadora en el navegador, teselas OpenStreetMap y CNIL/AEPD', () => {
  const html = renderToStaticMarkup(<ConfidentialitePage />);
  assert.ok(html.includes(legalHolderValue(getTitular(), 'nombre')));
  assert.match(html, /uniquement dans votre navigateur/);
  assert.match(html, /tile\.openstreetmap\.org/);
  assert.match(html, /AEPD/);
  assert.match(html, /cnil\.fr/);
});

test('cookies: documenta ododex-theme y, con AdSense, el enlace de Google y el botón', () => {
  legalWithAdSense(undefined, () => {
    const html = renderToStaticMarkup(<CookiesPage />);
    assert.ok(html.includes('ododex-theme'));
    assert.doesNotMatch(html, /policies\.google\.com/);
  });
  legalWithAdSense(TEST_ADSENSE_CLIENT, () => {
    const html = renderToStaticMarkup(<CookiesPage />);
    assert.ok(html.includes('https://policies.google.com/technologies/cookies?hl=fr'));
    assert.match(html, /Gérer les cookies/);
  });
});

test('las tres páginas legales no se indexan pero siguen sus enlaces, con canonical', () => {
  for (const metadata of [mentionsMetadata, confidentialiteMetadata, cookiesMetadata]) {
    assert.deepEqual(metadata.robots, { index: false, follow: true });
    assert.ok(metadata.alternates?.canonical);
  }
});

test('legalMetadata: robots noindex y follow, y canonical absoluto de la ruta', () => {
  const metadata = legalMetadata('/ruta-de-prueba', 'Titre', 'Description');
  assert.deepEqual(metadata.robots, { index: false, follow: true });
  assert.equal(metadata.title, 'Titre');
  assert.equal(metadata.description, 'Description');
  assert.equal(metadata.alternates?.canonical, absoluteUrl('/ruta-de-prueba'));
});

test('confidentialité con AdSense activo: párrafos de Google y retirada del consentimiento', () => {
  legalWithAdSense(TEST_ADSENSE_CLIENT, () => {
    const html = renderToStaticMarkup(<ConfidentialitePage />);
    assert.match(html, /Google AdSense/);
    assert.match(html, /pour la publicité, votre consentement/);
    assert.match(html, /Il en va de même pour Google/);
    assert.match(html, /retirer votre consentement à tout moment/);
  });
  legalWithAdSense(undefined, () => {
    const html = renderToStaticMarkup(<ConfidentialitePage />);
    assert.doesNotMatch(html, /retirer votre consentement/);
  });
});

test('las páginas legales no contienen restos de otras webs ni de la normativa española', () => {
  for (const html of [
    renderToStaticMarkup(<MentionsLegalesPage />),
    renderToStaticMarkup(<ConfidentialitePage />),
    renderToStaticMarkup(<CookiesPage />)
  ]) {
    assert.doesNotMatch(html, /carburant|DGT|LSSI|ZBE|radar/i);
    assert.match(html, /Dernière mise à jour/);
  }
});

test('legalReviewDate formatea la fecha en francés', () => {
  assert.equal(legalReviewDate('2026-11-19'), '19 novembre 2026');
});

test('legalHolderValue: campo vacío → marcador en francés', () => {
  const holder = getTitular();
  assert.equal(legalHolderValue({ ...holder, nombre: '' }, 'nombre'), '[à compléter : nom]');
  assert.equal(legalHolderValue({ ...holder, nombre: 'Prénom Nom' }, 'nombre'), 'Prénom Nom');
});

test('AdSenseScript no renderiza nada sin variable o con valor inválido', () => {
  legalWithAdSense(undefined, () => assert.equal(AdSenseScript(), null));
  legalWithAdSense('', () => assert.equal(AdSenseScript(), null));
  legalWithAdSense('ca-pub-123', () => assert.equal(AdSenseScript(), null));
});

test('AdSenseScript renderiza el script con un ca-pub válido', () => {
  legalWithAdSense(TEST_ADSENSE_CLIENT, () => {
    const element = AdSenseScript();
    assert.ok(element);
    assert.equal(
      element.props.src,
      `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${TEST_ADSENSE_CLIENT}`
    );
    assert.equal(element.props.strategy, 'afterInteractive');
    assert.equal(element.props.crossOrigin, 'anonymous');
  });
});

test('AdSlot: sin configurar no pinta nada; configurado, lleva la etiqueta « Publicité »', () => {
  legalWithAdSense(undefined, () => assert.equal(renderToStaticMarkup(<AdSlot />), ''));
  legalWithAdSense(TEST_ADSENSE_CLIENT, () => {
    legalWithEnv('NEXT_PUBLIC_ADSENSE_SLOT', TEST_ADSENSE_SLOT, () => {
      assert.match(renderToStaticMarkup(<AdSlot />), /Publicité/);
    });
  });
});

test('Footer: Accueil y enlaces legales siempre; botón de cookies solo si se pide', () => {
  const without = renderToStaticMarkup(<Footer />);
  for (const route of ['/', ...LEGAL_ROUTES]) {
    assert.ok(without.includes(`href="${route}"`), `Falta ${route}`);
  }
  assert.ok(!without.includes('Gérer les cookies'));
  assert.ok(renderToStaticMarkup(<Footer showConsent />).includes('Gérer les cookies'));
});

test('Footer: fuente de datos, Licence Ouverte y aviso de no afiliación', () => {
  const html = renderToStaticMarkup(<Footer />);
  assert.ok(html.includes('transport.data.gouv.fr'));
  assert.match(html, /Base nationale des ZFE/);
  assert.match(html, /Licence Ouverte/);
  assert.match(html, new RegExp(`n${APOSTROPHE}est pas affilié à l${APOSTROPHE}administration`));
});

test('las páginas legales tienen Open Graph propio con título, descripción, url e imagen', () => {
  const pages = [
    { metadata: mentionsMetadata, path: '/mentions-legales' },
    { metadata: confidentialiteMetadata, path: '/confidentialite' },
    { metadata: cookiesMetadata, path: '/cookies' },
  ];
  for (const { metadata, path } of pages) {
    assert.equal(metadata.openGraph?.url, absoluteUrl(path));
    assert.equal(metadata.openGraph?.title, metadata.title);
    assert.equal(metadata.openGraph?.description, metadata.description);
    assert.ok(Array.isArray(metadata.openGraph?.images) && metadata.openGraph.images.length > 0);
    assert.deepEqual(metadata.robots, { index: false, follow: true });
  }
});
