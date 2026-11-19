import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CritairBadge, critairBadgeLabel } from '../components/CritairBadge.tsx';
import type { CritairClass } from '../lib/critair.ts';

const NUMBERED_CLASSES: CritairClass[] = ['0', '1', '2', '3', '4', '5'];

for (const critair of NUMBERED_CLASSES) {
  test(`CritairBadge ${critair}: color por token y aria-label`, () => {
    const html = renderToStaticMarkup(<CritairBadge critair={critair} size="md" />);
    assert.match(html, new RegExp(`bg-critair-${critair}(?!\\d)`));
    assert.match(html, new RegExp(`text-on-critair-${critair}(?!\\d)`));
    assert.match(html, new RegExp(`aria-label="Vignette Crit(?:'|&#x27;)Air ${critair}"`));
    assert.match(html, /role="img"/);
  });
}

test('CritairBadge NC: círculo de borde discontinuo con « Non classé » y sin color de vignette', () => {
  const html = renderToStaticMarkup(<CritairBadge critair="NC" size="md" />);
  assert.match(html, /border-dashed/);
  assert.match(html, /aria-label="Non classé"/);
  assert.match(html, /classé/);
  assert.doesNotMatch(html, /bg-critair-/);
});

test('CritairBadge: cada tamaño usa sus propias dimensiones', () => {
  const small = renderToStaticMarkup(<CritairBadge critair="1" size="sm" />);
  const large = renderToStaticMarkup(<CritairBadge critair="1" size="lg" />);
  assert.match(small, /h-11 w-11/);
  assert.match(large, /h-24 w-24/);
});

test('CritairBadge: muestra el número y « Crit\'Air » en la vignette numerada', () => {
  const html = renderToStaticMarkup(<CritairBadge critair="3" size="lg" />);
  assert.match(html, /Crit(?:'|&#x27;)Air/);
  assert.match(html, />3</);
});

test('critairBadgeLabel: etiquetas accesibles', () => {
  assert.equal(critairBadgeLabel('2'), "Vignette Crit'Air 2");
  assert.equal(critairBadgeLabel('NC'), 'Non classé');
});

test('CritairBadge md: dimensiones propias y texto de marca a su tamaño', () => {
  const html = renderToStaticMarkup(<CritairBadge critair="2" size="md" />);
  assert.match(html, /h-16 w-16/);
  assert.match(html, /text-3xl/);
  assert.match(html, /text-\[0\.625rem\]/);
});

const NC_SIZE_EXPECTATIONS: { size: 'sm' | 'md' | 'lg'; box: RegExp; text: RegExp }[] = [
  { size: 'sm', box: /h-11 w-11/, text: /text-\[0\.5rem\]/ },
  { size: 'md', box: /h-16 w-16/, text: /text-\[0\.625rem\]/ },
  { size: 'lg', box: /h-24 w-24/, text: /text-xs/ },
];

for (const { size, box, text } of NC_SIZE_EXPECTATIONS) {
  test(`CritairBadge NC ${size}: dimensiones, texto y borde border-secondary`, () => {
    const html = renderToStaticMarkup(<CritairBadge critair="NC" size={size} />);
    assert.match(html, box);
    assert.match(html, text);
    assert.match(html, /border-secondary/);
    assert.match(html, /border-dashed/);
  });
}
