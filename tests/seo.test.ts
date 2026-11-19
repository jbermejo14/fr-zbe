import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SEO_META_DESCRIPTION_MAX, truncateMetaDescription } from '../lib/seo.ts';

const SEO_ELLIPSIS = '…';

test('truncateMetaDescription: un texto corto queda sin cambios', () => {
  assert.equal(truncateMetaDescription('Texte court.'), 'Texte court.');
  const exact = 'a'.repeat(SEO_META_DESCRIPTION_MAX);
  assert.equal(truncateMetaDescription(exact), exact);
});

test('truncateMetaDescription: un texto largo se corta en palabra, cabe en el máximo y acaba en «…»', () => {
  const text = 'mot '.repeat(SEO_META_DESCRIPTION_MAX).trim();
  const result = truncateMetaDescription(text);
  assert.ok(result.length <= SEO_META_DESCRIPTION_MAX);
  assert.ok(result.endsWith(SEO_ELLIPSIS));
  const words = result.slice(0, -SEO_ELLIPSIS.length).split(' ');
  assert.ok(words.every((word) => word === 'mot'), 'no debe cortar una palabra por la mitad');
});

test('truncateMetaDescription: un texto largo sin espacios se corta al límite', () => {
  const result = truncateMetaDescription('x'.repeat(SEO_META_DESCRIPTION_MAX * 2));
  assert.equal(result.length, SEO_META_DESCRIPTION_MAX);
  assert.ok(result.endsWith(SEO_ELLIPSIS));
});
