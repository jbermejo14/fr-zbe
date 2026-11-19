import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const SOURCE_DIRECTORIES = ['app', 'components', 'lib'];
const TSX_EXTENSION = '.tsx';
const CRITAIR_TOKENS: Record<string, string> = {
  '0': '#2e9e4a',
  '1': '#7b3f98',
  '2': '#f2c500',
  '3': '#e87722',
  '4': '#7a1f2b',
  '5': '#6e6e6e',
};

// Colores fijos y degradados prohibidos: todo color sale de los tokens de globals.css.
// El lookbehind evita que "translate-" cuente como "slate-".
const PALETTE = 'red|green|emerald|amber|yellow|sky|blue|indigo|rose|stone|lime|teal|cyan|purple|pink|violet|fuchsia';
const FORBIDDEN_PATTERNS: RegExp[] = [
  /(?<![a-z])neutral-/,
  /(?<![a-z])zinc-/,
  /(?<![a-z])slate-/,
  /(?<![a-z])gray-/,
  /text-orange-/,
  /bg-orange-/,
  /#ff6b00/i,
  /bg-gradient/,
  /(?<![\w-])(from|via|to)-(\[|[a-z]+-\d)/,
  new RegExp(`(?<![\\w-])(${PALETTE})-\\d{2,3}`),
  /text-white|bg-white|bg-black|border-white/,
  /dark:/
];

function uiListTsxFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return uiListTsxFiles(fullPath);
    return fullPath.endsWith(TSX_EXTENSION) ? [fullPath] : [];
  });
}

function uiReadCss(): string {
  return readFileSync(path.join(process.cwd(), 'app', 'globals.css'), 'utf-8');
}

test('estilo: ningún .tsx usa colores fijos, degradados ni border-white', () => {
  const offenders: string[] = [];
  for (const directory of SOURCE_DIRECTORIES) {
    for (const file of uiListTsxFiles(path.join(process.cwd(), directory))) {
      const content = readFileSync(file, 'utf-8');
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.test(content)) offenders.push(`${path.relative(process.cwd(), file)}: ${pattern}`);
      }
    }
  }
  assert.deepEqual(offenders, []);
});

test('estilo: globals.css no tiene degradados y deja Leaflet en @layer base sin ancho ni alto', () => {
  const css = uiReadCss();
  assert.doesNotMatch(css, /gradient\(/);
  const containerRule = /@layer base\s*\{[\s\S]*?\.leaflet-container\s*\{([^}]*)\}/.exec(css);
  assert.ok(containerRule, '.leaflet-container debe estar en @layer base');
  assert.doesNotMatch(containerRule[1], /(^|[\s;])(width|height)\s*:/);
});

const MIN_TEXT_CONTRAST = 4.5;
const CRITAIR_LEVELS = ['0', '1', '2', '3', '4', '5'];
const SRGB_LINEAR_THRESHOLD = 0.03928;
const SRGB_LOW_DIVISOR = 12.92;
const SRGB_OFFSET = 0.055;
const SRGB_HIGH_DIVISOR = 1.055;
const SRGB_GAMMA = 2.4;
const LUMINANCE_WEIGHTS = [0.2126, 0.7152, 0.0722];
const CONTRAST_FLARE = 0.05;
const HEX_RADIX = 16;
const HEX_CHANNEL_LENGTH = 2;
const MAX_CHANNEL = 255;

function uiLinearChannel(value: number): number {
  const normalized = value / MAX_CHANNEL;
  return normalized <= SRGB_LINEAR_THRESHOLD
    ? normalized / SRGB_LOW_DIVISOR
    : ((normalized + SRGB_OFFSET) / SRGB_HIGH_DIVISOR) ** SRGB_GAMMA;
}

/** Luminancia relativa WCAG 2 de un color #rrggbb. */
function uiRelativeLuminance(hex: string): number {
  const digits = hex.replace('#', '');
  return LUMINANCE_WEIGHTS.reduce((sum, weight, index) => {
    const start = index * HEX_CHANNEL_LENGTH;
    const channel = parseInt(digits.slice(start, start + HEX_CHANNEL_LENGTH), HEX_RADIX);
    return sum + weight * uiLinearChannel(channel);
  }, 0);
}

/** Ratio de contraste WCAG 2 entre dos colores #rrggbb. */
function uiContrastRatio(first: string, second: string): number {
  const [lighter, darker] = [uiRelativeLuminance(first), uiRelativeLuminance(second)].sort((a, b) => b - a);
  return (lighter + CONTRAST_FLARE) / (darker + CONTRAST_FLARE);
}

function uiTokenValue(css: string, token: string): string {
  const match = new RegExp(`${token}:\\s*(#[0-9a-fA-F]{6});`).exec(css);
  assert.ok(match, `falta ${token}`);
  return match[1];
}

test('uiContrastRatio: negro sobre blanco da 21:1', () => {
  assert.equal(Math.round(uiContrastRatio('#000000', '#ffffff')), 21);
});

test('accesibilidad: cada color de Crit\'Air y su texto tienen contraste WCAG AA (>= 4,5)', () => {
  const css = uiReadCss();
  for (const level of CRITAIR_LEVELS) {
    const background = uiTokenValue(css, `--color-critair-${level}`);
    const text = uiTokenValue(css, `--color-on-critair-${level}`);
    const ratio = uiContrastRatio(background, text);
    assert.ok(ratio >= MIN_TEXT_CONTRAST, `critair-${level}: contraste ${ratio.toFixed(2)} < ${MIN_TEXT_CONTRAST}`);
  }
});

test('estilo: globals.css define los tokens critair-0..5 con su texto y no conserva los dgt-*', () => {
  const css = uiReadCss();
  for (const [critair, hex] of Object.entries(CRITAIR_TOKENS)) {
    assert.match(css, new RegExp(`--color-critair-${critair}:\\s*${hex};`), `falta --color-critair-${critair}`);
    assert.match(css, new RegExp(`--color-on-critair-${critair}:\\s*#[0-9a-f]{6};`), `falta --color-on-critair-${critair}`);
  }
  assert.doesNotMatch(css, /dgt-/);
});
