'use client';

import React, { useEffect, useId, useMemo, useState } from 'react';
import {
  ENERGY_LABELS,
  FIRST_REGISTRATION_YEAR_MIN,
  VEHICLE_TYPE_LABELS,
  euroNormsFor,
} from '@/lib/critair';
import type { CritairResult, Energy, EuroNorm, VehicleInput, VehicleType } from '@/lib/critair';
import { DEFAULT_ENERGY, DEFAULT_VEHICLE_TYPE, calculatorEvaluate, calculatorNeedsAge } from '@/lib/critair-form';
import { SEO_CURRENT_YEAR } from '@/lib/seo';
import {
  CALCULATOR_FIELD_CLASS,
  CALCULATOR_LABEL_CLASS,
  CalculatorSegment,
  CritairCalculatorAgeFields,
} from './CritairCalculatorAgeFields';
import type { CalculatorAgeMode } from './CritairCalculatorAgeFields';

interface CritairCalculatorProps {
  /**
   * Se llama en cada cambio: con el resultado si el formulario es válido y con null si no.
   * Debe ser estable entre renders (useCallback o un setState).
   */
  onResult: (result: CritairResult | null, input: VehicleInput) => void;
}

const VEHICLE_TYPES: readonly VehicleType[] = ['car', 'van', 'motorcycle'];
const ENERGIES: readonly Energy[] = ['electric_hydrogen', 'petrol', 'diesel', 'plugin_hybrid', 'gas'];
const HYBRID_NOTE = 'Hybride non rechargeable : choisissez Essence ou Diesel';

/** Años desde el actual hasta FIRST_REGISTRATION_YEAR_MIN, del más reciente al más antiguo. */
function calculatorYears(currentYear: number): number[] {
  return Array.from({ length: currentYear - FIRST_REGISTRATION_YEAR_MIN + 1 }, (_, index) => currentYear - index);
}

/**
 * Año actual: arranca con el del build (mismo HTML en servidor y cliente) y se corrige tras la
 * hidratación con el del navegador. Calcularlo en el inicializador de useState lo congelaría
 * en el export estático.
 */
function useCalculatorCurrentYear(): number {
  const [currentYear, setCurrentYear] = useState(SEO_CURRENT_YEAR);
  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);
  return currentYear;
}

/** Formulario de la calculadora Crit'Air. */
export function CritairCalculator({ onResult }: CritairCalculatorProps) {
  const ids = useId();
  const [vehicleType, setVehicleType] = useState<VehicleType>(DEFAULT_VEHICLE_TYPE);
  const [energy, setEnergy] = useState<Energy>(DEFAULT_ENERGY);
  const [ageMode, setAgeMode] = useState<CalculatorAgeMode>('year');
  const [year, setYear] = useState<number | null>(null);
  const [euroNorm, setEuroNorm] = useState<EuroNorm | null>(null);
  const currentYear = useCalculatorCurrentYear();
  const years = useMemo(() => calculatorYears(currentYear), [currentYear]);

  const evaluation = useMemo(
    () =>
      calculatorEvaluate(
        {
          vehicleType,
          energy,
          registrationYear: ageMode === 'year' ? year : null,
          euroNorm: ageMode === 'norm' ? euroNorm : null,
        },
        currentYear,
      ),
    [vehicleType, energy, ageMode, year, euroNorm, currentYear],
  );

  useEffect(() => {
    onResult(evaluation.result, evaluation.input);
  }, [evaluation, onResult]);

  const changeVehicleType = (next: VehicleType) => {
    setVehicleType(next);
    // Una norma válida para voiture (Euro 6) no lo es para deux-roues.
    if (euroNorm !== null && !euroNormsFor(next).includes(euroNorm)) setEuroNorm(null);
  };

  return (
    <form className="card card-compact space-y-4" onSubmit={(event) => event.preventDefault()}>
      <fieldset>
        <legend className={CALCULATOR_LABEL_CLASS}>Type de véhicule</legend>
        <div className="flex gap-2">
          {VEHICLE_TYPES.map((type) => (
            <CalculatorSegment
              key={type}
              pressed={type === vehicleType}
              label={VEHICLE_TYPE_LABELS[type]}
              onClick={() => changeVehicleType(type)}
            />
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor={`${ids}-energy`} className={CALCULATOR_LABEL_CLASS}>Énergie</label>
        <select
          id={`${ids}-energy`}
          value={energy}
          onChange={(event) => setEnergy(event.target.value as Energy)}
          className={CALCULATOR_FIELD_CLASS}
        >
          {ENERGIES.map((value) => (
            <option key={value} value={value}>{ENERGY_LABELS[value]}</option>
          ))}
        </select>
        <p className="mt-1 text-xs text-muted">{HYBRID_NOTE}</p>
      </div>

      {calculatorNeedsAge(vehicleType, energy) && (
        <CritairCalculatorAgeFields
          vehicleType={vehicleType}
          ageMode={ageMode}
          onAgeModeChange={setAgeMode}
          years={years}
          year={year}
          onYearChange={setYear}
          euroNorm={euroNorm}
          onEuroNormChange={setEuroNorm}
        />
      )}

      {evaluation.errorMessage !== null && (
        <p role="alert" className="text-sm font-semibold text-negative">{evaluation.errorMessage}</p>
      )}
    </form>
  );
}
