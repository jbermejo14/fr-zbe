import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CritairInputError,
  computeCritair,
  critairLabel,
  euroNormsFor,
  type CritairClass,
  type Energy,
  type EuroNorm,
  type VehicleType,
} from '../lib/critair';

const CURRENT_YEAR = 2026;

function byYear(vehicleType: VehicleType, energy: Energy, year: number) {
  return computeCritair({ vehicleType, energy, registrationYear: year, euroNorm: null }, CURRENT_YEAR);
}

function byNorm(vehicleType: VehicleType, energy: Energy, euroNorm: EuroNorm) {
  return computeCritair({ vehicleType, energy, registrationYear: null, euroNorm }, CURRENT_YEAR);
}

describe('computeCritair: energías sin año', () => {
  it('eléctrico es 0 y gas / hybride rechargeable son 1 sin año ni norma', () => {
    const none = { registrationYear: null, euroNorm: null };
    assert.equal(computeCritair({ vehicleType: 'car', energy: 'electric_hydrogen', ...none }, CURRENT_YEAR).critair, '0');
    assert.equal(computeCritair({ vehicleType: 'van', energy: 'plugin_hybrid', ...none }, CURRENT_YEAR).critair, '1');
    assert.equal(computeCritair({ vehicleType: 'car', energy: 'gas', ...none }, CURRENT_YEAR).critair, '1');
    assert.equal(computeCritair({ vehicleType: 'motorcycle', energy: 'electric_hydrogen', ...none }, CURRENT_YEAR).critair, '0');
  });
});

describe('computeCritair: VP y VUL por año', () => {
  const cases: [Energy, number, CritairClass][] = [
    ['petrol', 2011, '1'], ['petrol', 2010, '2'], ['petrol', 2006, '2'], ['petrol', 2005, '3'],
    ['petrol', 1997, '3'], ['petrol', 1996, 'NC'],
    ['diesel', 2011, '2'], ['diesel', 2010, '3'], ['diesel', 2006, '3'], ['diesel', 2005, '4'],
    ['diesel', 2001, '4'], ['diesel', 2000, '5'], ['diesel', 1997, '5'], ['diesel', 1996, 'NC'],
  ];
  for (const [energy, year, expected] of cases) {
    it(`voiture ${energy} ${year} → ${expected}`, () => {
      const result = byYear('car', energy, year);
      assert.equal(result.critair, expected);
      assert.equal(result.borderlineNote, null);
    });
  }

  it('utilitaire usa la misma tabla fuera de 1997', () => {
    assert.equal(byYear('van', 'diesel', 2005).critair, '4');
    assert.equal(byYear('van', 'petrol', 1998).critair, '3');
    assert.equal(byYear('van', 'diesel', 1996).critair, 'NC');
  });

  it('utilitaire de 1997 sin norma es NC con nota', () => {
    for (const energy of ['petrol', 'diesel'] as const) {
      const result = byYear('van', energy, 1997);
      assert.equal(result.critair, 'NC');
      assert.match(result.borderlineNote ?? '', /1er octobre 1997/);
    }
  });

  it('ruleLabel describe la regla', () => {
    assert.equal(byYear('car', 'diesel', 2008).ruleLabel, 'Diesel (2006-2010)');
  });
});

describe('computeCritair: VP y VUL por norma Euro', () => {
  const cases: [Energy, EuroNorm, CritairClass][] = [
    ['petrol', 'euro6', '1'], ['petrol', 'euro5', '1'], ['petrol', 'euro4', '2'], ['petrol', 'euro3', '3'],
    ['petrol', 'euro2', '3'], ['petrol', 'euro1', 'NC'],
    ['diesel', 'euro6', '2'], ['diesel', 'euro5', '2'], ['diesel', 'euro4', '3'], ['diesel', 'euro3', '4'],
    ['diesel', 'euro2', '5'], ['diesel', 'euro1', 'NC'],
  ];
  for (const [energy, norm, expected] of cases) {
    it(`${energy} ${norm} → ${expected}`, () => {
      assert.equal(byNorm('car', energy, norm).critair, expected);
    });
  }

  it('la norma prevalece sobre el año', () => {
    const result = computeCritair(
      { vehicleType: 'van', energy: 'diesel', registrationYear: 1997, euroNorm: 'euro5' },
      CURRENT_YEAR,
    );
    assert.equal(result.critair, '2');
    assert.equal(result.borderlineNote, null);
    assert.equal(result.ruleLabel, 'Diesel Euro 5');
  });
});

