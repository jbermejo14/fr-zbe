# ARCHITECTURE — Zones à Faibles Émissions (ZFE-m) & Vignette Crit'Air

Web estática en francés publicada en `https://ododex.com/fr/zfe`. Es el equivalente francés de la web española `../zbe-map` (publicada en `/es/zbe`): mismo aspecto limpio, mismos tokens de estilo y el mismo patrón técnico, con reglas y datos franceses.

Este documento es el contrato que recibe quien implementa cada módulo. Debe bastar junto con el código de referencia que cita cada módulo.

## 1. Objetivo y alcance

### Qué hace

- **Calculadora Crit'Air**: tipo de vehículo, energía y año de primera matriculación (o norma Euro) → vignette Crit'Air con su color oficial, lista de las 10 ZFE con « autorisé / interdit » para ese vehículo y enlace a la solicitud oficial (`https://www.certificat-air.gouv.fr/`).
- **Mapa de las ZFE** (Leaflet + OpenStreetMap) que pinta los polígonos de `aires.geojson` (esquema oficial de la Base Nationale des ZFE), coloreados según la vignette elegida.
- **Selector rápido** de 10 ciudades con su ficha: restricciones vigentes por categoría y vignette, horarios, próximas etapas y enlaces oficiales.
- **Página por ciudad** `/[ville]` con tabla resumen de vignettes permitidas, ficha, minimapa y FAQ (con JSON-LD `FAQPage`).
- Textos legales en francés: `/mentions-legales`, `/confidentialite`, `/cookies`.
- `sitemap.xml`, canonical, Open Graph y JSON-LD como en `../zbe-map`. Anuncios con `AdSlot`.

### Qué no hace (en esta fase)

- **Los datos son de ejemplo.** `public/datos/aires.geojson` es un fichero con el esquema oficial, polígonos aproximados y restricciones orientativas. Mientras `AIRES_DATA_IS_SAMPLE` sea `true`, todas las páginas muestran un aviso visible « Données d'exemple ». Sustituir el fichero por el oficial está descrito en la sección 7.
- No descarga datos en la compilación ni tiene script de importación (fase siguiente).
- No cubre poids lourds ni autobus/autocars: solo `vp` (voitures), `vul` (utilitaires) y `deux_rm` (deux-roues).
- No trata las dérogations (petits rouleurs, pass ZFE, cartes handicapé…): se menciona en la FAQ que existen y se remite al sitio de cada ZFE.
- No interpreta el formato `opening_hours` completo: solo el subconjunto de la sección 5 (C3); el resto se muestra tal cual.
- No se integra todavía en `../ododex-sitio` (secciones.json, Worker) ni se publica.
- Sin servidor ni rutas API: `output: 'export'`.

## 2. Fuentes y reglas

### 2.1 Reglas Crit'Air (arrêté du 21 juin 2016, simplificado por año)

Si se indica la norma Euro, manda la norma. Si no, el año de primera matriculación.

**Voitures (VP) y utilitaires (VUL):**

| Energía | Crit'Air 0 | 1 | 2 | 3 | 4 | 5 | Non classé |
|---|---|---|---|---|---|---|---|
| Électrique / hydrogène | siempre | | | | | | |
| Hybride rechargeable, GPL, GNV | | siempre | | | | | |
| Essence | | Euro 5-6 / ≥ 2011 | Euro 4 / 2006-2010 | Euro 2-3 / 1997-2005 | | | Euro 1 o sin norma / ≤ 1996 |
| Diesel | | | Euro 5-6 / ≥ 2011 | Euro 4 / 2006-2010 | Euro 3 / 2001-2005 | Euro 2 / 1997-2000 | Euro 1 o sin norma / ≤ 1996 |

Año frontera de los utilitarios: la norma Euro 2 de los VUL empieza el 1 de octubre de 1997. Un VUL de **1997** sin norma indicada recibe la clase peor posible (`NC`) y la nota `borderlineNote` « Pour un utilitaire immatriculé avant le 1er octobre 1997… ».

