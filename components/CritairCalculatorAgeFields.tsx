import React from 'react';
import { EURO_NORM_LABELS, euroNormsFor } from '@/lib/critair';
import type { EuroNorm, VehicleType } from '@/lib/critair';

export type CalculatorAgeMode = 'year' | 'norm';

export const CALCULATOR_FIELD_CLASS =
  'w-full min-h-11 rounded border border-line bg-elevated px-3 text-sm text-fg focus:border-accent focus:outline-none';
export const CALCULATOR_LABEL_CLASS = 'mb-1 block text-xs font-semibold text-secondary';

const SEGMENT_BASE_CLASS = 'min-h-11 flex-1 rounded border px-3 text-sm font-semibold transition-colors';
const SEGMENT_ON_CLASS = 'border-btn bg-btn text-on-btn';
const SEGMENT_OFF_CLASS = 'border-line bg-elevated text-secondary hover:text-fg hover:border-line-hover';

const AGE_MODES: readonly { mode: CalculatorAgeMode; label: string }[] = [
  { mode: 'year', label: 'Année' },
  { mode: 'norm', label: 'Norme Euro' },
];

/** Botón tipo segmento con `aria-pressed`, común a los selectores de la calculadora. */
export function CalculatorSegment(props: { pressed: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={props.pressed}
      onClick={props.onClick}
      className={`${SEGMENT_BASE_CLASS} ${props.pressed ? SEGMENT_ON_CLASS : SEGMENT_OFF_CLASS}`}
    >
      {props.label}
    </button>
  );
}

interface CritairCalculatorAgeFieldsProps {
  vehicleType: VehicleType;
  ageMode: CalculatorAgeMode;
  onAgeModeChange: (mode: CalculatorAgeMode) => void;
  /** Años elegibles, del más reciente al más antiguo. */
  years: readonly number[];
  year: number | null;
  onYearChange: (year: number | null) => void;
  euroNorm: EuroNorm | null;
  onEuroNormChange: (norm: EuroNorm | null) => void;
}

/** Campos « Je connais : » año de matriculación o norma Euro. */
export function CritairCalculatorAgeFields(props: CritairCalculatorAgeFieldsProps) {
  return (
    <fieldset>
      <legend className={CALCULATOR_LABEL_CLASS}>Je connais :</legend>
      <div className="mb-2 flex gap-2">
        {AGE_MODES.map(({ mode, label }) => (
          <CalculatorSegment
            key={mode}
            pressed={mode === props.ageMode}
            label={label}
            onClick={() => props.onAgeModeChange(mode)}
          />
        ))}
      </div>
      {props.ageMode === 'year' ? (
        <select
          aria-label="Année de première immatriculation"
          value={props.year ?? ''}
          onChange={(event) => props.onYearChange(event.target.value === '' ? null : Number(event.target.value))}
          className={CALCULATOR_FIELD_CLASS}
        >
          <option value="">Choisissez l&apos;année</option>
          {props.years.map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
      ) : (
        <select
          aria-label="Norme Euro"
          value={props.euroNorm ?? ''}
          onChange={(event) =>
            props.onEuroNormChange(event.target.value === '' ? null : (event.target.value as EuroNorm))
          }
          className={CALCULATOR_FIELD_CLASS}
        >
          <option value="">Choisissez la norme</option>
          {euroNormsFor(props.vehicleType).map((norm) => (
            <option key={norm} value={norm}>{EURO_NORM_LABELS[norm]}</option>
          ))}
        </select>
      )}
    </fieldset>
  );
}
