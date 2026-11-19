# Ododex · Zones à Faibles Émissions (ZFE-m) & Vignette Crit'Air

Web estática en francés de la red **Ododex**, pensada para publicarse en `https://ododex.com/fr/zfe`. Es el equivalente francés de `../zbe-map` (`/es/zbe`): calculadora de la vignette Crit'Air, mapa de las ZFE y una ficha por ciudad.

El contrato técnico completo está en [`ARCHITECTURE.md`](ARCHITECTURE.md).

> **Estado: datos de ejemplo.** `public/datos/aires.geojson` tiene el esquema oficial de la Base Nationale des ZFE, pero los perímetros son octógonos aproximados y las restricciones son orientativas. Mientras `AIRES_DATA_IS_SAMPLE` sea `true` (`lib/zfe-source.ts`), todas las páginas muestran el aviso « Données d'exemple » y llevan `noindex, follow`. **No publicar como definitivo** hasta sustituir los datos (ver más abajo).

## Qué incluye

| Ruta | Contenido |
|---|---|
| `/` | Calculadora Crit'Air (tipo de vehículo, energía, año o norma Euro), resultado con la vignette, acceso a las 10 ZFE, mapa Leaflet y ficha rápida por ciudad |
| `/[ville]` | Una página por ciudad (`grand-paris`, `lyon`, `marseille`, `toulouse`, `nice`, `strasbourg`, `grenoble`, `montpellier`, `rouen`, `reims`): tabla de vignettes autorizadas, reglas y horarios, próximas etapas, minimapa y FAQ con JSON-LD `FAQPage` |
| `/mentions-legales`, `/confidentialite`, `/cookies` | Textos legales (`noindex, follow`) |
| `/sitemap.xml` | Portada y las 10 ciudades |
| `/datos/aires.geojson` | Polígonos y reglas que lee el navegador |

## Requisitos

- Node.js 22 (probado con 22.12.0) y npm 10.

## Instalación

```bash
npm install --force --cpu=wasm32 --os=win32
```

En este equipo Windows el Control de aplicaciones bloquea los binarios nativos de Tailwind, SWC y esbuild. El `--force --cpu=wasm32` hace que npm instale `@tailwindcss/oxide-wasm32-wasi`, que Tailwind usa en su lugar. En otra máquina sin ese bloqueo basta `npm install`.

## Configuración

Copia `.env.example` a `.env.local` si quieres cambiar algo. Variables (todas opcionales):

| Variable | Por defecto | Uso |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Origen de canonical, og:url, JSON-LD y sitemap |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | vacía | Cliente AdSense (`ca-pub-` + 16 dígitos) |
| `NEXT_PUBLIC_ADSENSE_SLOT` | vacía | Bloque de anuncio (10 dígitos) |

Los legales leen `config/titular.json` (fuera de git, datos personales del titular). Si no existe usan `config/titular.example.json` y muestran « [à compléter] ». Cópialo desde otro proyecto de Ododex antes de publicar.

## Desarrollo

```bash
npm run dev
```

Abre `http://localhost:3000/fr/zfe`. Aviso: en este equipo el servidor de desarrollo a veces no regenera el CSS de Tailwind con clases nuevas (por ejemplo variantes `max-sm:`). Si un estilo no aparece, compruébalo en la exportación (`npm run build` y servir `out/`), que es lo que se publica.

## Pruebas

```bash
npm test
```

Ejecuta todas las pruebas con `node --test` y el cargador `tests/support/ts-loader.mjs`, que transpila TypeScript con `typescript`. No se usa tsx porque esbuild.exe está bloqueado en este equipo. Para un solo fichero:

```bash
node --import ./tests/support/register.mjs --test tests/critair.test.ts
```

Comprobación de tipos:

```bash
npx tsc --noEmit
```

## Compilación

```bash
npm run build
```

Exporta el sitio estático en `out/` (`next build --webpack`). Los avisos de `@next/swc-win32-x64-msvc` bloqueado son esperables en este equipo y no impiden compilar.

## Sustituir los datos de ejemplo por los oficiales

1. Descarga `aires.geojson` de la [Base Nationale des ZFE](https://transport.data.gouv.fr/datasets/base-nationale-consolidee-des-zones-a-faibles-emissions) y guárdalo como `public/datos/aires.geojson`.
2. `npm test`: si una ciudad no tiene áreas vigentes, su SIREN en `data/zfe-cities.json` no coincide con los ids oficiales. Corrige el SIREN, no la prueba.
3. Revisa en pantalla las 10 fichas y los textos generados (FAQ, descripciones) contra el sitio oficial de cada ZFE. Revisa también `perimeterLabel` e `infoUrl` de `data/zfe-cities.json` (solo el de Grand Paris está contrastado).
4. Pon `AIRES_DATA_IS_SAMPLE = false` en `lib/zfe-source.ts`: desaparecen el aviso y el `noindex`.

## Publicación

Aún no está integrada en `../ododex-sitio`. Para publicarla hará falta añadir la sección a `config/secciones.json` (ruta `/fr/zfe`) y, si se quiere Worker propio, un `wrangler.zfe.jsonc` con la route `ododex.com/fr/zfe*`, como el resto de secciones.

## Fuentes

- Reglas Crit'Air: arrêté du 21 juin 2016 (simplificado por año de primera matriculación; ver `ARCHITECTURE.md` 2.1).
- Esquema de las áreas: [etalab/schema-zfe](https://schema.data.gouv.fr/etalab/schema-zfe/).
- Solicitud oficial de la vignette: [certificat-air.gouv.fr](https://www.certificat-air.gouv.fr/).
- Teselas: © OpenStreetMap contributors.
