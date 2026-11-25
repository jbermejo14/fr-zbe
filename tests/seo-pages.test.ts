import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Metadata } from 'next';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { metadata as homeMetadata } from '../app/page.tsx';
import { generateMetadata as cityGenerateMetadata } from '../app/[ville]/page.tsx';
import { metadata as mentionsMetadata } from '../app/mentions-legales/page.tsx';
import { metadata as confidentialiteMetadata } from '../app/confidentialite/page.tsx';
import { metadata as cookiesMetadata } from '../app/cookies/page.tsx';
import { seoSocialImages } from '../lib/seo.ts';
import { absoluteUrl, SITE_NAME } from '../lib/site.ts';
import { ZFE_CITIES } from '../lib/zfe-cities.ts';

const SEO_TITLE_MAX = 65;
const SEO_TITLE_TARGET = 60;
const SEO_DESCRIPTION_MIN = 120;
const SEO_DESCRIPTION_MAX = 160;
const SEO_PROJECT_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SEO_OG_IMAGE_URL = absoluteUrl('/brand/ododex-og.png');

async function seoIndexablePages(): Promise<Metadata[]> {
  const cities = await Promise.all(
    ZFE_CITIES.map((city) => cityGenerateMetadata({ params: Promise.resolve({ ville: city.slug }) })),
  );
  return [homeMetadata, ...cities];
}

function seoFullTitle(metadata: Metadata): string {
  assert.equal(typeof metadata.title, 'string');
  return `${metadata.title as string} | ${SITE_NAME}`;
}

test('SEO: los 11 títulos indexables caben en 65 caracteres (objetivo 60) y son únicos', async () => {
  const pages = await seoIndexablePages();
  assert.equal(pages.length, ZFE_CITIES.length + 1);
  const titles = pages.map(seoFullTitle);
  for (const title of titles) {
    assert.ok(title.length <= SEO_TITLE_MAX, `${title} (${title.length})`);
    assert.ok(title.length <= SEO_TITLE_TARGET, `${title} supera el objetivo (${title.length})`);
  }
  assert.equal(new Set(titles).size, titles.length);
});

test('SEO: descripciones de 120 a 160 caracteres y únicas, también en las legales', async () => {
  const all = [...(await seoIndexablePages()), mentionsMetadata, confidentialiteMetadata, cookiesMetadata];
  const descriptions = all.map((metadata) => metadata.description ?? '');
  for (const description of descriptions) {
    assert.ok(
      description.length >= SEO_DESCRIPTION_MIN && description.length <= SEO_DESCRIPTION_MAX,
      `${description} (${description.length})`,
    );
  }
  assert.equal(new Set(descriptions).size, descriptions.length);
});

test('SEO: la imagen Open Graph absoluta está en las páginas que redefinen openGraph', async () => {
  const withOpenGraph = await seoIndexablePages();
  for (const metadata of withOpenGraph) {
    const images = (metadata.openGraph?.images ?? []) as { url: string; width: number; height: number }[];
    assert.equal(images.length, 1);
    assert.equal(images[0].url, SEO_OG_IMAGE_URL);
    assert.equal(images[0].width, 1200);
    assert.equal(images[0].height, 630);
  }
});

// app/layout.tsx no se puede importar en las pruebas (next/font/google), así que se comprueba su fuente.
test('SEO: el layout declara la imagen en openGraph y twitter summary_large_image', () => {
  const source = readFileSync(path.join(SEO_PROJECT_ROOT, 'app', 'layout.tsx'), 'utf8');
  assert.match(source, /openGraph: \{[^}]*images: seoSocialImages\(\)/);
  assert.match(source, /twitter: \{\s*card: 'summary_large_image',\s*images: seoSocialImages\(\)/);
});

test('SEO: seoSocialImages devuelve la imagen 1200x630 con URL absoluta y el fichero existe en public/brand', () => {
  const [image] = seoSocialImages();
  assert.equal(image.url, SEO_OG_IMAGE_URL);
  assert.ok(image.url.startsWith('http'));
  assert.ok(readFileSync(path.join(SEO_PROJECT_ROOT, 'public', 'brand', 'ododex-og.png')).length > 0);
});