describe('computeCritair: deux-roues', () => {
  const yearCases: [number, CritairClass, boolean][] = [
    [2017, '1', false], [2016, '2', false], [2007, '2', false], [2006, '3', false], [2005, '3', false],
    [2004, '4', true], [2003, '4', false], [2001, '4', false], [2000, 'NC', true], [1999, 'NC', false],
  ];
  for (const [year, expected, hasNote] of yearCases) {
    it(`moto thermique ${year} → ${expected}`, () => {
      const result = byYear('motorcycle', 'petrol', year);
      assert.equal(result.critair, expected);
      assert.equal(result.borderlineNote !== null, hasNote);
    });
  }

  it('diesel, gas y hybride se tratan como térmicos', () => {
    assert.equal(byYear('motorcycle', 'diesel', 2018).critair, '1');
    assert.equal(byYear('motorcycle', 'gas', 2010).critair, '2');
    assert.equal(byYear('motorcycle', 'plugin_hybrid', 2010).critair, '2');
  });

  it('por norma', () => {
    assert.equal(byNorm('motorcycle', 'petrol', 'euro5').critair, '1');
    assert.equal(byNorm('motorcycle', 'petrol', 'euro4').critair, '1');
    assert.equal(byNorm('motorcycle', 'petrol', 'euro3').critair, '2');
    assert.equal(byNorm('motorcycle', 'petrol', 'euro2').critair, '3');
    assert.equal(byNorm('motorcycle', 'petrol', 'euro1').critair, '4');
  });

  it('la norma prevalece sobre el año', () => {
    const result = computeCritair(
      { vehicleType: 'motorcycle', energy: 'petrol', registrationYear: 2004, euroNorm: 'euro4' },
      CURRENT_YEAR,
    );
    assert.equal(result.critair, '1');
    assert.equal(result.borderlineNote, null);
    assert.equal(result.ruleLabel, 'Deux-roues thermique Euro 4');
  });

  it('gas sin año ni norma pide datos', () => {
    assert.throws(
      () => computeCritair({ vehicleType: 'motorcycle', energy: 'gas', registrationYear: null, euroNorm: null }, CURRENT_YEAR),
      CritairInputError,
    );
  });
});

describe('computeCritair: errores', () => {
  it('sin año ni norma en essence', () => {
    assert.throws(
      () => computeCritair({ vehicleType: 'car', energy: 'petrol', registrationYear: null, euroNorm: null }, CURRENT_YEAR),
      CritairInputError,
    );
  });

  it('año fuera de rango', () => {
    assert.throws(() => byYear('car', 'petrol', 1949), CritairInputError);
    assert.throws(() => byYear('car', 'petrol', CURRENT_YEAR + 1), CritairInputError);
    assert.equal(byYear('car', 'petrol', CURRENT_YEAR).critair, '1');
    assert.equal(byYear('car', 'petrol', 1950).critair, 'NC');
  });

  it('año no entero', () => {
    assert.throws(() => byYear('car', 'petrol', 2010.5), CritairInputError);
    assert.throws(() => byYear('motorcycle', 'petrol', Number.NaN), CritairInputError);
  });

  it('norma no válida para el tipo', () => {
    assert.throws(() => byNorm('motorcycle', 'petrol', 'euro6'), CritairInputError);
  });
});

describe('utilidades', () => {
  it('euroNormsFor', () => {
    assert.equal(euroNormsFor('car').length, 6);
    assert.deepEqual(euroNormsFor('motorcycle'), ['euro1', 'euro2', 'euro3', 'euro4', 'euro5']);
  });

  it('critairLabel', () => {
    assert.equal(critairLabel('0'), "Crit'Air 0");
    assert.equal(critairLabel('NC'), 'Non classé');
  });
});