**Deux-roues (motos, scooters):** la energía solo distingue eléctrico (Crit'Air 0) del resto (térmico). Cualquier energía distinta de eléctrico se trata como térmica.

| Norma | Año | Crit'Air |
|---|---|---|
| Euro 4-5 | ≥ 2017 | 1 |
| Euro 3 | 2007-2016 | 2 |
| Euro 2 | 1/7/2004 – 2006 | 3 |
| Euro 1 / sin norma | 1/6/2000 – 30/6/2004 | 4 |
| — | antes del 1/6/2000 | NC |

Años frontera de los deux-roues por año: **2004** → 4 con nota (desde el 1 de julio sería 3); **2000** → NC con nota (desde el 1 de junio sería 4). Siempre la clase peor posible y la nota.

### 2.2 Esquema `aires.geojson` (etalab/schema-zfe)

`FeatureCollection` de polígonos o multipolígonos. Propiedades que se usan:

| Propiedad | Tipo | Significado |
|---|---|---|
| `id` | string | Identificador; empieza por el SIREN del EPCI (`"200054781-ZFE-001"`). |
| `date_debut` | `"yyyy-mm-dd"` | Entrada en vigor. |
| `date_fin` | `"yyyy-mm-dd"` o null | Fin (incluido). |
| `vp_critair`, `vul_critair`, `deux_rm_critair` | `"V5"`, `"V4"`, `"V3"`, `"V2"`, `"V1"`, `"EL"`, `"NC"` o null | Vignette **a partir de la cual** se prohíbe circular. Orden: EL, V1, V2, V3, V4, V5, NC. `"V3"` prohíbe Crit'Air 3, 4, 5 y NC. `null` = sin restricción para esa categoría. |
| `vp_horaires`, `vul_horaires`, `deux_rm_horaires` | string o null | Horario en formato OSM `opening_hours` (`"24/7"`, `"Mo-Fr 08:00-20:00; PH off"`). |
| `url_arrete`, `url_site_information` | string o ausente | Enlaces oficiales. |

Las demás propiedades (`pl_*`, `autobus_autocars_*`…) se ignoran. Fuente oficial: `https://transport.data.gouv.fr/datasets/base-nationale-consolidee-des-zones-a-faibles-emissions`.

## 3. Convenciones del proyecto

- Stack idéntico a `../zbe-map`: Next.js 16.4.6 (App Router, `output: 'export'`, `basePath: '/fr/zfe'`, `images.unoptimized`, `next build --webpack`), React 19.3.0, Tailwind 4.3.3 por PostCSS (`postcss.config.mjs` y `postcss-tailwind-windows.cjs` copiados de `../zbe-map`), Leaflet 1.9.4, lucide-react 0.468.0, tsx 4.23.15, TypeScript 5.9.3. Versiones exactas, sin `^`. **Sin dependencias nuevas.**
- Estructura en la raíz, como `../zbe-map`: `app/`, `components/`, `lib/`, `public/`, `tests/`, `config/`. Alias `@/*` → raíz.
- Pruebas: `npm test` = `node --import ./tests/support/register.mjs --test "tests/**/*.test.ts" "tests/**/*.test.tsx"`. Sin red. Un módulo se prueba con `node --import ./tests/support/register.mjs --test tests/<fichero>.test.ts`. **No se usa tsx**: el Control de aplicaciones de Windows bloquea esbuild.exe en este equipo; `tests/support/ts-loader.mjs` transpila con `typescript` y resuelve `@/` e importaciones sin extensión.
- **Identificadores en inglés. Comentarios y documentación en español. Texto visible en francés de Francia** con *vouvoiement*, natural, no traducido palabra a palabra. Fechas `fr-FR` (`19 novembre 2026`).
- Estilo: tokens de `../zbe-map/app/globals.css` (`bg-bg`, `bg-surface`, `bg-elevated`, `border-line`, `text-fg`, `text-muted`, `text-secondary`, `text-accent`, `bg-accent-soft`, clases `.card`, `.btn`, `.tag`, `.ad-slot`). Prohibidos los colores de paleta sueltos de Tailwind (`orange-500`) y los degradados. Los únicos colores propios son los de las vignettes (sección 4).
- Tema claro/oscuro por `data-theme` y `localStorage['ododex-theme']`, script anti-parpadeo como en `../zbe-map/app/layout.tsx`.
- Responsive: sin desbordamiento a 375 px; objetivos táctiles `min-h-11`. Contenedores de mapa con `isolate`; CSS de Leaflet en `@layer base`.
- Rutas dinámicas: `generateStaticParams`, `export const dynamicParams = false`, sin `revalidate`. `sitemap.ts` con `export const dynamic = 'force-static'`.
- Sin números mágicos; funciones cortas; errores explícitos (los de consola y scripts, en español).
- Excepción a los identificadores en inglés: `lib/legal.ts` conserva la interfaz común de todas las webs Ododex (`getTitular`, `Titular`, `FECHA_TEXTOS_LEGALES`…) y las claves de `config/titular.json`, por paridad con el resto de la red.

## 4. Vignettes: colores

Tokens en `app/globals.css` dentro de `@theme` (igual que los colores `dgt-*` de `../zbe-map`), con el texto que da contraste AA sobre cada fondo:

| Clase | Token fondo | Hex | Texto |
|---|---|---|---|
| `0` | `--color-critair-0` | `#2E9E4A` (vert) | `#111111` (el blanco solo da 3,4:1) |
| `1` | `--color-critair-1` | `#7B3F98` (violet) | blanco |
| `2` | `--color-critair-2` | `#F2C500` (jaune) | negro |
| `3` | `--color-critair-3` | `#E87722` (orange) | negro |
| `4` | `--color-critair-4` | `#7A1F2B` (bordeaux) | blanco |
| `5` | `--color-critair-5` | `#6E6E6E` (gris) | blanco |
| `NC` | sin vignette | borde discontinuo `border-secondary` (`border-line` apenas se ve) | `text-fg` |

En el mapa, el estado neutro (sin vignette o sin regla) usa `--text-secondary` para el trazo y `--border-hover` para el relleno: `border-line` no se distingue sobre las teselas de OSM.

## 5. Módulos

Cada módulo lista los ficheros que crea; **solo puede crear o modificar esos**.

---

### C1 — Plataforma y estructura común

**Responsabilidad:** proyecto Next compilable con la marca Ododex en francés, cabecera, pie, legales y anuncios.

**Dependencias:** ninguna.

**Ficheros:** `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `postcss-tailwind-windows.cjs`, `.env.example`, `config/titular.example.json`, `app/layout.tsx`, `app/globals.css`, `app/icon.svg`, `app/page.tsx` (provisional: título y `AdSlot`), `app/not-found.tsx`, `app/mentions-legales/page.tsx`, `app/confidentialite/page.tsx`, `app/cookies/page.tsx`, `lib/site.ts`, `lib/legal.ts`, `lib/legal-text.ts`, `lib/seo.ts`, `components/{Header,Footer,BrandLogo,Breadcrumbs,AdSenseScript,AdSlot,ConsentSettingsButton,ThemeSwitch,LegalPage}.tsx`, `public/brand/*`, `tests/site.test.ts`, `tests/ui-colors.test.ts`, `tests/legal-pages.test.tsx`.

Referencias:

- `../zbe-map`: `package.json`, `next.config.ts`, `tsconfig.json`, PostCSS, `app/layout.tsx`, `app/globals.css`, `app/icon.svg`, `public/brand/`, `lib/site.ts`, `lib/legal.ts`, `lib/seo.ts`, `components/{Header,Footer,BrandLogo,Breadcrumbs,AdSenseScript,AdSlot,ConsentSettingsButton,ThemeSwitch}.tsx`, `tests/{site,ui-colors,legal-pages}.test.*`. Es la fuente del **aspecto**.
- `../prix-carburants-fr`: `src/lib/legalText.ts`, `src/components/LegalPage.tsx`, `src/app/{mentions-legales,confidentialite,cookies}/page.tsx` y la etiqueta « Publicité » de `src/components/AdSlot.tsx`. Es la fuente de los **textos legales en francés**. Solo lectura: ese proyecto tiene trabajo sin commitear de otra sesión.

Contrato:

- `lib/site.ts`: `SITE_NAME = 'Ododex'`, `SECTION_NAME = 'ZFE & Crit\'Air'`, `BASE_PATH = '/fr/zfe'`, `getSiteUrl()`, `absoluteUrl(path)`, `assetPath(path)` con la misma semántica que `../zbe-map/lib/site.ts`.
- `next.config.ts`: `BASE_PATH` duplicado con comentario, `output: 'export'`, `images.unoptimized`, `reactStrictMode`.
- `package.json` y `package-lock.json` ya existen (los creó la sesión principal, dependencias instaladas): no se tocan.
- `app/layout.tsx`: `<html lang="fr">`, `openGraph.locale = 'fr_FR'`, título por defecto « Zones à faibles émissions (ZFE) et vignette Crit'Air », plantilla `%s | Ododex`. Sin meta `robots` global.
- `app/globals.css`: los tokens y clases de `../zbe-map`, sin los colores `dgt-*` y con los tokens `critair-*` de la sección 4.
- Pie: « Données : Base nationale des ZFE (transport.data.gouv.fr), Licence Ouverte. Ododex n'est pas affilié à l'administration. » y enlaces a Accueil y a los tres legales, más `ConsentSettingsButton` si hay cliente AdSense.
- Legales en francés, adaptados a esta web (fuente de datos de la ZFE, calculadora orientativa, teselas OSM, AdSense con CMP), con `noindex, follow`. `config/titular.example.json` con la forma de `../zbe-map/config/titular.example.json`; `config/titular.json` **no se crea** (lo copia la sesión principal).

Criterio de aceptación: `npm test` pasa; `npx tsc --noEmit` pasa; `npm run build` genera `out/` con `index.html` y los tres legales.

---

### C2 — Reglas Crit'Air (`lib/critair.ts`)

**Responsabilidad:** calcular la vignette Crit'Air de un vehículo según la sección 2.1.

**Dependencias:** ninguna.

**Ficheros:** `lib/critair.ts`, `tests/critair.test.ts`.

```ts
export type VehicleType = 'car' | 'van' | 'motorcycle';
export type Energy = 'electric_hydrogen' | 'petrol' | 'diesel' | 'plugin_hybrid' | 'gas';
export type EuroNorm = 'euro1' | 'euro2' | 'euro3' | 'euro4' | 'euro5' | 'euro6';
/** Clase Crit'Air. 'NC' = non classé (sin vignette). */
export type CritairClass = '0' | '1' | '2' | '3' | '4' | '5' | 'NC';

export interface VehicleInput {
  vehicleType: VehicleType;
  energy: Energy;
  /** Año de primera matriculación; se ignora si hay euroNorm. */
  registrationYear: number | null;
  euroNorm: EuroNorm | null;
}

export interface CritairResult {
  critair: CritairClass;
  /** Explicación en francés de la regla aplicada: « Diesel Euro 4 (2006-2010) ». */
  ruleLabel: string;
  /** Nota en francés si el año es frontera y se ha elegido la clase peor; si no, null. */
  borderlineNote: string | null;
}

/** Orden de las clases, de la más limpia a la más contaminante. */
export const CRITAIR_ORDER: readonly CritairClass[]; // ['0','1','2','3','4','5','NC']
export const FIRST_REGISTRATION_YEAR_MIN: number; // 1950
export const VEHICLE_TYPE_LABELS: Record<VehicleType, string>; // Voiture, Utilitaire léger, Deux-roues motorisé
export const ENERGY_LABELS: Record<Energy, string>; // Électrique / hydrogène, Essence, Diesel, Hybride rechargeable, GPL / GNV
export const EURO_NORM_LABELS: Record<EuroNorm, string>; // Euro 1 … Euro 6

/** Normas Euro válidas para el tipo (deux-roues: euro1..euro5). */
export function euroNormsFor(vehicleType: VehicleType): readonly EuroNorm[];

/**
 * Calcula la vignette. Lanza `CritairInputError` (mensaje en francés, se muestra al usuario) si
 * faltan año y norma en una energía que los necesita, si el año es menor que
 * FIRST_REGISTRATION_YEAR_MIN o mayor que `currentYear`, o si la norma no vale para el tipo.
 * Eléctrico, hybride rechargeable y gas no necesitan año ni norma.
 */
export function computeCritair(input: VehicleInput, currentYear: number): CritairResult;

export class CritairInputError extends Error {}

/** Etiqueta visible: '0' → "Crit'Air 0", 'NC' → "Non classé". */
export function critairLabel(critair: CritairClass): string;
```

Criterio de aceptación: pruebas de cada fila y frontera de las tablas 2.1 (incluidas 1996/1997, 2005/2006, 2010/2011 para VP y VUL; 2000, 2004, 2006/2007, 2016/2017 para deux-roues; deux-roues diesel → térmico), norma que prevalece sobre el año, y los errores.

---

### C3 — Datos ZFE (`lib/zfe-areas.ts`, `lib/opening-hours.ts`, `lib/zfe-cities.ts`, `lib/zfe-rules.ts`, `public/datos/aires.geojson`)

**Responsabilidad:** leer `aires.geojson`, describir horarios en francés, conocer las 10 ciudades y decidir si una vignette puede circular.

**Dependencias:** C2 (solo `import type { CritairClass, VehicleType }` y `CRITAIR_ORDER`).

**Ficheros:** `lib/zfe-areas.ts`, `lib/opening-hours.ts`, `lib/zfe-cities.ts`, `lib/zfe-rules.ts`, `lib/zfe-source.ts`, `data/zfe-cities.json`, `public/datos/aires.geojson`, `tests/zfe-areas.test.ts`, `tests/opening-hours.test.ts`, `tests/zfe-cities.test.ts`, `tests/zfe-rules.test.ts`, `tests/fixtures/aires-mini.geojson`.

#### `lib/zfe-source.ts`

```ts
/** true mientras public/datos/aires.geojson sea el fichero de ejemplo. Las páginas muestran un aviso. */
export const AIRES_DATA_IS_SAMPLE = true;
export const AIRES_OFFICIAL_URL = 'https://transport.data.gouv.fr/datasets/base-nationale-consolidee-des-zones-a-faibles-emissions';
/** Ruta pública del fichero, sin BASE_PATH. */
export const AIRES_PUBLIC_PATH = '/datos/aires.geojson';
export const CERTIFICAT_AIR_URL = 'https://www.certificat-air.gouv.fr/';
```

#### `lib/zfe-areas.ts`

```ts
export type RestrictedCategory = 'vp' | 'vul' | 'deux_rm';
/** Valor del esquema: vignette a partir de la cual se prohíbe. */
export type CritairThreshold = 'EL' | 'V1' | 'V2' | 'V3' | 'V4' | 'V5' | 'NC';

export interface CategoryRule { threshold: CritairThreshold; openingHours: string }

export interface ZfeArea {
  id: string;
  startDate: string;          // 'yyyy-mm-dd'
  endDate: string | null;
  rules: Partial<Record<RestrictedCategory, CategoryRule>>; // falta la clave = sin restricción
  decreeUrl: string | null;
  infoUrl: string | null;
  /** Geometría GeoJSON tal cual (Polygon o MultiPolygon), para Leaflet. */
  geometry: GeoJsonPolygonGeometry;
}

/**
 * Convierte el GeoJSON (ya parseado con JSON.parse) en áreas. Lanza `AiresFormatError` con el
 * índice del feature y el campo si: no es FeatureCollection, falta id o date_debut, una fecha no
 * es yyyy-mm-dd, un *_critair no está en el enum, un *_critair no tiene su *_horaires (o al revés),
 * o la geometría no es Polygon/MultiPolygon. Ignora las propiedades desconocidas.
 */
export function parseAires(json: unknown): ZfeArea[];
export class AiresFormatError extends Error {}

/** Vigente en `isoDate` ('yyyy-mm-dd'): startDate <= isoDate y (endDate null o isoDate <= endDate). */
export function isAreaActive(area: ZfeArea, isoDate: string): boolean;

/** VehicleType de C2 → categoría: car → vp, van → vul, motorcycle → deux_rm. */
export function categoryFor(vehicleType: VehicleType): RestrictedCategory;
```

`zfe-areas.ts` no lee ficheros (es puro). Las páginas de servidor leen el fichero con `fs.readFileSync(path.join(process.cwd(), 'public', 'datos', 'aires.geojson'), 'utf8')` en el módulo C5, y el navegador con `fetch(assetPath(AIRES_PUBLIC_PATH))` en C4. Ambos pasan el resultado por `parseAires`.

#### `lib/opening-hours.ts`

```ts
/**
 * Describe en francés un horario `opening_hours`. Subconjunto admitido, reglas separadas por "; ":
 * - "24/7" → "Tous les jours, 24 h/24"
 * - días: Mo Tu We Th Fr Sa Su, rangos "Mo-Fr", listas "Mo,We"
 * - tramos "08:00-20:00", varios separados por coma
 * - "PH off" → añade "sauf jours fériés"
 * Ejemplo: "Mo-Fr 08:00-20:00; PH off" → "Du lundi au vendredi, de 8 h à 20 h, sauf jours fériés".
 * Si no reconoce la cadena devuelve { text: <cadena original>, recognized: false }.
 */
export function describeOpeningHours(value: string): { text: string; recognized: boolean };
```

#### `lib/zfe-cities.ts` y `data/zfe-cities.json`

```ts
export interface ZfeCity {
  slug: string;            // 'grand-paris'
  name: string;            // 'Grand Paris'
  zoneName: string;        // 'ZFE-m du Grand Paris'
  authority: string;       // 'Métropole du Grand Paris'
  /** SIREN del EPCI: las áreas cuyo id empieza por él son de esta ciudad. */
  siren: string;
  center: [number, number]; // [lat, lon]
  zoom: number;
  /** Descripción corta del perímetro en francés: « Intérieur de l'A86 (A86 exclue) ». */
  perimeterLabel: string;
  infoUrl: string;          // sitio oficial de la ZFE
}

/** Las 10 ciudades, en el orden del selector. */
export const ZFE_CITIES: readonly ZfeCity[];
export function findCityBySlug(slug: string): ZfeCity | null;
/** Áreas de la ciudad (id empieza por city.siren). */
export function areasForCity(city: ZfeCity, areas: readonly ZfeArea[]): ZfeArea[];
```

Ciudades y SIREN (orden del selector): Grand Paris `grand-paris` 200054781; Lyon `lyon` 200046977; Marseille `marseille` (Aix-Marseille-Provence) 200054807; Toulouse `toulouse` 243100518; Nice `nice` (Nice Côte d'Azur) 200030195; Strasbourg `strasbourg` (Eurométropole) 246700488; Grenoble `grenoble` (Grenoble-Alpes) 200040715; Montpellier `montpellier` (Montpellier Méditerranée) 243400017; Rouen `rouen` (Rouen Normandie) 200023414; Reims `reims` (Grand Reims) 200067213. Los SIREN deben verificarse contra el fichero oficial al sustituirlo (sección 7).

#### `lib/zfe-rules.ts`

```ts
export type AccessStatus = 'allowed' | 'restricted' | 'no_rule';

export interface CityAccess {
  city: ZfeCity;
  status: AccessStatus;        // no_rule: ninguna área vigente restringe esa categoría
  /** Regla más estricta vigente para la categoría, o null. */
  rule: CategoryRule | null;
  hoursText: string | null;    // describeOpeningHours(rule.openingHours).text
}

/** true si la vignette puede circular con ese umbral: rango(critair) < rango(threshold). EL≙'0', V1≙'1'… NC≙'NC'. */
export function isAllowed(critair: CritairClass, threshold: CritairThreshold): boolean;

/** Umbral más estricto (el de menor rango) entre las áreas vigentes de la ciudad para la categoría. */
export function strictestRule(areas: readonly ZfeArea[], category: RestrictedCategory, isoDate: string): CategoryRule | null;

/** Acceso de una vignette a cada ciudad en una fecha. Mismo orden que ZFE_CITIES. */
export function evaluateCities(critair: CritairClass, vehicleType: VehicleType, areas: readonly ZfeArea[], isoDate: string): CityAccess[];

/** Áreas de la ciudad que empiezan después de isoDate, ordenadas por startDate (« prochaines étapes »). */
export function upcomingAreas(cityAreas: readonly ZfeArea[], isoDate: string): ZfeArea[];
```

#### `public/datos/aires.geojson` (ejemplo)

- Esquema exacto de la sección 2.2, con un `FeatureCollection` válido para `parseAires`.
- Una área vigente por ciudad (`date_debut` anterior a 2026-11-19, `date_fin: null`) con un polígono aproximado (un octógono de unos 6-10 km de radio alrededor de `center`; Grand Paris, unos 15 km). Ids `"<siren>-ZFE-001"`.
- Restricciones orientativas (son de ejemplo y lo dice el aviso): Grand Paris `vp/vul V3` `"Mo-Fr 08:00-20:00; PH off"`, `deux_rm V3` mismo horario; Lyon `vp V3` `"24/7"`, `vul V3` `"24/7"`; Grenoble `vp V4`, `vul V3`, `"24/7"`; Montpellier, Strasbourg y Rouen `vp/vul V4` `"24/7"`; Marseille, Toulouse, Nice y Reims `vp/vul V4` `"24/7"`. `deux_rm` null salvo Grand Paris.
- Una segunda área futura para Lyon (`date_debut: "2028-01-01"`, `vp/vul V2`, mismo polígono, id `"200046977-ZFE-002"`) para probar « prochaines étapes ».

Criterio de aceptación: pruebas con `tests/fixtures/aires-mini.geojson` (2-3 features) de cada error de `parseAires`, de las fechas límite de `isAreaActive`, de todos los ejemplos de `describeOpeningHours` y de un caso no reconocido, de `isAllowed` en los bordes (V3 con '2' permitido y '3' prohibido; EL prohíbe '0'; NC solo prohíbe NC), de `strictestRule` con dos áreas, y una prueba que parsea `public/datos/aires.geojson` y comprueba que cada ciudad de `ZFE_CITIES` tiene al menos un área vigente el 2026-11-19.

---

### C4 — Portada: calculadora y visor del mapa

**Responsabilidad:** la portada interactiva: calculadora Crit'Air, resultado con vignette y ciudades, mapa de las ZFE, selector de ciudad y ficha.

**Dependencias:** C1, C2, C3.

**Ficheros:** `app/page.tsx` (sustituye al provisional), `components/CritairBadge.tsx`, `components/CritairCalculator.tsx`, `components/CritairResultCard.tsx`, `components/CityAccessList.tsx`, `components/ZfeDashboard.tsx`, `components/ZfeMap.tsx`, `components/ZfeMapLoader.tsx`, `components/CitySelector.tsx`, `components/CityRulesCard.tsx`, `components/SampleDataNotice.tsx`, `components/CritairCalculatorAgeFields.tsx`, `lib/use-aires.ts`, `lib/map-config.ts`, `lib/critair-form.ts`, `lib/format-date.ts`, `tests/critair-badge.test.tsx`, `tests/home-ui.test.tsx`.

Referencias de aspecto (solo lectura, no copiar lógica española): `../zbe-map/components/{SplitDashboard,SpainZbeMap,EtiquetaCalculator,VehicleResultCard,CityDetailDrawer,CityInfoCard,MultiCitySelector}.tsx`, `../zbe-map/lib/map-config.ts`, `../zbe-map/lib/dgt-svg-badges.tsx`.

Contrato:

- `CritairBadge({ critair, size })`: vignette redonda con el número grande y « Crit'Air » encima, color de la sección 4; `NC` como círculo con borde discontinuo y « Non classé ». `size: 'sm' | 'md' | 'lg'`. `aria-label` « Vignette Crit'Air 3 » / « Non classé ».
- `CritairCalculator({ onResult })`: formulario con `Type de véhicule` (3 botones tipo segmento, `min-h-11`), `Énergie` (select), y « Je connais : » año / norma Euro (dos botones), con un select de año (del año actual a `FIRST_REGISTRATION_YEAR_MIN`) o de norma (`euroNormsFor`). El campo de año/norma se oculta para eléctrico, hybride rechargeable y gas. Nota bajo el select de energía: « Hybride non rechargeable : choisissez Essence ou Diesel ». Llama a `onResult(result | null, input)` en cada cambio válido; los `CritairInputError` se muestran bajo el formulario.
- `CritairResultCard`: `CritairBadge lg`, `ruleLabel`, `borderlineNote` si existe, `CityAccessList` y un botón-enlace « Commander la vignette sur certificat-air.gouv.fr » (`target="_blank" rel="noopener noreferrer"`) con la aclaración « Site officiel du ministère. Méfiez-vous des sites non officiels qui facturent la vignette plus cher. » No se muestra precio (no está verificado).
- `CityAccessList({ accesses })`: una fila por ciudad con su nombre (enlace a `/[ville]` con `next/link`), y una píldora « Autorisé », « Interdit » (+ `hoursText`) o « Pas de restriction » con icono lucide; nunca solo color.
- `ZfeDashboard` (cliente): estado compartido `critair`, `vehicleType`, `selectedCitySlug`. Disposición como `SplitDashboard` de ZBE: en escritorio, calculadora y resultado a la izquierda, mapa a la derecha; en móvil, apilados. Debajo del mapa, `CitySelector` y `CityRulesCard` de la ciudad elegida.
- `use-aires.ts`: hook `useAires(): { status: 'loading' | 'ready' | 'error'; areas: ZfeArea[]; error: string | null }` que hace `fetch(assetPath(AIRES_PUBLIC_PATH))` y `parseAires`. El error se muestra (« Impossible de charger les zones : … »), no se silencia.
- `ZfeMapLoader`: `next/dynamic` con `ssr: false` de `ZfeMap` (Leaflet no funciona en servidor).
- `ZfeMap({ areas, critair, vehicleType, selectedCitySlug, onSelectCity, isoDate })`: Leaflet con teselas OSM (`lib/map-config.ts`, sin CARTO), vista inicial de Francia metropolitana. Cada área vigente es una capa `L.geoJSON`: verde (`--color-critair-0`) si la vignette puede circular, rojo de error del tema si no, gris (`border-line`) si no hay vignette elegida o no hay regla para la categoría. Clic en un área → `onSelectCity`. Al cambiar `selectedCitySlug` se encuadra la ciudad con `flyToBounds`. Prop opcional `focusRequest?: number`: al cambiar su valor vuelve a encuadrar la ciudad ya seleccionada. Leyenda con los tres estados. El contenedor lleva `isolate` y altura fija (`h-[420px] lg:h-[560px]`).
- `CitySelector`: las 10 ciudades como botones-píldora (`min-h-11`, con scroll horizontal en móvil sin desbordar la página).
- `CityRulesCard({ city, areas, isoDate, showFullPageLink? })`: nombre de la ZFE, perímetro, tabla por categoría (Voitures, Utilitaires, Deux-roues) con « Interdit à partir de » + `CritairBadge sm` del umbral (o « Aucune restriction »), horario descrito, próximas etapas (`upcomingAreas`, con fecha `fr-FR`), enlaces « Arrêté » y « Site officiel », y enlace « Voir la fiche complète » a `/[ville]` (oculto con `showFullPageLink={false}`, que usa la propia página de ciudad). En móvil (< sm) cada categoría se muestra como bloque apilado; desde `sm`, como tabla.
- `SampleDataNotice`: aviso con `role="note"` si `AIRES_DATA_IS_SAMPLE`: « Données d'exemple : les périmètres et les restrictions affichés sont indicatifs en attendant le chargement de la Base nationale des ZFE. Vérifiez toujours sur le site officiel de chaque zone. » No pinta nada si es `false`.
- `app/page.tsx`: metadata en francés (título « ZFE et vignette Crit'Air <año> : carte des zones à faibles émissions »), JSON-LD `WebApplication`, h1 « Où pouvez-vous circuler ? Zones à faibles émissions et Crit'Air », `SampleDataNotice`, `ZfeDashboard`, `AdSlot` al final. La fecha de evaluación (`isoDate`) es la del navegador (hoy) en el cliente.

Criterio de aceptación: pruebas de render (`react-dom/server` `renderToStaticMarkup`) del badge (las 7 clases, colores por token, `aria-label`), de `CityAccessList` con los tres estados y de `SampleDataNotice`; sin colores de paleta sueltos; `npx tsc --noEmit` y `npm run build` pasan. Comprobación en pantalla en la integración.

---

### C5 — Páginas por ciudad y SEO

**Responsabilidad:** `/[ville]` estática por cada ciudad, con tabla, ficha, minimapa y FAQ, y el sitemap.

**Dependencias:** C1, C2, C3, C4 (reutiliza `CritairBadge`, `CityRulesCard`, `SampleDataNotice`, `ZfeMapLoader`).

**Ficheros:** `app/[ville]/page.tsx`, `app/sitemap.ts`, `lib/zfe-areas-server.ts`, `lib/city-page.ts`, `components/CritairSummaryTable.tsx`, `components/CityFaq.tsx`, `components/CityMiniMap.tsx`, `components/OtherCities.tsx`, `tests/city-page.test.ts`, `tests/sitemap.test.ts`.

Contrato:

- `lib/zfe-areas-server.ts`: `loadAiresAtBuild(): ZfeArea[]` lee `public/datos/aires.geojson` con `fs` y lo pasa por `parseAires`. Solo se importa desde páginas de servidor. Si falla, lanza el error con la ruta del fichero (la compilación debe fallar).
- `lib/city-page.ts` (puro, probado):
  - `summaryRows(cityAreas, isoDate): { critair: CritairClass; vp: AccessStatus; vul: AccessStatus; deux_rm: AccessStatus }[]` — una fila por cada clase de `CRITAIR_ORDER`.
  - `cityFaq(city, cityAreas, isoDate): { question: string; answer: string }[]` — preguntas generadas con los datos: « Quelles vignettes Crit'Air sont interdites dans la ZFE de X ? », « Quels sont les horaires de la ZFE de X ? », « Quelles sont les prochaines étapes ? » (solo si hay), « Comment obtenir la vignette Crit'Air ? » (certificat-air.gouv.fr), « Existe-t-il des dérogations ? » (remite a `city.infoUrl`), « Quelle amende en cas d'infraction ? » (68 € para voitures, utilitaires y deux-roues: contravention de 3e classe; constante con nombre).
  - `cityMetadata(city, cityAreas, isoDate): { title: string; description: string }` — únicos por ciudad, con la vignette prohibida: « ZFE Lyon <año> : Crit'Air interdits, horaires et carte ».
- `app/[ville]/page.tsx`: `generateStaticParams` desde `ZFE_CITIES`, `dynamicParams = false`; `isoDate` = fecha de compilación, mostrada como « Règles en vigueur au 19 novembre 2026 ». Contenido: `Breadcrumbs` (Accueil › Ville), h1 « ZFE de X : vignettes Crit'Air autorisées », `SampleDataNotice`, `CritairSummaryTable`, `CityRulesCard`, minimapa (`ZfeMapLoader` centrado en la ciudad, áreas leídas en el cliente con `useAires`), `CityFaq`, enlaces a las otras 9 ciudades, `AdSlot` (máximo 2). JSON-LD `FAQPage` con las mismas preguntas y `BreadcrumbList`. Canonical y `og:url` con `absoluteUrl`.
- `CritairSummaryTable`: filas = vignettes (`CritairBadge sm` + etiqueta), columnas = Voitures / Utilitaires / Deux-roues, celdas con icono y texto « Autorisé » / « Interdit » / « Libre » (sin regla). En móvil la tabla hace scroll dentro de su contenedor (`overflow-x-auto`), no la página.
- `CityFaq`: `<details>`/`<summary>` accesibles, sin JS.
- `app/sitemap.ts`: `/`, las 10 ciudades y nada más (legales fuera). `force-static`.

Criterio de aceptación: pruebas de `summaryRows` (Grand Paris de ejemplo: '2' autorisé, '3' interdit en vp), de `cityFaq` (prochaines étapes solo en Lyon) y de que los títulos de las 10 ciudades son únicos; prueba del sitemap; `npm run build` genera `out/<ville>/index.html` (o `out/<ville>.html`) para las 10.

## 6. Orden de implementación

1. **C1** y **C2+C3** en paralelo (no comparten ficheros; C2+C3 solo necesitan `node`/`tsx`, que C1 deja instalado. Mientras C1 instala, C2+C3 prueban con `npx tsx --test`).
2. **C4** cuando C1, C2 y C3 estén commiteados.
3. **C5** cuando C4 esté commiteado.
4. Integración (sesión principal): compilar, verificar en el navegador integrado (claro y oscuro, 375 y 1280 px), README.

## 7. Sustituir los datos de ejemplo por los oficiales

1. Descargar `aires.geojson` de la Base Nationale des ZFE (`AIRES_OFFICIAL_URL`) y guardarlo como `public/datos/aires.geojson`.
2. Ejecutar `npm test`: la prueba de C3 que exige un área vigente por ciudad falla si un SIREN de `data/zfe-cities.json` no coincide con los ids oficiales. Corregir el SIREN, no la prueba.
3. Poner `AIRES_DATA_IS_SAMPLE = false` en `lib/zfe-source.ts`. Mientras sea `true`, la portada y las páginas de ciudad llevan `noindex, follow` (`sampleDataRobots`); al ponerlo a `false` desaparece el noindex y las páginas pasan a ser indexables. Antes de hacerlo, revisar los textos generados (FAQ, descriptions de `lib/city-page.ts`) contra los datos oficiales.
4. Revisar en pantalla las 10 fichas contra el sitio oficial de cada ZFE.
