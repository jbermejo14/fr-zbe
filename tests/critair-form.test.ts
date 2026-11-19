import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Energy, VehicleInput, VehicleType } from '../lib/critair';
import { DEFAULT_VEHICLE_TYPE, calculatorEvaluate, calculatorNeedsAge } from '../lib/critair-form';

const CURRENT_YEAR = 2026;
const VEHICLE_TYPES: readonly VehicleType[] = ['car', 'van', 'motorcycle'];

function formInput(vehicleType: VehicleType, energy: Energy, registrationYear: number | null = null): VehicleInput {
  return { vehicleType, energy, registrationYear, euroNorm: null };
}

describe('calculatorNeedsAge', () => {
  it('eléctrico no pide año en ningún tipo', () => {
    for (const type of VEHICLE_TYPES) {
      assert.equal(calculatorNeedsAge(type, 'electric_hydrogen'), false);
    }
  });

  it('voiture con hybride rechargeable o gas no pide año', () => {
    assert.equal(calculatorNeedsAge('car', 'plugin_hybrid'), false);
    assert.equal(calculatorNeedsAge('car', 'gas'), false);
  });

  it('voiture con essence o diesel sí; deux-roues con gas sí', () => {
    assert.equal(calculatorNeedsAge('car', 'petrol'), true);
    assert.equal(calculatorNeedsAge('van', 'diesel'), true);
    assert.equal(calculatorNeedsAge('motorcycle', 'gas'), true);
  });
});

describe('calculatorEvaluate', () => {
  it('formulario incompleto: sin resultado ni error', () => {
    const evaluation = calculatorEvaluate(formInput('car', 'petrol'), CURRENT_YEAR);
    assert.equal(evaluation.result, null);
    assert.equal(evaluation.errorMessage, null);
  });

  it('eléctrico da la clase 0 sin año', () => {
    assert.equal(calculatorEvaluate(formInput('car', 'electric_hydrogen'), CURRENT_YEAR).result?.critair, '0');
  });

  it('año válido da resultado', () => {
    const evaluation = calculatorEvaluate(formInput('car', 'petrol', 2015), CURRENT_YEAR);
    assert.ok(evaluation.result);
    assert.equal(evaluation.errorMessage, null);
  });

  it('año fuera de rango: mensaje de error en francés', () => {
    for (const year of [1900, CURRENT_YEAR + 1]) {
      const evaluation = calculatorEvaluate(formInput('car', 'petrol', year), CURRENT_YEAR);
      assert.equal(evaluation.result, null);
      assert.match(evaluation.errorMessage ?? '', /année de première immatriculation doit être comprise entre 1950 et 2026/);
    }
  });
});

describe('DEFAULT_VEHICLE_TYPE', () => {
  it('es voiture', () => {
    assert.equal(DEFAULT_VEHICLE_TYPE, 'car');
  });
});
