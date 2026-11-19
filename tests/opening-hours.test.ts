import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { describeOpeningHours } from '../lib/opening-hours';

function recognizedText(value: string): string {
  const result = describeOpeningHours(value);
  assert.equal(result.recognized, true, `no reconocido: ${value}`);
  return result.text;
}

describe('describeOpeningHours', () => {
  it('24/7', () => {
    assert.equal(recognizedText('24/7'), 'Tous les jours, 24 h/24');
  });

  it('rango de días, tramo y jours fériés', () => {
    assert.equal(
      recognizedText('Mo-Fr 08:00-20:00; PH off'),
      'Du lundi au vendredi, de 8 h à 20 h, sauf jours fériés',
    );
  });

  it('lista de días', () => {
    assert.equal(recognizedText('Mo,We 09:00-12:00'), 'Le lundi et le mercredi, de 9 h à 12 h');
    assert.equal(recognizedText('Mo,We,Fr 09:00-12:00'), 'Le lundi, le mercredi et le vendredi, de 9 h à 12 h');
  });

  it('día suelto', () => {
    assert.equal(recognizedText('Sa 10:00-18:00'), 'Le samedi, de 10 h à 18 h');
  });

  it('varios tramos con minutos', () => {
    assert.equal(
      recognizedText('Mo-Fr 07:00-09:30,17:00-19:00'),
      'Du lundi au vendredi, de 7 h à 9 h 30 et de 17 h à 19 h',
    );
  });

  it('varias reglas', () => {
    assert.equal(
      recognizedText('Mo-Fr 08:00-20:00; Sa 09:00-12:00'),
      'Du lundi au vendredi, de 8 h à 20 h; le samedi, de 9 h à 12 h',
    );
  });

  it('solo tramo y solo días', () => {
    assert.equal(recognizedText('08:00-20:00'), 'Tous les jours, de 8 h à 20 h');
    assert.equal(recognizedText('Mo-Fr'), 'Du lundi au vendredi, 24 h/24');
  });

  it('24/7 con PH off', () => {
    assert.equal(recognizedText('24/7; PH off'), 'Tous les jours, 24 h/24, sauf jours fériés');
  });

  it('cadena no reconocida se devuelve igual', () => {
    for (const value of ['sunrise-sunset', 'Mo-Fr 25:00-26:00', 'Xx 08:00-20:00', '', 'PH off', 'Fr-Mo 08:00-20:00', 'Mo-Fr 08:00-24:30']) {
      assert.deepEqual(describeOpeningHours(value), { text: value, recognized: false });
    }
  });
});
