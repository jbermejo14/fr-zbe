import { CritairInputError, computeCritair } from './critair';
import type { CritairResult, Energy, VehicleInput, VehicleType } from './critair';

/** Tipo de vehículo con el que arrancan la calculadora y el panel. */
export const DEFAULT_VEHICLE_TYPE: VehicleType = 'car';
export const DEFAULT_ENERGY: Energy = 'petrol';

export interface CalculatorEvaluation {
  input: VehicleInput;
  result: CritairResult | null;
  /** Mensaje en francés para mostrar bajo el formulario, o null. */
  errorMessage: string | null;
}

/** ¿Hace falta año o norma? Eléctrico nunca; en deux-roues todo lo demás; en voiture/utilitaire, solo essence y diesel. */
export function calculatorNeedsAge(vehicleType: VehicleType, energy: Energy): boolean {
  if (energy === 'electric_hydrogen') return false;
  if (vehicleType === 'motorcycle') return true;
  return energy === 'petrol' || energy === 'diesel';
}

/** Evalúa el formulario: sin resultado ni error si falta año/norma; con mensaje si el dato es inválido. */
export function calculatorEvaluate(input: VehicleInput, currentYear: number): CalculatorEvaluation {
  const isIncomplete =
    calculatorNeedsAge(input.vehicleType, input.energy) && input.registrationYear === null && input.euroNorm === null;
  if (isIncomplete) return { input, result: null, errorMessage: null };
  try {
    return { input, result: computeCritair(input, currentYear), errorMessage: null };
  } catch (error) {
    // Un dato inválido no es un fallo del programa: se muestra al usuario bajo el formulario.
    if (error instanceof CritairInputError) return { input, result: null, errorMessage: error.message };
    throw error;
  }
}
