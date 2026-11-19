import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { absoluteUrl, assetPath, BASE_PATH, getSiteUrl, SECTION_NAME, SITE_NAME } from '../lib/site.ts';
import nextConfig from '../next.config.ts';

const SITE_ORIGIN = 'https://ododex.com';
const SOURCE_DIRS = ['app', 'components', 'lib'];
const FORBIDDEN_STRINGS = ['/api/', 'cartocdn', 'radar-zbe'];

function withSiteOrigin(origin: string | undefined, check: () => void): void {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  if (origin === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = origin;
  try {
    check();
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previous;
  }
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(full) ? [full] : [];
  });
}

test("constantes de marca: Ododex, sección ZFE & Crit'Air y ruta base /fr/zfe", () => {
  assert.equal(SITE_NAME, 'Ododex');
  assert.equal(SECTION_NAME, "ZFE & Crit'Air");
  assert.equal(BASE_PATH, '/fr/zfe');
});

test('absoluteUrl: raíz vacía o con barra devuelve origen + ruta base sin barra final', () => {
  withSiteOrigin(SITE_ORIGIN, () => {
    assert.equal(absoluteUrl('/'), `${SITE_ORIGIN}/fr/zfe`);
    assert.equal(absoluteUrl(''), `${SITE_ORIGIN}/fr/zfe`);
  });
});

test('absoluteUrl: ruta con y sin barra inicial', () => {
  withSiteOrigin(SITE_ORIGIN, () => {
    assert.equal(absoluteUrl('/lyon'), `${SITE_ORIGIN}/fr/zfe/lyon`);
    assert.equal(absoluteUrl('lyon'), `${SITE_ORIGIN}/fr/zfe/lyon`);
  });
});

test('getSiteUrl: quita barras finales y usa localhost por defecto', () => {
  withSiteOrigin(`${SITE_ORIGIN}/`, () => {
    assert.equal(getSiteUrl(), SITE_ORIGIN);
    assert.equal(absoluteUrl('/lyon'), `${SITE_ORIGIN}/fr/zfe/lyon`);
  });
  withSiteOrigin(undefined, () => {
    assert.equal(getSiteUrl(), 'http://localhost:3000');
  });
});

test('assetPath antepone la ruta base', () => {
  assert.equal(assetPath('/brand/x.svg'), '/fr/zfe/brand/x.svg');
  assert.equal(assetPath('brand/x.svg'), '/fr/zfe/brand/x.svg');
});

test('next.config.ts usa la misma ruta base que lib/site.ts', () => {
  assert.equal(nextConfig.basePath, BASE_PATH);
});

test('next.config.ts exporta el sitio como ficheros estáticos, con imágenes sin optimizar y sin redirects', () => {
  assert.equal(nextConfig.output, 'export');
  assert.equal(nextConfig.reactStrictMode, true);
  assert.equal(nextConfig.images?.unoptimized, true);
  assert.equal('redirects' in nextConfig, false);
});

// Un <a> con href interno literal se salta la ruta base; los internos van con next/link.
const RAW_INTERNAL_ANCHOR = /<a\s[^>]*href=["'{`]+\/(?!\/)/;

test('ningún .tsx de app/ ni components/ usa src="/ ni <a href="/ literales', () => {
  for (const dir of ['app', 'components']) {
    for (const file of sourceFiles(dir).filter((f) => f.endsWith('.tsx'))) {
      const source = readFileSync(file, 'utf8');
      assert.ok(!source.includes('src="/'), `${file} contiene src="/ sin assetPath`);
      assert.doesNotMatch(source, RAW_INTERNAL_ANCHOR, `${file} tiene un <a href="/..."> sin next/link ni assetPath`);
    }
  }
});

test('ningún fichero de app/, components/ ni lib/ contiene /api/, cartocdn ni radar-zbe', () => {
  for (const dir of SOURCE_DIRS) {
    for (const file of sourceFiles(dir)) {
      const source = readFileSync(file, 'utf8');
      for (const forbidden of FORBIDDEN_STRINGS) {
        assert.ok(!source.includes(forbidden), `${file} contiene "${forbidden}"`);
      }
    }
  }
});

function siteLayoutCode(): string {
  return readFileSync(join('app', 'layout.tsx'), 'utf8')
    .split('\n')
    .filter((line) => !/^\s*(\/\/|\/\*|\*)/.test(line))
    .join('\n');
}

test('layout: título por defecto, plantilla «%s | Ododex» y sin robots global', () => {
  const layout = siteLayoutCode();
  assert.ok(layout.includes(`default: "Zones à faibles émissions (ZFE) et vignette Crit'Air"`));
  assert.ok(layout.includes('template: `%s | ${SITE_NAME}`'));
  assert.equal(SITE_NAME, 'Ododex');
  assert.doesNotMatch(layout, /robots/);
});

test('layout: idioma francés y sin restos españoles', () => {
  const layout = readFileSync(join('app', 'layout.tsx'), 'utf8');
  assert.match(layout, /<html lang="fr"/);
  assert.match(layout, /locale: 'fr_FR'/);
  assert.doesNotMatch(layout, /es_ES|DGT|ZBE/);
});
